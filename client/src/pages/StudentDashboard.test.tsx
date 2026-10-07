// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudentDashboard from "./StudentDashboard";

// ── 模式開關：empty = 無資料空狀態；其餘 = 完整 fixture ──
const mode = vi.hoisted(() => ({ empty: false }));

const setLocation = vi.fn();
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useLocation: () => ["/student-dashboard", setLocation],
}));

// 題庫查找表：測試不載入題庫，給空 Map 即可（buildStudentDashboard 已被 mock）。
vi.mock("@/lib/questionLookup", () => ({
  useQuestionLookup: () => new Map(),
}));

// 平行 Subagent 的 lib 此刻可能尚未落地，這裡用固定 fixture 取代。
vi.mock("@/lib/studentDashboard", () => {
  const FULL = {
    captainName: "小明",
    generatedAt: 1000,
    gamification: {
      level: 5,
      levelName: "探險船長",
      nextLevelAt: 120,
      questionsToNext: 8,
      consecutiveDays: 7,
      totalAnswers: 42,
      badges: [
        { id: "b1", name: "初出茅廬", icon: "🧭", unlocked: true, condition: "完成 1 題" },
        { id: "b2", name: "七日不斷", icon: "🔥", unlocked: false, condition: "連續登入 7 天" },
      ],
    },
    overallAccuracy: 80,
    bySubject: [],
    weekly: {
      currentAccuracy: 75,
      previousAccuracy: 60,
      delta: 15,
      currentAttempts: 10,
      previousAttempts: 8,
    },
    strengths: [
      {
        knowledge: "分數加減",
        confidence: 90,
        attempts: 12,
        status: "mastered",
        reliable: true,
        message: "你把分數加減掌握得很好！",
      },
    ],
    focusAreas: [
      {
        knowledge: "因數倍數",
        confidence: 40,
        attempts: 3,
        status: "unstable",
        reliable: true,
        message: "這塊還可以再加油喔",
        hint: "先複習因數的基本定義",
      },
      {
        knowledge: "長度換算",
        confidence: null,
        attempts: 0,
        status: "blindspot",
        reliable: false,
        message: "多練幾次就會更熟練",
        hint: "從最基本的公分換算看看",
      },
    ],
    wrongBook: { total: 5, graduated: 1, bySubject: [] },
    todayTasks: [
      {
        id: "t1",
        kind: "wrong-book",
        knowledge: "因數倍數",
        questionCount: 3,
        questionIds: ["a", "b", "c"],
        estimatedMinutes: 6,
        reason: "之前錯過的題目再練一次",
        reward: "10 金幣",
        reliability: "ok",
        completed: false,
      },
      {
        id: "t2",
        kind: "knowledge",
        knowledge: "長度換算",
        questionCount: 5,
        questionIds: ["d"],
        estimatedMinutes: 10,
        reason: "題目蒐集中，先幫你留位置",
        reward: undefined,
        reliability: "building",
        completed: false,
      },
      {
        id: "t3",
        kind: "challenge",
        questionCount: 10,
        questionIds: [],
        estimatedMinutes: 15,
        reason: "自我挑戰加強練習",
        reward: "20 金幣",
        reliability: "ok",
        completed: true,
      },
    ],
    hasAnyData: true,
  };

  const EMPTY = {
    captainName: "小明",
    generatedAt: 1000,
    gamification: {
      level: 1,
      levelName: "見習航海士",
      nextLevelAt: 100,
      questionsToNext: 100,
      consecutiveDays: 0,
      totalAnswers: 0,
      badges: [],
    },
    overallAccuracy: null,
    bySubject: [],
    weekly: {
      currentAccuracy: null,
      previousAccuracy: null,
      delta: null,
      currentAttempts: 0,
      previousAttempts: 0,
    },
    strengths: [],
    focusAreas: [],
    wrongBook: { total: 0, graduated: 0, bySubject: [] },
    todayTasks: [],
    hasAnyData: false,
  };

  return {
    buildStudentDashboard: () => (mode.empty ? EMPTY : FULL),
  };
});

// localStorage：Map 實作（參考 HomeDashboard.test.tsx）
const storage = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => storage.clear(),
});

