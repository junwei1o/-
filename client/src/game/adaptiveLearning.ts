。export type AdaptiveDifficulty = "基礎" | "標準" | "挑戰";

export type AdaptiveQuestion = {
  id: string;
  difficulty: AdaptiveDifficulty;
  curriculumDomain: string;
  knowledge: string[];
};

export type AdaptiveErrorType = "concept" | "careless" | "memory";

export type AdaptiveAttempt = {
  questionId: string;
  curriculumDomain: string;
  knowledge: string[];
  difficulty: AdaptiveDifficulty;
  correct: boolean;
  responseMs: number;
  timeLimitMs: number;
  hintsUsed?: number;
  timestamp: number;
  /** New writes always provide this; old local records safely normalize to false. */
  flagged?: boolean;
  /** Optional only for migrated legacy records whose cause was never captured. */
  errorType?: AdaptiveErrorType;
  /** UTC timestamp; null means this attempt is not currently scheduled. */
  nextReviewDate?: number | null;
};

export type SpacedReviewItem = {
  questionId: string;
  /** 0=20 分鐘、1=1 天、2=3 天、3=7 天；答對會前往下一個節點。 */
  intervalIndex: number;
  dueAt: number;
  updatedAt: number;
};

export type AdaptiveProfile = {
  version: 1 | 2;
  attempts: AdaptiveAttempt[];
  /** Optional so v1 local saves can migrate without losing observed attempts. */
  spacedReviews?: SpacedReviewItem[];
};

export type AdaptiveBand = "複習" | "基礎" | "進階" | "挑戰";

export const ADAPTIVE_STORAGE_KEY = "xue-adventure-adaptive-v1";
const MAX_ATTEMPTS = 1000;
const MAX_SPACED_REVIEWS = 250;
const DIFFICULTY_ORDER: AdaptiveDifficulty[] = ["基礎", "標準", "挑戰"];
/** A calm, transparent review cadence: 20 minutes → 1 day → 3 days → 7 days. */
export const SPACED_REVIEW_INTERVALS_MS = [20 * 60_000, 24 * 60 * 60_000, 3 * 24 * 60 * 60_000, 7 * 24 * 60 * 60_000] as const;
export const ERROR_REVIEW_INTERVALS_MS = [24 * 60 * 60_000, 3 * 24 * 60 * 60_000] as const;

export const defaultAdaptiveProfile: AdaptiveProfile = { version: 2, attempts: [], spacedReviews: [] };

function isDifficulty(value: unknown): value is AdaptiveDifficulty {
  return DIFFICULTY_ORDER.includes(value as AdaptiveDifficulty);
}

function normalizeAttempt(value: unknown): AdaptiveAttempt | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<AdaptiveAttempt>;
  if (typeof item.questionId !== "string" || typeof item.curriculumDomain !== "string" || !Array.isArray(item.knowledge) || !isDifficulty(item.difficulty) || typeof item.correct !== "boolean") return null;
  const responseMs = Number.isFinite(item.responseMs) ? Math.max(0, Math.min(120_000, Number(item.responseMs))) : 25_000;
  const timeLimitMs = Number.isFinite(item.timeLimitMs) ? Math.max(1_000, Math.min(120_000, Number(item.timeLimitMs))) : 25_000;
  const nextReviewDate = item.nextReviewDate === null ? null : Number.isFinite(item.nextReviewDate) ? Math.max(0, Number(item.nextReviewDate)) : null;
  const errorType = item.errorType === "concept" || item.errorType === "careless" || item.errorType === "memory" ? item.errorType : undefined;
  return {
    questionId: item.questionId,
    curriculumDomain: item.curriculumDomain,
    knowledge: item.knowledge.filter((tag): tag is string => typeof tag === "string").slice(0, 12),
    difficulty: item.difficulty,
    correct: item.correct,
    responseMs,
    timeLimitMs,
    hintsUsed: Number.isFinite(item.hintsUsed) ? Math.max(0, Math.min(3, Number(item.hintsUsed))) : 0,
    timestamp: Number.isFinite(item.timestamp) ? Number(item.timestamp) : Date.now(),
    flagged: item.flagged === true,
    ...(errorType ? { errorType } : {}),
    nextReviewDate,
  };
}

