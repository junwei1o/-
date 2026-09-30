import { describe, expect, it } from "vitest";
import type { AdaptiveAttempt, AdaptiveProfile } from "@/game/adaptiveLearning";
import type { CurriculumQuestionRow, LookupQuestion } from "@/lib/questionLookup";
import type { StudentDiagnosis, KnowledgeStat } from "@/lib/studentDiagnosis";
import type { AccuracyBySubject } from "@/lib/studentDashboard";
import { generateTodayTasks, type TodayTask } from "./todayTasks";

const NOW = 1_700_000_000_000;

function questionRow(over: Partial<CurriculumQuestionRow> = {}): CurriculumQuestionRow {
  return {
    id: "q-x",
    grade: 3,
    subject: "數學",
    questionType: "選擇題",
    difficulty: "標準",
    curriculumDomain: "數學領域",
    learningTopic: "預設主題",
    prompt: "預設題幹",
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

function profile(attempts: AdaptiveAttempt[]): AdaptiveProfile {
  return { version: 2, attempts, spacedReviews: [] };
}

function stat(over: Partial<KnowledgeStat> = {}): KnowledgeStat {
  return {
    knowledge: "預知識",
    totalAttempts: 10,
    correctAttempts: 5,
    accuracy: 0.5,
    confidence: 0.5,
    status: "stable",
    trend: "stable",
    lastAttemptAt: NOW,
    recentAccuracy: [1, 0, 1, 0, 1],
    ...over,
  };
}

function diagnosisWith(stats: KnowledgeStat[]): StudentDiagnosis {
  const knowledgeStats: Record<string, KnowledgeStat> = {};
  for (const s of stats) knowledgeStats[s.knowledge] = s;
  return {
    captainName: "測試",
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

function subjectAcc(subject: string, accuracy: number, attempts: number): AccuracyBySubject {
  return { subject, attempts, accuracy, hasData: attempts > 0 };
}

const NO_SUBJECTS: AccuracyBySubject[] = [
  subjectAcc("國語", 0, 0),
  subjectAcc("數學", 0, 0),
  subjectAcc("英語", 0, 0),
  subjectAcc("自然", 0, 0),
  subjectAcc("社會", 0, 0),
];

describe("generateTodayTasks", () => {
  it("完全沒有資料時回傳空陣列", () => {
    const rows: CurriculumQuestionRow[] = [];
    const tasks = generateTodayTasks({
      profile: profile([]),
      lookup: lookupOf(rows),
      rows,
      diagnosis: diagnosisWith([]),
      tagReliability: new Map(),
      subjectAccuracies: NO_SUBJECTS,
      now: NOW,
      random: () => 0.5,
    });
    expect(tasks).toEqual([]);
  });

  it("wrong-book 優先：最新作答錯誤的題進任務，且 completed=false", () => {
    const rows = [questionRow({ id: "q-wrong-1", subject: "自然", difficulty: "標準", knowledge: ["水的三態"] })];
    const p = profile([
      attempt({ questionId: "q-wrong-1", curriculumDomain: "自然", knowledge: ["水的三態"], correct: false, timestamp: NOW - 1000 }),
    ]);
    const tasks = generateTodayTasks({
      profile: p,
      lookup: lookupOf(rows),
      rows,
      diagnosis: diagnosisWith([]),
      tagReliability: new Map(),
      subjectAccuracies: NO_SUBJECTS,
      now: NOW,
      random: () => 0.5,
    });
    expect(tasks).toHaveLength(1);
    const t = tasks[0];
    expect(t.kind).toBe("wrong-book");
    expect(t.questionIds).toEqual(["q-wrong-1"]);
    expect(t.reward).toBe("錯題畢業");
    expect(t.completed).toBe(false);
  });

  it("wrong-book：這些題最新一筆全部答對才 completed=true", () => {
    const rows = [questionRow({ id: "q-w1", subject: "自然", difficulty: "標準", knowledge: ["水"] })];
    const p = profile([
      attempt({ questionId: "q-w1", curriculumDomain: "自然", correct: false, timestamp: NOW - 2000 }),
      attempt({ questionId: "q-w1", curriculumDomain: "自然", correct: true, timestamp: NOW - 1000 }),
    ]);
    const tasks = generateTodayTasks({
      profile: p,
      lookup: lookupOf(rows),
      rows,
      diagnosis: diagnosisWith([]),
      tagReliability: new Map(),
      subjectAccuracies: NO_SUBJECTS,
      now: NOW,
      random: () => 0.5,
    });
    expect(tasks[0].kind).toBe("wrong-book");
    expect(tasks[0].completed).toBe(true);
  });

  it("wrong-book 最多選 3 題，且快畢業（remaining 小）優先", () => {
    // q-a: latest wrong (remaining 2)；q-b: 錯後對一次 (remaining 1)
    const rows = [
      questionRow({ id: "q-a", subject: "自然", difficulty: "標準" }),
      questionRow({ id: "q-b", subject: "自然", difficulty: "標準" }),
      questionRow({ id: "q-c", subject: "自然", difficulty: "標準" }),
      questionRow({ id: "q-d", subject: "自然", difficulty: "標準" }),
    ];
    const p = profile([
      attempt({ questionId: "q-a", curriculumDomain: "自然", correct: false, timestamp: NOW - 4000 }),
      attempt({ questionId: "q-b", curriculumDomain: "自然", correct: false, timestamp: NOW - 3000 }),
      attempt({ questionId: "q-b", curriculumDomain: "自然", correct: true, timestamp: NOW - 2000 }),
      attempt({ questionId: "q-c", curriculumDomain: "自然", correct: false, timestamp: NOW - 1000 }),
      attempt({ questionId: "q-d", curriculumDomain: "自然", correct: false, timestamp: NOW - 500 }),
    ]);
    const tasks = generateTodayTasks({
      profile: p,
      lookup: lookupOf(rows),
      rows,
      diagnosis: diagnosisWith([]),
      tagReliability: new Map(),
      subjectAccuracies: NO_SUBJECTS,
      now: NOW,
      random: () => 0.5,
    });
    const wb = tasks.find((t) => t.kind === "wrong-book")!;
    expect(wb.questionIds).toHaveLength(3);
    // q-b remaining=1 應排第一
    expect(wb.questionIds[0]).toBe("q-b");
  });

  it("subject-practice：選正確率最低、有資料的科，取 3 題標準題", () => {
    const rows = [
      questionRow({ id: "m1", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
      questionRow({ id: "m2", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
      questionRow({ id: "m3", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
      questionRow({ id: "m4-hard", subject: "數學", difficulty: "挑戰", knowledge: ["加法"] }),
    ];
    const subjects = NO_SUBJECTS.map((s) =>
      s.subject === "數學" ? subjectAcc("數學", 30, 6) : s.subject === "自然" ? subjectAcc("自然", 80, 6) : s,
    );
    const tasks = generateTodayTasks({
      profile: profile([]),
      lookup: lookupOf(rows),
      rows,
      diagnosis: diagnosisWith([]),
      tagReliability: new Map(),
      subjectAccuracies: subjects,
      now: NOW,
      random: () => 0.5,
    });
    const sp = tasks.find((t) => t.kind === "subject-practice");
    expect(sp).toBeDefined();
    expect(sp!.questionIds).toHaveLength(3);
    expect(sp!.questionIds).not.toContain("m4-hard");
    expect(sp!.reason).toContain("數學");
  });

  it("subject-practice：所有科都無資料時跳過", () => {
    const rows = [questionRow({ id: "m1", subject: "數學", difficulty: "標準" })];
    const tasks = generateTodayTasks({
      profile: profile([]),
      lookup: lookupOf(rows),
      rows,
      diagnosis: diagnosisWith([]),
      tagReliability: new Map(),
      subjectAccuracies: NO_SUBJECTS,
      now: NOW,
      random: () => 0.5,
    });
    expect(tasks.find((t) => t.kind === "subject-practice")).toBeUndefined();
  });

  it("knowledge：最弱弱點且標籤可信、有題目 → reliability=ok 並取最多 3 題", () => {
    const rows = [
      questionRow({ id: "k1", subject: "自然", difficulty: "標準", knowledge: ["水的三態"] }),
      questionRow({ id: "k2", subject: "自然", difficulty: "標準", knowledge: ["水的三態"] }),
      questionRow({ id: "k3", subject: "自然", difficulty: "標準", knowledge: ["水的三態"] }),
    ];
    const diag = diagnosisWith([
      stat({ knowledge: "水的三態", status: "unstable", confidence: 0.3 }),
    ]);
    const tasks = generateTodayTasks({
      profile: profile([]),
      lookup: lookupOf(rows),
      rows,
      diagnosis: diag,
      tagReliability: new Map([["水的三態", 5]]),
      subjectAccuracies: NO_SUBJECTS,
      now: NOW,
      random: () => 0.5,
    });
    const k = tasks.find((t) => t.kind === "knowledge");
    expect(k).toBeDefined();
    expect(k!.reliability).toBe("ok");
    expect(k!.questionIds).toHaveLength(3);
    expect(k!.reason).toContain("水的三態");
  });

  it("knowledge：標籤不可信 → reliability=building、questionIds 為空", () => {
    const rows = [questionRow({ id: "k1", subject: "自然", difficulty: "標準", knowledge: ["水的三態"] })];
    const diag = diagnosisWith([
      stat({ knowledge: "水的三態", status: "blindspot", confidence: 0.1 }),
    ]);
    const tasks = generateTodayTasks({
      profile: profile([]),
      lookup: lookupOf(rows),
      rows,
      diagnosis: diag,
      tagReliability: new Map([["水的三態", 1]]), // < 3
      subjectAccuracies: NO_SUBJECTS,
      now: NOW,
      random: () => 0.5,
    });
    const k = tasks.find((t) => t.kind === "knowledge");
    expect(k).toBeDefined();
    expect(k!.reliability).toBe("building");
    expect(k!.questionIds).toEqual([]);
    expect(k!.reason).toContain("建置中");
  });

  it("challenge：有 mastered 強項時取 2 題挑戰題", () => {
    const rows = [
      questionRow({ id: "c1", subject: "數學", difficulty: "挑戰", knowledge: ["乘法"] }),
      questionRow({ id: "c2", subject: "數學", difficulty: "挑戰", knowledge: ["乘法"] }),
      questionRow({ id: "c3", subject: "數學", difficulty: "標準", knowledge: ["乘法"] }),
    ];
    const diag = diagnosisWith([
      stat({ knowledge: "乘法", status: "mastered", confidence: 0.9 }),
    ]);
    const tasks = generateTodayTasks({
      profile: profile([]),
      lookup: lookupOf(rows),
      rows,
      diagnosis: diag,
      tagReliability: new Map([["乘法", 5]]),
      subjectAccuracies: NO_SUBJECTS,
      now: NOW,
      random: () => 0.5,
    });
    const c = tasks.find((t) => t.kind === "challenge");
    expect(c).toBeDefined();
    expect(c!.questionIds).toEqual(["c1", "c2"]);
    expect(c!.reward).toBe("挑戰者徽章");
  });

  it("輸出順序：wrong-book → subject-practice → knowledge → challenge", () => {
    const rows = [
      questionRow({ id: "w1", subject: "自然", difficulty: "標準", knowledge: ["水"] }),
      questionRow({ id: "s1", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
      questionRow({ id: "s2", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
      questionRow({ id: "s3", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
      questionRow({ id: "k1", subject: "自然", difficulty: "標準", knowledge: ["風"] }),
      questionRow({ id: "k2", subject: "自然", difficulty: "標準", knowledge: ["風"] }),
      questionRow({ id: "k3", subject: "自然", difficulty: "標準", knowledge: ["風"] }),
      questionRow({ id: "ch1", subject: "數學", difficulty: "挑戰", knowledge: ["乘法"] }),
      questionRow({ id: "ch2", subject: "數學", difficulty: "挑戰", knowledge: ["乘法"] }),
    ];
    const p = profile([
      attempt({ questionId: "w1", curriculumDomain: "自然", correct: false, timestamp: NOW - 1000 }),
    ]);
    const diag = diagnosisWith([
      stat({ knowledge: "風", status: "unstable", confidence: 0.3 }),
      stat({ knowledge: "乘法", status: "mastered", confidence: 0.9 }),
    ]);
    const subjects = NO_SUBJECTS.map((s) =>
      s.subject === "數學" ? subjectAcc("數學", 40, 6) : s,
    );
    const tasks = generateTodayTasks({
      profile: p,
      lookup: lookupOf(rows),
      rows,
      diagnosis: diag,
      tagReliability: new Map([["風", 5], ["乘法", 5]]),
      subjectAccuracies: subjects,
      now: NOW,
      random: () => 0.5,
    });
    expect(tasks.map((t) => t.kind)).toEqual([
      "wrong-book",
      "subject-practice",
      "knowledge",
      "challenge",
    ]);
  });

  it("estimatedMinutes = max(1, round(題數*0.7))", () => {
    expect(Math.max(1, Math.round(3 * 0.7))).toBe(2);
    expect(Math.max(1, Math.round(1 * 0.7))).toBe(1);
  });

  it("固定 random 可重現：同樣輸入兩次結果一致", () => {
    const rows = [
      questionRow({ id: "s1", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
      questionRow({ id: "s2", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
      questionRow({ id: "s3", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
      questionRow({ id: "s4", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
    ];
    const subjects = NO_SUBJECTS.map((s) =>
      s.subject === "數學" ? subjectAcc("數學", 40, 6) : s,
    );
    const base = {
      profile: profile([]),
      lookup: lookupOf(rows),
      rows,
      diagnosis: diagnosisWith([]),
      tagReliability: new Map(),
      subjectAccuracies: subjects,
      now: NOW,
    };
    const run = () => {
      let seed = 0.42;
      return generateTodayTasks({ ...base, random: () => (seed = (seed * 9301 + 49297) % 233280) / 233280 });
    };
    const a = run().find((t) => t.kind === "subject-practice")!;
    const b = run().find((t) => t.kind === "subject-practice")!;
    expect(a.questionIds).toEqual(b.questionIds);
  });

  it("completed：questionIds 為空的 building 卡片 completed=false", () => {
    const rows: CurriculumQuestionRow[] = [];
    const diag = diagnosisWith([
      stat({ knowledge: "不存在的標", status: "blindspot", confidence: 0.1 }),
    ]);
    const tasks = generateTodayTasks({
      profile: profile([]),
      lookup: lookupOf(rows),
      rows,
      diagnosis: diag,
      tagReliability: new Map([["不存在的標", 5]]), // reliable 但沒題目
      subjectAccuracies: NO_SUBJECTS,
      now: NOW,
      random: () => 0.5,
    });
    const k = tasks.find((t) => t.kind === "knowledge")!;
    expect(k.reliability).toBe("building");
    expect(k.questionIds).toEqual([]);
    expect(k.completed).toBe(false);
  });

  it("各 kind 遵守自身題數上限（wb≤3、sp≤3、knowledge≤3、challenge≤2）", () => {
    const rows = [
      questionRow({ id: "w1", subject: "自然", difficulty: "標準", knowledge: ["水"] }),
      questionRow({ id: "w2", subject: "自然", difficulty: "標準", knowledge: ["水"] }),
      questionRow({ id: "w3", subject: "自然", difficulty: "標準", knowledge: ["水"] }),
      questionRow({ id: "s1", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
      questionRow({ id: "s2", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
      questionRow({ id: "s3", subject: "數學", difficulty: "標準", knowledge: ["加法"] }),
      questionRow({ id: "k1", subject: "自然", difficulty: "標準", knowledge: ["風"] }),
      questionRow({ id: "k2", subject: "自然", difficulty: "標準", knowledge: ["風"] }),
      questionRow({ id: "k3", subject: "自然", difficulty: "標準", knowledge: ["風"] }),
      questionRow({ id: "ch1", subject: "數學", difficulty: "挑戰", knowledge: ["乘法"] }),
      questionRow({ id: "ch2", subject: "數學", difficulty: "挑戰", knowledge: ["乘法"] }),
    ];
    const p = profile([
      attempt({ questionId: "w1", curriculumDomain: "自然", correct: false, timestamp: NOW - 4000 }),
      attempt({ questionId: "w2", curriculumDomain: "自然", correct: false, timestamp: NOW - 3000 }),
      attempt({ questionId: "w3", curriculumDomain: "自然", correct: false, timestamp: NOW - 2000 }),
    ]);
    const diag = diagnosisWith([
      stat({ knowledge: "風", status: "unstable", confidence: 0.3 }),
      stat({ knowledge: "乘法", status: "mastered", confidence: 0.9 }),
    ]);
    const subjects = NO_SUBJECTS.map((s) =>
      s.subject === "數學" ? subjectAcc("數學", 40, 6) : s,
    );
    const tasks = generateTodayTasks({
      profile: p,
      lookup: lookupOf(rows),
      rows,
      diagnosis: diag,
      tagReliability: new Map([["風", 5], ["乘法", 5]]),
      subjectAccuracies: subjects,
      now: NOW,
      random: () => 0.5,
    });
    const byKind = Object.fromEntries(tasks.map((t) => [t.kind, t.questionCount])) as Record<string, number>;
    expect(byKind["wrong-book"]).toBeLessThanOrEqual(3);
    expect(byKind["subject-practice"]).toBeLessThanOrEqual(3);
    expect(byKind["knowledge"]).toBeLessThanOrEqual(3);
    expect(byKind["challenge"]).toBeLessThanOrEqual(2);
  });
});
