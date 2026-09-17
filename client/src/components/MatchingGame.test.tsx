// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MatchingGame from "@/components/MatchingGame";
import { MATCHING_SETS } from "@/lib/matchingBank";

afterEach(() => cleanup());

describe("MatchingGame 配對連連看", () => {
  const set = MATCHING_SETS[0];

  it("全部正確配對後完成，回報 0 失誤、3 星", async () => {
    const onComplete = vi.fn();
    const { container } = render(<MatchingGame set={set} onComplete={onComplete} />);
    const left = within(container.querySelector(".mg-left") as HTMLElement);
    const right = within(container.querySelector(".mg-right") as HTMLElement);

    for (const pair of set.pairs) {
      fireEvent.click(left.getByText(pair.l));
      fireEvent.click(right.getByText(pair.r));
    }

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 6000, interval: 50 });
    const result = onComplete.mock.calls[0][0];
    expect(result.errors).toBe(0);
    expect(result.stars).toBe(3);
    expect(screen.getByText("過關！")).toBeTruthy();
  });

  it("誤點干擾項計一次失誤、不會提前完成，之後完成為 2 星", async () => {
    const onComplete = vi.fn();
    const { container } = render(<MatchingGame set={set} onComplete={onComplete} />);
    const left = within(container.querySelector(".mg-left") as HTMLElement);
    const right = within(container.querySelector(".mg-right") as HTMLElement);

    // 第一對的左值配上干擾項 → 失敗
    fireEvent.click(left.getByText(set.pairs[0].l));
    fireEvent.click(right.getByText(set.distractors[0]));
    expect(await screen.findByText("這兩個沒有對在一起，再想想看！")).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();

    // 再把全部 6 對正確連完
    for (const pair of set.pairs) {
      fireEvent.click(left.getByText(pair.l));
      fireEvent.click(right.getByText(pair.r));
    }

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 6000, interval: 50 });
    const result = onComplete.mock.calls[0][0];
    expect(result.errors).toBe(1);
    expect(result.stars).toBe(2);
  });

  it("倒數 30 秒用盡後強制結束，記 1 星並標記 timedOut", async () => {
    vi.useFakeTimers();
    try {
      const onComplete = vi.fn();
      render(<MatchingGame set={set} onComplete={onComplete} timeLimitMs={30_000} />);

      expect(screen.getByRole("timer", { name: "剩餘 30 秒" })).toBeTruthy();
      act(() => vi.advanceTimersByTime(31_000));

      expect(onComplete).toHaveBeenCalledTimes(1);
      const result = onComplete.mock.calls[0][0];
      expect(result.timedOut).toBe(true);
      expect(result.stars).toBe(1);
      expect(screen.getByText("時間到！")).toBeTruthy();
      expect(screen.queryByText("過關！")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("時間到前的倒數會顯示剩餘秒數，低於 5 秒進入警示樣式", async () => {
    vi.useFakeTimers();
    try {
      render(<MatchingGame set={set} timeLimitMs={30_000} />);
      act(() => vi.advanceTimersByTime(26_000));
      const timer = screen.getByRole("timer", { name: "剩餘 4 秒" });
      expect(timer.classList.contains("is-urgent")).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
