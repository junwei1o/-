import type { KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";

import { readStoredJson, removeStoredValue, writeStoredJson } from "@/utils/storage";

export const MAP_REINFORCEMENT_REWARD_STORAGE_KEY = "xue-adventure.map-reinforcement-reward.v1";
export const MAP_REINFORCEMENT_JOURNAL_STORAGE_KEY = "xue-adventure.map-reinforcement-journal.v1";
export const RECENT_REINFORCEMENT_WEEK_COUNT = 4;
const MAX_JOURNAL_ENTRIES = 40;

export type MapReinforcementReward = Readonly<{
  questionId: string;
  subject: KnowledgeIslandSubject;
  knowledge: string;
  completedAt: number;
}>;

export type MapReinforcementJournalEntry = MapReinforcementReward;

function isKnowledgeIslandSubject(value: unknown): value is KnowledgeIslandSubject {
  return value === "國語" || value === "數學" || value === "自然" || value === "社會";
}

function normalizeReward(value: unknown): MapReinforcementReward | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<MapReinforcementReward>;
  if (typeof candidate.questionId !== "string" || !candidate.questionId.trim()) return null;
  if (!isKnowledgeIslandSubject(candidate.subject)) return null;
  if (typeof candidate.knowledge !== "string" || !candidate.knowledge.trim()) return null;
  if (typeof candidate.completedAt !== "number" || !Number.isFinite(candidate.completedAt)) return null;
  return Object.freeze({
    questionId: candidate.questionId.trim(),
    subject: candidate.subject,
    knowledge: candidate.knowledge.trim(),
    completedAt: candidate.completedAt,
  });
}

function loadJournalEntries(): MapReinforcementJournalEntry[] {
  const parsed = readStoredJson<unknown>(MAP_REINFORCEMENT_JOURNAL_STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed.map(normalizeReward).filter((entry): entry is MapReinforcementJournalEntry => entry !== null) : [];
}

export function getReinforcementUtcWeekStart(timestamp: number) {
  if (!Number.isFinite(timestamp)) return null;
  const date = new Date(timestamp);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

export type ReinforcementJournalWeekRange = Readonly<{
  offset: number;
  start: number;
  end: number;
}>;

/** 依 UTC 週一至週日計算目前週與前三週的資料邊界，無效週次安全回傳 null。 */
export function getRecentReinforcementJournalWeekRange(offset: number, now = Date.now()): ReinforcementJournalWeekRange | null {
  if (!Number.isInteger(offset) || offset < 0 || offset >= RECENT_REINFORCEMENT_WEEK_COUNT) return null;
  const currentWeekStart = getReinforcementUtcWeekStart(now);
  if (currentWeekStart === null) return null;
  const start = currentWeekStart - offset * 7 * 24 * 60 * 60 * 1000;
  return Object.freeze({ offset, start, end: offset === 0 ? now : currentWeekStart - (offset - 1) * 7 * 24 * 60 * 60 * 1000 - 1 });
}

/** Persists only the verified, finished remediation prompt so the map can acknowledge it once. */
export function queueMapReinforcementReward(reward: MapReinforcementReward) {
  const normalized = normalizeReward(reward);
  if (!normalized) return false;
  return writeStoredJson(MAP_REINFORCEMENT_REWARD_STORAGE_KEY, normalized);
}

/** 保存一筆已驗證補強完成紀錄；相同事件不會重複列入航誌。 */
export function recordMapReinforcementJournalEntry(reward: MapReinforcementJournalEntry) {
  const normalized = normalizeReward(reward);
  if (!normalized) return false;
  const identity = `${normalized.questionId}:${normalized.completedAt}`;
  const entries = [...loadJournalEntries().filter((entry) => `${entry.questionId}:${entry.completedAt}` !== identity), normalized]
    .sort((left, right) => right.completedAt - left.completedAt)
    .slice(0, MAX_JOURNAL_ENTRIES);
  return writeStoredJson(MAP_REINFORCEMENT_JOURNAL_STORAGE_KEY, entries);
}

/** 只傳回本週 UTC 起算至今的真實補強完成紀錄，並以最新完成時間排序。 */
export function loadCurrentWeekReinforcementJournal(now = Date.now()): MapReinforcementJournalEntry[] {
  return loadRecentReinforcementJournalWeek(0, now);
}

/** 只傳回目前週與前三週中指定 UTC 週次的真實補強完成紀錄，並以最新完成時間排序。 */
export function loadRecentReinforcementJournalWeek(offset: number, now = Date.now()): MapReinforcementJournalEntry[] {
  const range = getRecentReinforcementJournalWeekRange(offset, now);
  if (!range) return [];
  return loadJournalEntries()
    .filter((entry) => entry.completedAt >= range.start && entry.completedAt <= range.end)
    .sort((left, right) => right.completedAt - left.completedAt);
}

export type ReinforcementJournalWeekComparison = Readonly<{
  currentWeekCount: number;
  previousWeekCount: number;
  difference: number;
  status: "no-data" | "more" | "steady" | "less";
}>;

/** 比較本週與上週實際完成的補強筆數；只回傳可由本機航誌驗證的數據，不推測未記錄的學習情況。 */
export function buildCurrentVsPreviousReinforcementJournalComparison(now = Date.now()): ReinforcementJournalWeekComparison {
  const currentWeekCount = loadRecentReinforcementJournalWeek(0, now).length;
  const previousWeekCount = loadRecentReinforcementJournalWeek(1, now).length;
  const difference = currentWeekCount - previousWeekCount;
  const status = currentWeekCount === 0 && previousWeekCount === 0 ? "no-data" : difference > 0 ? "more" : difference === 0 ? "steady" : "less";
  return Object.freeze({ currentWeekCount, previousWeekCount, difference, status });
}

export type ReinforcementJournalTopicDistributionItem = Readonly<{
  subject: KnowledgeIslandSubject;
  knowledge: string;
  count: number;
}>;

/** 彙整目前週與前三週中可驗證的補強主題；相同學科與知識點才會累積，不臆測未留下的主題。 */
export function buildRecentReinforcementJournalTopicDistribution(now = Date.now()): ReinforcementJournalTopicDistributionItem[] {
  const topicCounts = new Map<string, ReinforcementJournalTopicDistributionItem>();
  for (let offset = 0; offset < RECENT_REINFORCEMENT_WEEK_COUNT; offset += 1) {
    for (const entry of loadRecentReinforcementJournalWeek(offset, now)) {
      const key = `${entry.subject}\u0000${entry.knowledge}`;
      const existing = topicCounts.get(key);
      topicCounts.set(key, Object.freeze({ subject: entry.subject, knowledge: entry.knowledge, count: (existing?.count ?? 0) + 1 }));
    }
  }
  return Array.from(topicCounts.values()).sort((left, right) => right.count - left.count || left.knowledge.localeCompare(right.knowledge, "zh-TW") || left.subject.localeCompare(right.subject, "zh-TW"));
}

/** Consumes the reward immediately to prevent a refresh from repeatedly displaying the same animation. */
export function consumeMapReinforcementReward(): MapReinforcementReward | null {
  const reward = readStoredJson<unknown>(MAP_REINFORCEMENT_REWARD_STORAGE_KEY, null);
  removeStoredValue(MAP_REINFORCEMENT_REWARD_STORAGE_KEY);
  return normalizeReward(reward);
}
