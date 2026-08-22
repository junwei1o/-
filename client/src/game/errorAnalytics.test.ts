import { describe, expect, it } from "vitest";
import { calculateErrorTypeAnalytics, getErrorTypeLearningMessage } from "./errorAnalytics";
import { defaultAdaptiveProfile, recordAdaptiveAttempt, type AdaptiveProfile } from "./adaptiveLearning";

const day = 24 * 60 * 60 * 1000;

function createProfile(): AdaptiveProfile {
  const start = Date.UTC(2026, 7, 20, 8);
  let profile = defaultAdaptiveProfile;
  const add = (questionId: string, correct: boolean, errorType: "concept" | "careless" | "memory" | undefined, timestamp: number) => {
    profile = recordAdaptiveAttempt(profile, { questionId, curriculumDomain: "數學領域", knowledge: ["分數"], difficulty: "基礎", correct, responseMs: 8_000, timeLimitMs: 25_000, timestamp, ...(errorType ? { errorType } : {}) });
  };
  add("a", false, "concept", start);
  add("b", false, "concept", start + 1_000);
  add("c", false, "careless", start + 2 * day);
  add("d", false, "memory", start + 8 * day);
  add("e", true, undefined, start + 8 * day + 1_000);
  add("legacy", false, undefined, start + 8 * day + 2_000);
  return profile;
}

describe("errorAnalytics", () => {
  it("只統計真實且已分類的錯答，並保留未分類舊紀錄不猜測", () => {
    const report = calculateErrorTypeAnalytics(createProfile(), undefined, Date.UTC(2026, 7, 29, 8));
    expect(report.attempts).toBe(6);
    expect(report.classifiedErrors).toBe(4);
    expect(report.distributions).toEqual([
      { type: "concept", label: "觀念整理", count: 2, percentage: 50 },
      { type: "careless", label: "細節檢查", count: 1, percentage: 25 },
      { type: "memory", label: "記憶提取", count: 1, percentage: 25 },
    ]);
    expect(report.strongestType).toBe("concept");
  });

  it("以有作答的七日區間呈現分類數量與正確率趨勢", () => {
    const report = calculateErrorTypeAnalytics(createProfile(), undefined, Date.UTC(2026, 7, 29, 8));
    expect(report.trend.length).toBeGreaterThan(1);
    expect(report.trend.at(-1)).toMatchObject({ concept: 0, careless: 1, memory: 1, accuracy: 25 });
    expect(report.trend[0]).toMatchObject({ concept: 2, careless: 0, memory: 0, totalErrors: 2, accuracy: 0 });
  });

  it("空資料提供正向且不虛構的說明", () => {
    const report = calculateErrorTypeAnalytics(defaultAdaptiveProfile, undefined, Date.UTC(2026, 7, 20));
    expect(report.trend).toEqual([]);
    expect(getErrorTypeLearningMessage(report)).toContain("完成幾題");
  });
});
