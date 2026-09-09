// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import TopNavigation from "@/components/TopNavigation";

const setLocation = vi.fn();

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
  useLocation: () => ["/", setLocation],
}));

describe("TopNavigation", () => {
  afterEach(() => {
    cleanup();
    setLocation.mockClear();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
  });

  it("keeps the daily kid destinations in a slim primary bar and marks the home entry active", () => {
    render(<TopNavigation />);

    const primary = screen.getByRole("navigation", { name: "主要功能選單" });
    expect(screen.getByRole("navigation", { name: "手機版核心入口" })).toBeInTheDocument();
    expect(within(primary).getByRole("button", { name: "首頁" })).toHaveAttribute("aria-current", "page");
    expect(within(primary).getByRole("button", { name: "課綱練習" })).toBeInTheDocument();
    expect(within(primary).getByRole("button", { name: "航海圖" })).toBeInTheDocument();
    expect(within(primary).getByRole("button", { name: "答題戰鬥" })).toBeInTheDocument();
    expect(within(primary).getByRole("button", { name: "每日營地" })).toBeInTheDocument();
    expect(within(primary).getByRole("button", { name: "徽章牆" })).toBeInTheDocument();
  });

  it("tucks specialist destinations behind the desktop more menu and routes them", () => {
    render(<TopNavigation />);

    // Hidden until the more menu opens.
    expect(screen.queryByRole("menuitem", { name: "天文館" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "更多功能" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "天文館" }));
    expect(setLocation).toHaveBeenCalledWith("/astronomy");
  });

  it("routes primary destinations straight from the bar", () => {
    render(<TopNavigation />);

    const primary = screen.getByRole("navigation", { name: "主要功能選單" });
    fireEvent.click(within(primary).getByRole("button", { name: "答題戰鬥" }));
    expect(setLocation).toHaveBeenCalledWith("/battle");
    setLocation.mockClear();

    fireEvent.click(within(primary).getByRole("button", { name: "每日營地" }));
    expect(setLocation).toHaveBeenCalledWith("/camp");
    setLocation.mockClear();

    fireEvent.click(within(primary).getByRole("button", { name: "徽章牆" }));
    expect(setLocation).toHaveBeenCalledWith("/badges");
  });

  it("offers a hamburger menu on mobile that reaches every destination, including the self-challenge page", () => {
    render(<TopNavigation />);

    fireEvent.click(screen.getByRole("button", { name: "開啟功能選單" }));
    const all = screen.getByRole("navigation", { name: "全部功能" });
    expect(all).toBeInTheDocument();
    fireEvent.click(within(all).getByRole("button", { name: "自我挑戰" }));
    expect(setLocation).toHaveBeenCalledWith("/community");
  });

  it("exposes a feature search that routes card-play queries to knowledge duel", () => {
    render(<TopNavigation />);

    fireEvent.click(screen.getByRole("button", { name: "搜尋功能" }));
    fireEvent.change(screen.getByPlaceholderText("搜尋戰鬥、卡牌、守護者、錯題…"), { target: { value: "卡牌" } });
    fireEvent.click(screen.getByText("知識決鬥／卡牌對戰"));

    expect(setLocation).toHaveBeenCalledWith("/knowledge-duel");
  });

  it("routes the mobile priority entries to their modes", () => {
    render(<TopNavigation />);

    const mobile = screen.getByRole("navigation", { name: "手機版核心入口" });
    fireEvent.click(within(mobile).getByRole("button", { name: "課綱練習" }));
    expect(setLocation).toHaveBeenCalledWith("/practice");
  });
});
