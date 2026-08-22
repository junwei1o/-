import type { AcademySubject, RegionKey, RpgState } from "./rpgTypes";

export type StoryKind = "主線" | "支線" | "區域事件";
export type StoryQuest = {
  id: string;
  kind: StoryKind;
  title: string;
  summary: string;
  region: RegionKey;
  subject: AcademySubject;
  domain: string;
  targetCorrect: number;
  rewardEnergy: number;
  rewardCoins: number;
  unlocks?: string;
};

export const ACADEMY_STORY_QUESTS: StoryQuest[] = [
  { id: "story-star-map", kind: "主線", title: "修復學習星圖", summary: "沿著四科路徑收集理解光點，讓遠征地圖重新連線。", region: "north", subject: "數學", domain: "數與運算", targetCorrect: 5, rewardEnergy: 4, rewardCoins: 8, unlocks: "中央嶺地" },
  { id: "side-river-clues", kind: "支線", title: "溪谷線索簿", summary: "整理水流觀測資料，找出自然現象背後的規律。", region: "central", subject: "自然", domain: "自然科學探究", targetCorrect: 3, rewardEnergy: 2, rewardCoins: 5 },
  { id: "side-memory-lantern", kind: "支線", title: "記憶燈塔的故事", summary: "用語文理解與表達，替燈塔找回失落的敘事片段。", region: "east", subject: "國語", domain: "閱讀與理解", targetCorrect: 3, rewardEnergy: 2, rewardCoins: 5 },
  { id: "event-market-route", kind: "區域事件", title: "港口交換日", summary: "在社會生活情境中做出公平、合理的資源選擇。", region: "south", subject: "社會", domain: "公民與社會生活", targetCorrect: 2, rewardEnergy: 1, rewardCoins: 4, unlocks: "珊瑚港新路線" },
];

export type StoryProgress = {
  version: 1;
  correctByQuest: Record<string, number>;
  completedQuestIds: string[];
  claimedQuestIds: string[];
  eventFlags: string[];
};

export const defaultStoryProgress = (): StoryProgress => ({ version: 1, correctByQuest: {}, completedQuestIds: [], claimedQuestIds: [], eventFlags: [] });

export function normalizeStoryProgress(value: unknown): StoryProgress {
  if (!value || typeof value !== "object") return defaultStoryProgress();
  const item = value as Partial<StoryProgress>;
  return {
    version: 1,
    correctByQuest: item.correctByQuest && typeof item.correctByQuest === "object" ? item.correctByQuest : {},
    completedQuestIds: Array.isArray(item.completedQuestIds) ? item.completedQuestIds.filter((id): id is string => typeof id === "string") : [],
    claimedQuestIds: Array.isArray(item.claimedQuestIds) ? item.claimedQuestIds.filter((id): id is string => typeof id === "string") : [],
    eventFlags: Array.isArray(item.eventFlags) ? item.eventFlags.filter((id): id is string => typeof id === "string") : [],
  };
}

export function activeStoryQuests(region?: RegionKey) {
  return ACADEMY_STORY_QUESTS.filter((quest) => !region || quest.region === region);
}

export function storyQuestStatus(progress: StoryProgress, quest: StoryQuest) {
  const correct = progress.correctByQuest[quest.id] ?? 0;
  return { correct, target: quest.targetCorrect, complete: progress.completedQuestIds.includes(quest.id), claimed: progress.claimedQuestIds.includes(quest.id), percent: Math.min(100, Math.round((correct / quest.targetCorrect) * 100)) };
}

export function recordStoryAnswer(state: RpgState, input: { subject?: string; curriculumDomain?: string; correct: boolean }): { state: RpgState; completed: StoryQuest[] } {
  if (!input.correct) return { state, completed: [] };
  const previous = normalizeStoryProgress(state.storyProgress);
  const matched = ACADEMY_STORY_QUESTS.filter((quest) => quest.subject === input.subject && (!input.curriculumDomain || quest.domain === input.curriculumDomain));
  if (matched.length === 0) return { state: { ...state, storyProgress: previous }, completed: [] };
  const completed: StoryQuest[] = [];
  const correctByQuest = { ...previous.correctByQuest };
  const completedQuestIds = [...previous.completedQuestIds];
  for (const quest of matched) {
    const nextCorrect = Math.min(quest.targetCorrect, (correctByQuest[quest.id] ?? 0) + 1);
    correctByQuest[quest.id] = nextCorrect;
    if (nextCorrect >= quest.targetCorrect && !completedQuestIds.includes(quest.id)) { completedQuestIds.push(quest.id); completed.push(quest); }
  }
  const storyProgress = { ...previous, correctByQuest, completedQuestIds };
  return { state: { ...state, storyProgress }, completed };
}

export function calculateStoryReport(progress: StoryProgress = defaultStoryProgress()) {
  const normalized = normalizeStoryProgress(progress);
  const questStats = ACADEMY_STORY_QUESTS.map((quest) => ({ quest, ...storyQuestStatus(normalized, quest) }));
  const completed = questStats.filter((item) => item.complete).length;
  const claimed = questStats.filter((item) => item.claimed).length;
  const attempted = questStats.filter((item) => item.correct > 0).length;
  const totalTarget = ACADEMY_STORY_QUESTS.reduce((sum, quest) => sum + quest.targetCorrect, 0);
  const totalCorrect = ACADEMY_STORY_QUESTS.reduce((sum, quest) => sum + (normalized.correctByQuest[quest.id] ?? 0), 0);
  const byKind = (['主線', '支線', '區域事件'] as StoryKind[]).map((kind) => {
    const items = questStats.filter((item) => item.quest.kind === kind);
    return { kind, total: items.length, attempted: items.filter((item) => item.correct > 0).length, completed: items.filter((item) => item.complete).length, claimed: items.filter((item) => item.claimed).length };
  });
  const byDomain = Array.from(new Set(ACADEMY_STORY_QUESTS.map((quest) => quest.domain))).map((domain) => {
    const items = questStats.filter((item) => item.quest.domain === domain);
    const target = items.reduce((sum, item) => sum + item.target, 0);
    const correct = items.reduce((sum, item) => sum + item.correct, 0);
    return { domain, target, correct, percent: target ? Math.min(100, Math.round((correct / target) * 100)) : 0, completed: items.filter((item) => item.complete).length };
  });
  return { attempted, completed, claimed, total: ACADEMY_STORY_QUESTS.length, totalTarget, totalCorrect, percent: totalTarget ? Math.min(100, Math.round((totalCorrect / totalTarget) * 100)) : 0, byKind, byDomain, questStats, eventFlags: normalized.eventFlags };
}

export function claimStoryQuest(state: RpgState, questId: string): RpgState {
  const progress = normalizeStoryProgress(state.storyProgress);
  const quest = ACADEMY_STORY_QUESTS.find((item) => item.id === questId);
  if (!quest || !progress.completedQuestIds.includes(questId) || progress.claimedQuestIds.includes(questId)) return { ...state, storyProgress: progress };
  const claimedQuestIds = [...progress.claimedQuestIds, questId];
  const eventFlags = quest.unlocks && !progress.eventFlags.includes(quest.unlocks) ? [...progress.eventFlags, quest.unlocks] : progress.eventFlags;
  return { ...state, storyProgress: { ...progress, claimedQuestIds, eventFlags }, energy: Math.min(99, state.energy + quest.rewardEnergy), coins: state.coins + quest.rewardCoins, notice: `完成「${quest.title}」，獲得 ${quest.rewardEnergy} 能量與 ${quest.rewardCoins} 金幣。` };
}
