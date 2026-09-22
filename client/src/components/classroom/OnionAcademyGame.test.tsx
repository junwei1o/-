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
  it("選課器預設顯示國小課；可切換國中／高中／全部，也可回我的教室", () => {
    const onBest = vi.fn();
    const onExit = vi.fn();
    render(<OnionAcademyGame bestStars={undefined} onBest={onBest} onExit={onExit} />);
    expect(screen.getByText("選一門動畫課")).toBeInTheDocument();

    // 預設為「國小」：只出現國小課
    const elementary = ONION_LESSONS.filter((l) => l.stages.includes("國小") && !l.stages.includes("國中"));
    const junior = ONION_LESSONS.filter((l) => l.stages.includes("國中") && !l.stages.includes("國小"));
    for (const l of elementary) expect(screen.getByText(l.title)).toBeInTheDocument();
    for (const l of junior) expect(screen.queryByText(l.title)).not.toBeInTheDocument();

    // 切到「國中」
    fireEvent.click(screen.getByRole("tab", { name: "國中" }));
    for (const l of junior) expect(screen.getByText(l.title)).toBeInTheDocument();

    // 切到「高中」：高中課程要能單獨篩出來
    fireEvent.click(screen.getByRole("tab", { name: "高中" }));
    const senior = ONION_LESSONS.filter((l) => l.stages.includes("高中"));
    for (const l of senior) expect(screen.getByText(l.title)).toBeInTheDocument();

    // 切到「全部」：200 堂課程全部列出（也順帶驗證課名不重複，否則 getByText 會撞）
    fireEvent.click(screen.getByRole("tab", { name: "全部" }));
    for (const l of ONION_LESSONS) expect(screen.getByText(l.title)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /回我的教室/ }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("可依科目篩選課程，並在闖關後於選課卡標記已學過", () => {
    render(<OnionAcademyGame bestStars={undefined} onBest={vi.fn()} onExit={vi.fn()} />);
    // 先篩「自然」：只出現自然課
    fireEvent.click(screen.getByRole("button", { name: "自然" }));
    // 預設學段是「國小」，所以只檢查國小看得到的自然課
    const nature = ONION_LESSONS.filter((l) => l.subject === "自然" && l.stages.includes("國小"));
    const others = ONION_LESSONS.filter((l) => l.subject !== "自然" && l.stages.includes("國小"));
    for (const l of nature) expect(screen.getByText(l.title)).toBeInTheDocument();
    for (const l of others) expect(screen.queryByText(l.title)).not.toBeInTheDocument();

    // 走完一堂自然課
    const lesson = nature[0];
    fireEvent.click(lessonCard(lesson.title));
    fireEvent.click(olBtn("跳過動畫，直接闖關"));
    for (let j = 0; j < lesson.questions.length; j += 1) {
      fireEvent.click(opt(lesson.questions[j].options[lesson.questions[j].answer]));
      fireEvent.click(olBtn(j < lesson.questions.length - 1 ? "下一題" : "查看結果"));
    }
    fireEvent.click(olBtn("換一堂課"));
    fireEvent.click(screen.getByRole("button", { name: "自然" }));
    expect(screen.getByLabelText(/已學過，最佳 3 顆星/)).toBeInTheDocument();
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
      if (j < lesson.questions.length - 1) {
        // 前面的題都首次答對
        fireEvent.click(opt(q.options[q.answer]));
      } else {
        // 最後一題先答錯：應出現提示，且該選項被停用
        const wrong = q.options.find((o) => o !== q.options[q.answer]) as string;
        fireEvent.click(opt(wrong));
        expect(screen.getByText(/提示（第 1 次）/)).toBeInTheDocument();
        // 再答對：仍可繼續，但這題不計入「首次答對」
        fireEvent.click(opt(q.options[q.answer]));
      }
      fireEvent.click(olBtn(j < lesson.questions.length - 1 ? "下一題" : "查看結果"));
    }
    const correct = lesson.questions.length - 1;
    const expected = gradeOnionLesson(correct, lesson.questions.length);
    expect(onBest).toHaveBeenCalledWith({
      stars: expected.stars,
      correct,
      total: lesson.questions.length,
    });
    // 只錯一題（首次答對）仍有高分，但拿不到滿分三顆星
    expect(expected.stars).toBe(2);
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

  it("動畫播放時每一步都有步驟標籤，並可打開步驟章節直接跳步", () => {
    render(<OnionAcademyGame bestStars={undefined} onBest={vi.fn()} onExit={vi.fn()} />);
    const lesson = ONION_LESSONS[0];
    fireEvent.click(lessonCard(lesson.title));
    fireEvent.click(olBtn("開始動畫講解"));

    // 目前這一幀要顯示步驟標籤（洋蔥學園式的步驟分類）
    const step = lesson.frames[0].step;
    expect(step).toBeTruthy();
    expect(screen.getByText(step!.replace(/^步驟\s*\d+\s*：/, ""), { exact: false })).toBeInTheDocument();

    // 打開步驟章節：每幀一個步驟按鈕，且標示目前所在步驟
    fireEvent.click(olBtn("步驟"));
    const chapters = screen.getAllByRole("button").filter((b) => b.className.includes("ol-chapter"));
    expect(chapters).toHaveLength(lesson.frames.length);
    expect(chapters[0]).toHaveAttribute("aria-current", "step");

    // 點第 4 步 → 直接跳到那一幀
    fireEvent.click(chapters[3]);
    expect(chapters[3]).toHaveAttribute("aria-current", "step");
    expect(screen.getByText(`第 4 / ${lesson.frames.length} 幀`)).toBeInTheDocument();
  });
});
