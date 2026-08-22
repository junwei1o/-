// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AnimeWorldviewQuiz from "./AnimeWorldviewQuiz";

describe("動漫世界觀小測驗互動", () => {
  afterEach(() => cleanup());
  it("作答後停留在原題並顯示解析，只有按下一題才會前進", () => {
    render(<AnimeWorldviewQuiz entryKey="nailong" title="我是奶龍" onBack={vi.fn()} />);
    const initialPrompt = screen.getByRole("heading", { level: 3 }).textContent;
    fireEvent.click(screen.getByRole("radio", { name: /先仔細觀察/ }));
    fireEvent.click(screen.getByRole("button", { name: "確認答案" }));
    expect(screen.getByText("答對了！")).toBeTruthy();
    expect(document.querySelector(".anime-quiz-focus")?.textContent).toContain("觀察與提問");
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(initialPrompt);
    fireEvent.click(screen.getByRole("button", { name: "下一題" }));
    expect(screen.getByRole("heading", { level: 3 }).textContent).not.toBe(initialPrompt);
  });

  it("完成八題後顯示結果，並可重新挑戰或返回觀測卡", () => {
    const onBack = vi.fn();
    const onComplete = vi.fn();
    render(<AnimeWorldviewQuiz entryKey="ultraman" title="奧特曼" onBack={onBack} onComplete={onComplete} />);
    const answers = [
      /找共同參考物/, /不同距離下/, /依照分工/, /蒐集線索/, /評估風險/,
      /相同時間、距離/, /標出已確認/, /保持距離、減少干擾/,
    ];
    for (let index = 0; index < answers.length; index += 1) {
      fireEvent.click(screen.getByRole("radio", { name: answers[index] }));
      fireEvent.click(screen.getByRole("button", { name: "確認答案" }));
      fireEvent.click(screen.getByRole("button", { name: index === answers.length - 1 ? "查看結果" : "下一題" }));
    }
    expect(screen.getByRole("heading", { level: 2, name: /小測驗結果/ })).toBeTruthy();
    expect(document.querySelector(".anime-quiz-score")?.textContent).toContain("8");
    expect(document.querySelector(".anime-quiz-score")?.textContent).toContain("題答對");
    expect(onComplete).toHaveBeenCalledWith({ entryKey: "ultraman", correct: 8, total: 8, percentage: 100 });
    fireEvent.click(screen.getByRole("button", { name: "返回觀測卡" }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
