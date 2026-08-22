import { describe, expect, it } from "vitest";
import { calculateAdaptiveReport, calculateKnowledgeHeatmap, calculateLearningTrendReport, defaultAdaptiveProfile, getAdaptiveBand, getDueReviewQuestionIds, getMemoryAlarmCount, getSpacedReviewSummary, loadAdaptiveProfile, recordAdaptiveAttempt, selectAdaptiveQuestions, selectSpacedReviewQuestion, SPACED_REVIEW_INTERVALS_MS } from "./adaptiveLearning";

type StorageMock = Storage;
function storageWith(value: string | null): StorageMock {
  const data = new Map<string, string>();
  if (value !== null) data.set("xue-adventure-adaptive-v1", value);
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, item) => data.set(key, item),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
    key: (index) => Array.from(data.keys())[index] ?? null,
    get length() { return data.size; },
  } as StorageMock;
}

const questions = [
  { id: "a", difficulty: "基礎" as const, curriculumDomain: "數學領域", knowledge: ["分數"] },
  { id: "b", difficulty: "標準" as const, curriculumDomain: "數學領域", knowledge: ["分數"] },
  { id: "c", difficulty: "挑戰" as const, curriculumDomain: "數學領域", knowledge: ["分數"] },
  { id: "d", difficulty: "標準" as const, curriculumDomain: "自然科學領域", knowledge: ["觀察"] },
];

