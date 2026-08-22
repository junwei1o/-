// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsConsentPrompt } from "./AnalyticsConsentPrompt";
import { getAnalyticsConsent } from "@/utils/storage";

const storage = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
});

describe("AnalyticsConsentPrompt", () => {
  beforeEach(() => {
    storage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("顯示遞減倒數，十秒後儲存暫不分享並關閉", async () => {
    render(<AnalyticsConsentPrompt />);

    expect(screen.getByText("將在 10 秒後自動關閉。")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(screen.getByText("將在 9 秒後自動關閉。")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(9_000));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(getAnalyticsConsent()).toBe("declined");
  });

  it("提供獨立的關閉按鈕並保存暫不分享", () => {
    render(<AnalyticsConsentPrompt />);
    fireEvent.click(screen.getByRole("button", { name: "關閉一起改善探險體驗提示" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(getAnalyticsConsent()).toBe("declined");
  });
});
