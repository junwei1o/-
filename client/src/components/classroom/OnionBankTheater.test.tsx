// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OnionBankTheater from "./OnionBankTheater";
import { loadLocalBank } from "@/lib/questionBank";

// 預設沿用真實的 buildTheaterDeck（難度梯度測試照常用）；
// 「連錯三次」測試再以 mockReturnValueOnce 注入正解固定在最後的題目，確保可重現。
vi.mock("@/lib/classroomBank", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/classroomBank")>();
  return { ...actual, buildTheaterDeck: vi.fn(actual.buildTheaterDeck) };
});
import { buildTheaterDeck, type ClassroomChoice } from "@/lib/classroomBank";
const mockedDeck = vi.mocked(buildTheaterDeck);

afterEach(() => {
  cleanup();
  mockedDeck.mockClear();
});
beforeEach(() => localStorage.clear());

/** 找 .ol-btn 按鈕（textContent 包含 text）。 */
function olBtn(text: string): HTMLElement {
  const found = screen
    .getAllByRole("button")
    .find((b) => b.className.includes("ol-btn") && (b.textContent ?? "").includes(text));
  if (!found) throw new Error(`找不到 .ol-btn：${text}`);
  return found;
}

/** 目前還能點的選項（.ol-opt，未停用）。 */
function liveOptions(): HTMLElement[] {
  return screen
    .getAllByRole("button")
    .filter((b) => b.className.includes("ol-opt") && !b.hasAttribute("disabled"));
}

/** 開演：選題數→開始演出→（學習地圖）開始答題，並等待第一題出現。 */
async function startShow(countLabel = "5 題") {
  fireEvent.click(screen.getByRole("button", { name: countLabel }));
  fireEvent.click(olBtn("開始演出"));
  // 開演先進入「本場學習地圖」（其專屬標籤），再進入答題。
  await waitFor(() => expect(screen.getByText("本場學習地圖")).toBeInTheDocument(), {
    timeout: 20000,
  });
  expect(document.querySelectorAll(".ob-brief-topic").length).toBeGreaterThan(0);
  fireEvent.click(olBtn("開始答題"));
  await waitFor(
    () => {
      expect(screen.getByText(/第 1 \/ 5 題/)).toBeInTheDocument();
    },
    { timeout: 20000 },
  );
}

/** 正解固定在最後一個選項的題目（前三個都是錯選項），用於穩定觸發三級提示。 */
function fixedDeck(n: number): ClassroomChoice[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `fix-${i + 1}`,
    subject: "數學",
    grade: 5,
    difficulty: "標準",
    learningTopic: "固定測試單元",
    prompt: `固定題第 ${i + 1} 題：1 ＋ 1 等於多少？`,
    options: ["3", "1", "0", "2"],
    answer: 3,
    explanation: "1 ＋ 1 ＝ 2，所以正解是最後一個選項。",
    knowledge: ["加法", "基礎運算"],
  }));
}

