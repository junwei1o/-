import { useMemo } from "react";
import {
  FILL_QUESTIONS,
  ORDER_QUESTIONS,
  TRAP_QUESTIONS,
  fillToPaper,
  orderToPaper,
} from "./classroomBank";
import type { PaperQuestion } from "./paperExam";
import { useQuestionBank, type CurriculumQuestionRow } from "./questionBank";

/**
 * 錯題重練／畢業榜等頁面用來「用 id 找回題目」的查找表。
 *
 * 主題庫（useQuestionBank）只有 server 題庫與 runtime_bank，但試卷 deck 會另外混入
 * classroomBank 的 fill_bank / order_bank / trap_bank（見 paperExam.ts 的 mixPaperVariants）。
 * 這些題目答錯後一樣寫進錯題本，卻查不到 → 頁面只剩「（題目資料待補）」。
 * 因此查找表必須涵蓋試卷真正用得到的全部來源。
 */
export type LookupQuestion = PaperQuestion & { knowledge?: string[] };

/**
 * 建立 id → 題目 的查找表。
 * 以主題庫為底，再補上試卷會混入的填空／排序／陷阱題；id 衝突時以主題庫為準。
 */
export function buildQuestionLookup(
  rows: readonly CurriculumQuestionRow[],
): Map<string, LookupQuestion> {
  const lookup = new Map<string, LookupQuestion>();

  for (const row of rows) lookup.set(row.id, row);

  // 填空題（字卡）與陷阱題都是「四選一」結構，可直接共用 fillToPaper。
  for (const question of FILL_QUESTIONS) {
    if (!lookup.has(question.id)) lookup.set(question.id, fillToPaper(question));
  }
  for (const question of TRAP_QUESTIONS) {
    if (!lookup.has(question.id)) lookup.set(question.id, fillToPaper(question));
  }
  // 排序題沒有 options（orderToPaper 會留空、answer 固定 0），僅供顯示題幹與解析。
  for (const question of ORDER_QUESTIONS) {
    if (!lookup.has(question.id)) lookup.set(question.id, orderToPaper(question));
  }

  return lookup;
}

/** 取得題目查找表；主題庫到位後會重新計算一次。 */
export function useQuestionLookup(): Map<string, LookupQuestion> {
  const { questions } = useQuestionBank();
  return useMemo(() => buildQuestionLookup(questions), [questions]);
}

export type { CurriculumQuestionRow };
