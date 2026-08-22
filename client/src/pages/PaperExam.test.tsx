// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PaperExam from "@/pages/PaperExam";
import { ADAPTIVE_STORAGE_KEY } from "@/game/adaptiveLearning";

const playPaperStrategyCue = vi.hoisted(() => vi.fn());
const savePaperStrategyCueEnabled = vi.hoisted(() => vi.fn());

const setLocation = vi.fn();
const mockQuestion = vi.hoisted(() => ({
  id: "paper-summary-1",
  grade: 5,
  subject: "國語" as const,
  difficulty: "基礎",
  learningTopic: "閱讀理解",
  prompt: "哪一句最能表達文章的主旨？",
  options: ["只描述一個細節", "說明文章的核心意思", "列出人物姓名", "重複文章標題"],
  answer: 1,
  explanation: "先找出全文反覆支持的核心意思，再判斷主旨。",
}));

vi.mock("wouter", () => ({
  useLocation: () => [typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`, setLocation],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    aiTutor: {
      reviewPlan: {
        useMutation: () => ({ isPending: false, error: null, data: undefined, reset: vi.fn(), mutate: vi.fn() }),
      },
    },
    questionBank: {
      list: {
        useQuery: () => ({ data: { questions: [mockQuestion] }, isLoading: false, error: null, refetch: vi.fn() }),
      },
    },
  },
}));

vi.mock("@/lib/paperExamStrategyCue", () => ({
  loadPaperStrategyCueEnabled: () => true,
  playPaperStrategyCue,
  savePaperStrategyCueEnabled,
}));

describe("PaperExam mobile-first launchpad and result summary", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
    window.localStorage.removeItem(ADAPTIVE_STORAGE_KEY);
    setLocation.mockReset();
    playPaperStrategyCue.mockReset();
    savePaperStrategyCueEnabled.mockReset();
  });

  function confirmNextGroupStrategy() {
    fireEvent.click(screen.getByRole("button", { name: "開始本組題目" }));
  }

  it("keeps the primary study action and offers one-tap map and exploration routes", () => {
    render(<PaperExam />);

    expect(screen.getByRole("navigation", { name: "學習快速入口" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /查看今日智慧導引/ }));
    expect(setLocation).toHaveBeenLastCalledWith("/map");
    fireEvent.click(screen.getByRole("button", { name: /探索天文館/ }));
    expect(setLocation).toHaveBeenLastCalledWith("/astronomy");
  });

  it("opens a knowledge-topic review deck from the report link", () => {
    window.history.replaceState({}, "", "/?reviewTopic=%E9%96%B1%E8%AE%80%E7%90%86%E8%A7%A3");
    render(<PaperExam />);

    expect(screen.getByRole("heading", { name: "本次複習知識點" })).toBeInTheDocument();
    expect(screen.getByText("閱讀理解")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /朗讀：本次複習導讀|瀏覽器不支援朗讀/ })).toBeInTheDocument();
    expect(screen.getByText("先聽導讀")).toBeInTheDocument();
    const transcriptToggle = screen.getByText("展開導讀文字稿");
    const transcript = transcriptToggle.closest("details");
    expect(transcript).not.toHaveAttribute("open");
    fireEvent.click(transcriptToggle);
    expect(transcript).toHaveAttribute("open");
    expect(screen.getByLabelText("導讀文字稿")).toHaveTextContent("核心概念");
    expect(screen.getByLabelText("導讀文字稿")).toHaveTextContent("作答提醒");
    expect(screen.getByLabelText("導讀文字稿")).toHaveTextContent("先找出題目要考的核心概念");
    expect(screen.getByLabelText("導讀文字稿")).toHaveTextContent("用選項中的關鍵字逐一比對");
    expect(screen.getByText("1", { selector: "strong" })).toBeInTheDocument();
    expect(screen.queryByText("第 1 / 1 題")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "開始複習" }));
    expect(screen.getByText("第 1 / 1 題")).toBeInTheDocument();
    expect(screen.getByText(/綜合課綱 · 國語 · 閱讀理解/)).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "學習快速入口" })).not.toBeInTheDocument();
  });

  it("keeps the island subject when launching a recent knowledge-topic review", () => {
    window.history.replaceState({}, "", "/?subject=%E5%9C%8B%E8%AA%9E&reviewTopic=%E9%96%B1%E8%AE%80%E7%90%86%E8%A7%A3&source=student-map");
    render(<PaperExam />);

    expect(screen.getByText(/已準備「國語」的「閱讀理解」複習/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "開始複習" }));
    expect(screen.getByText(/國語 · 國語 · 閱讀理解/)).toBeInTheDocument();
  });

  it("reveals related wrong answers for the selected knowledge topic", () => {
    window.history.replaceState({}, "", "/?reviewTopic=%E9%96%B1%E8%AE%80%E7%90%86%E8%A7%A3");
    window.localStorage.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify({
      version: 2,
      attempts: [{
        questionId: mockQuestion.id,
        curriculumDomain: mockQuestion.subject,
        knowledge: [mockQuestion.learningTopic],
        difficulty: "基礎",
        correct: false,
        responseMs: 1200,
        timeLimitMs: 25000,
        timestamp: 1700000000000,
      }],
    }));
    render(<PaperExam />);

    const relatedButton = screen.getByRole("button", { name: /查看相關錯題/ });
    expect(relatedButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(relatedButton);
    expect(relatedButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("相關錯題回顧")).toHaveTextContent(mockQuestion.prompt);
    expect(screen.getByLabelText("相關錯題回顧")).toHaveTextContent("正確答案");
  });

  it("starts a quick quiz containing only the related wrong questions", () => {
    window.history.replaceState({}, "", "/?reviewTopic=%E9%96%B1%E8%AE%80%E7%90%86%E8%A7%A3");
    window.localStorage.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify({
      version: 2,
      attempts: [{
        questionId: mockQuestion.id,
        curriculumDomain: mockQuestion.subject,
        knowledge: [mockQuestion.learningTopic],
        difficulty: "基礎",
        correct: false,
        responseMs: 1200,
        timeLimitMs: 25000,
        timestamp: 1700000000000,
      }],
    }));
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("button", { name: /查看相關錯題/ }));
    fireEvent.click(screen.getByRole("button", { name: "只練習這些錯題" }));

    expect(screen.getByRole("heading", { name: "只練習這些錯題" })).toBeInTheDocument();
    expect(screen.getByText("題錯題")).toBeInTheDocument();
    expect(screen.getByText("本次涵蓋的知識點")).toBeInTheDocument();
    expect(screen.getByText("閱讀理解")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "開始快速測驗" }));

    expect(screen.getByText("第 1 / 1 題")).toBeInTheDocument();
    expect(screen.getByText(/開始只練習「閱讀理解」的 1 題錯題/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "只練習這些錯題" })).not.toBeInTheDocument();
  });

  it("shows a real mastery comparison after completing a wrong-answer quick quiz", () => {
    window.history.replaceState({}, "", "/?reviewTopic=%E9%96%B1%E8%AE%80%E7%90%86%E8%A7%A3");
    window.localStorage.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify({
      version: 2,
      attempts: [{
        questionId: mockQuestion.id,
        curriculumDomain: mockQuestion.subject,
        knowledge: [mockQuestion.learningTopic],
        difficulty: "基礎",
        correct: false,
        responseMs: 1200,
        timeLimitMs: 25000,
        timestamp: 1700000000000,
      }],
    }));
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("button", { name: /查看相關錯題/ }));
    fireEvent.click(screen.getByRole("button", { name: "只練習這些錯題" }));
    fireEvent.click(screen.getByRole("button", { name: "開始快速測驗" }));
    fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[mockQuestion.answer] }));
    fireEvent.click(screen.getByRole("button", { name: /查看結果總結/ }));

    expect(screen.getByRole("heading", { name: "掌握度前後比較" })).toBeInTheDocument();
    expect(screen.getByLabelText("掌握度比較：練習前 0%；練習後 100%。")).toBeInTheDocument();
    expect(screen.getByText(/掌握線索比開始前增加了 100 個百分點/)).toBeInTheDocument();
  });

  it("shows a calm empty state when the topic has no related wrong answers", () => {
    window.history.replaceState({}, "", "/?reviewTopic=%E9%96%B1%E8%AE%80%E7%90%86%E8%A7%A3");
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("button", { name: /查看相關錯題/ }));
    expect(screen.getByText(/目前還沒有.*錯題紀錄/)).toBeInTheDocument();
  });

  it("starts from the current scope without changing routes", () => {
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("button", { name: /開始今日試卷/ }));
    expect(screen.getByTestId("paper-next-group-tip")).toHaveTextContent("綜合課綱準備提示");
    confirmNextGroupStrategy();
    expect(setLocation).not.toHaveBeenCalled();
    expect(screen.getByText("第 1 / 1 題")).toBeInTheDocument();
  });

  it("shows a subject-specific, speech-supported strategy before the next paper and supports postponing it", () => {
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("radio", { name: /國語領域專屬試卷/ }));
    const tip = screen.getByTestId("paper-next-group-tip");
    expect(tip).toHaveTextContent("國語準備提示");
    expect(tip).toHaveTextContent("關鍵詞");
    expect(tip).not.toHaveTextContent(mockQuestion.options[mockQuestion.answer]);
    expect(screen.getAllByRole("button", { name: /朗讀：下一組學科策略提示|瀏覽器不支援朗讀/ }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "稍後再說" }));
    expect(screen.queryByTestId("paper-next-group-tip")).not.toBeInTheDocument();
    expect(screen.queryByText("第 1 / 1 題")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /開始今日試卷/ }));
    confirmNextGroupStrategy();
    expect(screen.getByText("第 1 / 1 題")).toBeInTheDocument();
  });

  it("plays a gentle optional cue when a learner opens the strategy prompt and exposes an accessible sound toggle", () => {
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("button", { name: /開始今日試卷/ }));
    expect(playPaperStrategyCue).toHaveBeenCalledWith(true);
    const soundToggle = screen.getByRole("button", { name: "關閉下一組策略提示音" });
    expect(soundToggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(soundToggle);
    expect(screen.getByRole("button", { name: "開啟下一組策略提示音" })).toHaveAttribute("aria-pressed", "false");
    expect(savePaperStrategyCueEnabled).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole("button", { name: "稍後再說" }));
    fireEvent.click(screen.getByRole("radio", { name: /數學領域專屬試卷/ }));
    expect(playPaperStrategyCue).toHaveBeenLastCalledWith(false);
  });

  it("uses an accessible, percentage-free Yushan altitude gauge based only on answered questions", () => {
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("button", { name: /開始今日試卷/ }));
    confirmNextGroupStrategy();
    const gauge = screen.getByRole("progressbar", { name: "玉山高度計" });
    expect(gauge).toHaveAttribute("aria-valuemin", "0");
    expect(gauge).toHaveAttribute("aria-valuemax", "1");
    expect(gauge).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByTestId("paper-altitude-value")).toHaveTextContent("目前海拔 0m");
    expect(screen.getByTestId("paper-altitude-gauge").closest(".paper-altitude-card")).not.toHaveTextContent("%");
    expect(screen.getAllByRole("button", { name: /朗讀：玉山高度計|瀏覽器不支援朗讀/ }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[mockQuestion.answer] }));
    expect(gauge).toHaveAttribute("aria-valuenow", "1");
    expect(gauge).toHaveAttribute("aria-valuetext", "目前海拔 3,952 公尺，已完成 1 題");
    expect(screen.getByTestId("paper-altitude-value")).toHaveTextContent("目前海拔 3,952m");
  });

  it("shows a positive summit encouragement after a full paper and lets the learner close it", () => {
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("button", { name: /開始今日試卷/ }));
    confirmNextGroupStrategy();
    fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[mockQuestion.answer] }));

    const encouragement = screen.getByTestId("paper-summit-encouragement");
    expect(screen.getByRole("status")).toHaveTextContent("抵達玉山山頂");
    expect(encouragement).toHaveTextContent("完成這一組題目了");
    expect(encouragement).not.toHaveTextContent("%");
    expect(screen.getAllByRole("button", { name: /朗讀：登頂鼓勵|瀏覽器不支援朗讀/ }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "關閉登頂鼓勵" }));
    expect(screen.queryByTestId("paper-summit-encouragement")).not.toBeInTheDocument();
  });

  it("opens a closable, speech-supported recap of strategies from the completed paper", () => {
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("button", { name: /開始今日試卷/ }));
    confirmNextGroupStrategy();
    fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[mockQuestion.answer] }));

    const recapTrigger = screen.getByRole("button", { name: "回顧本組策略" });
    expect(recapTrigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(recapTrigger);

    const recap = screen.getByTestId("paper-summit-strategy-recap");
    expect(recapTrigger).toHaveAttribute("aria-expanded", "true");
    expect(recap).toHaveTextContent("把剛才的解題技巧帶到下一次");
    expect(recap).toHaveTextContent("國語閱讀策略");
    expect(recap).toHaveTextContent("閱讀理解");
    expect(recap).not.toHaveTextContent(mockQuestion.options[mockQuestion.answer]);
    expect(screen.getAllByRole("button", { name: /朗讀：本組策略回顧|瀏覽器不支援朗讀/ }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "關閉本組策略回顧" }));
    expect(screen.queryByTestId("paper-summit-strategy-recap")).not.toBeInTheDocument();
    expect(recapTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the strategy recap available while it is open and closes it with Escape", () => {
    vi.useFakeTimers();
    try {
      render(<PaperExam />);
      fireEvent.click(screen.getByRole("button", { name: /開始今日試卷/ }));
      confirmNextGroupStrategy();
      fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[mockQuestion.answer] }));
      fireEvent.click(screen.getByRole("button", { name: "回顧本組策略" }));

      act(() => vi.advanceTimersByTime(4800));
      expect(screen.getByTestId("paper-summit-strategy-recap")).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByTestId("paper-summit-strategy-recap")).not.toBeInTheDocument();
      expect(screen.getByTestId("paper-summit-encouragement")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("dismisses the summit encouragement after a brief interval and supports Escape", () => {
    vi.useFakeTimers();
    try {
      render(<PaperExam />);

      fireEvent.click(screen.getByRole("button", { name: /開始今日試卷/ }));
      confirmNextGroupStrategy();
      fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[mockQuestion.answer] }));
      expect(screen.getByTestId("paper-summit-encouragement")).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByTestId("paper-summit-encouragement")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /查看結果總結/ }));
      fireEvent.click(screen.getByRole("button", { name: /再做一份試卷/ }));
      confirmNextGroupStrategy();
      fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[mockQuestion.answer] }));
      expect(screen.getByTestId("paper-summit-encouragement")).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(4800));
      expect(screen.queryByTestId("paper-summit-encouragement")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows final score and detailed wrong-answer explanations after completion", () => {
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("radio", { name: /國語領域專屬試卷/ }));
    confirmNextGroupStrategy();
    fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[0] }));
    fireEvent.click(screen.getByRole("button", { name: /查看結果總結/ }));

    expect(screen.getByRole("heading", { name: "學習成果總結" })).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("錯題詳細解析")).toBeInTheDocument();
    expect(screen.getByText("你的作答")).toBeInTheDocument();
    expect(screen.getByText("正確答案")).toBeInTheDocument();
    expect(screen.getByText(mockQuestion.explanation)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "掌握度前後比較" })).not.toBeInTheDocument();
  });

  it("immediately restarts a strengthening deck containing only this result's unmastered questions", () => {
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("radio", { name: /國語領域專屬試卷/ }));
    confirmNextGroupStrategy();
    fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[0] }));
    fireEvent.click(screen.getByRole("button", { name: /查看結果總結/ }));

    const retryButton = screen.getByRole("button", { name: "再練一次本次的 1 題未掌握題目" });
    expect(retryButton).toHaveTextContent("再練一次未掌握題目");
    fireEvent.click(retryButton);

    expect(screen.getByText("第 1 / 1 題")).toBeInTheDocument();
    expect(screen.getByText(/已準備 1 題本次未掌握題目/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "學習成果總結" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "掌握度前後比較" })).not.toBeInTheDocument();
  });

  it("does not show the unmastered-question retry action after a fully correct result", () => {
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("radio", { name: /國語領域專屬試卷/ }));
    confirmNextGroupStrategy();
    fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[mockQuestion.answer] }));
    fireEvent.click(screen.getByRole("button", { name: /查看結果總結/ }));

    expect(screen.getByText("本次沒有錯題")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /再練一次本次的.*未掌握題目/ })).not.toBeInTheDocument();
  });

  it("clears the quick-quiz comparison state when starting a new paper", () => {
    window.history.replaceState({}, "", "/?reviewTopic=%E9%96%B1%E8%AE%80%E7%90%86%E8%A7%A3");
    window.localStorage.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify({
      version: 2,
      attempts: [{
        questionId: mockQuestion.id,
        curriculumDomain: mockQuestion.subject,
        knowledge: [mockQuestion.learningTopic],
        difficulty: "基礎",
        correct: false,
        responseMs: 1200,
        timeLimitMs: 25000,
        timestamp: 1700000000000,
      }],
    }));
    render(<PaperExam />);

    fireEvent.click(screen.getByRole("button", { name: /查看相關錯題/ }));
    fireEvent.click(screen.getByRole("button", { name: "只練習這些錯題" }));
    fireEvent.click(screen.getByRole("button", { name: "開始快速測驗" }));
    fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[mockQuestion.answer] }));
    fireEvent.click(screen.getByRole("button", { name: /查看結果總結/ }));
    expect(screen.getByRole("heading", { name: "掌握度前後比較" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再做一份試卷" }));
    confirmNextGroupStrategy();
    fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[0] }));
    fireEvent.click(screen.getByRole("button", { name: /查看結果總結/ }));
    expect(screen.queryByRole("heading", { name: "掌握度前後比較" })).not.toBeInTheDocument();
  });

  it("offers three-stage explanation, doubt marking, and positive error classification after an incorrect answer", () => {
    render(<PaperExam />);
    fireEvent.click(screen.getByRole("radio", { name: /國語領域專屬試卷/ }));
    confirmNextGroupStrategy();
    fireEvent.click(screen.getByRole("radio", { name: mockQuestion.options[0] }));

    expect(screen.getByText("速記口訣")).toBeInTheDocument();
    expect(screen.queryByText("進一步理解")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "看進一步理解" }));
    expect(screen.getByText("進一步理解")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "進入完整深讀" }));
    expect(screen.getByText("完整深讀")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "標記疑惑" }));
    expect(screen.getByRole("button", { name: "已標記疑惑" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "整理觀念" }));
    expect(screen.getByText("觀念還要整理")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(ADAPTIVE_STORAGE_KEY) ?? "{}").attempts[0]).toMatchObject({ flagged: true, errorType: "concept" });
  });

  it("launches a reviewDue deck from only real, due local attempts", () => {
    window.history.replaceState({}, "", "/practice?reviewDue=1&source=memory-alarm");
    window.localStorage.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify({
      version: 2,
      attempts: [{
        questionId: mockQuestion.id,
        curriculumDomain: mockQuestion.subject,
        knowledge: [mockQuestion.learningTopic],
        difficulty: "基礎",
        correct: false,
        responseMs: 1200,
        timeLimitMs: 25000,
        timestamp: Date.now() - 86_400_001,
        nextReviewDate: Date.now() - 1,
        errorType: "memory",
        flagged: true,
      }],
    }));
    render(<PaperExam />);

    expect(screen.getByText(/今天有 1 題記憶線索回來了/)).toBeInTheDocument();
    expect(screen.getByText("第 1 / 1 題")).toBeInTheDocument();
    expect(screen.getByText(/綜合課綱 · 國語 · 閱讀理解/)).toBeInTheDocument();
  });
});
