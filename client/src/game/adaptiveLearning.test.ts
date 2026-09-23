import { describe, expect, it } from "vitest";
import { calculateAdaptiveReport, calculateKnowledgeHeatmap, filterQuestionsByGrade, loadUserPreferences, saveUserPreferences, calculateLearningTrendReport, defaultAdaptiveProfile, getAdaptiveBand, getDueReviewQuestionIds, getMemoryAlarmCount, getSpacedReviewSummary, isInWrongBook, getActiveWrongQuestionIds, getCorrectStreak, getRemainingToGraduate, WRONG_GRADUATION_STREAK, loadAdaptiveProfile, recordAdaptiveAttempt, selectAdaptiveQuestions, selectSpacedReviewQuestion, SPACED_REVIEW_INTERVALS_MS } from "./adaptiveLearning";

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

  it("does not collapse attempts to zero while the async question bank gating set is empty", () => {
    // 回歸：LearningInsights 在題庫非同步載入期間 questionIds 為空 Set。
    // 頁面 gating 與 ErrorTypeStatistics 一致：空 Set → 視為不依題庫過濾（傳 undefined）。
    // 此時報表／熱力圖／趨勢都必須保留真實 attempts，不能因 .has(id) 全 false 而歸零。
    let profile = defaultAdaptiveProfile;
    for (let i = 0; i < 3; i += 1) {
      profile = recordAdaptiveAttempt(profile, { questionId: `bank-not-loaded-${i}`, curriculumDomain: "數學領域", knowledge: ["分數與比例"], difficulty: "標準", correct: i !== 2, responseMs: 10_000, timeLimitMs: 25_000 });
    }
    const emptyBankIds = new Set<string>();
    // 頁面 gating：空 Set 視為「不依題庫過濾」。
    const visibleIds = emptyBankIds.size ? emptyBankIds : undefined;

    expect(calculateAdaptiveReport(profile, visibleIds).attempts).toBe(3);
    expect(calculateKnowledgeHeatmap(profile, visibleIds).some((cell) => cell.tag === "分數與比例")).toBe(true);
    expect(calculateLearningTrendReport(profile, visibleIds).helpHabit.length).toBeGreaterThan(0);

    // 對照：題庫真的載入後若帶有「不含本次作答」的非空 id 集合，才依集合過濾。
    expect(calculateAdaptiveReport(profile, new Set(["some-other-id"])).attempts).toBe(0);
  });

  it("prioritizes a weak knowledge point without removing other subjects", () => {
    let profile = defaultAdaptiveProfile;
    for (let i = 0; i < 2; i += 1) profile = recordAdaptiveAttempt(profile, { questionId: "b", curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "標準", correct: false, responseMs: 25_000, timeLimitMs: 25_000 });
    const selected = selectAdaptiveQuestions(questions, profile, 3);
    expect(selected.some((question) => question.knowledge.includes("分數"))).toBe(true);
    expect(new Set(selected.map((question) => question.curriculumDomain)).size).toBeGreaterThan(1);
  });

  it("breaks score ties with the injected randomizer instead of fixed array order", () => {
    const profile = defaultAdaptiveProfile;
    // 兩題同為「基礎」、皆未作答、知識點皆不弱 → 主分數完全相同（40+6=46）
    const tieQuestions = [
      { id: "x", difficulty: "基礎" as const, curriculumDomain: "數學領域", knowledge: ["代數"] },
      { id: "y", difficulty: "基礎" as const, curriculumDomain: "自然科學領域", knowledge: ["觀察"] },
    ];
    const seq = (values: number[]) => { let index = 0; return () => values[index++] ?? 0; };
    // x 拿到較小隨機鍵 → x 先出
    expect(selectAdaptiveQuestions(tieQuestions, profile, 2, seq([0.1, 0.9]))[0].id).toBe("x");
    // 同分但 y 拿到較小隨機鍵 → y 先出（順序可被隨機翻轉，證明不再固定 array 順序）
    expect(selectAdaptiveQuestions(tieQuestions, profile, 2, seq([0.9, 0.1]))[0].id).toBe("y");
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


describe("年級篩選（內容等級上限六年級）", () => {
  const pool = [3, 4, 5, 6].flatMap((grade) =>
    [1, 2].map((n) => ({ id: `g${grade}-${n}`, grade })),
  );
  const prefs = (gradeLevel: number) =>
    ({ version: 1, gradeLevel, difficultyPreference: "均衡混合", updatedAt: 1 }) as any;

  it("六年級會拿到 5–6 年級的題（±1 浮動，上限六年級）", () => {
    const picked = filterQuestionsByGrade(pool, prefs(6));
    expect(new Set(picked.map((q) => q.grade))).toEqual(new Set([5, 6]));
    expect(picked.every((q) => q.grade <= 6)).toBe(true);
  });

  it("三年級下限不會低於三年級（只拿 3–4 年級）", () => {
    const picked = filterQuestionsByGrade(pool, prefs(3));
    expect(new Set(picked.map((q) => q.grade))).toEqual(new Set([3, 4]));
  });

  it("四年級浮動範圍為 3–5 年級", () => {
    const picked = filterQuestionsByGrade(pool, prefs(4));
    expect(new Set(picked.map((q) => q.grade))).toEqual(new Set([3, 4, 5]));
  });
});

describe("使用者偏好：舊國中年級會夾成六年級", () => {
  it("七、八、九年級在載入時夾成六年級，不會被打回預設值 4", () => {
    for (const grade of [7, 8, 9]) {
      const storage = makeStorage();
      saveUserPreferences(
        { version: 1, gradeLevel: grade as any, difficultyPreference: "均衡混合", updatedAt: Date.now() },
        storage,
      );
      expect(loadUserPreferences(storage).gradeLevel).toBe(6);
    }
  });

  it("儲存八年級偏好後載入得到六年級而非預設四年級", () => {
    const storage = makeStorage();
    saveUserPreferences(
      { version: 1, gradeLevel: 8 as any, difficultyPreference: "均衡混合", updatedAt: Date.now() },
      storage,
    );
    expect(loadUserPreferences(storage).gradeLevel).toBe(6);
    expect(loadUserPreferences(storage).gradeLevel).not.toBe(4);
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

import {
  defaultUserPreferences,
  getTargetDifficultiesFromPrefs,
  loadUserPreferences,
  saveUserPreferences,
  USER_PREFERENCES_STORAGE_KEY,
} from "./adaptiveLearning";

function makeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    clear() { map.clear(); },
    getItem(key: string) { return map.has(key) ? map.get(key)! : null; },
    key(index: number) { return Array.from(map.keys())[index] ?? null; },
    removeItem(key: string) { map.delete(key); },
    setItem(key: string, value: string) { map.set(key, value); },
  } as Storage;
}

describe("使用者偏好：預設最高難度（F5）", () => {
  it("預設值是挑戰優先（新使用者直接面對最難題）", () => {
    expect(defaultUserPreferences.difficultyPreference).toBe("挑戰優先");
  });

  it("getTargetDifficultiesFromPrefs 預設回 [標準, 挑戰]", () => {
    expect(getTargetDifficultiesFromPrefs(defaultUserPreferences)).toEqual(["標準", "挑戰"]);
  });

  it("loadUserPreferences 沒有 localStorage 時回傳挑戰優先", () => {
    const storage = makeStorage();
    const loaded = loadUserPreferences(storage);
    expect(loaded.difficultyPreference).toBe("挑戰優先");
    expect(loaded.gradeLevel).toBe(4);
  });

  it("老使用者 localStorage 已有均衡混合時不被覆蓋", () => {
    const old = {
      version: 1,
      gradeLevel: 5,
      difficultyPreference: "均衡混合",
      updatedAt: 1700000000000,
    } as const;
    const storage = makeStorage({
      [USER_PREFERENCES_STORAGE_KEY]: JSON.stringify(old),
    });
    const loaded = loadUserPreferences(storage);
    expect(loaded.difficultyPreference).toBe("均衡混合");
    expect(loaded.gradeLevel).toBe(5);
  });

  it("saveUserPreferences 後再次讀回仍是自己存的挑戰優先", () => {
    const storage = makeStorage();
    saveUserPreferences(defaultUserPreferences, storage);
    const loaded = loadUserPreferences(storage);
    expect(loaded.difficultyPreference).toBe("挑戰優先");
  });
});

describe("錯題本：連續答對兩次才自動移出", () => {
  const att = (questionId: string, correct: boolean) => ({ questionId, correct });

  it("最新一題是錯 → 留在錯題本", () => {
    const attempts = [att("q", false), att("q", true), att("q", false)];
    expect(isInWrongBook(attempts, "q")).toBe(true);
  });

  it("只答對一次（前一筆仍是錯）→ 仍留在錯題本，需要再確認", () => {
    const attempts = [att("q", false), att("q", true)];
    expect(isInWrongBook(attempts, "q")).toBe(true);
  });

  it("連續兩次答對 → 自動移出錯題本", () => {
    const attempts = [att("q", false), att("q", true), att("q", true)];
    expect(isInWrongBook(attempts, "q")).toBe(false);
  });

  it("中途答錯會重新計算：連對中又錯一次，之後需再連續兩次對才移出", () => {
    // 錯→對→對（原本已可移出），但又錯→對，此時只連續對一次，仍留在錯題本。
    const attempts = [att("q", false), att("q", true), att("q", true), att("q", false), att("q", true)];
    expect(isInWrongBook(attempts, "q")).toBe(true);
    // 再答對一次（連續兩次）才移出。
    expect(isInWrongBook([...attempts, att("q", true)], "q")).toBe(false);
  });

  it("批次取得仍在錯題本的題目 id", () => {
    const attempts = [
      att("a", false), att("a", true), att("a", true), // a 連兩對 → 移出
      att("b", false), att("b", true),                // b 只對一次 → 留
      att("c", false),                                // c 錯 → 留
    ];
    expect(Array.from(getActiveWrongQuestionIds(attempts)).sort()).toEqual(["b", "c"]);
  });

  it("已連續答對次數與「再答對幾題畢業」", () => {
    // 最新錯 → streak 0，還要連續對 2 題。
    expect(getCorrectStreak([att("q", false), att("q", true), att("q", false)], "q")).toBe(0);
    expect(getRemainingToGraduate([att("q", false), att("q", true), att("q", false)], "q")).toBe(WRONG_GRADUATION_STREAK);
    // 錯→對（一次）→ streak 1，再對 1 題就畢業。
    expect(getCorrectStreak([att("q", false), att("q", true)], "q")).toBe(1);
    expect(getRemainingToGraduate([att("q", false), att("q", true)], "q")).toBe(1);
    // 連續兩對 → streak 2，剩餘 0（已畢業）。
    expect(getCorrectStreak([att("q", false), att("q", true), att("q", true)], "q")).toBe(2);
    expect(getRemainingToGraduate([att("q", false), att("q", true), att("q", true)], "q")).toBe(0);
  });
});