function normalizeSpacedReview(value: unknown): SpacedReviewItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<SpacedReviewItem>;
  if (typeof item.questionId !== "string" || !Number.isFinite(item.intervalIndex) || !Number.isFinite(item.dueAt)) return null;
  const intervalIndex = Math.max(0, Math.min(SPACED_REVIEW_INTERVALS_MS.length - 1, Math.floor(Number(item.intervalIndex))));
  return {
    questionId: item.questionId,
    intervalIndex,
    dueAt: Math.max(0, Number(item.dueAt)),
    updatedAt: Number.isFinite(item.updatedAt) ? Math.max(0, Number(item.updatedAt)) : Number(item.dueAt),
  };
}

export function loadAdaptiveProfile(storage: Pick<Storage, "getItem" | "removeItem"> = localStorage): AdaptiveProfile {
  try {
    const raw = storage.getItem(ADAPTIVE_STORAGE_KEY);
    if (!raw) return structuredClone(defaultAdaptiveProfile);
    const parsed = JSON.parse(raw) as Partial<AdaptiveProfile>;
    if ((parsed.version !== 1 && parsed.version !== 2) || !Array.isArray(parsed.attempts)) throw new Error("invalid adaptive profile");
    return {
      version: 2,
      attempts: parsed.attempts.map(normalizeAttempt).filter((item): item is AdaptiveAttempt => item !== null).slice(-MAX_ATTEMPTS),
      spacedReviews: Array.isArray(parsed.spacedReviews) ? parsed.spacedReviews.map(normalizeSpacedReview).filter((item): item is SpacedReviewItem => item !== null).slice(-MAX_SPACED_REVIEWS) : [],
    };
  } catch {
    storage.removeItem(ADAPTIVE_STORAGE_KEY);
    return structuredClone(defaultAdaptiveProfile);
  }
}

export function saveAdaptiveProfile(profile: AdaptiveProfile, storage: Pick<Storage, "setItem"> = localStorage) {
  try { storage.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify({ version: 2, attempts: profile.attempts.slice(-MAX_ATTEMPTS), spacedReviews: (profile.spacedReviews ?? []).slice(-MAX_SPACED_REVIEWS) })); } catch { /* private browsing should not interrupt learning */ }
}

function updateSpacedReviews(current: SpacedReviewItem[] | undefined, attempt: AdaptiveAttempt): SpacedReviewItem[] {
  const reviews = current ?? [];
  const previous = reviews.find((item) => item.questionId === attempt.questionId);
  const remaining = reviews.filter((item) => item.questionId !== attempt.questionId);
  if (!attempt.correct) {
    return [...remaining, { questionId: attempt.questionId, intervalIndex: 0, dueAt: attempt.timestamp + SPACED_REVIEW_INTERVALS_MS[0], updatedAt: attempt.timestamp }].slice(-MAX_SPACED_REVIEWS);
  }
  if (!previous) return remaining;
  const nextIndex = previous.intervalIndex + 1;
  if (nextIndex >= SPACED_REVIEW_INTERVALS_MS.length) return remaining;
  return [...remaining, { questionId: attempt.questionId, intervalIndex: nextIndex, dueAt: attempt.timestamp + SPACED_REVIEW_INTERVALS_MS[nextIndex], updatedAt: attempt.timestamp }].slice(-MAX_SPACED_REVIEWS);
}

export function recordAdaptiveAttempt(profile: AdaptiveProfile, attempt: Omit<AdaptiveAttempt, "timestamp" | "nextReviewDate"> & { timestamp?: number; nextReviewDate?: number | null }): AdaptiveProfile {
  const timestamp = attempt.timestamp ?? Date.now();
  const previousWrongCount = profile.attempts.filter((item) => item.questionId === attempt.questionId && !item.correct).length;
  const nextReviewDate = attempt.correct ? null : timestamp + ERROR_REVIEW_INTERVALS_MS[Math.min(previousWrongCount, ERROR_REVIEW_INTERVALS_MS.length - 1)];
  const nextAttempt: AdaptiveAttempt = {
    ...attempt,
    timestamp,
    flagged: attempt.flagged === true,
    ...(attempt.errorType ? { errorType: attempt.errorType } : {}),
    nextReviewDate: attempt.nextReviewDate !== undefined ? attempt.nextReviewDate : nextReviewDate,
  };
  return { version: 2, attempts: [...profile.attempts, nextAttempt].slice(-MAX_ATTEMPTS), spacedReviews: updateSpacedReviews(profile.spacedReviews, nextAttempt) };
}

