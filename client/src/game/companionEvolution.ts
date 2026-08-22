import type { Companion } from "./rpgTypes";

export type PassiveSkillId = "study-focus" | "shield-memory" | "capture-instinct" | "streak-surge";

export type EvolutionStage = {
  stage: number;
  title: string;
  appearanceClass: string;
  appearanceLabel: string;
  requiredEnergy: number;
  passiveSkillIds: PassiveSkillId[];
  passiveLabels: string[];
};

const STAGES: Record<string, EvolutionStage[]> = {
  "tide-scout": [
    { stage: 1, title: "潮芽獸", appearanceClass: "form-tide-scout", appearanceLabel: "潮汐初芽", requiredEnergy: 0, passiveSkillIds: [], passiveLabels: [] },
    { stage: 2, title: "潮光探勘獸", appearanceClass: "form-tide-glow", appearanceLabel: "潮光探勘形", requiredEnergy: 12, passiveSkillIds: ["study-focus"], passiveLabels: ["答對時攻擊力 +2"] },
    { stage: 3, title: "星潮領航獸", appearanceClass: "form-star-tide", appearanceLabel: "星潮領航形", requiredEnergy: 30, passiveSkillIds: ["study-focus", "streak-surge"], passiveLabels: ["答對時攻擊力 +2", "連續答對時終極技能傷害 +3"] },
  ],
  "ember-guard": [
    { stage: 1, title: "焰甲衛", appearanceClass: "form-ember-guard", appearanceLabel: "火種裝甲形", requiredEnergy: 0, passiveSkillIds: [], passiveLabels: [] },
    { stage: 2, title: "焰核守衛", appearanceClass: "form-ember-core", appearanceLabel: "焰核強化形", requiredEnergy: 16, passiveSkillIds: ["shield-memory"], passiveLabels: ["答錯時防禦力 +2"] },
    { stage: 3, title: "曙焰鎧王", appearanceClass: "form-dawn-armor", appearanceLabel: "曙焰鎧王形", requiredEnergy: 36, passiveSkillIds: ["shield-memory", "streak-surge"], passiveLabels: ["答錯時防禦力 +2", "連續答對時終極技能傷害 +3"] },
  ],
  "star-runner": [
    { stage: 1, title: "星浪行者", appearanceClass: "form-star-runner", appearanceLabel: "星軌行者形", requiredEnergy: 0, passiveSkillIds: [], passiveLabels: [] },
    { stage: 2, title: "星環行者", appearanceClass: "form-star-ring", appearanceLabel: "星環巡航形", requiredEnergy: 18, passiveSkillIds: ["capture-instinct"], passiveLabels: ["捕捉成功率 +8%"] },
    { stage: 3, title: "天穹星引者", appearanceClass: "form-sky-guide", appearanceLabel: "天穹引路形", requiredEnergy: 40, passiveSkillIds: ["capture-instinct", "study-focus"], passiveLabels: ["捕捉成功率 +8%", "答對時攻擊力 +2"] },
  ],
  "milk-dragonling": [
    { stage: 1, title: "奶泡龍崽", appearanceClass: "form-milk-dragonling", appearanceLabel: "泡泡幼龍形", requiredEnergy: 0, passiveSkillIds: [], passiveLabels: [] },
    { stage: 2, title: "奶雲小龍", appearanceClass: "form-milk-cloud", appearanceLabel: "奶雲活力形", requiredEnergy: 20, passiveSkillIds: ["study-focus"], passiveLabels: ["答對時攻擊力 +2"] },
    { stage: 3, title: "彩虹奶龍王", appearanceClass: "form-rainbow-dragon", appearanceLabel: "彩虹歡樂形", requiredEnergy: 44, passiveSkillIds: ["study-focus", "capture-instinct"], passiveLabels: ["答對時攻擊力 +2", "捕捉成功率 +8%"] },
  ],
};

export function evolutionStagesFor(companion: Companion): EvolutionStage[] {
  return STAGES[companion.id] ?? STAGES["tide-scout"];
}

export function evolutionStageFor(companion: Companion): EvolutionStage {
  const stages = evolutionStagesFor(companion);
  return stages[Math.max(0, Math.min((companion.evolutionStage ?? 1) - 1, stages.length - 1))];
}

export function nextEvolutionFor(companion: Companion): EvolutionStage | null {
  const stages = evolutionStagesFor(companion);
  return stages[(companion.evolutionStage ?? 1)] ?? null;
}

export function canEvolve(companion: Companion, availableEnergy: number): boolean {
  const next = nextEvolutionFor(companion);
  return Boolean(next && availableEnergy >= next.requiredEnergy);
}

export function evolveCompanion(companion: Companion, availableEnergy: number): { companion: Companion; energy: number; stage: EvolutionStage } | null {
  const next = nextEvolutionFor(companion);
  if (!next || availableEnergy < next.requiredEnergy) return null;
  return {
    energy: availableEnergy - next.requiredEnergy,
    stage: next,
    companion: { ...companion, name: next.title, evolutionStage: next.stage, passiveSkillIds: next.passiveSkillIds, appearanceClass: next.appearanceClass },
  };
}

export function normalizeCompanionEvolution(companion: Companion): Companion {
  const stage = evolutionStageFor(companion);
  return { ...companion, evolutionStage: stage.stage, passiveSkillIds: stage.passiveSkillIds, appearanceClass: stage.appearanceClass };
}
