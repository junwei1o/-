import type { Companion, Encounter, RpgState } from "./rpgTypes";

export type ArenaCaptureOutcome = {
  attempted: boolean;
  success: boolean;
  chance: number;
  correct: boolean;
};

export type ArenaLoot = {
  coins: number;
  energy: number;
  affection: number;
  companionAdded: boolean;
  duplicateSample: boolean;
  lines: string[];
};

export const capturedCompanionId = (encounterId: string) => `arena-${encounterId}`;

export function resolveArenaCapture(input: { chance: number; correct: boolean; roll?: number }): ArenaCaptureOutcome {
  const chance = Math.max(0, Math.min(95, Math.round(input.chance)));
  const roll = input.roll ?? Math.random();
  return { attempted: true, success: roll * 100 < chance, chance, correct: input.correct };
}

export function companionFromEncounter(encounter: Encounter): Companion {
  const level = Math.max(1, encounter.level);
  const hp = 28 + level * 8;
  return {
    id: capturedCompanionId(encounter.id),
    name: encounter.name,
    epithet: `在${encounter.region === "north" ? "北境潮汐林" : encounter.region === "central" ? "中央雲嶺" : encounter.region === "east" ? "東岸星谷" : "南方珊瑚灣"}相遇的原創觀測夥伴`,
    region: encounter.region,
    rarity: level >= 3 ? "rare" : "common",
    level,
    xp: 0,
    hp,
    maxHp: hp,
    energyPower: 7 + level * 2,
    defense: 2 + level,
    dialogue: ["我會記住這次觀察的線索。", "一起用問題找到下一條路吧。"],
    skillName: "觀測光環",
    skillCost: Math.max(3, level + 2),
    accent: encounter.accent,
    affection: 0,
    trainingPoints: 0,
    personality: "觀察家",
    equippedSkillIds: [],
    passiveSkillIds: [],
    achievementIds: [],
    trainingLog: [],
  };
}

export function settleArenaLoot(state: RpgState, encounter: Encounter, capture: ArenaCaptureOutcome): { state: RpgState; loot: ArenaLoot } {
  const duplicateSample = capture.success && state.companions.some((companion) => companion.id === capturedCompanionId(encounter.id));
  const companionAdded = capture.success && !duplicateSample;
  const coins = 5 + encounter.level * 2 + (capture.success ? 3 : 0) + (duplicateSample ? 2 : 0);
  const energy = 2 + (capture.correct ? 1 : 0);
  const affection = capture.success ? 3 : 1;
  const active = state.companions.find((companion) => companion.id === state.activeCompanionId);
  const companions = state.companions
    .map((companion) => companion.id === active?.id ? { ...companion, affection: Math.min(100, (companion.affection ?? 0) + affection) } : companion)
    .concat(companionAdded ? [companionFromEncounter(encounter)] : []);
  const captureLine = companionAdded
    ? `${encounter.name} 已加入夥伴圖鑑。`
    : duplicateSample
      ? `${encounter.name} 的觀測資料已完整，轉換為額外樣本獎勵。`
      : "本次先記錄相遇線索；下次可用更穩定的答題表現再嘗試。";
  const loot: ArenaLoot = {
    coins,
    energy,
    affection,
    companionAdded,
    duplicateSample,
    lines: [`+${coins} 探險金幣`, `+${energy} 學習能量`, `目前夥伴親密度 +${affection}`, captureLine],
  };
  return {
    state: {
      ...state,
      coins: state.coins + coins,
      energy: Math.min(99, state.energy + energy),
      companions,
      notice: captureLine,
    },
    loot,
  };
}
