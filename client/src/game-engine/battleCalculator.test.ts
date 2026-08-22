import { describe, expect, it } from "vitest";
import {
  CRITICAL_COMBO_THRESHOLD,
  CRITICAL_MULTIPLIER,
  DEFAULT_QUESTION_TIME_LIMIT_MS,
  GUARDIAN_DISRUPT_CHANCE,
  calculateCritical,
  calculateDamage,
  calculateEnemyDamage,
  rollEnemyDisrupt,
} from "./battleCalculator";

describe("BattleCalculator", () => {
  it("only turns on the 1.5x critical multiplier from the third correct-answer combo", () => {
    expect(calculateCritical(CRITICAL_COMBO_THRESHOLD - 1)).toEqual({ isCritical: false, multiplier: 1 });
    expect(calculateCritical(CRITICAL_COMBO_THRESHOLD)).toEqual({ isCritical: true, multiplier: CRITICAL_MULTIPLIER });
    expect(calculateCritical(8)).toEqual({ isCritical: true, multiplier: CRITICAL_MULTIPLIER });
  });

  it("calculates answer-quality damage with a positive lower bound and critical multiplier", () => {
    expect(calculateDamage(10, 1, 0)).toBe(10);
    expect(calculateDamage(10, 100, 3)).toBe(15);
    expect(calculateDamage(7, 0.5, 3)).toBe(5);
    expect(calculateDamage(-10, Number.NaN, -1)).toBe(1);
  });

  it("reduces guardian damage through defense without creating zero or negative damage", () => {
    expect(calculateEnemyDamage(8, 3)).toBe(5);
    expect(calculateEnemyDamage(3, 99)).toBe(1);
    expect(calculateEnemyDamage(Number.NaN, Number.NaN)).toBe(1);
  });

  it("uses an injectable 30% guardian rhythm-cue roll and applies a bounded time window", () => {
    const cue = rollEnemyDisrupt(() => GUARDIAN_DISRUPT_CHANCE - 0.01, DEFAULT_QUESTION_TIME_LIMIT_MS);
    expect(cue).toMatchObject({ type: "guardian-rhythm-cue", timeLimitMs: 20_000 });
    expect(cue?.message).toContain("20 秒");
    expect(rollEnemyDisrupt(() => GUARDIAN_DISRUPT_CHANCE)).toBeNull();
    expect(rollEnemyDisrupt(() => Number.NaN)).toBeNull();
  });
});
