import { describe, expect, it } from "vitest";
import { addGearFragment, baseAttributes, canTriggerWorldEvent, craftGear, createGuardianBattleProfile, createWorldEvent, equipmentBonuses, generateDailyAdventureSummary, guardianDamage, guardianHeal, guardianMaxHp, guardianBehaviorForTurn, spendTalentPoint, worldStateForTime, type PlayerGrowth } from "./academyExpansion";

describe("academy expansion systems", () => {
  it("builds a guardian with triple HP and rotating behavior", () => {
    expect(guardianMaxHp(40)).toBe(120);
    expect(guardianBehaviorForTurn(1)).toBe("berserk");
    expect(guardianBehaviorForTurn(4)).toBe("curse");
    const profile = createGuardianBattleProfile({ guardianId: "g", regularHp: 40, attack: 10, turn: 2 });
    expect(profile.maxHp).toBe(120);
    expect(profile.mode).toBe("heal");
  });

  it("applies guardian mode effects", () => {
    expect(guardianDamage({ baseDamage: 10, mode: "dodge", correct: true })).toBe(5);
    expect(guardianDamage({ baseDamage: 10, mode: "curse", correct: false })).toBe(13);
    expect(guardianHeal({ currentHp: 50, maxHp: 100, mode: "heal" })).toBe(56);
  });

  it("summarizes the previous day's real journal entries", () => {
    const date = Date.parse("2026-08-21T12:00:00Z");
    const entries = [{ id: "1", date: Date.parse("2026-08-20T08:00:00Z"), subject: "數學", topicCount: 10, correctCount: 9, sessionType: "battle" as const, islandId: null, summary: "" }];
    const summary = generateDailyAdventureSummary({ date, entries });
    expect(summary.answered).toBe(10);
    expect(summary.correct).toBe(9);
    expect(summary.summary).toContain("數學");
  });

  it("spends talent points and crafts five fragments into gear", () => {
    const initial: PlayerGrowth = { talentPoints: 2, talents: {}, equippedGearIds: [], fragments: {} };
    const talented = spendTalentPoint(initial, "precision");
    expect(talented.talentPoints).toBe(1);
    const withFragments = addGearFragment(talented, "gear-confucius-charm", 5);
    const crafted = craftGear(withFragments, "gear-confucius-charm");
    expect(crafted.fragments["gear-confucius-charm"]).toBe(0);
    expect(equipmentBonuses(crafted).attack).toBe(3);
  });

  it("keeps world events capped and applies time modifiers", () => {
    expect(canTriggerWorldEvent(3)).toBe(false);
    const event = createWorldEvent({ kind: "knowledge-storm", region: "north", now: 1000 });
    expect(event.expiresAt).toBe(1000 + 30 * 60_000);
    const night = worldStateForTime(Date.parse("2026-08-21T22:00:00"), 0.1);
    expect(night.period).toBe("night");
    expect(night.battleAttackMultiplier).toBe(1.1);
    expect(night.rainy).toBe(true);
  });

  it("returns level-based base attributes", () => {
    expect(baseAttributes(11)).toEqual({ attack: 20, defense: 2, luck: 0.01 });
  });
});
