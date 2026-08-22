import type { AnimeWorldviewKey } from "@/lib/animeWorldviewQuiz";

export const ANIME_WORLDVIEW_KEYS: AnimeWorldviewKey[] = ["nailong", "ultraman", "kamen-rider"];

export type AnimeWorldviewProgressEntry = {
  attempts: number;
  lastCorrect: number;
  bestCorrect: number;
  total: number;
  completedAt: number;
};

export type AnimeWorldviewProgress = Partial<Record<AnimeWorldviewKey, AnimeWorldviewProgressEntry>>;

export type AnimeWorldviewProgressSummary = {
  completedStations: number;
  totalStations: number;
  completionPercentage: number;
  stations: Array<AnimeWorldviewProgressEntry & { key: AnimeWorldviewKey; completed: boolean }>;
};

function safeEntry(value: unknown): AnimeWorldviewProgressEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Partial<AnimeWorldviewProgressEntry>;
  if (typeof entry.attempts !== "number" || typeof entry.lastCorrect !== "number" || typeof entry.bestCorrect !== "number" || typeof entry.total !== "number" || typeof entry.completedAt !== "number") return null;
  if (![entry.attempts, entry.lastCorrect, entry.bestCorrect, entry.total, entry.completedAt].every(Number.isFinite)) return null;
  const total = Math.max(1, Math.floor(entry.total));
  const lastCorrect = Math.min(total, Math.max(0, Math.floor(entry.lastCorrect)));
  return {
    attempts: Math.max(0, Math.floor(entry.attempts)),
    lastCorrect,
    bestCorrect: Math.max(lastCorrect, Math.min(total, Math.max(0, Math.floor(entry.bestCorrect)))),
    total,
    completedAt: Math.max(0, Math.floor(entry.completedAt)),
  };
}

export function normalizeAnimeWorldviewProgress(value: unknown): AnimeWorldviewProgress {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  return ANIME_WORLDVIEW_KEYS.reduce<AnimeWorldviewProgress>((progress, key) => {
    const entry = safeEntry(raw[key]);
    return entry ? { ...progress, [key]: entry } : progress;
  }, {});
}

export function recordAnimeWorldviewQuizResult(
  current: AnimeWorldviewProgress | undefined,
  result: { entryKey: AnimeWorldviewKey; correct: number; total: number },
  completedAt = Date.now(),
): AnimeWorldviewProgress {
  const progress = normalizeAnimeWorldviewProgress(current);
  const total = Math.max(1, Math.floor(result.total));
  const correct = Math.min(total, Math.max(0, Math.floor(result.correct)));
  const prior = progress[result.entryKey];
  return {
    ...progress,
    [result.entryKey]: {
      attempts: (prior?.attempts ?? 0) + 1,
      lastCorrect: correct,
      bestCorrect: Math.max(prior?.bestCorrect ?? 0, correct),
      total,
      completedAt: Math.max(0, Math.floor(completedAt)),
    },
  };
}

export function getAnimeWorldviewProgressSummary(progress: AnimeWorldviewProgress | undefined): AnimeWorldviewProgressSummary {
  const normalized = normalizeAnimeWorldviewProgress(progress);
  const stations = ANIME_WORLDVIEW_KEYS.map((key) => {
    const entry = normalized[key];
    return {
      key,
      attempts: entry?.attempts ?? 0,
      lastCorrect: entry?.lastCorrect ?? 0,
      bestCorrect: entry?.bestCorrect ?? 0,
      total: entry?.total ?? 0,
      completedAt: entry?.completedAt ?? 0,
      completed: Boolean(entry),
    };
  });
  const completedStations = stations.filter((station) => station.completed).length;
  return {
    completedStations,
    totalStations: stations.length,
    completionPercentage: stations.length === 0 ? 0 : Math.round((completedStations / stations.length) * 100),
    stations,
  };
}
