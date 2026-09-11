/** @vitest-environment jsdom */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CardCollection from "./CardCollection";
import { addCardToCollection, getCardCollection, recordCardDuelResult } from "@/game/cardCollection";
import { ALL_CARDS } from "@/game/trumpCardData";

const setLocation = vi.fn();
vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
  useLocation: () => ["/tavern/collection", setLocation],
}));

describe("CardCollection（卡冊）", () => {
  beforeEach(() => {
    localStorage.clear();
    // 收集前 5 張（覆蓋不同主題與稀有度）
    ALL_CARDS.slice(0, 5).forEach((card) => addCardToCollection(card.id));
    recordCardDuelResult("victory");
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("顯示收集進度與對戰統計", () => {
    render(<CardCollection />);
    // 進度以 meter 的 aria 值斷言（數字 5 在屬性數值中重複出現，不用 getByText）
    expect(screen.getByRole("meter", { name: "卡牌收集進度" })).toHaveAttribute("aria-valuenow", "5");
    expect(screen.getByRole("meter", { name: "卡牌收集進度" })).toHaveAttribute("aria-valuemax", String(ALL_CARDS.length));
    expect(screen.getByText(/1勝 0敗 0和/)).toBeTruthy();
  });

  it("四個主題分組與已收集/未收集卡並存", () => {
    render(<CardCollection />);
    for (const theme of ["國語", "數學", "社會", "自然"]) {
      expect(screen.getByRole("heading", { name: new RegExp(`^${theme}`) })).toBeTruthy();
    }
    // 已收集卡顯示卡名；未收集卡顯示「未收集」與取得提示
    expect(screen.getByText("詩仙李白")).toBeTruthy();
    const locked = screen.getAllByText("未收集");
    expect(locked.length).toBe(ALL_CARDS.length - 5);
    expect(screen.getAllByText(/開卡包／牌局掉落|開卡包／完成冒險/).length).toBe(ALL_CARDS.length - 5);
  });

  it("全部收集時顯示完成訊息", () => {
    ALL_CARDS.forEach((card) => addCardToCollection(card.id));
    render(<CardCollection />);
    expect(screen.getByText(/卡冊完成/)).toBeTruthy();
    expect(screen.queryByText("未收集")).toBeNull();
  });

  it("空收藏時顯示引導", () => {
    localStorage.clear();
    render(<CardCollection />);
    expect(screen.getByRole("button", { name: "前往酒館" })).toBeTruthy();
    expect(screen.queryByText("未收集")).toBeNull();
  });
});
