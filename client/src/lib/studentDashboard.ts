import type { AdaptiveProfile } from "@/game/adaptiveLearning";
import type { LearningRecord } from "@/utils/storage";
import type { LookupQuestion } from "@/lib/questionLookup";
import {
  answerRecordsFromLearningRecords,
  buildDiagnosis,
  type QuestionMeta,
  type StudentDiagnosis,
} from "@/lib/studentDiagnosis";
import { collectGraduatedGroups, collectWrongBookGroups } from "@/lib/wrongBook";
import { generateTodayTasks, type TodayTask } from "@/lib/todayTasks";

export type { TodayTask } from "@/lib/todayTasks";

/**
 * 學生端診斷儀表板（資料層）。
 *
 * 純函式：接收 records / lookup / profile 等輸入，組裝 UI 要的一切資料。
 * 不直接讀 storage；隨時間相關計算可注入 now。
 */

export interface DashboardBadge {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
  condition: string;
}

export interface DashboardGamification {
  level: number;
  levelName: string;
  /** 下一等級門檻「完成題數」；已滿級為 null */
  nextLevelAt: number | null;
  /** 距離下一級還差幾題；滿級為 0 */
  questionsToNext: number;
  consecutiveDays: number;
  /** 完成題數（bx 優先、records 兜底） */
  totalAnswers: number;
  badges: DashboardBadge[];
}

export interface AccuracyBySubject {
  subject: string;
  attempts: number;
  /** 0-100 整數 */
  accuracy: number;
  hasData: boolean;
}

export interface WeeklyProgress {
  currentAccuracy: number | null;
  previousAccuracy: number | null;
  delta: number | null;
  currentAttempts: number;
  previousAttempts: number;
}

export interface StrengthItem {
  knowledge: string;
  confidence: number;
  attempts: number;
  status: "mastered" | "stable";
  reliable: boolean;
  message: string;
}

export interface FocusAreaItem {
  knowledge: string;
  /** reliable=false 時必須為 null */
  confidence: number | null;
  attempts: number;
  status: "unstable" | "blindspot";
  reliable: boolean;
  message: string;
  hint: string;
}

export interface WrongBookSummary {
  total: number;
  graduated: number;
  bySubject: { subject: string; count: number }[];
}

export interface StudentDashboardData {
  captainName: string;
  generatedAt: number;
  gamification: DashboardGamification;
  /** 0-100；無資料 null */
  overallAccuracy: number | null;
  /** 五科順序：國語/數學/英語/自然/社會 */
  bySubject: AccuracyBySubject[];
  weekly: WeeklyProgress;
  strengths: StrengthItem[];
  focusAreas: FocusAreaItem[];
  wrongBook: WrongBookSummary;
  todayTasks: TodayTask[];
  hasAnyData: boolean;
}

