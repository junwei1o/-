/**
 * 琵琶夥伴系統 v4 — 派任務＋套裝衣櫥＋事件匯流排
 * 靈感：WorkBuddy 貓派任務。每日任務 → 真實學習進度 → 金幣／好感度獎勵 → 套裝解鎖。
 * 純邏輯模組：不碰 React；storage 可注入以便測試。
 */

export type PipiEventType = "answer-correct" | "game-complete" | "map-visit" | "weekly-quiz";

export type PipiQuestDef = {
  id: string;
  title: string;
  emoji: string;
  desc: string;
  event: PipiEventType;
  target: number;
  rewardCoins: number;
  rewardAffection: number;
};

export type PipiCostumeSlot = "hat" | "face" | "neck" | "back";

export type PipiCostumeDef = {
  id: string;
  name: string;
  emoji: string;
  slot: PipiCostumeSlot;
  desc: string;
  unlock: { kind: "affection" | "count" | "quests"; value: number };
  unlockText: string;
};

export type PipiCompanionStats = { affection: number; count: number; questsClaimed: number };

export type PipiQuestState = {
  date: string;
  questIds: string[];
  progress: Record<string, number>;
  claimed: string[];
  claimedTotal: number;
};

export type PipiQuestReward = { questId: string; rewardCoins: number; rewardAffection: number };

export const PIPI_QUEST_EVENT = "pipi-quest";
const QUEST_STORAGE_KEY = "pipi-quests-v1";
const WORN_STORAGE_KEY = "pipi-worn";
const DAILY_QUEST_COUNT = 3;

/** 任務池：每日依日期種子隨機挑 3 個。 */
export const PIPI_QUEST_POOL: PipiQuestDef[] = [
  { id: "answer5", title: "暖身答題", emoji: "✏️", desc: "答對 5 道題目", event: "answer-correct", target: 5, rewardCoins: 15, rewardAffection: 10 },
  { id: "answer10", title: "答題小達人", emoji: "📚", desc: "答對 10 道題目", event: "answer-correct", target: 10, rewardCoins: 30, rewardAffection: 20 },
  { id: "game1", title: "教室初體驗", emoji: "🎮", desc: "完成 1 場教室遊戲", event: "game-complete", target: 1, rewardCoins: 10, rewardAffection: 8 },
  { id: "game2", title: "遊戲雙響炮", emoji: "🕹️", desc: "完成 2 場教室遊戲", event: "game-complete", target: 2, rewardCoins: 25, rewardAffection: 15 },
  { id: "map1", title: "出發探險", emoji: "🧭", desc: "在地圖點看 1 個地標", event: "map-visit", target: 1, rewardCoins: 8, rewardAffection: 5 },
  { id: "map3", title: "環島偵察", emoji: "🗺️", desc: "在地圖點看 3 個地標", event: "map-visit", target: 3, rewardCoins: 20, rewardAffection: 12 },
  { id: "weekly1", title: "週測挑戰", emoji: "🏆", desc: "完成一次本週週測", event: "weekly-quiz", target: 1, rewardCoins: 40, rewardAffection: 25 },
];

/** 套裝衣櫥：解鎖條件綁好感度／互動次數／任務完成數。 */
export const PIPI_COSTUMES: PipiCostumeDef[] = [
  { id: "grad-hat", name: "學士帽", emoji: "🎓", slot: "hat", desc: "知識就是力量嘎！", unlock: { kind: "affection", value: 50 }, unlockText: "好感度達 50" },
  { id: "fish-necklace", name: "小魚項鍊", emoji: "🐟", slot: "neck", desc: "最重要的寶物。", unlock: { kind: "affection", value: 120 }, unlockText: "好感度達 120" },
  { id: "sunglasses", name: "帥氣墨鏡", emoji: "🕶️", slot: "face", desc: "偵探琵琶上線。", unlock: { kind: "count", value: 40 }, unlockText: "互動 40 次" },
  { id: "telescope", name: "探險望遠鏡", emoji: "🔭", slot: "back", desc: "看得更遠、飛得更穩。", unlock: { kind: "quests", value: 3 }, unlockText: "完成 3 個任務" },
  { id: "party-hat", name: "慶祝尖帽", emoji: "🎉", slot: "hat", desc: "天天都是派對！", unlock: { kind: "quests", value: 7 }, unlockText: "完成 7 個任務" },
  { id: "scarf", name: "保溫圍巾", emoji: "🧣", slot: "neck", desc: "度冬飛行不著涼。", unlock: { kind: "affection", value: 250 }, unlockText: "好感度達 250" },
];

export function costumeById(id: string): PipiCostumeDef | undefined {
  return PIPI_COSTUMES.find((c) => c.id === id);
}

export function questById(id: string): PipiQuestDef | undefined {
  return PIPI_QUEST_POOL.find((q) => q.id === id);
}

export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 依日期種子確定性洗牌選每日任務（同一天永遠同一組）。 */
export function selectDailyQuests(dateKey: string): PipiQuestDef[] {
  let seed = 0;
  for (let i = 0; i < dateKey.length; i++) seed = (seed * 31 + dateKey.charCodeAt(i)) % 2147483647;
  const lcg = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
  const pool = [...PIPI_QUEST_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, DAILY_QUEST_COUNT);
}

