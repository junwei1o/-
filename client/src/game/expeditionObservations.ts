import { arenaHabitatStatuses, type ArenaHabitatKey } from "./arenaHabitats";
import { REGION_LABELS } from "./rpgData";
import type { RegionKey, RpgState } from "./rpgTypes";

export type ExpeditionObservation = {
  habitatId: ArenaHabitatKey;
  habitatName: string;
  region: RegionKey;
  regionLabel: string;
  unlocked: boolean;
  correctAnswers: number;
  unlockTarget: number;
  progressPercent: number;
  companions: number;
  rareEligible: boolean;
  rareProgressLabel: string;
  nextStep: string;
};

const countRegionalCompanions = (state: RpgState, region: RegionKey) =>
  state.companions.filter((companion) => companion.region === region).length;

export function buildExpeditionObservations(state: RpgState): ExpeditionObservation[] {
  return arenaHabitatStatuses(state).map((habitat) => {
    const companions = countRegionalCompanions(state, habitat.region);
    const progressPercent = habitat.unlockTarget === 0
      ? 100
      : Math.min(100, Math.round((habitat.regionCorrect / habitat.unlockTarget) * 100));
    const remaining = Math.max(0, habitat.unlockTarget - habitat.regionCorrect);
    const nextStep = !habitat.unlocked
      ? `再答對 ${remaining} 題，即可開啟這段觀測路徑。`
      : companions === 0
        ? "棲息地已開啟；完成一場勝利後，可嘗試留下第一筆夥伴觀測。"
        : !habitat.rareEligible
          ? `已留下 ${companions} 位同行夥伴紀錄；${habitat.rareProgressLabel}。`
          : `已留下 ${companions} 位同行夥伴紀錄；稀有觀測訊號已就緒。`;
    return {
      habitatId: habitat.id,
      habitatName: habitat.name,
      region: habitat.region,
      regionLabel: REGION_LABELS[habitat.region],
      unlocked: habitat.unlocked,
      correctAnswers: habitat.regionCorrect,
      unlockTarget: habitat.unlockTarget,
      progressPercent,
      companions,
      rareEligible: habitat.rareEligible,
      rareProgressLabel: habitat.rareProgressLabel,
      nextStep,
    };
  });
}

export function currentExpeditionObservation(state: RpgState): ExpeditionObservation {
  const observations = buildExpeditionObservations(state);
  return observations.find((item) => item.habitatId === state.arenaHabitatId && item.unlocked)
    ?? observations.find((item) => item.unlocked)
    ?? observations[0];
}
