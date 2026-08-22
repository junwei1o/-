// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudentMap from "@/pages/StudentMap";

const setLocation = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/map", setLocation],
}));

vi.mock("@/game/rpgStorage", () => ({
  loadRpgState: () => ({
    activeCompanionId: "starling",
    companions: [{ id: "starling", name: "星芽" }],
    answeredEventIds: ["q-1", "q-2"],
    correctAnswerCount: 2,
    animeWorldviewProgress: {
      nailong: { attempts: 1, lastCorrect: 4, bestCorrect: 4, total: 5, completedAt: 1 },
    },
  }),
}));

vi.mock("@/game/todayLearningGuide", () => ({
  getTodayLearningGuide: () => ({
    kind: "due-review",
    eyebrow: "TODAY'S BEST START",
    title: "先收回待複習的記憶",
    description: "有 2 題曾經答錯的題目已到複習時間。",
    reason: "這是依你先前的實際作答與間隔複習排程整理，不代表能力評價。",
    progressPreview: "完成後，這張試卷的實際作答會更新複習排程；答對會延後下次複習。",
    actionLabel: "開始複習試卷",
  }),
}));

describe("StudentMap", () => {
  afterEach(() => {
    cleanup();
    setLocation.mockClear();
  });

  it("uses the learner as the central node and only reads local learning progress", () => {
    render(<StudentMap />);

    expect(screen.getByRole("main")).toHaveTextContent("先從「我」出發");
    expect(screen.getByLabelText("我的學習中心，目前第 1 級，已完成 2 題，整體進度 10%")).toBeInTheDocument();
    expect(screen.getByText("這張地圖只呈現此裝置上的學習進度；不會公開個人資料。")).toBeInTheDocument();
    expect(screen.getByLabelText("動漫觀測探索進度，已完成 1 / 3 站，整體完成度 33%")).toBeInTheDocument();
    expect(screen.getByText("最佳 4／5 題")).toBeInTheDocument();
  });

  it("connects the relationship puzzle to existing learning and companion routes", () => {
    render(<StudentMap />);

    fireEvent.click(screen.getByRole("button", { name: /直接開始試卷/ }));
    expect(setLocation).toHaveBeenLastCalledWith("/practice");
    fireEvent.click(screen.getByRole("button", { name: /探索天文館/ }));
    expect(setLocation).toHaveBeenLastCalledWith("/astronomy");
    fireEvent.click(screen.getByRole("button", { name: /常規試卷：/ }));
    expect(setLocation).toHaveBeenLastCalledWith("/practice");
    fireEvent.click(screen.getByRole("button", { name: /夥伴遠征：/ }));
    expect(setLocation).toHaveBeenLastCalledWith("/battle");
    fireEvent.click(screen.getByRole("button", { name: /我是奶龍：最佳 4／5 題/ }));
    expect(setLocation).toHaveBeenLastCalledWith("/observatory/nailong");
  });

  it("shows an explainable today guide and opens its recommended starting point", () => {
    render(<StudentMap />);

    expect(screen.getByRole("heading", { name: "今天最推薦從哪一塊開始？" })).toBeInTheDocument();
    expect(screen.getByText("先收回待複習的記憶")).toBeInTheDocument();
    expect(screen.getByText(/不代表能力評價/)).toBeInTheDocument();
    expect(screen.getByLabelText("完成後可獲得的進度預告")).toHaveTextContent("更新複習排程");
    fireEvent.click(screen.getByRole("button", { name: "開始複習試卷" }));
    expect(setLocation).toHaveBeenLastCalledWith("/practice");
  });
});