describe("洋蔥題庫劇場 OnionBankTheater", () => {
  it("開演畫面有科目與題數選擇，題庫未載入時會先載入，並先給學習地圖再出題", async () => {
    const onBest = vi.fn();
    const onExit = vi.fn();
    render(<OnionBankTheater onBest={onBest} onExit={onExit} />);

    expect(screen.getByText("五千題庫存，每次開演都不同")).toBeInTheDocument();
    for (const subject of ["全部", "數學", "自然", "社會", "國語", "英語"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${subject}`) })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "5 題" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "5 題" }));
    fireEvent.click(olBtn("開始演出"));

    // 題庫動態載入後先進入學習地圖（列出本場學習主題）。
    await waitFor(() => expect(screen.getByText("本場學習地圖")).toBeInTheDocument(), { timeout: 20000 });
    expect(document.querySelectorAll(".ob-brief-topic").length).toBeGreaterThan(0);

    fireEvent.click(olBtn("開始答題"));
    await waitFor(() => expect(screen.getByText(/第 1 \/ 5 題/)).toBeInTheDocument(), { timeout: 20000 });
    // 出題的 meta 標籤（科目／年級／難度／知識點）與洋蔥吉祥物舞台
    expect(document.querySelector(".ob-stage")).not.toBeNull();
    expect(document.querySelectorAll(".ob-meta-chip").length).toBeGreaterThanOrEqual(3);
    expect(document.querySelector(".ob-diff")).not.toBeNull();
  });

  it("答錯先給分層提示、第三次公布答案，答對後演出詳解並回報成績", async () => {
    const onBest = vi.fn();
    render(<OnionBankTheater onBest={onBest} onExit={vi.fn()} />);
    await startShow();

    /**
     * 答題方式：依序點選項，直到詳解出現。
     * 前兩次點錯會出現分級提示（提示一／提示二），第三次仍錯則公布正解並給詳解；
     * 若中途點對則直接給詳解。
     */
    const answerCurrent = () => {
      let guard = 0;
      while (!document.querySelector(".ob-explain") && guard < 12) {
        guard += 1;
        const remaining = liveOptions();
        if (remaining.length === 0) break;
        fireEvent.click(remaining[0]);
      }
      expect(document.querySelector(".ob-explain")).not.toBeNull();
    };

    for (let round = 0; round < 5; round += 1) {
      answerCurrent();
      const next = screen
        .getAllByRole("button")
        .find((b) => b.className.includes("ol-btn") && /下一題|看結果/.test(b.textContent ?? ""));
      if (!next) throw new Error(`第 ${round + 1} 題找不到下一題按鈕`);
      fireEvent.click(next);
    }

    // 謝幕：計分正確、回報成績、可以再開一場
    await waitFor(() => expect(screen.getByText(/題答對/)).toBeInTheDocument(), { timeout: 5000 });
    expect(onBest).toHaveBeenCalledWith(
      expect.objectContaining({ stars: expect.any(Number), correct: expect.any(Number), total: 5 }),
    );
    expect(olBtn("再來一場")).toBeInTheDocument();
  }, 30000);

  it("連錯三次依序給提示一、提示二再公布答案，並在謝幕做錯題回顧", async () => {
    mockedDeck.mockReturnValueOnce(fixedDeck(5));
    const onBest = vi.fn();
    render(<OnionBankTheater onBest={onBest} onExit={vi.fn()} />);
    await startShow();

    // 第一題正解在最後：第一次錯給「提示一」。
    fireEvent.click(liveOptions()[0]);
    await waitFor(() => expect(document.querySelector(".ob-hint--l1")).not.toBeNull());
    expect(screen.getByText(/提示一/)).toBeInTheDocument();
    // 第二次錯給「提示二」。
    fireEvent.click(liveOptions()[0]);
    await waitFor(() => expect(document.querySelector(".ob-hint--l2")).not.toBeNull());
    expect(screen.getByText(/提示二/)).toBeInTheDocument();
    // 第三次錯公布正解、進入詳解，話術與「自己答對」不同。
    fireEvent.click(liveOptions()[0]);
    await waitFor(() => expect(document.querySelector(".ob-explain")).not.toBeNull());
    expect(screen.getByText(/別灰心，洋蔥把這題演給你看/)).toBeInTheDocument();
    expect(screen.getByText(/知識點：加法/)).toBeInTheDocument();
    fireEvent.click(olBtn("下一題"));

    // 剩下四題同樣把三個錯選項點完（每題都會被公布答案）。
    for (let round = 1; round < 5; round += 1) {
      await waitFor(() => expect(screen.getByText(new RegExp(`第 ${round + 1} \\/ 5 題`))).toBeInTheDocument(), {
        timeout: 5000,
      });
      let g = 0;
      while (!document.querySelector(".ob-explain") && g < 6) {
        g += 1;
        const remaining = liveOptions();
        if (remaining.length === 0) break;
        fireEvent.click(remaining[0]);
      }
      const btn = screen
        .getAllByRole("button")
        .find((b) => b.className.includes("ol-btn") && /下一題|看結果/.test(b.textContent ?? ""));
      if (btn) fireEvent.click(btn);
    }

    await waitFor(() => expect(screen.getByText(/題答對/)).toBeInTheDocument(), { timeout: 5000 });
    // 五題皆被公布答案，應出現錯題回顧區塊並列出 5 題。
    await waitFor(() => expect(document.querySelector(".ob-review")).not.toBeNull(), { timeout: 3000 });
    expect(document.querySelectorAll(".ob-review-item").length).toBe(5);
    expect(onBest).toHaveBeenCalledWith(expect.objectContaining({ correct: 0, total: 5 }));
  }, 30000);

  it("抽到的題目確實來自內建題庫（庫存互相利用）", async () => {
    await loadLocalBank();
    const onBest = vi.fn();
    render(<OnionBankTheater onBest={onBest} onExit={vi.fn()} />);
    await startShow();
    // 題目應有 meta 標籤（內建題庫的科目／年級／難度欄位）
    const chips = Array.from(document.querySelectorAll(".ob-meta-chip")).map((c) => c.textContent);
    expect(chips.some((c) => /^(數學|自然|社會|國語|英語)$/.test(c ?? ""))).toBe(true);
  }, 30000);
});

describe("buildTheaterDeck 難度梯度組卷", () => {
  it("依基礎→標準→挑戰由淺到深排序，且帶有知識點", async () => {
    await loadLocalBank();
    const deck = buildTheaterDeck(15, "綜合");
    expect(deck).toHaveLength(15);
    const rank: Record<string, number> = { 基礎: 0, 標準: 1, 挑戰: 2 };
    const ranks = deck.map((q) => rank[q.difficulty] ?? 1);
    // 難度序列應非遞減（由淺到深）。
    for (let i = 1; i < ranks.length; i += 1) {
      expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
    }
    // 絕大多數題目應帶知識點（內建題庫 knowledge 全有）。
    expect(deck.filter((q) => Array.isArray(q.knowledge) && (q.knowledge?.length ?? 0) > 0).length).toBeGreaterThan(10);
  });

  it("指定科目時整卷都屬於該科目，題數可如數供給", async () => {
    await loadLocalBank();
    const deck = buildTheaterDeck(10, "數學");
    expect(deck).toHaveLength(10);
    expect(deck.every((q) => q.subject === "數學")).toBe(true);
  });
});
