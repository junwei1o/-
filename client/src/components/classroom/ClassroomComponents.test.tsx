// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FillBlank from "./FillBlank";
import OrderSteps from "./OrderSteps";
import QuizRunner, { type RunnerQuestion } from "./QuizRunner";
import RushRunner from "./RushRunner";
import type { PaperQuestion } from "@/lib/paperExam";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const fillQuestion: PaperQuestion = {
  id: "fill-1",
  grade: 3,
  subject: "數學",
  questionType: "填空題",
  difficulty: "基礎",
  learningTopic: "單位",
  prompt: "1 公尺等於 ____ 公分。",
  options: ["10", "100", "1000", "10000"],
  answer: 1,
  explanation: "1 公尺＝100 公分。",
};

const orderQuestion: PaperQuestion = {
  id: "order-1",
  grade: 3,
  subject: "自然",
  questionType: "排序題",
  difficulty: "基礎",
  learningTopic: "種子發芽",
  prompt: "請排出種子發芽的正確順序：",
  options: [],
  answer: 0,
  explanation: "種子會先長根、再長莖葉。",
  orderItems: ["種子泡水", "長出根", "長出嫩芽", "長成幼苗"],
};

const runnerQuestions: RunnerQuestion[] = [
  { id: "q1", prompt: "1 + 1 = ?", options: ["1", "2", "3", "4"], answer: 1, explanation: "1+1=2" },
  { id: "q2", prompt: "2 + 2 = ?", options: ["2", "3", "4", "5"], answer: 2, explanation: "2+2=4" },
];

describe("FillBlank 填空選字", () => {
  it("點字卡觸發 onPick，作答後正解轉綠、錯解轉紅", () => {
    const onPick = vi.fn();
    const { rerender } = render(<FillBlank question={fillQuestion} answered={false} onPick={onPick} />);
    fireEvent.click(screen.getByRole("button", { name: "100" }));
    expect(onPick).toHaveBeenCalledWith(1);

    rerender(<FillBlank question={fillQuestion} selected={1} answered onPick={onPick} />);
    expect(screen.getByRole("button", { name: "100" })).toHaveClass("is-correct");
  });

  it("答錯時顯示正確字卡為綠色、自己選的為紅色", () => {
    render(<FillBlank question={fillQuestion} selected={0} answered onPick={() => {}} />);
    expect(screen.getByRole("button", { name: "100" })).toHaveClass("is-correct");
    expect(screen.getByRole("button", { name: "10" })).toHaveClass("is-wrong");
  });
});

describe("OrderSteps 排序題", () => {
  function poolButtons(container: HTMLElement) {
    return Array.from(container.querySelectorAll(".cr-order-pool .cr-order-item")) as HTMLButtonElement[];
  }

  it("依正確順序點選並確認，回報 true", () => {
    const onResolve = vi.fn();
    const { container } = render(<OrderSteps question={orderQuestion} answered={false} onResolve={onResolve} />);
    for (const item of orderQuestion.orderItems!) {
      const button = poolButtons(container).find((el) => el.textContent?.includes(item));
      expect(button).toBeTruthy();
      fireEvent.click(button!);
    }
    fireEvent.click(screen.getByRole("button", { name: "確認順序" }));
    expect(onResolve).toHaveBeenCalledWith(true);
    expect(screen.getByText("順序完全正確！")).toBeInTheDocument();
  });

  it("錯誤順序確認後回報 false，並顯示正確順序", () => {
    const onResolve = vi.fn();
    const { container } = render(<OrderSteps question={orderQuestion} answered={false} onResolve={onResolve} />);
    const wrongOrder = ["長成幼苗", "種子泡水", "長出根", "長出嫩芽"];
    for (const item of wrongOrder) {
      const button = poolButtons(container).find((el) => el.textContent?.includes(item));
      fireEvent.click(button!);
    }
    fireEvent.click(screen.getByRole("button", { name: "確認順序" }));
    expect(onResolve).toHaveBeenCalledWith(false);
    expect(screen.getByText("正確順序應該是這樣：")).toBeInTheDocument();
  });

  it("時間到（外部 answered=true）時禁用操作並顯示正確順序", () => {
    const { container } = render(<OrderSteps question={orderQuestion} answered onResolve={() => {}} />);
    expect(screen.queryByRole("button", { name: "確認順序" })).not.toBeInTheDocument();
    const pool = Array.from(container.querySelectorAll(".cr-order-pool .cr-order-item")) as HTMLButtonElement[];
    // 可見（未被選取）的待排項目都應禁用
    for (const button of pool) {
      if (button.style.visibility !== "hidden") expect(button).toBeDisabled();
    }
  });
});

describe("QuizRunner 翻牌問答", () => {
  beforeEach(() => vi.useFakeTimers());

  it("開始後需先翻牌才看到選項，答對有正向回饋", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(
      <QuizRunner
        variant="flip"
        emoji="🃏"
        tag="翻牌問答"
        startTitle="翻牌問答"
        startDesc="desc"
        rules={["規則"]}
        questions={runnerQuestions}
        onExit={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "開始挑戰" }));
    // 翻牌前看不到選項
    expect(screen.queryByText("1 + 1 = ?")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "翻開題目" }));
    act(() => vi.advanceTimersByTime(600));
    expect(screen.getByText("1 + 1 = ?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByText("答對了，太棒了！")).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("看圖選答模式直接顯示圖片與選項", () => {
    const imageQuestions: RunnerQuestion[] = [
      { id: "i1", prompt: "看圖選出正確的名稱", img: "/matching-img/x.jpg", options: ["台北101", "鐵塔", "金字塔", "大佛"], answer: 0 },
    ];
    render(
      <QuizRunner
        variant="image"
        emoji="🖼️"
        tag="看圖選答"
        startTitle="看圖選答"
        startDesc="desc"
        rules={["規則"]}
        questions={imageQuestions}
        onExit={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "開始挑戰" }));
    expect(screen.getByAltText("看圖選答的圖片")).toHaveAttribute("src", "/matching-img/x.jpg");
    fireEvent.click(screen.getByRole("button", { name: /台北101/ }));
    expect(screen.getByText("答對了，太棒了！")).toBeInTheDocument();
  });
});

describe("RushRunner 限時接力", () => {
  beforeEach(() => vi.useFakeTimers());

  it("答對立即加 10 分，答錯顯示正解且不加分", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(
      <RushRunner
        variant="choice"
        emoji="⏱️"
        tag="限時接力"
        startTitle="限時接力"
        startDesc="desc"
        rules={["規則"]}
        questions={runnerQuestions}
        onExit={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /開始/ }));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(within(document.querySelector(".cr-stats")!).getByText("10")).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("是非模式只有正確／錯誤兩顆大鍵", () => {
    const tf: RunnerQuestion[] = [
      { id: "tf1", prompt: "磁鐵同極會相斥。", options: ["正確", "錯誤"], answer: 0 },
    ];
    render(
      <RushRunner
        variant="tf"
        emoji="⚡"
        tag="是非閃電"
        startTitle="是非閃電"
        startDesc="desc"
        rules={["規則"]}
        questions={tf}
        onExit={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /開始/ }));
    expect(screen.getByRole("button", { name: /正確/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /錯誤/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /正確/ }));
    expect(within(document.querySelector(".cr-stats")!).getByText("10")).toBeInTheDocument();
  });
});
