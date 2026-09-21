import { describe, expect, it } from "vitest";
import { generateDailyAdventureSummary } from "./academyExpansion";

describe("academy expansion systems", () => {
  it("summarizes the previous day's real journal entries", () => {
    const date = Date.parse("2026-08-21T12:00:00Z");
    const entries = [{ id: "1", date: Date.parse("2026-08-20T08:00:00Z"), subject: "數學", topicCount: 10, correctCount: 9, sessionType: "battle" as const, islandId: null, summary: "" }];
    const summary = generateDailyAdventureSummary({ date, entries });
    expect(summary.answered).toBe(10);
    expect(summary.correct).toBe(9);
    expect(summary.summary).toContain("數學");
  });
});
