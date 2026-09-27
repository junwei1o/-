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
export type LookupQuestion = PaperQuestion & {
  knowledge?: string[];
  /**
   * 課綱領域。主題庫的題目自帶；classroomBank（fill/trap）原本沒有這一欄，
   * 這裡依科目補上，錯題／複習寫回紀錄時才不會全部落到「綜合領域」。
   */
  curriculumDomain?: string;
};

/** 科目 → 課綱領域，與題庫既有標記一致（英語與國語同屬語文領域）。 */
const DOMAIN_BY_SUBJECT: Record<string, string> = {
  國語: "語文領域",
  英語: "語文領域",
  數學: "數學領域",
  社會: "社會領域",
  自然: "自然科學領域",
};

function withDomain(question: PaperQuestion): LookupQuestion {
  return { ...question, curriculumDomain: DOMAIN_BY_SUBJECT[question.subject] ?? "綜合領域" };
}

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
    if (!lookup.has(question.id)) lookup.set(question.id, withDomain(fillToPaper(question)));
  }
  for (const question of TRAP_QUESTIONS) {
    if (!lookup.has(question.id)) lookup.set(question.id, withDomain(fillToPaper(question)));
  }
  // 排序題沒有 options（orderToPaper 會留空、answer 固定 0），僅供顯示題幹與解析。
  for (const question of ORDER_QUESTIONS) {
    if (!lookup.has(question.id)) lookup.set(question.id, withDomain(orderToPaper(question)));
  }

  return lookup;
}

/** 取得題目查找表；主題庫到位後會重新計算一次。 */
export function useQuestionLookup(): Map<string, LookupQuestion> {
  const { questions } = useQuestionBank();
  return useMemo(() => buildQuestionLookup(questions), [questions]);
}

export type { CurriculumQuestionRow };
