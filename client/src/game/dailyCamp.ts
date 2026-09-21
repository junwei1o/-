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

// 每日營地：每日簽到、每日任務、金幣商店。
// 金幣使用 PlayerData.gold；體力使用 RpgState.energy（答題冒險消耗）。

const DAILY_TASK_KEY = "xue-daily-tasks-v1";
const SHOP_PURCHASE_KEY = "xue-shop-purchases-v1";
const STREAK_BOOSTER_KEY = "xue-streak-booster-v1";
const WISDOM_PEARL_KEY = "xue-wisdom-pearl-v1";
const LUCKY_COIN_KEY = "xue-lucky-coin-v1";

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
}

interface PendingCounterStore {
  remaining: number;
}

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
  const distinctSubjects = new Set(
    getLearningRecord()
      .filter((record) => isSameDay(record.timestamp, dayKey))
      .map((record) => record.subject),
  ).size;
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
    {
      id: "answer15",
      title: "完成 15 題",
      description: "今天完成 15 個問題",
      icon: "📚",
      target: 15,
      progress: Math.min(15, stats.total),
      rewardGold: 25,
      claimed: store.claimedIds.indexOf("answer15") >= 0,
    },
    {
      id: "correct10",
      title: "答對 10 題",
      description: "今天答對 10 個問題",
      icon: "🏆",
      target: 10,
      progress: Math.min(10, stats.correct),
      rewardGold: 30,
      claimed: store.claimedIds.indexOf("correct10") >= 0,
    },
    {
      id: "streak3",
      title: "連續答對 3 題",
      description: "維持連對 3 題的好手感",
      icon: "⭐",
      target: 3,
      progress: Math.min(3, stats.streak),
      rewardGold: 15,
      claimed: store.claimedIds.indexOf("streak3") >= 0,
    },
    {
      id: "subject2",
      title: "完成 2 個不同科目",
      description: "今天完成 2 個不同科目的題目",
      icon: "🌈",
      target: 2,
      progress: Math.min(2, distinctSubjects),
      rewardGold: 20,
      claimed: store.claimedIds.indexOf("subject2") >= 0,
    },
    {
      id: "correct20",
      title: "答對 20 題",
      description: "今天答對 20 個問題",
      icon: "🎖️",
      target: 20,
      progress: Math.min(20, stats.correct),
      rewardGold: 35,
      claimed: store.claimedIds.indexOf("correct20") >= 0,
    },
    {
      id: "streak10",
      title: "連續答對 10 題",
      description: "維持連對 10 題的好手感",
      icon: "💎",
      target: 10,
      progress: Math.min(10, stats.streak),
      rewardGold: 40,
      claimed: store.claimedIds.indexOf("streak10") >= 0,
    },
    {
      id: "subject3",
      title: "完成 3 個不同科目",
      description: "今天完成 3 個不同科目的題目",
      icon: "🌐",
      target: 3,
      progress: Math.min(3, distinctSubjects),
      rewardGold: 30,
      claimed: store.claimedIds.indexOf("subject3") >= 0,
    },
    {
      id: "answer30",
      title: "完成 30 題作答",
      description: "今天完成 30 個問題",
      icon: "📖",
      target: 30,
      progress: Math.min(30, stats.total),
      rewardGold: 50,
      claimed: store.claimedIds.indexOf("answer30") >= 0,
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
  const streakBoosterRemaining = getStreakBoosterRemaining();
  const wisdomPearlRemaining = getWisdomPearlRemaining();
  const luckyCoinRemaining = getLuckyCoinRemaining();
  const fruitBought = store.counts["energy-fruit"] || 0;
  const feastBought = store.counts["energy-feast"] || 0;
  return [
    {
      id: "energy-fruit",
      name: "能量水果",
      description: "答題冒險體力 +3，出海更有勁",
      icon: "🍎",
      priceGold: 15,
      dailyLimit: 3,
      boughtToday: fruitBought,
      soldOut: fruitBought >= 3,
    },
    {
      id: "energy-feast",
      name: "船員活力餐",
      description: "答題冒險體力 +8，大補給",
      icon: "🍱",
      priceGold: 35,
      dailyLimit: 1,
      boughtToday: feastBought,
      soldOut: feastBought >= 1,
    },
    {
      id: "streak-booster",
      name: "連勝加速器",
      description: "連續答對時金幣翻倍持續 3 題",
      icon: "⚡",
      priceGold: 30,
      dailyLimit: 1,
      boughtToday: streakBoosterRemaining > 0 ? 1 : (store.counts["streak-booster"] || 0),
      soldOut: streakBoosterRemaining > 0 || (store.counts["streak-booster"] || 0) >= 1,
    },
    {
      id: "wisdom-pearl",
      name: "智慧珍珠",
      description: "答對經驗 +10%，持續 5 題",
      icon: "📿",
      priceGold: 30,
      dailyLimit: 1,
      boughtToday: wisdomPearlRemaining > 0 ? 1 : (store.counts["wisdom-pearl"] || 0),
      soldOut: wisdomPearlRemaining > 0 || (store.counts["wisdom-pearl"] || 0) >= 1,
    },
    {
      id: "lucky-coin",
      name: "幸運金幣",
      description: "答題金幣 +50%，持續 3 題",
      icon: "🪙",
      priceGold: 22,
      dailyLimit: 1,
      boughtToday: luckyCoinRemaining > 0 ? 1 : (store.counts["lucky-coin"] || 0),
      soldOut: luckyCoinRemaining > 0 || (store.counts["lucky-coin"] || 0) >= 1,
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

  if (itemId === "streak-booster") {
    if (getStreakBoosterRemaining() > 0) return { ok: false, message: "加速器還在作用中" };
    const bought = store.counts["streak-booster"] || 0;
    if (bought >= 1) return { ok: false, message: "今天已經買過連勝加速器了" };
    if (player.gold < 30) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["streak-booster"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 30 });
    writeStoredJson(STREAK_BOOSTER_KEY, { remaining: 3 } as PendingCounterStore);
    return { ok: true, message: "買下連勝加速器！連續答對金幣翻倍 3 題" };
  }

  if (itemId === "wisdom-pearl") {
    if (getWisdomPearlRemaining() > 0) return { ok: false, message: "珍珠還在作用中" };
    const bought = store.counts["wisdom-pearl"] || 0;
    if (bought >= 1) return { ok: false, message: "今天已經買過智慧珍珠了" };
    if (player.gold < 30) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["wisdom-pearl"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 30 });
    writeStoredJson(WISDOM_PEARL_KEY, { remaining: 5 } as PendingCounterStore);
    return { ok: true, message: "買下智慧珍珠！答對經驗 +10% 持續 5 題" };
  }

  if (itemId === "lucky-coin") {
    if (getLuckyCoinRemaining() > 0) return { ok: false, message: "金幣還在作用中" };
    const bought = store.counts["lucky-coin"] || 0;
    if (bought >= 1) return { ok: false, message: "今天已經買過幸運金幣了" };
    if (player.gold < 22) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["lucky-coin"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 22 });
    writeStoredJson(LUCKY_COIN_KEY, { remaining: 3 } as PendingCounterStore);
    return { ok: true, message: "買下幸運金幣！答題金幣 +50% 持續 3 題" };
  }

  return { ok: false, message: "沒有這個商品" };
}

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
  });
  return {
    dayKey: stored.dayKey === dayKey ? dayKey : dayKey,
    counts: stored.dayKey === dayKey ? stored.counts || {} : {},
    weekKey: stored.weekKey === weekKey ? weekKey : weekKey,
  };
}

