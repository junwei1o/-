// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LearningHub from "./LearningHub";

const setLocation = vi.fn();

vi.mock("wouter", () => ({ useLocation: () => ["/", setLocation] }));

describe("LearningHub 學習歷程", () => {
  afterEach(() => {
    cleanup();
    setLocation.mockClear();
  });

  it("預設顯示「我的成績」Tab 並可切換視角", () => {
    render(<LearningHub />);
    expect(screen.getByRole("heading", { name: /學習歷程/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /學習洞察/ }));
    expect(setLocation).toHaveBeenCalledWith("/learning-insights");
    setLocation.mockClear();

      fireEvent.click(screen.getByRole("tab", { name: "錯題本" }));
      fireEvent.click(screen.getByRole("button", { name: /今日複習中心/ }));
      expect(setLocation).toHaveBeenCalledWith("/review-hub");
      setLocation.mockClear();

      // 2026-10-03：「家長報告／陪讀專區」已隨 /learning-summary 移入站長專屬（有守衛），
      // 前台 Tab 與入口一併移除——斷言它們確實不存在，防止回歸。
      expect(screen.queryByRole("tab", { name: "家長報告" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /陪讀專區/ })).not.toBeInTheDocument();
    });
  });
