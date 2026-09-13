// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { reflectMock } = vi.hoisted(() => ({ reflectMock: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    aiCompanion: {
      reflect: {
        useMutation: () => ({ mutateAsync: reflectMock, isPending: false }),
      },
    },
  },
}));
vi.mock("@/utils/storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/storage")>()),
  getPlayerName: () => "小晴",
}));
vi.mock("@/game/adaptiveLearning", () => ({
  loadUserPreferences: () => ({ gradeLevel: 4, difficultyPreference: "均衡混合" }),
}));

import { CompanionReflection } from "./CompanionReflection";

const baseProps = {
  question: "3 + 2 等於多少？",
  options: ["3", "5", "6", "8"],
  selectedIndex: 2,
  answerIndex: 1,
  subject: "數學",
  learningTopic: "加法",
};

beforeEach(() => reflectMock.mockReset());
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("CompanionReflection 答題後深度伴讀", () => {
  it("點擊後呼叫 reflect，並顯示代理回覆與來源標籤", async () => {
    reflectMock.mockResolvedValue({
      text: "你當初為什麼會選 6 呢？",
      source: "proxy",
      remaining: 7,
    });
    render(<CompanionReflection {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /和伴小星聊聊這題/ }));

    await waitFor(() => expect(screen.getByText("你當初為什麼會選 6 呢？")).toBeInTheDocument());
    expect(screen.getByText("你的 AI 代理")).toBeInTheDocument();
    expect(reflectMock).toHaveBeenCalledTimes(1);
    const payload = reflectMock.mock.calls[0][0];
    expect(payload.turn).toBe("first");
    expect(payload.correct).toBe(false);
    expect(payload.selectedAnswer).toBe("6");
    expect(payload.correctAnswer).toBe("5");
    // 姓名只作後端限流桶 key；送給模型的題目上下文本身不含姓名（後端 buildReflectionMessages 另驗）
    expect(payload.question).not.toContain("小晴");
  });

  it("LLM 失敗時自動降級離線規則腦並提示", async () => {
    reflectMock.mockImplementationOnce(() => Promise.reject(new Error("網路斷線")));
    render(<CompanionReflection {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /和伴小星聊聊這題/ }));

    await waitFor(() => expect(screen.getByText("規則腦・離線")).toBeInTheDocument());
    expect(screen.getByText(/離線規則腦陪你想/)).toBeInTheDocument();
  });

  it("被每分鐘限額擋下時顯示限額訊息，仍由規則腦接手", async () => {
    reflectMock.mockImplementationOnce(() => Promise.reject(new Error("這一分鐘的深度伴讀次數用完了（每分鐘 8 次），請 30 秒後再試")));
    render(<CompanionReflection {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /和伴小星聊聊這題/ }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("每分鐘"),
    );
    expect(screen.getByText("規則腦・離線")).toBeInTheDocument();
  });

  it("按「換個角度再問我」會以 turn=more 再呼叫一次", async () => {
    reflectMock
      .mockResolvedValueOnce({ text: "第一個問題？", source: "builtin", remaining: 7 })
      .mockResolvedValueOnce({ text: "再深入一個問題？", source: "builtin", remaining: 6 });
    render(<CompanionReflection {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /和伴小星聊聊這題/ }));
    await waitFor(() => expect(screen.getByText("第一個問題？")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /換個角度再問我/ }));
    await waitFor(() => expect(screen.getByText("再深入一個問題？")).toBeInTheDocument());
    expect(reflectMock.mock.calls[1][0].turn).toBe("more");
  });

  it("切換題目（question prop 改變）會自動關閉舊對話", async () => {
    reflectMock.mockResolvedValue({ text: "問題？", source: "builtin", remaining: 7 });
    const { rerender } = render(<CompanionReflection {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /和伴小星聊聊這題/ }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    rerender(<CompanionReflection {...baseProps} question="另一題：5-2=?" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