/** 取得某題最新一筆真實作答，避免以舊錯誤覆蓋後續已掌握狀態。 */
export function getLatestAdaptiveAttempt(profile: AdaptiveProfile, questionId: string): AdaptiveAttempt | null {
  for (let index = profile.attempts.length - 1; index >= 0; index -= 1) {
    if (profile.attempts[index]?.questionId === questionId) return profile.attempts[index];
  }
  return null;
}

export function updateLatestAdaptiveAttempt(profile: AdaptiveProfile, questionId: string, patch: Partial<Pick<AdaptiveAttempt, "flagged" | "errorType">>): AdaptiveProfile {
  const index = profile.attempts.map((attempt) => attempt.questionId).lastIndexOf(questionId);
  if (index < 0) return profile;
  const attempts = profile.attempts.slice();
  attempts[index] = { ...attempts[index], ...patch };
  return { version: 2, attempts, spacedReviews: profile.spacedReviews ?? [] };
}

/** 只以最新 attempt 的 nextReviewDate 判斷今日記憶警報，避免重複計數同一題。 */
export function getDueReviewQuestionIds(profile: AdaptiveProfile, questionIds?: Set<string>, now = Date.now()): string[] {
  const latestByQuestion = new Map<string, AdaptiveAttempt>();
  profile.attempts.forEach((attempt) => {
    if (questionIds && !questionIds.has(attempt.questionId)) return;
    const previous = latestByQuestion.get(attempt.questionId);
    if (!previous || attempt.timestamp >= previous.timestamp) latestByQuestion.set(attempt.questionId, attempt);
  });
  return Array.from(latestByQuestion.values())
    .filter((attempt) => !attempt.correct && typeof attempt.nextReviewDate === "number" && attempt.nextReviewDate <= now)
    .sort((a, b) => (a.nextReviewDate ?? 0) - (b.nextReviewDate ?? 0) || a.timestamp - b.timestamp)
    .map((attempt) => attempt.questionId);
}

export function getNextReviewDate(profile: AdaptiveProfile, questionId: string): number | null {
  const latest = getLatestAdaptiveAttempt(profile, questionId);
  return latest && !latest.correct && typeof latest.nextReviewDate === "number" ? latest.nextReviewDate : null;
}

export function getMemoryAlarmCount(profile: AdaptiveProfile, questionIds?: Set<string>, now = Date.now()): number {
  return getDueReviewQuestionIds(profile, questionIds, now).length;
}

export type SpacedReviewSummary = { scheduledCount: number; dueCount: number; nextDueAt: number | null };

export function getSpacedReviewSummary(profile: AdaptiveProfile, questionIds?: Set<string>, now = Date.now()): SpacedReviewSummary {
  const reviews = (profile.spacedReviews ?? []).filter((item) => !questionIds || questionIds.has(item.questionId));
  const due = reviews.filter((item) => item.dueAt <= now);
  const nextDueAt = reviews.filter((item) => item.dueAt > now).sort((a, b) => a.dueAt - b.dueAt)[0]?.dueAt ?? null;
  return { scheduledCount: reviews.length, dueCount: due.length, nextDueAt };
}

export type SpacedReviewSelection<T extends { id: string }> = {
  question: T | null;
  isReview: boolean;
  dueCount: number;
  nextDueAt: number | null;
};

/**
 * Gives due, still-valid wrong questions priority in an encounter.
 * When none are due, selection remains a normal random encounter draw.
 */
export function selectSpacedReviewQuestion<T extends { id: string }>(questions: T[], profile: AdaptiveProfile, now = Date.now(), random = Math.random): SpacedReviewSelection<T> {
  if (questions.length === 0) return { question: null, isReview: false, dueCount: 0, nextDueAt: null };
  const byId = new Map(questions.map((question) => [question.id, question]));
  const due = (profile.spacedReviews ?? []).filter((item) => item.dueAt <= now && byId.has(item.questionId)).sort((a, b) => a.dueAt - b.dueAt || a.updatedAt - b.updatedAt);
  const summary = getSpacedReviewSummary(profile, new Set(byId.keys()), now);
  if (due[0]) return { question: byId.get(due[0].questionId) ?? null, isReview: true, dueCount: due.length, nextDueAt: summary.nextDueAt };
  const index = Math.max(0, Math.min(questions.length - 1, Math.floor(random() * questions.length)));
  return { question: questions[index] ?? questions[0], isReview: false, dueCount: 0, nextDueAt: summary.nextDueAt };
}

