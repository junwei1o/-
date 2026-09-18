// 我的教室：選擇題變體題庫與玩法構造（local-first）。
// 涵蓋翻牌問答、看圖選答、是非閃電、限時接力、選擇→配對接力、陷阱題挑戰，
// 以及可混入平常試卷的填空選字、排序題。
import fillSeed from "../../../data/fill_bank.json";
import orderSeed from "../../../data/order_bank.json";
import trapSeed from "../../../data/trap_bank.json";
import { LOCAL_QUESTION_BANK, LOCAL_ENGLISH_BANK, type CurriculumQuestionRow } from "./questionBank";
import {
  IMAGE_MATCHING_SETS,
  MATCHING_SETS,
  shuffleArray,
  sliceMatchingSet,
  type MatchingSet,
} from "./matchingBank";
import type { PaperQuestion, PaperSubject } from "./paperExam";

/* ============================== 資料型別 ============================== */

export type FillQuestion = {
  id: string;
  grade: number;
  subject: PaperSubject;
  difficulty: "基礎" | "標準" | "挑戰";
  learningTopic: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type OrderQuestion = {
  id: string;
  grade: number;
  subject: PaperSubject;
  difficulty: "基礎" | "標準" | "挑戰";
  learningTopic: string;
  prompt: string;
  /** 正確先後順序（由前到後）；作答時由元件打亂呈現。 */
  items: string[];
  explanation: string;
};

export type TrapQuestion = FillQuestion & {
  category: string;
  /** 這一題的常見陷阱說明（答錯時重點提示）。 */
  trapNote: string;
};

/** 教室選擇題（翻牌／閃電／限時接力共用）。 */
export type ClassroomChoice = {
  id: string;
  subject: PaperSubject;
  grade: number;
  difficulty: string;
  learningTopic: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type ImageQuizQuestion = {
  id: string;
  img: string;
  /** 圖片對應的正確名稱。 */
  answer: string;
  options: string[];
  subject: PaperSubject;
  setTitle: string;
};

export type RelayRound = {
  id: string;
  /** 第一關：選擇題（答對才解鎖配對盤）。 */
  choice: ClassroomChoice;
  /** 第二關：迷你配對盤。 */
  matching: MatchingSet;
};

/* ============================== JSON 載入與校驗 ============================== */

function isFill(value: unknown): value is FillQuestion {
  if (!value || typeof value !== "object") return false;
  const q = value as Record<string, unknown>;
  return (
    typeof q.id === "string" &&
    typeof q.prompt === "string" &&
    typeof q.explanation === "string" &&
    Number.isInteger(q.answer) &&
    Array.isArray(q.options) &&
    q.options.length >= 3 &&
    (q.answer as number) >= 0 &&
    (q.answer as number) < (q.options as unknown[]).length
  );
}

function isOrder(value: unknown): value is OrderQuestion {
  if (!value || typeof value !== "object") return false;
  const q = value as Record<string, unknown>;
  return (
    typeof q.id === "string" &&
    typeof q.prompt === "string" &&
    typeof q.explanation === "string" &&
    Array.isArray(q.items) &&
    (q.items as unknown[]).length >= 3 &&
    (q.items as unknown[]).every((item) => typeof item === "string")
  );
}

function isTrap(value: unknown): value is TrapQuestion {
  const q = value as Record<string, unknown>;
  return isFill(value) && typeof q.category === "string" && typeof q.trapNote === "string";
}

export const FILL_QUESTIONS: FillQuestion[] = (() => {
  const list = (fillSeed as { questions?: unknown }).questions;
  return Array.isArray(list) ? (list.filter(isFill) as FillQuestion[]) : [];
})();

export const ORDER_QUESTIONS: OrderQuestion[] = (() => {
  const list = (orderSeed as { questions?: unknown }).questions;
  return Array.isArray(list) ? (list.filter(isOrder) as OrderQuestion[]) : [];
})();

export const TRAP_QUESTIONS: TrapQuestion[] = (() => {
  const list = (trapSeed as { questions?: unknown }).questions;
  return Array.isArray(list) ? (list.filter(isTrap) as TrapQuestion[]) : [];
})();

/** 陷阱題十大類別（維持題庫出現順序）。 */
export const TRAP_CATEGORIES: string[] = Array.from(new Set(TRAP_QUESTIONS.map((q) => q.category)));

/* ============================== 試卷 PaperQuestion 轉換 ============================== */

export function fillToPaper(q: FillQuestion): PaperQuestion {
  return {
    id: q.id,
    grade: q.grade,
    subject: q.subject,
    questionType: "填空題",
    difficulty: q.difficulty,
    learningTopic: q.learningTopic,
    prompt: q.prompt,
    options: [...q.options],
    answer: q.answer,
    explanation: q.explanation,
  };
}

export function orderToPaper(q: OrderQuestion): PaperQuestion {
  return {
    id: q.id,
    grade: q.grade,
    subject: q.subject,
    questionType: "排序題",
    difficulty: q.difficulty,
    learningTopic: q.learningTopic,
    prompt: q.prompt,
    // 排序題作答結果以 0（答對）/ -1（答錯）寫入 answers，故保留 answer=0、options 留空。
    options: [],
    answer: 0,
    explanation: q.explanation,
    orderItems: [...q.items],
  };
}

/* ============================== 選擇題池（翻牌／閃電／接力用） ============================== */

const ALL_CHOICE_ROWS: CurriculumQuestionRow[] = [...LOCAL_QUESTION_BANK, ...LOCAL_ENGLISH_BANK];

function rowToChoice(row: CurriculumQuestionRow): ClassroomChoice {
  return {
    id: row.id,
    subject: row.subject,
    grade: row.grade,
    difficulty: row.difficulty,
    learningTopic: row.learningTopic,
    prompt: row.prompt,
    options: [...row.options],
    answer: row.answer,
    explanation: row.explanation,
  };
}

function pickRows(
  rows: readonly CurriculumQuestionRow[],
  count: number,
  random: () => number,
): ClassroomChoice[] {
  return shuffleArray(rows, random)
    .slice(0, Math.max(1, Math.min(count, rows.length)))
    .map(rowToChoice);
}

/** 翻牌問答／限時接力用：四選一選擇題（可指定學科）。 */
export function buildChoiceDeck(
  count = 10,
  subject?: PaperSubject | "綜合",
  random: () => number = Math.random,
): ClassroomChoice[] {
  const pool = ALL_CHOICE_ROWS.filter(
    (row) => row.questionType === "選擇題" && (!subject || subject === "綜合" || row.subject === subject),
  );
  const source = pool.length >= count ? pool : ALL_CHOICE_ROWS.filter((row) => row.questionType === "選擇題");
  return pickRows(source, count, random);
}

/** 是非閃電用：是非題（選項固定為「正確／錯誤」）；題庫不足時補充自製是非題。 */
export function buildTrueFalseDeck(count = 10, random: () => number = Math.random): ClassroomChoice[] {
  const tfRows = ALL_CHOICE_ROWS.filter((row) => row.questionType === "是非題");
  const deck = pickRows(tfRows, Math.min(count, tfRows.length), random);
  // 題庫僅 19 題，需要更多時以陷阱題庫中的「正確敘述」改寫補充（由 BONUS_TRUE_FALSE 提供）。
  const extras = shuffleArray(BONUS_TRUE_FALSE, random).slice(0, Math.max(0, count - deck.length));
  return [...deck, ...extras].slice(0, count);
}

/** 補充是非題（配合課綱常見概念，答案為選項 index：0 正確、1 錯誤）。 */
const BONUS_TRUE_FALSE: ClassroomChoice[] = [
  { id: "btf-01", subject: "自然", grade: 3, difficulty: "基礎", learningTopic: "磁鐵特性", prompt: "磁鐵的同極會互相排斥。", options: ["正確", "錯誤"], answer: 0, explanation: "磁鐵同極相斥、異極相吸。" },
  { id: "btf-02", subject: "自然", grade: 4, difficulty: "基礎", learningTopic: "植物生理", prompt: "植物行光合作用時會釋放氧氣。", options: ["正確", "錯誤"], answer: 0, explanation: "光合作用製造養分並釋放氧氣。" },
  { id: "btf-03", subject: "數學", grade: 3, difficulty: "基礎", learningTopic: "單位換算", prompt: "1 公尺等於 1000 公分。", options: ["正確", "錯誤"], answer: 1, explanation: "1 公尺＝100 公分，1 公里才是 1000 公尺。" },
  { id: "btf-04", subject: "社會", grade: 4, difficulty: "基礎", learningTopic: "節慶習俗", prompt: "中秋節在農曆八月十五日，當天常見滿月。", options: ["正確", "錯誤"], answer: 0, explanation: "中秋節是農曆八月十五，月圓人團圓。" },
  { id: "btf-05", subject: "社會", grade: 3, difficulty: "基礎", learningTopic: "生活安全", prompt: "火場濃煙時應該站直身體快跑，才看得清楚路。", options: ["正確", "錯誤"], answer: 1, explanation: "濃煙往上竄，應蹲低並用衣物捂口鼻。" },
  { id: "btf-06", subject: "自然", grade: 4, difficulty: "標準", learningTopic: "月相變化", prompt: "農曆初一前後的夜晚通常可以看到又圓又亮的滿月。", options: ["正確", "錯誤"], answer: 1, explanation: "農曆初一是新月，幾乎看不到月亮；滿月在十五日前後。" },
  { id: "btf-07", subject: "數學", grade: 4, difficulty: "基礎", learningTopic: "時間單位", prompt: "2 小時 15 分等於 135 分。", options: ["正確", "錯誤"], answer: 0, explanation: "2 小時＝120 分，加 15 分共 135 分。" },
  { id: "btf-08", subject: "自然", grade: 5, difficulty: "標準", learningTopic: "動物分類", prompt: "鯨魚和海豚都是哺乳類，不是魚類。", options: ["正確", "錯誤"], answer: 0, explanation: "鯨魚、海豚用肺呼吸、胎生哺乳，屬於哺乳類。" },
  { id: "btf-09", subject: "社會", grade: 4, difficulty: "基礎", learningTopic: "行政區劃", prompt: "台北市和高雄市都是台灣的直轄市。", options: ["正確", "錯誤"], answer: 0, explanation: "六都包含台北、新北、桃園、台中、台南、高雄。" },
  { id: "btf-10", subject: "自然", grade: 4, difficulty: "標準", learningTopic: "電路與導體", prompt: "塑膠尺是導體，接在電路中可以讓燈泡發亮。", options: ["正確", "錯誤"], answer: 1, explanation: "塑膠是絕緣體，鐵釘、銅幣等金屬才是導體。" },
  { id: "btf-11", subject: "國語", grade: 4, difficulty: "標準", learningTopic: "量詞搭配", prompt: "「一封信」的量詞用法是正確的。", options: ["正確", "錯誤"], answer: 0, explanation: "信件的量詞用「封」。" },
  { id: "btf-12", subject: "自然", grade: 3, difficulty: "基礎", learningTopic: "太陽方位", prompt: "在台灣，太陽每天從東方升起、西方落下。", options: ["正確", "錯誤"], answer: 0, explanation: "太陽東升西落是穩定的自然規律。" },
];

/* ============================== 看圖選答（複用 G 圖庫） ============================== */

/** 把一組圖片配對組轉成「看圖選名稱」四選一題目；干擾項優先取同組、不足跨組。 */
export function buildImageQuiz(
  set: MatchingSet,
  random: () => number = Math.random,
): ImageQuizQuestion[] {
  const sameSetNames = set.pairs.map((pair) => pair.l);
  const otherNames = IMAGE_MATCHING_SETS.flatMap((item) =>
    item.id === set.id ? [] : item.pairs.map((pair) => pair.l),
  );
  return set.pairs
    .filter((pair) => Boolean(pair.img))
    .map((pair, index) => {
      const distractors = shuffleArray(
        [...sameSetNames.filter((name) => name !== pair.l), ...otherNames],
        random,
      ).slice(0, 3);
      return {
        id: `imgq-${set.id}-${index}`,
        img: pair.img as string,
        answer: pair.l,
        options: shuffleArray([pair.l, ...distractors], random),
        subject: set.subject,
        setTitle: set.title,
      };
    });
}

/* ============================== 選擇→配對接力 ============================== */

/**
 * 接力關卡：每回合先答 1 題選擇題，答對後解鎖 1 盤迷你配對（4 對＋1 干擾）。
 * 選擇題與配對盤儘量同學科；配對盤維持純文字（圖片組只在看圖選答使用）。
 */
export function buildRelayRounds(count = 3, random: () => number = Math.random): RelayRound[] {
  const textSets = MATCHING_SETS.filter((set) => !set.pairs.some((pair) => pair.img !== undefined));
  const rounds: RelayRound[] = [];
  const usedSets = new Set<string>();
  for (let i = 0; i < count; i += 1) {
    const set = shuffleArray(textSets, random).find((candidate) => !usedSets.has(candidate.id)) ?? textSets[i % textSets.length];
    if (!set) break;
    usedSets.add(set.id);
    const choicePool = ALL_CHOICE_ROWS.filter(
      (row) => row.questionType === "選擇題" && row.subject === set.subject,
    );
    const choiceRow = shuffleArray(choicePool.length ? choicePool : ALL_CHOICE_ROWS, random)[0];
    if (!choiceRow) break;
    rounds.push({
      id: `relay-${i + 1}-${set.id}`,
      choice: rowToChoice(choiceRow),
      matching: sliceMatchingSet(set, 4, 1, random),
    });
  }
  return rounds;
}

/* ============================== 計分 ============================== */

/** 依正確率給 1–3 星（全對 3 星、≥7 成 2 星，其餘 1 星）。 */
export function accuracyStars(correct: number, total: number): 1 | 2 | 3 {
  if (total <= 0 || correct <= 0) return 1;
  const ratio = correct / total;
  if (ratio >= 0.999) return 3;
  if (ratio >= 0.7) return 2;
  return 1;
}

/** 陷阱題星等：零失誤 3 星、錯 1–2 題 2 星，其餘 1 星。 */
export function trapStars(errors: number): 1 | 2 | 3 {
  if (errors <= 0) return 3;
  if (errors <= 2) return 2;
  return 1;
}

export const CLASSROOM_BEST_KEY = "xue-classroom-best-v1";

export type ClassroomBestMap = Record<
  string,
  { stars?: number; score?: number; maxCombo?: number; correct?: number; total?: number }
>;

export function loadClassroomBest(): ClassroomBestMap {
  try {
    return JSON.parse(localStorage.getItem(CLASSROOM_BEST_KEY) ?? "{}") as ClassroomBestMap;
  } catch {
    return {};
  }
}

export function saveClassroomBest(best: ClassroomBestMap) {
  try {
    localStorage.setItem(CLASSROOM_BEST_KEY, JSON.stringify(best));
  } catch {
    /* 隱私模式無法寫入就只保留在記憶體 */
  }
}
