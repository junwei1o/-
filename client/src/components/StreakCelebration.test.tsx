// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StreakCelebration from "./StreakCelebration";

afterEach(() => cleanup());

describe("StreakCelebration", () => {
  it.each([
    [5, "連勝啟動！"],
    [6, "華麗連勝！"],
    [7, "流星劃過天際！"],
    [8, "連勝爆發！"],
    [9, "星河為你閃耀！"],
    [11, "火焰連勝！"],
    [12, "神龍降臨！"],
    [18, "神龍降臨！"],
  ])("renders the correct tier for %i consecutive answers", (streak, title) => {
    render(<StreakCelebration streak={streak} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    expect(screen.getByText(String(streak), { selector: "strong" })).toBeTruthy();
  });

  it("closes from the visible button and Escape", () => {
    const onClose = vi.fn();
    render(<StreakCelebration streak={7} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "關閉連勝提示" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
