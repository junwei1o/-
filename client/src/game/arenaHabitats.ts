import { ENCOUNTERS } from "./rpgData";
import type { Encounter, RegionKey, RpgState } from "./rpgTypes";

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

const encounterById = (id: string) => ENCOUNTERS.find((encounter) => encounter.id === id) ?? ENCOUNTERS[0];

const regionCorrect = (state: RpgState, region: RegionKey) => state.academyProgress?.[region]?.correctAnswers ?? 0;
const bossVictories = (state: RpgState) => Object.values(state.academyProgress ?? {}).reduce((total, progress) => total + (progress?.bossVictories ?? 0), 0);

export function arenaHabitatStatus(habitat: ArenaHabitat, state: RpgState): ArenaHabitatStatus {
  const progress = regionCorrect(state, habitat.region);
  const common = { unlocked: progress >= habitat.unlockTarget, regionCorrect: progress };
  const rareEligible = progress >= habitat.rareTarget
    && (habitat.region === "central" ? bossVictories(state) >= 1 : habitat.region === "east" ? (state.challengeCorrectCount ?? 0) >= 1 : habitat.region === "south" ? bossVictories(state) >= 2 : true);
  const extraRequirement = habitat.region === "central" ? bossVictories(state) : habitat.region === "east" ? state.challengeCorrectCount ?? 0 : habitat.region === "south" ? bossVictories(state) : 0;
  const extraTarget = habitat.region === "central" || habitat.region === "east" ? 1 : habitat.region === "south" ? 2 : 0;
  const rareProgressLabel = extraTarget > 0
    ? `答對 ${Math.min(progress, habitat.rareTarget)}/${habitat.rareTarget} 題 · 額外條件 ${Math.min(extraRequirement, extraTarget)}/${extraTarget}`
    : `答對 ${Math.min(progress, habitat.rareTarget)}/${habitat.rareTarget} 題`;
  return { ...habitat, ...common, rareEligible, rareProgress: progress, rareProgressLabel };
}

export function arenaHabitatStatuses(state: RpgState) {
  return ARENA_HABITATS.map((habitat) => arenaHabitatStatus(habitat, state));
}

export function selectedArenaHabitat(state: RpgState) {
  const statuses = arenaHabitatStatuses(state);
  return statuses.find((habitat) => habitat.id === state.arenaHabitatId && habitat.unlocked) ?? statuses.find((habitat) => habitat.unlocked) ?? statuses[0];
}

export function selectArenaHabitat(state: RpgState, habitatId: ArenaHabitatKey): RpgState {
  const habitat = arenaHabitatStatuses(state).find((item) => item.id === habitatId);
  if (!habitat?.unlocked) return state;
  return {
    ...state,
    arenaHabitatId: habitat.id,
    currentRegion: habitat.region,
    explored: Array.from(new Set([...state.explored, habitat.region])),
    notice: `${habitat.name} 已設為本次觀測棲息地。`,
  };
}

export function encounterForArenaHabitat(state: RpgState, habitatId?: ArenaHabitatKey, roll = Math.random()): { habitat: ArenaHabitatStatus; encounter: Encounter; rare: boolean } {
  const chosen = arenaHabitatStatuses(state).find((item) => item.id === habitatId && item.unlocked) ?? selectedArenaHabitat(state);
  const rare = chosen.rareEligible && roll < chosen.rareChance;
  return { habitat: chosen, encounter: encounterById(rare ? chosen.rareEncounterId : chosen.commonEncounterId), rare };
}
