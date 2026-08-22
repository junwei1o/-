import { describe, expect, it } from "vitest";
import { ADAPTIVE_STORAGE_KEY } from "@/game/adaptiveLearning";
import { ACCESSIBILITY_PREFS_KEY, ANALYTICS_CONSENT_KEY, BATTLE_VOLUME_KEY, DAILY_SIGN_IN_KEY, LEARNING_RECORD_KEY, PLAYER_DATA_KEY, STORAGE_ERROR_LOG_KEY, addLearningRecord, addRecord, claimDailySignIn, consumeStorageNotice, getAccessibilityPrefs, getAnalytics, getAnalyticsConsent, getAnalyticsSummary, getBattleRecaps, getBattleVolume, getDailySignIn, getLearningRecord, getLimitedTitles, getPlayerData, getRareMonsterDefeats, getSelectedTitle, hasSignedInToday, initGameData, initLearningRecord, initPlayerData, recordAnalyticsEvent, recordRareMonsterDefeat, saveAccessibilityPrefs, saveAnalyticsConsent, saveBattleRecap, saveBattleVolume, savePlayerData, saveSelectedTitle, unlockLimitedTitle } from "@/utils/storage";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

function createFailingStorage(options: { failGet?: boolean; failSet?: boolean; failSetAfter?: number } = {}) {
  const values = new Map<string, string>();
  let writes = 0;
  return {
    getItem: (key: string) => {
      if (options.failGet) throw new Error("read blocked");
      return values.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      writes += 1;
      if (options.failSet || (options.failSetAfter !== undefined && writes > options.failSetAfter)) {
        const error = new DOMException("quota", "QuotaExceededError");
        throw error;
      }
      values.set(key, value);
    },
    removeItem: (key: string) => values.delete(key),
  };
}

