import { describe, expect, it } from "vitest";
import { buildKnowledgePracticeRecommendation } from "./teacherParentPracticeRecommendation";
import type { TimelineQuestionReview } from "./teacherParentQuestionReview";

const availableReview: Extract<TimelineQuestionReview, { status: "available" }> = {
  status: "available",
  event: {
    id: "math-1",
    questionId: "review-math",
    timestamp: 1_783_137_600_000,
    islandId: "math",
    subject: "數學",
    islandTitle: "數學城",
    knowledge: "分數與比例",
    activityLabel: "完成一次練習",
    correct: true,
  },
  prompt: "題幹",
  options: ["選項"],
  answer: "選項",
  explanation: "解析",
  responseNote: "完成一次練習。",
  selectionNote: "不推測學生選項。",
  readout: "題目回顧。",
};

describe("buildKnowledgePracticeRecommendation", () => {
  it("uses the verified subject and knowledge point in the existing review-practice deep link", () => {
    expect(buildKnowledgePracticeRecommendation(availableReview)).toMatchObject({
      status: "available",
      href: "/?subject=%E6%95%B8%E5%AD%B8&reviewTopic=%E5%88%86%E6%95%B8%E8%88%87%E6%AF%94%E4%BE%8B&source=supporter-summary",
      label: "練習「分數與比例」相關題目",
    });
  });

  it("does not route an unlabelled timeline fallback into a guessed practice topic", () => {
    const review = { ...availableReview, event: { ...availableReview.event, knowledge: "探索練習" } };
    expect(buildKnowledgePracticeRecommendation(review)).toMatchObject({
      status: "unavailable",
      message: expect.stringContaining("目前無法找到對應的練習題組"),
    });
  });
});
