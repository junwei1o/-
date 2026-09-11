/**
 * 每日簽到（金幣獎勵）— 全站唯一的簽到實作
 *
 * 為什麼必須唯一：這個專案原本有兩套各自記「連續天數」的簽到——
 *   1. utils/storage.ts 的 xueSignIn：記連續天數，滿 7 天授「一週探險家」稱號
 *   2. game/bxStore.ts 的 checkin：記連續天數，發金幣，滿 7 天授「七日航行」徽章
 * 兩套各自累加，學生會在同一頁看到「連續 3 天」與「連續 1 天」互相矛盾，
 * 家長與老師也會懷疑數據到底準不準。
 *
 * 本模組把簽到收斂成單一路徑：
 *   - 連續天數與「一週探險家」稱號 → 沿用 storage.ts 的 xueSignIn（唯一真實來源）
 *   - 金幣 → 本模組依 7 天循環發放（第 1 天 8 金 …第 7 天 25 金）
 *   - bx 的簽到日期／連續天數／「七日航行」徽章 → 由本模組同步寫入，
 *     讓每日營地的統計與徽章維持一致
 *   - 首頁簽到卡、新手導覽的簽到步驟全部改走這裡，不再各自寫入
 *
 * 金幣尺度：酒館一張卡包 25 金（tavernKeeper.CARD_PACK_GOLD_COST），
 * 單筆獎勵不超過一張卡包；一週累計 108 金 ≈ 4.3 張卡包，足以誘發回訪但不造成通膨。
 */
import { bxStore } from "@/game/bxStore";
import {
  claimDailySignIn as claimStreakSignIn,
  getDailySignIn,
  getPlayerData,
  updatePlayerData,
} from "@/utils/storage";

/** 7 天循環的金幣獎勵表（只發金幣，不發項目裡不存在的道具）。 */
export const DAILY_SIGN_IN_REWARDS: readonly number[] = [8, 10, 12, 15, 18, 20, 25];

/** 連續幾天可解鎖「一週探險家」稱號（與 storage.ts 的授予條件一致）。 */
export const WEEKLY_TITLE_STREAK = 7;

/** 一天對應的金幣獎勵（給 UI 標示用）。 */
export function rewardOfCycleDay(cycleDay: number): number {
  const index = Math.min(Math.max(Math.floor(cycleDay), 1), DAILY_SIGN_IN_REWARDS.length) - 1;
  return DAILY_SIGN_IN_REWARDS[index];
}

/** 本地時區日期鍵（YYYY-MM-DD）；孩子晚上用網站也必須算「當天」。 */
export function localDayKey(now: number = Date.now()): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * 把「連續天數」換算成「在 7 天金幣循環中的第幾天」。
 * 連續天數由 storage.ts 一路累加不封頂，金幣獎勵則每 7 天重新循環，
 * 所以第 8 天領的是第 1 天（8 金）的獎勵。
 */
export function cycleDayOf(streak: number): number {
  const value = Math.floor(Number(streak));
  if (!Number.isFinite(value) || value <= 0) return 1;
  return ((value - 1) % DAILY_SIGN_IN_REWARDS.length) + 1;
}

export type SignInState = {
  /** 上次簽到的本地日期；null 表示從未簽到 */
  lastDay: string | null;
  /** 目前連續天數（不封頂） */
  streak: number;
  /** 累計簽到天數（取 bx 簽到日期清單，斷籤也不歸零） */
  totalDays: number;
  /** 今天在 7 天金幣循環中的位置 1..7 */
  cycleDay: number;
  /** 今天是否已簽到 */
  claimedToday: boolean;
  /** 距離「一週探險家」稱號還差幾天；0 表示已達成 */
  daysToTitle: number;
};

export type SignInClaimResult = {
  /** 簽到後的連續天數 */
  streak: number;
  /** 本次在 7 天循環中的位置 1..7 */
  cycleDay: number;
  /** 本次應發的金幣數（未領取為 0） */
  reward: number;
  /** 今天是否已經領過 */
  alreadyClaimed: boolean;
  /** 實際增加（寫入）的金幣數；重複領取時為 0 */
  goldGained: number;
  /** 這次是否剛解鎖「一週探險家」稱號 */
  unlockedWeeklyTitle: boolean;
};

/** 累計簽到天數：以 bx 的簽到日期清單為準（同一份資料也供每日營地統計使用）。 */
function totalSignInDays(): number {
  try {
    const dates = bxStore.get<string[]>("checkin.dates", []) ?? [];
    return Array.isArray(dates) ? dates.length : 0;
  } catch {
    return 0;
  }
}

export function loadSignInState(now: number = Date.now(), storage?: Storage | null): SignInState {
  const streakState = getDailySignIn(storage);
  const claimedToday = streakState.lastDay === localDayKey(now);
  // 未簽到時，標示的是「今天按下去會拿到第幾天」的獎勵。
  const cycleDay = claimedToday ? cycleDayOf(streakState.streak) : cycleDayOf(streakState.streak + 1);
  return {
    lastDay: streakState.lastDay,
    streak: streakState.streak,
    totalDays: totalSignInDays(),
    cycleDay,
    claimedToday,
    daysToTitle: Math.max(0, WEEKLY_TITLE_STREAK - streakState.streak),
  };
}

export function hasSignedInToday(state: SignInState = loadSignInState(), now: number = Date.now()): boolean {
  return state.lastDay === localDayKey(now);
}

/**
 * 把今天的簽到補進 bx 的紀錄（新手導覽的每日營地統計與「七日航行」徽章沿用這份資料）。
 * 只在真實執行環境同步；單元測試傳入假 storage 時不動全域狀態。
 */
function mirrorToCampCheckIn(streak: number, today: string): void {
  try {
    const dates = bxStore.get<string[]>("checkin.dates", []) ?? [];
    if (dates.includes(today)) return;
    bxStore.update((state) => {
      state.checkin.dates.push(today);
      state.checkin.streak = streak;
      state.checkin.longest = Math.max(state.checkin.longest, streak);
      if (streak >= WEEKLY_TITLE_STREAK && !state.badges.includes("7day")) {
        state.badges.push("7day");
      }
    });
  } catch {
    // 營地統計同步失敗不影響簽到本身。
  }
}

/**
 * 領取今日簽到金幣。
 * - 同天重領：`alreadyClaimed=true`，不重複發幣。
 * - 昨天簽過：連續 +1；斷籤、首領或系統時間被往回調：重新從 1 開始。
 * - 金幣一律 `Math.max(0, …)` 防負，且真的寫回玩家資料。
 */
export function claimDailySignIn(now: number = Date.now(), storage?: Storage | null): SignInClaimResult {
  const before = getDailySignIn(storage);
  const result = claimStreakSignIn(now, storage);

  if (!result.claimed) {
    return {
      streak: before.streak,
      cycleDay: cycleDayOf(before.streak),
      reward: 0,
      alreadyClaimed: true,
      goldGained: 0,
      unlockedWeeklyTitle: false,
    };
  }

  const streak = result.signIn.streak;
  const cycleDay = cycleDayOf(streak);
  const reward = rewardOfCycleDay(cycleDay);

  const player = getPlayerData(storage);
  updatePlayerData({ gold: Math.max(0, Math.floor(player.gold) + reward) }, storage);

  if (!storage) mirrorToCampCheckIn(streak, localDayKey(now));

  return {
    streak,
    cycleDay,
    reward,
    alreadyClaimed: false,
    goldGained: reward,
    unlockedWeeklyTitle: result.unlockedWeeklyTitle,
  };
}
