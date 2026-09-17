// 配對連連看獨立題庫（local-first）。不進後端 question_bank、不進戰鬥抽題，
// 僅由 /matching 活動頁與試卷卷末的「配對大題」使用，因此不影響主題庫的 10 個消費元件。
import bank from "../../../data/matching_bank.json";
import type { PaperSubject } from "./paperExam";

export type MatchingPair = { l: string; r: string };

export type MatchingSet = {
  id: string;
  subject: PaperSubject;
  grade: string;
  difficulty: "基礎" | "標準" | "挑戰";
  title: string;
  instruction: string;
  pairs: MatchingPair[];
  distractors: string[];
};

export type MatchingResult = {
  id: string;
  title: string;
  subject: PaperSubject;
  stars: 1 | 2 | 3;
  errors: number;
  timeMs: number;
};

/** 右欄項目：pair>=0 為某個配對的右值，pair===-1 為干擾項。 */
export type MatchingRightItem = { key: string; text: string; pair: number };
export type MatchingBoard = {
  leftOrder: number[];
  rightItems: MatchingRightItem[];
};

function isValidSet(value: unknown): value is MatchingSet {
  if (!value || typeof value !== "object") return false;
  const set = value as Record<string, unknown>;
  return (
    typeof set.id === "string" &&
    typeof set.title === "string" &&
    Array.isArray(set.pairs) &&
    set.pairs.length >= 4 &&
    set.pairs.every(
      (pair) =>
        Boolean(pair) &&
        typeof (pair as MatchingPair).l === "string" &&
        typeof (pair as MatchingPair).r === "string",
    ) &&
    Array.isArray(set.distractors)
  );
}

const rawSets = (bank as { sets?: unknown }).sets;
export const MATCHING_SETS: MatchingSet[] = Array.isArray(rawSets)
  ? (rawSets as unknown[]).filter(isValidSet)
  : [];

export const MATCHING_SUBJECTS: PaperSubject[] = ["國語", "數學", "社會", "自然", "英語"];

/** 可注入亂數的洗牌，測試能固定結果；其餘參數與陣列不被修改。 */
export function shuffleArray<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/** 建立一盤：左欄為打亂的配對左值，右欄為打亂的右值加上干擾項。 */
export function buildMatchingBoard(set: MatchingSet, random: () => number = Math.random): MatchingBoard {
  const leftOrder = shuffleArray(
    set.pairs.map((_, index) => index),
    random,
  );
  const rightItems = shuffleArray(
    [
      ...set.pairs.map((pair, index) => ({ key: `p${index}`, text: pair.r, pair: index })),
      ...set.distractors.map((text, index) => ({ key: `d${index}`, text, pair: -1 })),
    ],
    random,
  );
  return { leftOrder, rightItems };
}

/** 0 失誤三顆星、1–2 失誤兩顆星，其餘一顆星。 */
export function matchingStars(errors: number): 1 | 2 | 3 {
  if (errors <= 0) return 3;
  if (errors <= 2) return 2;
  return 1;
}

/** 依學科取一組配對題；綜合或沒有該科題目時，從全部題庫隨機挑選。 */
export function pickMatchingSet(
  subject?: PaperSubject | "綜合課綱" | null,
  random: () => number = Math.random,
): MatchingSet | null {
  if (MATCHING_SETS.length === 0) return null;
  const pool =
    !subject || subject === "綜合課綱"
      ? MATCHING_SETS
      : MATCHING_SETS.filter((set) => set.subject === subject);
  const candidates = pool.length > 0 ? pool : MATCHING_SETS;
  return candidates[Math.floor(random() * candidates.length)] ?? null;
}

export function formatMatchingTime(timeMs: number): string {
  const totalSeconds = Math.floor(timeMs / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}
