import { describe, expect, it } from "vitest";
import type { AdaptiveProfile } from "@/game/adaptiveLearning";
import { buildKnowledgeIslandSnapshots, subjectScopeFromSearch } from "@/lib/studentKnowledgeIslands";

const profile: AdaptiveProfile = {
  version: 2,
  attempts: [
    { questionId: "math-1", curriculumDomain: "數學", knowledge: ["分數比較"], difficulty: "基礎", correct: true, responseMs: 1200, timeLimitMs: 25000, timestamp: 1000 },
    { questionId: "science-1", curriculumDomain: "自然", knowledge: ["植物生長"], difficulty: "標準", correct: false, responseMs: 1400, timeLimitMs: 25000, timestamp: 2000 },
    { questionId: "math-2", curriculumDomain: "數學", knowledge: ["小數運算"], difficulty: "標準", correct: true, responseMs: 1300, timeLimitMs: 25000, timestamp: 3000 },
  ],
  spacedReviews: [{ questionId: "science-1", intervalIndex: 0, dueAt: 1500, updatedAt: 1000 }],
};

describe("studentKnowledgeIslands", () => {
  it("only unlocks islands with observed attempts and carries through observed knowledge", () => {
    const islands = buildKnowledgeIslandSnapshots(profile, 3000);

    expect(islands.find((island) => island.subject === "數學")).toMatchObject({ unlocked: true, attemptCount: 2, accuracy: 1, observedKnowledge: ["小數運算", "分數比較"], recentReviewTopics: ["小數運算", "分數比較"], dueReviewCount: 0 });
    expect(islands.find((island) => island.subject === "自然")).toMatchObject({ unlocked: true, attemptCount: 1, accuracy: 0, observedKnowledge: ["植物生長"], recentReviewTopics: ["植物生長"], dueReviewCount: 1 });
    expect(islands.find((island) => island.subject === "社會")).toMatchObject({ unlocked: false, attemptCount: 0, accuracy: null, observedKnowledge: [], recentReviewTopics: [], dueReviewCount: 0 });
    expect(islands.find((island) => island.subject === "國語")).toMatchObject({ unlocked: false, attemptCount: 0, accuracy: null, observedKnowledge: [], recentReviewTopics: [], dueReviewCount: 0 });
  });

  it("accepts only the four supported subject scopes from a map entry URL", () => {
    expect(subjectScopeFromSearch("?subject=%E6%95%B8%E5%AD%B8&source=student-map")).toBe("數學");
    expect(subjectScopeFromSearch("?subject=%E7%B6%9C%E5%90%88%E8%AA%B2%E7%B6%B1")).toBeNull();
    expect(subjectScopeFromSearch("?subject=%E8%87%AA%E7%84%B6%3Cscript%3E")).toBeNull();
    expect(subjectScopeFromSearch("")).toBeNull();
  });
});