function difficultyIndex(value: AdaptiveDifficulty) { return DIFFICULTY_ORDER.indexOf(value); }

function recentAttempts(profile: AdaptiveProfile, questions: AdaptiveQuestion[]) {
  const ids = new Set(questions.map((question) => question.id));
  return profile.attempts.filter((attempt) => ids.has(attempt.questionId)).slice(-20);
}

export function getAdaptiveBand(profile: AdaptiveProfile, questions: AdaptiveQuestion[]): AdaptiveBand {
  const attempts = recentAttempts(profile, questions);
  if (attempts.length < 5) return "基礎";
  const accuracy = attempts.filter((attempt) => attempt.correct).length / attempts.length;
  const averageSpeed = attempts.reduce((sum, attempt) => sum + attempt.responseMs / attempt.timeLimitMs, 0) / attempts.length;
  const hintRate = attempts.filter((attempt) => (attempt.hintsUsed ?? 0) > 0).length / attempts.length;
  if (accuracy < 0.45 || hintRate > 0.6) return "複習";
  if (accuracy >= 0.85 && averageSpeed < 0.65) return "挑戰";
  if (accuracy >= 0.68 && averageSpeed < 0.85) return "進階";
  return "基礎";
}

export function targetDifficulties(profile: AdaptiveProfile, questions: AdaptiveQuestion[]): AdaptiveDifficulty[] {
  const band = getAdaptiveBand(profile, questions);
  if (band === "複習") return ["基礎"];
  if (band === "進階") return ["標準", "挑戰"];
  if (band === "挑戰") return ["挑戰", "標準"];
  return ["基礎", "標準"];
}

export function selectAdaptiveQuestions<T extends AdaptiveQuestion>(questions: T[], profile: AdaptiveProfile, count = questions.length): T[] {
  if (questions.length === 0 || count <= 0) return [];
  const attempts = recentAttempts(profile, questions);
  const attemptedIds = new Set(attempts.map((attempt) => attempt.questionId));
  const weakKnowledge = new Set<string>();
  const byKnowledge = new Map<string, { correct: number; total: number }>();
  attempts.forEach((attempt) => attempt.knowledge.forEach((tag) => {
    const stats = byKnowledge.get(tag) ?? { correct: 0, total: 0 };
    stats.total += 1;
    if (attempt.correct) stats.correct += 1;
    byKnowledge.set(tag, stats);
  }));
  byKnowledge.forEach((stats, tag) => { if (stats.total >= 2 && stats.correct / stats.total < 0.6) weakKnowledge.add(tag); });
  const targets = targetDifficulties(profile, questions);
  const rank = (question: T) => {
    const difficultyFit = targets.includes(question.difficulty) ? 40 - Math.abs(targets.indexOf(question.difficulty)) * 8 : 0;
    const weakFit = question.knowledge.some((tag) => weakKnowledge.has(tag)) ? 24 : 0;
    const freshness = attemptedIds.has(question.id) ? 0 : 6;
    return difficultyFit + weakFit + freshness;
  };
  return [...questions].sort((a, b) => rank(b) - rank(a)).slice(0, Math.min(count, questions.length));
}

export type AdaptiveReport = {
  attempts: number;
  accuracy: number | null;
  averageResponseMs: number | null;
  hintRate: number | null;
  domainStats: { domain: string; attempts: number; accuracy: number }[];
  difficultyStats: { difficulty: AdaptiveDifficulty; attempts: number; accuracy: number }[];
  weakKnowledge: { tag: string; attempts: number; accuracy: number }[];
  recentTrend: { label: string; accuracy: number }[];
};

export type KnowledgeHeatmapStatus = "review" | "developing" | "mastered";