describe("學生診斷儀表板", () => {
  afterEach(() => {
    cleanup();
    storage.clear();
    setLocation.mockClear();
    mode.empty = false;
  });

  it("無資料時顯示正向空狀態，仍可看到等級／連續天數，並有前往練習的按鈕", () => {
    mode.empty = true;
    render(<StudentDashboard />);

    expect(screen.getByText("還沒有學習紀錄，先出發練習吧！")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /開始第一次練習/ })).toBeInTheDocument();
    // 等級與連續天數在空狀態仍顯示
    expect(screen.getByText(/等級 1/)).toBeInTheDocument();
    expect(screen.getByText(/連續 0 天/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /開始第一次練習/ }));
    expect(setLocation).toHaveBeenCalledWith("/practice");
  });

  it("正常資料下正確呈現船長名、連續天數、等級與整體正確率", () => {
    render(<StudentDashboard />);

    expect(screen.getByText("學生診斷儀表板")).toBeInTheDocument();
    expect(screen.getByText(/船長：小明/)).toBeInTheDocument();
    // 頂列晶片與連續天數祝賀語都會出現「連續 7 天」
    expect(screen.getAllByText(/連續 7 天/).length).toBeGreaterThan(0);
    expect(screen.getByText(/等級 5・探險船長/)).toBeInTheDocument();

    // 整體正確率 80% 進度條
    const bar = screen.getByRole("progressbar", { name: "整體答題正確率" });
    expect(bar).toHaveAttribute("aria-valuenow", "80");
    expect(screen.getByText(/整體正確率 80%/)).toBeInTheDocument();

    // 本週 vs 上週：75% vs 60%，delta +15 顯示 ↑
    expect(screen.getByText(/本週正確率/)).toBeInTheDocument();
    expect(screen.getByText(/上週正確率/)).toBeInTheDocument();
    expect(screen.getByText(/↑ \+15%/)).toBeInTheDocument();

    // 強項與需要加油（因數倍數同時出現在任務卡與需要加油，用 getAllByText）
    expect(screen.getByText("分數加減")).toBeInTheDocument();
    expect(screen.getAllByText("因數倍數").length).toBeGreaterThan(0);
    expect(screen.getByText(/先複習因數的基本定義/)).toBeInTheDocument();

    // 徽章牆：已解鎖有名稱，未解鎖有條件
    expect(screen.getByText("初出茅廬")).toBeInTheDocument();
    expect(screen.getByText(/連續登入 7 天/)).toBeInTheDocument();
  });

  it("建置中的任務卡標示「建置中」且按鈕 disabled；可開始的錯題任務導向 /wrong-answers", () => {
    render(<StudentDashboard />);

    // t2：reliability === "building"
    const buildingCards = screen.getAllByText("建置中");
    expect(buildingCards.length).toBeGreaterThan(0);

    // 「長度換算」建置中卡的開始鈕 disabled
    const buildingBtn = screen
      .getAllByRole("button", { name: "建置中" })
      .find((btn) => btn.closest("li")?.textContent?.includes("長度換算"));
    expect(buildingBtn).toBeDefined();
    expect(buildingBtn).toBeDisabled();

    // t1：wrong-book 可開始 → /wrong-answers
    const startWrong = screen
      .getAllByRole("button", { name: "開始" })
      .find((btn) => btn.closest("li")?.textContent?.includes("因數倍數"));
    expect(startWrong).toBeDefined();
    expect(startWrong).not.toBeDisabled();
    fireEvent.click(startWrong!);
    expect(setLocation).toHaveBeenCalledWith("/wrong-answers");

    // t3：已完成 → 按鈕 disabled 且文字「已完成」
    const doneBtn = screen.getByRole("button", { name: "已完成" });
    expect(doneBtn).toBeDisabled();
  });

  it("全程不出現負面字眼（你很差／你不會）", () => {
    render(<StudentDashboard />);
    const text = document.body.textContent ?? "";
    expect(text).not.toContain("你很差");
    expect(text).not.toContain("你不會");
    expect(text).not.toContain("很差");
  });

  it("隱私：畫面只呈現自己的資料，不含其他學生姓名", () => {
    render(<StudentDashboard />);
    const text = document.body.textContent ?? "";
    expect(text).toContain("小明");
    // fixture 刻意不放其他學生姓名；這類名字不得出現在畫面
    expect(text).not.toContain("老王");
    expect(text).not.toContain("小雅");
  });
});
