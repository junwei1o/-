import { describe, expect, it } from "vitest";
import { defaultAdaptiveProfile, recordAdaptiveAttempt, type AdaptiveProfile } from "./adaptiveLearning";
import { getTodayLearningGuide } from "./todayLearningGuide";

const createAttempt = (correct: boolean, timestamp: number, knowledge = ["分數比較"]) => ({
  questionId: `question-${timestamp}-${correct}`,
  curriculumDomain: "數學",
  knowledge,
  difficulty: "基礎" as const,
  correct,
  responseMs: 10_000,
  timeLimitMs: 25_000,
  timestamp,
});

describe("getTodayLearningGuide", () => {
  it("優先推薦已到期的間隔複習題", () => {
    const profile = recordAdaptiveAttempt(defaultAdaptiveProfile, createAttempt(false, 0));

    const guide = getTodayLearningGuide(profile, 20 * 60_000);
    expect(guide.kind).toBe("due-review");
    expect(guide.progressPreview).toContain("複習排程");
  });

  it("在沒有到期題時推薦已有重複觀測的待複習知識點", () => {
    let profile: AdaptiveProfile = structuredClone(defaultAdaptiveProfile);
    profile = recordAdaptiveAttempt(profile, createAttempt(false, 1, ["長度單位"]));
    profile = recordAdaptiveAttempt(profile, createAttempt(false, 2, ["長度單位"]));

    const guide = getTodayLearningGuide(profile, 3);
    expect(guide.kind).toBe("knowledge-focus");
    expect(guide.title).toContain("長度單位");
  });

  it("對沒有本機紀錄的學生提供中性起點，不誤判為弱項", () => {
    const guide = getTodayLearningGuide(defaultAdaptiveProfile, 0);

    expect(guide.kind).toBe("first-step");
    expect(guide.reason).toContain("不是能力判斷");
    expect(guide.progressPreview).toContain("第一批學習足跡");
  });
});
