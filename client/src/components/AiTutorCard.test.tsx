// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AiTutorCard } from "./AiTutorCard";

const result = {
  initialHint: "先找出題目給你的兩個關鍵數量。",
  advancedHint: "想想這兩個數量之間是合併、比較，還是分組關係。",
  steps: ["圈出已知數量。", "判斷要合併還是分開。", "寫出算式並檢查單位。"],
  explanation: "把題目中的數量依照情境合併，再用算式確認答案。",
  misconception: "不要只看到數字就直接相乘，要先讀懂關係。",
  encouragement: "你已經找到下一條思考線索了！",
};

afterEach(() => cleanup());

describe("AiTutorCard", () => {
  it("shows loading state", () => {
    render(<AiTutorCard isPending error={false} onRetry={vi.fn()} />);
    expect(screen.getByText("正在根據這道題的課綱內容整理提示……")).toBeInTheDocument();
  });

  it("shows retry action when the explanation fails", () => {
    const onRetry = vi.fn();
    render(<AiTutorCard isPending={false} error onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /重新取得 AI 解析/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("reveals initial hint, advanced hint, then full explanation in order", () => {
    render(<AiTutorCard isPending={false} error={false} data={result} onRetry={vi.fn()} />);
    expect(screen.getByText(result.initialHint)).toBeInTheDocument();
    expect(screen.queryByText(result.advancedHint)).not.toBeInTheDocument();
    expect(screen.queryByText(result.explanation)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /顯示進階提示/ }));
    expect(screen.getByText(result.advancedHint)).toBeInTheDocument();
    expect(screen.queryByText(result.explanation)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /查看完整解答/ }));
    expect(screen.getByText(result.steps[1])).toBeInTheDocument();
    expect(screen.getByText(result.explanation)).toBeInTheDocument();
    expect(screen.getByText(result.misconception)).toBeInTheDocument();
  });

  it("resets to initial hint stage when a new explanation arrives", () => {
    const { rerender } = render(<AiTutorCard isPending={false} error={false} data={result} onRetry={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /顯示進階提示/ }));
    fireEvent.click(screen.getByRole("button", { name: /查看完整解答/ }));
    expect(screen.getByText(result.explanation)).toBeInTheDocument();

    const nextResult = { ...result, initialHint: "換一個角度找出題目的關係。" };
    rerender(<AiTutorCard isPending={false} error={false} data={nextResult} onRetry={vi.fn()} />);
    expect(screen.getByText(nextResult.initialHint)).toBeInTheDocument();
    expect(screen.queryByText(nextResult.advancedHint)).not.toBeInTheDocument();
    expect(screen.queryByText(nextResult.explanation)).not.toBeInTheDocument();
  });
});