describe("adaptive learning model", () => {
  it("falls back safely for corrupt or incompatible storage", () => {
    const storage = storageWith(JSON.stringify({ version: 99, attempts: "bad" }));
    expect(loadAdaptiveProfile(storage)).toEqual(defaultAdaptiveProfile);
    expect(storage.getItem("xue-adventure-adaptive-v1")).toBeNull();
  });

  it("migrates v1 attempts without inventing a review queue", () => {
    const storage = storageWith(JSON.stringify({ version: 1, attempts: [{ questionId: "a", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "基礎", correct: false, responseMs: 10_000, timeLimitMs: 25_000, timestamp: 100 }] }));
    expect(loadAdaptiveProfile(storage)).toMatchObject({ version: 2, attempts: [expect.objectContaining({ questionId: "a" })], spacedReviews: [] });
  });

  it("detects review band after repeated weak attempts", () => {
    let profile = defaultAdaptiveProfile;
    for (let i = 0; i < 5; i += 1) profile = recordAdaptiveAttempt(profile, { questionId: "b", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "標準", correct: i === 0, responseMs: 20_000, timeLimitMs: 25_000, hintsUsed: 1 });
    expect(getAdaptiveBand(profile, questions)).toBe("複習");
    expect(selectAdaptiveQuestions(questions, profile, 2)[0].difficulty).toBe("基礎");
  });

  it("moves to challenge only after accurate and brisk performance", () => {
    let profile = defaultAdaptiveProfile;
    profile = recordAdaptiveAttempt(profile, { questionId: "b", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "標準", correct: true, responseMs: 10_000, timeLimitMs: 25_000 });
    for (let i = 0; i < 5; i += 1) profile = recordAdaptiveAttempt(profile, { questionId: "c", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "挑戰", correct: true, responseMs: 10_000, timeLimitMs: 25_000 });
    expect(getAdaptiveBand(profile, questions)).toBe("挑戰");
    expect(selectAdaptiveQuestions(questions, profile, 1)[0].difficulty).toBe("挑戰");
  });

  it("reports only observed attempts and surfaces weak knowledge points", () => {
    let profile = defaultAdaptiveProfile;
    profile = recordAdaptiveAttempt(profile, { questionId: "a", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "基礎", correct: true, responseMs: 10_000, timeLimitMs: 25_000 });
    profile = recordAdaptiveAttempt(profile, { questionId: "b", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "標準", correct: false, responseMs: 25_000, timeLimitMs: 25_000, hintsUsed: 1 });
    profile = recordAdaptiveAttempt(profile, { questionId: "d", curriculumDomain: "自然科學領域", knowledge: ["觀察"], difficulty: "標準", correct: false, responseMs: 20_000, timeLimitMs: 25_000, hintsUsed: 1 });
    profile = recordAdaptiveAttempt(profile, { questionId: "d", curriculumDomain: "自然科學領域", knowledge: ["觀察"], difficulty: "標準", correct: false, responseMs: 18_000, timeLimitMs: 25_000, hintsUsed: 1 });
    const report = calculateAdaptiveReport(profile, new Set(questions.map((question) => question.id)));
    expect(report.attempts).toBe(4);
    expect(report.accuracy).toBe(25);
    expect(report.hintRate).toBe(75);
    expect(report.domainStats[0]).toMatchObject({ domain: "自然科學領域", accuracy: 0 });
    expect(report.weakKnowledge[0]).toMatchObject({ tag: "觀察", accuracy: 0 });
    expect(report.difficultyStats.find((item) => item.difficulty === "標準")?.attempts).toBe(3);
  });

  it("prioritizes a weak knowledge point without removing other subjects", () => {
    let profile = defaultAdaptiveProfile;
    for (let i = 0; i < 2; i += 1) profile = recordAdaptiveAttempt(profile, { questionId: "b", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "標準", correct: false, responseMs: 25_000, timeLimitMs: 25_000 });
    const selected = selectAdaptiveQuestions(questions, profile, 3);
    expect(selected.some((question) => question.knowledge.includes("分數"))).toBe(true);
    expect(new Set(selected.map((question) => question.curriculumDomain)).size).toBeGreaterThan(1);
  });

  it("derives heatmap states only from valid observed attempts", () => {
    let profile = defaultAdaptiveProfile;
    profile = recordAdaptiveAttempt(profile, { questionId: "a", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "基礎", correct: false, responseMs: 18_000, timeLimitMs: 25_000 });
    profile = recordAdaptiveAttempt(profile, { questionId: "b", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "標準", correct: false, responseMs: 20_000, timeLimitMs: 25_000 });
    profile = recordAdaptiveAttempt(profile, { questionId: "d", curriculumDomain: "自然科學領域", knowledge: ["觀察"], difficulty: "標準", correct: true, responseMs: 10_000, timeLimitMs: 25_000 });
    profile = recordAdaptiveAttempt(profile, { questionId: "stale", curriculumDomain: "社會領域", knowledge: ["不應顯示"], difficulty: "基礎", correct: true, responseMs: 10_000, timeLimitMs: 25_000 });
    const cells = calculateKnowledgeHeatmap(profile, new Set(questions.map((question) => question.id)));
    expect(cells[0]).toMatchObject({ tag: "分數", attempts: 2, correct: 0, mastery: 0, status: "review" });
    expect(cells).toContainEqual(expect.objectContaining({ tag: "觀察", mastery: 100, status: "mastered" }));
    expect(cells.some((cell) => cell.tag === "不應顯示")).toBe(false);
  });

  it("queues a wrong answer, prioritizes it only when due, then lengthens the successful review interval", () => {
    const start = 1_000_000;
    let profile = recordAdaptiveAttempt(defaultAdaptiveProfile, { questionId: "b", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "標準", correct: false, responseMs: 25_000, timeLimitMs: 25_000, timestamp: start });
    expect(getSpacedReviewSummary(profile, new Set(questions.map((item) => item.id)), start)).toMatchObject({ scheduledCount: 1, dueCount: 0 });
    expect(selectSpacedReviewQuestion(questions, profile, start, () => 0).isReview).toBe(false);
    const dueAt = start + SPACED_REVIEW_INTERVALS_MS[0];
    expect(selectSpacedReviewQuestion(questions, profile, dueAt, () => 0.9)).toMatchObject({ question: expect.objectContaining({ id: "b" }), isReview: true, dueCount: 1 });
    profile = recordAdaptiveAttempt(profile, { questionId: "b", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "標準", correct: true, responseMs: 10_000, timeLimitMs: 25_000, timestamp: dueAt });
    expect(profile.spacedReviews).toContainEqual(expect.objectContaining({ questionId: "b", intervalIndex: 1, dueAt: dueAt + SPACED_REVIEW_INTERVALS_MS[1] }));
  });

  it("uses one day for a first error and three days for a repeated error while preserving doubt metadata", () => {
    const start = 10_000_000;
    const first = recordAdaptiveAttempt(defaultAdaptiveProfile, { questionId: "a", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "基礎", correct: false, responseMs: 25_000, timeLimitMs: 25_000, timestamp: start, flagged: true, errorType: "memory" });
    expect(first.attempts.at(-1)).toMatchObject({ flagged: true, errorType: "memory", nextReviewDate: start + 24 * 60 * 60_000 });
    const repeated = recordAdaptiveAttempt(first, { questionId: "a", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "基礎", correct: false, responseMs: 25_000, timeLimitMs: 25_000, timestamp: start + 1_000, flagged: false, errorType: "concept" });
    expect(repeated.attempts.at(-1)).toMatchObject({ flagged: false, errorType: "concept", nextReviewDate: start + 1_000 + 3 * 24 * 60 * 60_000 });
  });

  it("uses only the latest wrong attempt for the memory alarm and clears it after a correct answer", () => {
    const start = 20_000_000;
    let profile = recordAdaptiveAttempt(defaultAdaptiveProfile, { questionId: "a", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "基礎", correct: false, responseMs: 25_000, timeLimitMs: 25_000, timestamp: start });
    expect(getDueReviewQuestionIds(profile, new Set(["a"]), start + 24 * 60 * 60_000)).toEqual(["a"]);
    expect(getMemoryAlarmCount(profile, new Set(["a"]), start + 24 * 60 * 60_000)).toBe(1);
    profile = recordAdaptiveAttempt(profile, { questionId: "a", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "基礎", correct: true, responseMs: 8_000, timeLimitMs: 25_000, timestamp: start + 24 * 60 * 60_000 });
    expect(getDueReviewQuestionIds(profile, new Set(["a"]), start + 24 * 60 * 60_000)).toEqual([]);
  });

  it("drops a question from the review queue after the final successful interval", () => {
    const start = 2_000_000;
    let profile = defaultAdaptiveProfile;
    profile = recordAdaptiveAttempt(profile, { questionId: "a", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "基礎", correct: false, responseMs: 25_000, timeLimitMs: 25_000, timestamp: start });
    for (let intervalIndex = 0; intervalIndex < SPACED_REVIEW_INTERVALS_MS.length; intervalIndex += 1) {
      const dueAt = profile.spacedReviews?.[0]?.dueAt ?? start;
      profile = recordAdaptiveAttempt(profile, { questionId: "a", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "基礎", correct: true, responseMs: 8_000, timeLimitMs: 25_000, timestamp: dueAt });
    }
    expect(profile.spacedReviews).toEqual([]);
  });
});


