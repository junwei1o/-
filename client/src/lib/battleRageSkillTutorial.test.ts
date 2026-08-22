import { advanceBattleRageSkillCooldowns, BATTLE_RAGE_SKILL_TUTORIAL_STORAGE_KEY, createBattleRageSkillCooldowns, getBattleRageSkillCooldownProgress, loadBattleRageSkillTutorial, markBattleRageSkillTutorialSeen, RAGE_SKILL_COOLDOWN_TURNS, startBattleRageSkillCooldown } from "./battleRageSkillTutorial";
import { beforeEach, describe, expect, it } from "vitest";
import { BATTLE_RAGE_SKILL_CAST_HIGHLIGHT_MS, BATTLE_RAGE_SKILL_TUTORIAL_STORAGE_KEY, RAGE_SKILL_COOLDOWN_TURNS, advanceBattleRageSkillCooldowns, createBattleRageSkillCooldowns, getBattleRageSkillCooldownProgress, isBattleRageSkillHighlighted, loadBattleRageSkillTutorial, markBattleRageSkillTutorialSeen, startBattleRageSkillCooldown } from "./battleRageSkillTutorial";

describe("battle rage skill tutorial and cooldowns", () => {
  const entries = new Map<string, string>();
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  };

  beforeEach(() => entries.clear());

  it("shows the tutorial by default and records a dismissal without breaking unavailable storage", () => {
    expect(loadBattleRageSkillTutorial(storage)).toEqual({ version: 1, seen: false });
    expect(markBattleRageSkillTutorialSeen(storage)).toEqual({ version: 1, seen: true });
    expect(loadBattleRageSkillTutorial(storage)).toEqual({ version: 1, seen: true });
    expect(markBattleRageSkillTutorialSeen(null)).toEqual({ version: 1, seen: true });
  });

  it("starts only the selected skill at two turns and reduces cooldowns without going below zero", () => {
    const started = startBattleRageSkillCooldown(createBattleRageSkillCooldowns(), "shield");
    expect(started).toEqual({ precise: 0, shield: RAGE_SKILL_COOLDOWN_TURNS, heal: 0 });
    expect(advanceBattleRageSkillCooldowns(started)).toEqual({ precise: 0, shield: 1, heal: 0 });
    expect(advanceBattleRageSkillCooldowns({ precise: 0, shield: 0, heal: 1 })).toEqual({ precise: 0, shield: 0, heal: 0 });
  });

  it("maps remaining cooldown turns to a bounded progress percentage", () => {
    expect(getBattleRageSkillCooldownProgress(RAGE_SKILL_COOLDOWN_TURNS)).toBe(100);
    expect(getBattleRageSkillCooldownProgress(1)).toBe(50);
    expect(getBattleRageSkillCooldownProgress(0)).toBe(0);
    expect(getBattleRageSkillCooldownProgress(-1)).toBe(0);
    expect(getBattleRageSkillCooldownProgress(99)).toBe(100);
    expect(getBattleRageSkillCooldownProgress(1, 0)).toBe(0);
  });

  it("marks only the cast skill and exposes a short feedback duration", () => {
    expect(BATTLE_RAGE_SKILL_CAST_HIGHLIGHT_MS).toBe(520);
    expect(isBattleRageSkillHighlighted("precise", "precise")).toBe(true);
    expect(isBattleRageSkillHighlighted("shield", "precise")).toBe(false);
    expect(isBattleRageSkillHighlighted("heal", null)).toBe(false);
  });

  it("resets invalid saved tutorial data to the safe default", () => {
    entries.set(BATTLE_RAGE_SKILL_TUTORIAL_STORAGE_KEY, "not-json");
    expect(loadBattleRageSkillTutorial(storage)).toEqual({ version: 1, seen: false });
    expect(entries.has(BATTLE_RAGE_SKILL_TUTORIAL_STORAGE_KEY)).toBe(false);
  });
});