export type KnowledgeHeatmapCell = {
  tag: string;
  attempts: number;
  correct: number;
  mastery: number;
  status: KnowledgeHeatmapStatus;
};

/**
 * 將最近的實際作答紀錄轉為知識點熱力圖。
 * 未觀測的知識點不會被列入，避免把「尚未作答」誤判為能力不足。
 */
export function calculateKnowledgeHeatmap(profile: AdaptiveProfile, questionIds?: Set<string>, limit = 12): KnowledgeHeatmapCell[] {
  const attempts = (questionIds ? profile.attempts.filter((attempt) => questionIds.has(attempt.questionId)) : profile.attempts).slice(-100);
  const byKnowledge = new Map<string, { attempts: number; correct: number }>();
  attempts.forEach((attempt) => {
    new Set(attempt.knowledge).forEach((tag) => {
      const stats = byKnowledge.get(tag) ?? { attempts: 0, correct: 0 };
      stats.attempts += 1;
      if (attempt.correct) stats.correct += 1;
      byKnowledge.set(tag, stats);
    });
  });
  const statusRank: Record<KnowledgeHeatmapStatus, number> = { review: 0, developing: 1, mastered: 2 };
  return Array.from(byKnowledge.entries()).map(([tag, stats]) => {
    const mastery = Math.round((stats.correct / stats.attempts) * 100);
    const status: KnowledgeHeatmapStatus = mastery < 60 ? "review" : mastery < 85 ? "developing" : "mastered";
    return { tag, ...stats, mastery, status };
  }).sort((a, b) => statusRank[a.status] - statusRank[b.status] || b.attempts - a.attempts || a.tag.localeCompare(b.tag, "zh-Hant"))
    .slice(0, Math.max(0, limit));
}

export function calculateAdaptiveReport(profile: AdaptiveProfile, questionIds?: Set<string>): AdaptiveReport {
  const attempts = (questionIds ? profile.attempts.filter((attempt) => questionIds.has(attempt.questionId)) : profile.attempts).slice(-100);
  const accuracy = attempts.length ? Math.round((attempts.filter((item) => item.correct).length / attempts.length) * 100) : null;
  const averageResponseMs = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + item.responseMs, 0) / attempts.length) : null;
  const hintRate = attempts.length ? Math.round((attempts.filter((item) => (item.hintsUsed ?? 0) > 0).length / attempts.length) * 100) : null;
  const aggregate = <T extends string>(values: T[]) => values.reduce((map, value) => map.set(value, (map.get(value) ?? { attempts: 0, correct: 0 })), new Map<T, { attempts: number; correct: number }>());
  const domains = aggregate(attempts.map((item) => item.curriculumDomain));
  const difficulties = aggregate(attempts.map((item) => item.difficulty));
  const knowledge = aggregate(attempts.flatMap((item) => item.knowledge));
  attempts.forEach((item) => {
    const update = (map: Map<string, { attempts: number; correct: number }>, key: string) => { const entry = map.get(key); if (entry) { entry.attempts += 1; if (item.correct) entry.correct += 1; } };
    update(domains, item.curriculumDomain); update(difficulties, item.difficulty);
    item.knowledge.forEach((tag) => update(knowledge, tag));
  });
  const toStats = <T extends string>(map: Map<T, { attempts: number; correct: number }>) => Array.from(map.entries()).map(([value, stats]) => ({ value, attempts: stats.attempts, accuracy: Math.round((stats.correct / stats.attempts) * 100) }));
  const domainStats = toStats(domains).map(({ value, ...stats }) => ({ domain: value, ...stats })).sort((a, b) => a.accuracy - b.accuracy);
  const difficultyStats = toStats(difficulties).map(({ value, ...stats }) => ({ difficulty: value, ...stats }));
  const weakKnowledge = toStats(knowledge).map(({ value, ...stats }) => ({ tag: value, ...stats })).filter((item) => item.attempts >= 2).sort((a, b) => a.accuracy - b.accuracy).slice(0, 6);
  const recent = attempts.slice(-20);
  const recentTrend = Array.from({ length: Math.ceil(recent.length / 5) }, (_, index) => { const batch = recent.slice(index * 5, index * 5 + 5); return { label: `第 ${index + 1} 組`, accuracy: Math.round((batch.filter((item) => item.correct).length / batch.length) * 100) }; });
  return { attempts: attempts.length, accuracy, averageResponseMs, hintRate, domainStats, difficultyStats, weakKnowledge, recentTrend };
}

