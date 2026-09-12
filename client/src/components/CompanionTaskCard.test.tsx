// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { CompanionTaskCard } from "./CompanionTaskCard";

const trpcMocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(async () => ({
    taskType: "single" as const,
    subject: "數學",
    reason: "數學：分數 正確率 50%",
    title: "鞏固分數基礎",
    questions: [
      { prompt: "1/2 + 1/4 = ?", options: ["1/4", "2/6", "3/4", "1"], answer: 2, topic: "分數", difficulty: "基礎" as const },
      { prompt: "3/5 是大於還是小於 1/2？", options: ["大於", "小於", "相等", "無法比較"], answer: 0, topic: "分數", difficulty: "標準" as const },
      { prompt: "1/3 + 1/6 = ?", options: ["1/4", "1/2", "2/9", "3/6"], answer: 1, topic: "分數", difficulty: "挑戰" as const },
    ],
    mastery: { totalQuestions: 30, subjectCorrectRate: { 數學: 0.5 }, integratedCorrectRate: null, weakTopics: [] },
  })),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    aiTutor: {
      delegateTask: { useMutation: () => ({ mutateAsync: trpcMocks.mutateAsync, isPending: false, isError: false, error: null }) },
    },
  },
}));

vi.mock("wouter", () => ({
  useLocation: () => [vi.fn(), vi.fn()] as const,
}));

// Spy 掉 storage 的寫入函式，避免 module-level state 在測試間串
const storageMocks = vi.hoisted(() => ({
  addLearningRecord: vi.fn(),
  updatePlayerData: vi.fn(),
  getPlayerData: vi.fn(() => ({
    level: 1, exp: 0, expToNextLevel: 100, gold: 0, totalAnswers: 0, badges: [], unlockedSubjects: [],
  })),
}));

vi.mock("@/utils/storage", async () => {
  const actual = await vi.importActual<typeof import("@/utils/storage")>("@/utils/storage");
  return {
    ...actual,
    addLearningRecord: storageMocks.addLearningRecord,
    updatePlayerData: storageMocks.updatePlayerData,
    getPlayerData: storageMocks.getPlayerData,
  };
});

