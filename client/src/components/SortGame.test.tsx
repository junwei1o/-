// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SortGame from "@/components/SortGame";
import { SORT_SETS } from "@/lib/sortBank";

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