export function difficultyDistance(a: AdaptiveDifficulty, b: AdaptiveDifficulty) {
  return Math.abs(difficultyIndex(a) - difficultyIndex(b));
}

export type LearningTrendPoint = {
  label: string;
  timestamp: number;
  attempts: number;
  hintRate: number;
  mastery: number;
};

export type KnowledgeMasteryTrend = {
  tag: string;
  points: { label: string; timestamp: number; mastery: number; attempts: number }[];
};

export type LearningTrendReport = {
  helpHabit: LearningTrendPoint[];
  knowledgeMastery: KnowledgeMasteryTrend[];
};

/**
 * 將實際作答依「最近一次觀測往前的 7 日區間」分桶。
 * 只回傳有作答的區間，避免把沒有紀錄的日期誤畫成零分或零求助。
 */
export function calculateLearningTrendReport(profile: AdaptiveProfile, questionIds?: Set<string>, now = Date.now(), maxPeriods = 8): LearningTrendReport {
  const source = (questionIds ? profile.attempts.filter((attempt) => questionIds.has(attempt.questionId)) : profile.attempts)
    .filter((attempt) => Number.isFinite(attempt.timestamp) && attempt.timestamp <= now)
    .slice(-MAX_ATTEMPTS);
  if (!source.length) return { helpHabit: [], knowledgeMastery: [] };

  const latestTimestamp = source[source.length - 1].timestamp;
  const periodMs = 7 * 24 * 60 * 60 * 1000;
  const periodOf = (timestamp: number) => Math.max(0, Math.floor((latestTimestamp - timestamp) / periodMs));
  const grouped = new Map<number, AdaptiveAttempt[]>();
  source.forEach((attempt) => {
    const period = periodOf(attempt.timestamp);
    if (period < maxPeriods) grouped.set(period, [...(grouped.get(period) ?? []), attempt]);
  });
  const orderedPeriods = Array.from(grouped.keys()).sort((a, b) => b - a);
  const formatLabel = (timestamp: number) => new Date(timestamp).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
  const helpHabit = orderedPeriods.map((period) => {
    const attempts = grouped.get(period) ?? [];
    const timestamp = latestTimestamp - period * periodMs;
    return {
      label: formatLabel(timestamp),
      timestamp,
      attempts: attempts.length,
      hintRate: Math.round((attempts.filter((attempt) => (attempt.hintsUsed ?? 0) > 0).length / attempts.length) * 100),
      mastery: Math.round((attempts.filter((attempt) => attempt.correct).length / attempts.length) * 100),
    };
  });

  const knowledgeTotals = new Map<string, { attempts: number; correct: number }>();
  source.forEach((attempt) => new Set(attempt.knowledge).forEach((tag) => {
    const stats = knowledgeTotals.get(tag) ?? { attempts: 0, correct: 0 };
    stats.attempts += 1;
    if (attempt.correct) stats.correct += 1;
    knowledgeTotals.set(tag, stats);
  }));
  const tags = Array.from(knowledgeTotals.entries())
    .sort(([, a], [, b]) => b.attempts - a.attempts)
    .slice(0, 5)
    .map(([tag]) => tag);
  const knowledgeMastery = tags.map((tag) => ({
    tag,
    points: orderedPeriods.map((period) => {
      const attempts = (grouped.get(period) ?? []).filter((attempt) => attempt.knowledge.includes(tag));
      return {
        label: formatLabel(latestTimestamp - period * periodMs),
        timestamp: latestTimestamp - period * periodMs,
        attempts: attempts.length,
        mastery: attempts.length ? Math.round((attempts.filter((attempt) => attempt.correct).length / attempts.length) * 100) : 0,
      };
    }).filter((point) => point.attempts > 0),
  })).filter((series) => series.points.length > 0);

  return { helpHabit, knowledgeMastery };
}
/* ========== 用戶偏好系統 ========== */

export type UserGradeLevel = 3 | 4 | 5 | 6;
export type UserDifficultyPreference = "簡單優先" | "均衡混合" | "挑戰優先";

