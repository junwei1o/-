// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AiReviewPlanCard, type AiReviewPlan } from "./AiReviewPlanCard";

vi.mock("@/components/SpeechReadableText", () => ({
  SpeechReadableText: ({ text, as: Tag = "p" }: { text: string; as?: React.ElementType }) => React.createElement(Tag, null, text),
}));

const plan: AiReviewPlan = {
  title: "閱讀理解短複習路線",
  summary: "先整理主旨與細節的關係，再做一題小練習。",
  focusAreas: [{ topic: "閱讀理解", reason: "先找出全文反覆支持的核心意思。" }],
  stages: [
    { key: "orientation", label: "先看方向", instruction: "先圈出文章中反覆出現的重點。" },
    { key: "practice", label: "做個小練習", instruction: "用兩分鐘寫下一句文章主旨。" },
    { key: "check", label: "自己檢查", instruction: "問自己：這句話能涵蓋全文嗎？" },
  ],
  encouragement: "一步一步整理，你會越來越穩。",
  selfCheck: {
    difficulty: "基礎",
    optionCount: 2,
    prompt: "文章主旨通常要涵蓋什麼？",
    options: ["全文的核心意思", "一個細節"],
    correctOption: 0,
    explanation: "主旨要能概括全文的核心意思。",
    encouragement: "你願意檢查自己的理解，就是很好的學習。",
    hints: [],
  },
};

const challengePlan: AiReviewPlan = {
  ...plan,
  selfCheck: {
    ...plan.selfCheck,
    difficulty: "挑戰",
    optionCount: 4,
    options: ["全文核心", "單一細節", "標題字面", "個人偏好"],
    hints: ["先找出題目真正要你比較的範圍。", "把每個選項和文章反覆出現的訊息對照。"],
  },
};

afterEach(() => cleanup());

const mastery = [{ topic: "閱讀理解", status: "待加強" as const, detail: "2 題錯題 · 最高難度標準" }];

describe("AiReviewPlanCard", () => {
  it("reveals one low-interference review step at a time", () => {
    render(<AiReviewPlanCard isPending={false} error={false} data={plan} filteredCount={1} knowledgeMastery={mastery} onRetry={vi.fn()} />);
    expect(screen.getByText(plan.stages[0].instruction)).toBeInTheDocument();
    expect(screen.queryByText(plan.stages[1].instruction)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    expect(screen.getByText(plan.stages[1].instruction)).toBeInTheDocument();
    expect(screen.queryByText(plan.stages[2].instruction)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    expect(screen.getByText(plan.stages[2].instruction)).toBeInTheDocument();
    expect(screen.getByText(plan.encouragement)).toBeInTheDocument();
  });

  it("resets the reveal stage when the filtered count changes", () => {
    const { rerender } = render(<AiReviewPlanCard isPending={false} error={false} data={plan} filteredCount={1} knowledgeMastery={mastery} onRetry={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    rerender(<AiReviewPlanCard isPending={false} error={false} data={plan} filteredCount={2} onRetry={vi.fn()} />);
    expect(screen.queryByText(plan.stages[1].instruction)).not.toBeInTheDocument();
  });

  it("keeps help history separate from knowledge mastery", () => {
    render(<AiReviewPlanCard isPending={false} error={false} data={challengePlan} filteredCount={1} knowledgeMastery={mastery} onRetry={vi.fn()} />);
    expect(screen.getByRole("region", { name: "目前掌握狀態" })).toBeInTheDocument();
    const masteryRegion = screen.getByRole("region", { name: "目前掌握狀態" });
    expect(masteryRegion).toHaveTextContent("閱讀理解");
    expect(masteryRegion).toHaveTextContent("待加強");
    expect(screen.getByText(/使用提示是學習選擇，不會扣分/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    fireEvent.click(screen.getByRole("button", { name: /需要時查看提示/ }));
    expect(screen.getByLabelText(/已使用提示，階段 1.*提示不扣分/)).toBeInTheDocument();
  });

  it("gives immediate low-pressure feedback without changing formal exam data", () => {
    render(<AiReviewPlanCard isPending={false} error={false} data={plan} filteredCount={1} knowledgeMastery={mastery} onRetry={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    expect(screen.getByText(plan.selfCheck.prompt)).toBeInTheDocument();
    const options = screen.getAllByRole("button", { name: /全文的核心意思|一個細節/ });
    fireEvent.click(options[1]!);
    expect(screen.getByText("再想一下也沒關係")).toBeInTheDocument();
    expect(screen.getByText(plan.selfCheck.explanation)).toBeInTheDocument();
    fireEvent.click(options[0]!);
    expect(screen.getByText("掌握得很好！")).toBeInTheDocument();
  });

  it("resets the self-check answer when the filtered result changes", () => {
    const { rerender } = render(<AiReviewPlanCard isPending={false} error={false} data={plan} filteredCount={1} knowledgeMastery={mastery} onRetry={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    fireEvent.click(screen.getAllByRole("button", { name: /全文的核心意思|一個細節/ })[0]!);
    expect(screen.getByText("掌握得很好！")).toBeInTheDocument();
    rerender(<AiReviewPlanCard isPending={false} error={false} data={plan} filteredCount={2} onRetry={vi.fn()} />);
    expect(screen.queryByText("掌握得很好！")).not.toBeInTheDocument();
  });

  it("reveals optional challenge hints one at a time without exposing the answer", () => {
    render(<AiReviewPlanCard isPending={false} error={false} data={challengePlan} filteredCount={1} knowledgeMastery={mastery} onRetry={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    expect(screen.getByRole("button", { name: /需要時查看提示/ })).toBeInTheDocument();
    expect(screen.queryByText(challengePlan.selfCheck.hints[0]!)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /需要時查看提示/ }));
    expect(screen.getByText("已使用提示 · 階段 1")).toBeInTheDocument();
    expect(screen.getByLabelText(/已使用提示，階段 1.*提示不扣分/)).toBeInTheDocument();
    expect(screen.getByText(challengePlan.selfCheck.hints[0]!)).toBeInTheDocument();
    expect(screen.queryByText(challengePlan.selfCheck.hints[1]!)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /再看一個提示/ }));
    expect(screen.getByText("已使用提示 · 階段 2")).toBeInTheDocument();
    expect(screen.getByText(challengePlan.selfCheck.hints[1]!)).toBeInTheDocument();
  });

  it("resets revealed challenge hints when the filtered result changes", () => {
    const { rerender } = render(<AiReviewPlanCard isPending={false} error={false} data={challengePlan} filteredCount={1} knowledgeMastery={mastery} onRetry={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    fireEvent.click(screen.getByRole("button", { name: /看下一小步/ }));
    fireEvent.click(screen.getByRole("button", { name: /需要時查看提示/ }));
    expect(screen.getByText(challengePlan.selfCheck.hints[0]!)).toBeInTheDocument();
    rerender(<AiReviewPlanCard isPending={false} error={false} data={challengePlan} filteredCount={2} onRetry={vi.fn()} />);
    expect(screen.queryByText("已使用提示 · 階段 1")).not.toBeInTheDocument();
    expect(screen.queryByText(challengePlan.selfCheck.hints[0]!)).not.toBeInTheDocument();
  });

  it("keeps a retry path when the AI request fails", () => {
    const onRetry = vi.fn();
    render(<AiReviewPlanCard isPending={false} error filteredCount={2} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /重新整理複習建議/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
