import { describe, expect, it } from "vitest";
import { createBattle, applyBattleAnswer, applyBattleAction, addBattleEnergy, beginBattleQuestion } from "./rpgBattle";
import { getCombatFeedback, playCombatSfx } from "./rpgCombatFeedback";
import type { BattlePerformance, Companion, Encounter } from "./rpgTypes";

const companion: Companion = { id: "tide-scout", name: "潮汐小探員", epithet: "海岸線索的記錄者", region: "north", rarity: "common", accent: "#4db6ac", dialogue: ["準備觀察！"], skillName: "潮光脈衝", skillCost: 3, energyPower: 8, hp: 34, maxHp: 34, level: 1, xp: 0 };
const armorCompanion: Companion = { ...companion, id: "ember-guard", name: "焰甲衛", skillName: "火種護盾" };
const bubbleCompanion: Companion = { ...companion, id: "milk-dragonling", name: "奶泡龍崽", skillName: "泡泡鼓舞" };
const encounter: Encounter = { id: "moss-glow", name: "苔光小靈", description: "在濕地邊緣閃動。", region: "north", level: 1, maxHp: 40, captureCost: 4, accent: "#7ccf8a" };
const performance: BattlePerformance = { questionId: "q1", correct: true, responseMs: 5_000, accuracy: 100, attackPower: 9, defensePower: 7, captureChance: 65 };

function answeredBattleFor(current: Companion = companion) {
  const pending = beginBattleQuestion(createBattle(current, encounter, "q1"), { type: "skill", cost: 0, power: 8, label: current.skillName }, "q1");
  return applyBattleAnswer(pending, { ...performance, questionId: "q1" });
}

function answeredBattle() {
  return answeredBattleFor(companion);
}

describe("rpg combat feedback", () => {
  it("maps a correct answer and fast answer to distinct feedback", () => {
    const pending = beginBattleQuestion(createBattle(companion, encounter, "q1"), { type: "skill", cost: 0, power: 8, label: companion.skillName }, "q1");
    const next = applyBattleAnswer(pending, performance);
    expect(getCombatFeedback(pending, next)?.event).toBe("answer-fast");
  });

  it("maps each companion archetype to a distinct attack class and label", () => {
    const cosmic = getCombatFeedback(createBattle(companion, encounter, "q1"), answeredBattle(), companion);
    const armorNext = answeredBattleFor(armorCompanion);
    const bubbleNext = answeredBattleFor(bubbleCompanion);
    const armor = getCombatFeedback(createBattle(armorCompanion, encounter, "q1"), armorNext, armorCompanion);
    const bubble = getCombatFeedback(createBattle(bubbleCompanion, encounter, "q1"), bubbleNext, bubbleCompanion);
    expect(cosmic?.styleClass).toBe("companion-attack-cosmic");
    expect(armor?.styleClass).toBe("companion-attack-armor");
    expect(bubble?.styleClass).toBe("companion-attack-bubble");
    expect(new Set([cosmic?.label, armor?.label, bubble?.label]).size).toBe(3);
  });

  it("keeps companion feedback classes compatible with the battle visual layer", () => {
    const styles = [
      getCombatFeedback(createBattle(companion, encounter, "q1"), answeredBattle(), companion)?.styleClass,
      getCombatFeedback(createBattle(armorCompanion, encounter, "q1"), answeredBattleFor(armorCompanion), armorCompanion)?.styleClass,
      getCombatFeedback(createBattle(bubbleCompanion, encounter, "q1"), answeredBattleFor(bubbleCompanion), bubbleCompanion)?.styleClass,
    ];
    expect(styles).toEqual(["companion-attack-cosmic", "companion-attack-armor", "companion-attack-bubble"]);
  });

  it("maps attack damage and defense damage", () => {
    const before = { ...createBattle(companion, encounter, "q1"), energy: 3 };
    const afterAttack = applyBattleAction(before, { type: "basic", power: 2, label: "基礎觀察擊" });
    expect(getCombatFeedback(before, afterAttack)?.event).toBe("attack");
    const defenseBefore = answeredBattle();
    const afterEnemy = applyBattleAction(defenseBefore, { type: "enemy", damage: 1 }, "q2");
    expect(getCombatFeedback(defenseBefore, afterEnemy)?.event).toBe("defense");
  });

  it("maps capture success and failure without relying on visual text only", () => {
    const before = addBattleEnergy(applyBattleAction(answeredBattle(), { type: "enemy", damage: 1 }, "q2"), 1);
    const success = applyBattleAction(before, { type: "capture", cost: 4, success: true });
    expect(getCombatFeedback(before, success)?.event).toBe("capture-success");
    const failed = applyBattleAction(before, { type: "capture", cost: 4, success: false });
    expect(getCombatFeedback(before, failed)?.event).toBe("capture-fail");
  });

  it("returns null for a duplicate state transition", () => {
    const next = answeredBattle();
    expect(getCombatFeedback(next, next)).toBeNull();
  });

  it("uses companion-specific audio profiles without throwing", () => {
    expect(() => playCombatSfx("attack", false, armorCompanion)).not.toThrow();
    expect(() => playCombatSfx("answer-fast", false, bubbleCompanion)).not.toThrow();
  });

  it("does not construct audio when sound is disabled", () => {
    expect(() => playCombatSfx("attack", false)).not.toThrow();
  });
});


  it("supports the critical hit sound profile without throwing", () => {
    expect(() => playCombatSfx("critical", false, companion, 0.9)).not.toThrow();
  });

  it("skips audio safely when the persisted volume is zero", () => {
    expect(() => playCombatSfx("victory", true, companion, 0)).not.toThrow();
  });
