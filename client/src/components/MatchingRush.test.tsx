/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import MatchingRush from "./MatchingRush";
import { MATCHING_SETS, type MatchingResult, type MatchingRushResult, type MatchingSet } from "@/lib/matchingBank";

const SET = MATCHING_SETS.find((s) => s.id === "m-math-1") as MatchingSet;
const Q = SET.pairs[0];

function renderRush(props: Partial<React.ComponentProps<typeof MatchingRush>> = {}) {
  return render(
    <MatchingRush set={SET} mode="speed" onComplete={vi.fn()} onRushComplete={vi.fn()} {...props} />,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function clickAnswer(answer: string) {
  fireEvent.click(screen.getByRole("button", { name: answer }));
}

describe("MatchingRush 單對速配（A）", () => {
  it("渲染第一題與倒數 chip", () => {
    renderRush();
    expect(screen.getByText(Q.l)).toBeInTheDocument();
    expect(screen.getByTestId("mr-countdown")).toBeTruthy();
    expect(screen.getByText("第 1 / 6 題")).toBeInTheDocument();
    // 3 個選項
    const options = SET.pairs[0].r ? [SET.pairs[0].r] : [];
    const buttons = screen.getAllByRole("button", { name: /^.+$/ });
    expect(buttons.length).toBe(3);
    expect(options.length).toBe(1);
  });

  it("答對顯示『答對了！』並自動換下一題", () => {
    renderRush();
    const first = screen.getByText(Q.l);
    expect(first).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: Q.r }));
    expect(screen.getByText("答對了！")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(600));
    expect(screen.queryByText(Q.l)).not.toBeInTheDocument();
    expect(screen.getByText("第 2 / 6 題")).toBeInTheDocument();
  });

  it("答錯顯示正確答案並在 1.4 秒後換題、失誤 +1", () => {
    renderRush();
    const wrongOption = Array.from(screen.getAllByRole("button")).find((b) => (b as HTMLButtonElement).textContent !== Q.r) as HTMLElement;
    fireEvent.click(wrongOption);
    expect(screen.getByText(`正確答案是「${Q.r}」`)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByText("第 2 / 6 題")).toBeInTheDocument();
    expect(screen.getByText("已錯 1")).toBeInTheDocument();
  });

  it("30 秒倒數用盡：記未作答、顯示正確答案後換題", () => {
    renderRush();
    act(() => vi.advanceTimersByTime(31_000));
    expect(screen.getByText(`時間到！正確答案是「${Q.r}」`)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByText("第 2 / 6 題")).toBeInTheDocument();
  });

  it("答完 6 題出結果卡並回傳 MatchingResult（星等）", () => {
    const onComplete = vi.fn();
    renderRush({ onComplete });
    for (let i = 0; i < 6; i += 1) {
      const answer = screen.getByText(`第 ${i + 1} / 6 題`);
      expect(answer).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: SET.pairs[i].r }));
      act(() => vi.advanceTimersByTime(600));
    }
    expect(screen.getByText("單對速配完成")).toBeInTheDocument();
    expect(screen.getByText("★★★")).toBeInTheDocument();
    const result = onComplete.mock.calls[0][0] as MatchingResult;
    expect(result.id).toBe(SET.id);
    expect(result.stars).toBe(3);
    expect(result.errors).toBe(0);
  });
});

describe("MatchingRush 30 秒搶分（H）", () => {
  it("答對 +10、連對第二連起 +15 加成、答錯斷連", () => {
    const onRushComplete = vi.fn();
    renderRush({ mode: "rush", onRushComplete });
    expect(screen.getByText("得分 0")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: SET.pairs[0].r }));
    expect(screen.getByText(/\+10 分（連對 1）/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(800));
    fireEvent.click(screen.getByRole("button", { name: SET.pairs[1].r }));
    expect(screen.getByText(/\+15 分（連對 2）/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(800));
    expect(screen.getByText("得分 25")).toBeInTheDocument();
    // 答錯斷連
    const wrong = Array.from(screen.getAllByRole("button")).find((b) => (b as HTMLButtonElement).textContent !== SET.pairs[2].r) as HTMLElement;
    fireEvent.click(wrong);
    expect(screen.getByText(`正確答案是「${SET.pairs[2].r}」`)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(800));
    expect(screen.getByText("連對 0")).toBeInTheDocument();
  });

  it("30 秒時間到強制結算並回傳 MatchingRushResult", () => {
    const onRushComplete = vi.fn();
    renderRush({ mode: "rush", onRushComplete });
    fireEvent.click(screen.getByRole("button", { name: SET.pairs[0].r }));
    act(() => vi.advanceTimersByTime(800));
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByText("30 秒搶分結束")).toBeInTheDocument();
    const result = onRushComplete.mock.calls[0][0] as MatchingRushResult;
    expect(result.mode).toBe("rush");
    expect(result.score).toBe(10);
    expect(result.correct).toBe(1);
    expect(result.maxCombo).toBe(1);
  });
});
