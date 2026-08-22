import { describe, expect, it } from "vitest";
import type { AdaptiveProfile } from "@/game/adaptiveLearning";
import { buildSupporterLearningTimeline, buildSupporterTimelineReadout } from "./teacherParentTimeline";

const profile: AdaptiveProfile = {
  version: 2,
  attempts: [
    { questionId: "language-1", curriculumDomain: "國語", knowledge: ["段落主旨"], difficulty: "標準", correct: true, responseMs: 8000, timeLimitMs: 25000, timestamp: 300 },
    { questionId: "math-1", curriculumDomain: "數學", knowledge: ["分數與比例"], difficulty: "標準", correct: false, responseMs: 11000, timeLimitMs: 25000, timestamp: 100 },
    { questionId: "science-1", curriculumDomain: "自然", knowledge: ["觀察證據"], difficulty: "標準", correct: true, responseMs: 9000, timeLimitMs: 25000, timestamp: 200 },
  ],
  spacedReviews: [],
};

describe("buildSupporterLearningTimeline", () => {
  it("orders only real island attempts chronologically and preserves cross-island metadata", () => {
    const timeline = buildSupporterLearningTimeline(profile);

    expect(timeline.events.map((event) => event.subject)).toEqual(["數學", "自然", "國語"]);
    expect(timeline.events.map((event) => event.knowledge)).toEqual(["分數與比例", "觀察證據", "段落主旨"]);
    expect(timeline.events.map((event) => event.questionId)).toEqual(["math-1", "science-1", "language-1"]);
    expect(timeline.events[0].correct).toBe(false);
    expect(timeline.islandsRepresented).toEqual(["數學", "自然", "國語"]);
    expect(timeline.events[0].activityLabel).toBe("留下一筆練習足跡");
  });

  it("limits recent events before rendering them in chronological order without inventing history", () => {
    const timeline = buildSupporterLearningTimeline(profile, 2);

    expect(timeline.events.map((event) => event.subject)).toEqual(["自然", "國語"]);
  });

  it("has an honest empty readout when no attempts exist", () => {
    const timeline = buildSupporterLearningTimeline({ version: 2, attempts: [], spacedReviews: [] });

    expect(timeline.events).toEqual([]);
    expect(buildSupporterTimelineReadout(timeline)).toBe("目前範圍內還沒有學習時間軸紀錄。");
  });
});
