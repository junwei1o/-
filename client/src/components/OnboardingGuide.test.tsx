// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import OnboardingGuide from "./OnboardingGuide";
import { getOnboardingComplete } from "@/utils/storage";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("OnboardingGuide", () => {
  it("starts with the first guide step", () => {
    render(<OnboardingGuide />);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("歡迎來到 Academy Expedition")).toBeTruthy();
    expect(screen.getByRole("button", { name: "下一步" })).toBeTruthy();
  });

  it("allows the explorer to close the guide immediately", () => {
    render(<OnboardingGuide />);
    fireEvent.click(screen.getByRole("button", { name: "關閉新手導覽" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(getOnboardingComplete()).toBe(true);
  });

  it("closes with Escape as an interaction fallback", () => {
    render(<OnboardingGuide />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(getOnboardingComplete()).toBe(true);
  });

  it("automatically completes and closes after ten seconds", () => {
    render(<OnboardingGuide />);
    expect(screen.getByText("若暫時無法操作，此提示會在 10 秒後自動完成並關閉。")).toBeTruthy();
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(getOnboardingComplete()).toBe(true);
  });
});
