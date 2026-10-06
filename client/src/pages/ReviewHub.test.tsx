// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReviewHub from "./ReviewHub";
import { ADAPTIVE_STORAGE_KEY } from "@/game/adaptiveLearning";
import { PLAYER_DATA_KEY } from "@/utils/storage";

const setLocation = vi.fn();
const storage = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => storage.clear(),
});

vi.mock("wouter", () => ({
  useLocation: () => ["/review-hub", setLocation],
}));

const MOCK_QUESTIONS = [
  {
    id: "q1",
    grade: 4,
    subject: "數學",
    questionType: "選擇題",
    difficulty: "標準",
    curriculumDomain: "數學領域",
    learningTopic: "面積",
    learningPerformance: "",
    learningContent: "",
    competency: "",
    prompt: "一個長方形長 5 公分、寬 3 公分，面積是多少？",
    options: ["8 平方公分", "15 平方公分", "16 平方公分", "20 平方公分"],
    answer: 1,
    explanation: "長 × 寬 = 5 × 3",
    knowledge: ["面積"],
    area: null,
  },
];

vi.mock("@/lib/questionBank", () => ({
  useQuestionBank: () => ({
    questions: MOCK_QUESTIONS,
    total: 1,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
    source: "local",
    isFallback: false,
  }),
}));

vi.mock("@/lib/targetedPractice", () => ({
  createWrongReviewReplacement: () => () => null,
  ensureTargetedPracticeLoaded: async () => {},
}));

function seedProfile(spacedReviews: unknown[], attempts: unknown[] = []) {
  storage.set(ADAPTIVE_STORAGE_KEY, JSON.stringify({ version: 2, attempts, spacedReviews }));
}

function seedPlayer() {
  storage.set(PLAYER_DATA_KEY, JSON.stringify({ name: "小晴", level: 1, exp: 0, gold: 10, totalAnswers: 0, badges: [] }));
}

beforeEach(() => {
  setLocation.mockClear();
  seedPlayer();
});

afterEach(() => {
  cleanup();
  storage.clear();
});