export interface DashboardInputs {
  captainName: string;
  records: readonly LearningRecord[];
  lookup: ReadonlyMap<string, LookupQuestion>;
  profile: AdaptiveProfile;
  bxBadges: readonly string[];
  bxTotalAnswers: number;
  streak: number;
  selfChallengeCompleted: number;
  now?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const DASHBOARD_SUBJECTS = ["國語", "數學", "英語", "自然", "社會"] as const;
const RELIABLE_TAG_MIN_QUESTIONS = 3;

// ─────────────────────────────────────────────
// 等級
// ─────────────────────────────────────────────

interface LevelTier {
  level: number;
  name: string;
  questions: number;
  days: number;
}

const LEVEL_TABLE: readonly LevelTier[] = [
  { level: 1, name: "見習船長", questions: 0, days: 0 },
  { level: 2, name: "初級船長", questions: 10, days: 0 },
  { level: 3, name: "中級船長", questions: 50, days: 0 },
  { level: 4, name: "高級船長", questions: 100, days: 0 },
  { level: 5, name: "三態小達人", questions: 200, days: 7 },
  { level: 6, name: "知識探險家", questions: 500, days: 30 },
  { level: 7, name: "船長之星", questions: 1000, days: 100 },
];

export function levelOf(
  totalAnswers: number,
  streak: number,
): { level: number; levelName: string; nextLevelAt: number | null; questionsToNext: number } {
  let current = LEVEL_TABLE[0];
  for (const tier of LEVEL_TABLE) {
    if (totalAnswers >= tier.questions && streak >= tier.days) current = tier;
  }

  const nextIndex = LEVEL_TABLE.findIndex((t) => t.level === current.level) + 1;
  const next = LEVEL_TABLE[nextIndex];
  if (!next) {
    return { level: current.level, levelName: current.name, nextLevelAt: null, questionsToNext: 0 };
  }
  return {
    level: current.level,
    levelName: current.name,
    nextLevelAt: next.questions,
    questionsToNext: Math.max(0, next.questions - totalAnswers),
  };
}

// ─────────────────────────────────────────────
// 徽章
// ─────────────────────────────────────────────

export function deriveBadges(opts: {
  bxBadges: string[];
  totalAnswers: number;
  streak: number;
  weeklyDelta: number | null;
  selfChallengeCompleted: number;
}): DashboardBadge[] {
  const badges: DashboardBadge[] = [
    {
      id: "qihang",
      name: "啟航",
      icon: "🚀",
      condition: "完成第一題",
      unlocked: opts.bxBadges.includes("qihang"),
    },
    {
      id: "7day",
      name: "七日航行",
      icon: "⛵",
      condition: "連續簽到 7 天",
      unlocked: opts.bxBadges.includes("7day"),
    },
    {
      id: "streak7",
      name: "連續 7 天",
      icon: "🔥",
      condition: "連續登入 7 天",
      unlocked: opts.streak >= 7,
    },
    {
      id: "done10",
      name: "完成 10 題",
      icon: "📚",
      condition: "完成 10 題",
      unlocked: opts.totalAnswers >= 10,
    },
    {
      id: "done50",
      name: "完成 50 題",
      icon: "📚",
      condition: "完成 50 題",
      unlocked: opts.totalAnswers >= 50,
    },
    {
      id: "done100",
      name: "完成 100 題",
      icon: "📚",
      condition: "完成 100 題",
      unlocked: opts.totalAnswers >= 100,
    },
    {
      id: "progress-star",
      name: "進步之星",
      icon: "📈",
      condition: "一週內正確率提升超過 10%",
      unlocked: opts.weeklyDelta !== null && opts.weeklyDelta > 10,
    },
    {
      id: "challenger",
      name: "挑戰者",
      icon: "⚡",
      condition: "自我挑戰完成 10 題",
      unlocked: opts.selfChallengeCompleted >= 10,
    },
  ];

  // 已解鎖在前、未解鎖在後（穩定排序，保留定義順序）。
  return badges
    .map((badge, index) => ({ badge, index }))
    .sort((a, b) => {
      const unlockedDiff = Number(b.badge.unlocked) - Number(a.badge.unlocked);
      return unlockedDiff !== 0 ? unlockedDiff : a.index - b.index;
    })
    .map(({ badge }) => badge);
}

// ─────────────────────────────────────────────
// 分科正確率
// ─────────────────────────────────────────────

function roundPercent(part: number, whole: number): number {
  return Math.round((part / whole) * 100);
}

export function accuracyBySubjectFromRecords(
  records: readonly LearningRecord[],
): AccuracyBySubject[] {
  const buckets = new Map<string, { attempts: number; correct: number }>();
  for (const record of records) {
    const bucket = buckets.get(record.subject) ?? { attempts: 0, correct: 0 };
    bucket.attempts += 1;
    if (record.isCorrect) bucket.correct += 1;
    buckets.set(record.subject, bucket);
  }

  return DASHBOARD_SUBJECTS.map((subject) => {
    const bucket = buckets.get(subject);
    if (!bucket || bucket.attempts === 0) {
      return { subject, attempts: 0, accuracy: 0, hasData: false };
    }
    return {
      subject,
      attempts: bucket.attempts,
      accuracy: roundPercent(bucket.correct, bucket.attempts),
      hasData: true,
    };
  });
}

// ─────────────────────────────────────────────
// 週進度
// ─────────────────────────────────────────────

export function weeklyProgressFromRecords(
  records: readonly LearningRecord[],
  now: number = Date.now(),
): WeeklyProgress {
  const currentStart = now - 7 * DAY_MS;
  const previousStart = now - 14 * DAY_MS;
  const previousEnd = currentStart;

  let currentAttempts = 0;
  let currentCorrect = 0;
  let previousAttempts = 0;
  let previousCorrect = 0;

  for (const record of records) {
    if (record.timestamp >= currentStart && record.timestamp < now) {
      currentAttempts += 1;
      if (record.isCorrect) currentCorrect += 1;
    } else if (record.timestamp >= previousStart && record.timestamp < previousEnd) {
      previousAttempts += 1;
      if (record.isCorrect) previousCorrect += 1;
    }
  }

  const currentAccuracy =
    currentAttempts >= 3 ? roundPercent(currentCorrect, currentAttempts) : null;
  const previousAccuracy =
    previousAttempts >= 3 ? roundPercent(previousCorrect, previousAttempts) : null;
  const delta =
    currentAccuracy !== null && previousAccuracy !== null
      ? currentAccuracy - previousAccuracy
      : null;

  return { currentAccuracy, previousAccuracy, delta, currentAttempts, previousAttempts };
}

// ─────────────────────────────────────────────
// 標籤可信度（該知識點出現在幾道不同題目）
// ─────────────────────────────────────────────

export function tagReliabilityFromLookup(
  lookup: ReadonlyMap<string, LookupQuestion>,
  minDistinctQuestions: number = RELIABLE_TAG_MIN_QUESTIONS,
): ReadonlyMap<string, number> {
  // minDistinctQuestions 保留在簽章中（供呼叫端／未來過濾用）；這裡回傳全部計數。
  void minDistinctQuestions;
  const counts = new Map<string, number>();
  for (const question of Array.from(lookup.values())) {
    for (const tag of question.knowledge ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

// ─────────────────────────────────────────────
// 優勢 / 弱點
// ─────────────────────────────────────────────

function isReliable(tagReliability: ReadonlyMap<string, number>, knowledge: string): boolean {
  return (tagReliability.get(knowledge) ?? 0) >= RELIABLE_TAG_MIN_QUESTIONS;
}

export function strengthAndFocusFromDiagnosis(
  diagnosis: StudentDiagnosis,
  tagReliability: ReadonlyMap<string, number>,
): { strengths: StrengthItem[]; focusAreas: FocusAreaItem[] } {
  const all = Object.values(diagnosis.knowledgeStats);

  const strengths: StrengthItem[] = all
    .filter((s) => s.status === "mastered" || s.status === "stable")
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .map((s) => ({
      knowledge: s.knowledge,
      confidence: s.confidence,
      attempts: s.totalAttempts,
      status: s.status as StrengthItem["status"],
      reliable: isReliable(tagReliability, s.knowledge),
      message:
        s.status === "mastered" ? "你已經完全掌握了！" : "表現穩定，繼續保持！",
    }));

  const focusAreas: FocusAreaItem[] = all
    .filter((s) => s.status === "unstable" || s.status === "blindspot")
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, 2)
    .map((s) => {
      const reliable = isReliable(tagReliability, s.knowledge);
      return {
        knowledge: s.knowledge,
        confidence: reliable ? s.confidence : null,
        attempts: s.totalAttempts,
        status: s.status as FocusAreaItem["status"],
        reliable,
        message: reliable
          ? "這塊還可以再加油"
          : "這個知識點資料還在累積中",
        hint: reliable
          ? `試試看：從生活裡的例子想一想『${s.knowledge}』`
          : "再練習幾題，就能看見更清楚的建議",
      };
    });

  return { strengths, focusAreas };
}

// ─────────────────────────────────────────────
// 錯題本彙總
// ─────────────────────────────────────────────

function summarizeWrongBook(
  profile: AdaptiveProfile,
  lookup: ReadonlyMap<string, LookupQuestion>,
): WrongBookSummary {
  const wrongGroups = collectWrongBookGroups(profile, lookup);
  const graduatedGroups = collectGraduatedGroups(profile, lookup);

  const bySubject = wrongGroups
    .map((group) => ({ subject: group.subject, count: group.items.length }))
    .filter((entry) => entry.count > 0);

  return {
    total: wrongGroups.reduce((sum, group) => sum + group.items.length, 0),
    graduated: graduatedGroups.reduce((sum, group) => sum + group.items.length, 0),
    bySubject,
  };
}

// ─────────────────────────────────────────────
// 組裝
// ─────────────────────────────────────────────

export function buildStudentDashboard(inputs: DashboardInputs): StudentDashboardData {
  const now = inputs.now ?? Date.now();
  const { captainName, records, lookup, profile } = inputs;

  // 1. lookup → QuestionMeta map，餵給診斷
  const metaMap = new Map<string, QuestionMeta>();
  for (const [id, q] of Array.from(lookup.entries())) {
    metaMap.set(id, {
      knowledge: q.knowledge,
      difficulty: q.difficulty as QuestionMeta["difficulty"],
      questionType: q.questionType,
      curriculumDomain: q.curriculumDomain,
      learningTopic: q.learningTopic,
    });
  }

  // 2. 診斷
  const answerRecords = answerRecordsFromLearningRecords(records, metaMap, "dashboard");
  const diagnosis = buildDiagnosis(captainName, answerRecords);
  const tagReliability = tagReliabilityFromLookup(lookup);

  // 3. 整體正確率（LearningRecord 無 skipped 欄位，全部計入）
  const overallAccuracy =
    records.length > 0
      ? roundPercent(records.filter((r) => r.isCorrect).length, records.length)
      : null;

  // 4. 分科 / 週進度
  const bySubject = accuracyBySubjectFromRecords(records);
  const weekly = weeklyProgressFromRecords(records, now);

  // 5. 遊戲化
  const totalAnswers = Math.max(inputs.bxTotalAnswers, records.length);
  const level = levelOf(totalAnswers, inputs.streak);
  const badges = deriveBadges({
    bxBadges: [...inputs.bxBadges],
    totalAnswers,
    streak: inputs.streak,
    weeklyDelta: weekly.delta,
    selfChallengeCompleted: inputs.selfChallengeCompleted,
  });

  // 6. 優勢 / 弱點
  const { strengths, focusAreas } = strengthAndFocusFromDiagnosis(diagnosis, tagReliability);

  // 7. 錯題本
  const wrongBook = summarizeWrongBook(profile, lookup);

  // 8. 今日任務
  const rows = Array.from(lookup.values()) as unknown as Parameters<
    typeof generateTodayTasks
  >[0]["rows"];
  const todayTasks = generateTodayTasks({
    profile,
    lookup,
    rows,
    diagnosis,
    tagReliability,
    subjectAccuracies: bySubject,
    now,
  });

  return {
    captainName,
    generatedAt: now,
    gamification: {
      level: level.level,
      levelName: level.levelName,
      nextLevelAt: level.nextLevelAt,
      questionsToNext: level.questionsToNext,
      consecutiveDays: inputs.streak,
      totalAnswers,
      badges,
    },
    overallAccuracy,
    bySubject,
    weekly,
    strengths,
    focusAreas,
    wrongBook,
    todayTasks,
    hasAnyData: records.length > 0,
  };
}
