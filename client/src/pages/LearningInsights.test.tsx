// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import LearningInsights from "./LearningInsights";
// 題庫採動態載入，測試 render 前先讀進來。
import { loadLocalBank } from "@/lib/questionBank";

const queryState = vi.hoisted(() => ({
  data: { questions: [] as Array<{ id: string }> },
  isLoading: false,
  error: null as unknown,
}));
const mutationState = vi.hoisted(() => ({
  data: undefined as { help: string; mastery: string; nextStep: string } | undefined,
  isPending: false,
  isError: false,
  mutate: vi.fn(),
}));
const usageState = vi.hoisted(() => ({
  data: undefined as { today: { calls: number; totalTokens: number }; last7Days: { calls: number; totalTokens: number } } | undefined,
  isError: false,
  isLoading: false,
}));
const setLocation = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    questionBank: { list: { useQuery: () => queryState } },
    aiTutor: {
      progressSummary: { useMutation: () => mutationState },
      tokenUsage: { useQuery: () => usageState },
    },
  },
}));

vi.mock("wouter", () => ({ useLocation: () => ["/learning-insights", setLocation] }));

describe("learning insights", () => {
  beforeAll(async () => {
    await loadLocalBank();
    Object.defineProperty(globalThis, "ResizeObserver", { configurable: true, value: class { observe() {} unobserve() {} disconnect() {} } });
  });
  beforeEach(() => {
    localStorage.clear();
    setLocation.mockReset();
    queryState.data = { questions: [] };
    queryState.isLoading = false;
    queryState.error = null;
    mutationState.data = undefined;
    mutationState.isPending = false;
    mutationState.isError = false;
    mutationState.mutate.mockReset();
    usageState.data = undefined;
    usageState.isError = false;
    usageState.isLoading = false;
  });
  afterEach(() => cleanup());

  it("does not label unattempted learning as weak and keeps insights local", () => {
    render(<LearningInsights />);
    expect(screen.getByRole("heading", { name: "知識掌握熱力圖" })).toBeInTheDocument();
    expect(screen.getByText("資料只留在此裝置")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "先完成幾個觀測點" })).toBeInTheDocument();
    expect(screen.queryByText("需要複習")).not.toBeInTheDocument();
  });

  it("routes the empty-state learner to an actual challenge entry", () => {
    render(<LearningInsights />);
    fireEvent.click(screen.getByRole("button", { name: "前往今日挑戰" }));
    expect(setLocation).toHaveBeenCalledWith("/practice");
  });

  it("renders a positive AI summary when the trend mutation succeeds", async () => {
    const now = Date.now();
    const attempts = Array.from({ length: 4 }, (_, index) => ({
      questionId: `q-${index}`,
      timestamp: now - ((3 - index) * 8 * 24 * 60 * 60 * 1000),
      correct: index !== 0,
      hintsUsed: index === 0 ? 1 : 0,
      curriculumDomain: "數學領域",
      difficulty: "標準",
      responseMs: 10000,
      timeLimitMs: 25000,
      knowledge: ["分數與比例"],
    }));
    localStorage.setItem("xue-adventure-adaptive-v1", JSON.stringify({ version: 2, attempts }));
    queryState.data = { questions: attempts.map(({ questionId: id }) => ({ id })) };
    mutationState.data = { help: "你正在更有信心地選擇何時求助。", mastery: "分數與比例的掌握度正在穩定累積。", nextStep: "再完成一題熟悉的練習。" };

    render(<LearningInsights />);

    expect(await screen.findByRole("heading", { name: "本期進步摘要" })).toBeInTheDocument();
    expect(screen.getByText("你正在更有信心地選擇何時求助。")).toBeInTheDocument();
    expect(screen.getByText(/掌握度正在穩定累積/)).toBeInTheDocument();
    const topicLink = screen.getByRole("link", { name: "前往複習：分數與比例" });
    expect(topicLink).toHaveAttribute("href", "/practice?reviewTopic=%E5%88%86%E6%95%B8%E8%88%87%E6%AF%94%E4%BE%8B");
    const topicChip = screen.getAllByRole("link", { name: /分數與比例/ }).at(-1);
    expect(topicChip).toHaveAttribute("href", "/practice?reviewTopic=%E5%88%86%E6%95%B8%E8%88%87%E6%AF%94%E4%BE%8B");
    expect(screen.getByRole("button", { name: "朗讀摘要" })).toBeInTheDocument();
    expect(mutationState.mutate).toHaveBeenCalled();
  });

  it("shows deterministic fallback when AI summary fails", () => {
    const now = Date.now();
    const attempts = [0, 1, 2, 3].map((index) => ({ questionId: `q-${index}`, timestamp: now - ((3 - index) * 8 * 24 * 60 * 60 * 1000), correct: true, hintsUsed: 0, curriculumDomain: "自然科學領域", difficulty: "標準", responseMs: 10000, timeLimitMs: 25000, knowledge: ["天文觀測"] }));
    localStorage.setItem("xue-adventure-adaptive-v1", JSON.stringify({ version: 2, attempts }));
    queryState.data = { questions: attempts.map(({ questionId: id }) => ({ id })) };
    mutationState.isError = true;

    render(<LearningInsights />);

    expect(screen.getByRole("heading", { name: "本期進步摘要" })).toBeInTheDocument();
    expect(screen.getByText(/AI 摘要暫時無法取得/)).toBeInTheDocument();
    expect(screen.getByText(/提示不是扣分/)).toBeInTheDocument();
  });

  it("shows personal AI token usage when a cloud name is set", () => {
    const now = Date.now();
    localStorage.setItem("xue-adventure-adaptive-v1", JSON.stringify({ version: 2, attempts: [
      { questionId: "q-1", timestamp: now, correct: true, hintsUsed: 0, curriculumDomain: "數學領域", difficulty: "標準", responseMs: 10000, timeLimitMs: 25000, knowledge: ["分數與比例"] },
    ] }));
    queryState.data = { questions: [{ id: "q-1" }] };
    localStorage.setItem("xue-cloud-mode-v1", JSON.stringify({ mode: "cloud", name: "小航海士" }));
    usageState.data = {
      today: { calls: 3, totalTokens: 880 },
      last7Days: { calls: 5, totalTokens: 1510 },
    };

    render(<LearningInsights />);

    expect(screen.getByText("AI 伴讀用量")).toBeInTheDocument();
    expect(screen.getByText(/今天已用 3 次、880 token/)).toBeInTheDocument();
    expect(screen.getByText(/近 7 天共 5 次、1,510 token/)).toBeInTheDocument();
  });

  it("prompts cloud login when no cloud name is set", () => {
    const now = Date.now();
    localStorage.setItem("xue-adventure-adaptive-v1", JSON.stringify({ version: 2, attempts: [
      { questionId: "q-1", timestamp: now, correct: true, hintsUsed: 0, curriculumDomain: "數學領域", difficulty: "標準", responseMs: 10000, timeLimitMs: 25000, knowledge: ["分數與比例"] },
    ] }));
    queryState.data = { questions: [{ id: "q-1" }] };
    render(<LearningInsights />);
    expect(screen.getByText(/登入雲端船名後/)).toBeInTheDocument();
  });

  describe("AI 摘要請求次數與 payload 上限（成本與正確性）", () => {
    function seedWeeks(weeks: number, perWeek: number) {
      const now = Date.now();
      // 時間戳必須由舊到新遞增（與真實寫入順序相同）：calculateLearningTrendReport
      // 以「最新一筆」為基準回推週期，順序顛倒會讓所有紀錄落進同一週期。
      const attempts = Array.from({ length: weeks * perWeek }, (_, index) => {
        const week = Math.floor(index / perWeek);
        const slot = index % perWeek;
        return {
          questionId: `q-${week}-${slot}`,
          timestamp: now - ((weeks - 1 - week) * 8 * 24 * 60 * 60 * 1000) - ((perWeek - 1 - slot) * 60 * 60 * 1000),
          correct: slot !== 0,
          hintsUsed: slot === 0 ? 1 : 0,
          curriculumDomain: "數學領域",
          difficulty: "標準" as const,
          responseMs: 10_000,
          timeLimitMs: 25_000,
          knowledge: ["分數與比例"],
        };
      }).sort((left, right) => left.timestamp - right.timestamp);
      localStorage.setItem("xue-adventure-adaptive-v1", JSON.stringify({ version: 2, attempts }));
      // 先給空題庫（模擬載入中），之後再換成有題庫 —— 正是原本重複呼叫的觸發路徑
      queryState.data = { questions: [] };
      return attempts;
    }

    it("題庫由空轉為有資料時，同一頁只發一次摘要請求", async () => {
      const attempts = seedWeeks(4, 2);
      const { rerender } = render(<LearningInsights />);
      queryState.data = { questions: attempts.map(({ questionId: id }) => ({ id })) };
      rerender(<LearningInsights />);

      await screen.findByRole("heading", { name: "本期進步摘要" });
      expect(mutationState.mutate).toHaveBeenCalledTimes(1);
    });

    it("每週作答超過 100 題時夾到 schema 上限，避免後端回 400", async () => {
      // 每週 120 筆：未夾時 helpTrend[i].attempts = 120 > 100，後端 zod 會回 400。
      // （每週 60 筆不會觸發——這是本測試第一次寫錯的地方，失效注入時測試沒失敗才發現。）
      const attempts = seedWeeks(3, 120);
      queryState.data = { questions: attempts.map(({ questionId: id }) => ({ id })) };
      render(<LearningInsights />);

      await screen.findByRole("heading", { name: "本期進步摘要" });
      expect(mutationState.mutate).toHaveBeenCalled();
      const payload = mutationState.mutate.mock.calls.at(-1)?.[0] as {
        helpTrend: { attempts: number }[];
        masteryTrend: { topics: { attempts: number }[] }[];
      };
      // 種子每週 120 筆 → 夾到上限後每週應為 100（而非 120，也不是原始未夾值）
      expect(payload.helpTrend.map((item) => item.attempts)).toEqual([100, 100, 100]);
      const topicValues = payload.masteryTrend.flatMap((period) => period.topics.map((topic) => topic.attempts));
      expect(Math.max(...topicValues, 1)).toBeLessThanOrEqual(100);
      expect(Math.min(...payload.helpTrend.map((item) => item.attempts))).toBeGreaterThanOrEqual(1);
    });
  });
});
