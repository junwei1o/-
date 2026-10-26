import React, { useMemo } from "react";
import { useLocation } from "wouter";
import { useQuestionBank } from "@/lib/questionBank";
import { familySiblingIds, type VariantLike } from "@/lib/variantFamily";
import type { PaperQuestion } from "@/lib/paperExam";
import "./WrongQuestionRelation.css";

/**
 * 錯題「知識關聯」（2026-10-26 Phase 1）。
 *
 * 三個區塊，全部**優雅降級**（找不到資料就不渲染，不編造）：
 * 1. 知識點標籤 —— 來自 `knowledge`（作答紀錄裡就有）
 * 2. 關聯題目 —— 優先 `variantOf` 同家族；次之同 `learningTopic`；都沒有就不顯示
 * 3. 錯誤分析 —— 來自 `strongDistractor`；題庫沒有該欄位時顯示「暫無詳細解析」
 *
 * 刻意不新增後端端點：關聯題目從**已載入的前端題庫**挑（3175 題都在本地 chunk），
 * 零往返、零成本。家族解析走 `lib/variantFamily` 單一真相，
 * 與 `targetedPractice` 的層 0、`adaptiveScheduler` 共用同一份邏輯。
 */

type Props = {
  /** 這道錯題的 id */
  questionId: string;
  /** 作答紀錄裡的知識點 */
  knowledge: string[];
  /** 這題的科目（用於同年級/同科目過濾） */
  subject: string;
};

export default function WrongQuestionRelation({ questionId, knowledge, subject }: Props) {
  const [, setLocation] = useLocation();
  const { questions } = useQuestionBank();

  const source = useMemo(
    () => (questions as unknown as PaperQuestion[]).find((q) => q.id === questionId),
    [questions, questionId],
  );

  const byId = useMemo(() => {
    const map = new Map<string, VariantLike>();
    for (const q of questions) map.set(q.id, q as unknown as VariantLike);
    return map;
  }, [questions]);

  /** 關聯題目：家族優先 → 同知識點次之 → 最多 3 題 */
  const related = useMemo(() => {
    if (!source) return [] as PaperQuestion[];
    const pool = questions as unknown as PaperQuestion[];

    // 第 1 層：variantOf 同家族
    const familyIds = familySiblingIds(source as unknown as VariantLike, byId);
    const family = pool
      .filter((q) => familyIds.includes(q.id) && q.id !== questionId && q.subject === source.subject)
      .slice(0, 3);
    if (family.length >= 2) return family;

    // 第 2 層：同 knowledge 標籤（取作答紀錄裡的知識點）
    if (knowledge.length > 0) {
      const sameTopic = pool.filter(
        (q) =>
          q.id !== questionId &&
          q.grade === source.grade &&
          q.subject === source.subject &&
          (q as unknown as { knowledge?: string[] }).knowledge?.some((k) => knowledge.includes(k)),
      );
      const merged = [...family];
      for (const item of sameTopic) {
        if (merged.length >= 3) break;
        if (!merged.some((m) => m.id === item.id)) merged.push(item);
      }
      if (merged.length > 0) return merged.slice(0, 3);
    }

    return family.slice(0, 3);
  }, [source, questions, byId, knowledge, questionId]);

  /** 錯誤分析：題庫有 strongDistractor 才顯示 */
  const distractor = (source as unknown as { strongDistractor?: { optionIndex: number; note: string } })
    ?.strongDistractor;

  const startRelated = (q: PaperQuestion) => {
    const query = new URLSearchParams({
      reviewTopic: q.learningTopic,
      subjectScope: q.subject,
    });
    setLocation(`/practice?${query.toString()}`);
  };

  return (
    <div className="wqr-root">
      {/* ── 知識點 ── */}
      <section className="wqr-block" aria-labelledby={`wqr-k-${questionId}`}>
        <h4 id={`wqr-k-${questionId}`} className="wqr-label">知識點</h4>
        <div className="wqr-tags">
          {knowledge.length > 0 ? (
            knowledge.slice(0, 4).map((tag) => (
              <span className="wqr-tag" key={tag}>{tag}</span>
            ))
          ) : (
            <span className="wqr-muted">此題未標註知識點</span>
          )}
          {source && <span className="wqr-tag wqr-tag--meta">{source.grade} 年級 · {subject}</span>}
        </div>
      </section>

      {/* ── 錯誤分析（優雅降級）── */}
      <section className="wqr-block" aria-labelledby={`wqr-e-${questionId}`}>
        <h4 id={`wqr-e-${questionId}`} className="wqr-label">為什麼錯</h4>
        {distractor ? (
          <p className="wqr-explain">{distractor.note}</p>
        ) : (
          <p className="wqr-muted">這題暫無選項級解析，請對照上方正確答案與解析。</p>
        )}
      </section>

      {/* ── 關聯題目 ── */}
      {related.length > 0 && (
        <section className="wqr-block" aria-labelledby={`wqr-r-${questionId}`}>
          <h4 id={`wqr-r-${questionId}`} className="wqr-label">
            立刻鞏固
            <span className="wqr-label-note">{related.length} 題同知識點</span>
          </h4>
          <ul className="wqr-related-list">
            {related.map((q) => (
              <li key={q.id} className="wqr-related-row">
                <span className="wqr-related-prompt">{q.prompt}</span>
                <button
                  type="button"
                  className="wqr-related-btn"
                  onClick={() => startRelated(q)}
                  aria-label={`開始練習：${q.prompt.slice(0, 24)}`}
                >
                  練習
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