export type UserPreferences = {
  version: 1;
  gradeLevel: UserGradeLevel;
  difficultyPreference: UserDifficultyPreference;
  updatedAt: number;
};

export const USER_PREFERENCES_STORAGE_KEY = "xue-adventure-user-prefs-v1";

export const defaultUserPreferences: UserPreferences = {
  version: 1,
  gradeLevel: 4,
  difficultyPreference: "均衡混合",
  updatedAt: 0, // 0 表示未設定，觸發「最難優先」模式
};

function isGradeLevel(value: unknown): value is UserGradeLevel {
  return value === 3 || value === 4 || value === 5 || value === 6;
}

function isDifficultyPreference(value: unknown): value is UserDifficultyPreference {
  return value === "簡單優先" || value === "均衡混合" || value === "挑戰優先";
}

export function loadUserPreferences(storage: Pick<Storage, "getItem" | "removeItem"> = localStorage): UserPreferences {
  try {
    const raw = storage.getItem(USER_PREFERENCES_STORAGE_KEY);
    if (!raw) return structuredClone(defaultUserPreferences);
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    if (parsed.version !== 1 || !isGradeLevel(parsed.gradeLevel) || !isDifficultyPreference(parsed.difficultyPreference)) {
      throw new Error("invalid user preferences");
    }
    return {
      version: 1,
      gradeLevel: parsed.gradeLevel,
      difficultyPreference: parsed.difficultyPreference,
      updatedAt: Number.isFinite(parsed.updatedAt) ? Number(parsed.updatedAt) : Date.now(),
    };
  } catch {
    storage.removeItem(USER_PREFERENCES_STORAGE_KEY);
    return structuredClone(defaultUserPreferences);
  }
}

export function saveUserPreferences(prefs: UserPreferences, storage: Pick<Storage, "setItem"> = localStorage) {
  try {
    storage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify({ ...prefs, updatedAt: Date.now() }));
  } catch { /* private browsing should not interrupt learning */ }
}

/** 根據用戶偏好取得目標難度列表 */
export function getTargetDifficultiesFromPrefs(prefs: UserPreferences): AdaptiveDifficulty[] {
  switch (prefs.difficultyPreference) {
    case "簡單優先":
      return ["基礎", "標準"];
    case "挑戰優先":
      return ["標準", "挑戰"];
    case "均衡混合":
    default:
      return ["基礎", "標準", "挑戰"];
  }
}

/** 根據用戶年級篩選題目（允許 ±1 年級浮動） */
export function filterQuestionsByGrade<T extends { grade: number }>(
  questions: readonly T[],
  prefs: UserPreferences,
): T[] {
  const minGrade = Math.max(3, prefs.gradeLevel - 1);
  const maxGrade = Math.min(6, prefs.gradeLevel + 1);
  return questions.filter((q) => q.grade >= minGrade && q.grade <= maxGrade);
}
/* ========== 學習設定卡片：護眼琥珀色 ========== */

.home-learning-settings-card {
  margin: 1.5rem 0;
  padding: 1.25rem;
  border: 2px solid rgba(180, 83, 9, 0.2);
  border-radius: 1.25rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), #fef3c7);
  box-shadow: 0 4px 14px rgba(180, 83, 9, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.home-learning-settings-heading h2 {
  color: #78350f;
  font-size: 1.1rem;
  margin: 0.25rem 0 0.5rem;
}

.home-learning-settings-heading p {
  color: #92400e;
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
}

.home-learning-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.home-setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.home-setting-item span {
  color: #78350f;
  font-size: 0.9rem;
  font-weight: 700;
}

.home-setting-select {
  min-height: 3rem;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(180, 83, 9, 0.25);
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.9);
  color: #78350f;
  font: inherit;
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.home-setting-select:hover {
  border-color: rgba(180, 83, 9, 0.4);
}

.home-setting-select:focus {
  outline: none;
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.2);
}

.home-learning-settings-hint {
  color: #92400e;
  font-size: 0.8rem;
  line-height: 1.5;
  margin: 0.75rem 0 0;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  background: rgba(254, 243, 199, 0.6);
}

@media (max-width: 640px) {
  .home-learning-settings-grid {
    grid-template-columns: 1fr;
  }
  
  .home-setting-select {
    width: 100%;
  }
}
