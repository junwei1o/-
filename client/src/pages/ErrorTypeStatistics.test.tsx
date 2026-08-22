// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorTypeStatistics from "./ErrorTypeStatistics";

const queryState = vi.hoisted(() => ({ data: { questions: [] as Array<{ id: string }> }, isLoading: false, error: null as unknown }));
const setLocation = vi.fn();
vi.mock("@/lib/trpc", () => ({ trpc: { questionBank: { list: { useQuery: () => queryState } } } }));
vi.mock("wouter", () => ({ useLocation: () => ["/error-statistics", setLocation] }));

describe("error type statistics page", () => {
  beforeEach(() => {
    localStorage.clear();
    setLocation.mockReset();
    queryState.data = { questions: [] };
    queryState.isLoading = false;
    queryState.error = null;
  });
  afterEach(() => cleanup());

  it("shows an honest empty state without inventing progress", () => {
    render(<ErrorTypeStatistics />);
    expect(screen.getByRole("heading", { name: "錯誤線索圖譜" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "先完成幾個觀測點" })).toBeInTheDocument();
    expect(screen.queryByText("觀念整理")).not.toBeInTheDocument();
    expect(screen.getByText("資料只留在此裝置")).toBeInTheDocument();
  });

  it("renders distribution and trend from classified real attempts", () => {
    const now = Date.UTC(2026, 7, 20, 8);
    const attempts = [
      { questionId: "q1", timestamp: now - 2 * 24 * 60 * 60 * 1000, correct: false, errorType: "concept", curriculumDomain: "數學領域", difficulty: "標準", responseMs: 1000, timeLimitMs: 25000, knowledge: ["分數"] },
      { questionId: "q2", timestamp: now - 24 * 60 * 60 * 1000, correct: false, errorType: "careless", curriculumDomain: "數學領域", difficulty: "標準", responseMs: 1000, timeLimitMs: 25000, knowledge: ["分數"] },
      { questionId: "q3", timestamp: now, correct: true, curriculumDomain: "數學領域", difficulty: "標準", responseMs: 1000, timeLimitMs: 25000, knowledge: ["分數"] },
    ];
    localStorage.setItem("xue-adventure-adaptive-v1", JSON.stringify({ version: 2, attempts }));
    queryState.data = { questions: [{ id: "q1" }, { id: "q2" }, { id: "q3" }] };
    render(<ErrorTypeStatistics />);
    expect(screen.getByRole("heading", { name: "弱點分佈" })).toBeInTheDocument();
    expect(screen.getAllByText("觀念整理").length).toBeGreaterThan(0);
    expect(screen.getAllByText("細節檢查").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "進步趨勢" })).toBeInTheDocument();
    expect(screen.getAllByText(/觀念整理/).length).toBeGreaterThan(0);
  });

  it("routes the learner to a real challenge entry", () => {
    render(<ErrorTypeStatistics />);
    fireEvent.click(screen.getByRole("button", { name: "前往今日挑戰" }));
    expect(setLocation).toHaveBeenCalledWith("/practice");
  });
});
