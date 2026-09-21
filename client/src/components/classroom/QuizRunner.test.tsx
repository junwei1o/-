// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import QuizRunner, { type RunnerQuestion } from "./QuizRunner";

const questions: RunnerQuestion[] = [
  { id: "trap-1", prompt: "第一題", options: ["甲", "乙", "丙", "丁"], answer: 2, explanation: "解析一", trapNote: "陷阱一", category: "量詞" },
  { id: "trap-2", prompt: "第二題", options: ["A", "B", "C"], answer: 0, explanation: "解析二", trapNote: "陷阱二", category: "單位" },
  { id: "trap-3", prompt: "第三題", options: ["Ｏ", "Ｘ"], answer: 1, explanation: "解析三", trapNote: "陷阱三", category: "安全" },
];

function setup() {
  const onExit = vi.fn();
  const onBest = vi.fn();
  render(
    <QuizRunner
      variant="trap"
      emoji="🪤"
      tag="陷阱題挑戰"
      startTitle="陷阱題挑戰"
      startDesc="測試"
      rules={["一輪 3 題"]}
      questions={questions}
      onBest={onBest}
      onExit={onExit}
    />,
  );
  return { onExit, onBest };
}

/** begin 會洗題序：用畫面上的題幹辨識目前題目，再決定點正解或錯誤選項。 */
function answerCurrent(correct: boolean) {
  const promptEl = screen.getByText(/第[一二三]題/);
  const current = questions.find((q) => q.prompt === promptEl.textContent);
  if (!current) throw new Error("找不到畫面上的題目");
  const target = correct ? current.options[current.answer] : current.options[(current.answer + 1) % current.options.length];
  fireEvent.click(screen.getByRole("button", { name: (name) => name.trim() === target }));
}

async function waitAdvance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

/** 題號進度文字被 <b> 切開，用 textContent 整體比對。 */
function expectQuestion(n: number) {
  expect(screen.getByText((_, el) => el?.classList.contains("cr-stat") === true && el.textContent === `第 ${n} / 3 題`)).toBeInTheDocument();
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("QuizRunner（trap）推進鏈路", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("答對後自動前進到下一題", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "開始挑戰" }));
    expectQuestion(1);

    answerCurrent(true);
    expect(screen.getByRole("status")).toHaveTextContent("答對了");
    await waitAdvance(1200);
    expectQuestion(2);
  });

  it("答錯顯示陷阱解析後自動前進", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "開始挑戰" }));
    answerCurrent(false);
    expect(screen.getByRole("status")).toHaveTextContent("再想想");
    const trapNote = document.querySelector(".cr-trap-note");
    expect(trapNote).not.toBeNull();
    expect(trapNote).toHaveTextContent("避開陷阱");
    expect(trapNote).toHaveTextContent(/陷阱[一二三]/);
    await waitAdvance(2400);
    expectQuestion(2);
  });

  it("逾時不作答會判定時間到並自動前進", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "開始挑戰" }));
    await waitAdvance(30_500);
    expect(screen.getByRole("status")).toHaveTextContent("時間到");
    await waitAdvance(2400);
    expectQuestion(2);
  });

  it("完整跑完一輪會到結果頁，且再玩一輪可重新開始", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "開始挑戰" }));
    answerCurrent(true);
    await waitAdvance(1200);
    answerCurrent(false);
    await waitAdvance(2400);
    answerCurrent(true);
    await waitAdvance(1200);
    expect(screen.getByRole("status", { name: "挑戰結果" })).toBeInTheDocument();
    expect(screen.getByText(/答對 2 \/ 3 題/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再玩一輪" }));
    expectQuestion(1);
  });
});
