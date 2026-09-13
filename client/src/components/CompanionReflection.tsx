import React from "react";
import { Sparkles } from "lucide-react";
import { reflectionWorkspace, type ReflectionContext } from "@/game/reflectionWorkspace";
import "./CompanionReflection.css";

export type CompanionReflectionProps = ReflectionContext;

/**
 * 答題後的「深度伴讀」入口：只負責在可堆疊卡片工作台開一張卡。
 * 同一題重複點擊只會把舊卡置頂；不同題會各自開卡、可並排對照。
 * 對話內容、LLM 呼叫與降級邏輯由 ReflectionWorkspace 統一處理。
 */
export function CompanionReflection(props: CompanionReflectionProps) {
  function openWorkspaceCard() {
    reflectionWorkspace.openCard({
      question: props.question,
      options: props.options,
      selectedIndex: props.selectedIndex,
      answerIndex: props.answerIndex,
      subject: props.subject,
      learningTopic: props.learningTopic,
    });
  }

  return (
    <div className="companion-reflect">
      <button
        type="button"
        className="companion-reflect-trigger"
        onClick={openWorkspaceCard}
        aria-haspopup="dialog"
      >
        <Sparkles size={16} aria-hidden="true" />
        和伴小星聊聊這題
      </button>
    </div>
  );
}

export default CompanionReflection;