describe("calculateLearningTrendReport", () => {
  const attempt = (overrides: Partial<AdaptiveAttempt>): AdaptiveAttempt => ({
    questionId: "q1",
    curriculumDomain: "自然",
    knowledge: ["行星"],
    difficulty: "標準",
    correct: true,
    responseMs: 5000,
    timeLimitMs: 25000,
    hintsUsed: 0,
    timestamp: 1_700_000_000_000,
    ...overrides,
  });

  it("keeps help habit and mastery as separate observed series", () => {
    const report = calculateLearningTrendReport({ version: 2, attempts: [
      attempt({ timestamp: 1_700_000_000_000, correct: false, hintsUsed: 1 }),
      attempt({ timestamp: 1_700_000_000_000 + 2 * 24 * 60 * 60 * 1000, correct: true, hintsUsed: 0 }),
      attempt({ timestamp: 1_700_000_000_000 + 9 * 24 * 60 * 60 * 1000, correct: true, hintsUsed: 1 }),
    ] }, undefined, 1_700_000_000_000 + 9 * 24 * 60 * 60 * 1000 + 1000);

    expect(report.helpHabit).toHaveLength(2);
    expect(report.helpHabit[0]).toMatchObject({ attempts: 2, hintRate: 50, mastery: 50 });
    expect(report.helpHabit[1]).toMatchObject({ attempts: 1, hintRate: 100, mastery: 100 });
    expect(report.knowledgeMastery).toHaveLength(1);
    expect(report.knowledgeMastery[0].points.map((point) => point.mastery)).toEqual([50, 100]);
  });

  it("returns empty trends without observed attempts", () => {
    expect(calculateLearningTrendReport({ version: 2, attempts: [] })).toEqual({ helpHabit: [], knowledgeMastery: [] });
  });
});