describe("今日複習中心", () => {
  it("沒有到期項目時顯示空狀態與練習入口", () => {
    seedProfile([]);
    render(<ReviewHub />);
    expect(screen.getByRole("heading", { name: "今日複習中心" })).toBeInTheDocument();
    expect(screen.getByText("目前沒有到期複習題")).toBeInTheDocument();
    const cta = screen.getByRole("button", { name: /去課綱練習/ });
    fireEvent.click(cta);
    expect(setLocation).toHaveBeenCalledWith("/practice");
  });

  it("列出到期複習題並顯示複習階梯", () => {
    seedProfile([{ questionId: "q1", intervalIndex: 1, dueAt: Date.now() - 1000, updatedAt: Date.now() - 2000 }]);
    render(<ReviewHub />);
    expect(screen.getByText("數學 · 面積")).toBeInTheDocument();
    // 「1 天後」同時出現在階梯節點與題卡徽章上
    expect(screen.getAllByText("1 天後")).toHaveLength(2);
    expect(screen.getByLabelText("複習排程階梯")).toBeInTheDocument();
    expect(screen.getByLabelText("1 天後排程 1 題")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /15 平方公分/ })).toBeInTheDocument();
  });

  it("全部作答後顯示完成面板並晉級間隔節點", () => {
    seedProfile([{ questionId: "q1", intervalIndex: 1, dueAt: Date.now() - 1000, updatedAt: Date.now() - 2000 }]);
    render(<ReviewHub />);
    fireEvent.click(screen.getByRole("button", { name: /15 平方公分/ }));

    // 答完先看到回饋，再手動結算
    expect(screen.getByText("✓ 答對了，線索有接上！")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /完成整理本輪/ }));

    // 完成面板（標準題：金幣 12、經驗 10）
    expect(screen.getByText("本輪複習完成 · 正確率 100%")).toBeInTheDocument();
    expect(screen.getByText(/\+12 金幣/)).toBeInTheDocument();
    expect(screen.getByText(/\+10 經驗/)).toBeInTheDocument();
    expect(screen.getByText("全對！今日複習線索全部接上，明天記得再回來。")).toBeInTheDocument();

    // 自適應排程單次晉級：intervalIndex 1 → 2（3 天後），不再到期
    const saved = JSON.parse(storage.get(ADAPTIVE_STORAGE_KEY) ?? "{}");
    expect(saved.attempts).toHaveLength(1);
    expect(saved.spacedReviews).toHaveLength(1);
    expect(saved.spacedReviews[0].intervalIndex).toBe(2);
    expect(saved.spacedReviews[0].dueAt).toBeGreaterThan(Date.now());
  });

  it("答錯時顯示解析，結算後提供錯題魔王入口並重設間隔", () => {
    seedProfile([{ questionId: "q1", intervalIndex: 1, dueAt: Date.now() - 1000, updatedAt: Date.now() - 2000 }]);
    render(<ReviewHub />);
    fireEvent.click(screen.getByRole("button", { name: /8 平方公分/ }));

    // 結算前先看到解析
    expect(screen.getByText(/正解是 B/)).toBeInTheDocument();
    expect(screen.getByText(/長 × 寬 = 5 × 3/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /完成整理本輪/ }));
    expect(screen.getByRole("button", { name: /進錯題魔王複習 1 題/ })).toBeInTheDocument();

    // 答錯重設回 20 分鐘節點，只記一次
    const saved = JSON.parse(storage.get(ADAPTIVE_STORAGE_KEY) ?? "{}");
    expect(saved.attempts).toHaveLength(1);
    expect(saved.spacedReviews[0].intervalIndex).toBe(0);
  });

  it("標籤式選項題不渲染位置字母晶片，答錯回饋直接引述選項字母（deep019 回歸）", () => {
    // 題型取自 runtime_bank_elementary：句子以 A「…」內嵌在題幹，options 是字母
    const bareLabel = {
      ...MOCK_QUESTIONS[0],
      id: "q-bare",
      subject: "國語",
      learningTopic: "詞義與詞性",
      prompt: "下列哪一句畫引號的詞是動詞？A「他把房間打掃得乾乾淨淨。」B「這個問題非常簡單。」C「她的笑容很甜美。」D「圖書館安安靜靜的。」",
      options: ["A", "B", "D", "C"],
      answer: 0,
      explanation: "「打掃」表示動作，是動詞。",
    };
    seedProfile([{ questionId: "q-bare", intervalIndex: 1, dueAt: Date.now() - 1000, updatedAt: Date.now() - 2000 }]);
    // 直接覆寫 mock 陣列內容（同一個陣列參考被 useQuestionBank 回傳）
    MOCK_QUESTIONS.length = 0;
    MOCK_QUESTIONS.push(bareLabel);
    try {
      const { container } = render(<ReviewHub />);
      // 位置晶片隱藏：不再出現 review-hub-opt-letter
      expect(container.querySelectorAll(".review-hub-opt-letter")).toHaveLength(0);
      // 四個字母選項列都在
      expect(container.querySelectorAll(".review-hub-opt")).toHaveLength(4);

      // 答錯（選 B）→ 回饋引述字母本身，而不是「你選了 B，正解是 A」的位置字母疊加
      fireEvent.click(screen.getByRole("button", { name: "B" }));
      expect(screen.getByText(/你選了 B，正解是 A/)).toBeInTheDocument();
    } finally {
      MOCK_QUESTIONS.length = 0;
      MOCK_QUESTIONS.push({
        id: "q1",
        grade: 4,
        subject: "數學",
        questionType: "選擇題",
        difficulty: "標準",
        curriculumDomain: "數學領域",
        learningTopic: "面積",
        learningPerformance: "",
        learningContent: "",
        competency: "",
        prompt: "一個長方形長 5 公分、寬 3 公分，面積是多少？",
        options: ["8 平方公分", "15 平方公分", "16 平方公分", "20 平方公分"],
        answer: 1,
        explanation: "長 × 寬 = 5 × 3",
        knowledge: ["面積"],
        area: null,
      } as never);
    }
  });

  it("玩家資源一併寫入", () => {
    seedProfile([{ questionId: "q1", intervalIndex: 1, dueAt: Date.now() - 1000, updatedAt: Date.now() - 2000 }]);
    render(<ReviewHub />);
    fireEvent.click(screen.getByRole("button", { name: /15 平方公分/ }));
    fireEvent.click(screen.getByRole("button", { name: /完成整理本輪/ }));

    const player = JSON.parse(storage.get(PLAYER_DATA_KEY) ?? "{}");
    expect(player.gold).toBe(22);
    expect(player.exp).toBe(10);
    expect(player.totalAnswers).toBe(1);
  });
});
