import {
  claimDailySignIn,
  getDailySignIn,
  getLearningRecord,
  getPlayerData,
  hasSignedInToday,
  readStoredJson,
  updatePlayerData,
  writeStoredJson,
} from "../utils/storage";
import { loadRpgState, saveRpgState } from "./rpgStorage";

// 每日營地：每日簽到、每日任務、金幣商店、每週王。
// 金幣使用 PlayerData.gold；體力使用 RpgState.energy（答題戰鬥消耗）。

const DAILY_TASK_KEY = "xue-daily-tasks-v1";
const SHOP_PURCHASE_KEY = "xue-shop-purchases-v1";
const WEEKLY_BOSS_KEY = "xue-weekly-boss-v1";
const LUCKY_CHARM_KEY = "xue-lucky-charm-v1";

export function localDayKey(now = Date.now()): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ISO 週代碼（台灣週一為一週開始），例如 2025-W32。
export function localWeekKey(now = Date.now()): string {
  const d = new Date(now);
  const dayNum = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayNum + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstDayNum = (firstThursday.getDay() + 6) % 7;
  const week = 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + firstDayNum) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function isSameDay(timestamp: number, dayKey: string): boolean {
  return localDayKey(timestamp) === dayKey;
}

function isSameWeek(timestamp: number, weekKey: string): boolean {
  return localWeekKey(timestamp) === weekKey;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  rewardGold: number;
  claimed: boolean;
}

interface DailyTaskStore {
  dayKey: string;
  claimedIds: string[];
}

interface ShopStore {
  dayKey: string;
  counts: Record<string, number>;
  weekKey: string;
  charmBoughtThisWeek: boolean;
}

interface WeeklyBossStore {
  weekKey: string;
  claimed: boolean;
}

interface LuckyCharmStore {
  pending: boolean;
}

export const WEEKLY_BOSS_TARGET = 10;
export const WEEKLY_BOSS_STORAGE_KEY = WEEKLY_BOSS_KEY;

function readDailyTaskStore(dayKey: string): DailyTaskStore {
  const stored = readStoredJson<DailyTaskStore>(DAILY_TASK_KEY, { dayKey, claimedIds: [] });
  if (stored.dayKey !== dayKey) {
    return { dayKey, claimedIds: [] };
  }
  return stored;
}

function readShopStore(dayKey: string, weekKey: string): ShopStore {
  const stored = readStoredJson<ShopStore>(SHOP_PURCHASE_KEY, {
    dayKey,
    counts: {},
    weekKey,
    charmBoughtThisWeek: false,
  });
  return {
    dayKey: stored.dayKey === dayKey ? dayKey : dayKey,
    counts: stored.dayKey === dayKey ? stored.counts || {} : {},
    weekKey: stored.weekKey === weekKey ? weekKey : weekKey,
    charmBoughtThisWeek: stored.weekKey === weekKey ? Boolean(stored.charmBoughtThisWeek) : false,
  };
}

function readWeeklyBossStore(weekKey: string): WeeklyBossStore {
  const stored = readStoredJson<WeeklyBossStore>(WEEKLY_BOSS_KEY, { weekKey, claimed: false });
  return stored.weekKey === weekKey ? stored : { weekKey, claimed: false };
}

// 今日學習紀錄統計：答對數、作答數、目前連對數。
export function getTodayStats(now = Date.now()): { correct: number; total: number; streak: number; signedIn: boolean } {
  const dayKey = localDayKey(now);
  const records = getLearningRecord()
    .filter((record) => isSameDay(record.timestamp, dayKey))
    .sort((a, b) => a.timestamp - b.timestamp);
  let correct = 0;
  let streak = 0;
  for (const record of records) {
    if (record.isCorrect) {
      correct += 1;
      streak += 1;
    } else {
      streak = 0;
    }
  }
  const signIn = getDailySignIn();
  return { correct, total: records.length, streak, signedIn: hasSignedInToday(signIn, now) };
}

