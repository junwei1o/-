// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OnionAcademyGame from "./OnionAcademyGame";
import { ONION_LESSONS, gradeOnionLesson } from "@/game/onionAcademyLessons";

afterEach(() => cleanup());
beforeEach(() => localStorage.clear());

/** 找選課卡（.ol-lesson-card）中標題含 text 的那一張。 */
function lessonCard(text: string): HTMLElement {
  const found = screen
    .getAllByRole("button")
    .find((b) => b.className.includes("ol-lesson-card") && (b.textContent ?? "").includes(text));
  if (!found) throw new Error(`找不到選課卡：${text}`);
  return found;
}
/** 找 .ol-btn 按鈕（textContent 包含 text）。 */
function olBtn(text: string): HTMLElement {
  const found = screen
    .getAllByRole("button")
    .find((b) => b.className.includes("ol-btn") && (b.textContent ?? "").includes(text));
  if (!found) throw new Error(`找不到 .ol-btn：${text}`);
  return found;
}
/** 找選項（.ol-opt，全文精確）。 */
function opt(text: string): HTMLElement {
  const found = screen
    .getAllByRole("button")
    .find((b) => b.className.includes("ol-opt") && (b.textContent ?? "") === text);
  if (!found) throw new Error(`找不到選項：${text}`);
  return found;
}

describe("洋蔥動畫講解 OnionAcademyGame", () => {
  it("選課器顯示全部 4 堂課，可回我的教室", () => {
    const onBest = vi.fn();
    const onExit = vi.fn();
    render(<OnionAcademyGame bestStars={undefined} onBest={onBest} onExit={onExit} />);
    expect(screen.getByText("選一門動畫課")).toBeInTheDocument();
    for (const l of ONION_LESSONS) {
      expect(screen.getByText(l.title)).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: /回我的教室/ }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("跳過動畫直接闖關：全對五題三顆星並回報最佳紀錄", () => {
    const onBest = vi.fn();
    const onExit = vi.fn();
    render(<OnionAcademyGame bestStars={undefined} onBest={onBest} onExit={onExit} />);
    const lesson = ONION_LESSONS[0];
    fireEvent.click(lessonCard(lesson.title)); // 進 intro
    fireEvent.click(olBtn("跳過動畫，直接闖關")); // 進 quiz
    lesson.questions.forEach((q, j) => {
      fireEvent.click(opt(q.options[q.answer]));
      fireEvent.click(olBtn(j < lesson.questions.length - 1 ? "下一題" : "查看結果"));
    });
    expect(screen.getByText("滿分通關！洋蔥為你驕傲！")).toBeInTheDocument();
    expect(onBest).toHaveBeenCalledWith({
      stars: 3,
      correct: lesson.questions.length,
      total: lesson.questions.length,
    });
  });

  it("答對一半以內只得一顆星（配對 gradeOnionLesson 邊界）", () => {
    const onBest = vi.fn();
    render(<OnionAcademyGame bestStars={undefined} onBest={onBest} onExit={vi.fn()} />);
    const lesson = ONION_LESSONS[1];
    fireEvent.click(lessonCard(lesson.title));
    fireEvent.click(olBtn("跳過動畫，直接闖關"));
    // 只答對 2 / 5 題
    for (let j = 0; j < lesson.questions.length; j++) {
      const q = lesson.questions[j];
      if (j < 2) fireEvent.click(opt(q.options[q.answer]));
      else {
        const wrong = q.options.find((o) => o !== q.options[q.answer]) as string;
        fireEvent.click(opt(wrong));
      }
      fireEvent.click(olBtn(j < lesson.questions.length - 1 ? "下一題" : "查看結果"));
    }
    expect(onBest).toHaveBeenCalledWith({ stars: 1, correct: 2, total: lesson.questions.length });
    expect(gradeOnionLesson(2, lesson.questions.length).stars).toBe(1);
  });
});
