import { COMPANION_CATALOG, STARTER_COMPANION } from "./rpgData";
import { hasRewardedEvent, rewardForAnswer } from "./rpgRewards";
import { academyRouteForSubject } from "./academyQuestData";
import { academyDayKey } from "./academyDaily";
import { createAcademyOnboarding, recordAcademyOnboardingAnswer } from "./academyOnboarding";
import { defaultStoryProgress, normalizeStoryProgress, recordStoryAnswer } from "./academyStory";
import { applyRegionMissionAnswer, claimRegionMissionReward, defaultRegionMissionProgress, normalizeRegionMissionProgress } from "./regionMissionRewards";
import { defaultHabitatDailyProgress, normalizeHabitatDailyProgress, recordHabitatDailyAnswer } from "./habitatDailyMissions";
import { normalizeAnimeWorldviewProgress, recordAnimeWorldviewQuizResult as updateAnimeWorldviewProgress } from "./animeWorldviewProgress";
import { normalizeSafetyAcademyProgress, recordSafetyCardAnswer } from "./safetyAcademyProgress";
import { bxStore, type BxSubjectKey } from "./bxStore";
import { markDirty } from "./cloudSync";

/** 將站內中文科名對應到 BX 強化層的科目鍵。 */
function toBxSubject(subject?: string): BxSubjectKey {
  const s = subject ?? "";
  if (s.includes("國") || s.includes("語") || s.includes("中文")) return "chinese";
  if (s.includes("數")) return "math";
  if (s.includes("社")) return "social";
  return "science";
}
import { tryDropSpecialty } from "./inventoryService";
import type { AnimeWorldviewKey } from "@/lib/animeWorldviewQuiz";
import { SAFETY_QUIZ_REWARD_COINS, type SafetyCardKey } from "@/lib/safetyAcademy";
import type { RpgState } from "./rpgTypes";

export const RPG_STORAGE_KEY = "xue-adventure-rpg-v1";

