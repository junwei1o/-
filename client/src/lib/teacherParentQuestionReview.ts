import type { SupporterTimelineEvent } from "@/lib/teacherParentTimeline";

export type TimelineQuestionBankRow = {
  id: string;
  prompt: string;
  options?: unknown;
  answer?: string | null;
  explanation?: string | null;
};

export type TimelineQuestionReview =
  | {
      status: "available";
      event: SupporterTimelineEvent;
      prompt: string;
      options: string[];
      answer: string | null;
      explanation: string | null;
      responseNote: string;
      selectionNote: string;
      readout: string;
    }
  | {
      status: "unavailable";
      event: SupporterTimelineEvent;
      message: string;
      readout: string;
    };

function normalizeOptions(options: unknown) {
  return Array.isArray(options) ? options.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 8) : [];
}

/**
 * 將時間軸節點與正式題庫以 questionId 對照。學生的既有本機足跡並未保存選項，
 * 因此此處只呈現可驗證的題目內容與作答結果，絕不推測學生曾選擇的答案。
 */
export function buildTimelineQuestionReview(event: SupporterTimelineEvent, questionBank: readonly TimelineQuestionBankRow[]): TimelineQuestionReview {
  const question = questionBank.find((item) => item.id === event.questionId);
  if (!question || !question.prompt.trim()) {
    const message = "這筆足跡仍保留在時間軸中，但目前無法從正式題庫回查題幹，因此不顯示推測的題目內容。";
    return { status: "unavailable", event, message, readout: `${event.subject}島的${event.knowledge}。${message}` };
  }

  const options = normalizeOptions(question.options);
  const responseNote = event.correct ? "本次作答結果：完成一次練習。" : "本次作答結果：已留下這次練習足跡。";
  const selectionNote = "學生實際選項：這份既有本機紀錄未保存選項內容，因此不推測或補寫答案。";
  const answer = typeof question.answer === "string" && question.answer.trim() ? question.answer : null;
  const explanation = typeof question.explanation === "string" && question.explanation.trim() ? question.explanation : null;
  return {
    status: "available",
    event,
    prompt: question.prompt,
    options,
    answer,
    explanation,
    responseNote,
    selectionNote,
    readout: `${event.subject}島，${event.knowledge}的相關題目。題目是：${question.prompt}。${responseNote}${selectionNote}`,
  };
}
