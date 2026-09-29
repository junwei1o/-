// @vitest-environment jsdom
/**
 * P0 防禦回歸鎖定：
 * ① 試卷答題冪等守衛——快速連點同一選項只應產生一筆學習紀錄，不得重複寫入。
 * ② QuizModal 關閉後 DOM 清理——unmount 後 backdrop 節點必須完全移除，不得殘留遮罩。
 *
 * 這兩個測試對應階段3壓測未能復現的兩項 P0（戰鬥連點重複提交、Modal 遮罩殘留），
 * 以單元測試把現狀鎖死：若未來重構打破守衛，此處會立刻紅燈。
 */
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setLocation = vi.fn();

const mockQuestion = vi.hoisted(() => ({
  id: "p0-idempotent-1",
  grade: 5,
  subject: "國語" as const,
  difficulty: "基礎",
  learningTopic: "閱讀理解",
  prompt: "哪一句最能表達文章的主旨？",
  options: ["只描述一個細節", "說明文章的核心意思", "列出人物姓名", "重複文章標題"],
  answer: 1,
  explanation: "先找出全文反覆支持的核心意思。",
}));

const bankState = vi.hoisted(() => ({ questions: [mockQuestion] as unknown[] }));

vi.mock("wouter", () => ({
  useLocation: () => ["/practice", setLocation],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    aiTutor: { reviewPlan: { useMutation: () => ({ isPending: false, error: null, data: undefined, reset: vi.fn(), mutate: vi.fn() }) } },
    aiCompanion: { reflect: { useMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({ text: "?", source: "rule", remaining: 8 }), isPending: false }) } },
    questionBank: { list: { useQuery: () => ({ data: { questions: [mockQuestion] }, isLoading: false, error: null, refetch: vi.fn() }) } },
  },
}));

vi.mock("@/lib/questionBank", () => ({
  LOCAL_QUESTION_BANK: [],
  LOCAL_ENGLISH_BANK: [],
  useQuestionBank: () => ({ questions: bankState.questions, total: bankState.questions.length, isLoading: false, error: null, refetch: vi.fn() }),
}));

vi.mock("@/lib/paperExamStrategyCue", () => ({
  loadPaperStrategyCueEnabled: () => true,
  playPaperStrategyCue: vi.fn(),
  savePaperStrategyCueEnabled: vi.fn(),
}));

import PaperExam from "@/pages/PaperExam";
import { ADAPTIVE_STORAGE_KEY, loadAdaptiveProfile } from "@/game/adaptiveLearning";
import { QuizModal } from "@/components/QuizModal";
import type { PaperQuestion } from "@/lib/paperExam";

vi.setConfig({ testTimeout: 15000 });

describe("P0 防禦回歸鎖定", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    window.localStorage.clear();
    bankState.questions = [mockQuestion];
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    setLocation.mockReset();
  });

  it("① 試卷快速連點同一選項 5 次，只寫入一筆 adaptive 作答紀錄", () => {
    render(<PaperExam />);
    // 開始今日試卷 → 確認策略提示 → 進入第 1 題
    fireEvent.click(screen.getByRole("button", { name: /開始今日試卷/ }));
    fireEvent.click(screen.getByRole("button", { name: "開始本組題目" }));
    expect(screen.getByText("第 1 / 1 題")).toBeInTheDocument();

    const correctOption = screen.getByRole("radio", { name: mockQuestion.options[mockQuestion.answer] });

    // 模擬使用者瘋狂連點同一個正確選項（React 合成事件同步觸發）
    for (let i = 0; i < 5; i++) {
      fireEvent.click(correctOption);
    }

    const profile = loadAdaptiveProfile();
    const attemptsForQuestion = profile.attempts.filter((a) => a.questionId === mockQuestion.id);
    expect(attemptsForQuestion).toHaveLength(1);
    expect(attemptsForQuestion[0].correct).toBe(true);

    // 答完後選項 radio（input[type=radio]）應全部 disabled（UI 層二次保險）
    // 注意：頁面上方「選擇答題範圍」的 role=radio 按鈕不在此列，只檢查題目選項。
    document.querySelectorAll('input[type="radio"]').forEach((radio) => expect(radio).toBeDisabled());
  });

  it("①b 連點不同選項（先錯後對）也只認第一次點選，不重複提交", () => {
    render(<PaperExam />);
    fireEvent.click(screen.getByRole("button", { name: /開始今日試卷/ }));
    fireEvent.click(screen.getByRole("button", { name: "開始本組題目" }));
    expect(screen.getByText("第 1 / 1 題")).toBeInTheDocument();

    // 先點錯誤選項，再瘋狂點其他選項
    fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[0] }));
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[mockQuestion.answer] }));
    }

    const profile = loadAdaptiveProfile();
    const attemptsForQuestion = profile.attempts.filter((a) => a.questionId === mockQuestion.id);
    // 第一次點的是錯誤選項，之後的點擊都被守衛擋下
    expect(attemptsForQuestion).toHaveLength(1);
    expect(attemptsForQuestion[0].correct).toBe(false);
  });

  it("② QuizModal unmount 後 backdrop 節點完全移除、無殘留遮罩", () => {
    const question: PaperQuestion = mockQuestion as PaperQuestion;
    const { unmount } = render(
      <QuizModal question={question} subject="國語" onClose={() => undefined} onCompleted={() => undefined} />,
    );

    // 開啟時 backdrop 在 DOM
    expect(document.querySelector(".quiz-modal-backdrop")).toBeInTheDocument();
    expect(document.querySelector('[role="dialog"][aria-modal="true"]')).toBeInTheDocument();

    unmount();

    // 關閉（unmount）後：backdrop 與 dialog 都必須從 DOM 消失
    expect(document.querySelector(".quiz-modal-backdrop")).not.toBeInTheDocument();
    expect(document.querySelector('[role="dialog"][aria-modal="true"]')).not.toBeInTheDocument();
    // body 不得被加上鎖捲軸類別或殘留 pointer-events
    expect(document.body.style.overflow).toBe("");
    expect(getComputedStyle(document.body).pointerEvents).toBe("auto");
  });

  it("②b QuizModal 作答後呼叫 onClose，父層解除渲染後 DOM 乾淨", () => {
    const question: PaperQuestion = mockQuestion as PaperQuestion;
    let closed = false;
    const { unmount, rerender } = render(
      <QuizModal question={question} subject="國語" onClose={() => { closed = true; }} onCompleted={() => undefined} />,
    );
    // 作答
    fireEvent.click(screen.getByRole("button", { name: `選項 ${mockQuestion.answer + 1}：${mockQuestion.options[mockQuestion.answer]}` }));
    expect(screen.getByRole("status")).toHaveTextContent("答對了");

    // 點「繼續探索」→ onClose
    fireEvent.click(screen.getByRole("button", { name: "繼續探索" }));
    expect(closed).toBe(true);

    // 父層解除渲染（模擬 setQuizSubject(null)）
    rerender(<div />);
    expect(document.querySelector(".quiz-modal-backdrop")).not.toBeInTheDocument();
    expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    unmount();
  });
});