export const defaultRpgState: RpgState = {
  version: 1,
  growthVersion: 1,
  coins: 18,
  energy: 6,
  explored: ["north"],
  companions: [STARTER_COMPANION],
  activeCompanionId: STARTER_COMPANION.id,
  currentRegion: "north",
  answeredEventIds: [],
  academyProgress: {},
  academyOnboarding: createAcademyOnboarding(),
  storyProgress: defaultStoryProgress(),
  regionMissionProgress: defaultRegionMissionProgress(),
  habitatDailyProgress: defaultHabitatDailyProgress(),
  animeWorldviewProgress: {},
  safetyAcademyProgress: {},
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
      companions: parsed.companions,
      storyProgress: normalizeStoryProgress(parsed.storyProgress),
      regionMissionProgress: normalizeRegionMissionProgress(parsed.regionMissionProgress),
      habitatDailyProgress: normalizeHabitatDailyProgress(parsed.habitatDailyProgress),
      animeWorldviewProgress: normalizeAnimeWorldviewProgress(parsed.animeWorldviewProgress),
      safetyAcademyProgress: normalizeSafetyAcademyProgress(parsed.safetyAcademyProgress),
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

/**
 * 生活安全學院作答：每張卡首次答對發放 SAFETY_QUIZ_REWARD_COINS 金幣，
 * 答錯可重試但不重複給幣。回傳最新狀態與本次是否發放獎勵，方便頁面顯示回饋。
 */
export function recordSafetyAcademyAnswer(
  result: { cardKey: SafetyCardKey; correct: boolean },
  storage: Storage | Pick<Storage, "getItem" | "setItem"> = localStorage,
): { state: RpgState; rewarded: boolean; rewardCoins: number } {
  const current = loadRpgState(storage);
  const { progress, justCompleted } = recordSafetyCardAnswer(current.safetyAcademyProgress, result);
  const rewardCoins = justCompleted ? SAFETY_QUIZ_REWARD_COINS : 0;
  const next: RpgState = {
    ...current,
    safetyAcademyProgress: progress,
    coins: current.coins + rewardCoins,
    notice: justCompleted
      ? `安全知識過關！獲得 ${rewardCoins} 金幣，可到每日營地商店運用。`
      : current.notice,
  };
  saveRpgState(next, storage);
  return { state: next, rewarded: justCompleted, rewardCoins };
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
  const existingRouteProgress = route ? storyState.academyProgress?.[route.region] ?? { correctAnswers: 0 } : null;
  const academyProgress = route && existingRouteProgress
    ? { ...(storyState.academyProgress ?? {}), [route.region]: { ...existingRouteProgress, correctAnswers: existingRouteProgress.correctAnswers + (input.correct ? 1 : 0) } }
    : storyState.academyProgress;
  const habitatDailyResult = recordHabitatDailyAnswer({ ...storyState, academyProgress }, input, todayKey);
  const missionRegionCorrect = route ? academyProgress?.[route.region]?.correctAnswers ?? 0 : 0;
  const missionResult = applyRegionMissionAnswer({ progress: storyState.regionMissionProgress ?? {}, region: route?.region, correct: input.correct, regionCorrect: missionRegionCorrect, totalCorrect: correctAnswerCount });
  const nextBase: RpgState = { ...storyState, growthVersion: 1, correctAnswerCount, domainAnswerCounts, challengeCorrectCount, academyProgress, academyDaily, habitatDailyProgress: habitatDailyResult.progress, academyOnboarding: onboardingResult.onboarding, energy: Math.min(99, current.energy + reward.energy + (dailyJustCompleted ? 2 : 0) + onboardingReward.energy + (habitatDailyResult.completed?.rewardEnergy ?? 0)), coins: current.coins + reward.coins + (dailyJustCompleted ? 3 : 0) + onboardingReward.coins + (habitatDailyResult.completed?.rewardCoins ?? 0), answeredEventIds: [...current.answeredEventIds, input.eventId], storyProgress: storyState.storyProgress, regionMissionProgress: missionResult.progress,
    notice: storyResult.completed.length ? `故事完成：${storyResult.completed.map((item) => item.title).join("、")}，可在遠征指揮桌領取獎勵。` : onboardingResult.justCompleted ? "初始定位完成！四科學習星圖已點亮，獲得 2 能量與 2 金幣。" : dailyJustCompleted && habitatDailyResult.completed ? `今日遠征與「${habitatDailyResult.completed.title}」都完成了！獲得額外學習補給。` : dailyJustCompleted ? "今日遠征完成！獲得 2 能量與 3 金幣。" : habitatDailyResult.completed ? `棲息地微任務「${habitatDailyResult.completed.title}」完成！獲得 ${habitatDailyResult.completed.rewardEnergy} 能量與 ${habitatDailyResult.completed.rewardCoins} 金幣。` : missionResult.completed.length ? `區域任務完成：${missionResult.completed.map((item) => item.title).join("、")}` : reward.label };
  const next = missionResult.completed.reduce((state, mission) => claimRegionMissionReward(state, mission), nextBase);
  saveRpgState(next, storage);
  // BX 強化層：記錄答題（連勝、第一盞燈、海難遺物、每日金幣上限、里程碑）。
  // 以 try/catch 包住，強化層任何例外都不得影響主遊戲存檔。
  try {
    bxStore.logAnswer({
      subject: toBxSubject(input.subject),
      topic: input.curriculumDomain || input.subject || "綜合",
      correct: !!input.correct,
      coinReward: reward.coins,
    });
  } catch {
    // 強化層失敗時靜默略過。
  }
  // 雲端船籍：雲端模式下標記進度已變更（5 秒防抖上傳）；非雲端模式為 no-op。
  try {
    markDirty();
  } catch {
    // 雲端同步失敗不得影響主遊戲存檔。
  }
  if (input.correct && correctAnswerCount > 0 && correctAnswerCount % 10 === 0) {
    tryDropSpecialty({
      source: "correct-answer-milestone",
      awardId: `correct-answer-milestone-${correctAnswerCount}`,
    }, storage);
  }
  return next;
}
