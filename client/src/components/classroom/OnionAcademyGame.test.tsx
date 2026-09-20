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

  it("答錯會給提示並可重試，只有首次答對才計分（一題錯過 → 少一題分）", () => {
    const onBest = vi.fn();
    render(<OnionAcademyGame bestStars={undefined} onBest={onBest} onExit={vi.fn()} />);
    const lesson = ONION_LESSONS[1];
    fireEvent.click(lessonCard(lesson.title));
    fireEvent.click(olBtn("跳過動畫，直接闖關"));
    for (let j = 0; j < lesson.questions.length; j++) {
      const q = lesson.questions[j];
      if (j < 2) {
        fireEvent.click(opt(q.options[q.answer]));
      } else {
        // 先答錯：應出現提示，且該選項被停用
        const wrong = q.options.find((o) => o !== q.options[q.answer]) as string;
        fireEvent.click(opt(wrong));
        expect(screen.getByText(/提示（第 1 次）/)).toBeInTheDocument();
        // 再答對：仍可繼續（但不計入首次答對）
        fireEvent.click(opt(q.options[q.answer]));
      }
      fireEvent.click(olBtn(j < lesson.questions.length - 1 ? "下一題" : "查看結果"));
    }
    expect(onBest).toHaveBeenCalledWith({ stars: 1, correct: 2, total: lesson.questions.length });
    expect(gradeOnionLesson(2, lesson.questions.length).stars).toBe(1);
  });

  it("動畫中途會停下來提問，略過後繼續播放", () => {
    render(<OnionAcademyGame bestStars={undefined} onBest={vi.fn()} onExit={vi.fn()} />);
    const lesson = ONION_LESSONS[0];
    fireEvent.click(lessonCard(lesson.title));
    fireEvent.click(olBtn("開始動畫講解"));
    // 前進到有提問的那一幀
    const askFrameIndex = lesson.frames.findIndex((f) => f.ask);
    expect(askFrameIndex).toBeGreaterThan(0);
    for (let i = 0; i < askFrameIndex; i += 1) {
      const next = screen.queryByRole("button", { name: /下一幀/ });
      if (next) fireEvent.click(next);
    }
    const ask = lesson.frames[askFrameIndex].ask!;
    expect(screen.getByText(ask.prompt)).toBeInTheDocument();
    // 答錯給提示、不鎖死
    const wrong = ask.options.find((_, i) => i !== ask.answer) as string;
    fireEvent.click(opt(wrong));
    expect(screen.getByText(new RegExp(ask.hint.slice(0, 6)))).toBeInTheDocument();
    // 略過後提問卡消失
    fireEvent.click(screen.getByRole("button", { name: /略過/ }));
    expect(screen.queryByText(ask.prompt)).not.toBeInTheDocument();
  });

  it("看完動畫可進重點整理，再開始闖關", () => {
    render(<OnionAcademyGame bestStars={undefined} onBest={vi.fn()} onExit={vi.fn()} />);
    const lesson = ONION_LESSONS[0];
    fireEvent.click(lessonCard(lesson.title));
    fireEvent.click(olBtn("開始動畫講解"));
    // 一路按到最後一幀（中途的提問都略過）
    for (let i = 0; i < lesson.frames.length; i += 1) {
      const skip = screen.queryByRole("button", { name: /略過/ });
      if (skip) fireEvent.click(skip);
      const next = screen.queryByRole("button", { name: /下一幀/ });
      if (next && !(next as HTMLButtonElement).disabled) fireEvent.click(next);
    }
    fireEvent.click(olBtn("看重點整理"));
    for (const item of lesson.takeaways ?? []) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    fireEvent.click(olBtn("開始闖關"));
    expect(screen.getByText(lesson.questions[0].prompt)).toBeInTheDocument();
  });
});
