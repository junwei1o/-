import type { Companion, RegionKey, RpgState } from "./rpgTypes";
import { EXPEDITION_CHAPTERS, type ExpeditionChapterKey } from "./expeditionUnlocks";

export type RegionMission = {
  id: string;
  chapterKey: ExpeditionChapterKey;
  title: string;
  summary: string;
  targetCorrect: number;
  rewardAffection: number;
  rewardTrainingPoints: number;
  rewardCoins: number;
  rewardEnergy: number;
  regionKey?: RegionKey;
};

export type RegionMissionProgress = {
  correct: number;
  completed: boolean;
  claimed: boolean;
};

export const REGION_MISSIONS: readonly RegionMission[] = [
  { id: "mission-north-compass", chapterKey: "north", title: "北境羅盤校準", summary: "完成北境章節後，再用答題找回觀測站的正確方向。", targetCorrect: 3, rewardAffection: 5, rewardTrainingPoints: 2, rewardCoins: 6, rewardEnergy: 2, regionKey: "north" },
  { id: "mission-central-river", chapterKey: "central", title: "河谷水脈追蹤", summary: "沿著中部路線整理線索，讓夥伴學會從資料找規律。", targetCorrect: 3, rewardAffection: 5, rewardTrainingPoints: 2, rewardCoins: 6, rewardEnergy: 2, regionKey: "central" },
  { id: "mission-east-starlight", chapterKey: "east", title: "東岸星光測繪", summary: "在東岸章節解鎖後完成觀測題，替星海標出新的航線。", targetCorrect: 3, rewardAffection: 6, rewardTrainingPoints: 2, rewardCoins: 7, rewardEnergy: 2, regionKey: "east" },
  { id: "mission-south-tide", chapterKey: "south", title: "南方潮汐守望", summary: "用社會與自然情境題守護潮境，鍛鍊夥伴的守護策略。", targetCorrect: 3, rewardAffection: 6, rewardTrainingPoints: 3, rewardCoins: 7, rewardEnergy: 3, regionKey: "south" },
  { id: "mission-academy-bridge", chapterKey: "academy", title: "學苑航線接合", summary: "完成全域章節後串起四科航線，讓夥伴獲得綜合訓練。", targetCorrect: 4, rewardAffection: 8, rewardTrainingPoints: 4, rewardCoins: 10, rewardEnergy: 4 },
];

export function defaultRegionMissionProgress(): Record<string, RegionMissionProgress> {
  return {};
}

export function normalizeRegionMissionProgress(value: unknown): Record<string, RegionMissionProgress> {
  if (!value || typeof value !== "object") return defaultRegionMissionProgress();
  const source = value as Record<string, Partial<RegionMissionProgress>>;
  return Object.fromEntries(Object.entries(source).map(([id, item]) => [id, {
    correct: Math.max(0, Math.floor(Number(item?.correct) || 0)),
    completed: item?.completed === true,
    claimed: item?.claimed === true,
  }]));
}

export function missionForChapter(chapterKey: ExpeditionChapterKey) {
  return REGION_MISSIONS.find((mission) => mission.chapterKey === chapterKey);
}

export function chapterIsUnlocked(chapterKey: ExpeditionChapterKey, regionCorrect: number, totalCorrect: number) {
  const chapter = EXPEDITION_CHAPTERS.find((item) => item.key === chapterKey);
  if (!chapter) return false;
  return (chapter.regionKey ? regionCorrect : totalCorrect) >= chapter.unlockTarget;
}

export function applyRegionMissionAnswer(input: {
  progress: Record<string, RegionMissionProgress>;
  region?: RegionKey;
  correct: boolean;
  regionCorrect: number;
  totalCorrect: number;
}) {
  if (!input.correct) return { progress: normalizeRegionMissionProgress(input.progress), completed: [] as RegionMission[] };
  const next = normalizeRegionMissionProgress(input.progress);
  const completed: RegionMission[] = [];
  for (const mission of REGION_MISSIONS) {
    const relevant = mission.regionKey ? mission.regionKey === input.region : true;
    if (!relevant || !chapterIsUnlocked(mission.chapterKey, input.regionCorrect, input.totalCorrect)) continue;
    const current = next[mission.id] ?? { correct: 0, completed: false, claimed: false };
    if (current.completed) continue;
    const updated = { ...current, correct: Math.min(mission.targetCorrect, current.correct + 1) };
    if (updated.correct >= mission.targetCorrect) {
      updated.completed = true;
      completed.push(mission);
    }
    next[mission.id] = updated;
  }
  return { progress: next, completed };
}

export function claimRegionMissionReward(state: RpgState, mission: RegionMission): RpgState {
  const progress = normalizeRegionMissionProgress(state.regionMissionProgress);
  const current = progress[mission.id];
  if (!current?.completed || current.claimed) return { ...state, regionMissionProgress: progress };
  const companion = state.companions.find((item) => item.id === state.activeCompanionId);
  const grown = companion ? {
    ...companion,
    affection: Math.min(100, (companion.affection ?? 0) + mission.rewardAffection),
    trainingPoints: (companion.trainingPoints ?? 0) + mission.rewardTrainingPoints,
  } : null;
  progress[mission.id] = { ...current, claimed: true };
  return {
    ...state,
    regionMissionProgress: progress,
    companions: grown ? state.companions.map((item) => item.id === grown.id ? grown : item) : state.companions,
    coins: state.coins + mission.rewardCoins,
    energy: Math.min(99, state.energy + mission.rewardEnergy),
    notice: `完成「${mission.title}」，夥伴獲得 ${mission.rewardAffection} 親密度與 ${mission.rewardTrainingPoints} 訓練點。`,
  };
}
