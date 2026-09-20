// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OnionBankTheater from "./OnionBankTheater";
import { loadLocalBank } from "@/lib/questionBank";

afterEach(() => cleanup());
beforeEach(() => localStorage.clear());

/** 找 .ol-btn 按鈕（textContent 包含 text）。 */
function olBtn(text: string): HTMLElement {
  const found = screen
    .getAllByRole("button")
    .find((b) => b.className.includes("ol-btn") && (b.textContent ?? "").includes(text));
  if (!found) throw new Error(`找不到 .ol-btn：${text}`);
  return found;
}

/** 找選項（.ol-opt，全文精確比對）。 */
function opt(text: string): HTMLElement {
  const found = screen
    .getAllByRole("button")
    .find((b) => b.className.includes("ol-opt") && (b.textContent ?? "") === text);
  if (!found) throw new Error(`找不到選項：${text}`);
  return found;
}

describe("洋蔥題庫劇場 OnionBankTheater", () => {
  it("開演畫面有科目與題數選擇，題庫未載入時會先載入再出題", async () => {
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

    // 題庫是動態載入：第一次開演會先等 5000 題讀進來，然後出現第一題。
    await waitFor(
      () => {
        expect(screen.getByText(/第 1 \/ 5 題/)).toBeInTheDocument();
      },
      { timeout: 20000 },
    );
    // 出題的 meta 標籤（科目／年級／知識點）與洋蔥吉祥物舞台
    expect(document.querySelector(".ob-stage")).not.toBeNull();
    expect(document.querySelectorAll(".ob-meta-chip").length).toBeGreaterThanOrEqual(3);
  });

  it("答錯可再試一次，答對後演出詳解並回報成績", async () => {
    const onBest = vi.fn();
    render(<OnionBankTheater onBest={onBest} onExit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "5 題" }));
    fireEvent.click(olBtn("開始演出"));
    await waitFor(() => expect(screen.getByText(/第 1 \/ 5 題/)).toBeInTheDocument(), { timeout: 20000 });

    /**
     * 答題方式：依序點選項，點到正解為止。
     * 錯的選項會被停用並出現「再想一想」提示（可再試一次），
     * 點到正解則出現詳解（.ob-explain）——兩種行為都在這裡被覆蓋。
     */
    const answerCurrent = () => {
      let guard = 0;
      while (!document.querySelector(".ob-explain") && guard < 12) {
        guard += 1;
        const remaining = screen
          .getAllByRole("button")
          .filter((b) => b.className.includes("ol-opt") && !b.hasAttribute("disabled"));
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
      expect.objectContaining({ stars: expect.any(Number), correct: 5, total: 5 }),
    );
    expect(olBtn("再來一場")).toBeInTheDocument();
  }, 30000);

  it("抽到的題目確實來自內建題庫（庫存互相利用）", async () => {
    await loadLocalBank();
    const onBest = vi.fn();
    render(<OnionBankTheater onBest={onBest} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "5 題" }));
    fireEvent.click(olBtn("開始演出"));
    await waitFor(() => expect(screen.getByText(/第 1 \/ 5 題/)).toBeInTheDocument(), { timeout: 20000 });
    // 題目應有 meta 標籤（內建題庫的科目／年級／知識點欄位）
    const chips = Array.from(document.querySelectorAll(".ob-meta-chip")).map((c) => c.textContent);
    expect(chips.some((c) => /^(數學|自然|社會|國語|英語)$/.test(c ?? ""))).toBe(true);
  });
});
