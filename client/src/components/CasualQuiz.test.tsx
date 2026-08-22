/** @vitest-environment jsdom */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CasualQuiz from "./CasualQuiz";
import { CASUAL_QUIZ_QUESTIONS } from "@/lib/casualQuiz";

const COURSE_PROGRESS_KEY = "xue-adventure-learning-progress-v1";
const CASUAL_PROGRESS_KEY = "xue-adventure-casual-quiz-v1";
const FOCUS_CATEGORY = "隱藏劇情問答";

function chooseFirstOption() {
  const option = screen.getAllByRole("button").find((button) => button.className.includes("casual-option"));
  expect(option).toBeDefined();
  fireEvent.click(option as HTMLElement);
}

describe("150 題特攝專題題庫", () => {
  it("contains 150 unique questions across three series and four quiz categories", () => {
    expect(CASUAL_QUIZ_QUESTIONS).toHaveLength(150);
    expect(new Set(CASUAL_QUIZ_QUESTIONS.map((question) => question.id)).size).toBe(150);
    expect(new Set(CASUAL_QUIZ_QUESTIONS.map((question) => question.series))).toEqual(new Set(["奧特曼", "假面騎士", "我是奶龍"]));
    expect(CASUAL_QUIZ_QUESTIONS.filter((question) => question.series === "奧特曼")).toHaveLength(50);
    expect(CASUAL_QUIZ_QUESTIONS.filter((question) => question.series === "假面騎士")).toHaveLength(50);
    expect(CASUAL_QUIZ_QUESTIONS.filter((question) => question.series === "我是奶龍")).toHaveLength(50);
    expect(new Set(CASUAL_QUIZ_QUESTIONS.map((question) => question.category))).toEqual(new Set(["熱門問答摘錄", "有趣問答", "擴展知識問答", "隱藏劇情問答"]));
    CASUAL_QUIZ_QUESTIONS.forEach((question) => {
      expect(question.options).toHaveLength(4);
      expect(question.options.every((option) => option.trim().length > 0)).toBe(true);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(4);
      expect(question.explanation).toContain("原創問答整理");
    });
  });

  it("keeps anime questions inside story, performance, and observation contexts", () => {
    const lifeContext = /生活|校園|班級|考試|書包|家附近|自然課|公民課|數學課/;
    CASUAL_QUIZ_QUESTIONS.forEach((question) => {
      expect(`${question.prompt}${question.explanation}`).not.toMatch(lifeContext);
    });

    const ultramanOpening = CASUAL_QUIZ_QUESTIONS.find((question) => question.id === "casual-1-01");
    const nailongOpening = CASUAL_QUIZ_QUESTIONS.find((question) => question.id === "casual-3-01");
    expect(ultramanOpening?.prompt).not.toEqual(nailongOpening?.prompt);
    expect(nailongOpening?.prompt).toContain("我是奶龍");
  });
});

describe("CasualQuiz", () => {
  afterEach(cleanup);

  beforeEach(() => {
    localStorage.clear();
  });

  it("supports category selection and keyboard answer activation", () => {
    render(<CasualQuiz onExit={vi.fn()} />);

    const category = screen.getAllByRole("button", { name: FOCUS_CATEGORY })[0];
    category.focus();
    fireEvent.keyDown(category, { key: "Enter" });
    expect(category).toHaveAttribute("aria-pressed", "true");

    const option = screen.getAllByRole("button").find((button) => button.className.includes("casual-option"));
    expect(option).toBeDefined();
    option?.focus();
    fireEvent.keyDown(option as HTMLElement, { key: " " });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("已記錄本題，查看解析後前往下一個觀測點。")).toBeInTheDocument();
    expect(option).toHaveAttribute("aria-pressed", "true");
  });

  it("completes a full 10-question round, stores separate progress, and resets on replay", () => {
    render(<CasualQuiz onExit={vi.fn()} />);
    fireEvent.click(screen.getAllByRole("button", { name: FOCUS_CATEGORY })[0]);

    for (let index = 0; index < 10; index += 1) {
      chooseFirstOption();
      const advanceName = index === 9 ? "查看結果" : "下一題";
      const advance = screen.getByRole("button", { name: advanceName });
      if (index === 0) {
        advance.focus();
        fireEvent.keyDown(advance, { key: " " });
      } else {
        fireEvent.click(advance);
      }
    }

    expect(screen.getByRole("heading", { name: /這次答對/ })).toBeInTheDocument();
    expect(localStorage.getItem(CASUAL_PROGRESS_KEY)).toContain('"total":10');
    expect(localStorage.getItem(COURSE_PROGRESS_KEY)).toBeNull();

    const replayButton = screen.getByRole("button", { name: "再玩一次" });
    replayButton.focus();
    fireEvent.keyDown(replayButton, { key: "Enter" });
    expect(screen.getByRole("heading", { name: /特攝動漫/ })).toBeInTheDocument();
    expect(screen.getByText("第 1 / 10 題")).toBeInTheDocument();
    expect(screen.getByLabelText("本輪答題進度：第 1 題，共 10 題")).toBeInTheDocument();
    expect(screen.getByText("目前答對").previousElementSibling).toHaveTextContent("0");
  });

  it("keeps the result-page return control keyboard reachable", () => {
    const onExit = vi.fn();
    render(<CasualQuiz onExit={onExit} />);
    fireEvent.click(screen.getAllByRole("button", { name: FOCUS_CATEGORY })[0]);
    for (let index = 0; index < 10; index += 1) {
      chooseFirstOption();
      fireEvent.click(screen.getByRole("button", { name: index === 9 ? "查看結果" : "下一題" }));
    }
    const resultExit = screen.getAllByRole("button", { name: /返回每日挑戰/ })[0];
    resultExit.focus();
    fireEvent.keyDown(resultExit, { key: " " });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("keeps the challenge exit control keyboard reachable", () => {
    const onExit = vi.fn();
    render(<CasualQuiz onExit={onExit} />);
    const exit = screen.getAllByRole("button", { name: /返回每日挑戰/ })[0];
    exit.focus();
    expect(document.activeElement).toBe(exit);
    fireEvent.keyDown(exit, { key: "Enter" });
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
