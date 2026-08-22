// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { buildCurrentVsPreviousReinforcementJournalComparison, buildRecentReinforcementJournalTopicDistribution, consumeMapReinforcementReward, getRecentReinforcementJournalWeekRange, loadCurrentWeekReinforcementJournal, loadRecentReinforcementJournalWeek, MAP_REINFORCEMENT_JOURNAL_STORAGE_KEY, MAP_REINFORCEMENT_REWARD_STORAGE_KEY, queueMapReinforcementReward, recordMapReinforcementJournalEntry } from "./mapReinforcementReward";

describe("map reinforcement reward event", () => {
  afterEach(() => window.localStorage.clear());

  it("stores only a verified reward and consumes it exactly once", () => {
    expect(queueMapReinforcementReward({ questionId: "q-1", subject: "自然", knowledge: "水循環", completedAt: 1_700_000_000_000 })).toBe(true);
    expect(consumeMapReinforcementReward()).toEqual({ questionId: "q-1", subject: "自然", knowledge: "水循環", completedAt: 1_700_000_000_000 });
    expect(consumeMapReinforcementReward()).toBeNull();
    expect(window.localStorage.getItem(MAP_REINFORCEMENT_REWARD_STORAGE_KEY)).toBeNull();
  });

  it("safely discards malformed or non-island subject data", () => {
    window.localStorage.setItem(MAP_REINFORCEMENT_REWARD_STORAGE_KEY, JSON.stringify({ questionId: "q-2", subject: "英文", knowledge: "字母", completedAt: 1 }));

    expect(consumeMapReinforcementReward()).toBeNull();
    expect(window.localStorage.getItem(MAP_REINFORCEMENT_REWARD_STORAGE_KEY)).toBeNull();
  });

  it("keeps only verified entries from the current UTC week, ordered newest first without duplicating the same completion", () => {
    const now = Date.UTC(2026, 7, 19, 9, 0, 0);
    const monday = Date.UTC(2026, 7, 17, 0, 0, 0);
    expect(recordMapReinforcementJournalEntry({ questionId: "q-water", subject: "自然", knowledge: "水循環", completedAt: monday + 5_000 })).toBe(true);
    expect(recordMapReinforcementJournalEntry({ questionId: "q-fraction", subject: "數學", knowledge: "分數比較", completedAt: now - 1_000 })).toBe(true);
    expect(recordMapReinforcementJournalEntry({ questionId: "q-fraction", subject: "數學", knowledge: "分數比較", completedAt: now - 1_000 })).toBe(true);
    window.localStorage.setItem(MAP_REINFORCEMENT_JOURNAL_STORAGE_KEY, JSON.stringify([
      ...JSON.parse(window.localStorage.getItem(MAP_REINFORCEMENT_JOURNAL_STORAGE_KEY) ?? "[]"),
      { questionId: "q-old", subject: "社會", knowledge: "地方生活", completedAt: monday - 1 },
      { questionId: "q-invalid", subject: "英文", knowledge: "字母", completedAt: now },
    ]));

    expect(loadCurrentWeekReinforcementJournal(now)).toEqual([
      { questionId: "q-fraction", subject: "數學", knowledge: "分數比較", completedAt: now - 1_000 },
      { questionId: "q-water", subject: "自然", knowledge: "水循環", completedAt: monday + 5_000 },
    ]);
  });

  it("returns only a selected verified UTC week from the current and previous three weeks", () => {
    const now = Date.UTC(2026, 7, 19, 9, 0, 0);
    const currentWeekStart = Date.UTC(2026, 7, 17, 0, 0, 0);
    window.localStorage.setItem(MAP_REINFORCEMENT_JOURNAL_STORAGE_KEY, JSON.stringify([
      { questionId: "current", subject: "數學", knowledge: "分數比較", completedAt: currentWeekStart + 1_000 },
      { questionId: "last", subject: "自然", knowledge: "水循環", completedAt: currentWeekStart - 1_000 },
      { questionId: "three-weeks", subject: "國語", knowledge: "成語運用", completedAt: currentWeekStart - 20 * 24 * 60 * 60 * 1000 },
      { questionId: "older", subject: "社會", knowledge: "地方生活", completedAt: currentWeekStart - 22 * 24 * 60 * 60 * 1000 },
    ]));

    expect(getRecentReinforcementJournalWeekRange(1, now)).toEqual({ offset: 1, start: currentWeekStart - 7 * 24 * 60 * 60 * 1000, end: currentWeekStart - 1 });
    expect(loadRecentReinforcementJournalWeek(0, now).map((entry) => entry.questionId)).toEqual(["current"]);
    expect(loadRecentReinforcementJournalWeek(1, now).map((entry) => entry.questionId)).toEqual(["last"]);
    expect(loadRecentReinforcementJournalWeek(3, now).map((entry) => entry.questionId)).toEqual(["three-weeks"]);
    expect(loadRecentReinforcementJournalWeek(4, now)).toEqual([]);
  });

  it("aggregates only verified topics from the current and previous three UTC weeks", () => {
    const now = Date.UTC(2026, 7, 19, 9, 0, 0);
    const currentWeekStart = Date.UTC(2026, 7, 17, 0, 0, 0);
    window.localStorage.setItem(MAP_REINFORCEMENT_JOURNAL_STORAGE_KEY, JSON.stringify([
      { questionId: "fraction-current", subject: "數學", knowledge: "分數比較", completedAt: currentWeekStart + 1_000 },
      { questionId: "fraction-last", subject: "數學", knowledge: "分數比較", completedAt: currentWeekStart - 1_000 },
      { questionId: "water-previous", subject: "自然", knowledge: "水循環", completedAt: currentWeekStart - 8 * 24 * 60 * 60 * 1000 },
      { questionId: "older", subject: "社會", knowledge: "地方生活", completedAt: currentWeekStart - 22 * 24 * 60 * 60 * 1000 },
      { questionId: "invalid", subject: "英文", knowledge: "字母", completedAt: currentWeekStart + 2_000 },
    ]));

    expect(buildRecentReinforcementJournalTopicDistribution(now)).toEqual([
      { subject: "數學", knowledge: "分數比較", count: 2 },
      { subject: "自然", knowledge: "水循環", count: 1 },
    ]);
  });

  it("compares only the verified current and previous UTC-week reinforcement entries", () => {
    const now = Date.UTC(2026, 7, 19, 9, 0, 0);
    const currentWeekStart = Date.UTC(2026, 7, 17, 0, 0, 0);
    const saveEntries = (entries: unknown[]) => window.localStorage.setItem(MAP_REINFORCEMENT_JOURNAL_STORAGE_KEY, JSON.stringify(entries));

    saveEntries([
      { questionId: "current-one", subject: "數學", knowledge: "分數比較", completedAt: currentWeekStart + 1_000 },
      { questionId: "current-two", subject: "自然", knowledge: "水循環", completedAt: currentWeekStart + 2_000 },
      { questionId: "previous-one", subject: "國語", knowledge: "成語運用", completedAt: currentWeekStart - 1_000 },
    ]);
    expect(buildCurrentVsPreviousReinforcementJournalComparison(now)).toEqual({ currentWeekCount: 2, previousWeekCount: 1, difference: 1, status: "more" });

    saveEntries([
      { questionId: "current-only", subject: "數學", knowledge: "分數比較", completedAt: currentWeekStart + 1_000 },
      { questionId: "previous-only", subject: "自然", knowledge: "水循環", completedAt: currentWeekStart - 1_000 },
    ]);
    expect(buildCurrentVsPreviousReinforcementJournalComparison(now)).toEqual({ currentWeekCount: 1, previousWeekCount: 1, difference: 0, status: "steady" });

    saveEntries([{ questionId: "previous-only", subject: "自然", knowledge: "水循環", completedAt: currentWeekStart - 1_000 }]);
    expect(buildCurrentVsPreviousReinforcementJournalComparison(now)).toEqual({ currentWeekCount: 0, previousWeekCount: 1, difference: -1, status: "less" });

    saveEntries([]);
    expect(buildCurrentVsPreviousReinforcementJournalComparison(now)).toEqual({ currentWeekCount: 0, previousWeekCount: 0, difference: 0, status: "no-data" });
  });
});
