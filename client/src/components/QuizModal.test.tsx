// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuizModal } from "@/components/QuizModal";
import { getLearningRecord, LEARNING_RECORD_KEY } from "@/utils/storage";
import { RPG_STORAGE_KEY } from "@/game/rpgStorage";
import type { PaperQuestion } from "@/lib/paperExam";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const question: PaperQuestion = {
  id: "math-island-001",
  grade: 5,
  subject: "數學",
  difficulty: "基礎",
  learningTopic: "分數比較",
  prompt: "哪一個分數比較大？",
  options: ["1/2", "3/4", "1/4", "2/8"],
  answer: 1,
  explanation: "可以把分母化成相同，再比較分子。",
};

describe("QuizModal", () => {
  it("shows the island question and records a correct answer with the RPG reward", () => {
    const onCompleted = () => undefined;
    render(<QuizModal question={question} subject="數學" onClose={() => undefined} onCompleted={onCompleted} />);

    expect(screen.getByRole("dialog", { name: "留下學習線索" })).toHaveTextContent("哪一個分數比較大？");
    fireEvent.click(screen.getByRole("button", { name: "選項 2：3/4" }));

    expect(screen.getByRole("status")).toHaveTextContent("答對了");
    expect(getLearningRecord()).toHaveLength(1);
    expect(getLearningRecord()[0]).toMatchObject({ questionId: question.id, subject: "數學", isCorrect: true });
    expect(window.localStorage.getItem(LEARNING_RECORD_KEY)).toContain(question.id);
    expect(window.localStorage.getItem(RPG_STORAGE_KEY)).toContain('"coins":22');
  });

  it("shows a supportive correction and does not duplicate a second click", () => {
    render(<QuizModal question={question} subject="數學" onClose={() => undefined} onCompleted={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "選項 1：1/2" }));
    fireEvent.click(screen.getByRole("button", { name: "選項 2：3/4" }));

    expect(screen.getByRole("status")).toHaveTextContent("整理線索");
    expect(getLearningRecord()).toHaveLength(1);
    expect(getLearningRecord()[0]).toMatchObject({ questionId: question.id, isCorrect: false, errorType: "concept" });
  });

  it("allows closing the modal after answering", () => {
    const onClose = vi.fn();
    render(<QuizModal question={question} subject="數學" onClose={onClose} onCompleted={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "選項 2：3/4" }));
    fireEvent.click(screen.getByRole("button", { name: "繼續探索" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
