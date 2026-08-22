// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./SpeechReadButton", () => ({
  SpeechReadButton: ({ onProgressChange }: { onProgressChange?: (progress: { charIndex: number; charLength: number } | null) => void }) => (
    <button type="button" onClick={() => onProgressChange?.({ charIndex: 4, charLength: 1 })}>模擬朗讀進度</button>
  ),
}));

import { SpeechReadableText } from "./SpeechReadableText";

describe("SpeechReadableText", () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    scrollIntoView.mockReset();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn(() => ({ matches: false })),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("highlights only the sentence containing the current speech boundary", () => {
    render(<SpeechReadableText as="p" text="第一句。第二句。" label="測試文字" />);

    expect(screen.getByText("第一句。")).not.toHaveAttribute("aria-current", "true");
    expect(screen.getByText("第二句。")).not.toHaveAttribute("aria-current", "true");

    fireEvent.click(screen.getByRole("button", { name: "模擬朗讀進度" }));

    expect(screen.getByText("第一句。")).not.toHaveAttribute("aria-current", "true");
    expect(screen.getByText("第二句。")).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("第二句。")).toHaveClass("is-active");
  });

  it("only scrolls the active sentence when it has left the comfortable viewport", () => {
    render(<SpeechReadableText as="p" text="第一句。第二句。" label="測試文字" />);
    const activeSentence = screen.getByText("第二句。");
    Object.defineProperty(activeSentence, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ top: 900, bottom: 928 }),
    });

    fireEvent.click(screen.getByRole("button", { name: "模擬朗讀進度" }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest", inline: "nearest" });
  });

  it("does not disrupt manual reading while the active sentence remains visible", () => {
    render(<SpeechReadableText as="p" text="第一句。第二句。" label="測試文字" />);
    const activeSentence = screen.getByText("第二句。");
    Object.defineProperty(activeSentence, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ top: 240, bottom: 268 }),
    });

    fireEvent.click(screen.getByRole("button", { name: "模擬朗讀進度" }));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("uses instant positioning when reduced motion is enabled", () => {
    window.matchMedia = vi.fn(() => ({ matches: true } as unknown as MediaQueryList)) as unknown as typeof window.matchMedia;
    render(<SpeechReadableText as="p" text="第一句。第二句。" label="測試文字" />);
    const activeSentence = screen.getByText("第二句。");
    Object.defineProperty(activeSentence, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ top: 900, bottom: 928 }),
    });

    fireEvent.click(screen.getByRole("button", { name: "模擬朗讀進度" }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "nearest", inline: "nearest" });
  });
});
