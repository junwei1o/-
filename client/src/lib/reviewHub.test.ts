import { describe, expect, it } from "vitest";
import {
  buildReviewDeck,
  collectDueReviews,
  intervalDistribution,
  intervalLabel,
  isAdaptiveDifficulty,
  reviewProgress,
  SPACED_INTERVAL_LABELS,
  type DueReviewItem,
} from "./reviewHub";
import type { AdaptiveProfile } from "@/game/adaptiveLearning";
import type { PaperQuestion } from "./paperExam";

const NOW = 1_800_000_000_000;

function makeProfile(overrides: Partial<AdaptiveProfile> = {}): AdaptiveProfile {
  return { version: 2, attempts: [], spacedReviews: [], ...overrides };
}

const q1: PaperQuestion = {
  id: "q1",
  grade: 4,
  subject: "數學",
  difficulty: "標準",
  learningTopic: "面積",
  prompt: "一個長方形長 5 公分、寬 3 公分，面積是多少？",
  options: ["8 平方公分", "15 平方公分", "16 平方公分", "20 平方公分"],
  answer: 1,
  explanation: "長 × 寬",
};

const q2: PaperQuestion = {
  id: "q2",
  grade: 4,
  subject: "國語",
  difficulty: "基礎",
  learningTopic: "記敘文",
  prompt: "下列哪一句是敘述句？",
  options: ["甲", "乙", "丙", "丁"],
  answer: 0,
  explanation: "略",
};

describe("collectDueReviews", () => {
  it("沒有到期項目時回傳空清單", () => {
    expect(collectDueReviews(makeProfile(), NOW)).toEqual([]);
  });

  it("收集 spaced 到期的複習項，保留間隔節點與來源", () => {
    const profile = makeProfile({
      spacedReviews: [
        { questionId: "q1", intervalIndex: 1, dueAt: NOW - 1000, updatedAt: NOW - 1000 },
        { questionId: "q2", intervalIndex: 2, dueAt: NOW + 5000, updatedAt: NOW - 1000 },
      ],
    });
    const result = collectDueReviews(profile, NOW);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ questionId: "q1", source: "spaced", intervalIndex: 1 });
  });

  it("收集錯題複習（nextReviewDate）到期項，來源為 error", () => {
    const profile = makeProfile({
      attempts: [
        {
          questionId: "q2",
          curriculumDomain: "語文領域",
          knowledge: ["記敘文"],
          difficulty: "基礎",
          correct: false,
          responseMs: 8000,
          timeLimitMs: 25000,
          timestamp: NOW - 100_000,
          flagged: true,
          nextReviewDate: NOW - 10,
        },
      ],
    });
    const result = collectDueReviews(profile, NOW);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ questionId: "q2", source: "error", intervalIndex: null });
  });

  it("答對的題目不進錯題複習清單", () => {
    const profile = makeProfile({
      attempts: [
        {
          questionId: "q2",
          curriculumDomain: "語文領域",
          knowledge: ["記敘文"],
          difficulty: "基礎",
          correct: true,
          responseMs: 8000,
          timeLimitMs: 25000,
          timestamp: NOW - 100_000,
          flagged: false,
        },
      ],
    });
    expect(collectDueReviews(profile, NOW)).toEqual([]);
  });

  it("同一題同時在兩條來源時只算一次，spaced 優先", () => {
    const profile = makeProfile({
      spacedReviews: [{ questionId: "q1", intervalIndex: 0, dueAt: NOW - 1000, updatedAt: NOW - 1000 }],
      attempts: [
        {
          questionId: "q1",
          curriculumDomain: "數學領域",
          knowledge: ["面積"],
          difficulty: "標準",
          correct: false,
          responseMs: 8000,
          timeLimitMs: 25000,
          timestamp: NOW - 100_000,
          flagged: true,
          nextReviewDate: NOW - 10,
        },
      ],
    });
    const result = collectDueReviews(profile, NOW);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ source: "spaced", intervalIndex: 0 });
  });

  it("依到期時間升冪排序，並尊重上限", () => {
    const profile = makeProfile({
      spacedReviews: [
        { questionId: "q1", intervalIndex: 1, dueAt: NOW + 3000, updatedAt: 1 },
        { questionId: "q2", intervalIndex: 0, dueAt: NOW - 3000, updatedAt: 2 },
        { questionId: "q3", intervalIndex: 2, dueAt: NOW - 1000, updatedAt: 3 },
      ],
    });
    const result = collectDueReviews(profile, NOW, 2);
    expect(result.map((item) => item.questionId)).toEqual(["q2", "q3"]);
  });
});

