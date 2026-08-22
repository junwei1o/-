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
  it("always returns all four islands without inventing activity", () => {
    const summary = buildTeacherParentSummary(emptyProfile, 1700000000000);
    expect(summary.islands).toHaveLength(4);
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
    expect(summary.nextConversation).toContain("分享最近最有把握");
  });
});
