// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SortGame from "@/components/SortGame";
import { SORT_SETS } from "@/lib/sortBank";

const originalAudioContext = window.AudioContext;

afterEach(() => cleanup());

describe("SortGame 分類歸位", () => {
  const set = SORT_SETS[0];

  function clickItem(container: HTMLElement, text: string) {
    const box = within(container.querySelector(".sg-items") as HTMLElement);
    const btn = Array.from(box.getAllByRole("button")).find(
      (b) =>
        !b.hasAttribute("disabled") &&
        Array.from(b.querySelectorAll("span")).some(
          (s) => !s.classList.contains("sg-badge") && s.textContent?.trim() === text,
        ),
    ) as HTMLElement;
    fireEvent.click(btn);
  }

  function clickBasket(container: HTMLElement, categoryIndex: number) {
    fireEvent.click(container.querySelectorAll(".sg-basket")[categoryIndex]);
  }

  it("全部歸位後完成，0 失誤、3 星", async () => {
    const onComplete = vi.fn();
    const { container } = render(<SortGame set={set} onComplete={onComplete} />);
    set.categories.forEach((category, index) => {
      for (const item of category.items) {
        clickItem(container, item);
        clickBasket(container, index);
      }
    });
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 6000, interval: 50 });
    expect(onComplete.mock.calls[0][0].errors).toBe(0);
    expect(onComplete.mock.calls[0][0].stars).toBe(3);
    expect(screen.getByText("過關！")).toBeTruthy();
  });

  it("放錯籃計一次失誤並顯示錯誤提示，之後完成為 2 星", async () => {
    const onComplete = vi.fn();
    const { container } = render(<SortGame set={set} onComplete={onComplete} />);
    const first = set.categories[0].items[0];
    // 故意放進第 2 籃
    clickItem(container, first);
    clickBasket(container, 1);
    expect(screen.getByText("這個放錯籃子了，再想想看！")).toBeTruthy();
    // 全部正確歸位
    set.categories.forEach((category, index) => {
      for (const item of category.items) {
        if (item === first && index === 0) continue; // 已放錯的那項要重新放對
        clickItem(container, item);
        clickBasket(container, index);
      }
    });
    clickItem(container, first);
    clickBasket(container, 0);
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 6000, interval: 50 });
    expect(onComplete.mock.calls[0][0].errors).toBe(1);
    expect(onComplete.mock.calls[0][0].stars).toBe(2);
  });

  it("時間用盡強制結束，記 1 星並標 timedOut", async () => {
    vi.useFakeTimers();
    try {
      const onComplete = vi.fn();
      render(<SortGame set={set} onComplete={onComplete} />);
      act(() => vi.advanceTimersByTime(31_000));
      expect(onComplete).toHaveBeenCalledTimes(1);
      const result = onComplete.mock.calls[0][0];
      expect(result.timedOut).toBe(true);
      expect(result.stars).toBe(1);
      expect(screen.getByText("時間到！")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("SortGame 音效 AudioContext 不堆疊（P2-4 回歸）", () => {
  afterEach(() => {
    Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
  });

  it("連續 40+ 次互動只建立單一 AudioContext 實例", () => {
    const close = vi.fn();
    const makeOsc = () => ({
      type: "sine" as OscillatorType,
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    });
    const makeGain = () => ({
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    });
    const constructed: object[] = [];
    const AudioContextMock = vi.fn(function (this: {}) {
      const ctx = {
        currentTime: 0,
        state: "running",
        destination: {},
        resume: vi.fn(),
        createOscillator: makeOsc,
        createGain: makeGain,
        close,
      };
      constructed.push(ctx);
      return ctx;
    });
    Object.defineProperty(window, "AudioContext", { configurable: true, value: AudioContextMock });

    const onComplete = vi.fn();
    const set = SORT_SETS[0];
    const { container } = render(<SortGame set={set} onComplete={onComplete} />);

    const clickItemText = (text: string) => {
      const box = within(container.querySelector(".sg-items") as HTMLElement);
      const btn = Array.from(box.getAllByRole("button")).find(
        (b) =>
          !b.hasAttribute("disabled") &&
          Array.from(b.querySelectorAll("span")).some(
            (s) => !s.classList.contains("sg-badge") && s.textContent?.trim() === text,
          ),
      ) as HTMLElement;
      fireEvent.click(btn);
    };

    // 同一項目重複放錯分類籃，每次觸發一次 playSound("no")，共觸發 40 次。
    const wrongItemText = set.categories[0].items[0];
    const wrongBasketIndex = 1; // 第一個項目的正確籃是 0，放進 1 必定出錯
    for (let i = 0; i < 40; i++) {
      clickItemText(wrongItemText);
      fireEvent.click(container.querySelectorAll(".sg-basket")[wrongBasketIndex]);
    }

    // 修復前：40 次互動 = 40 個 new AudioContext 且從不 close；修復後應復用單例。
    expect(AudioContextMock).toHaveBeenCalledTimes(1);
    expect(constructed).toHaveLength(1);
  });
});
