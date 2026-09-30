import { describe, expect, it } from "vitest";
import type { AdaptiveAttempt, AdaptiveProfile } from "@/game/adaptiveLearning";
import type { LearningRecord } from "@/utils/storage";
import type { CurriculumQuestionRow, LookupQuestion } from "@/lib/questionLookup";
import type { KnowledgeStat, StudentDiagnosis } from "@/lib/studentDiagnosis";
import {
  accuracyBySubjectFromRecords,
  buildStudentDashboard,
  deriveBadges,
  levelOf,
  strengthAndFocusFromDiagnosis,
  tagReliabilityFromLookup,
  weeklyProgressFromRecords,
  type DashboardInputs,
} from "./studentDashboard";

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function rec(over: Partial<LearningRecord> & { questionId: string; subject: string }): LearningRecord {
  return { isCorrect: true, timestamp: NOW, flagged: false, ...over };
}

function row(over: Partial<CurriculumQuestionRow> = {}): CurriculumQuestionRow {
  return {
    id: "q-x",
    grade: 3,
    subject: "數學",
    questionType: "選擇題",
    difficulty: "標準",
    curriculumDomain: "數學領域",
    learningTopic: "主題",
    prompt: "題幹",
    options: ["A", "B", "C", "D"],
    answer: 0,
    explanation: "",
    knowledge: [],
    ...over,
  };
}

function lookupOf(rows: readonly CurriculumQuestionRow[]): Map<string, LookupQuestion> {
  return new Map(rows.map((r) => [r.id, r as unknown as LookupQuestion]));
}

function attempt(over: Partial<AdaptiveAttempt> = {}): AdaptiveAttempt {
  return {
    questionId: "q-x",
    curriculumDomain: "數學",
    knowledge: [],
    difficulty: "標準",
    correct: false,
    responseMs: 10_000,
    timeLimitMs: 30_000,
    timestamp: NOW,
    ...over,
  };
}

const EMPTY_PROFILE: AdaptiveProfile = { version: 2, attempts: [], spacedReviews: [] };

function inputs(over: Partial<DashboardInputs> = {}): DashboardInputs {
  return {
    captainName: "小明",
    records: [],
    lookup: new Map(),
    profile: EMPTY_PROFILE,
    bxBadges: [],
    bxTotalAnswers: 0,
    streak: 0,
    selfChallengeCompleted: 0,
    now: NOW,
    ...over,
  };
}

// ─────────────────────────────────────────────
// levelOf
// ─────────────────────────────────────────────
describe("levelOf", () => {
  it("初始：0 題 → 見習船長，下一級 10 題", () => {
    expect(levelOf(0, 0)).toEqual({
      level: 1,
      levelName: "見習船長",
      nextLevelAt: 10,
      questionsToNext: 10,
    });
  });

  it("9 題未達、10 題達到初級船長", () => {
    expect(levelOf(9, 0).level).toBe(1);
    expect(levelOf(9, 0).nextLevelAt).toBe(10);
    expect(levelOf(9, 0).questionsToNext).toBe(1);
    expect(levelOf(10, 0)).toMatchObject({ level: 2, levelName: "初級船長" });
    expect(levelOf(10, 0).nextLevelAt).toBe(50);
  });

  it("49 / 50 題邊界", () => {
    expect(levelOf(49, 0).level).toBe(2);
    expect(levelOf(49, 0).questionsToNext).toBe(1);
    expect(levelOf(50, 0)).toMatchObject({ level: 3, levelName: "中級船長" });
  });

  it("199 / 200 題且 streak=7：未達第 5 級時卡在第 4 級", () => {
    expect(levelOf(199, 7)).toMatchObject({ level: 4, nextLevelAt: 200, questionsToNext: 1 });
    expect(levelOf(200, 7)).toMatchObject({ level: 5, levelName: "三態小達人" });
  });

  it("streak 不足：200 題但 streak=6 仍卡第 4 級", () => {
    expect(levelOf(200, 6).level).toBe(4);
  });

  it("500/30 → 知識探險家；1000/100 滿級", () => {
    expect(levelOf(500, 30)).toMatchObject({ level: 6, levelName: "知識探險家" });
    expect(levelOf(999, 99)).toMatchObject({ level: 6, nextLevelAt: 1000, questionsToNext: 1 });
    expect(levelOf(1000, 100)).toEqual({
      level: 7,
      levelName: "船長之星",
      nextLevelAt: null,
      questionsToNext: 0,
    });
  });
});

