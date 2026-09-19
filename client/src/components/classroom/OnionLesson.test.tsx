// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OnionLesson from "./OnionLesson";
import { FRACTION_COURSE } from "@/lib/onionLessons";

afterEach(() => cleanup());
beforeEach(() => localStorage.clear());

/** 在選項按鈕（.on-option）中用全文精確找出某個選項，避開短字（如 8、5）誤傷其他按鈕。 */
function optionButton(text: string): HTMLElement {
  const found = screen
    .getAllByRole("button")
    .find((b) => b.className.includes("on-option") && (b.textContent ?? "").includes(text));
  if (!found) throw new Error(`找不到選項按鈕：${text}`);
  return found;
}
/** 找主行動鈕（.on-btn）。 */
function actionButton(text: string): HTMLElement {
  const found = screen
    .getAllByRole("button")
    .find((b) => b.className.includes("on-btn") && (b.textContent ?? "").includes(text));
  if (!found) throw new Error(`找不到行動鈕：${text}`);
  return found;
}

/** 略過動畫 → 把目前這一層的每題都答對（含最後一題送出）。 */
function answerCurrentLayerCorrectly(layerIndex: number) {
  fireEvent.click(screen.getByRole("button", { name: /略過/ }));
  const layer = FRACTION_COURSE.layers[layerIndex];
  layer.quiz.forEach((q, j) => {
    fireEvent.click(optionButton(q.options[q.answer]));
    fireEvent.click(actionButton(j < layer.quiz.length - 1 ? "下一題" : "完成這一層"));
  });
}

describe("洋蔥式動畫微課 OnionLesson", () => {
  it("開始後在學習地圖只解鎖第一層，其餘上鎖", () => {
    render(<OnionLesson onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /開始剝洋蔥/ }));
    expect(screen.getByText(/學習地圖/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /第一層/ })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /第二層/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /第四層/ })).toBeDisabled();
  });

  it("點進第一層會播放動畫分鏡與旁白，可略過到測驗", () => {
    render(<OnionLesson onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /開始剝洋蔥/ }));
    fireEvent.click(screen.getByRole("button", { name: /第一層/ }));
    // 第一鏡是「不公平」錯誤示範，旁白應出現
    expect(screen.getByText(/一塊大、一塊小/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /略過/ }));
    expect(screen.getByText(/小測驗/)).toBeInTheDocument();
  });

  it("答錯先給分層提示、不擋關，答對後顯示解析", () => {
    render(<OnionLesson onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /開始剝洋蔥/ }));
    fireEvent.click(screen.getByRole("button", { name: /第一層/ }));
    fireEvent.click(screen.getByRole("button", { name: /略過/ }));

    const q = FRACTION_COURSE.layers[0].quiz[0];
    const wrongIndex = q.answer === 0 ? 1 : 0;
    fireEvent.click(optionButton(q.options[wrongIndex]));
    expect(screen.getByText(/提示（第 1 次）/)).toBeInTheDocument();

    fireEvent.click(optionButton(q.options[q.answer]));
    expect(screen.getByText(/答對了/)).toBeInTheDocument();
  });

  it("全對走完四層會解鎖、結算並回報最佳成績", () => {
    const onBest = vi.fn();
    render(<OnionLesson onExit={vi.fn()} onBest={onBest} />);
    fireEvent.click(screen.getByRole("button", { name: /開始剝洋蔥/ }));
    fireEvent.click(screen.getByRole("button", { name: /第一層/ }));

    FRACTION_COURSE.layers.forEach((layer, i) => {
      answerCurrentLayerCorrectly(i);
      expect(screen.getByText(/你完成了/)).toBeInTheDocument();
      if (i < FRACTION_COURSE.layers.length - 1) {
        expect(screen.getByText(new RegExp(`已解鎖：${["", "第二層", "第三層", "第四層"][i + 1]}`))).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /剝下一層/ }));
      } else {
        fireEvent.click(screen.getByRole("button", { name: /看學習成果/ }));
      }
    });

    expect(screen.getByText(/學習成果/)).toBeInTheDocument();
    // 頂列等級徽章與成果內文都會顯示最終頭銜
    expect(screen.getAllByText(/分數小達人/).length).toBeGreaterThanOrEqual(1);
    expect(onBest).toHaveBeenCalledTimes(1);
    const record = onBest.mock.calls[0][0];
    expect(record.stars).toBe(3); // 全程零失誤
    expect(record.total).toBe(8); // 4 層 × 2 題
    expect(record.correct).toBe(8);
  });

  it("完成後重新進入會顯示解鎖進度（local-first）", () => {
    const onBest = vi.fn();
    const { unmount } = render(<OnionLesson onExit={vi.fn()} onBest={onBest} />);
    fireEvent.click(screen.getByRole("button", { name: /開始剝洋蔥/ }));
    fireEvent.click(screen.getByRole("button", { name: /第一層/ }));
    answerCurrentLayerCorrectly(0);
    fireEvent.click(screen.getByRole("button", { name: /回地圖/ }));
    // 第一層顯示星等、第二層不再鎖
    expect(screen.getByRole("button", { name: /第二層/ })).not.toBeDisabled();
    unmount();

    render(<OnionLesson onExit={vi.fn()} onBest={onBest} />);
    fireEvent.click(screen.getByRole("button", { name: /繼續學習/ }));
    expect(screen.getByRole("button", { name: /第二層/ })).not.toBeDisabled();
  });
});
