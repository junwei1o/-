// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
});
