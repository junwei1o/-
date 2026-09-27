import React from "react";
import { SpeechReadableText } from "@/components/SpeechReadableText";
import type { PaperQuestion } from "@/lib/paperExam";

type Props = {
  /** 目前篩選後要顯示的錯題。 */
  questions: readonly PaperQuestion[];
  /** 這份試卷的答案表（題 id → 選項索引）。 */
  answers: Record<string, number>;
  /** 完整題組，用來顯示「第 N 題」。 */
  deck: readonly PaperQuestion[];
};

/**
 * 結算頁的錯題卡清單。
 *
 * 抽成 memo 元件是因為清單會隨意覦 AI 複習計畫（isPending/data/error）與
 * 篩選狀態一起重算；這些狀態變動與單張卡片無關，卻會讓整批卡片（含朗讀節點）
 * 全部重建。這裡只在「題目、答案、題組」三者真的變動時才重跑。
 */
function PaperWrongListInner({ questions, answers, deck }: Props) {
  return (
    <div className="paper-wrong-list">
      {questions.map((question) => {
        const selectedAnswer = answers[question.id];
        const isOrderQuestion = question.questionType === "排序題";
        const selectedText = isOrderQuestion
          ? selectedAnswer === 0 ? "順序正確" : "順序錯誤或未完成"
          : selectedAnswer !== undefined && selectedAnswer >= 0 ? question.options[selectedAnswer] : "（未作答）";
        const correctText = isOrderQuestion
          ? (question.orderItems ?? []).join(" → ")
          : question.options[question.answer];
        return (
          <article key={`summary-${question.id}`} className="paper-wrong-card">
            <p className="paper-question-meta">第 {deck.indexOf(question) + 1} 題 · {question.subject} · {question.learningTopic}{question.questionType === "填空題" ? " · 填空題" : isOrderQuestion ? " · 排序題" : ""}</p>
            <SpeechReadableText as="h3" text={question.prompt} label="錯題題目" className="paper-wrong-prompt" compact={false} />
            <div className="paper-wrong-answer-grid">
              <p><span>你的作答</span><SpeechReadableText as="strong" text={selectedText} label="你的作答" compact /></p>
              <p><span>正確答案</span><SpeechReadableText as="strong" text={correctText} label="正確答案" compact /></p>
            </div>
            {isOrderQuestion && (
              <ol className="paper-order-answer" style={{ margin: "4px 0 8px", paddingLeft: 20, fontSize: 14, lineHeight: 1.8 }}>
                {(question.orderItems ?? []).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
              </ol>
            )}
            <SpeechReadableText as="p" text={question.explanation} label="錯題詳細解析" className="paper-explanation" compact={false} />
          </article>
        );
      })}
    </div>
  );
}

export const PaperWrongList = React.memo(PaperWrongListInner);
