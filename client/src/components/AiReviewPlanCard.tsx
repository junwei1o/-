import { ChevronDown, RotateCcw, Sparkles } from "lucide-react";
import type { KnowledgeMasterySummary } from "@/lib/paperExam";
import { SpeechReadableText } from "@/components/SpeechReadableText";
import React, { useEffect, useState } from "react";

export type AiReviewPlan = {
  title: string;
  summary: string;
  focusAreas: Array<{ topic: string; reason: string }>;
  stages: Array<{ key: "orientation" | "practice" | "check"; label: string; instruction: string }>;
  encouragement: string;
  selfCheck: {
    difficulty: "基礎" | "標準" | "挑戰";
    optionCount: 2 | 3 | 4;
    prompt: string;
    options: string[];
    correctOption: number;
    explanation: string;
      encouragement: string;
    hints: string[];
  };
};

type AiReviewPlanCardProps = {
  isPending: boolean;
  error: boolean;
  data?: AiReviewPlan;
  filteredCount: number;
  knowledgeMastery?: KnowledgeMasterySummary[];
  onRetry: () => void;
};

const stageOrder = ["orientation", "practice", "check"] as const;

export function AiReviewPlanCard({ isPending, error, data, filteredCount, knowledgeMastery = [], onRetry }: AiReviewPlanCardProps) {
  const [revealStage, setRevealStage] = useState(0);
  const [selectedSelfCheck, setSelectedSelfCheck] = useState<number | null>(null);
  const [revealedHintCount, setRevealedHintCount] = useState(0);

  useEffect(() => {
    setRevealStage(0);
    setSelectedSelfCheck(null);
    setRevealedHintCount(0);
  }, [data, filteredCount]);

  const handleRetry = () => {
    setRevealStage(0);
    onRetry();
  };

  return (
    <aside className="ai-review-plan-card" aria-live="polite" aria-labelledby="ai-review-plan-title">
      <div className="ai-review-plan-head">
        <div>
          <p className="eyebrow">AI FIELD COACH / 複習導航</p>
          <strong id="ai-review-plan-title">{data?.title ?? "你的錯題複習導航"}</strong>
        </div>
        <Sparkles size={18} aria-hidden="true" />
      </div>
      {isPending ? (
        <p className="ai-review-plan-status">正在讀取目前篩選出的 {filteredCount} 題，整理一條短短的複習路線……</p>
      ) : error ? (
        <div className="ai-review-plan-error">
          <p>AI 複習建議暫時沒有回來，錯題解析仍可照常使用。</p>
          <button type="button" className="text-btn" onClick={handleRetry}>重新整理複習建議 <RotateCcw size={14} /></button>
        </div>
      ) : data ? (
        <div className="ai-review-plan-content">
          <SpeechReadableText as="p" text={data.summary} label="AI 複習總結" className="ai-review-plan-summary" compact={false} />
          <div className="ai-review-focus-list" aria-label="優先複習重點">
            {data.focusAreas.map((area) => <div key={`${area.topic}-${area.reason}`}><strong>{area.topic}</strong><span>{area.reason}</span></div>)}
          </div>
          <section className="ai-review-mastery-panel" aria-labelledby="ai-review-mastery-title">
            <div className="ai-review-section-heading">
              <div><p className="eyebrow">KNOWLEDGE MASTERY / 知識點</p><strong id="ai-review-mastery-title">目前掌握狀態</strong></div>
              <span className="ai-review-neutral-note">依作答表現整理</span>
            </div>
            <p className="ai-review-mastery-note">這裡只反映錯題中的知識點掌握狀態；使用提示是學習選擇，不會扣分。</p>
            {knowledgeMastery.length > 0 ? (
              <div className="ai-review-mastery-list">
                {knowledgeMastery.map((item) => <div className="ai-review-mastery-item" key={item.topic}><span className={`ai-review-mastery-status is-${item.status === "待加強" ? "needs-work" : "practising"}`}>{item.status}</span><div><strong>{item.topic}</strong><small>{item.detail}</small></div></div>)}
              </div>
            ) : <p className="ai-review-mastery-empty">目前沒有足夠的錯題資料可整理熟練度。</p>}
          </section>
          <div className="ai-review-plan-stages">
            {stageOrder.slice(0, revealStage + 1).map((key) => {
              const stage = data.stages.find((item) => item.key === key);
              if (!stage) return null;
              return <div className={`ai-review-stage ai-review-stage-${key}`} key={stage.key}><span>{stage.label}</span><SpeechReadableText as="p" text={stage.instruction} label={`${stage.label}複習建議`} compact={false} /></div>;
            })}
          </div>
          {revealStage < stageOrder.length - 1 ? (
            <button type="button" className="btn primary small" onClick={() => setRevealStage((stage) => Math.min(stage + 1, stageOrder.length - 1))}>看下一小步 <ChevronDown size={15} /></button>
          ) : (
            <>
              <SpeechReadableText as="p" text={data.encouragement} label="AI 複習鼓勵" className="ai-review-plan-encouragement" compact={false} />
              <section className="ai-review-self-check" aria-labelledby="ai-review-self-check-title">
                <div className="ai-review-self-check-heading">
                  <div>
                    <p className="eyebrow">最後一小題 / SELF CHECK</p>
                    <strong id="ai-review-self-check-title">用一題確認自己</strong>
                  </div>
                  <span className="ai-review-self-check-badge">{data.selfCheck.difficulty} · {data.selfCheck.optionCount} 選一</span>
                </div>
                <SpeechReadableText as="p" text={data.selfCheck.prompt} label="自我檢查題目" className="ai-review-self-check-prompt" compact={false} />
                {data.selfCheck.difficulty === "挑戰" && data.selfCheck.hints.length > 0 && (
                  <div className="ai-review-self-check-hints" aria-label="挑戰題提示">
                    {data.selfCheck.hints.slice(0, revealedHintCount).map((hint, index) => (
                      <div className="ai-review-self-check-hint" key={`${hint}-${index}`}>
                        <span className="ai-review-self-check-hint-used" aria-label={`已使用提示，階段 ${index + 1}；提示不扣分`}>已使用提示 · 階段 {index + 1}</span>
                        <SpeechReadableText as="p" text={hint} label={`挑戰題提示 ${index + 1}`} compact={false} />
                      </div>
                    ))}
                    {revealedHintCount < data.selfCheck.hints.length && (
                      <button type="button" className="text-btn ai-review-self-check-hint-button" onClick={() => setRevealedHintCount((count) => Math.min(count + 1, data.selfCheck.hints.length))}>
                        {revealedHintCount === 0 ? "需要時查看提示" : "再看一個提示"} <ChevronDown size={14} />
                      </button>
                    )}
                  </div>
                )}
                <div className="ai-review-self-check-options" role="group" aria-label="自我檢查選項">
                  {data.selfCheck.options.map((option, index) => {
                    const isSelected = selectedSelfCheck === index;
                    const isCorrect = index === data.selfCheck.correctOption;
                    const stateClass = selectedSelfCheck === null ? "" : isCorrect ? " is-correct" : isSelected ? " is-wrong" : " is-muted";
                    return <button type="button" key={`${option}-${index}`} className={`ai-review-self-check-option${stateClass}`} aria-pressed={isSelected} onClick={() => setSelectedSelfCheck(index)}><span>{String.fromCharCode(65 + index)}</span><SpeechReadableText as="em" text={option} label={`自我檢查選項 ${String.fromCharCode(65 + index)}`} compact={false} /></button>;
                  })}
                </div>
                {selectedSelfCheck !== null && (
                  <div className={`ai-review-self-check-feedback ${selectedSelfCheck === data.selfCheck.correctOption ? "is-correct" : "is-wrong"}`} role="status">
                    <strong>{selectedSelfCheck === data.selfCheck.correctOption ? "掌握得很好！" : "再想一下也沒關係"}</strong>
                    <SpeechReadableText as="p" text={data.selfCheck.explanation} label="自我檢查解析" compact={false} />
                    <SpeechReadableText as="p" text={data.selfCheck.encouragement} label="自我檢查鼓勵" className="ai-review-plan-encouragement" compact={false} />
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      ) : (
        <div className="ai-review-plan-error"><p>先選好想複習的錯題範圍，AI Tutor 會整理一條短路線。</p><button type="button" className="text-btn" onClick={onRetry}>產生複習建議 <Sparkles size={14} /></button></div>
      )}
    </aside>
  );
}
