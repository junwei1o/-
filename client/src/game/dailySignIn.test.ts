/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDailySignIn, getLimitedTitles, getPlayerData, updatePlayerData } from "@/utils/storage";
import {
  DAILY_SIGN_IN_REWARDS,
  cycleDayOf,
  claimDailySignIn,
  hasSignedInToday,
  loadSignInState,
  rewardOfCycleDay,
} from "./dailySignIn";

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0).getTime();

describe("dailySignIn - 與既有簽到共用同一個真實來源", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("連續天數寫進 xueSignIn（首頁簽到卡與每日營地都讀這份）", () => {
    claimDailySignIn(day(2026, 9, 1));
    // 不再自建第二份連續天數，否則同一頁會出現兩個互相矛盾的數字
    expect(getDailySignIn().streak).toBe(1);
    expect(getDailySignIn().lastDay).toBe("2026-09-01");
  });

  it("滿 7 天會解鎖 storage 的「一週探險家」稱號（沿用原獎勵，不重複實作）", () => {
    for (let d = 1; d <= 6; d += 1) claimDailySignIn(day(2026, 9, d));
    expect(getLimitedTitles()).not.toContain("一週探險家");

    const seventh = claimDailySignIn(day(2026, 9, 7));
    expect(seventh.streak).toBe(7);
    expect(seventh.unlockedWeeklyTitle).toBe(true);
    expect(getLimitedTitles()).toContain("一週探險家");
    expect(loadSignInState(day(2026, 9, 7)).daysToTitle).toBe(0);
  });
});

describe("dailySignIn - 連續與獎勵", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("首次簽到：連續 1 天、金幣 +8", () => {
    const before = getPlayerData().gold;
    const res = claimDailySignIn(day(2026, 9, 1));
    expect(res.streak).toBe(1);
    expect(res.cycleDay).toBe(1);
    expect(res.reward).toBe(8);
    expect(res.goldGained).toBe(8);
    expect(res.alreadyClaimed).toBe(false);
    expect(getPlayerData().gold).toBe(before + 8);
  });

  it("同一天重複呼叫：不重複發幣，alreadyClaimed=true", () => {
    const before = getPlayerData().gold;
    claimDailySignIn(day(2026, 9, 1));
    const res = claimDailySignIn(day(2026, 9, 1));
    expect(res.alreadyClaimed).toBe(true);
    expect(res.goldGained).toBe(0);
    expect(getPlayerData().gold).toBe(before + 8);
  });

  it("昨天簽過 → 今天連續 2 天且發第 2 天獎勵", () => {
    claimDailySignIn(day(2026, 9, 1));
    const res = claimDailySignIn(day(2026, 9, 2));
    expect(res.streak).toBe(2);
    expect(res.cycleDay).toBe(2);
    expect(res.reward).toBe(DAILY_SIGN_IN_REWARDS[1]);
    expect(res.goldGained).toBe(10);
  });

  it("中斷兩天 → 連續天數重置為 1", () => {
    claimDailySignIn(day(2026, 9, 1));
    const res = claimDailySignIn(day(2026, 9, 3));
    expect(res.streak).toBe(1);
    expect(res.reward).toBe(8);
  });

  it("連續天數不封頂，但金幣每 7 天重新循環", () => {
    let last = claimDailySignIn(day(2026, 9, 1));
    for (let d = 2; d <= 7; d += 1) last = claimDailySignIn(day(2026, 9, d));
    expect(last.streak).toBe(7);
    expect(last.reward).toBe(25);

    const day8 = claimDailySignIn(day(2026, 9, 8));
    expect(day8.streak).toBe(8); // 連續天數繼續累加
    expect(day8.cycleDay).toBe(1); // 金幣回到第 1 天
    expect(day8.reward).toBe(8);

    const day9 = claimDailySignIn(day(2026, 9, 9));
    expect(day9.streak).toBe(9);
    expect(day9.reward).toBe(10);
  });
});

describe("dailySignIn - 循環換算與邊界", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("cycleDayOf 對所有連續天數都落在 1..7", () => {
    expect(cycleDayOf(0)).toBe(1);
    expect(cycleDayOf(1)).toBe(1);
    expect(cycleDayOf(7)).toBe(7);
    expect(cycleDayOf(8)).toBe(1);
    expect(cycleDayOf(14)).toBe(7);
    expect(cycleDayOf(15)).toBe(1);
    expect(cycleDayOf(Number.NaN)).toBe(1);
  });

  it("rewardOfCycleDay 超出範圍時夾在表格兩端，不會回傳 undefined", () => {
    expect(rewardOfCycleDay(0)).toBe(8);
    expect(rewardOfCycleDay(7)).toBe(25);
    expect(rewardOfCycleDay(99)).toBe(25);
  });

  it("不會因系統時間被往回調而產生負金幣或重複獎勵", () => {
    const before = getPlayerData().gold;
    claimDailySignIn(day(2026, 9, 5));
    const res = claimDailySignIn(day(2026, 9, 1));
    expect(res.streak).toBe(1); // 視為斷籤重置
    const gold = getPlayerData().gold;
    expect(gold).toBe(before + 8 + 8);
    expect(gold).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(gold)).toBe(true);
  });

  it("金幣歸零後簽到仍為非負", () => {
    updatePlayerData({ gold: 0 });
    const res = claimDailySignIn(day(2026, 9, 1));
    expect(res.goldGained).toBe(8);
    expect(getPlayerData().gold).toBe(8);
  });

  it("hasSignedInToday 以本地日期判定", () => {
    claimDailySignIn(day(2026, 9, 1));
    expect(hasSignedInToday(loadSignInState(day(2026, 9, 1)), day(2026, 9, 1))).toBe(true);
    expect(hasSignedInToday(loadSignInState(day(2026, 9, 2)), day(2026, 9, 2))).toBe(false);
  });

  it("狀態為空時安全回退，不會拋錯", () => {
    const state = loadSignInState(day(2026, 9, 1));
    expect(state.streak).toBe(0);
    expect(state.cycleDay).toBe(1);
    expect(state.claimedToday).toBe(false);
    expect(state.daysToTitle).toBe(7);
  });

  it("損壞的儲存值不會讓簽到壞掉", () => {
    localStorage.setItem("xueSignIn", "{not-json");
    expect(() => claimDailySignIn(day(2026, 9, 1))).not.toThrow();
    expect(getDailySignIn().streak).toBe(1);
  });
});
