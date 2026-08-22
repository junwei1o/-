import { describe, expect, it } from "vitest";
import { defaultAdaptiveProfile, type AdaptiveAttempt } from "@/game/adaptiveLearning";
import { filterAdaptiveProfile, hasValidSupporterDateRange, loadSupporterSummaryFilters, saveSupporterSummaryFilters, type SupporterSummaryFilters } from "@/lib/teacherParentSummaryFilters";

const attempt = (timestamp: number, curriculumDomain: string, questionId: string): AdaptiveAttempt => ({ questionId, curriculumDomain, knowledge: [`${curriculumDomain}主題`], difficulty: "基礎", correct: true, responseMs: 1000, timeLimitMs: 25000, timestamp });

const profile = { ...defaultAdaptiveProfile, attempts: [
  attempt(new Date(2026, 5, 1, 10).getTime(), "數學", "math-1"),
  attempt(new Date(2026, 5, 5, 10).getTime(), "自然", "science-1"),
  attempt(new Date(2026, 5, 10, 10).getTime(), "數學", "math-2"),
] };

describe("teacher parent summary filters", () => {
  it("filters by one island without inventing attempts", () => {
    const result = filterAdaptiveProfile(profile, { islandSubject: "數學", fromDate: "", toDate: "" });
    expect(result.attempts.map((item) => item.questionId)).toEqual(["math-1", "math-2"]);
  });

  it("includes both local date boundaries", () => {
    const filters: SupporterSummaryFilters = { islandSubject: "all", fromDate: "2026-06-01", toDate: "2026-06-05" };
    expect(filterAdaptiveProfile(profile, filters).attempts.map((item) => item.questionId)).toEqual(["math-1", "science-1"]);
  });

  it("returns no attempts for an invalid date range", () => {
    const filters = { islandSubject: "all", fromDate: "2026-06-10", toDate: "2026-06-01" };
    expect(hasValidSupporterDateRange(filters)).toBe(false);
    expect(filterAdaptiveProfile(profile, filters).attempts).toEqual([]);
  });

  it("persists and safely loads filter preferences", () => {
    let saved = "";
    const storage = { setItem: (_key: string, value: string) => { saved = value; }, getItem: () => saved };
    const filters = { islandSubject: "自然", fromDate: "2026-06-01", toDate: "2026-06-30" };
    saveSupporterSummaryFilters(filters, storage);
    expect(loadSupporterSummaryFilters(storage)).toEqual(filters);
    expect(loadSupporterSummaryFilters({ getItem: () => "{bad" })).toEqual({ islandSubject: "all", fromDate: "", toDate: "" });
  });
});
