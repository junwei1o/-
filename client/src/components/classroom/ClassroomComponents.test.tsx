// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FillBlank from "./FillBlank";
import OrderSteps from "./OrderSteps";
import QuizRunner, { type RunnerQuestion } from "./QuizRunner";
import RushRunner from "./RushRunner";
import FactorGame from "./FactorGame";
import MeteorGame from "./MeteorGame";
import { buildFactorRounds, buildMeteorWaves } from "@/lib/classroomBank";
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

describe("FactorGame 因數探險", () => {
  it("開始後顯示神祕數字與數字泡泡，未選時確認鈕停用", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<FactorGame onExit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "開始探險" }));

    expect(document.querySelector(".fc-n")?.textContent).toBeTruthy();
    expect(document.querySelectorAll(".fc-bubble").length).toBeGreaterThanOrEqual(8);
    expect(screen.getByRole("button", { name: /確認找出的因數/ })).toBeDisabled();

    fireEvent.click(document.querySelectorAll(".fc-bubble")[0]);
    expect(screen.getByRole("button", { name: /確認找出的因數/ })).not.toBeDisabled();
    vi.restoreAllMocks();
  });

  it("五關全部選對因數，結算三顆星並回報最佳紀錄", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const rounds = buildFactorRounds(5, () => 0.5);
    const onBest = vi.fn();
    render(<FactorGame onExit={() => {}} onBest={onBest} />);
    fireEvent.click(screen.getByRole("button", { name: "開始探險" }));

    for (let r = 0; r < rounds.length; r += 1) {
      for (const factor of rounds[r].factors) {
        fireEvent.click(screen.getByRole("button", { name: String(factor) }));
      }
      fireEvent.click(screen.getByRole("button", { name: /確認找出的因數/ }));
      expect(screen.getByText(/個因數全部找齊/)).toBeInTheDocument();
      // 因數兩兩成對都要列出，乘起來等於 n
      expect(document.querySelectorAll(".fc-pair").length).toBe(rounds[r].pairs.length);
      if (r < rounds.length - 1) {
        fireEvent.click(screen.getByRole("button", { name: /前進下一關/ }));
      } else {
        fireEvent.click(screen.getByRole("button", { name: /看探險結果/ }));
      }
    }

    expect(screen.getByText(/完美過關 5 \/ 5 關/)).toBeInTheDocument();
    expect(screen.getByText("★★★")).toBeInTheDocument();
    expect(onBest).toHaveBeenCalledWith(expect.objectContaining({ stars: 3, correct: 5, total: 5 }));
    vi.restoreAllMocks();
  });

  it("誤選干擾、漏選因數時標紅/標金，並提示漏掉數量", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const rounds = buildFactorRounds(5, () => 0.5);
    render(<FactorGame onExit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "開始探險" }));

    // 只點一個干擾項（保證不是因數）
    const distractor = rounds[0].distractors[0];
    fireEvent.click(screen.getByRole("button", { name: String(distractor) }));
    fireEvent.click(screen.getByRole("button", { name: /確認找出的因數/ }));

    const wrong = document.querySelector(".fc-bubble.is-wrong");
    expect(wrong?.textContent).toContain(String(distractor));
    expect(document.querySelectorAll(".fc-bubble.is-miss").length).toBe(rounds[0].factors.length);
    expect(screen.getByText(/漏掉/)).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("30 秒時間到自動揭曉因數成對解答", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<FactorGame onExit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "開始探險" }));
    expect(screen.queryByText(/因數兩兩成對/)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30_500);
    });

    expect(screen.getByText(/時間到/)).toBeInTheDocument();
    expect(screen.getByText(/因數兩兩成對/)).toBeInTheDocument();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
});

