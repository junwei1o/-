import { academyDayKey } from "./academyDaily";
import { academyRouteFor, academyRouteForSubject } from "./academyQuestData";
import { ARENA_HABITATS, arenaHabitatStatus } from "./arenaHabitats";
import type { AcademySubject, ArenaHabitatKey, HabitatDailyProgress, RpgState } from "./rpgTypes";

export type HabitatDailyMission = {
  id: ArenaHabitatKey;
  region: "north" | "central" | "east" | "south";
  subject: AcademySubject;
  title: string;
  description: string;
  targetCorrectAnswers: number;
  rewardEnergy: number;
  rewardCoins: number;
  rewardLabel: string;
};

export type HabitatDailyMissionStatus = {
  mission: HabitatDailyMission;
  correctAnswers: number;
  completed: boolean;
  unlocked: boolean;
};

const MISSION_COPY: Record<ArenaHabitatKey, readonly [string, string][]> = {
  "tidal-grove": [["潮紋心算補給", "用數與運算線索校準潮位刻度。"], ["燈塔規律巡查", "找出數列與運算中的穩定規律。"]],
  "cloud-shelf": [["雲層觀察筆記", "以自然科學線索完成一次觀察紀錄。"], ["風向假設測試", "從現象與證據中選出合理解釋。"]],
  "star-current": [["星流地景判讀", "用社會領域線索讀懂人與環境的關係。"], ["航線時間拼圖", "整理地理與時間訊息，完成一段航線。"]],
  "coral-shallows": [["珊瑚篇章尋讀", "從國語文本中找出觀點與關鍵線索。"], ["潮灣詞語修復", "辨認語詞與語境，讓故事重新連起來。"]],
};

const MICRO_REWARD = { energy: 1, coins: 2 } as const;

function stableIndex(dayKey: string, habitatId: ArenaHabitatKey, length: number) {
  const value = Array.from(`${dayKey}:${habitatId}`).reduce((total, character) => total + character.charCodeAt(0), 0);
  return value % length;
}

export function defaultHabitatDailyProgress(): HabitatDailyProgress {
  return { dayKey: "", correctByHabitat: {}, completedHabitatIds: [] };
}

export function normalizeHabitatDailyProgress(value: unknown): HabitatDailyProgress {
  if (!value || typeof value !== "object") return defaultHabitatDailyProgress();
  const source = value as Partial<HabitatDailyProgress>;
  const correctByHabitat = Object.fromEntries(
    Object.entries(source.correctByHabitat ?? {})
      .filter(([id]) => ARENA_HABITATS.some((habitat) => habitat.id === id))
      .map(([id, correct]) => [id, Math.max(0, Math.min(2, Math.floor(Number(correct) || 0)))]),
  ) as Partial<Record<ArenaHabitatKey, number>>;
  const completedHabitatIds = Array.isArray(source.completedHabitatIds)
    ? source.completedHabitatIds.filter((id): id is ArenaHabitatKey => ARENA_HABITATS.some((habitat) => habitat.id === id))
    : [];
  return { dayKey: typeof source.dayKey === "string" ? source.dayKey : "", correctByHabitat, completedHabitatIds: Array.from(new Set(completedHabitatIds)) };
}

export function habitatDailyMissionFor(habitatId: ArenaHabitatKey, dayKey = academyDayKey()): HabitatDailyMission {
  const habitat = ARENA_HABITATS.find((item) => item.id === habitatId) ?? ARENA_HABITATS[0];
  const route = academyRouteFor(habitat.region);
  const [title, description] = MISSION_COPY[habitat.id][stableIndex(dayKey, habitat.id, MISSION_COPY[habitat.id].length)];
  return {
    id: habitat.id,
    region: habitat.region,
    subject: route.subject,
    title,
    description,
    targetCorrectAnswers: 2,
    rewardEnergy: MICRO_REWARD.energy,
    rewardCoins: MICRO_REWARD.coins,
    rewardLabel: `完成可獲 ${MICRO_REWARD.energy} 能量與 ${MICRO_REWARD.coins} 金幣`,
  };
}

function progressForDay(progress: HabitatDailyProgress | undefined, dayKey: string) {
  const normalized = normalizeHabitatDailyProgress(progress);
  return normalized.dayKey === dayKey ? normalized : { dayKey, correctByHabitat: {}, completedHabitatIds: [] };
}

export function habitatDailyStatuses(state: RpgState, dayKey = academyDayKey()): HabitatDailyMissionStatus[] {
  const progress = progressForDay(state.habitatDailyProgress, dayKey);
  return ARENA_HABITATS.map((habitat) => {
    const mission = habitatDailyMissionFor(habitat.id, dayKey);
    const correctAnswers = Math.min(mission.targetCorrectAnswers, progress.correctByHabitat[habitat.id] ?? 0);
    return {
      mission,
      correctAnswers,
      completed: progress.completedHabitatIds.includes(habitat.id) || correctAnswers >= mission.targetCorrectAnswers,
      unlocked: arenaHabitatStatus(habitat, state).unlocked,
    };
  });
}

export function activeHabitatDailyStatus(state: RpgState, dayKey = academyDayKey()) {
  const statuses = habitatDailyStatuses(state, dayKey);
  const selected = state.arenaHabitatId ? statuses.find((item) => item.mission.id === state.arenaHabitatId) : undefined;
  const currentRegion = statuses.find((item) => item.mission.region === state.currentRegion);
  return selected?.unlocked ? selected : currentRegion?.unlocked ? currentRegion : statuses.find((item) => item.unlocked) ?? null;
}

export function recordHabitatDailyAnswer(state: RpgState, input: { correct: boolean; subject?: string }, dayKey = academyDayKey()) {
  const progress = progressForDay(state.habitatDailyProgress, dayKey);
  if (!input.correct) return { progress, completed: null as HabitatDailyMission | null };
  const route = academyRouteForSubject(input.subject);
  const habitat = route ? ARENA_HABITATS.find((item) => item.region === route.region) : undefined;
  if (!habitat || !arenaHabitatStatus(habitat, state).unlocked) return { progress, completed: null as HabitatDailyMission | null };
  const mission = habitatDailyMissionFor(habitat.id, dayKey);
  const priorCorrect = progress.correctByHabitat[habitat.id] ?? 0;
  const alreadyCompleted = progress.completedHabitatIds.includes(habitat.id);
  if (alreadyCompleted) return { progress, completed: null as HabitatDailyMission | null };
  const correctAnswers = Math.min(mission.targetCorrectAnswers, priorCorrect + 1);
  const completed = correctAnswers >= mission.targetCorrectAnswers;
  return {
    progress: {
      ...progress,
      correctByHabitat: { ...progress.correctByHabitat, [habitat.id]: correctAnswers },
      completedHabitatIds: completed ? [...progress.completedHabitatIds, habitat.id] : progress.completedHabitatIds,
    },
    completed: completed ? mission : null,
  };
}
