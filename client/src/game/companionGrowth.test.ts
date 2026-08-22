import { describe, expect, it } from "vitest";
import { affectionLevel, affectionProgress, growthForAnswer, normalizeCompanionGrowth, trainCompanion, unlockGrowthAchievements } from "./companionGrowth";
import type { Companion } from "./rpgTypes";

const base: Companion = { id: "tide-scout", name: "潮芽獸", epithet: "測試夥伴", region: "north", rarity: "common", level: 1, xp: 0, hp: 30, maxHp: 30, energyPower: 8, defense: 2, dialogue: ["一起學習"], skillName: "潮汐回應", skillCost: 3, accent: "#76c7c0" };

describe("companion growth", () => {
  it("normalizes legacy companions with safe growth defaults", () => {
    const normalized = normalizeCompanionGrowth(base);
    expect(normalized.affection).toBe(0);
    expect(normalized.trainingPoints).toBe(0);
    expect(normalized.personality).toBe("觀察家");
    expect(normalized.equippedSkillIds).toEqual([]);
  });

  it("turns correct answers into affection and training points", () => {
    const grown = growthForAnswer({ ...base, personality: "鼓舞者" }, { correct: true, streak: 3 });
    expect(grown.affection).toBe(3);
    expect(grown.trainingPoints).toBe(1);
    expect(growthForAnswer(base, { correct: false }).affection).toBe(0);
  });

  it("keeps affection levels bounded and readable", () => {
    expect(affectionLevel(0)).toBe(1);
    expect(affectionLevel(99)).toBe(5);
    expect(affectionProgress(13)).toBe(65);
    expect(affectionProgress(100)).toBe(100);
  });

  it("spends two training points for a targeted stat upgrade", () => {
    const trained = trainCompanion({ ...base, trainingPoints: 2 }, "train-guard");
    expect(trained?.trainingPoints).toBe(0);
    expect(trained?.defense).toBe(3);
    expect(trained?.maxHp).toBe(32);
    expect(trainCompanion(base, "train-focus")).toBeNull();
  });

  it("unlocks answer-driven achievements only once", () => {
    const first = unlockGrowthAchievements(base, 5, 3, true);
    expect(first.unlocked.map((item) => item.id)).toEqual(["first-light", "steady-mind", "domain-tracker", "brave-challenger"]);
    expect(first.companion.achievementIds).toHaveLength(4);
    const second = unlockGrowthAchievements(first.companion, 5, 3, true);
    expect(second.unlocked).toHaveLength(0);
  });
});
