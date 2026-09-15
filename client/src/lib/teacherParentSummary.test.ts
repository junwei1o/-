import { describe, expect, it } from "vitest";
import { buildTeacherParentSummary } from "@/lib/teacherParentSummary";
import type { AdaptiveProfile } from "@/game/adaptiveLearning";

const emptyProfile: AdaptiveProfile = { version: 2, attempts: [], spacedReviews: [] };
const attempt = (subject: string, id: string, correct: boolean, timestamp: number) => ({
  questionId: id,
  curriculumDomain: subject,
  knowledge: [`${subject}主題`],
  difficulty: "基礎" as const,
  correct,
  responseMs: 10000,
  timeLimitMs: 30000,
  hintsUsed: 0,
  timestamp,
});

describe("buildTeacherParentSummary", () => {
  it("always returns all five islands (incl. English) without inventing activity", () => {
    const summary = buildTeacherParentSummary(emptyProfile, 1700000000000);
    expect(summary.islands).toHaveLength(5);
    expect(summary.totalAttempts).toBe(0);
    expect(summary.activeIslands).toBe(0);
    expect(summary.islands.every((item) => item.status === "尚未啟航")).toBe(true);
    expect(summary.visitedTopics).toEqual([]);
  });

  it("derives active islands, topics, recent stats, and positive status from attempts", () => {
    const profile: AdaptiveProfile = {
      version: 2,
      attempts: [
        attempt("數學", "m1", true, 1000),
        attempt("數學", "m2", true, 2000),
        attempt("數學", "m3", true, 3000),
        attempt("自然", "s1", false, 4000),
      ],
      spacedReviews: [],
    };
    const summary = buildTeacherParentSummary(profile, 5000);
    const math = summary.islands.find((item) => item.island.subject === "數學");
    const science = summary.islands.find((item) => item.island.subject === "自然");
    expect(summary.totalAttempts).toBe(4);
    expect(summary.activeIslands).toBe(2);
    expect(math?.status).toBe("穩定航行");
    expect(math?.recentCorrectCount).toBe(3);
    expect(math?.latestActivityAt).toBe(3000);
    expect(math?.island.observedKnowledge).toContain("數學主題");
    expect(science?.status).toBe("探索中");
    expect(summary.weakTopics).toEqual([]);
    expect(summary.nextConversation).toContain("沒有明顯弱點");
  });

  it("ranks weak topics Top3 by wrong count and gives actionable recommended question counts", () => {
    const at = (subject: string, topic: string, correct: boolean, ts: number) => ({
      questionId: `${topic}-${ts}`, curriculumDomain: subject, knowledge: [topic],
      difficulty: "基礎" as const, correct, responseMs: 10000, timeLimitMs: 30000, hintsUsed: 0, timestamp: ts,
    });
    const profile: AdaptiveProfile = {
      version: 2,
      attempts: [
        // 分數：錯 3 對 1，正確率 25% → 最嚴重，建議 5 題
        at("數學", "分數", false, 1000), at("數學", "分數", false, 2000),
        at("數學", "分數", false, 3000), at("數學", "分數", true, 4000),
        // 面積：錯 1 對 1，正確率 50% → 建議 4 題
        at("數學", "面積", false, 5000), at("數學", "面積", true, 6000),
        // 強主題全對 → 不列入弱點
        at("自然", "水循環", true, 7000), at("自然", "水循環", true, 8000),
        // 僅一題 → 樣本不足，不列入
        at("國語", "字音", false, 9000),
      ],
      spacedReviews: [],
    };
    const summary = buildTeacherParentSummary(profile, 10000);
    expect(summary.weakTopics.map((item) => item.topic)).toEqual(["分數", "面積"]);
    expect(summary.weakTopics[0].recommendedQuestions).toBe(5);
    expect(summary.weakTopics[1].recommendedQuestions).toBe(4);
    expect(summary.recommendedWeeklyQuestions).toBe(9);
    expect(summary.nextConversation).toContain("分數");
  });
});
