// @vitest-environment jsdom

import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { reflectMock } = vi.hoisted(() => ({ reflectMock: vi.fn() }));

// 動畫在 jsdom 無意義，把 motion.section 靜態化為普通 section。
vi.mock("framer-motion", () => ({
  motion: {
    section: (props: Record<string, unknown> & { children?: React.ReactNode }) => (
      <section
        style={props.style as React.CSSProperties}
        className={props.className as string}
        role="dialog"
        aria-label={props["aria-label"] as string}
      >
        {props.children}
      </section>
    ),
  },
}));

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
import { ReflectionWorkspace } from "./reflection/ReflectionWorkspace";
import { reflectionWorkspace } from "@/game/reflectionWorkspace";

const baseProps = {
  question: "3 + 2 等於多少？",
  options: ["3", "5", "6", "8"],
  selectedIndex: 2,
  answerIndex: 1,
  subject: "數學",
  learningTopic: "加法",
};

function renderPair(props = baseProps) {
  return render(
    <>
      <CompanionReflection {...props} />
      <ReflectionWorkspace />
    </>,
  );
}

beforeEach(() => reflectMock.mockReset());
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  reflectionWorkspace.closeAll();
});

describe("深度伴讀可堆疊卡片工作台", () => {
  it("點擊後在工作台開卡並呼叫 reflect，顯示回覆與來源標籤", async () => {
    reflectMock.mockResolvedValue({ text: "你當初為什麼會選 6 呢？", source: "proxy", remaining: 7 });
    renderPair();

    fireEvent.click(screen.getByRole("button", { name: /和伴小星聊聊這題/ }));

    await waitFor(() => expect(screen.getByText("你當初為什麼會選 6 呢？")).toBeInTheDocument());
    expect(screen.getByText("你的 AI 代理")).toBeInTheDocument();
    expect(reflectMock).toHaveBeenCalledTimes(1);
    const payload = reflectMock.mock.calls[0][0];
    expect(payload.turn).toBe("first");
    expect(payload.correct).toBe(false);
    expect(payload.selectedAnswer).toBe("6");
    expect(payload.correctAnswer).toBe("5");
    // 送給模型的題目上下文本身不含姓名（姓名只作後端限流桶 key）
    expect(payload.question).not.toContain("小晴");
  });

  it("LLM 失敗時自動降級離線規則腦並提示", async () => {
    reflectMock.mockImplementationOnce(() => Promise.reject(new Error("網路斷線")));
    renderPair();

    fireEvent.click(screen.getByRole("button", { name: /和伴小星聊聊這題/ }));

    await waitFor(() => expect(screen.getByText("規則腦・離線")).toBeInTheDocument());
    expect(screen.getByText(/離線規則腦陪你想/)).toBeInTheDocument();
  });

  it("被每分鐘限額擋下時顯示限額訊息，仍由規則腦接手", async () => {
    reflectMock.mockImplementationOnce(() =>
      Promise.reject(new Error("這一分鐘的深度伴讀次數用完了（每分鐘 8 次），請 30 秒後再試")),
    );
    renderPair();

    fireEvent.click(screen.getByRole("button", { name: /和伴小星聊聊這題/ }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("每分鐘"));
    expect(screen.getByText("規則腦・離線")).toBeInTheDocument();
  });

  it("按「換個角度再問我」會以 turn=more 再呼叫一次", async () => {
    reflectMock
      .mockResolvedValueOnce({ text: "第一個問題？", source: "builtin", remaining: 7 })
      .mockResolvedValueOnce({ text: "再深入一個問題？", source: "builtin", remaining: 6 });
    renderPair();

    fireEvent.click(screen.getByRole("button", { name: /和伴小星聊聊這題/ }));
    await waitFor(() => expect(screen.getByText("第一個問題？")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /換個角度再問我/ }));
    await waitFor(() => expect(screen.getByText("再深入一個問題？")).toBeInTheDocument());
    expect(reflectMock.mock.calls[1][0].turn).toBe("more");
  });

  it("不同題各自開卡可並排，同題重複點擊只置頂不重複開卡", async () => {
    reflectMock.mockResolvedValue({ text: "問題？", source: "builtin", remaining: 7 });
    const secondProps = { ...baseProps, question: "另一題：5-2=?", selectedIndex: 0, answerIndex: 2 };
    render(
      <>
        <CompanionReflection {...baseProps} />
        <CompanionReflection {...secondProps} />
        <ReflectionWorkspace />
      </>,
    );

    const triggers = screen.getAllByRole("button", { name: /和伴小星聊聊這題/ });
    fireEvent.click(triggers[0]!);
    fireEvent.click(triggers[1]!);
    await waitFor(() => expect(screen.getAllByRole("dialog")).toHaveLength(2));

    // 再點第一題：不新增，仍是 2 張
    fireEvent.click(triggers[0]!);
    expect(screen.getAllByRole("dialog")).toHaveLength(2);
  });

  it("可由卡片上的關閉鈕關閉單張卡片", async () => {
    reflectMock.mockResolvedValue({ text: "問題？", source: "builtin", remaining: 7 });
    renderPair();
    fireEvent.click(screen.getByRole("button", { name: /和伴小星聊聊這題/ }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: "關閉這張深度伴讀卡片" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
