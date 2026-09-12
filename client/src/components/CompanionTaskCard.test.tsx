// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CompanionTaskCard } from "./CompanionTaskCard";

const trpcMocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(async () => ({
    taskType: "single" as const,
    subject: "數學",
    reason: "數學：分數 正確率 50%",
    title: "鞏固分數基礎",
    questions: [
      { prompt: "1/2 + 1/4 = ?", options: ["1/4", "2/6", "3/4", "1"], answer: 2, topic: "分數", difficulty: "基礎" as const },
      { prompt: "3/5 是大於還是小於 1/2？", options: ["大於", "小於", "相等", "無法比較"], answer: 0, topic: "分數", difficulty: "基礎" as const },
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

beforeEach(() => {
  localStorage.clear();
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
});

// 因為上面用了 within，這裡加 import
import { within } from "@testing-library/react";