export function getDailyTasks(now = Date.now()): DailyTask[] {
  const dayKey = localDayKey(now);
  const stats = getTodayStats(now);
  const store = readDailyTaskStore(dayKey);
  const tasks: DailyTask[] = [
    {
      id: "signin",
      title: "完成每日簽到",
      description: "今天到營地登船打卡",
      icon: "📅",
      target: 1,
      progress: stats.signedIn ? 1 : 0,
      rewardGold: 5,
      claimed: store.claimedIds.indexOf("signin") >= 0,
    },
    {
      id: "correct3",
      title: "答對 3 題",
      description: "今天答對 3 個問題",
      icon: "🎯",
      target: 3,
      progress: Math.min(3, stats.correct),
      rewardGold: 10,
      claimed: store.claimedIds.indexOf("correct3") >= 0,
    },
    {
      id: "answer8",
      title: "完成 8 題作答",
      description: "今天完成 8 個問題",
      icon: "✏️",
      target: 8,
      progress: Math.min(8, stats.total),
      rewardGold: 8,
      claimed: store.claimedIds.indexOf("answer8") >= 0,
    },
    {
      id: "streak5",
      title: "連續答對 5 題",
      description: "維持連對 5 題的好手感",
      icon: "🔥",
      target: 5,
      progress: Math.min(5, stats.streak),
      rewardGold: 12,
      claimed: store.claimedIds.indexOf("streak5") >= 0,
    },
  ];
  return tasks;
}

export function claimTaskReward(taskId: string, now = Date.now()): { ok: boolean; message: string } {
  const tasks = getDailyTasks(now);
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    return { ok: false, message: "找不到這個任務" };
  }
  if (task.claimed) {
    return { ok: false, message: "獎勵已經領過了" };
  }
  if (task.progress < task.target) {
    return { ok: false, message: "任務還沒完成" };
  }
  const dayKey = localDayKey(now);
  const store = readDailyTaskStore(dayKey);
  store.claimedIds.push(taskId);
  writeStoredJson(DAILY_TASK_KEY, store);
  const player = getPlayerData();
  updatePlayerData({ gold: player.gold + task.rewardGold });
  return { ok: true, message: `獲得 ${task.rewardGold} 金幣！` };
}

export function performDailySignIn(now = Date.now()): { ok: boolean; message: string; streak: number; unlockedWeeklyTitle: boolean } {
  const result = claimDailySignIn(now);
  if (!result.claimed) {
    return { ok: false, message: "今天已經簽到過了，明天再回來", streak: result.signIn.streak, unlockedWeeklyTitle: false };
  }
  const message = result.unlockedWeeklyTitle
    ? `簽到成功！已連續 ${result.signIn.streak} 天，獲得「一週探險家」稱號！`
    : `簽到成功！已連續 ${result.signIn.streak} 天`;
  return { ok: true, message, streak: result.signIn.streak, unlockedWeeklyTitle: result.unlockedWeeklyTitle };
}

// 每週王：本週答對 10 題即可擊敗並領賞。
export function getWeeklyBoss(now = Date.now()): {
  weekKey: string;
  progress: number;
  target: number;
  defeated: boolean;
  claimed: boolean;
} {
  const weekKey = localWeekKey(now);
  const store = readWeeklyBossStore(weekKey);
  const correctThisWeek = getLearningRecord().filter(
    (record) => isSameWeek(record.timestamp, weekKey) && record.isCorrect,
  ).length;
  const progress = Math.min(WEEKLY_BOSS_TARGET, correctThisWeek);
  return { weekKey, progress, target: WEEKLY_BOSS_TARGET, defeated: progress >= WEEKLY_BOSS_TARGET, claimed: store.claimed };
}