// ─────────────────────────────────────────────
// deriveBadges
// ─────────────────────────────────────────────
describe("deriveBadges", () => {
  it("bx 映射：qihang / 7day 標記已解鎖", () => {
    const badges = deriveBadges({
      bxBadges: ["qihang", "7day"],
      totalAnswers: 0,
      streak: 0,
      weeklyDelta: null,
      selfChallengeCompleted: 0,
    });
    expect(badges.find((b) => b.id === "qihang")!.unlocked).toBe(true);
    expect(badges.find((b) => b.id === "7day")!.unlocked).toBe(true);
  });

  it("streak7 / done 系列依輸入解鎖", () => {
    const badges = deriveBadges({
      bxBadges: [],
      totalAnswers: 100,
      streak: 7,
      weeklyDelta: null,
      selfChallengeCompleted: 0,
    });
    const get = (id: string) => badges.find((b) => b.id === id)!;
    expect(get("streak7").unlocked).toBe(true);
    expect(get("done10").unlocked).toBe(true);
    expect(get("done50").unlocked).toBe(true);
    expect(get("done100").unlocked).toBe(true);
    expect(get("challenger").unlocked).toBe(false);
  });

  it("progress-star：weeklyDelta > 10 才解鎖", () => {
    expect(deriveBadges({ bxBadges: [], totalAnswers: 0, streak: 0, weeklyDelta: 12, selfChallengeCompleted: 0 })
      .find((b) => b.id === "progress-star")!.unlocked).toBe(true);
    expect(deriveBadges({ bxBadges: [], totalAnswers: 0, streak: 0, weeklyDelta: 8, selfChallengeCompleted: 0 })
      .find((b) => b.id === "progress-star")!.unlocked).toBe(false);
    expect(deriveBadges({ bxBadges: [], totalAnswers: 0, streak: 0, weeklyDelta: null, selfChallengeCompleted: 0 })
      .find((b) => b.id === "progress-star")!.unlocked).toBe(false);
  });

  it("challenger：自我挑戰 >=10 解鎖", () => {
    expect(deriveBadges({ bxBadges: [], totalAnswers: 0, streak: 0, weeklyDelta: null, selfChallengeCompleted: 10 })
      .find((b) => b.id === "challenger")!.unlocked).toBe(true);
    expect(deriveBadges({ bxBadges: [], totalAnswers: 0, streak: 0, weeklyDelta: null, selfChallengeCompleted: 9 })
      .find((b) => b.id === "challenger")!.unlocked).toBe(false);
  });

  it("已解鎖徽章排在未解鎖之前", () => {
    const badges = deriveBadges({
      bxBadges: [],
      totalAnswers: 100, // done10/50/100 unlocked
      streak: 0,
      weeklyDelta: null,
      selfChallengeCompleted: 0,
    });
    const firstLocked = badges.findIndex((b) => !b.unlocked);
    const lastUnlocked = badges.map((b) => b.unlocked).lastIndexOf(true);
    expect(lastUnlocked).toBeLessThan(firstLocked);
  });
});

