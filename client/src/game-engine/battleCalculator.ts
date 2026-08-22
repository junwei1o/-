export const CRITICAL_COMBO_THRESHOLD = 3;
export const CRITICAL_MULTIPLIER = 1.5;
export const GUARDIAN_DISRUPT_CHANCE = 0.3;
export const DEFAULT_QUESTION_TIME_LIMIT_MS = 25_000;
export const MINIMUM_DISRUPT_TIME_LIMIT_MS = 5_000;

export type CriticalResult = Readonly<{
  isCritical: boolean;
  multiplier: number;
}>;

export type EnemyDisruptAction = Readonly<{
  type: "guardian-rhythm-cue";
  timeLimitMs: number;
  message: string;
}>;

function finiteNonNegative(value: number, fallback = 0): number {
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function normalizedCorrectRate(value: number): number {
  const safeValue = finiteNonNegative(value);
  return Math.min(1, safeValue > 1 ? safeValue / 100 : safeValue);
}

/**
 * Determines whether a run of correctly answered curriculum questions has
 * reached the stable three-question critical threshold.
 */
export function calculateCritical(comboCount: number): CriticalResult {
  const isCritical = Math.floor(finiteNonNegative(comboCount)) >= CRITICAL_COMBO_THRESHOLD;
  return Object.freeze({ isCritical, multiplier: isCritical ? CRITICAL_MULTIPLIER : 1 });
}

/**
 * Applies answer quality and the combo critical multiplier to a resolved
 * action value. A wrong or malformed quality value still returns one point so
 * the established low-impact special-action fallback remains available.
 */
export function calculateDamage(baseAttack: number, correctRate: number, comboCount: number): number {
  const base = Math.max(1, Math.round(finiteNonNegative(baseAttack, 1)));
  const quality = normalizedCorrectRate(correctRate);
  const { multiplier } = calculateCritical(comboCount);
  return Math.max(1, Math.round(base * quality * multiplier));
}

/** Keeps enemy feedback predictable while honouring answer-earned defense. */
export function calculateEnemyDamage(enemyAttack: number, defenseBonus: number): number {
  const attack = Math.max(1, Math.round(finiteNonNegative(enemyAttack, 1)));
  const defense = Math.round(finiteNonNegative(defenseBonus));
  return Math.max(1, attack - defense);
}

/**
 * Produces a short, positive time-focus cue at a fixed 30% probability.
 * Injecting random makes the outcome fully deterministic in tests.
 */
export function rollEnemyDisrupt(
  random: () => number = Math.random,
  baseTimeLimitMs = DEFAULT_QUESTION_TIME_LIMIT_MS,
): EnemyDisruptAction | null {
  const rawRoll = random();
  const roll = Number.isFinite(rawRoll) ? Math.min(1, Math.max(0, rawRoll)) : 1;
  if (roll >= GUARDIAN_DISRUPT_CHANCE) return null;

  const safeBaseTime = Math.max(MINIMUM_DISRUPT_TIME_LIMIT_MS, Math.round(finiteNonNegative(baseTimeLimitMs, DEFAULT_QUESTION_TIME_LIMIT_MS)));
  const timeLimitMs = Math.max(MINIMUM_DISRUPT_TIME_LIMIT_MS, Math.round(safeBaseTime * 0.8));
  const seconds = Math.round(timeLimitMs / 1000);
  return Object.freeze({
    type: "guardian-rhythm-cue",
    timeLimitMs,
    message: `守門者送出節奏訊號：下一題在 ${seconds} 秒內，先抓住關鍵線索再作答。`,
  });
}
