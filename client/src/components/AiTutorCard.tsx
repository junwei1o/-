import { ChevronDown, Lightbulb, RotateCcw, Sparkles } from "lucide-react";
import { SpeechReadableText } from "@/components/SpeechReadableText";
import React, { useEffect, useState } from "react";

type AiTutorResult = {
  initialHint: string;
  advancedHint: string;
  steps: string[];
  explanation: string;
  misconception: string;
  encouragement: string;
};

type AiTutorCardProps = {
  isPending: boolean;
  error: boolean;
  data?: AiTutorResult;
  onRetry: () => void;
};

export function AiTutorCard({ isPending, error, data, onRetry }: AiTutorCardProps) {
  const [revealStage, setRevealStage] = useState<"initial" | "advanced" | "full">("initial");

  useEffect(() => {
    setRevealStage("initial");
  }, [data]);

  const handleRetry = () => {
    setRevealStage("initial");
    onRetry();
  };

  return (
    <div className="ai-tutor-card" aria-live="polite">
      <div className="ai-tutor-head">
        <div><p className="eyebrow">AI FIELD COACH</p><strong>錯題學習助手</strong></div>
        <Sparkles size={18} />
      </div>
      {isPending ? (
        <p className="ai-tutor-status">正在根據這道題的課綱內容整理提示……</p>
      ) : error ? (
        <div className="ai-tutor-error"><p>AI 解析暫時沒有回來，先參考上方課綱解析。</p><button className="text-btn" onClick={handleRetry}>重新取得 AI 解析 <RotateCcw size={14} /></button></div>
      ) : data ? (
        <div className="ai-tutor-content">
          <div className="ai-hint">
            <strong><Lightbulb size={15} /> 初步提示</strong>
            <div className="ai-tutor-readable"><SpeechReadableText as="p" text={data.initialHint} label="初步提示" compact /></div>
          </div>
          {revealStage === "initial" ? (
            <button className="btn primary small" onClick={() => setRevealStage("advanced")}>還需要一點幫助：顯示進階提示 <ChevronDown size={15} /></button>
          ) : (
            <div className="ai-hint ai-hint-advanced">
              <strong><Lightbulb size={15} /> 進階提示</strong>
              <div className="ai-tutor-readable"><SpeechReadableText as="p" text={data.advancedHint} label="進階提示" compact /></div>
            </div>
          )}
          {revealStage === "advanced" ? <button className="btn primary small" onClick={() => setRevealStage("full")}>我想過了，查看完整解答 <ChevronDown size={15} /></button> : null}
          {revealStage === "full" ? (
            <>
              <div>
                <div className="ai-tutor-readable"><strong>解題航線</strong></div>
                <ol>{data.steps.map((step, index) => <li key={`${index}-${step}`}><SpeechReadableText as="span" text={step} label={`解題步驟 ${index + 1}`} compact /></li>)}</ol>
              </div>
              <div>
                <div className="ai-tutor-readable"><strong>詳細解答</strong></div>
                <SpeechReadableText as="p" text={data.explanation} label="詳細解答" compact />
              </div>
              <div className="ai-misconception">
                <div className="ai-tutor-readable"><strong>容易混淆的地方</strong></div>
                <SpeechReadableText as="p" text={data.misconception} label="容易混淆的地方" compact />
              </div>
              <div className="ai-tutor-readable"><SpeechReadableText as="p" text={data.encouragement} label="鼓勵訊息" className="ai-encouragement" compact /></div>
              <button className="text-btn" onClick={() => setRevealStage("advanced")}>收起完整解答 <ChevronDown size={14} /></button>
            </>
          ) : null}
        </div>
      ) : (
        <div className="ai-tutor-error"><p>這題需要一點額外線索嗎？</p><button className="text-btn" onClick={handleRetry}>取得 AI 提示 <Sparkles size={14} /></button></div>
      )}
    </div>
  );
}

export type { AiTutorResult };
