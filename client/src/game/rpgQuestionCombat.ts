import type { BattlePerformance } from "./rpgTypes";

export type QuestionPerformanceInput = {
  questionId: string;
  correct: boolean;
  responseMs: number;
  timeLimitMs?: number;
  streak?: number;
  basePower?: number;
  passiveSkillIds?: string[];
  defenseBonus?: number;
  captureBonus?: number;
  criticalRate?: number;
  attackMultiplier?: number;
  random?: () => number;
};

export function calculateBattlePerformance({
  questionId,
  correct,
  responseMs,
  timeLimitMs = 25_000,
  streak = 0,
  basePower = 8,
  passiveSkillIds = [],
  defenseBonus = 0,
  captureBonus = 0,
  criticalRate = 0,
  attackMultiplier = 1,
  random = Math.random,
}: QuestionPerformanceInput): BattlePerformance {
  const safeTime = Math.max(0, Math.min(responseMs, timeLimitMs));
  const speedBonus = correct ? Math.round((1 - safeTime / timeLimitMs) * 4) : 0;
  const streakBonus = correct ? Math.min(3, Math.max(0, streak)) : 0;
  const accuracy = correct ? Math.min(100, 70 + speedBonus * 5 + streakBonus * 5) : 0;
  const focusedAttackBonus = correct && passiveSkillIds.includes("study-focus") ? 2 : 0;
  const memoryDefenseBonus = !correct && passiveSkillIds.includes("shield-memory") ? 2 : 0;
  const captureInstinctBonus = passiveSkillIds.includes("capture-instinct") ? 8 : 0;
  const streakUltimateBonus = correct && streak > 0 && passiveSkillIds.includes("streak-surge") ? 3 : 0;
  const safeCriticalRate = Math.min(1, Math.max(0, Number.isFinite(criticalRate) ? criticalRate : 0));
  const rawRandomRoll = random();
  const randomRoll = Number.isFinite(rawRandomRoll) ? Math.min(1, Math.max(0, rawRandomRoll)) : 1;
  const criticalHit = correct && (streak >= 3 || randomRoll < safeCriticalRate);
  const resilienceTalentBonus = passiveSkillIds.filter((id) => id === "resilience").length * 2;
  const attackPower = correct ? Math.max(1, Math.round((basePower + speedBonus + streakBonus + focusedAttackBonus) * Math.max(0.1, attackMultiplier))) : 1;
  const defensePower = correct
    ? Math.min(8, 2 + Math.floor(speedBonus / 2) + Math.min(2, streakBonus) + defenseBonus)
    : memoryDefenseBonus + defenseBonus + resilienceTalentBonus;
  const captureChance = correct
    ? Math.min(95, 35 + accuracy * 0.35 + captureInstinctBonus + captureBonus)
    : Math.min(18, 10 + captureInstinctBonus + captureBonus);

  return {
    questionId,
    correct,
    responseMs: safeTime,
    accuracy,
    attackPower,
    defensePower,
    captureChance: Math.round(captureChance),
    ultimatePowerBonus: streakUltimateBonus,
    criticalRate: safeCriticalRate,
    criticalHit,
    attackMultiplier: Math.max(0.1, attackMultiplier),
  };
}