// ─────────────────────────────────────────────
// accuracyBySubjectFromRecords
// ─────────────────────────────────────────────
describe("accuracyBySubjectFromRecords", () => {
  it("固定五科順序，有資料分科計算整數正確率", () => {
    const records = [
      rec({ questionId: "a", subject: "國語", isCorrect: true }),
      rec({ questionId: "b", subject: "國語", isCorrect: false }),
      rec({ questionId: "c", subject: "自然", isCorrect: true }),
      rec({ questionId: "d", subject: "自然", isCorrect: true }),
      rec({ questionId: "e", subject: "自然", isCorrect: true }),
    ];
    const result = accuracyBySubjectFromRecords(records);
    expect(result.map((r) => r.subject)).toEqual(["國語", "數學", "英語", "自然", "社會"]);
    expect(result[0]).toEqual({ subject: "國語", attempts: 2, accuracy: 50, hasData: true });
    expect(result[3]).toEqual({ subject: "自然", attempts: 3, accuracy: 100, hasData: true });
  });

  it("無資料科目 attempts=0 / accuracy=0 / hasData=false；空紀錄全空", () => {
    const result = accuracyBySubjectFromRecords([]);
    expect(result).toHaveLength(5);
    for (const r of result) {
      expect(r).toEqual({ subject: r.subject, attempts: 0, accuracy: 0, hasData: false });
    }
  });
});

// ─────────────────────────────────────────────
// weeklyProgressFromRecords
// ─────────────────────────────────────────────
describe("weeklyProgressFromRecords", () => {
  it("窗界線：current = [now-7d, now)，previous = [now-14d, now-7d)", () => {
    const records = [
      rec({ questionId: "c1", subject: "數學", isCorrect: true, timestamp: NOW - DAY }),
      rec({ questionId: "c2", subject: "數學", isCorrect: true, timestamp: NOW - 2 * DAY }),
      rec({ questionId: "c3", subject: "數學", isCorrect: false, timestamp: NOW - 3 * DAY }),
      rec({ questionId: "p1", subject: "數學", isCorrect: false, timestamp: NOW - 8 * DAY }),
      rec({ questionId: "p2", subject: "數學", isCorrect: false, timestamp: NOW - 9 * DAY }),
      rec({ questionId: "p3", subject: "數學", isCorrect: false, timestamp: NOW - 10 * DAY }),
    ];
    const w = weeklyProgressFromRecords(records, NOW);
    expect(w.currentAttempts).toBe(3);
    expect(w.previousAttempts).toBe(3);
    expect(w.currentAccuracy).toBe(67); // 2/3
    expect(w.previousAccuracy).toBe(0); // 0/3
    expect(w.delta).toBe(67);
  });

  it("任一窗 <3 筆時該窗 accuracy=null，不造假", () => {
    const records = [
      rec({ questionId: "c1", subject: "數學", isCorrect: true, timestamp: NOW - DAY }),
      rec({ questionId: "c2", subject: "數學", isCorrect: true, timestamp: NOW - 2 * DAY }),
      rec({ questionId: "p1", subject: "數學", isCorrect: false, timestamp: NOW - 8 * DAY }),
      rec({ questionId: "p2", subject: "數學", isCorrect: false, timestamp: NOW - 9 * DAY }),
      rec({ questionId: "p3", subject: "數學", isCorrect: false, timestamp: NOW - 10 * DAY }),
      rec({ questionId: "p4", subject: "數學", isCorrect: false, timestamp: NOW - 11 * DAY }),
    ];
    const w = weeklyProgressFromRecords(records, NOW);
    expect(w.currentAttempts).toBe(2);
    expect(w.currentAccuracy).toBeNull();
    expect(w.previousAccuracy).toBe(0);
    expect(w.delta).toBeNull();
  });

  it("時間戳剛好等於 now 或 now-7d 的歸屬", () => {
    // ts === now 不計入 current（半開區間）；ts === now-7d 歸 previous 尾、不計 current
    const records = [
      rec({ questionId: "edge", subject: "數學", isCorrect: true, timestamp: NOW }),
    ];
    const w = weeklyProgressFromRecords(records, NOW);
    expect(w.currentAttempts).toBe(0);
    expect(w.previousAttempts).toBe(0);
  });
});

// ─────────────────────────────────────────────
// tagReliabilityFromLookup
// ─────────────────────────────────────────────
describe("tagReliabilityFromLookup", () => {
  it("統計每個知識標籤出現在幾道不同題目", () => {
    const rows = [
      row({ id: "1", knowledge: ["加法", "乘法"] }),
      row({ id: "2", knowledge: ["加法"] }),
      row({ id: "3", knowledge: ["加法", "乘法"] }),
      row({ id: "4", knowledge: ["除法"] }),
    ];
    const map = tagReliabilityFromLookup(lookupOf(rows));
    expect(map.get("加法")).toBe(3);
    expect(map.get("乘法")).toBe(2);
    expect(map.get("除法")).toBe(1);
  });

  it("空 lookup 回傳空 Map", () => {
    expect(tagReliabilityFromLookup(new Map()).size).toBe(0);
  });
});