function emptyQuestState(dateKey: string): PipiQuestState {
  return { date: dateKey, questIds: selectDailyQuests(dateKey).map((q) => q.id), progress: {}, claimed: [], claimedTotal: 0 };
}

function normalizeQuestState(raw: unknown, dateKey: string): PipiQuestState {
  if (!raw || typeof raw !== "object") return emptyQuestState(dateKey);
  const item = raw as Partial<PipiQuestState>;
  if (item.date !== dateKey || !Array.isArray(item.questIds)) return emptyQuestState(dateKey);
  return {
    date: dateKey,
    questIds: item.questIds.filter((id): id is string => typeof id === "string" && Boolean(questById(id))),
    progress: item.progress && typeof item.progress === "object" ? item.progress : {},
    claimed: Array.isArray(item.claimed) ? item.claimed.filter((id) => typeof id === "string") : [],
    claimedTotal: typeof item.claimedTotal === "number" ? item.claimedTotal : 0,
  };
}

export function loadQuestState(storage: Pick<Storage, "getItem"> | null = typeof localStorage === "undefined" ? null : localStorage): PipiQuestState {
  const dateKey = todayKey();
  try {
    const raw = storage?.getItem(QUEST_STORAGE_KEY);
    if (!raw) return emptyQuestState(dateKey);
    return normalizeQuestState(JSON.parse(raw), dateKey);
  } catch {
    return emptyQuestState(dateKey);
  }
}

function saveQuestState(state: PipiQuestState, storage: Pick<Storage, "setItem"> | null) {
  try { storage?.setItem(QUEST_STORAGE_KEY, JSON.stringify(state)); } catch { /* 忽略 */ }
}

export function getTodayQuests(state: PipiQuestState): PipiQuestDef[] {
  return state.questIds.map((id) => questById(id)).filter((q): q is PipiQuestDef => Boolean(q));
}

export function claimableQuests(state: PipiQuestState): PipiQuestDef[] {
  return getTodayQuests(state).filter((q) => !state.claimed.includes(q.id) && (state.progress[q.id] ?? 0) >= q.target);
}

type PipiQuestEventDetail = { state: PipiQuestState; completed: PipiQuestDef[] };

function dispatchQuestEvent(detail: PipiQuestEventDetail) {
  if (typeof window !== "undefined" && typeof window.CustomEvent === "function") {
    window.dispatchEvent(new CustomEvent<PipiQuestEventDetail>(PIPI_QUEST_EVENT, { detail }));
  }
}

/**
 * 記錄一次學習事件，推進今日任務進度。
 * 回傳本次剛好達標（完成）的任務，並廣播 pipi-quest 事件給琵琶寵物。
 */
export function recordPipiEvent(
  event: PipiEventType,
  amount = 1,
  storage: Storage | null = typeof localStorage === "undefined" ? null : localStorage,
): PipiQuestEventDetail {
  const state = loadQuestState(storage);
  const completed: PipiQuestDef[] = [];
  for (const q of getTodayQuests(state)) {
    if (q.event !== event) continue;
    const before = state.progress[q.id] ?? 0;
    if (before >= q.target) continue;
    const after = Math.min(q.target, before + Math.max(1, amount));
    state.progress[q.id] = after;
    if (after >= q.target) completed.push(q);
  }
  saveQuestState(state, storage);
  const detail: PipiQuestEventDetail = { state, completed };
  dispatchQuestEvent(detail);
  return detail;
}

/** 領取任務獎勵：標記已領、累計完成數。回傳獎勵內容；不可領回傳 null。 */
export function claimPipiQuest(
  questId: string,
  storage: Storage | null = typeof localStorage === "undefined" ? null : localStorage,
): PipiQuestReward | null {
  const state = loadQuestState(storage);
  const q = questById(questId);
  if (!q || !state.questIds.includes(questId) || state.claimed.includes(questId)) return null;
  if ((state.progress[questId] ?? 0) < q.target) return null;
  state.claimed.push(questId);
  state.claimedTotal += 1;
  saveQuestState(state, storage);
  const reward: PipiQuestReward = { questId, rewardCoins: q.rewardCoins, rewardAffection: q.rewardAffection };
  dispatchQuestEvent({ state, completed: [] });
  return reward;
}

/** 解鎖判斷：依好感度／互動次數／任務完成數。 */
export function isCostumeUnlocked(costume: PipiCostumeDef, stats: PipiCompanionStats): boolean {
  const actual = costume.unlock.kind === "affection" ? stats.affection : costume.unlock.kind === "count" ? stats.count : stats.questsClaimed;
  return actual >= costume.unlock.value;
}

export function unlockedCostumeIds(stats: PipiCompanionStats): string[] {
  return PIPI_COSTUMES.filter((c) => isCostumeUnlocked(c, stats)).map((c) => c.id);
}

export function loadWornCostumes(storage: Pick<Storage, "getItem"> | null = typeof localStorage === "undefined" ? null : localStorage): string[] {
  try {
    const raw = storage?.getItem(WORN_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && Boolean(costumeById(id)));
  } catch {
    return [];
  }
}

export function saveWornCostumes(worn: string[], storage: Pick<Storage, "setItem"> | null = typeof localStorage === "undefined" ? null : localStorage) {
  try { storage?.setItem(WORN_STORAGE_KEY, JSON.stringify(worn)); } catch { /* 忽略 */ }
}