export function claimWeeklyBossReward(now = Date.now()): { ok: boolean; message: string } {
  const boss = getWeeklyBoss(now);
  if (boss.claimed) {
    return { ok: false, message: "本週獎勵已經領過了" };
  }
  if (!boss.defeated) {
    return { ok: false, message: "本週王還沒被擊敗" };
  }
  writeStoredJson(WEEKLY_BOSS_KEY, { weekKey: boss.weekKey, claimed: true });
  const player = getPlayerData();
  updatePlayerData({ gold: player.gold + 40 });
  return { ok: true, message: "擊敗每週王！獲得 40 金幣" };
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  priceGold: number;
  dailyLimit: number;
  boughtToday: number;
  soldOut: boolean;
}

export function getShopItems(now = Date.now()): ShopItem[] {
  const dayKey = localDayKey(now);
  const weekKey = localWeekKey(now);
  const store = readShopStore(dayKey, weekKey);
  const charmPending = hasLuckyCharmPending();
  const fruitBought = store.counts["energy-fruit"] || 0;
  const feastBought = store.counts["energy-feast"] || 0;
  return [
    {
      id: "energy-fruit",
      name: "能量水果",
      description: "答題戰鬥體力 +3，出海更有勁",
      icon: "🍎",
      priceGold: 15,
      dailyLimit: 3,
      boughtToday: fruitBought,
      soldOut: fruitBought >= 3,
    },
    {
      id: "energy-feast",
      name: "船員活力餐",
      description: "答題戰鬥體力 +8，大補給",
      icon: "🍱",
      priceGold: 35,
      dailyLimit: 1,
      boughtToday: feastBought,
      soldOut: feastBought >= 1,
    },
    {
      id: "lucky-charm",
      name: "幸運護身符",
      description: "下次答題戰鬥開始時，怒氣直接 30 點",
      icon: "🍀",
      priceGold: 25,
      dailyLimit: 1,
      boughtToday: charmPending ? 1 : 0,
      soldOut: charmPending || store.charmBoughtThisWeek,
    },
  ];
}

export function buyShopItem(itemId: string, now = Date.now()): { ok: boolean; message: string } {
  const dayKey = localDayKey(now);
  const weekKey = localWeekKey(now);
  const store = readShopStore(dayKey, weekKey);
  const player = getPlayerData();
  const rpg = loadRpgState();

  if (itemId === "energy-fruit") {
    const bought = store.counts["energy-fruit"] || 0;
    if (bought >= 3) return { ok: false, message: "今天已經買 3 次了" };
    if (player.gold < 15) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["energy-fruit"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 15 });
    saveRpgState({ ...rpg, energy: Math.min(99, rpg.energy + 3) });
    return { ok: true, message: "買下能量水果！體力 +3" };
  }

  if (itemId === "energy-feast") {
    const bought = store.counts["energy-feast"] || 0;
    if (bought >= 1) return { ok: false, message: "今天已經買過活力餐了" };
    if (player.gold < 35) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["energy-feast"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 35 });
    saveRpgState({ ...rpg, energy: Math.min(99, rpg.energy + 8) });
    return { ok: true, message: "買下船員活力餐！體力 +8" };
  }

  if (itemId === "lucky-charm") {
    if (hasLuckyCharmPending()) return { ok: false, message: "護身符還放在背包裡，先去戰鬥吧" };
    if (store.charmBoughtThisWeek) return { ok: false, message: "這週已經買過護身符了" };
    if (player.gold < 25) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.charmBoughtThisWeek = true;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 25 });
    writeStoredJson(LUCKY_CHARM_KEY, { pending: true } as LuckyCharmStore);
    return { ok: true, message: "買下幸運護身符！下次戰鬥一開始怒氣 30 點" };
  }

  return { ok: false, message: "沒有這個商品" };
}

export function hasLuckyCharmPending(): boolean {
  const stored = readStoredJson<LuckyCharmStore>(LUCKY_CHARM_KEY, { pending: false });
  return Boolean(stored.pending);
}

// 答題戰鬥開始時呼叫：若有護身符則消耗並回傳 true。
export function consumeLuckyCharm(): boolean {
  if (!hasLuckyCharmPending()) return false;
  writeStoredJson(LUCKY_CHARM_KEY, { pending: false } as LuckyCharmStore);
  return true;
}