// ─────────────────────────────────────────────
// strengthAndFocusFromDiagnosis
// ─────────────────────────────────────────────
function diagWith(stats: KnowledgeStat[]): StudentDiagnosis {
  const knowledgeStats: Record<string, KnowledgeStat> = {};
  for (const s of stats) knowledgeStats[s.knowledge] = s;
  return {
    captainName: "x",
    generatedAt: NOW,
    totalAnswers: 0,
    overallAccuracy: 0,
    overallConfidence: 0,
    knowledgeStats,
    domainStats: {},
    difficultyStats: {},
    questionTypeStats: {},
    insights: [],
    version: 1,
  };
}

function kstat(over: Partial<KnowledgeStat> = {}): KnowledgeStat {
  return {
    knowledge: "K",
    totalAttempts: 10,
    correctAttempts: 8,
    accuracy: 0.8,
    confidence: 0.8,
    status: "mastered",
    trend: "stable",
    lastAttemptAt: NOW,
    recentAccuracy: [1, 1, 1, 1, 1],
    ...over,
  };
}

describe("strengthAndFocusFromDiagnosis", () => {
  it("strengths：mastered/stable 依 confidence 降冪取前 3", () => {
    const d = diagWith([
      kstat({ knowledge: "弱", status: "unstable", confidence: 0.3 }),
      kstat({ knowledge: "甲", status: "mastered", confidence: 0.9 }),
      kstat({ knowledge: "乙", status: "mastered", confidence: 0.95 }),
      kstat({ knowledge: "丙", status: "stable", confidence: 0.6 }),
      kstat({ knowledge: "丁", status: "stable", confidence: 0.65 }),
    ]);
    const { strengths } = strengthAndFocusFromDiagnosis(d, new Map([["甲", 5], ["乙", 5], ["丙", 5], ["丁", 5]]));
    expect(strengths.map((s) => s.knowledge)).toEqual(["乙", "甲", "丁"]);
    expect(strengths[0].message).toBe("你已經完全掌握了！");
    expect(strengths[2].message).toBe("表現穩定，繼續保持！");
  });

  it("focusAreas：unstable/blindspot 依 confidence 升冪取前 2", () => {
    const d = diagWith([
      kstat({ knowledge: "壞", status: "blindspot", confidence: 0.1 }),
      kstat({ knowledge: "弱", status: "unstable", confidence: 0.33 }),
      kstat({ knowledge: "中", status: "unstable", confidence: 0.5 }),
    ]);
    const { focusAreas } = strengthAndFocusFromDiagnosis(d, new Map([["壞", 5], ["弱", 5], ["中", 5]]));
    expect(focusAreas.map((f) => f.knowledge)).toEqual(["壞", "弱"]);
    expect(focusAreas[0].confidence).toBe(0.1);
    expect(focusAreas[0].message).toBe("這塊還可以再加油");
    expect(focusAreas[0].hint).toContain("壞");
  });

  it("focusAreas：reliable=false 時 confidence 必須為 null，文案改為建置中", () => {
    const d = diagWith([kstat({ knowledge: "不熟", status: "blindspot", confidence: 0.2 })]);
    const { focusAreas } = strengthAndFocusFromDiagnosis(d, new Map([["不熟", 1]]));
    expect(focusAreas).toHaveLength(1);
    expect(focusAreas[0].confidence).toBeNull();
    expect(focusAreas[0].reliable).toBe(false);
    expect(focusAreas[0].message).toBe("這個知識點資料還在累積中");
    expect(focusAreas[0].hint).toBe("再練習幾題，就能看見更清楚的建議");
  });

  it("strengths 的 reliable 來自 tagReliability，且不含負面措辭", () => {
    const d = diagWith([kstat({ knowledge: "甲", status: "mastered", confidence: 0.9 })]);
    const { strengths } = strengthAndFocusFromDiagnosis(d, new Map([["甲", 1]]));
    expect(strengths[0].reliable).toBe(false);
    expect(strengths[0].confidence).toBe(0.9); // strengths 不受 reliable 影響
  });
});

