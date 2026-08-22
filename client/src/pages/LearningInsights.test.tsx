// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import LearningInsights from "./LearningInsights";

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
const setLocation = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    questionBank: { list: { useQuery: () => queryState } },
    aiTutor: { progressSummary: { useMutation: () => mutationState } },
  },
}));

vi.mock("wouter", () => ({ useLocation: () => ["/learning-insights", setLocation] }));

describe("learning insights", () => {
  beforeAll(() => {
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
});