// 連勝加速器：連續答對時金幣翻倍持續 3 題。
export function getStreakBoosterRemaining(): number {
  const stored = readStoredJson<PendingCounterStore>(STREAK_BOOSTER_KEY, { remaining: 0 });
  return Math.max(0, Math.floor(stored.remaining || 0));
}

export function consumeStreakBoosterTurn(): boolean {
  const remaining = getStreakBoosterRemaining();
  if (remaining <= 0) return false;
  writeStoredJson(STREAK_BOOSTER_KEY, { remaining: remaining - 1 } as PendingCounterStore);
  return true;
}

// 智慧珍珠：答對經驗 +10%，持續 5 題。
export function getWisdomPearlRemaining(): number {
  const stored = readStoredJson<PendingCounterStore>(WISDOM_PEARL_KEY, { remaining: 0 });
  return Math.max(0, Math.floor(stored.remaining || 0));
}

export function consumeWisdomPearlTurn(): boolean {
  const remaining = getWisdomPearlRemaining();
  if (remaining <= 0) return false;
  writeStoredJson(WISDOM_PEARL_KEY, { remaining: remaining - 1 } as PendingCounterStore);
  return true;
}

// 幸運金幣：答題金幣 +50%，持續 3 題。
export function getLuckyCoinRemaining(): number {
  const stored = readStoredJson<PendingCounterStore>(LUCKY_COIN_KEY, { remaining: 0 });
  return Math.max(0, Math.floor(stored.remaining || 0));
}

export function consumeLuckyCoinTurn(): boolean {
  const remaining = getLuckyCoinRemaining();
  if (remaining <= 0) return false;
  writeStoredJson(LUCKY_COIN_KEY, { remaining: remaining - 1 } as PendingCounterStore);
  return true;
}
