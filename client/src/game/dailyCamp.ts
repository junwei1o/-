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
const STUDY_CHARM_KEY = "xue-study-charm-v1";
const EXP_SCROLL_KEY = "xue-exp-scroll-v1";
const STREAK_BOOSTER_KEY = "xue-streak-booster-v1";
const HINT_FEATHER_KEY = "xue-hint-feather-v1";
const SHIELD_BUBBLE_KEY = "xue-shield-bubble-v1";
const TREASURE_MAP_KEY = "xue-treasure-map-v1";
const REST_TEA_KEY = "xue-rest-tea-v1";
const WISDOM_PEARL_KEY = "xue-wisdom-pearl-v1";
const TIME_CRYSTAL_KEY = "xue-time-crystal-v1";
const BATTLE_BANNER_KEY = "xue-battle-banner-v1";
const LUCKY_COIN_KEY = "xue-lucky-coin-v1";
const REVIVE_FEATHER_KEY = "xue-revive-feather-v1";

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
  reviveFeatherBoughtThisWeek: boolean;
}

interface WeeklyBossStore {
  weekKey: string;
  claimed: boolean;
}

interface LuckyCharmStore {
  pending: boolean;
}

interface PendingFlagStore {
  pending: boolean;
}

interface PendingCounterStore {
  remaining: number;
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
    reviveFeatherBoughtThisWeek: false,
  });
  return {
    dayKey: stored.dayKey === dayKey ? dayKey : dayKey,
    counts: stored.dayKey === dayKey ? stored.counts || {} : {},
    weekKey: stored.weekKey === weekKey ? weekKey : weekKey,
    charmBoughtThisWeek: stored.weekKey === weekKey ? Boolean(stored.charmBoughtThisWeek) : false,
    reviveFeatherBoughtThisWeek: stored.weekKey === weekKey ? Boolean(stored.reviveFeatherBoughtThisWeek) : false,
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
  const studyCharmPending = hasStudyCharmPending();
  const expScrollPending = hasExpScrollPending();
  const streakBoosterRemaining = getStreakBoosterRemaining();
  const hintFeatherPending = hasHintFeatherPending();
  const shieldBubblePending = hasShieldBubblePending();
  const treasureMapRemaining = getTreasureMapRemaining();
  const restTeaPending = hasRestTeaPending();
  const wisdomPearlRemaining = getWisdomPearlRemaining();
  const timeCrystalPending = hasTimeCrystalPending();
  const battleBannerPending = hasBattleBannerPending();
  const luckyCoinRemaining = getLuckyCoinRemaining();
  const reviveFeatherPending = hasReviveFeatherPending();
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
    {
      id: "study-charm",
      name: "溫習護符",
      description: "降低下次答錯的傷害 50%",
      icon: "📖",
      priceGold: 20,
      dailyLimit: 1,
      boughtToday: studyCharmPending ? 1 : (store.counts["study-charm"] || 0),
      soldOut: studyCharmPending || (store.counts["study-charm"] || 0) >= 1,
    },
    {
      id: "exp-scroll",
      name: "經驗卷軸",
      description: "答對時額外獲得 5 經驗值",
      icon: "📜",
      priceGold: 15,
      dailyLimit: 1,
      boughtToday: expScrollPending ? 1 : (store.counts["exp-scroll"] || 0),
      soldOut: expScrollPending || (store.counts["exp-scroll"] || 0) >= 1,
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
      id: "hint-feather",
      name: "提示羽毛",
      description: "在戰鬥中獲得一次答題提示",
      icon: "🪶",
      priceGold: 12,
      dailyLimit: 1,
      boughtToday: hintFeatherPending ? 1 : (store.counts["hint-feather"] || 0),
      soldOut: hintFeatherPending || (store.counts["hint-feather"] || 0) >= 1,
    },
    {
      id: "shield-bubble",
      name: "護盾泡泡",
      description: "抵擋一次答錯的傷害",
      icon: "🛡️",
      priceGold: 25,
      dailyLimit: 1,
      boughtToday: shieldBubblePending ? 1 : (store.counts["shield-bubble"] || 0),
      soldOut: shieldBubblePending || (store.counts["shield-bubble"] || 0) >= 1,
    },
    {
      id: "treasure-map",
      name: "藏寶圖",
      description: "提升稀有怪物遭遇率 15%，持續 5 題",
      icon: "🗺️",
      priceGold: 35,
      dailyLimit: 1,
      boughtToday: treasureMapRemaining > 0 ? 1 : (store.counts["treasure-map"] || 0),
      soldOut: treasureMapRemaining > 0 || (store.counts["treasure-map"] || 0) >= 1,
    },
    {
      id: "rest-tea",
      name: "休息茶飲",
      description: "回復 30% 生命值",
      icon: "🍵",
      priceGold: 18,
      dailyLimit: 3,
      boughtToday: restTeaPending ? Math.max(1, store.counts["rest-tea"] || 0) : (store.counts["rest-tea"] || 0),
      soldOut: restTeaPending || (store.counts["rest-tea"] || 0) >= 3,
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
      id: "time-crystal",
      name: "時光水晶",
      description: "跳過一題不算答錯",
      icon: "🔮",
      priceGold: 40,
      dailyLimit: 1,
      boughtToday: timeCrystalPending ? 1 : (store.counts["time-crystal"] || 0),
      soldOut: timeCrystalPending || (store.counts["time-crystal"] || 0) >= 1,
    },
    {
      id: "battle-banner",
      name: "戰旗",
      description: "下次戰鬥攻擊力 +20%",
      icon: "🚩",
      priceGold: 28,
      dailyLimit: 1,
      boughtToday: battleBannerPending ? 1 : (store.counts["battle-banner"] || 0),
      soldOut: battleBannerPending || (store.counts["battle-banner"] || 0) >= 1,
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
    {
      id: "revive-feather",
      name: "復活羽毛",
      description: "戰鬥失敗時自動復活 50% 生命值（每週限購）",
      icon: "🦢",
      priceGold: 45,
      dailyLimit: 1,
      boughtToday: reviveFeatherPending || store.reviveFeatherBoughtThisWeek ? 1 : 0,
      soldOut: reviveFeatherPending || store.reviveFeatherBoughtThisWeek,
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

  if (itemId === "study-charm") {
    if (hasStudyCharmPending()) return { ok: false, message: "護符還在背包裡，先去戰鬥吧" };
    const bought = store.counts["study-charm"] || 0;
    if (bought >= 1) return { ok: false, message: "今天已經買過溫習護符了" };
    if (player.gold < 20) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["study-charm"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 20 });
    writeStoredJson(STUDY_CHARM_KEY, { pending: true } as PendingFlagStore);
    return { ok: true, message: "買下溫習護符！下次答錯傷害減半" };
  }

  if (itemId === "exp-scroll") {
    if (hasExpScrollPending()) return { ok: false, message: "卷軸還在背包裡，先去戰鬥吧" };
    const bought = store.counts["exp-scroll"] || 0;
    if (bought >= 1) return { ok: false, message: "今天已經買過經驗卷軸了" };
    if (player.gold < 15) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["exp-scroll"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 15 });
    writeStoredJson(EXP_SCROLL_KEY, { pending: true } as PendingFlagStore);
    return { ok: true, message: "買下經驗卷軸！下次答對額外 5 經驗" };
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

  if (itemId === "hint-feather") {
    if (hasHintFeatherPending()) return { ok: false, message: "羽毛還在背包裡，先去戰鬥吧" };
    const bought = store.counts["hint-feather"] || 0;
    if (bought >= 1) return { ok: false, message: "今天已經買過提示羽毛了" };
    if (player.gold < 12) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["hint-feather"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 12 });
    writeStoredJson(HINT_FEATHER_KEY, { pending: true } as PendingFlagStore);
    return { ok: true, message: "買下提示羽毛！戰鬥中可獲得一次提示" };
  }

  if (itemId === "shield-bubble") {
    if (hasShieldBubblePending()) return { ok: false, message: "泡泡還在背包裡，先去戰鬥吧" };
    const bought = store.counts["shield-bubble"] || 0;
    if (bought >= 1) return { ok: false, message: "今天已經買過護盾泡泡了" };
    if (player.gold < 25) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["shield-bubble"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 25 });
    writeStoredJson(SHIELD_BUBBLE_KEY, { pending: true } as PendingFlagStore);
    return { ok: true, message: "買下護盾泡泡！抵擋一次答錯傷害" };
  }

  if (itemId === "treasure-map") {
    if (getTreasureMapRemaining() > 0) return { ok: false, message: "藏寶圖還在作用中" };
    const bought = store.counts["treasure-map"] || 0;
    if (bought >= 1) return { ok: false, message: "今天已經買過藏寶圖了" };
    if (player.gold < 35) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["treasure-map"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 35 });
    writeStoredJson(TREASURE_MAP_KEY, { remaining: 5 } as PendingCounterStore);
    return { ok: true, message: "買下藏寶圖！稀有怪物遭遇率提升 5 題" };
  }

  if (itemId === "rest-tea") {
    if (hasRestTeaPending()) return { ok: false, message: "茶飲還在背包裡，先去戰鬥吧" };
    const bought = store.counts["rest-tea"] || 0;
    if (bought >= 3) return { ok: false, message: "今天已經買 3 杯茶飲了" };
    if (player.gold < 18) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["rest-tea"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 18 });
    writeStoredJson(REST_TEA_KEY, { pending: true } as PendingFlagStore);
    return { ok: true, message: "買下休息茶飲！下次戰鬥開始時回復 30% 生命值" };
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

  if (itemId === "time-crystal") {
    if (hasTimeCrystalPending()) return { ok: false, message: "水晶還在背包裡，先去戰鬥吧" };
    const bought = store.counts["time-crystal"] || 0;
    if (bought >= 1) return { ok: false, message: "今天已經買過時光水晶了" };
    if (player.gold < 40) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["time-crystal"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 40 });
    writeStoredJson(TIME_CRYSTAL_KEY, { pending: true } as PendingFlagStore);
    return { ok: true, message: "買下時光水晶！可跳過一題不算答錯" };
  }

  if (itemId === "battle-banner") {
    if (hasBattleBannerPending()) return { ok: false, message: "戰旗還在背包裡，先去戰鬥吧" };
    const bought = store.counts["battle-banner"] || 0;
    if (bought >= 1) return { ok: false, message: "今天已經買過戰旗了" };
    if (player.gold < 28) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.counts["battle-banner"] = bought + 1;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 28 });
    writeStoredJson(BATTLE_BANNER_KEY, { pending: true } as PendingFlagStore);
    return { ok: true, message: "買下戰旗！下次戰鬥攻擊力 +20%" };
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

  if (itemId === "revive-feather") {
    if (hasReviveFeatherPending()) return { ok: false, message: "羽毛還在背包裡，先去戰鬥吧" };
    if (store.reviveFeatherBoughtThisWeek) return { ok: false, message: "這週已經買過復活羽毛了" };
    if (player.gold < 45) return { ok: false, message: "金幣不夠，再去賺一點吧" };
    store.reviveFeatherBoughtThisWeek = true;
    writeStoredJson(SHOP_PURCHASE_KEY, store);
    updatePlayerData({ gold: player.gold - 45 });
    writeStoredJson(REVIVE_FEATHER_KEY, { pending: true } as PendingFlagStore);
    return { ok: true, message: "買下復活羽毛！戰鬥失敗時自動復活 50% 生命值" };
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

// 溫習護符：降低下次答錯的傷害 50%。
export function hasStudyCharmPending(): boolean {
  const stored = readStoredJson<PendingFlagStore>(STUDY_CHARM_KEY, { pending: false });
  return Boolean(stored.pending);
}

export function consumeStudyCharm(): boolean {
  if (!hasStudyCharmPending()) return false;
  writeStoredJson(STUDY_CHARM_KEY, { pending: false } as PendingFlagStore);
  return true;
}

// 經驗卷軸：答對時額外獲得 5 經驗值。
export function hasExpScrollPending(): boolean {
  const stored = readStoredJson<PendingFlagStore>(EXP_SCROLL_KEY, { pending: false });
  return Boolean(stored.pending);
}

export function consumeExpScroll(): boolean {
  if (!hasExpScrollPending()) return false;
  writeStoredJson(EXP_SCROLL_KEY, { pending: false } as PendingFlagStore);
  return true;
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

// 提示羽毛：在戰鬥中獲得一次答題提示。
export function hasHintFeatherPending(): boolean {
  const stored = readStoredJson<PendingFlagStore>(HINT_FEATHER_KEY, { pending: false });
  return Boolean(stored.pending);
}

export function consumeHintFeather(): boolean {
  if (!hasHintFeatherPending()) return false;
  writeStoredJson(HINT_FEATHER_KEY, { pending: false } as PendingFlagStore);
  return true;
}

// 護盾泡泡：抵擋一次答錯的傷害。
export function hasShieldBubblePending(): boolean {
  const stored = readStoredJson<PendingFlagStore>(SHIELD_BUBBLE_KEY, { pending: false });
  return Boolean(stored.pending);
}

export function consumeShieldBubble(): boolean {
  if (!hasShieldBubblePending()) return false;
  writeStoredJson(SHIELD_BUBBLE_KEY, { pending: false } as PendingFlagStore);
  return true;
}

// 藏寶圖：提升稀有怪物遭遇率 15%，持續 5 題。
export function getTreasureMapRemaining(): number {
  const stored = readStoredJson<PendingCounterStore>(TREASURE_MAP_KEY, { remaining: 0 });
  return Math.max(0, Math.floor(stored.remaining || 0));
}

export function consumeTreasureMapEncounter(): boolean {
  const remaining = getTreasureMapRemaining();
  if (remaining <= 0) return false;
  writeStoredJson(TREASURE_MAP_KEY, { remaining: remaining - 1 } as PendingCounterStore);
  return true;
}

// 休息茶飲：下次戰鬥開始時回復 30% 生命值。
export function hasRestTeaPending(): boolean {
  const stored = readStoredJson<PendingFlagStore>(REST_TEA_KEY, { pending: false });
  return Boolean(stored.pending);
}

export function consumeRestTea(): boolean {
  if (!hasRestTeaPending()) return false;
  writeStoredJson(REST_TEA_KEY, { pending: false } as PendingFlagStore);
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

// 時光水晶：跳過一題不算答錯。
export function hasTimeCrystalPending(): boolean {
  const stored = readStoredJson<PendingFlagStore>(TIME_CRYSTAL_KEY, { pending: false });
  return Boolean(stored.pending);
}

export function consumeTimeCrystal(): boolean {
  if (!hasTimeCrystalPending()) return false;
  writeStoredJson(TIME_CRYSTAL_KEY, { pending: false } as PendingFlagStore);
  return true;
}

// 戰旗：下次戰鬥攻擊力 +20%。
export function hasBattleBannerPending(): boolean {
  const stored = readStoredJson<PendingFlagStore>(BATTLE_BANNER_KEY, { pending: false });
  return Boolean(stored.pending);
}

export function consumeBattleBanner(): boolean {
  if (!hasBattleBannerPending()) return false;
  writeStoredJson(BATTLE_BANNER_KEY, { pending: false } as PendingFlagStore);
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

// 復活羽毛：戰鬥失敗時自動復活 50% 生命值。
export function hasReviveFeatherPending(): boolean {
  const stored = readStoredJson<PendingFlagStore>(REVIVE_FEATHER_KEY, { pending: false });
  return Boolean(stored.pending);
}

export function consumeReviveFeather(): boolean {
  if (!hasReviveFeatherPending()) return false;
  writeStoredJson(REVIVE_FEATHER_KEY, { pending: false } as PendingFlagStore);
  return true;
}
