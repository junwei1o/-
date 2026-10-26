/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * LearningConsole 資料口徑測試（2026-10-26 Phase 1）。
 *
 * 這裡只鎖「前端如何呈現後端口徑」——三條硬規則：
 * 1. rate === null 必須顯示「—」，不是「0%」（後端回 null 的語意要接得住）
 * 2. 資料不足時不畫進度條（畫了 0 寬度等於暗示「你全錯」）
 * 3. 沒有作答紀錄時顯示空狀態，而不是五條 0%
 */

const mockDashboard = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    insights: {
      dashboard: { useQuery: (...args: unknown[]) => mockDashboard(...args) },
    },
  },
}));
vi.mock("@/utils/storage", () => ({ getPlayerName: () => "小明" }));
vi.mock("wouter", () => ({ useLocation: () => ["/dashboard", vi.fn()] }));

import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import LearningConsole from "./LearningConsole";

// render 會掛進同一個 jsdom document；不清乾淨會讓後續案例看到前一輪的節點
// （實測：第二次 render 時 getByText 命中兩個相同提示 → Found multiple elements）。
afterEach(() => cleanup());

const baseSubjects = [
  { subject: "數學", rate: 82, answered: 41, correct: 34 },
  { subject: "國語", rate: 58, answered: 33, correct: 19 },
  { subject: "自然", rate: 95, answered: 18, correct: 17 },
  { subject: "社會", rate: null, answered: 0, correct: 0 },
  { subject: "英語", rate: null, answered: 2, correct: 1 },
];

describe("LearningConsole 掌握度呈現", () => {
  it("rate=null 顯示 —，不顯示 0%", () => {
    mockDashboard.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        totalQuestions: 94,
        subjects: baseSubjects,
        weakTopics: [],
        route: { reason: "" },
        recent: null,
      },
    });
    render(<LearningConsole />);

    // 社會與英語都是資料不足 → 應出現兩個「—」
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
    // 不可出現 0%（那是「全錯」的誤導）
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    // 有資料的科目正常顯示
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
  });

  it("資料不足說明文字只在有 null 科目時出現", () => {
    mockDashboard.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        totalQuestions: 94,
        subjects: baseSubjects,
        weakTopics: [],
        route: { reason: "" },
        recent: null,
      },
    });
    render(<LearningConsole />);
    expect(screen.getByText(/答題數不足 5 題/)).toBeInTheDocument();
  });

  it("全部科目都有資料時，不顯示資料不足提示", () => {
    mockDashboard.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        totalQuestions: 200,
        subjects: baseSubjects.map((s) => ({ ...s, rate: s.rate ?? 70, answered: 10 })),
        weakTopics: [],
        route: { reason: "" },
        recent: null,
      },
    });
    render(<LearningConsole />);
    expect(screen.queryByText(/答題數不足 5 題/)).not.toBeInTheDocument();
  });

  it("沒有任何紀錄 → 顯示空狀態，不畫五條 0%", () => {
    mockDashboard.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        totalQuestions: 0,
        subjects: baseSubjects.map((s) => ({ ...s, rate: null, answered: 0, correct: 0 })),
        weakTopics: [],
        route: { reason: "" },
        recent: null,
      },
    });
    render(<LearningConsole />);
    expect(screen.getByText(/還沒有作答紀錄/)).toBeInTheDocument();
    expect(screen.getByText(/開始第一份試卷/)).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("薄弱點依後端順序列出，並帶專項訓練按鈕", () => {
    mockDashboard.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        totalQuestions: 94,
        subjects: baseSubjects,
        weakTopics: [
          { subject: "數學", topic: "分數比較", rate: 33 },
          { subject: "數學", topic: "單位換算", rate: 50 },
        ],
        route: { reason: "先鞏固分數比較" },
        recent: null,
      },
    });
    render(<LearningConsole />);
    expect(screen.getByText("分數比較")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /專項訓練/ })).toHaveLength(2);
  });

  it("後端錯誤時顯示可讀訊息，不白屏", () => {
    mockDashboard.mockReturnValue({ isPending: false, isError: true, data: undefined });
    render(<LearningConsole />);
    expect(screen.getByRole("alert")).toHaveTextContent(/無法取得學習資料/);
  });
});
