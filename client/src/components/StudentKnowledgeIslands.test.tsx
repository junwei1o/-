// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudentKnowledgeIslands } from "@/components/StudentKnowledgeIslands";
import type { KnowledgeIslandSnapshot } from "@/lib/studentKnowledgeIslands";

const testResource = { title: "課綱資源", provider: "教育機構", url: "https://example.edu.tw", kind: "課綱入口" as const };
const islands: KnowledgeIslandSnapshot[] = [
  { id: "math", subject: "數學", title: "量與關係島", shortTitle: "數學", description: "把數字、圖形和規律連成可走的路。", curriculumFocus: "數與量、幾何、關係與資料。", learningDirections: ["從資料找規律"], resources: [testResource], attemptCount: 2, accuracy: 1, observedKnowledge: ["分數比較"], recentReviewTopics: ["小數運算", "分數比較"], dueReviewCount: 0, unlocked: true },
  { id: "science", subject: "自然", title: "觀察實驗島", shortTitle: "自然", description: "從現象、證據和變化找到線索。", curriculumFocus: "探究與實作。", learningDirections: ["用證據說明"], resources: [testResource], attemptCount: 0, accuracy: null, observedKnowledge: [], recentReviewTopics: [], dueReviewCount: 0, unlocked: false },
  { id: "social", subject: "社會", title: "生活與地方島", shortTitle: "社會", description: "看看人、地方和規則如何互相影響。", curriculumFocus: "地理、歷史與公民。", learningDirections: ["讀懂地方資料"], resources: [testResource], attemptCount: 0, accuracy: null, observedKnowledge: [], recentReviewTopics: [], dueReviewCount: 0, unlocked: false },
  { id: "language", subject: "國語", title: "閱讀表達島", shortTitle: "國語", description: "從文字裡找線索，也把想法說清楚。", curriculumFocus: "閱讀理解與表達。", learningDirections: ["找出關鍵詞"], resources: [testResource], attemptCount: 0, accuracy: null, observedKnowledge: [], recentReviewTopics: [], dueReviewCount: 0, unlocked: false },
];

describe("StudentKnowledgeIslands", () => {
  afterEach(() => cleanup());

  it("shows all four positive island states without inventing learning data", () => {
    render(<StudentKnowledgeIslands islands={islands} onOpenSubject={vi.fn()} onOpenTopic={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "選一座知識島嶼出發" })).toBeInTheDocument();
    expect(screen.getByTestId("knowledge-island-math")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("knowledge-island-math")).not.toHaveAttribute("aria-controls");
    expect(screen.getByTestId("knowledge-island-science")).toHaveTextContent("等待第一次探索");
    expect(screen.queryByText("分數比較")).not.toBeInTheDocument();
  });

  it("renders only supplied recent review topics and opens the matching topic practice", () => {
    const onOpenSubject = vi.fn();
    const onOpenTopic = vi.fn();
    render(<StudentKnowledgeIslands islands={islands} onOpenSubject={onOpenSubject} onOpenTopic={onOpenTopic} />);

    fireEvent.click(screen.getByTestId("knowledge-island-math"));
    expect(screen.getByTestId("knowledge-island-math")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("knowledge-island-math")).toHaveAttribute("aria-controls", "knowledge-island-detail-math");
    expect(screen.getByText("已留下 2 次真實練習線索。")).toBeInTheDocument();
    expect(screen.getByText("數與量、幾何、關係與資料。")).toBeInTheDocument();
    expect(screen.getByLabelText("建議學習方向")).toHaveTextContent("從資料找規律");
    expect(screen.getByRole("link", { name: /課綱資源，教育機構/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByLabelText("近期可複習知識點")).toHaveTextContent("小數運算");
    expect(screen.getByLabelText("近期可複習知識點")).toHaveTextContent("分數比較");
    fireEvent.click(screen.getByRole("button", { name: "複習「小數運算」" }));
    expect(onOpenTopic).toHaveBeenCalledWith("數學", "小數運算");
    fireEvent.click(screen.getByRole("button", { name: "繼續 數學 練習" }));
    expect(onOpenSubject).toHaveBeenCalledWith("數學");
  });

  it("offers a first exploration entry without inventing recent review topics and supports closing the detail", () => {
    const onOpenSubject = vi.fn();
    render(<StudentKnowledgeIslands islands={islands} onOpenSubject={onOpenSubject} onOpenTopic={vi.fn()} />);

    fireEvent.click(screen.getByTestId("knowledge-island-science"));
    expect(screen.getByText("這座島正在等你的第一個學習線索。")).toBeInTheDocument();
    expect(screen.queryByLabelText("近期可複習知識點")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "從 自然 開始探索" }));
    expect(onOpenSubject).toHaveBeenCalledWith("自然");
    fireEvent.click(screen.getByRole("button", { name: "回到四座島嶼" }));
    expect(screen.getByRole("status")).toHaveTextContent("從一座想探索的島嶼開始");
  });
});
