/** @vitest-environment jsdom */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Tavern from "./Tavern";
import { CARD_COLLECTION_KEY } from "@/game/cardCollection";
import { STARTER_KEY } from "@/game/tavernKeeper";

const setLocation = vi.fn();
vi.mock("wouter", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
  useLocation: () => ["/tavern", setLocation],
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), warning: vi.fn(), message: vi.fn() } }));

describe("Tavern page", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("顯示酒館招牌與金幣", () => {
    render(<Tavern />);
    expect(screen.getByRole("heading", { name: "燈塔酒館" })).toBeTruthy();
    expect(screen.getByLabelText("金幣")).toBeTruthy();
  });

  it("渲染四個場景熱點：牌桌、佈告欄、壁爐角、稱號牆", () => {
    render(<Tavern />);
    expect(screen.getByRole("button", { name: /牌桌/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /佈告欄/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /壁爐角/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /稱號牆/ })).toBeTruthy();
  });

  it("老闆吧檯熱點可點開面板", () => {
    render(<Tavern />);
    const counter = screen.getByLabelText("老闆吧檯");
    fireEvent.click(counter);
    expect(screen.getByRole("dialog", { name: "吧檯老闆" })).toBeTruthy();
  });

  it("吧檯面板可按 Esc 關閉", () => {
    render(<Tavern />);
    fireEvent.click(screen.getByLabelText("老闆吧檯"));
    expect(screen.getByRole("dialog", { name: "吧檯老闆" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "吧檯老闆" })).toBeNull();
  });

  it("顯示下一步目標提示", () => {
    render(<Tavern />);
    // 新玩家未簽到 → 提示去簽到（新手贈卡氣泡同樣是 status，故用 getAllByRole）
    const statuses = screen.getAllByRole("status").map((el) => el.textContent ?? "");
    expect(statuses.some((text) => text.includes("簽到"))).toBe(true);
  });

  it("吧檯面板的簽到按鈕可開啟每日簽到視窗", () => {
    render(<Tavern />);
    fireEvent.click(screen.getByLabelText("老闆吧檯"));
    const signInButton = screen.getByRole("button", { name: /領取今日/ });
    fireEvent.click(signInButton);
    expect(screen.getByRole("dialog", { name: /留下今天的探險足跡/ })).toBeTruthy();
  });

  it("首次進入自動贈送新手卡並寫入一次性標記", () => {
    render(<Tavern />);
    expect(localStorage.getItem(STARTER_KEY)).toBe("1");
    const raw = localStorage.getItem(CARD_COLLECTION_KEY);
    expect(raw).toBeTruthy();
    const collection = JSON.parse(raw!);
    expect(collection.ownedCardIds.length).toBeGreaterThanOrEqual(5);
  });

  it("已有標記時不重複贈送", () => {
    localStorage.setItem(STARTER_KEY, "1");
    render(<Tavern />);
    const raw = localStorage.getItem(CARD_COLLECTION_KEY);
    expect(raw).toBeNull();
  });
});
