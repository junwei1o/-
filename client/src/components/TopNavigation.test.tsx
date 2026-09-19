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

describe("TopNavigation（22 入口 → 7 → 5 頂層，P1 導航收斂）", () => {
  afterEach(() => {
    cleanup();
    setLocation.mockClear();
    currentPath = "/";
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
  });

  it("primary bar 只放五個頂層入口，首頁預設 active", () => {
    render(<TopNavigation />);

    const primary = screen.getByRole("navigation", { name: "主要功能選單" });
    expect(screen.getByRole("navigation", { name: "手機版核心入口" })).toBeInTheDocument();
    expect(within(primary).getByRole("button", { name: "首頁" })).toHaveAttribute("aria-current", "page");
    for (const label of ["我的教室", "學習歷程", "藏寶圖", "設定"]) {
      expect(within(primary).getByRole("button", { name: label })).toBeInTheDocument();
    }
    // P1 收斂：今日遠征併入我的教室、知識展廳併入藏寶圖，不再各自佔頂層按鈕。
    expect(within(primary).queryByRole("button", { name: "今日遠征" })).not.toBeInTheDocument();
    expect(within(primary).queryByRole("button", { name: "知識展廳" })).not.toBeInTheDocument();
    // 22 個舊入口不再各自佔一個頂層按鈕。
    expect(within(primary).queryByRole("button", { name: "課綱練習" })).not.toBeInTheDocument();
    expect(within(primary).queryByRole("button", { name: "天文館" })).not.toBeInTheDocument();
  });

  it("五個頂層入口各自導向 Hub 頁", () => {
    render(<TopNavigation />);

    const primary = screen.getByRole("navigation", { name: "主要功能選單" });
    const cases: Array<[string, string]> = [
      ["我的教室", "/quiz-room"],
      ["學習歷程", "/learning"],
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
    expect(within(primary).getByRole("button", { name: "我的教室" })).toHaveAttribute("aria-current", "page");
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
    cleanup();

    // P1 收斂歸併：今日遠征深層頁標記我的教室、知識展廳深層頁標記藏寶圖。
    currentPath = "/expedition";
    render(<TopNavigation />);
    const primary4 = screen.getByRole("navigation", { name: "主要功能選單" });
    expect(within(primary4).getByRole("button", { name: "我的教室" })).toHaveAttribute("aria-current", "page");
    cleanup();

    currentPath = "/gallery";
    render(<TopNavigation />);
    const primary5 = screen.getByRole("navigation", { name: "主要功能選單" });
    expect(within(primary5).getByRole("button", { name: "藏寶圖" })).toHaveAttribute("aria-current", "page");
  });

  it("卡牌決鬥已下架，搜尋卡牌只會顯示找不到提示", () => {
    render(<TopNavigation />);

    fireEvent.click(screen.getByRole("button", { name: "搜尋功能" }));
    fireEvent.change(screen.getByPlaceholderText("搜尋戰鬥、演練、錯題…"), { target: { value: "卡牌" } });

    expect(screen.queryByText("知識決鬥／卡牌對戰")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("找不到");
  });

  it("手機選單展開五個頂層入口並可導向", () => {
    render(<TopNavigation />);

    fireEvent.click(screen.getByRole("button", { name: "開啟功能選單" }));
    const all = screen.getByRole("navigation", { name: "全部功能" });
    expect(within(all).getByRole("button", { name: "我的教室" })).toBeInTheDocument();
    expect(within(all).queryByRole("button", { name: "今日遠征" })).not.toBeInTheDocument();
    fireEvent.click(within(all).getByRole("button", { name: "藏寶圖" }));
    expect(setLocation).toHaveBeenCalledWith("/treasure");
  });

  it("手機底部快捷：首頁／我的教室／學習歷程／藏寶圖", () => {
    render(<TopNavigation />);

    const mobile = screen.getByRole("navigation", { name: "手機版核心入口" });
    fireEvent.click(within(mobile).getByRole("button", { name: "藏寶圖" }));
    expect(setLocation).toHaveBeenCalledWith("/treasure");
    setLocation.mockClear();
    fireEvent.click(within(mobile).getByRole("button", { name: "學習歷程" }));
    expect(setLocation).toHaveBeenCalledWith("/learning");
  });
});
