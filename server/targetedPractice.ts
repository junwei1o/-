/**
 * 針對性練習備用題庫（錯題頂替用）
 *
 * 為什麼要獨立於主庫：主庫 `taiwan_curriculum_500.json` 是正式試卷與作業的題源，
 * 必須保持穩定、可比較（同一份卷重複練才有進步的基準）。孩子答錯一題時，
 * 若下次又出同一題，他會記答案而不是學概念；但把備用題混進主庫，
 * 又會讓正式卷的組成一直變動。
 *
 * 因此備用題庫分開存放，只在「錯題重練」時頂替原題：
 *   - 數值題以「同題型換變數」為主（換數字、換情境，答案離線重算並驗證過）
 *   - 概念題則提供同知識點、不同問法的新題
 *
 * 本模組只負責載入與驗證；挑題策略在 client 端的 targetedPractice.ts。
 */
import practiceSeed from "../data/targeted_practice.json";

export type TargetedPracticeItem = {
  id: string;
  subject: string;
  grade: number;
  difficulty: string;
  curriculumDomain: string;
  learningTopic: string;
  learningPerformance: string;
  learningContent: string;
  competency: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  knowledge: string[];
  /** 若這題是主庫某題的換變數版本，指向該題 id；否則為 null。 */
  variantOf: string | null;
};

const SUBJECTS = new Set(["數學", "自然", "社會", "國語"]);

function isValidItem(value: unknown): value is TargetedPracticeItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.subject === "string" &&
    SUBJECTS.has(item.subject) &&
    Number.isInteger(item.grade) &&
    typeof item.difficulty === "string" &&
    typeof item.curriculumDomain === "string" &&
    typeof item.learningTopic === "string" &&
    item.learningTopic.length > 0 &&
    typeof item.prompt === "string" &&
    item.prompt.length > 0 &&
    typeof item.explanation === "string" &&
    Number.isInteger(item.answer) &&
    Array.isArray(item.options) &&
    item.options.length === 4 &&
    item.options.every((option) => typeof option === "string" && option.length > 0) &&
    new Set(item.options as string[]).size === 4 &&
    (item.answer as number) >= 0 &&
    (item.answer as number) < 4 &&
    Array.isArray(item.knowledge) &&
    (item.variantOf === null || typeof item.variantOf === "string")
  );
}

/** 通過驗證的備用題；格式不對的整筆略過，不讓壞資料進到孩子的練習裡。 */
export const TARGETED_PRACTICE_ITEMS: readonly TargetedPracticeItem[] = (() => {
  const seed = practiceSeed as { items?: unknown };
  const items = Array.isArray(seed.items) ? seed.items : [];
  return items.filter(isValidItem);
})();

/** 依知識點取替補題（供維運或除錯時看覆蓋率）。 */
export function getTargetedPracticeByTopic(subject: string, learningTopic: string): TargetedPracticeItem[] {
  return TARGETED_PRACTICE_ITEMS.filter(
    (item) => item.subject === subject && item.learningTopic === learningTopic,
  );
}

export function summarizeTargetedPractice(): {
  total: number;
  withVariantSource: number;
  bySubject: Record<string, number>;
  topics: number;
} {
  const bySubject: Record<string, number> = {};
  const topics = new Set<string>();
  let withVariantSource = 0;
  for (const item of TARGETED_PRACTICE_ITEMS) {
    bySubject[item.subject] = (bySubject[item.subject] ?? 0) + 1;
    topics.add(`${item.subject}/${item.learningTopic}`);
    if (item.variantOf) withVariantSource += 1;
  }
  return { total: TARGETED_PRACTICE_ITEMS.length, withVariantSource, bySubject, topics: topics.size };
}