describe("intervalLabel", () => {
  it("spaced 節點對應到中文標籤", () => {
    SPACED_INTERVAL_LABELS.forEach((label, index) => {
      expect(intervalLabel({ source: "spaced", intervalIndex: index })).toBe(label);
    });
  });

  it("error 來源與超出範圍的節點都顯示今日複習", () => {
    expect(intervalLabel({ source: "error", intervalIndex: null })).toBe("今日複習");
    expect(intervalLabel({ source: "spaced", intervalIndex: 99 })).toBe("今日複習");
  });
});

describe("buildReviewDeck", () => {
  const due: DueReviewItem[] = [
    { questionId: "q1", dueAt: NOW - 1000, intervalIndex: 1, source: "spaced" },
    { questionId: "q2", dueAt: NOW - 2000, intervalIndex: null, source: "error" },
    { questionId: "missing", dueAt: NOW - 3000, intervalIndex: null, source: "error" },
  ];
  const bank = new Map([["q1", q1], ["q2", q2]]);
  const variant: PaperQuestion = { ...q1, id: "t001", prompt: "變體題：長 7 寬 4", answer: 2, options: ["26", "27", "28", "30"] };

  it("有替換時顯示變體、紀錄寫回原始 id", () => {
    const deck = buildReviewDeck(due, bank, ({ source }) => (source.id === "q1" ? variant : null));
    expect(deck).toHaveLength(2);
    const first = deck[0];
    expect(first.display.id).toBe("t001");
    expect(first.recordQuestionId).toBe("q1");
    expect(first.isVariant).toBe(true);
    expect(first.key).toBe("q1:t001");
  });

  it("替換回 null 時保留原題", () => {
    const deck = buildReviewDeck([due[1]], bank, () => null);
    expect(deck).toHaveLength(1);
    expect(deck[0].display.id).toBe("q2");
    expect(deck[0].isVariant).toBe(false);
    expect(deck[0].recordQuestionId).toBe("q2");
  });

  it("題庫找不到的題目直接跳過", () => {
    const deck = buildReviewDeck(due, bank, () => null);
    expect(deck.map((item) => item.recordQuestionId)).toEqual(["q1", "q2"]);
  });

  it("usedIds 會累積，避免同一變體重複出", () => {
    const seen: string[][] = [];
    const deck = buildReviewDeck(
      [{ questionId: "a", dueAt: 1, intervalIndex: null, source: "error" }, { questionId: "b", dueAt: 2, intervalIndex: null, source: "error" }],
      new Map([["a", q1], ["b", { ...q1, id: "b" }]]),
      ({ usedIds }) => {
        seen.push(Array.from(usedIds));
        return usedIds.has("t001") ? null : variant;
      },
    );
    expect(deck[0].display.id).toBe("t001");
    expect(deck[1].display.id).toBe("b");
    expect(seen[1]).toContain("t001");
  });
});

describe("reviewProgress", () => {
  it("計算完成率並夾取在合法範圍", () => {
    expect(reviewProgress(4, 4, 3)).toEqual({ total: 4, answered: 4, correct: 3, rate: 75 });
    expect(reviewProgress(0, 0, 0)).toEqual({ total: 0, answered: 0, correct: 0, rate: 0 });
    expect(reviewProgress(2, 99, -1).answered).toBe(2);
    expect(reviewProgress(2, 1, 99).correct).toBe(1);
  });
});

describe("intervalDistribution", () => {
  it("依間隔節點統計已排程與已到期數", () => {
    const profile = makeProfile({
      spacedReviews: [
        { questionId: "a", intervalIndex: 0, dueAt: NOW - 1, updatedAt: 1 },
        { questionId: "b", intervalIndex: 0, dueAt: NOW + 1, updatedAt: 2 },
        { questionId: "c", intervalIndex: 2, dueAt: NOW - 1, updatedAt: 3 },
      ],
    });
    const result = intervalDistribution(profile, NOW);
    expect(result[0]).toEqual({ label: "20 分鐘後", scheduled: 2, due: 1 });
    expect(result[1]).toEqual({ label: "1 天後", scheduled: 0, due: 0 });
    expect(result[2]).toEqual({ label: "3 天後", scheduled: 1, due: 1 });
  });
});

describe("isAdaptiveDifficulty", () => {
  it("只接受三種難度", () => {
    expect(isAdaptiveDifficulty("基礎")).toBe(true);
    expect(isAdaptiveDifficulty("標準")).toBe(true);
    expect(isAdaptiveDifficulty("挑戰")).toBe(true);
    expect(isAdaptiveDifficulty("簡單")).toBe(false);
    expect(isAdaptiveDifficulty(undefined)).toBe(false);
  });
});
