import type { BattleState, Companion, Encounter } from "./rpgTypes";
import { calculateEnemyDamage } from "../game-engine/battleCalculator";

export type BattleTacticsAction = {
  id: "basic" | "skill" | "ultimate";
  label: string;
  badge: string;
  detail: string;
  availability: string;
  unavailable: boolean;
};

export type BattleTactics = {
  intent: {
    title: string;
    damage: number;
    detail: string;
  };
  actions: BattleTacticsAction[];
};

type BattleTacticsInput = {
  battle: BattleState;
  companion: Pick<Companion, "energyPower" | "skillCost" | "skillName">;
  encounter: Pick<Encounter, "level">;
  ultimateLabel: string;
};

function actionDamage(power: number, answerPower: number, multiplier = 1, answerBonus = 0) {
  return Math.max(1, power * multiplier + answerPower - 1 + answerBonus);
}

/**
 * Exposes only effects that the existing state machine already applies.
 * It deliberately does not mutate battle state, add a resource, or predict randomness.
 */
export function getBattleTactics({ battle, companion, encounter, ultimateLabel }: BattleTacticsInput): BattleTactics {
  const defense = battle.performance?.defensePower ?? 0;
  const baselineEnemyDamage = Math.max(1, encounter.level + 1);
  const expectedEnemyDamage = calculateEnemyDamage(baselineEnemyDamage, defense);
  const basicDamage = Math.max(2, Math.round(companion.energyPower / 2));
  const skillCost = companion.skillCost;
  const ultimateCost = Math.max(8, companion.skillCost * 2);
  const skillMissDamage = actionDamage(companion.energyPower, 1);
  const skillCorrectDamage = actionDamage(companion.energyPower, companion.energyPower, 1, 2);
  const ultimatePower = companion.energyPower + 6;
  const ultimateMissDamage = actionDamage(ultimatePower, 1, 2);
  const ultimateCorrectDamage = actionDamage(ultimatePower, companion.energyPower, 2, 2);
  const enemyIsActing = battle.turn === "enemy";

  return {
    intent: {
      title: enemyIsActing ? "守門者正準備回應" : battle.phase === "question" ? "答題將影響下一次回應" : "下一個戰況訊號",
      damage: expectedEnemyDamage,
      detail: defense > 0
        ? `目前答題守備已將預計反應由 ${baselineEnemyDamage} 降為 ${expectedEnemyDamage} 點。`
        : `預計反應 ${expectedEnemyDamage} 點；答對特殊行動時會依答題守備降低這次回應。`,
    },
    actions: [
      {
        id: "basic",
        label: "基礎攻擊",
        badge: "立即應對",
        detail: `直接造成 ${basicDamage} 點傷害，不需要回答題目。`,
        availability: "隨時可用",
        unavailable: false,
      },
      {
        id: "skill",
        label: companion.skillName,
        badge: "課綱增幅",
        detail: `先答題；答錯仍造成 ${skillMissDamage} 點，答對至少造成 ${skillCorrectDamage} 點。`,
        availability: battle.energy >= skillCost ? `需要 ${skillCost} 能量與 1 題課綱題` : `尚需 ${skillCost - battle.energy} 能量`,
        unavailable: battle.energy < skillCost,
      },
      {
        id: "ultimate",
        label: ultimateLabel,
        badge: "策略突破",
        detail: `先答題；答錯仍造成 ${ultimateMissDamage} 點，答對至少造成 ${ultimateCorrectDamage} 點。`,
        availability: battle.ultimateUsed ? "本場已施放" : battle.energy >= ultimateCost ? `需要 ${ultimateCost} 能量與 1 題課綱題` : `尚需 ${ultimateCost - battle.energy} 能量`,
        unavailable: battle.ultimateUsed || battle.energy < ultimateCost,
      },
    ],
  };
}
