// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("places the dashboard, regular paper, self-centered map and specialist destinations in an accessible top-level menu", () => {
    render(<TopNavigation />);

    expect(screen.getByRole("navigation", { name: "主要功能選單" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "手機版核心入口" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(15);
    expect(screen.getByText("台灣學習航海儀表板")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "搜尋功能" })).toHaveTextContent("搜尋功能");
    expect(screen.getByRole("button", { name: "知識決鬥" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "航海儀表板" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "試卷" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "陪讀摘要" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "探險日誌" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "設定" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "航海儀表板" })[0]).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("button", { name: "探險" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "學習" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "戰鬥" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "陪讀摘要" })[0]).not.toHaveAttribute("aria-current");
  });

  it("exposes a feature search that routes card-play queries to knowledge duel", () => {
    render(<TopNavigation />);

    fireEvent.click(screen.getByRole("button", { name: "搜尋功能" }));
    fireEvent.change(screen.getByPlaceholderText("搜尋戰鬥、卡牌、守護者、錯題…"), { target: { value: "卡牌" } });
    fireEvent.click(screen.getByText("知識決鬥／卡牌對戰"));

    expect(setLocation).toHaveBeenCalledWith("/knowledge-duel");
  });

  it("routes the mobile priority knowledge duel entry to the duel mode", () => {
    render(<TopNavigation />);

    fireEvent.click(screen.getByRole("button", { name: "知識決鬥" }));

    expect(setLocation).toHaveBeenCalledWith("/knowledge-duel");
  });

  it("routes specialist menu items to their dedicated knowledge pages", () => {
    render(<TopNavigation />);

    fireEvent.click(screen.getAllByRole("button", { name: "天文館" })[0]);
    expect(setLocation).toHaveBeenCalledWith("/astronomy");
  });

  it("opens the student-centered relationship map from the primary navigation", () => {
    render(<TopNavigation />);

    fireEvent.click(screen.getAllByRole("button", { name: "我的地圖" })[0]);
    expect(setLocation).toHaveBeenCalledWith("/map");
  });
});
