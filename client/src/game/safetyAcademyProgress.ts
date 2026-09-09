import { SAFETY_CARDS, SAFETY_CARD_KEYS, type SafetyCardKey, type SafetyHallKey } from "@/lib/safetyAcademy";

const HALL_OF_CARD: Record<SafetyCardKey, SafetyHallKey> = SAFETY_CARDS.reduce(
  (acc, card) => ({ ...acc, [card.key]: card.hall }),
  {} as Record<SafetyCardKey, SafetyHallKey>,
);

/**
 * 生活安全學院答題進度。
 * 一張卡只要答對過一次就算完成（completedAt 記錄首次完成時間）；
 * 金幣獎勵由 rpgStorage 依 justCompleted 只發放一次。
 */

export type SafetyAcademyProgressEntry = {
  attempts: number;
  completedAt: number;
};

export type SafetyAcademyProgress = Partial<Record<SafetyCardKey, SafetyAcademyProgressEntry>>;

export type SafetyCardRecordResult = {
  progress: SafetyAcademyProgress;
  justCompleted: boolean;
};

export type SafetyAcademyHallSummary = {
  hall: SafetyHallKey;
  completed: number;
  total: number;
};

export type SafetyAcademySummary = {
  completedCards: number;
  totalCards: number;
  completionPercentage: number;
  halls: SafetyAcademyHallSummary[];
  cards: Array<{ key: SafetyCardKey; completed: boolean; attempts: number; completedAt: number }>;
};

function safeEntry(value: unknown): SafetyAcademyProgressEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Partial<SafetyAcademyProgressEntry>;
  if (typeof entry.attempts !== "number" || typeof entry.completedAt !== "number") return null;
  if (!Number.isFinite(entry.attempts) || !Number.isFinite(entry.completedAt)) return null;
  return {
    attempts: Math.max(0, Math.floor(entry.attempts)),
    completedAt: Math.max(0, Math.floor(entry.completedAt)),
  };
}

export function normalizeSafetyAcademyProgress(value: unknown): SafetyAcademyProgress {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  return SAFETY_CARD_KEYS.reduce<SafetyAcademyProgress>((progress, key) => {
    const entry = safeEntry(raw[key]);
    return entry ? { ...progress, [key]: entry } : progress;
  }, {});
}

/**
 * 記錄一次作答。答錯也會累加 attempts（方便之後回顧哪些卡最常卡關），
 * 但只有首次答對會把卡片標記為完成並回報 justCompleted。
 */
export function recordSafetyCardAnswer(
  current: SafetyAcademyProgress | undefined,
  result: { cardKey: SafetyCardKey; correct: boolean },
  completedAt = Date.now(),
): SafetyCardRecordResult {
  const progress = normalizeSafetyAcademyProgress(current);
  if (!SAFETY_CARD_KEYS.includes(result.cardKey)) return { progress, justCompleted: false };
  const prior = progress[result.cardKey];
  const wasCompleted = Boolean(prior?.completedAt);
  const justCompleted = Boolean(result.correct && !wasCompleted);
  return {
    progress: {
      ...progress,
      [result.cardKey]: {
        attempts: (prior?.attempts ?? 0) + 1,
        completedAt: justCompleted ? Math.max(0, Math.floor(completedAt)) : (prior?.completedAt ?? 0),
      },
    },
    justCompleted,
  };
}

export function isSafetyCardCompleted(progress: SafetyAcademyProgress | undefined, key: SafetyCardKey): boolean {
  return Boolean(normalizeSafetyAcademyProgress(progress)[key]?.completedAt);
}

export function getSafetyAcademySummary(progress: SafetyAcademyProgress | undefined): SafetyAcademySummary {
  const normalized = normalizeSafetyAcademyProgress(progress);
  const cards = SAFETY_CARD_KEYS.map((key) => {
    const entry = normalized[key];
    return {
      key,
      attempts: entry?.attempts ?? 0,
      completedAt: entry?.completedAt ?? 0,
      completed: Boolean(entry?.completedAt),
    };
  });
  const completedCards = cards.filter((card) => card.completed).length;
  const hallMap = new Map<SafetyHallKey, SafetyAcademyHallSummary>();
  for (const card of cards) {
    const hall = HALL_OF_CARD[card.key];
    const existing = hallMap.get(hall) ?? { hall, completed: 0, total: 0 };
    existing.total += 1;
    if (card.completed) existing.completed += 1;
    hallMap.set(hall, existing);
  }
  return {
    completedCards,
    totalCards: cards.length,
    completionPercentage: cards.length === 0 ? 0 : Math.round((completedCards / cards.length) * 100),
    halls: Array.from(hallMap.values()),
    cards,
  };
}
