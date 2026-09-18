import React, { useMemo, useState } from "react";
import { shuffleArray } from "@/lib/matchingBank";
import type { PaperQuestion } from "@/lib/paperExam";
import "./classroom.css";

type Props = {
  question: PaperQuestion;
  /** 外部已結算（作答完成或 30 秒時間到）。 */
  answered: boolean;
  /** 玩家確認順序後回報正誤；由試卷寫入 answers（答對 0／答錯 -1）。 */
  onResolve: (correct: boolean) => void;
};

/**
 * 排序題（試卷內嵌單題）：把打亂的片段依正確先後順序點選排列，
 * 可點已選項目撤回，選滿後確認；答錯會並列正確順序供對照。
 */
export default function OrderSteps({ question, answered, onResolve }: Props) {
  const correctOrder = question.orderItems ?? [];
  const [pool] = useState<string[]>(() => shuffleArray(correctOrder));
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const locked = checked || answered;
  const pickedItems = picked.map((poolIndex) => pool[poolIndex]);
  const allPicked = picked.length === pool.length;

  function add(poolIndex: number) {
    if (locked || picked.includes(poolIndex)) return;
    setPicked((prev) => [...prev, poolIndex]);
  }

  function remove(seqIndex: number) {
    if (locked) return;
    setPicked((prev) => prev.filter((_, i) => i !== seqIndex));
  }

  function reset() {
    if (locked) return;
    setPicked([]);
  }

  function confirm() {
    if (!allPicked || checked) return;
    const correct = pickedItems.every((item, i) => item === correctOrder[i]);
    setChecked(true);
    setIsCorrect(correct);
    onResolve(correct);
  }

  const slots = useMemo(() => Array.from({ length: pool.length }, (_, i) => i), [pool.length]);

  return (
    <div className="cr-order" aria-label="排序題">
      <p className="cr-q-prompt" style={{ fontSize: 17 }}>{question.prompt}</p>

      {/* 順序區 */}
      <div className="cr-order-seq" role="list" aria-label="你排出的順序">
        {slots.map((slotIndex) => {
          const item = pickedItems[slotIndex];
          let cls = "cr-order-slot";
          if (locked) {
            // 時間到（未確認）一律當錯誤顯示；已確認則逐項比對。
            const right = checked ? item === correctOrder[slotIndex] : false;
            cls += item ? (right ? " is-correct" : " is-wrong") : " empty";
          } else {
            cls += item ? " is-picked" : " empty";
          }
          return (
            <div className={cls} key={slotIndex} role="listitem">
              <span className="cr-order-no">{slotIndex + 1}</span>
              {item ? (
                <button
                  type="button"
                  className="cr-order-item-inner"
                  style={{ border: "none", background: "transparent", font: "inherit", fontWeight: 800, textAlign: "left", cursor: locked ? "default" : "pointer", color: "inherit", padding: 0, flex: 1 }}
                  onClick={() => remove(slotIndex)}
                  disabled={locked}
                  aria-label={`第 ${slotIndex + 1} 個，${item}，點擊撤回`}
                >
                  {item}
                </button>
              ) : (
                <span>第 {slotIndex + 1} 個順位</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 待排序項目池 */}
      <div className="cr-order-pool" role="group" aria-label="待排序的項目">
        {pool.map((item, poolIndex) => {
          const used = picked.includes(poolIndex);
          return (
            <button
              type="button"
              key={`${item}-${poolIndex}`}
              className="cr-order-item"
              style={{ visibility: used ? "hidden" : "visible" }}
              disabled={locked || used}
              onClick={() => add(poolIndex)}
            >
              <span className="cr-order-no" style={{ background: "var(--cr-sea)" }}>＋</span>
              <span>{item}</span>
            </button>
          );
        })}
      </div>

      {!locked && (
        <div className="cr-order-actions">
          <button type="button" className="cr-btn-ghost" onClick={reset} disabled={picked.length === 0}>重排</button>
          <button type="button" className="cr-btn sea" onClick={confirm} disabled={!allPicked}>
            確認順序
          </button>
        </div>
      )}

      {locked && (
        <div role="status">
          <p className={`cr-hint ${isCorrect && checked ? "is-ok" : "is-no"}`}>
            {checked && isCorrect ? "順序完全正確！" : "正確順序應該是這樣："}
          </p>
          {!(checked && isCorrect) && (
            <div className="cr-order-seq" aria-label="正確順序">
              {correctOrder.map((item, i) => (
                <div className="cr-order-slot is-correct" key={`correct-${i}`}>
                  <span className="cr-order-no">{i + 1}</span>
                  <span style={{ fontWeight: 800 }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
