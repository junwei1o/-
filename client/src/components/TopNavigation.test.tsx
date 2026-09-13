// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import TopNavigation from "@/components/TopNavigation";

const setLocation = vi.fn();
let currentPath = "/";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

vi.mock("wouter", () => ({
  useLocation: () => [currentPath, setLocation],
}));

describe("TopNavigation（22 入口 → 7 頂層）", () => {
  afterEach(() => {
    cleanup();
    setLocation.mockClear();
    currentPath = "/";
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
  });

  it("primary bar 只放七個頂層入口，首頁預設 active", () => {
    render(<TopNavigation />);

    const primary = screen.getByRole("navigation", { name: "主要功能選單" });
    expect(screen.getByRole("navigation", { name: "手機版核心入口" })).toBeInTheDocument();
    expect(within(primary).getByRole("button", { name: "首頁" })).toHaveAttribute("aria-current", "page");
    for (const label of ["答題室", "今日遠征", "學習歷程", "知識展廳", "藏寶圖", "設定"]) {
      expect(within(primary).getByRole("button", { name: label })).toBeInTheDocument();
    }
    // 22 個舊入口不再各自佔一個頂層按鈕。
    expect(within(primary).queryByRole("button", { name: "課綱練習" })).not.toBeInTheDocument();
    expect(within(primary).queryByRole("button", { name: "天文館" })).not.toBeInTheDocument();
  });

  it("七個頂層入口各自導向 Hub 頁", () => {
    render(<TopNavigation />);

    const primary = screen.getByRole("navigation", { name: "主要功能選單" });
    const cases: Array<[string, string]> = [
      ["答題室", "/quiz-room"],
      ["今日遠征", "/expedition"],
      ["學習歷程", "/learning"],
      ["知識展廳", "/gallery"],
      ["藏寶圖", "/treasure"],
      ["設定", "/settings"],
    ];
    for (const [label, href] of cases) {
      setLocation.mockClear();
      fireEvent.click(within(primary).getByRole("button", { name: label }));
      expect(setLocation).toHaveBeenCalledWith(href);
    }
  });

  it("深層頁面會標記所屬的頂層入口為 active", () => {
    currentPath = "/battle";
    render(<TopNavigation />);
    const primary = screen.getByRole("navigation", { name: "主要功能選單" });
    expect(within(primary).getByRole("button", { name: "答題室" })).toHaveAttribute("aria-current", "page");
    cleanup();

    currentPath = "/learning-summary";
    render(<TopNavigation />);
    const primary2 = screen.getByRole("navigation", { name: "主要功能選單" });
    expect(within(primary2).getByRole("button", { name: "學習歷程" })).toHaveAttribute("aria-current", "page");
    cleanup();

    currentPath = "/map";
    render(<TopNavigation />);
    const primary3 = screen.getByRole("navigation", { name: "主要功能選單" });
    expect(within(primary3).getByRole("button", { name: "首頁" })).toHaveAttribute("aria-current", "page");
  });

  it("exposes a feature search that routes card-play queries to knowledge duel", () => {
    render(<TopNavigation />);

    fireEvent.click(screen.getByRole("button", { name: "搜尋功能" }));
    fireEvent.change(screen.getByPlaceholderText("搜尋戰鬥、卡牌、守護者、錯題…"), { target: { value: "卡牌" } });
    fireEvent.click(screen.getByText("知識決鬥／卡牌對戰"));

    expect(setLocation).toHaveBeenCalledWith("/knowledge-duel");
  });

  it("手機選單展開七個頂層入口並可導向", () => {
    render(<TopNavigation />);

    fireEvent.click(screen.getByRole("button", { name: "開啟功能選單" }));
    const all = screen.getByRole("navigation", { name: "全部功能" });
    expect(within(all).getByRole("button", { name: "答題室" })).toBeInTheDocument();
    fireEvent.click(within(all).getByRole("button", { name: "知識展廳" }));
    expect(setLocation).toHaveBeenCalledWith("/gallery");
  });

  it("手機底部快捷：首頁／答題室／今日遠征／學習歷程", () => {
    render(<TopNavigation />);

    const mobile = screen.getByRole("navigation", { name: "手機版核心入口" });
    fireEvent.click(within(mobile).getByRole("button", { name: "今日遠征" }));
    expect(setLocation).toHaveBeenCalledWith("/expedition");
    setLocation.mockClear();
    fireEvent.click(within(mobile).getByRole("button", { name: "學習歷程" }));
    expect(setLocation).toHaveBeenCalledWith("/learning");
  });
});
