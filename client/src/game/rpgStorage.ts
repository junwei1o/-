import { COMPANION_CATALOG, STARTER_COMPANION } from "./rpgData";
import { hasRewardedEvent, rewardForAnswer } from "./rpgRewards";
import { normalizeCompanionEvolution } from "./companionEvolution";
import { growthForAnswer, normalizeCompanionGrowth, unlockGrowthAchievements } from "./companionGrowth";
import { academyRouteForSubject, gearForRoute } from "./academyQuestData";
import { academyDayKey } from "./academyDaily";
import { createAcademyOnboarding, recordAcademyOnboardingAnswer } from "./academyOnboarding";
import { defaultStoryProgress, normalizeStoryProgress, recordStoryAnswer } from "./academyStory";
import { applyRegionMissionAnswer, claimRegionMissionReward, defaultRegionMissionProgress, normalizeRegionMissionProgress } from "./regionMissionRewards";
import { defaultHabitatDailyProgress, normalizeHabitatDailyProgress, recordHabitatDailyAnswer } from "./habitatDailyMissions";
import { normalizeAnimeWorldviewProgress, recordAnimeWorldviewQuizResult as updateAnimeWorldviewProgress } from "./animeWorldviewProgress";
import { normalizeMapVictoryProgress } from "./mapVictoryProgress";
import { tryDropSpecialty } from "./inventoryService";
import type { AnimeWorldviewKey } from "@/lib/animeWorldviewQuiz";
import type { PlayerExpansionProgress, RegionKey, RpgState } from "./rpgTypes";

export const RPG_STORAGE_KEY = "xue-adventure-rpg-v1";

export const defaultExpansionProgress: PlayerExpansionProgress = {
  talentPoints: 0,
  talents: {},
  equippedGearIds: [],
  fragments: {},
  journalSummaries: [],
  activeWorldEvents: [],
  worldEventDayKey: "",
  worldEventsTriggeredToday: 0,
};

export const defaultRpgState: RpgState = {
  version: 1,
  growthVersion: 1,
  coins: 18,
  energy: 6,
  explored: ["north"],
  companions: [STARTER_COMPANION],
  activeCompanionId: STARTER_COMPANION.id,
  mode: "explore",
  currentRegion: "north",
  encounter: null,
  battle: null,
  answeredEventIds: [],
  academyProgress: {},
  academyGearIds: [],
  academyOnboarding: createAcademyOnboarding(),
  storyProgress: defaultStoryProgress(),
  regionMissionProgress: defaultRegionMissionProgress(),
  habitatDailyProgress: defaultHabitatDailyProgress(),
  animeWorldviewProgress: {},
  mapVictoryProgress: { unlockedRouteIds: [], supplyMarkerIds: [] },
  expansionProgress: structuredClone(defaultExpansionProgress),
  notice: "完成題目，就能把學習能量帶進島嶼冒險。",
};

function isValidState(value: unknown): value is RpgState {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RpgState>;
  return item.version === 1 && typeof item.coins === "number" && typeof item.energy === "number" && Array.isArray(item.explored) && Array.isArray(item.companions) && typeof item.activeCompanionId === "string" && Array.isArray(item.answeredEventIds);
}

export function loadRpgState(storage: Storage | Pick<Storage, "getItem"> = localStorage): RpgState {
  try {
    const raw = storage.getItem(RPG_STORAGE_KEY);
    if (!raw) return structuredClone(defaultRpgState);
    const parsed: unknown = JSON.parse(raw);
    if (!isValidState(parsed)) return structuredClone(defaultRpgState);
    const active = parsed.companions.find((companion) => companion.id === parsed.activeCompanionId);
    if (!active || parsed.coins < 0 || parsed.energy < 0) return structuredClone(defaultRpgState);
    return {
      ...structuredClone(defaultRpgState),
      ...parsed,
      companions: parsed.companions.map((companion) => normalizeCompanionGrowth(normalizeCompanionEvolution(companion))),
      mode: "explore",
      encounter: null,
      battle: null,
      storyProgress: normalizeStoryProgress(parsed.storyProgress),
      regionMissionProgress: normalizeRegionMissionProgress(parsed.regionMissionProgress),
      habitatDailyProgress: normalizeHabitatDailyProgress(parsed.habitatDailyProgress),
      animeWorldviewProgress: normalizeAnimeWorldviewProgress(parsed.animeWorldviewProgress),
      mapVictoryProgress: normalizeMapVictoryProgress(parsed.mapVictoryProgress),
      expansionProgress: {
        ...structuredClone(defaultExpansionProgress),
        ...(parsed.expansionProgress ?? {}),
        talents: { ...structuredClone(defaultExpansionProgress.talents), ...(parsed.expansionProgress?.talents ?? {}) },
        equippedGearIds: Array.isArray(parsed.expansionProgress?.equippedGearIds) ? parsed.expansionProgress.equippedGearIds : [],
        fragments: parsed.expansionProgress?.fragments && typeof parsed.expansionProgress.fragments === "object" ? parsed.expansionProgress.fragments : {},
        journalSummaries: Array.isArray(parsed.expansionProgress?.journalSummaries) ? parsed.expansionProgress.journalSummaries.slice(-30) : [],
        activeWorldEvents: Array.isArray(parsed.expansionProgress?.activeWorldEvents) ? parsed.expansionProgress.activeWorldEvents : [],
      },
    };
  } catch {
    return structuredClone(defaultRpgState);
  }
}

