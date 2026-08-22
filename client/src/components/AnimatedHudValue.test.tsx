// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedHudValue } from "@/components/AnimatedHudValue";

const matchMedia = vi.fn();

beforeEach(() => {
  matchMedia.mockReturnValue({ matches: true });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: matchMedia });
});

afterEach(() => {
  cleanup();
  matchMedia.mockReset();
});

describe("AnimatedHudValue", () => {
  it("在減少動態偏好下立即顯示真實數值，並對升級作禮貌公告", () => {
    const { rerender } = render(
      <AnimatedHudValue value={1} prefix="Lv." label="探險等級" increaseAnnouncement="升級至" />,
    );

    rerender(<AnimatedHudValue value={2} prefix="Lv." label="探險等級" increaseAnnouncement="升級至" />);

    expect(screen.getByText("Lv.2")).toBeTruthy();
    expect(screen.getByText("探險等級升級至Lv.2").getAttribute("aria-live")).toBe("polite");
  });

  it("以數字等寬與變動方向類別支援不造成版面跳動的視覺回饋", () => {
    const { rerender } = render(<AnimatedHudValue value={8} label="航線能量" />);
    rerender(<AnimatedHudValue value={6} label="航線能量" className="hud-test-value" />);

    expect(document.querySelector("output.rpg-hud-number.is-decrease.hud-test-value")).toBeTruthy();
    expect(screen.getByText("航線能量調整為6")).toBeTruthy();
  });
});
