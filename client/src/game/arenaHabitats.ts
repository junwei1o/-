import type { RegionKey, RpgState } from "./rpgTypes";

export type ArenaHabitatKey = "tidal-grove" | "cloud-shelf" | "star-current" | "coral-shallows";

export type ArenaHabitat = {
  id: ArenaHabitatKey;
  region: RegionKey;
  name: string;
  description: string;
  unlockTarget: number;
  rareTarget: number;
  rareCondition: string;
  rareChance: number;
  commonEncounterId: string;
  rareEncounterId: string;
};

export type ArenaHabitatStatus = ArenaHabitat & {
  unlocked: boolean;
  regionCorrect: number;
  rareEligible: boolean;
  rareProgress: number;
  rareProgressLabel: string;
};

export const ARENA_HABITATS: readonly ArenaHabitat[] = [
  { id: "tidal-grove", region: "north", name: "潮汐苔林", description: "濕潤葉脈與潮聲交會的起始觀測地。", unlockTarget: 0, rareTarget: 5, rareCondition: "北境答對 5 題後，偶爾會出現稀有微光。", rareChance: 0.18, commonEncounterId: "moss-mote", rareEncounterId: "tide-wisp" },
  { id: "cloud-shelf", region: "central", name: "雲嶺岩棚", description: "循著風向與岩層線索，進行自然觀測。", unlockTarget: 3, rareTarget: 6, rareCondition: "中部答對 6 題且完成 1 次首領突破後，雲層會出現罕見剪影。", rareChance: 0.16, commonEncounterId: "cloud-shell", rareEncounterId: "ember-ibis" },
  { id: "star-current", region: "east", name: "星流灣口", description: "夜色水紋反射星光，適合推理方向與比例。", unlockTarget: 5, rareTarget: 8, rareCondition: "東岸答對 8 題且答對過 1 題挑戰題後，才能追到稀有星跡。", rareChance: 0.14, commonEncounterId: "star-fin", rareEncounterId: "orbit-koi" },
  { id: "coral-shallows", region: "south", name: "珊瑚淺灣", description: "潮間帶的合作訊號，會引導你辨識環境變化。", unlockTarget: 7, rareTarget: 10, rareCondition: "南方答對 10 題且累積 2 次首領突破後，可能遇見稀有守潮者。", rareChance: 0.12, commonEncounterId: "coral-sprout", rareEncounterId: "reef-warden" },
];

const regionCorrect = (state: RpgState, region: RegionKey) => state.academyProgress?.[region]?.correctAnswers ?? 0;

export function arenaHabitatStatus(habitat: ArenaHabitat, state: RpgState): ArenaHabitatStatus {
  const correct = regionCorrect(state, habitat.region);
  const unlocked = correct >= habitat.unlockTarget;
  const rareEligible = correct >= habitat.rareTarget;
  const rareProgress = Math.min(1, correct / habitat.rareTarget);
  const rareProgressLabel = unlocked ? `${correct} / ${habitat.rareTarget}` : `${correct} / ${habitat.unlockTarget}`;
  return { ...habitat, unlocked, regionCorrect: correct, rareEligible, rareProgress, rareProgressLabel };
}

export function arenaHabitatStatuses(state: RpgState) {
  return ARENA_HABITATS.map((habitat) => arenaHabitatStatus(habitat, state));
}
