import React from "react";
import type { PaperQuestion } from "@/lib/paperExam";
import "./classroom.css";

type Props = {
  question: PaperQuestion;
  /** 已選擇的字卡 index；未定義表示尚未作答。 */
  selected?: number;
  answered: boolean;
  onPick: (index: number) => void;
};

/**
 * 填空選字（試卷內嵌單題）：題目中的 ____ 顯示為空格，下方字卡點選填入。
 * 資料結構與選擇題同構（options/answer），作答、計分完全沿用試卷流程。
 */
export default function FillBlank({ question, selected, answered, onPick }: Props) {
  const parts = question.prompt.split("____");
  const chosen = selected !== undefined ? question.options[selected] : "";

  let blankCls = "cr-fill-blank";
  if (answered) blankCls += selected === question.answer ? " is-correct" : " is-wrong";

  return (
    <div className="cr-fill" aria-label="填空選字題">
      <p className="cr-q-prompt" style={{ fontSize: 18 }}>
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className={blankCls}>{answered && selected !== question.answer
                ? question.options[question.answer]
                : chosen || "　　"}</span>
            )}
          </span>
        ))}
      </p>
      <div className="cr-fill-cards" role="group" aria-label="字卡選項">
        {question.options.map((option, index) => {
          let cls = "cr-fill-card";
          if (answered) {
            if (index === question.answer) cls += " is-correct";
            else if (index === selected) cls += " is-wrong";
            else cls += "";
          }
          return (
            <button
              type="button"
              key={`${question.id}-${option}`}
              className={cls}
              disabled={answered}
              onClick={() => onPick(index)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
