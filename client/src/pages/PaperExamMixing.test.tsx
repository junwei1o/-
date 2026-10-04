// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PaperExam from "@/pages/PaperExam";
import { MATCHING_SETS } from "@/lib/matchingBank";
import { ADAPTIVE_STORAGE_KEY } from "@/game/adaptiveLearning";

const setLocation = vi.fn();

const mockQuestions = Array.from({ length: 12 }, (_, i) => ({
  id: `mixing-q${i}`,
  grade: 4 + (i % 2),
  subject: (["國語", "數學", "自然", "社會"] as const)[i % 4],
  difficulty: (["基礎", "標準"] as const)[i % 2],
  learningTopic: `主題${i}`,
  prompt: `題目${i}：哪一個是正確的？`,
  options: ["正確答案", "錯誤選項", "陷阱選項", "干擾選項"],
  answer: 0,
  explanation: `題目${i} 的解析`,
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", setLocation],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    aiTutor: {
      reviewPlan: {
        useMutation: () => ({ isPending: false, error: null, data: undefined, reset: vi.fn(), mutate: vi.fn() }),
      },
    },
    aiCompanion: {
      reflect: {
        useMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({ text: "測試提問？", source: "rule", remaining: 8 }), isPending: false }),
      },
    },
    questionBank: {
      list: {
        useQuery: () => ({ data: { questions: mockQuestions }, isLoading: false, error: null, refetch: vi.fn() }),
      },
    },
  },
}));

vi.mock("@/lib/questionBank", () => ({
  LOCAL_QUESTION_BANK: [],
  LOCAL_ENGLISH_BANK: [],
  useQuestionBank: () => ({
    questions: mockQuestions,
    total: mockQuestions.length,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    source: "server",
    isFallback: false,
  }),
}));

vi.mock("@/lib/paperExamStrategyCue", () => ({
  loadPaperStrategyCueEnabled: () => true,
  playPaperStrategyCue: vi.fn(),
  savePaperStrategyCueEnabled: vi.fn(),
}));

vi.setConfig({ testTimeout: 20000 });

