// 配對連連看獨立題庫（local-first）。不進後端 question_bank、不進戰鬥抽題，
// 僅由 /matching 活動頁與試卷卷末的「配對大題」使用，因此不影響主題庫的 10 個消費元件。
import bank from "../../../data/matching_bank.json";
// 擴充配對組：各科更多的「內容配對」（原本只有 30 組，一科 6 組太少）。
import extraBank from "../../../data/matching_bank_extra.json";
import imageBank from "../../../data/image_bank.json";
import type { PaperSubject } from "./paperExam";

export type MatchingPair = {
  l: string;
  r: string;
  /** G 圖片配對：左欄改顯示圖片（public/matching-img 下的路徑），l 保留為可讀名稱。 */
  img?: string;
};

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
  /** 30 秒倒數用盡時為 true；時間到一律記 1 星。 */
  timedOut?: boolean;
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
        typeof (pair as MatchingPair).r === "string" &&
        ((pair as MatchingPair).img === undefined ||
          typeof (pair as MatchingPair).img === "string"),
    ) &&
    Array.isArray(set.distractors)
  );
}

const rawSets = (bank as { sets?: unknown }).sets;
const rawExtraSets = (extraBank as { sets?: unknown }).sets;
const rawImageSets = (imageBank as { sets?: unknown }).sets;
export const MATCHING_SETS: MatchingSet[] = [
  ...(Array.isArray(rawSets) ? ((rawSets as unknown[]).filter(isValidSet) as MatchingSet[]) : []),
  ...(Array.isArray(rawExtraSets) ? ((rawExtraSets as unknown[]).filter(isValidSet) as MatchingSet[]) : []),
  ...(Array.isArray(rawImageSets) ? ((rawImageSets as unknown[]).filter(isValidSet) as MatchingSet[]) : []),
];

/** 圖片配對組（G）：任一配對帶 img 即屬於圖片題。 */
export const IMAGE_MATCHING_SETS: MatchingSet[] = MATCHING_SETS.filter((set) =>
  set.pairs.some((pair) => pair.img !== undefined),
);

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

/** 從整組配對題裁出較小的盤面（試卷內嵌的迷你配對題用），不修改原 set。 */
export function sliceMatchingSet(
  set: MatchingSet,
  pairsCount: number,
  distractorCount: number,
  random: () => number = Math.random,
): MatchingSet {
  const pairs = shuffleArray(set.pairs, random).slice(0, Math.max(1, Math.min(pairsCount, set.pairs.length)));
  const distractors = shuffleArray(set.distractors, random).slice(0, Math.max(0, Math.min(distractorCount, set.distractors.length)));
  return { ...set, pairs, distractors };
}

export function formatMatchingTime(timeMs: number): string {
  const totalSeconds = Math.floor(timeMs / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

/** 速配／搶分共用的單對題：left 為題目，options 為 2–3 個候選（含 answer）。img 存在時介面只顯示圖片。 */
export type RushQuestion = { left: string; answer: string; options: string[]; img?: string };

export type MatchingRushMode = "speed" | "rush";

export type MatchingRushResult = {
  id: string;
  title: string;
  subject: PaperSubject;
  mode: MatchingRushMode;
  /** 搶分得分（speed 模式為 0）。 */
  score: number;
  correct: number;
  total: number;
  maxCombo: number;
  timeMs: number;
};

/**
 * 把一組配對題拆成連續單對題（A 單對速配的題源）：
 * 每對一題，候選 = 正確右值 + 2 個干擾（優先其他 pair 的右值，不足補 distractors）。
 * 不修改原 set。
 */
export function buildRushQuestions(
  set: MatchingSet,
  random: () => number = Math.random,
): RushQuestion[] {
  const otherRights = set.pairs.map((pair) => pair.r);
  return set.pairs.map((pair) => {
    const pool = shuffleArray(
      [...otherRights.filter((r) => r !== pair.r), ...set.distractors],
      random,
    );
    const distractors = pool.slice(0, 2);
    const options = shuffleArray([pair.r, ...distractors], random);
    return { left: pair.l, answer: pair.r, options, ...(pair.img ? { img: pair.img } : {}) };
  });
}
