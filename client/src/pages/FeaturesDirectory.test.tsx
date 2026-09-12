// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { FeaturesDirectory } from "./FeaturesDirectory";

const setLocationMock = vi.fn();
vi.mock("wouter", () => ({
  useLocation: () => [vi.fn(), setLocationMock] as const,
}));

beforeEach(() => {
  setLocationMock.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("FeaturesDirectory 全站功能總覽", () => {
  it("渲染標題、返回按鈕與所有 4 個分組", () => {
    render(<FeaturesDirectory />);
    expect(screen.getByRole("heading", { name: "全站功能總覽", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /返回航海儀表板/ })).toBeInTheDocument();

    // 4 個分組標題
    expect(screen.getByRole("heading", { name: "學習與複習" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "探險與對戰" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "知識探索館" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "學習支援與設定" })).toBeInTheDocument();

    // 起碼一個分組裡的入口
    expect(screen.getByRole("button", { name: /課綱練習/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /主航海圖/ })).toBeInTheDocument();
  });

  it("點擊入口按鈕會跳轉到對應路由", () => {
    render(<FeaturesDirectory />);
    fireEvent.click(screen.getByRole("button", { name: /前往 課綱練習/ }));
    expect(setLocationMock).toHaveBeenCalledWith("/practice");
  });

  it("搜尋過濾只顯示符合的分組", () => {
    render(<FeaturesDirectory />);
    const input = screen.getByPlaceholderText(/例如/);
    fireEvent.change(input, { target: { value: "天文" } });

    // 命中：天文館；其他分組被過濾掉
    expect(screen.getByRole("heading", { name: "知識探索館" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /前往 天文館/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "探險與對戰" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /前往 課綱練習/ })).not.toBeInTheDocument();
  });

  it("搜尋無結果顯示提示語", () => {
    render(<FeaturesDirectory />);
    fireEvent.change(screen.getByPlaceholderText(/例如/), { target: { value: "絕對找不到的關鍵字 xyz" } });
    expect(screen.getByRole("status")).toHaveTextContent("找不到「絕對找不到的關鍵字 xyz」相關功能");
  });

  it("點擊返回按鈕跳回首頁", () => {
    render(<FeaturesDirectory />);
    fireEvent.click(screen.getByRole("button", { name: /返回航海儀表板/ }));
    expect(setLocationMock).toHaveBeenCalledWith("/");
  });

  it("調試參數按鈕跳到 settings#diagnostics", () => {
    render(<FeaturesDirectory />);
    const debugBtn = screen.getByRole("button", { name: /調試參數/ });
    fireEvent.click(debugBtn);
    expect(setLocationMock).toHaveBeenCalledWith("/settings#diagnostics");
  });
});