export function saveRpgState(state: RpgState, storage: Storage | Pick<Storage, "setItem"> = localStorage) {
  try {
    storage.setItem(RPG_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing and quota errors should not stop the learning game.
  }
}

export function recordAnimeWorldviewQuizResult(
  result: { entryKey: AnimeWorldviewKey; correct: number; total: number },
  storage: Storage = localStorage,
) {
  const current = loadRpgState(storage);
  const next: RpgState = {
    ...current,
    animeWorldviewProgress: updateAnimeWorldviewProgress(current.animeWorldviewProgress, result),
  };
  saveRpgState(next, storage);
  return next;
}

export function companionById(id: string) {
  return COMPANION_CATALOG.find((item) => item.id === id) ?? STARTER_COMPANION;
}

export function recordRpgAnswer(input: { eventId: string; correct: boolean; secondsLeft?: number; streak?: number; curriculumDomain?: string; difficulty?: string; subject?: string }, storage: Storage = localStorage) {
  const current = loadRpgState(storage);
  if (hasRewardedEvent(current.answeredEventIds, input.eventId)) return current;
  const storyResult = recordStoryAnswer(current, input);
  const storyState = storyResult.state;
  const reward = rewardForAnswer(input);
  const active = storyState.companions.find((companion) => companion.id === current.activeCompanionId);
  const grownActive = active ? growthForAnswer(active, { correct: input.correct, streak: input.streak, curriculumDomain: input.curriculumDomain }) : null;
  const correctAnswerCount = (storyState.correctAnswerCount ?? 0) + (input.correct ? 1 : 0);
  const domainAnswerCounts = input.correct && input.curriculumDomain ? { ...(storyState.domainAnswerCounts ?? {}), [input.curriculumDomain]: (storyState.domainAnswerCounts?.[input.curriculumDomain] ?? 0) + 1 } : (storyState.domainAnswerCounts ?? {});
  const challengeCorrectCount = (storyState.challengeCorrectCount ?? 0) + (input.correct && input.difficulty === "挑戰" ? 1 : 0);
  const route = academyRouteForSubject(input.subject);
  const todayKey = academyDayKey();
  const priorDaily = storyState.academyDaily?.dayKey === todayKey
    ? storyState.academyDaily
    : { dayKey: todayKey, correctAnswers: 0, rewarded: false };
  const dailyCorrectAnswers = Math.min(3, priorDaily.correctAnswers + (input.correct ? 1 : 0));
  const dailyJustCompleted = input.correct && !priorDaily.rewarded && dailyCorrectAnswers >= 3;
  const academyDaily = { ...priorDaily, correctAnswers: dailyCorrectAnswers, rewarded: priorDaily.rewarded || dailyJustCompleted };
  const onboardingResult = recordAcademyOnboardingAnswer(storyState.academyOnboarding, input);
  const onboardingReward = onboardingResult.justCompleted ? { energy: 2, coins: 2 } : { energy: 0, coins: 0 };
  const existingRouteProgress = route ? storyState.academyProgress?.[route.region] ?? { correctAnswers: 0, bossVictories: 0 } : null;
  const academyProgress = route && existingRouteProgress
    ? { ...(storyState.academyProgress ?? {}), [route.region]: { ...existingRouteProgress, correctAnswers: existingRouteProgress.correctAnswers + (input.correct ? 1 : 0) } }
    : storyState.academyProgress;
  const habitatDailyResult = recordHabitatDailyAnswer({ ...storyState, academyProgress }, input, todayKey);
  const achievementResult = grownActive ? unlockGrowthAchievements(grownActive, correctAnswerCount, input.curriculumDomain ? domainAnswerCounts[input.curriculumDomain] ?? 0 : 0, challengeCorrectCount > 0) : null;
  const finalCompanion = achievementResult?.companion ?? grownActive;
  const missionRegionCorrect = route ? academyProgress?.[route.region]?.correctAnswers ?? 0 : 0;
  const missionResult = applyRegionMissionAnswer({ progress: storyState.regionMissionProgress ?? {}, region: route?.region, correct: input.correct, regionCorrect: missionRegionCorrect, totalCorrect: correctAnswerCount });
  const nextBase: RpgState = { ...storyState, growthVersion: 1, correctAnswerCount, domainAnswerCounts, challengeCorrectCount, academyProgress, academyDaily, habitatDailyProgress: habitatDailyResult.progress, academyOnboarding: onboardingResult.onboarding, achievements: achievementResult?.unlocked.length ? [...(current.achievements ?? []), ...achievementResult.unlocked] : current.achievements, energy: Math.min(99, current.energy + reward.energy + (dailyJustCompleted ? 2 : 0) + onboardingReward.energy + (habitatDailyResult.completed?.rewardEnergy ?? 0)), coins: current.coins + reward.coins + (dailyJustCompleted ? 3 : 0) + onboardingReward.coins + (habitatDailyResult.completed?.rewardCoins ?? 0), companions: finalCompanion ? current.companions.map((companion) => companion.id === finalCompanion.id ? finalCompanion : companion) : current.companions, answeredEventIds: [...current.answeredEventIds, input.eventId], storyProgress: storyState.storyProgress, regionMissionProgress: missionResult.progress,
    notice: storyResult.completed.length ? `故事完成：${storyResult.completed.map((item) => item.title).join("、")}，可在遠征指揮桌領取獎勵。` : onboardingResult.justCompleted ? "初始定位完成！四科學習星圖已點亮，獲得 2 能量與 2 金幣。" : dailyJustCompleted && habitatDailyResult.completed ? `今日遠征與「${habitatDailyResult.completed.title}」都完成了！獲得額外學習補給。` : dailyJustCompleted ? "今日遠征完成！獲得 2 能量與 3 金幣。" : habitatDailyResult.completed ? `棲息地微任務「${habitatDailyResult.completed.title}」完成！獲得 ${habitatDailyResult.completed.rewardEnergy} 能量與 ${habitatDailyResult.completed.rewardCoins} 金幣。` : achievementResult?.unlocked.length ? `解鎖成就：${achievementResult.unlocked.map((item) => item.title).join("、")}` : missionResult.completed.length ? `區域任務完成：${missionResult.completed.map((item) => item.title).join("、")}` : reward.label };
  const next = missionResult.completed.reduce((state, mission) => claimRegionMissionReward(state, mission), nextBase);
  saveRpgState(next, storage);
  if (input.correct && correctAnswerCount > 0 && correctAnswerCount % 10 === 0) {
    tryDropSpecialty({
      source: "correct-answer-milestone",
      awardId: `correct-answer-milestone-${correctAnswerCount}`,
    }, storage);
  }
  return next;
}

export function completeAcademyBoss(current: RpgState, region: RegionKey): RpgState {
  const progress = current.academyProgress?.[region] ?? { correctAnswers: 0, bossVictories: 0 };
  const gear = gearForRoute(region);
  const alreadyEarned = (current.academyGearIds ?? []).includes(gear.id);
  const academyGearIds = alreadyEarned ? current.academyGearIds ?? [] : [...(current.academyGearIds ?? []), gear.id];
  return {
    ...current,
    academyProgress: { ...(current.academyProgress ?? {}), [region]: { ...progress, bossVictories: progress.bossVictories + 1 } },
    academyGearIds,
    energy: Math.min(99, current.energy + (alreadyEarned ? 2 : 5)),
    coins: current.coins + (alreadyEarned ? 4 : 10),
    notice: alreadyEarned ? `再次突破${gear.title}守門者，獲得額外能量與金幣。` : `獲得${gear.title}！它已加入遠征裝備，會在戰鬥中提供策略加成。`,
  };
}
