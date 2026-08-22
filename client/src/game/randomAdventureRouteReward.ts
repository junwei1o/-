import type { PaperSubject } from "@/lib/paperExam";

export const RANDOM_ADVENTURE_ROUTE_REWARD_STORAGE_KEY = "xue-adventure.random-adventure-route-reward.v1";

export type RandomAdventureSubject = Exclude<PaperSubject, "綜合課綱">;

export type RandomAdventureRouteReward = Readonly<{
  eventId: string;
  questionId: string;
  subject: RandomAdventureSubject;
  completedAt: number;
}>;

function isRandomAdventureSubject(value: unknown): value is RandomAdventureSubject {
  return value === "國語" || value === "數學" || value === "英語" || value === "自然" || value === "社會";
}

function normalizeRouteReward(value: unknown): RandomAdventureRouteReward | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<RandomAdventureRouteReward>;
  if (typeof candidate.eventId !== "string" || !candidate.eventId.trim()) return null;
  if (typeof candidate.questionId !== "string" || !candidate.questionId.trim()) return null;
  if (!isRandomAdventureSubject(candidate.subject)) return null;
  if (typeof candidate.completedAt !== "number" || !Number.isFinite(candidate.completedAt)) return null;
  return Object.freeze({
    eventId: candidate.eventId.trim(),
    questionId: candidate.questionId.trim(),
    subject: candidate.subject,
    completedAt: candidate.completedAt,
  });
}

function resolveStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 僅由已驗證的隨機冒險答對事件排入；首頁消費後立即移除，避免重整重播。 */
export function queueRandomAdventureRouteReward(reward: RandomAdventureRouteReward, storage?: Storage) {
  const normalized = normalizeRouteReward(reward);
  if (!normalized) return false;
  try {
    const targetStorage = resolveStorage(storage);
    if (!targetStorage) return false;
    targetStorage.setItem(RANDOM_ADVENTURE_ROUTE_REWARD_STORAGE_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

export function consumeRandomAdventureRouteReward(storage?: Storage): RandomAdventureRouteReward | null {
  try {
    const targetStorage = resolveStorage(storage);
    if (!targetStorage) return null;
    const raw = targetStorage.getItem(RANDOM_ADVENTURE_ROUTE_REWARD_STORAGE_KEY);
    targetStorage.removeItem(RANDOM_ADVENTURE_ROUTE_REWARD_STORAGE_KEY);
    return raw ? normalizeRouteReward(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
