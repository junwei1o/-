// C 分類歸位獨立題庫（local-first）。與配對題庫同層級，僅由 /matching 的分類歸位模式使用。
import sortBank from "../../../data/sort_bank.json";
import type { PaperSubject } from "./paperExam";
import { shuffleArray } from "./matchingBank";

export type SortCategory = { name: string; items: string[] };
export type SortSet = {
  id: string;
  subject: PaperSubject;
  grade: string;
  difficulty: "基礎" | "標準" | "挑戰";
  title: string;
  instruction: string;
  categories: SortCategory[];
};

/** 散落項目：category 為所屬分類籃索引。 */
export type SortItem = { key: string; text: string; category: number };
export type SortBoard = {
  items: SortItem[];
  categories: SortCategory[];
};

export type SortResult = {
  id: string;
  title: string;
  subject: PaperSubject;
  stars: 1 | 2 | 3;
  errors: number;
  timeMs: number;
  /** 30 秒倒數用盡時為 true；時間到一律記 1 星。 */
  timedOut?: boolean;
};

function isValidSortSet(value: unknown): value is SortSet {
  if (!value || typeof value !== "object") return false;
  const set = value as Record<string, unknown>;
  return (
    typeof set.id === "string" &&
    typeof set.title === "string" &&
    Array.isArray(set.categories) &&
    set.categories.length >= 2 &&
    set.categories.every(
      (category) =>
        Boolean(category) &&
        typeof (category as SortCategory).name === "string" &&
        Array.isArray((category as SortCategory).items) &&
        (category as SortCategory).items.length >= 1 &&
        (category as SortCategory).items.every((item) => typeof item === "string"),
    )
  );
}

const rawSortSets = (sortBank as { sets?: unknown }).sets;
export const SORT_SETS: SortSet[] = Array.isArray(rawSortSets)
  ? (rawSortSets as unknown[]).filter(isValidSortSet)
  : [];

/** 建立一盤：全部項目標記所屬分類後打散；分類籃依原始順序。 */
export function buildSortBoard(set: SortSet, random: () => number = Math.random): SortBoard {
  const items: SortItem[] = [];
  set.categories.forEach((category, index) => {
    category.items.forEach((text) => items.push({ key: `${index}-${text}`, text, category: index }));
  });
  return {
    items: shuffleArray(items, random),
    categories: set.categories,
  };
}

/** 沿用配對星等：0 失誤 3 星、≤2 失誤 2 星、其餘 1 星。 */
export function sortStars(errors: number): 1 | 2 | 3 {
  if (errors <= 0) return 3;
  if (errors <= 2) return 2;
  return 1;
}