describe("PaperExam 12 選擇＋填空/配對/排序混合試卷", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
    window.localStorage.removeItem(ADAPTIVE_STORAGE_KEY);
    setLocation.mockReset();
  });

  function confirmNextGroupStrategy() {
    fireEvent.click(screen.getByRole("button", { name: "開始本組題目" }));
  }

  function answerCurrentChoice() {
    // 選項順序會被洗牌，但「正確答案」這個文字不會變；點它所在那一格的 radio。
    const option = Array.from(document.querySelectorAll<HTMLElement>(".paper-options label")).find((el) => el.textContent?.includes("正確答案"));
    expect(option).toBeTruthy();
    const optionInput = option?.querySelector<HTMLInputElement>("input[type=radio]");
    expect(optionInput).toBeTruthy();
    fireEvent.click(optionInput as HTMLInputElement);
  }

  /** 填空題：點第一張字卡（不論對錯，作答後即可往下）。 */
  function answerCurrentFill() {
    const card = document.querySelector<HTMLElement>(".cr-fill-card:not(:disabled)");
    expect(card).toBeTruthy();
    fireEvent.click(card as HTMLElement);
  }

  /** 排序題：把待排序項目依畫面順序全部點進序列後確認（不論對錯，完成即可往下）。 */
  function answerCurrentOrder() {
    const poolItems = Array.from(document.querySelectorAll<HTMLElement>(".cr-order-pool .cr-order-item"));
    expect(poolItems.length).toBeGreaterThanOrEqual(3);
    for (const item of poolItems) {
      if (item.style.visibility !== "hidden") fireEvent.click(item);
    }
    fireEvent.click(screen.getByRole("button", { name: "確認順序" }));
  }

  function goNext() {
    fireEvent.click(screen.getByRole("button", { name: /下一題/ }));
  }

  /** 玩完目前內嵌的迷你配對題：依題名找原始組，精確比對文字點擊盤面上的配對，再點結果卡按鈕。 */
  async function playMatching() {
    const title = (document.querySelector(".mg-title")?.textContent ?? "").trim();
    const matchingSet = MATCHING_SETS.find((item) => item.title === title);
    expect(matchingSet).toBeTruthy();
    // 先等盤面渲染完成再開始點：以前直接開點，盤面還沒好就會找不到任何項目。
    await waitFor(() => expect(document.querySelectorAll(".mg-left .mg-item").length).toBeGreaterThan(0), {
      timeout: 10000,
      interval: 25,
    });
    const findItem = (selector: string, text: string) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).find((el) =>
        Array.from(el.querySelectorAll("span")).some(
          (span) => !span.classList.contains("mg-badge") && !span.classList.contains("mg-mark") && span.textContent?.trim() === text,
        ),
      ) as HTMLElement | undefined;
    // ⚠️ 盤面是 `sliceMatchingSet` 從整組裁出來的**隨機子集**（試卷內嵌的是迷你盤），
    // 所以 `matchingSet.pairs` 會包含「根本不在盤上」的配對——找不到是正常的，不是漏點。
    // （2026-10-04：一度把「找不到」當成漏點而加了斷言，每次固定誤報 2 對，才發現這件事。）
    // 因此這裡只點「找得到的」；盤上的配對若真沒被點完，下面的 waitFor 會逾時——那才是真的漏點。
    for (const pair of matchingSet!.pairs) {
      const left = findItem(".mg-left .mg-item", pair.l);
      const right = findItem(".mg-right .mg-item", pair.r);
      if (left && right) {
        fireEvent.click(left);
        fireEvent.click(right);
      }
    }
    // 最後一對配對成功後，元件還會等 420ms 才呼叫 onComplete（見 MatchingGame.tsx:325），
    // 父層收到後才把 MatchingGame 換成「配對題完成卡」。
    // ⚠️ 逾時給寬一點：CI 上 189 個測試檔並行搶 CPU，原本的 6 秒曾經不夠而偶發紅燈
    // （2026-10-04 實測：同一版程式本地連跑 5 次全過、CI 卻在這一行的 6 秒逾時失敗）。
    await waitFor(() => expect(document.querySelector(".paper-matching-done")).toBeTruthy(), { timeout: 20000, interval: 50 });
    fireEvent.click(screen.getByRole("button", { name: /下一題|查看結果總結/ }));
    expect(document.querySelectorAll(".paper-matching-summary-row")).toBeTruthy();
  }

  it("平常試卷＝12 選擇＋第 5 填空、第 10 配對、第 15 排序；配對不進選擇計分", async () => {
    render(<PaperExam />);
    fireEvent.click(screen.getByRole("button", { name: /開始今日試卷/ }));
    confirmNextGroupStrategy();

    expect(screen.getByText("第 1 / 15 題")).toBeInTheDocument();
    expect(screen.getByTestId("paper-question-timer")).toBeTruthy();
    const gauge = screen.getByRole("progressbar", { name: "玉山高度計" });
    // 選擇計分含 12 選擇＋填空＋排序＝14 題（配對獨立計星）。
    expect(gauge).toHaveAttribute("aria-valuemax", "14");

    // 前 4 題選擇
    for (let i = 0; i < 4; i += 1) {
      answerCurrentChoice();
      goNext();
    }
    // 第 5 題：填空選字（一樣有 30 秒倒數）
    expect(screen.getByText("第 5 / 15 題")).toBeInTheDocument();
    expect(document.querySelector(".cr-fill-card")).toBeTruthy();
    expect(screen.getByTestId("paper-question-timer")).toBeTruthy();
    answerCurrentFill();
    goNext();

    // 6–9 選擇，第 10 題配對
    for (let i = 0; i < 4; i += 1) {
      answerCurrentChoice();
      goNext();
    }
    expect(screen.getByText("第 10 / 15 題")).toBeInTheDocument();
    expect(document.querySelector(".matching-game")).toBeTruthy();
    expect(screen.queryByTestId("paper-question-timer")).not.toBeInTheDocument();
    await playMatching();

    // 11–14 選擇，第 15 題排序（收尾）
    for (let i = 0; i < 4; i += 1) {
      answerCurrentChoice();
      goNext();
    }
    expect(screen.getByText("第 15 / 15 題")).toBeInTheDocument();
    expect(document.querySelector(".cr-order-pool")).toBeTruthy();
    expect(screen.getByTestId("paper-question-timer")).toBeTruthy();
    answerCurrentOrder();
    fireEvent.click(screen.getByRole("button", { name: /查看結果總結/ }));

    // 總結：選擇計分 14 題（12 選擇＋填空＋排序），配對成績獨立成 1 張卡
    expect(screen.getByRole("heading", { name: "學習成果總結" })).toBeInTheDocument();
    expect(document.querySelectorAll(".paper-matching-summary-row")).toHaveLength(1);
    // 填空與排序在測試中只確保「有作答」，答對數可能是 13 或 14；總題數固定 14。
    expect(screen.getByLabelText("試卷統計")).toHaveTextContent(/\d+ \/ 14/);
  });

  it("選擇/是非題顯示 30 秒倒數；時間到自動記為未作答並顯示正確答案", () => {
    vi.useFakeTimers();
    try {
      render(<PaperExam />);
      fireEvent.click(screen.getByRole("button", { name: /開始今日試卷/ }));
      confirmNextGroupStrategy();

      const timer = screen.getByTestId("paper-question-timer");
      expect(timer).toHaveTextContent("30");
      expect(timer.getAttribute("role")).toBe("timer");

      act(() => vi.advanceTimersByTime(31_000));

      expect(screen.getByText("時間到！")).toBeInTheDocument();
      expect(screen.getByText("正確答案：")).toBeInTheDocument();
      const next = screen.getByRole("button", { name: /下一題/ });
      expect((next as HTMLButtonElement).disabled).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