beforeEach(() => {
  storageMocks.addLearningRecord.mockClear();
  storageMocks.updatePlayerData.mockClear();
  storageMocks.getPlayerData.mockClear();
  storageMocks.getPlayerData.mockReturnValue({
    level: 1, exp: 0, expToNextLevel: 100, gold: 0, totalAnswers: 0, badges: [], unlockedSubjects: [],
  });
  trpcMocks.mutateAsync.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("CompanionTaskCard 學伴主動委派", () => {
  it("未取得任務前顯示 CTA 按鈕", () => {
    render(<CompanionTaskCard studentName="小晴" />);
    expect(screen.getByRole("button", { name: /讓學伴派今日任務/ })).toBeInTheDocument();
  });

  it("點擊按鈕會呼叫 delegateTask mutation 並渲染任務卡", async () => {
    render(<CompanionTaskCard studentName="小晴" />);
    fireEvent.click(screen.getByRole("button", { name: /讓學伴派今日任務/ }));

    await waitFor(() => {
      expect(trpcMocks.mutateAsync).toHaveBeenCalledWith({ studentName: "小晴" });
    });
    expect(screen.getByText("鞏固分數基礎")).toBeInTheDocument();
    expect(screen.getByText(/1\/2 \+ 1\/4/)).toBeInTheDocument();
    expect(screen.getByText(/數學：分數 正確率 50%/)).toBeInTheDocument();
  });

  it("展開題目後可選擇選項並標記對錯", async () => {
    render(<CompanionTaskCard studentName="小晴" />);
    fireEvent.click(screen.getByRole("button", { name: /讓學伴派今日任務/ }));

    await waitFor(() => expect(screen.getByText("鞏固分數基礎")).toBeInTheDocument());

    const firstQuestion = screen.getByText(/1\/2 \+ 1\/4/).closest("li")!;
    fireEvent.click(within(firstQuestion).getByText("3/4"));

    expect(within(firstQuestion).getByText("✓ 答對！")).toBeInTheDocument();
  });

  it("全部作答完顯示本輪結果面板、金幣+經驗+學習記錄落地", async () => {
    const { container } = render(<CompanionTaskCard studentName="小晴" />);
    fireEvent.click(screen.getByRole("button", { name: /讓學伴派今日任務/ }));

    await waitFor(() => expect(screen.getByText("鞏固分數基礎")).toBeInTheDocument());

    // 3 題：Q1 對（基礎 +6/+5）、Q2 錯（標準）、Q3 對（挑戰 +20/+18）
    const questions = container.querySelectorAll(".companion-task-question") as NodeListOf<HTMLElement>;
    fireEvent.click(within(questions[0]).getByText("3/4")); // Q1 對
    fireEvent.click(within(questions[1]).getByText("小於")); // Q2 錯
    fireEvent.click(within(questions[2]).getByText("1/2")); // Q3 對

    // 結果面板：2/3，正確率 67%
    await waitFor(() => expect(screen.getByText(/本輪結果 · 正確率 67%/)).toBeInTheDocument());

    // 金幣+經驗顯示（基礎 6 + 挑戰 20 = 26 金幣；基礎 5 + 挑戰 18 = 23 exp）
    expect(screen.getByText("+26 金幣")).toBeInTheDocument();
    expect(screen.getByText("+23 經驗")).toBeInTheDocument();

    // 學習記錄：addLearningRecord 被呼叫 3 次
    expect(storageMocks.addLearningRecord).toHaveBeenCalledTimes(3);

    const calls = storageMocks.addLearningRecord.mock.calls;
    expect((calls[0][0] as { subject: string }).subject).toBe("數學");
    expect((calls[0][0] as { isCorrect: boolean }).isCorrect).toBe(true);
    expect((calls[0][0] as { difficulty: string }).difficulty).toBe("基礎");
    expect((calls[1][0] as { isCorrect: boolean }).isCorrect).toBe(false);
    expect((calls[1][0] as { flagged: boolean }).flagged).toBe(true);
    expect((calls[2][0] as { isCorrect: boolean }).isCorrect).toBe(true);
    expect((calls[2][0] as { difficulty: string }).difficulty).toBe("挑戰");

    // updatePlayerData：gold+26, exp+23, totalAnswers+3
    expect(storageMocks.updatePlayerData).toHaveBeenCalledTimes(1);
    const upd = storageMocks.updatePlayerData.mock.calls[0][0] as { gold: number; exp: number; totalAnswers: number };
    expect(upd.gold).toBe(26);
    expect(upd.exp).toBe(23);
    expect(upd.totalAnswers).toBe(3);

    // 答錯 1 題 → 顯示「進錯題魔王複習 1 題」按鈕
    expect(screen.getByRole("button", { name: /進錯題魔王複習 1 題/ })).toBeInTheDocument();

    // 點擊「再派一組」會再次呼叫 mutation
    fireEvent.click(screen.getByRole("button", { name: /再派一組/ }));
    await waitFor(() => expect(trpcMocks.mutateAsync).toHaveBeenCalledTimes(2));
  });

  it("全對不會出現錯題魔王按鈕，改顯示鼓勵語", async () => {
    const { container } = render(<CompanionTaskCard studentName="小晴" />);
    fireEvent.click(screen.getByRole("button", { name: /讓學伴派今日任務/ }));

    await waitFor(() => expect(screen.getByText("鞏固分數基礎")).toBeInTheDocument());

    const questions = container.querySelectorAll(".companion-task-question") as NodeListOf<HTMLElement>;
    fireEvent.click(within(questions[0]).getByText("3/4")); // 對
    fireEvent.click(within(questions[1]).getByText("大於")); // 對
    fireEvent.click(within(questions[2]).getByText("1/2")); // 對

    await waitFor(() => expect(screen.getByText(/本輪結果 · 正確率 100%/)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /進錯題魔王/ })).not.toBeInTheDocument();
    expect(screen.getByText(/全對！可進挑戰專區挑更難的題。/)).toBeInTheDocument();
  });

  it("答題中途按「換一批」會清空狀態並可重派", async () => {
    const { container } = render(<CompanionTaskCard studentName="小晴" />);
    fireEvent.click(screen.getByRole("button", { name: /讓學伴派今日任務/ }));

    await waitFor(() => expect(screen.getByText("鞏固分數基礎")).toBeInTheDocument());

    // 只答一題就按「換一批」（ghost 按鈕）
    const questions = container.querySelectorAll(".companion-task-question") as NodeListOf<HTMLElement>;
    fireEvent.click(within(questions[0]).getByText("3/4"));
    fireEvent.click(screen.getByRole("button", { name: /換一批/ }));

    // 回到 CTA 狀態
    expect(screen.getByRole("button", { name: /讓學伴派今日任務/ })).toBeInTheDocument();

    // 再次點擊，重新派
    fireEvent.click(screen.getByRole("button", { name: /讓學伴派今日任務/ }));
    await waitFor(() => expect(trpcMocks.mutateAsync).toHaveBeenCalledTimes(2));
  });
});