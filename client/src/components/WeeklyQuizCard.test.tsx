// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WeeklyQuizCard } from "./WeeklyQuizCard";

const quizQuestions = Array.from({ length: 10 }, (_, index) => ({
  id: `wq-${index + 1}`,
  subject: "數學",
  grade: 4,
  difficulty: "標準" as const,
  learningTopic: "分數",
  prompt: `週測第 ${index + 1} 題？`,
  options: ["甲", "乙", "丙", "丁"],
  answer: 0,
  explanation: "解析說明",
}));

type CloudModeState = { mode: "cloud" | "local"; name: string };

type SubmitResultShape = {
  ok: boolean;
  alreadyDone?: boolean;
  correctCount?: number;
  totalQuestions?: number;
  goldEarned?: number;
  expEarned?: number;
  reason?: string;
};

const trpcMocks = vi.hoisted(() => ({
  getQuery: vi.fn(),
  submitAsync: vi.fn<() => Promise<SubmitResultShape>>(async () => ({
    ok: true,
    alreadyDone: false,
    correctCount: 10,
    totalQuestions: 10,
    goldEarned: 60,
    expEarned: 50,
  })),
  refetch: vi.fn(async () => {}),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    weeklyQuiz: {
      get: {
        useQuery: () => ({ data: trpcMocks.getQuery(), isLoading: false, refetch: trpcMocks.refetch }),
      },
      submit: {
        useMutation: () => ({ mutateAsync: trpcMocks.submitAsync, isPending: false, isError: false, error: null }),
      },
    },
  },
}));

const cloudMocks = vi.hoisted(() => ({
  getCloudMode: vi.fn<() => CloudModeState>(() => ({ mode: "cloud", name: "小晴" })),
}));
vi.mock("@/game/cloudSync", () => ({ getCloudMode: cloudMocks.getCloudMode }));

vi.mock("@/game/adaptiveLearning", () => ({
  loadUserPreferences: () => ({ gradeLevel: 4 }),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()] as const,
}));

const storageMocks = vi.hoisted(() => ({
  addLearningRecord: vi.fn(),
  updatePlayerData: vi.fn(),
  getPlayerData: vi.fn(() => ({
    level: 1,
    exp: 20,
    expToNextLevel: 100,
    gold: 100,
    totalAnswers: 3,
    badges: [],
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
  cloudMocks.getCloudMode.mockReturnValue({ mode: "cloud", name: "小晴" });
  trpcMocks.getQuery.mockClear();
  trpcMocks.submitAsync.mockClear();
  trpcMocks.refetch.mockClear();
  storageMocks.addLearningRecord.mockClear();
  storageMocks.updatePlayerData.mockClear();
  storageMocks.getPlayerData.mockClear();
  storageMocks.getPlayerData.mockReturnValue({
    level: 1,
    exp: 20,
    expToNextLevel: 100,
    gold: 100,
    totalAnswers: 3,
    badges: [],
  });
  trpcMocks.submitAsync.mockResolvedValue({
    ok: true,
    alreadyDone: false,
    correctCount: 10,
    totalQuestions: 10,
    goldEarned: 60,
    expEarned: 50,
  });
});

afterEach(() => {
  cleanup();
});

describe("WeeklyQuizCard AI 自動週測", () => {
  it("本機模式顯示開啟雲端船籍的引導", () => {
    cloudMocks.getCloudMode.mockReturnValue({ mode: "local", name: "" });
    render(<WeeklyQuizCard />);
    expect(screen.getByRole("heading", { name: "AI 自動週測" })).toBeInTheDocument();
    expect(screen.getByText(/開啟雲端船籍/)).toBeInTheDocument();
  });

  it("未到週五時顯示開放時間", () => {
    trpcMocks.getQuery.mockReturnValue({
      status: "notOpen",
      weekKey: "2026-W37",
      opensAt: Date.UTC(2026, 8, 10, 16),
    });
    render(<WeeklyQuizCard />);
    expect(screen.getByText(/自動出題/)).toBeInTheDocument();
    expect(screen.getByText(/9 月 11 日（五）00:00/)).toBeInTheDocument();
  });

  it("已完成時顯示本週分數", () => {
    trpcMocks.getQuery.mockReturnValue({
      status: "done",
      weekKey: "2026-W37",
      score: { correctCount: 8, totalQuestions: 10, submittedAt: Date.now() },
    });
    render(<WeeklyQuizCard />);
    expect(screen.getByText(/本週回顧已完成/)).toBeInTheDocument();
    expect(screen.getByText("8/10")).toBeInTheDocument();
  });

  it("作答 10 題全對後自動提交，金幣經驗與學習紀錄落地", async () => {
    trpcMocks.getQuery.mockReturnValue({
      status: "ready",
      weekKey: "2026-W37",
      quiz: { id: 1, questions: quizQuestions },
    });
    render(<WeeklyQuizCard />);

    const optionButtons = screen.getAllByRole("button", { name: /甲/ });
    expect(optionButtons).toHaveLength(10);
    for (const button of optionButtons) {
      fireEvent.click(button);
    }

    await waitFor(() => expect(trpcMocks.submitAsync).toHaveBeenCalledTimes(1));
    expect(trpcMocks.submitAsync).toHaveBeenCalledWith({
      studentName: "小晴",
      weekKey: "2026-W37",
      answers: Object.fromEntries(quizQuestions.map((q) => [q.id, 0])),
    });

    await waitFor(() =>
      expect(screen.getByRole("status", { name: "週測結果" })).toHaveTextContent("10/10"),
    );
    // 100 + 60 金幣、20 + 50 經驗、3 + 10 總答題數
    expect(storageMocks.updatePlayerData).toHaveBeenCalledWith({
      gold: 160,
      exp: 70,
      totalAnswers: 13,
    });
    expect(storageMocks.addLearningRecord).toHaveBeenCalledTimes(10);
    expect(storageMocks.addLearningRecord).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "綜合課綱", isCorrect: true, knowledge: ["分數"] }),
    );
  });

  it("同一週重複提交（alreadyDone）不會重複給獎", async () => {
    trpcMocks.getQuery.mockReturnValue({
      status: "ready",
      weekKey: "2026-W37",
      quiz: { id: 1, questions: quizQuestions },
    });
    trpcMocks.submitAsync.mockResolvedValue({
      ok: true,
      alreadyDone: true,
      correctCount: 8,
      totalQuestions: 10,
    });
    render(<WeeklyQuizCard />);

    const optionButtons = screen.getAllByRole("button", { name: /甲/ });
    for (const button of optionButtons) {
      fireEvent.click(button);
    }

    await waitFor(() => expect(trpcMocks.submitAsync).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("status", { name: "週測結果" })).toHaveTextContent("8/10"),
    );
    expect(storageMocks.updatePlayerData).not.toHaveBeenCalled();
    expect(storageMocks.addLearningRecord).not.toHaveBeenCalled();
  });
});