describe("storage compatibility API", () => {
  it("initializes inspectable compatibility snapshots without inventing learning records", () => {
    const storage = createStorage();
    const result = initGameData(storage);
    expect(result.playerData.level).toBe(1);
    expect(result.playerData.exp).toBe(0);
    expect(result.playerData.gold).toBe(100);
    expect(result.playerData.totalAnswers).toBe(0);
    expect(result.learningRecord).toEqual([]);
    expect(storage.getItem(PLAYER_DATA_KEY)).not.toBeNull();
    expect(storage.getItem(LEARNING_RECORD_KEY)).toBe("[]");
    expect(storage.getItem(ADAPTIVE_STORAGE_KEY)).toBeNull();
  });

  it("exposes explicit initialization and persistence helpers without overwriting existing progress", () => {
    const storage = createStorage();
    expect(initPlayerData(storage)).toMatchObject({ gold: 100, exp: 0, level: 1, totalAnswers: 0 });
    expect(initLearningRecord(storage)).toEqual([]);

    const saved = savePlayerData({ ...getPlayerData(storage), gold: 145, totalAnswers: 3 }, storage);
    expect(saved).toMatchObject({ gold: 145, totalAnswers: 3 });
    expect(initPlayerData(storage)).toMatchObject({ gold: 145, totalAnswers: 3 });

    addLearningRecord({ questionId: "compat-001", subject: "國語", isCorrect: true, timestamp: 1_700_000_000_000, flagged: false }, storage);
    expect(getLearningRecord(storage)).toHaveLength(1);
  });

  it("maps a real record into AdaptiveProfile and the legacy-readable learning record", () => {
    const storage = createStorage();
    initGameData(storage);
    addRecord({
      questionId: "math-001",
      subject: "數學",
      isCorrect: false,
      errorType: "concept",
      timestamp: 1_700_000_000_000,
      flagged: true,
      knowledge: ["一元一次方程式"],
    }, storage);
    const records = getLearningRecord(storage);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ questionId: "math-001", subject: "數學", isCorrect: false, errorType: "concept", flagged: true });
    expect(JSON.parse(storage.getItem(ADAPTIVE_STORAGE_KEY) ?? "{}").attempts).toHaveLength(1);
  });

  it("resets malformed snapshots and records an error log", () => {
    const storage = createStorage();
    storage.setItem(PLAYER_DATA_KEY, "{bad-json");
    storage.setItem(LEARNING_RECORD_KEY, JSON.stringify([{ questionId: 7 }]));
    expect(getPlayerData(storage)).toMatchObject({ gold: 100, level: 1, exp: 0 });
    expect(getLearningRecord(storage)).toEqual([]);
    const logs = JSON.parse(storage.getItem(STORAGE_ERROR_LOG_KEY) ?? "[]") as Array<{ context: string }>;
    expect(logs.some((entry) => entry.context.includes("玩家資料格式驗證"))).toBe(true);
    expect(logs.some((entry) => entry.context.includes("學習紀錄格式驗證"))).toBe(true);
  });

  it("falls back to memory and exposes a notice when storage reads fail", () => {
    const storage = createFailingStorage({ failGet: true });
    expect(getLearningRecord(storage)).toEqual([]);
    expect(consumeStorageNotice()).toMatchObject({ kind: "error" });
  });

  it("persists and clamps battle volume safely", () => {
    const storage = createStorage();
    expect(getBattleVolume(storage)).toBe(0.65);
    expect(saveBattleVolume(1.4, storage)).toBe(1);
    expect(storage.getItem(BATTLE_VOLUME_KEY)).toBe("1");
    expect(saveBattleVolume(-0.4, storage)).toBe(0);
    expect(getBattleVolume(storage)).toBe(0);
    storage.setItem(BATTLE_VOLUME_KEY, "not-a-number");
    expect(getBattleVolume(storage)).toBe(0.65);
  });

  it("persists accessible effect, vibration and animation preferences with malformed-data fallback", () => {
    const storage = createStorage();
    expect(getAccessibilityPrefs(storage)).toEqual({ effectIntensity: "high", vibrationEnabled: true, reducedAnimation: false });
    expect(saveAccessibilityPrefs({ effectIntensity: "low", vibrationEnabled: false, reducedAnimation: true }, storage)).toEqual({ effectIntensity: "low", vibrationEnabled: false, reducedAnimation: true });
    expect(JSON.parse(storage.getItem(ACCESSIBILITY_PREFS_KEY) ?? "{}")).toEqual({ effectIntensity: "low", vibrationEnabled: false, reducedAnimation: true });
    storage.setItem(ACCESSIBILITY_PREFS_KEY, JSON.stringify({ effectIntensity: "maximum", vibrationEnabled: "no" }));
    expect(getAccessibilityPrefs(storage)).toEqual({ effectIntensity: "high", vibrationEnabled: true, reducedAnimation: false });
  });

  it("records consented anonymous analytics without storing answer text", () => {
    const storage = createStorage();
    expect(getAnalyticsConsent(storage)).toBeNull();
    saveAnalyticsConsent("accepted", storage);
    recordAnalyticsEvent({ type: "session-start", timestamp: Date.UTC(2026, 7, 20, 1) }, storage);
    recordAnalyticsEvent({ type: "answer", subject: "數學", questionId: "math-001", correct: false, timestamp: Date.UTC(2026, 7, 20, 1, 1) }, storage);
    recordAnalyticsEvent({ type: "potion-use", hpRatio: 0.42, timestamp: Date.UTC(2026, 7, 20, 1, 2) }, storage);
    recordAnalyticsEvent({ type: "session-end", timestamp: Date.UTC(2026, 7, 20, 1, 5) }, storage);
    const analytics = getAnalytics(storage);
    expect(analytics.activeDays).toEqual(["2026-08-20"]);
    expect(analytics.totalPlayMs).toBe(300_000);
    expect(analytics.subjectStats.math).toMatchObject({ attempts: 1, wrong: 1, questionErrors: { "math-001": 1 } });
    expect(getAnalyticsSummary(storage)).toMatchObject({ activeDays: 1, averagePlayMs: 300_000, potionUseCount: 1, lowHpPotionUseRate: 100 });
    expect(JSON.stringify(analytics)).not.toContain("答案");
    expect(storage.getItem(ANALYTICS_CONSENT_KEY)).toBe("accepted");
  });

  it("does not record anonymous analytics after consent is declined", () => {
    const storage = createStorage();
    saveAnalyticsConsent("declined", storage);
    recordAnalyticsEvent({ type: "session-start", timestamp: 1 }, storage);
    expect(getAnalytics(storage).sessionCount).toBe(0);
  });

  it("persists unique limited titles", () => {
    const storage = createStorage();
    expect(unlockLimitedTitle("擊敗後獲得限定稱號：古籍星君", storage)).toHaveLength(1);
    expect(unlockLimitedTitle("擊敗後獲得限定稱號：古籍星君", storage)).toHaveLength(1);
    expect(getLimitedTitles(storage)).toEqual(["擊敗後獲得限定稱號：古籍星君"]);
  });

  it("safely accumulates daily sign-ins, deduplicates a day, and unlocks the weekly title", () => {
    const storage = createStorage();
    const start = Date.UTC(2026, 7, 15, 3);
    expect(claimDailySignIn(start, storage)).toMatchObject({ claimed: true, signIn: { lastDay: "2026-08-15", streak: 1 }, unlockedWeeklyTitle: false });
    expect(claimDailySignIn(start + 3_600_000, storage)).toMatchObject({ claimed: false, signIn: { streak: 1 } });

    for (let day = 1; day < 7; day += 1) claimDailySignIn(start + day * 86_400_000, storage);
    expect(getDailySignIn(storage)).toEqual({ lastDay: "2026-08-21", streak: 7 });
    expect(getLimitedTitles(storage)).toContain("一週探險家");
    expect(hasSignedInToday(getDailySignIn(storage), start + 6 * 86_400_000)).toBe(true);
    expect(storage.getItem(DAILY_SIGN_IN_KEY)).not.toBeNull();
  });

  it("stores rare-monster codex defeats, a selected unlocked title, and the latest battle recap", () => {
    const storage = createStorage();
    recordRareMonsterDefeat("chinese-rare-1", storage);
    recordRareMonsterDefeat("chinese-rare-1", storage);
    unlockLimitedTitle("擊敗後獲得限定稱號：古籍星君", storage);
    expect(saveSelectedTitle("擊敗後獲得限定稱號：古籍星君", storage)).toBe("擊敗後獲得限定稱號：古籍星君");
    saveBattleRecap({ id: "battle-1", timestamp: 1_700_000_000_000, enemyId: "chinese-rare-1", enemyName: "古籍星君", rare: true, maxCombo: 5, strategyUses: 2, partBreakTriggered: true }, storage);

    expect(getRareMonsterDefeats(storage)).toEqual({ "chinese-rare-1": 2 });
    expect(getSelectedTitle(storage)).toBe("擊敗後獲得限定稱號：古籍星君");
    expect(getBattleRecaps(storage)).toEqual([expect.objectContaining({ id: "battle-1", maxCombo: 5, strategyUses: 2, partBreakTriggered: true })]);
  });

  it("cleans the oldest 100 records after a quota failure", () => {
    const storage = createFailingStorage({ failSetAfter: 3 });
    const records = Array.from({ length: 101 }, (_, index) => ({
      questionId: `q-${index}`,
      subject: "數學",
      isCorrect: true,
      timestamp: index + 1,
      flagged: false,
    }));
    records.forEach((record) => addRecord(record, storage));
    const notice = consumeStorageNotice();
    expect(notice?.kind).toBe("quota");
    expect(notice?.message).toMatch(/儲存空間不足|清理部分舊資料/);
  });
});
