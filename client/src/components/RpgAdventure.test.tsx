/** @vitest-environment jsdom */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RpgAdventure from "./RpgAdventure";

vi.mock("./ExpeditionObservationCard", () => ({ default: () => null }));

const storage = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
});

describe("夥伴養成沉浸感展示", () => {
  beforeEach(() => storage.clear());
  afterEach(() => cleanup());

  it("在夥伴頁顯示待機展示、等級階段與四科知識技能樹", () => {
    render(<RpgAdventure questionPool={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "夥伴" }));

    expect(screen.getByLabelText("夥伴成長視覺與知識技能樹")).toBeInTheDocument();
    expect(screen.getByText("星芽階段")).toBeInTheDocument();
    const skillTree = screen.getByLabelText("四科知識技能樹");
    expect(skillTree).toBeInTheDocument();
    expect(within(skillTree).getByText("數學")).toBeInTheDocument();
    expect(within(skillTree).getByText("自然")).toBeInTheDocument();
    expect(within(skillTree).getByText("社會")).toBeInTheDocument();
    expect(within(skillTree).getByText("國語")).toBeInTheDocument();
    expect(document.querySelector(".growth-companion-showcase .animate-float")).toBeInTheDocument();
  });
});

describe("守護者戰鬥儀式", () => {
  beforeEach(() => {
    storage.clear();
    vi.useFakeTimers();
    storage.set("xue-adventure-mainline-progress-v1", JSON.stringify({
      regularDefeatsBySubject: { chinese: 3 },
      defeatedGuardians: [],
      liberatedSubjects: [],
      unlockedOutfits: [],
    }));
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("挑戰已解鎖守護者時，先播放可存取的專屬入場儀式並在結束後開戰", () => {
    render(<RpgAdventure questionPool={[]} soundEnabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: "挑戰最終守護者" }));

    expect(screen.getByLabelText("孔子之靈 入場")).toBeInTheDocument();
    expect(screen.getByText("孔子之靈 · 國文島的墮落守護者")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2_500));

    expect(screen.queryByLabelText("孔子之靈 入場")).not.toBeInTheDocument();
    expect(screen.getByText("孔子之靈")).toBeInTheDocument();
  });
});
