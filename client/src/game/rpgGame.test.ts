import { describe, expect, it } from "vitest";
import { applyBattleAction, applyBattleAnswer, beginBattleQuestion, createBattle, healBattleHp } from "./rpgBattle";
import { STARTER_COMPANION, encounterForRegion } from "./rpgData";
import { calculateBattlePerformance } from "./rpgQuestionCombat";
import { hasRewardedEvent, rewardForAnswer } from "./rpgRewards";
import { evolveCompanion, normalizeCompanionEvolution, nextEvolutionFor } from "./companionEvolution";
import { defaultRpgState, loadRpgState, recordRpgAnswer, RPG_STORAGE_KEY, saveRpgState } from "./rpgStorage";

describe("Island Explorer RPG mechanics", () => {
  it("rewards correct answers with energy and coins, with streak bonus", () => {
    expect(rewardForAnswer({ eventId: "a", correct: true, secondsLeft: 20, streak: 5 })).toEqual({ energy: 5, coins: 6, label: "答對獎勵：+5 能量、+6 金幣" });
    expect(rewardForAnswer({ eventId: "b", correct: false })).toEqual({ energy: 1, coins: 1, label: "完成觀察：獲得 1 能量與 1 金幣" });
  });

  it("detects duplicate answer events", () => {
    expect(hasRewardedEvent(["q-1"], "q-1")).toBe(true);
    expect(hasRewardedEvent(["q-1"], "q-2")).toBe(false);
  });

  it("evolves a companion only after the energy threshold and unlocks its passive", () => {
    const starter = normalizeCompanionEvolution(STARTER_COMPANION);
    const next = nextEvolutionFor(starter);
    expect(next).not.toBeNull();
    expect(evolveCompanion(starter, (next?.requiredEnergy ?? 1) - 1)).toBeNull();
    const evolved = evolveCompanion(starter, next?.requiredEnergy ?? 0);
    expect(evolved?.energy).toBe(0);
    expect(evolved?.companion.evolutionStage).toBe(2);
    expect(evolved?.companion.appearanceClass).toBe(next?.appearanceClass);
    expect(evolved?.companion.passiveSkillIds).toContain("study-focus");
  });

  it("turns a correct fast answer into stronger attack, defense, and capture values", () => {
    const performance = calculateBattlePerformance({ questionId: "q-1", correct: true, responseMs: 2_000, streak: 2 });
    expect(performance.accuracy).toBeGreaterThan(80);
    expect(performance.attackPower).toBeGreaterThan(8);
    expect(performance.defensePower).toBeGreaterThan(0);
    expect(performance.captureChance).toBeGreaterThan(50);
  });

  it("applies evolution passives to answer combat values and ultimate power", () => {
    const performance = calculateBattlePerformance({ questionId: "q-passive", correct: true, responseMs: 1_000, streak: 1, passiveSkillIds: ["study-focus", "capture-instinct", "streak-surge"] });
    const baseline = calculateBattlePerformance({ questionId: "q-passive", correct: true, responseMs: 1_000, streak: 1 });
    expect(performance.attackPower).toBe(baseline.attackPower + 2);
    expect(performance.captureChance).toBe(baseline.captureChance + 8);
    expect(performance.ultimatePowerBonus).toBe(3);
  });

  it("applies equipment critical rate and world attack multiplier deterministically", () => {
    const performance = calculateBattlePerformance({ questionId: "q-gear", correct: true, responseMs: 2_000, criticalRate: 0.05, attackMultiplier: 1.1, random: () => 0.01 });
    expect(performance.criticalHit).toBe(true);
    expect(performance.criticalRate).toBe(0.05);
    expect(performance.attackMultiplier).toBe(1.1);
    expect(performance.attackPower).toBeGreaterThan(10);
  });

  it("applies resilience as additional wrong-answer defense", () => {
    const baseline = calculateBattlePerformance({ questionId: "q-resilience", correct: false, responseMs: 2_000 });
    const resilient = calculateBattlePerformance({ questionId: "q-resilience", correct: false, responseMs: 2_000, passiveSkillIds: ["resilience", "resilience"] });
    expect(resilient.defensePower).toBe(baseline.defensePower + 4);
  });

  it("lets ordinary actions resolve without a question", () => {
    const battle = { ...createBattle(STARTER_COMPANION, encounterForRegion("north"), "q-1"), energy: 4 };
    const next = applyBattleAction(battle, { type: "basic", power: 3, label: "基礎觀察擊" });
    expect(next.enemyHp).toBe(battle.enemyHp - 3);
    expect(next.phase).toBe("action");
    expect(next.turn).toBe("enemy");
  });

  it("requires a matching question only for a skill action", () => {
    const battle = { ...createBattle(STARTER_COMPANION, encounterForRegion("north"), "q-1"), energy: 3 };
    const pending = beginBattleQuestion(battle, { type: "skill", cost: 3, power: 9, label: "潮汐脈衝" }, "q-skill");
    expect(pending.phase).toBe("question");
    expect(pending.pendingAction?.type).toBe("skill");
    const performance = calculateBattlePerformance({ questionId: "q-skill", correct: true, responseMs: 4_000 });
    const answered = applyBattleAnswer(pending, performance);
    expect(answered.phase).toBe("action");
    expect(answered.pendingAction).toBeNull();
    expect(answered.enemyHp).toBeLessThan(battle.enemyHp);
    expect(applyBattleAnswer(answered, performance)).toEqual(answered);
  });

  it("does not spend energy when a battle skill cannot be afforded", () => {
    const battle = { ...createBattle(STARTER_COMPANION, encounterForRegion("north"), "q-1"), energy: 0, phase: "action" as const, performance: calculateBattlePerformance({ questionId: "q-1", correct: true, responseMs: 5_000 }) };
    const next = applyBattleAction(battle, { type: "skill", cost: 3, power: 9, label: "潮汐脈衝" });
    expect(next.enemyHp).toBe(battle.enemyHp);
    expect(next.energy).toBe(0);
    expect(next.turn).toBe("player");
  });

  it("applies answer-scaled skill damage and ends the battle on victory", () => {
    const battle = { ...createBattle(STARTER_COMPANION, encounterForRegion("north"), "q-1"), energy: 3, enemyHp: 1, phase: "action" as const, performance: calculateBattlePerformance({ questionId: "q-1", correct: true, responseMs: 2_000 }) };
    const pending = beginBattleQuestion(battle, { type: "skill", cost: 3, power: 9, label: "潮汐脈衝" }, "q-skill");
    const next = applyBattleAnswer(pending, calculateBattlePerformance({ questionId: "q-skill", correct: true, responseMs: 2_000 }));
    expect(next.result).toBe("victory");
    expect(next.enemyHp).toBe(0);
    expect(next.log.some((line) => line.includes("答題增幅傷害"))).toBe(true);
  });

  it("applies the three-correct-answer combo critical to an answered special action", () => {
    const battle = { ...createBattle(STARTER_COMPANION, encounterForRegion("north"), "q-1"), energy: 6, enemyHp: 100, phase: "action" as const };
    const action = { type: "skill" as const, cost: 3, power: 9, label: "潮汐脈衝" };
    const basePerformance = calculateBattlePerformance({ questionId: "q-skill", correct: true, responseMs: 2_000 });
    const normal = applyBattleAnswer(beginBattleQuestion(battle, action, "q-skill"), { ...basePerformance, comboCount: 2, criticalHit: false });
    const critical = applyBattleAnswer(beginBattleQuestion(battle, action, "q-skill"), { ...basePerformance, comboCount: 3, criticalHit: true });
    const normalDamage = battle.enemyHp - normal.enemyHp;
    const criticalDamage = battle.enemyHp - critical.enemyHp;

    expect(criticalDamage).toBe(Math.round(normalDamage * 1.5));
    expect(critical.log.some((line) => line.includes("連擊！連答 3 題"))).toBe(true);
  });

  it("turns a correct 精準打擊 answer into 2.5× of the matching special-action damage", () => {
    const battle = { ...createBattle(STARTER_COMPANION, encounterForRegion("north"), "q-1"), enemyHp: 100, phase: "ready" as const };
    const performance = calculateBattlePerformance({ questionId: "q-rage", correct: true, responseMs: 2_000 });
    const standard = applyBattleAnswer(beginBattleQuestion(battle, { type: "skill", cost: 0, power: 8, label: "基準技能" }, "q-rage"), performance);
    const precise = applyBattleAnswer(beginBattleQuestion(battle, { type: "rage-precise", cost: 0, power: 8, label: "精準打擊" }, "q-rage"), performance);

    expect(battle.enemyHp - precise.enemyHp).toBe(Math.round((battle.enemyHp - standard.enemyHp) * 2.5));
    expect(precise.log.at(-1)).toContain("精準打擊完成答題增幅");
  });

  it("uses 防護壁壘 only after an incorrect answer and consumes it on the next counterattack", () => {
    const battle = { ...createBattle(STARTER_COMPANION, encounterForRegion("north"), "q-1"), phase: "ready" as const };
    const pending = beginBattleQuestion(battle, { type: "rage-shield", cost: 0, power: 8, label: "防護壁壘" }, "q-shield");
    const protectedBattle = applyBattleAnswer(pending, calculateBattlePerformance({ questionId: "q-shield", correct: false, responseMs: 2_000 }));
    const afterCounter = applyBattleAction(protectedBattle, { type: "enemy", damage: 25 }, "q-next");

    expect(protectedBattle.strategyShieldActive).toBe(true);
    expect(afterCounter.playerHp).toBe(battle.playerHp);
    expect(afterCounter.strategyShieldActive).toBe(false);
    expect(afterCounter.log.at(-2)).toContain("防護壁壘成功抵銷");
  });

  it("restores up to 20 HP with 緊急包紮 without exceeding the player maximum", () => {
    const battle = { ...createBattle(STARTER_COMPANION, encounterForRegion("north"), "q-1"), playerHp: STARTER_COMPANION.maxHp - 12 };
    const healed = healBattleHp(battle, 20);

    expect(healed.playerHp).toBe(STARTER_COMPANION.maxHp);
    expect(healed.log.at(-1)).toContain("緊急包紮恢復 12 點 HP");
  });

  it("uses an ultimate skill once per battle and spends its energy", () => {
    const battle = { ...createBattle(STARTER_COMPANION, encounterForRegion("north"), "q-1"), energy: 8, enemyHp: 18, phase: "action" as const, performance: calculateBattlePerformance({ questionId: "q-1", correct: true, responseMs: 1_500 }) };
    const pending = beginBattleQuestion(battle, { type: "ultimate", cost: 8, power: 18, label: "星潮終焰" }, "q-ultimate");
    const next = applyBattleAnswer(pending, calculateBattlePerformance({ questionId: "q-ultimate", correct: true, responseMs: 1_500 }));
    expect(next.energy).toBe(3);
    expect(next.ultimateUsed).toBe(true);
    expect(next.enemyHp).toBeLessThan(battle.enemyHp);
    expect(beginBattleQuestion(next, { type: "ultimate", cost: 8, power: 18, label: "星潮終焰" }, "q-again")).toEqual(next);
  });

  it("does not trigger an ultimate skill when energy is insufficient", () => {
    const battle = { ...createBattle(STARTER_COMPANION, encounterForRegion("north"), "q-1"), energy: 7, phase: "action" as const, performance: calculateBattlePerformance({ questionId: "q-1", correct: true, responseMs: 2_000 }) };
    const next = beginBattleQuestion(battle, { type: "ultimate", cost: 8, power: 18, label: "星潮終焰" }, "q-ultimate");
    expect(next.energy).toBe(battle.energy);
    expect(next.enemyHp).toBe(battle.enemyHp);
    expect(next.ultimateUsed).toBe(false);
    expect(next.log.at(-1)).toContain("能量不足");
  });

  it("uses answer defense to reduce the next enemy response and returns to a ready turn", () => {
    const battle = { ...createBattle(STARTER_COMPANION, encounterForRegion("north"), "q-1"), phase: "action" as const, performance: calculateBattlePerformance({ questionId: "q-1", correct: true, responseMs: 2_000 }) };
    const next = applyBattleAction(battle, { type: "enemy", damage: 3 }, "q-2");
    expect(next.phase).toBe("ready");
    expect(next.questionId).toBe("q-2");
    expect(next.playerHp).toBeGreaterThanOrEqual(battle.playerHp - 3);
  });

  it("records real answer rewards once per event", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    const first = recordRpgAnswer({ eventId: "curriculum-q1", correct: true, secondsLeft: 20, streak: 1 }, storage as Storage);
    const second = recordRpgAnswer({ eventId: "curriculum-q1", correct: true, secondsLeft: 20, streak: 1 }, storage as Storage);
    expect(first.energy).toBe(defaultRpgState.energy + 4);
    expect(second.energy).toBe(first.energy);
    expect(second.answeredEventIds).toEqual(["curriculum-q1"]);
  });

  it("persists an unlocked habitat micro quest from real curriculum answers without rewarding duplicates", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    const first = recordRpgAnswer({ eventId: "habitat-math-1", correct: true, subject: "數學", curriculumDomain: "數學領域" }, storage as Storage);
    const second = recordRpgAnswer({ eventId: "habitat-math-2", correct: true, subject: "數學", curriculumDomain: "數學領域" }, storage as Storage);
    const duplicate = recordRpgAnswer({ eventId: "habitat-math-2", correct: true, subject: "數學", curriculumDomain: "數學領域" }, storage as Storage);
    expect(first.habitatDailyProgress?.correctByHabitat["tidal-grove"]).toBe(1);
    expect(second.habitatDailyProgress?.completedHabitatIds).toContain("tidal-grove");
    expect(duplicate).toEqual(second);
  });

  it("falls back safely from corrupt storage and round-trips valid state", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    values.set(RPG_STORAGE_KEY, "not-json");
    expect(loadRpgState(storage)).toEqual(defaultRpgState);
    saveRpgState({ ...defaultRpgState, coins: 99 }, storage);
    expect(loadRpgState(storage).coins).toBe(99);
  });
});
