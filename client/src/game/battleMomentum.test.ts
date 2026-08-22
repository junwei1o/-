import { describe, expect, it } from "vitest";
import { getComboCount, getCrisisLevel, getEnemyPhase } from "./battleMomentum";

describe("battle momentum signals", () => {
  it("derives safe, warning, and critical player HP states at clear thresholds", () => {
    expect(getCrisisLevel(51, 100)).toBe("safe");
    expect(getCrisisLevel(50, 100)).toBe("warning");
    expect(getCrisisLevel(30, 100)).toBe("critical");
    expect(getCrisisLevel(0, 0)).toBe("safe");
  });

  it("counts consecutive correct answer logs while ignoring neutral battle narration", () => {
    expect(getComboCount([
      "答對了！獲得 3 點能量；準備施放潮汐脈衝。",
      "潮汐脈衝造成 8 點答題增幅傷害！",
      "守門者反應造成 2 點傷害。",
      "答對了！獲得 3 點能量；準備施放潮汐脈衝。",
    ])).toBe(2);
  });

  it("resets the answer combo only when an answer is recorded as incorrect", () => {
    expect(getComboCount([
      "答對了！獲得 3 點能量；準備施放潮汐脈衝。",
      "答案需要再觀察一次；本次技能威力會降低。",
      "潮汐脈衝以保守威力施放。",
      "答對了！獲得 3 點能量；準備施放潮汐脈衝。",
    ])).toBe(1);
  });

  it("shows escalating enemy phases at 60% and 30% remaining HP", () => {
    expect(getEnemyPhase(61, 100)).toBe("normal");
    expect(getEnemyPhase(60, 100)).toBe("enraged");
    expect(getEnemyPhase(30, 100)).toBe("desperate");
    expect(getEnemyPhase(0, 0)).toBe("normal");
  });
});