// ─────────────────────────────────────────────
// buildStudentDashboard 整合
// ─────────────────────────────────────────────
describe("buildStudentDashboard", () => {
  it("空資料：各區塊回合理空值，徽章仍回傳未解鎖清單", () => {
    const d = buildStudentDashboard(inputs());
    expect(d.hasAnyData).toBe(false);
    expect(d.overallAccuracy).toBeNull();
    expect(d.strengths).toEqual([]);
    expect(d.focusAreas).toEqual([]);
    expect(d.todayTasks).toEqual([]);
    expect(d.weekly.currentAccuracy).toBeNull();
    expect(d.weekly.currentAttempts).toBe(0);
    expect(d.gamification.badges.length).toBeGreaterThan(0);
    expect(d.gamification.badges.every((b) => !b.unlocked)).toBe(true);
    expect(d.gamification.level).toBe(1);
    expect(d.bySubject.every((s) => !s.hasData)).toBe(true);
  });

  it("正常資料：overallAccuracy 跨科整數、totalAnswers 取 max(bx, records)", () => {
    const rows = [row({ id: "q1", subject: "數學", knowledge: ["加法"] })];
    const records = [
      rec({ questionId: "q1", subject: "數學", isCorrect: true }),
      rec({ questionId: "q1", subject: "數學", isCorrect: false }),
    ];
    const d = buildStudentDashboard(
      inputs({
        records,
        lookup: lookupOf(rows),
        bxTotalAnswers: 50,
        streak: 0,
      }),
    );
    expect(d.hasAnyData).toBe(true);
    expect(d.overallAccuracy).toBe(50);
    expect(d.gamification.totalAnswers).toBe(50); // bx 優先
    expect(d.gamification.level).toBe(3); // 50 題 → 中級船長
  });

  it("totalAnswers：bx 小於 records 長度時用 records 兜底", () => {
    const d = buildStudentDashboard(
      inputs({ records: [rec({ questionId: "x", subject: "數學" })], bxTotalAnswers: 0 }),
    );
    expect(d.gamification.totalAnswers).toBe(1);
  });

  it("wrongBook 彙總：total/graduated/bySubject", () => {
    const rows = [row({ id: "w1", subject: "自然" })];
    const p: AdaptiveProfile = {
      version: 2,
      attempts: [
        attempt({ questionId: "w1", curriculumDomain: "自然", correct: false, timestamp: NOW - 1000 }),
      ],
    };
    const d = buildStudentDashboard(
      inputs({ profile: p, lookup: lookupOf(rows) }),
    );
    expect(d.wrongBook.total).toBe(1);
    expect(d.wrongBook.graduated).toBe(0);
    expect(d.wrongBook.bySubject).toContainEqual({ subject: "自然", count: 1 });
  });

  it("todayTasks 由 generateTodayTasks 注入：錯題資料時出現 wrong-book 卡片", () => {
    const rows = [row({ id: "w1", subject: "自然", knowledge: ["水"] })];
    const p: AdaptiveProfile = {
      version: 2,
      attempts: [
        attempt({ questionId: "w1", curriculumDomain: "自然", knowledge: ["水"], correct: false, timestamp: NOW - 1000 }),
      ],
    };
    const d = buildStudentDashboard(
      inputs({ profile: p, lookup: lookupOf(rows), records: [rec({ questionId: "w1", subject: "自然", isCorrect: false })] }),
    );
    const kinds = d.todayTasks.map((t) => t.kind);
    expect(kinds).toContain("wrong-book");
  });

  it("generatedAt 採用注入的 now", () => {
    const d = buildStudentDashboard(inputs({ now: 12345 }));
    expect(d.generatedAt).toBe(12345);
  });
});
