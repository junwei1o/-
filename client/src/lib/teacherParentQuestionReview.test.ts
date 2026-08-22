import { describe, expect, it } from "vitest";
import { buildTimelineQuestionReview } from "./teacherParentQuestionReview";
import type { SupporterTimelineEvent } from "./teacherParentTimeline";

const event: SupporterTimelineEvent = {
  id: "math-1-1-0", questionId: "math-1", timestamp: 1, islandId: "math", subject: "數學", islandTitle: "數學城", knowledge: "分數與比例", activityLabel: "完成一次練習", correct: true,
};

describe("buildTimelineQuestionReview", () => {
  it("returns only formal question content plus an honest note when selection history was not stored", () => {
    const review = buildTimelineQuestionReview(event, [{ id: "math-1", prompt: "一個披薩切成四等分，吃了兩片是幾分之幾？", options: ["1/2", "1/4"], answer: "1/2", explanation: "兩片是四片中的二片。" }]);

    expect(review.status).toBe("available");
    if (review.status === "available") {
      expect(review.options).toEqual(["1/2", "1/4"]);
      expect(review.selectionNote).toContain("未保存選項");
      expect(review.readout).toContain("披薩");
    }
  });

  it("does not fabricate a prompt when the recorded question no longer exists in the formal bank", () => {
    const review = buildTimelineQuestionReview(event, []);

    expect(review.status).toBe("unavailable");
    expect(review.message).toContain("不顯示推測");
  });
});

