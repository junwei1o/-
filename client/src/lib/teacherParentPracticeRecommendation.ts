import type { TimelineQuestionReview } from "@/lib/teacherParentQuestionReview";

export type KnowledgePracticeRecommendation =
  | {
      status: "available";
      href: string;
      label: string;
      ariaLabel: string;
      readout: string;
    }
  | {
      status: "unavailable";
      message: string;
      readout: string;
    };

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * 僅使用已由時間軸與正式題庫交叉確認的作答事件建立練習入口。
 * PaperExam 既有支援 subject + reviewTopic 的聚焦複習流程，因此不另建題組或推測內容。
 */
export function buildKnowledgePracticeRecommendation(review: Extract<TimelineQuestionReview, { status: "available" }>): KnowledgePracticeRecommendation {
  const subject = normalizeText(review.event.subject);
  const knowledge = normalizeText(review.event.knowledge);

  if (!subject || !knowledge || knowledge === "探索練習") {
    const message = "目前無法找到對應的練習題組，因為這筆可回顧資料沒有可用的知識點。";
    return { status: "unavailable", message, readout: message };
  }

  const params = new URLSearchParams({
    subject,
    reviewTopic: knowledge,
    source: "supporter-summary",
  });
  const label = `練習「${knowledge}」相關題目`;
  return {
    status: "available",
    href: `/?${params.toString()}`,
    label,
    ariaLabel: `前往${subject}科${knowledge}相關題目練習`,
    readout: `可前往${subject}科，練習${knowledge}相關題目。`,
  };
}
