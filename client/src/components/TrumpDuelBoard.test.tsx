/** @vitest-environment jsdom */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TrumpDuelBoard from "./TrumpDuelBoard";
import { addCardToCollection } from "@/game/cardCollection";
import { ALL_CARDS } from "@/game/trumpCardData";

vi.mock("@/lib/questionBank", () => ({
  useQuestionBank: () => ({ questions: [], total: 0, isLoading: false, error: null, refetch: () => {}, source: "local", isFallback: false }),
}));

describe("TrumpDuelBoard", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("顯示開始對戰按鈕", () => {
    render(<TrumpDuelBoard />);
    expect(screen.getByRole("button", { name: /開始對戰/ })).toBeTruthy();
  });
});

describe("TrumpDuelBoard - 牌桌版面與流程", () => {
  beforeEach(() => {
    localStorage.clear();
    // 固定 Math.random 讓開局由玩家主動（turnLeader = "player"），才能斷言選屬性區
    vi.spyOn(Math, "random").mockReturnValue(0);
    ALL_CARDS.slice(0, 8).forEach((card) => addCardToCollection(card.id));
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("開局後顯示 HUD 與雙方牌堆", () => {
    render(<TrumpDuelBoard />);
    fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
    expect(screen.getByText(/回合 1 \/ 40/)).toBeTruthy();
    expect(screen.getByText("公共池 0 張")).toBeTruthy();
    expect(screen.getByText("我方")).toBeTruthy();
    expect(screen.getByText("對手")).toBeTruthy();
    expect(screen.getByText("輪到你選屬性")).toBeTruthy();
  });

  it("四個屬性按鈕齊全，點選後進入作答階段", () => {
    render(<TrumpDuelBoard />);
    fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
    const statButtons = ["威力", "知識", "速度", "稀有"].map((label) =>
      screen.getByRole("button", { name: new RegExp(`^${label}`) }),
    );
    expect(statButtons.length).toBe(4);
    fireEvent.click(statButtons[0]);
    expect(screen.getByRole("button", { name: /抽題作答/ })).toBeTruthy();
  });

  it("卡牌不足時不開局", () => {
    localStorage.clear();
    render(<TrumpDuelBoard />);
    fireEvent.click(screen.getByRole("button", { name: /開始對戰/ }));
    expect(screen.queryByText(/回合 1 \/ 40/)).toBeNull();
  });
});