describe("MeteorGame 倍數防衛戰", () => {
  it("攔截目標倍數加分回能，誤觸非倍數扣能", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const waves = buildMeteorWaves(3, () => 0.5);
    render(<MeteorGame onExit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "開始防衛" }));

    // 快進讓前兩顆隕石登場（尚未落地：首顆 600ms 出現、約 5100ms 才落地）
    act(() => { vi.advanceTimersByTime(3200); });
    const energyNum = () => Number(document.querySelector(".md-energy-num")?.textContent);
    const scoreNum = () => Number(document.querySelector(".md-score")?.textContent);
    expect(energyNum()).toBe(15);
    expect(scoreNum()).toBe(0);

    const firstTwo = waves[0].meteors.slice(0, 2);
    const target = firstTwo.find((m) => m.isTarget)!;
    const decoy = firstTwo.find((m) => !m.isTarget)!;
    expect(target && decoy).toBeTruthy();

    // 攔截目標：+10 分、能源回滿上限
    fireEvent.click(screen.getByRole("button", { name: `隕石 ${target.value}` }));
    expect(scoreNum()).toBe(10);
    expect(energyNum()).toBe(15);
    expect(screen.queryByRole("button", { name: `隕石 ${target.value}` })).not.toBeInTheDocument();

    // 誤觸干擾：−1 能量、出現提示（波次倍數隨機，正則動態組）
    fireEvent.click(screen.getByRole("button", { name: `隕石 ${decoy.value}` }));
    expect(energyNum()).toBe(14);
    expect(screen.getByText(new RegExp(`不是 ${waves[0].multipleOf} 的倍數`))).toBeInTheDocument();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("目標隕石漏接扣 2 能量並出現提示", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const waves = buildMeteorWaves(3, () => 0.5);
    render(<MeteorGame onExit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "開始防衛" }));

    const first = waves[0].meteors[0];
    // 快進超過第一顆的出現＋落地時間，不點它
    act(() => { vi.advanceTimersByTime(first.delayMs + first.durationMs + 600); });
    if (first.isTarget) {
      expect(document.querySelector(".md-energy-num")?.textContent).toBe("13");
      expect(screen.getByText(/漏接目標隕石/)).toBeInTheDocument();
    } else {
      // 干擾隕石落地無事
      expect(document.querySelector(".md-energy-num")?.textContent).toBe("15");
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("三波全攔截、零失誤撐完，結算三顆星並回報最佳紀錄", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const waves = buildMeteorWaves(3, () => 0.5);
    const onBest = vi.fn();
    render(<MeteorGame onExit={() => {}} onBest={onBest} />);
    fireEvent.click(screen.getByRole("button", { name: "開始防衛" }));

    for (let w = 0; w < waves.length; w += 1) {
      const wave = waves[w];
      let elapsed = 0; // beginWave 會重置波內時鐘
      for (const meteor of wave.meteors) {
        act(() => { vi.advanceTimersByTime(meteor.delayMs - elapsed + 200); });
        elapsed = meteor.delayMs + 200;
        if (meteor.isTarget) {
          fireEvent.click(screen.getByRole("button", { name: `隕石 ${meteor.value}` }));
        }
      }
      // 快進到本波結束
      act(() => { vi.advanceTimersByTime(42_000 - elapsed + 500); });
      if (w < waves.length - 1) {
        expect(screen.getByText(/個位數特徵小筆記/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /迎接下一波/ }));
      }
    }

    expect(screen.getByText("★★★")).toBeInTheDocument();
    expect(screen.getByText(/全程零失誤/)).toBeInTheDocument();
    expect(onBest).toHaveBeenCalledWith(expect.objectContaining({ stars: 3, correct: 21, total: 21 }));
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("能源歸零提前結束，顯示基地能源耗盡", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const waves = buildMeteorWaves(3, () => 0.5);
    render(<MeteorGame onExit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "開始防衛" }));

    // 持續快進並點掉每一顆干擾隕石（−1）＋讓目標隕石全部漏接（−2×7）→ 能源必歸零
    const decoyValues = new Set(waves[0].meteors.filter((m) => !m.isTarget).map((m) => m.value));
    for (let t = 0; t < 120 && document.querySelector(".md-field"); t += 1) {
      act(() => { vi.advanceTimersByTime(500); });
      for (const button of Array.from(document.querySelectorAll(".md-meteor"))) {
        const value = Number((button.getAttribute("aria-label") ?? "").replace("隕石 ", ""));
        if (decoyValues.has(value)) fireEvent.click(button);
      }
    }
    expect(screen.getByText(/基地能源耗盡/)).toBeInTheDocument();
    expect(screen.getByText(/獲得了 0 分/)).toBeInTheDocument();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
});
