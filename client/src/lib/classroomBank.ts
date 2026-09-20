// 我的教室：選擇題變體題庫與玩法構造（local-first）。
// 涵蓋翻牌問答、看圖選答、是非閃電、限時接力、選擇→配對接力、陷阱題挑戰，
// 以及可混入平常試卷的填空選字、排序題。
import { shuffleQuestionOptions } from "./optionRandomizer";
import { loadStudentGradePreference } from "./studentGradePreference";
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
  /** 跨學科結合題的科目組合（三科／五科）；單科題為 undefined。 */
  subjectCombination?: string[];
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

/**
 * 題目列要「用到才算」，不能在建構模組時就快照：
 * LOCAL_QUESTION_BANK 是動態載入的活陣列，模組載入時還是空的，
 * 若在這裡展開就會永遠拿到空題庫（我的教室會完全沒有題目）。
 */
let choiceCache: CurriculumQuestionRow[] = [];
let choiceCacheSize = -1;
function allChoiceRows(): CurriculumQuestionRow[] {
  if (choiceCacheSize !== LOCAL_QUESTION_BANK.length) {
    choiceCache = [...LOCAL_QUESTION_BANK, ...LOCAL_ENGLISH_BANK];
    choiceCacheSize = LOCAL_QUESTION_BANK.length;
  }
  return choiceCache;
}

/**
 * 題庫列轉成教室題目。出題時順手洗牌選項：題庫有 67% 的正解固定在第一個選項，
 * 若不洗牌學生只要「選第一個」就能過關。是非題由 shuffleQuestionOptions 自動跳過。
 */
function rowToChoice(row: CurriculumQuestionRow, random: () => number = Math.random): ClassroomChoice {
  const base: ClassroomChoice = {
    id: row.id,
    subject: row.subject,
    grade: row.grade,
    difficulty: row.difficulty,
    learningTopic: row.learningTopic,
    prompt: row.prompt,
    options: [...row.options],
    answer: row.answer,
    explanation: row.explanation,
    ...(row.subjectCombination ? { subjectCombination: row.subjectCombination } : {}),
  };
  return shuffleQuestionOptions({ ...base, questionType: row.questionType }, random);
}

/**
 * 依學生年級就近取題：
 * 教室六個玩法原本完全不看年級，從 1210 題（國小 1090 ＋ 國中 120）裡隨機抽，
 * 三年級學生會抽到九年級的二次函數題、七年級會抽到三年級的題目。
 * 這裡改為先取 |年級差| ≤ 1 的題，不夠再放寬到 ≤ 2，最後才退回全題庫（避免開天窗）。
 * 沒有年級資料時等同原本行為（全題庫），因此既有測試不受影響。
 */
function scopeRowsByGrade<T extends { grade: number }>(
  rows: readonly T[],
  grade: number | null | undefined,
  need = 1,
): readonly T[] {
  if (!grade) return rows;
  const near = rows.filter((row) => Math.abs(row.grade - grade) <= 1);
  if (near.length >= need) return near;
  const wider = rows.filter((row) => Math.abs(row.grade - grade) <= 2);
  if (wider.length >= need) return wider;
  return rows;
}

/** 取年級：有傳就用傳的，沒傳就讀學生的年級偏好（沒設定 → null，等同不分年級）。 */
function resolveGrade(grade?: number | null): number | null {
  if (grade !== undefined) return grade ?? null;
  try {
    return loadStudentGradePreference();
  } catch {
    return null;
  }
}

function pickRows(
  rows: readonly CurriculumQuestionRow[],
  count: number,
  random: () => number,
): ClassroomChoice[] {
  return shuffleArray(rows, random)
    .slice(0, Math.max(1, Math.min(count, rows.length)))
    .map((row) => rowToChoice(row, random));
}

/** 翻牌問答／限時接力用：四選一選擇題（可指定學科）。 */
export function buildChoiceDeck(
  count = 10,
  subject?: PaperSubject | "綜合",
  random: () => number = Math.random,
  grade?: number | null,
): ClassroomChoice[] {
  const wanted = resolveGrade(grade);
  const base = allChoiceRows().filter((row) => row.questionType === "選擇題");
  const scoped = scopeRowsByGrade(base, wanted, count);
  const bySubject = scoped.filter(
    (row) => !subject || subject === "綜合" || row.subject === subject,
  );
  // 該學科在年級附近不夠題時，先放寬學科（留在同溫層年級），再退回全部選擇題
  const source = bySubject.length >= count ? bySubject : scoped.length >= count ? scoped : base;
  return pickRows(source, count, random);
}

/** 是非閃電用：是非題（選項固定為「正確／錯誤」）；題庫不足時補充自製是非題。 */
export function buildTrueFalseDeck(
  count = 10,
  random: () => number = Math.random,
  grade?: number | null,
): ClassroomChoice[] {
  const wanted = resolveGrade(grade);
  const allTf = allChoiceRows().filter((row) => row.questionType === "是非題");
  const tfRows = scopeRowsByGrade(allTf, wanted, Math.min(count, allTf.length));
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
export function buildRelayRounds(
  count = 3,
  random: () => number = Math.random,
  grade?: number | null,
): RelayRound[] {
  const wanted = resolveGrade(grade);
  const textSets = MATCHING_SETS.filter((set) => !set.pairs.some((pair) => pair.img !== undefined));
  const rounds: RelayRound[] = [];
  const usedSets = new Set<string>();
  for (let i = 0; i < count; i += 1) {
    const set = shuffleArray(textSets, random).find((candidate) => !usedSets.has(candidate.id)) ?? textSets[i % textSets.length];
    if (!set) break;
    usedSets.add(set.id);
    const choicePool = scopeRowsByGrade(
      allChoiceRows().filter((row) => row.questionType === "選擇題" && row.subject === set.subject),
      wanted,
      1,
    );
    const choiceRow = shuffleArray(choicePool.length ? choicePool : allChoiceRows(), random)[0];
    if (!choiceRow) break;
    rounds.push({
      id: `relay-${i + 1}-${set.id}`,
      choice: rowToChoice(choiceRow, random),
      matching: sliceMatchingSet(set, 4, 1, random),
    });
  }
  return rounds;
}

/* ============================== 因數探險 ============================== */

export type FactorRound = {
  id: string;
  /** 本關要找因數的目標數。 */
  n: number;
  /** n 的所有因數（由小到大，含 1 與 n）。 */
  factors: number[];
  /** 因數成對 [a, b]（a<=b、a*b=n）；完全平方數最後一對為 [r, r]。 */
  pairs: Array<[number, number]>;
  /** 畫面數字泡泡（因數＋非因數干擾，已洗牌）。 */
  choices: number[];
  /** 非因數干擾（誘答）。 */
  distractors: number[];
  /** 關卡標記：一般合成數／完全平方數／質數驚喜關。 */
  kind: "normal" | "square" | "prime";
};

/** 列出 n 的所有正因數（由小到大）。 */
export function listFactors(n: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= n; d += 1) {
    if (n % d === 0) out.push(d);
  }
  return out;
}

/** 把因數兩兩成對（a×b=n）；完全平方數的平方根自己成對。 */
export function factorPairs(n: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let a = 1; a * a <= n; a += 1) {
    if (n % a === 0) {
      const b = n / a;
      pairs.push(a === b ? [a, a] : [a, b]);
    }
  }
  return pairs;
}

// 五上「倍數與因數」適用範圍（60 以內），依教學重點分層。
const FACTOR_EASY = [14, 15, 21, 22, 26, 27, 33, 34, 35, 38, 39, 46];
const FACTOR_MEDIUM = [18, 20, 28, 32, 44, 45];
const FACTOR_SQUARE = [16, 25];
const FACTOR_PRIME = [23, 29, 31, 37, 41, 43, 47, 53, 59];
const FACTOR_TARGET_CHOICES = 9;

function makeFactorRound(n: number, id: string, kind: FactorRound["kind"], random: () => number): FactorRound {
  const factors = listFactors(n);
  const pairs = factorPairs(n);
  const nonFactors: number[] = [];
  for (let d = 2; d < n; d += 1) {
    if (n % d !== 0) nonFactors.push(d);
  }
  const distractorCount = Math.max(1, FACTOR_TARGET_CHOICES - factors.length);
  const distractors = shuffleArray(nonFactors, random).slice(0, distractorCount);
  const choices = shuffleArray([...factors, ...distractors], random);
  return { id, n, factors, pairs, choices, distractors, kind };
}

/**
 * 因數探險關卡：預設 5 關，由簡單合成數→中等合成數→完全平方數→質數驚喜關。
 * 完全平方數含「自己成對」的中間因數；質數只有 1 和自己兩個因數。
 */
export function buildFactorRounds(count = 5, random: () => number = Math.random): FactorRound[] {
  const tiers: Array<{ pool: number[]; kind: FactorRound["kind"] }> = [
    { pool: FACTOR_EASY, kind: "normal" },
    { pool: FACTOR_EASY, kind: "normal" },
    { pool: FACTOR_MEDIUM, kind: "normal" },
    { pool: FACTOR_SQUARE, kind: "square" },
    { pool: FACTOR_PRIME, kind: "prime" },
  ];
  const used = new Set<number>();
  const rounds: FactorRound[] = [];
  for (let i = 0; i < count; i += 1) {
    const tier = tiers[i % tiers.length];
    let n = tier.pool[Math.floor(random() * tier.pool.length)];
    let guard = 0;
    while (used.has(n) && guard < 25) {
      n = tier.pool[Math.floor(random() * tier.pool.length)];
      guard += 1;
    }
    used.add(n);
    rounds.push(makeFactorRound(n, `factor-${i + 1}`, tier.kind, random));
  }
  return rounds;
}

/** 因數探險星等：零失誤 3 星、總失誤 ≤3 二星，其餘 1 星。 */
export function factorStars(totalErrors: number): 1 | 2 | 3 {
  if (totalErrors <= 0) return 3;
  if (totalErrors <= 3) return 2;
  return 1;
}

/* ============================== 因數雙重奏 ============================== */

/**
 * 因數雙重奏關卡：同一個目標數先「找因數」（因數探險玩法），
 * 再「拼長方形」（長方形拼拼樂玩法）——兩段玩法接續，用同一組因數對貫穿。
 * 數字池沿用拼磚格線放得下的合成數（含完全平方數彩蛋關）。
 */
export type DuoRound = {
  id: string;
  /** 本關目標數（找因數與拼長方形共用）。 */
  n: number;
  /** 第一段：因數探險關卡資料。 */
  factor: FactorRound;
  /** 第二段：長方形拼拼樂關卡資料。 */
  rect: RectRound;
};

export function buildDuoRounds(count = 4, random: () => number = Math.random): DuoRound[] {
  const used = new Set<number>();
  const rounds: DuoRound[] = [];
  for (let i = 0; i < count; i += 1) {
    const tier = RECT_TIERS[i % RECT_TIERS.length];
    let n = tier.pool[Math.floor(random() * tier.pool.length)];
    let guard = 0;
    while (used.has(n) && guard < 25) {
      n = tier.pool[Math.floor(random() * tier.pool.length)];
      guard += 1;
    }
    used.add(n);
    const squareRoot = Math.round(Math.sqrt(n));
    const factorKind: FactorRound["kind"] = squareRoot * squareRoot === n ? "square" : "normal";
    rounds.push({
      id: `duo-${i + 1}-${n}`,
      n,
      factor: makeFactorRound(n, `duo-factor-${i + 1}`, factorKind, random),
      rect: makeRectRound(n, `duo-rect-${i + 1}`, tier.kind),
    });
  }
  return rounds;
}

/** 因數雙重奏星等：找因數＋拼磚的總失誤，零失誤 3 星、≤3 二星，其餘 1 星。 */
export function duoStars(totalMistakes: number): 1 | 2 | 3 {
  if (totalMistakes <= 0) return 3;
  if (totalMistakes <= 3) return 2;
  return 1;
}

/* ============================== 倍數防衛戰 ============================== */

/** 單顆隕石腳本：value 為石上數字；x 為水平落點（%）；delayMs 為開波後幾毫秒出現；durationMs 為落地秒數；isBomb 為炸彈（切到即結束）。 */
export type MeteorSpec = {
  id: string;
  value: number;
  isTarget: boolean;
  isBomb: boolean;
  x: number;
  delayMs: number;
  durationMs: number;
};

/** 波次操作模式：點擊／劃切（漂浮隕石）、拖拽（托盤）、混合（兩者同場）。 */
export type MeteorMode = "tap" | "slash" | "drag" | "mixed";

export const METEOR_MODE_INFO: Record<MeteorMode, { title: string; desc: string }> = {
  tap: { title: "點擊模式", desc: "快速點擊目標倍數的隕石，別碰到炸彈！" },
  slash: { title: "劃切模式", desc: "滑動切割目標倍數，一刀連斬有加成，小心炸彈！" },
  drag: { title: "拖拽模式", desc: "把目標倍數的泡泡拖進基地回收槽；拖錯會爆炸，拖到炸彈會大爆炸！" },
  mixed: { title: "混合模式", desc: "空中的用點擊或劃切，底部的泡泡要拖進基地——三種操作一起來！" },
};

export type MeteorWave = {
  id: string;
  /** 本波要攔截的目標倍數（2 / 5 / 10）。 */
  multipleOf: number;
  /** 波次標題（例：「2 的倍數」）。 */
  label: string;
  /** 波次結束後的教學註記（個位數特徵）。 */
  hint: string;
  /** 本波操作模式（每輪隨機組合、關關換模式）。 */
  mode: MeteorMode;
  /** 漂浮隕石腳本（tap/slash/mixed 會落下；drag 為空陣列），依 delayMs 由小到大。 */
  meteors: MeteorSpec[];
  /** 拖拽托盤的靜態泡泡（drag＝9 顆整格；mixed＝3 顆；其餘空陣列）。 */
  tray: MeteorSpec[];
};

const METEOR_WAVE_CONFIG: Array<{ multipleOf: number; label: string; hint: string }> = [
  {
    multipleOf: 2,
    label: "2 的倍數",
    hint: "2 的倍數個位一定是 0、2、4、6、8——先看個位數，就能快速攔截！",
  },
  {
    multipleOf: 5,
    label: "5 的倍數",
    hint: "5 的倍數個位一定是 0 或 5；個位是其他數字的隕石，讓它掉下去也沒關係。",
  },
  {
    multipleOf: 3,
    label: "3 的倍數",
    hint: "3 的倍數：把每個數字加起來，總和是 3 的倍數（例如 42 → 4+2=6，是 3 的倍數）。",
  },
  {
    multipleOf: 9,
    label: "9 的倍數",
    hint: "9 的倍數：把每個數字加起來，總和是 9 的倍數（例如 63 → 6+3=9，是 9 的倍數）。",
  },
  {
    multipleOf: 10,
    label: "同時是 2 和 5 的倍數",
    hint: "同時是 2 和 5 的倍數就是 10 的倍數，個位一定是 0；只有 2 的倍數或只有 5 的倍數都不能攔截喔！",
  },
];

export const METEOR_WAVE_TIME = 42; // 每波秒數
export const METEOR_ENERGY_MAX = 15;
export const METEOR_TARGETS_PER_WAVE = 7;
export const METEOR_DECOYS_PER_WAVE = 9;
const METEOR_GAP_MS = 2200;
const METEOR_FIRST_DELAY_MS = 600;

function buildMeteorPool(multipleOf: number): { targets: number[]; decoys: number[] } {
  const targets: number[] = [];
  const decoys: number[] = [];
  for (let v = 10; v <= 99; v += 1) {
    if (multipleOf === 10) {
      // 第三波陷阱：干擾項全是「2 的倍數」或「5 的倍數」但不是 10 的倍數。
      if (v % 10 === 0) targets.push(v);
      else if (v % 2 === 0 || v % 5 === 0) decoys.push(v);
    } else if (v % multipleOf === 0) {
      targets.push(v);
    } else {
      decoys.push(v);
    }
  }
  return { targets, decoys };
}

function buildFallingMeteors(
  waveNumber: number,
  cfg: { multipleOf: number },
  targetCount: number,
  decoyCount: number,
  random: () => number,
): MeteorSpec[] {
  const { targets, decoys } = buildMeteorPool(cfg.multipleOf);
  const picked = shuffleArray(
    [
      ...shuffleArray(targets, random).slice(0, targetCount),
      ...shuffleArray(decoys, random).slice(0, decoyCount),
    ],
    random,
  );
  const meteors: MeteorSpec[] = picked.map((value, i) => ({
    id: `meteor-${waveNumber}-${i + 1}`,
    value,
    isTarget: value % cfg.multipleOf === 0,
    isBomb: false,
    x: 12 + Math.floor(random() * 76),
    delayMs: METEOR_FIRST_DELAY_MS + i * METEOR_GAP_MS,
    durationMs: 3800 + Math.floor(random() * 1400),
  }));
  // 聚集生成：約 22% 的隕石與前一顆同刻緊鄰落下，製造「一刀連斬」的機會。
  for (let i = 1; i < meteors.length; i += 1) {
    if (random() < 0.22) {
      meteors[i] = {
        ...meteors[i],
        delayMs: meteors[i - 1].delayMs,
        x: Math.max(12, Math.min(88, meteors[i - 1].x + (random() * 24 - 12))),
      };
    }
  }
  // 炸彈：1–2 顆，只替換第 4 顆以後的干擾隕石（目標數不變、前三顆絕無炸彈）。
  const bombCount = random() < 0.4 ? 2 : 1;
  const bombIdxPool = meteors.map((_, i) => i).filter((i) => i >= 3 && !meteors[i].isTarget);
  const bombIdx = shuffleArray(bombIdxPool, random).slice(0, bombCount);
  for (const i of bombIdx) {
    meteors[i] = { ...meteors[i], isBomb: true, isTarget: false };
  }
  return meteors;
}

/** 拖拽托盤：targets 顆目標倍數＋bombs 顆炸彈＋decoys 顆干擾，洗牌後成為靜態泡泡格。 */
function buildTray(
  waveNumber: number,
  cfg: { multipleOf: number },
  targets: number,
  bombs: number,
  decoys: number,
  random: () => number,
): MeteorSpec[] {
  const { targets: targetPool, decoys: decoyPool } = buildMeteorPool(cfg.multipleOf);
  const picked = shuffleArray(
    [
      ...shuffleArray(targetPool, random).slice(0, targets),
      ...shuffleArray(decoyPool, random).slice(0, bombs + decoys),
    ],
    random,
  );
  const nonTargetOrder = shuffleArray(
    picked.map((_, i) => i).filter((i) => picked[i] % cfg.multipleOf !== 0),
    random,
  );
  const bombIdx = new Set(nonTargetOrder.slice(0, bombs));
  return picked.map((value, i) => {
    const isTarget = value % cfg.multipleOf === 0;
    const isBomb = !isTarget && bombIdx.has(i);
    return {
      id: `tray-${waveNumber}-${i + 1}`,
      value,
      isTarget,
      isBomb,
      x: 0,
      delayMs: 0,
      durationMs: 0,
    };
  });
}

function makeMeteorWave(cfgIndex: number, mode: MeteorMode, index: number, random: () => number): MeteorWave {
  const cfg = METEOR_WAVE_CONFIG[cfgIndex % METEOR_WAVE_CONFIG.length];
  const waveNumber = index + 1;
  if (mode === "drag") {
    return {
      id: `meteor-wave-${waveNumber}`,
      multipleOf: cfg.multipleOf,
      label: cfg.label,
      hint: cfg.hint,
      mode,
      meteors: [],
      tray: buildTray(waveNumber, cfg, 3, 2, 4, random),
    };
  }
  if (mode === "mixed") {
    return {
      id: `meteor-wave-${waveNumber}`,
      multipleOf: cfg.multipleOf,
      label: cfg.label,
      hint: cfg.hint,
      mode,
      meteors: buildFallingMeteors(waveNumber, cfg, 4, 8, random),
      tray: buildTray(waveNumber, cfg, 2, 1, 0, random),
    };
  }
  return {
    id: `meteor-wave-${waveNumber}`,
    multipleOf: cfg.multipleOf,
    label: cfg.label,
    hint: cfg.hint,
    mode,
    meteors: buildFallingMeteors(waveNumber, cfg, METEOR_TARGETS_PER_WAVE, METEOR_DECOYS_PER_WAVE, random),
    tray: [],
  };
}

/** 倍數防衛戰波次：每輪從點擊／劃切／拖拽／混合四種模式隨機抽 3 種（關關換模式），倍數主題也隨機組合。 */
export function buildMeteorWaves(count = 3, random: () => number = Math.random): MeteorWave[] {
  const cfgIndexes = shuffleArray([0, 1, 2, 3, 4], random);
  const modes = shuffleArray<MeteorMode>(["tap", "slash", "drag", "mixed"], random).slice(0, count);
  return modes.map((mode, i) => makeMeteorWave(cfgIndexes[i % cfgIndexes.length], mode, i, random));
}

/** 倍數防衛戰星等：零失誤 3 星、總失誤 ≤4 二星，其餘 1 星。 */
export function meteorStars(mistakes: number): 1 | 2 | 3 {
  if (mistakes <= 0) return 3;
  if (mistakes <= 4) return 2;
  return 1;
}

/** 連斬加成：同一次滑動切中 count 個目標，第 1 顆 10 分、之後每顆再多 5 分（10/25/40…總分）。 */
export function meteorChainBonus(count: number): number {
  if (count <= 0) return 0;
  return 10 * count + 5 * (count - 1);
}

/* ============================== 長方形拼拼樂 ============================== */

export type RectPair = [number, number];

export type RectRound = {
  id: string;
  /** 本關要拼的目標數（方格總數）。 */
  n: number;
  /** 全部因數對（含 1×N），由小到大。 */
  pairs: RectPair[];
  /** 要在格線上拼出的「真長方形」（不含 1×N；a≥2、a≤b，a 為列數、b 為行數）。 */
  realPairs: RectPair[];
  /** 直接過關的一排長條 [1, n]（每個數都排得出來一排，自動送分）。 */
  granted: RectPair;
  /** 關卡標記：一般合成數／完全平方數（排得出正方形）。 */
  kind: "normal" | "square";
  /** 過關小筆記。 */
  hint: string;
};

/** 拼長方形格線：15 行 × 7 列（涵蓋題庫中最大的 3×15 與 7×7）。 */
export const RECT_GRID_COLS = 15;
export const RECT_GRID_ROWS = 7;
export const RECT_TIME_PER_LEVEL = 60;

// 題庫設計：排除 1×N 以外的因數對有邊超過 15 行或 7 列的數（例如 28 的 2×14 可以、36 的 2×18 不行）。
const RECT_TIERS: Array<{ pool: number[]; kind: RectRound["kind"] }> = [
  { pool: [12, 15, 16, 18, 20], kind: "normal" },
  { pool: [20, 21, 22, 24], kind: "normal" },
  { pool: [24, 25, 27, 28, 30], kind: "normal" },
  { pool: [33, 35, 45], kind: "normal" },
  { pool: [16, 25, 49], kind: "square" },
];

function makeRectRound(n: number, id: string, kind: RectRound["kind"]): RectRound {
  const pairs = factorPairs(n);
  const realPairs = pairs.filter(([a]) => a >= 2) as RectPair[];
  const shapeList = pairs.map(([a, b]) => `${a}×${b}`).join("、");
  const hint =
    kind === "square"
      ? `${n} 是完全平方數，排得出 ${Math.round(Math.sqrt(n))}×${Math.round(Math.sqrt(n))} 的正方形——只有完全平方數辦得到！`
      : `${n} 一共有 ${pairs.length} 種排法：${shapeList}；因數愈多，排法就愈多。`;
  return { id, n, pairs, realPairs, granted: [1, n], kind, hint };
}

/**
 * 長方形拼拼樂關卡：5 關，由小合成數→大合成數→完全平方數彩蛋關。
 * 每關把 n 個方格拼成長方形：1×N 的一排長條直接送分，其餘排法要在格線上拼出來。
 */
export function buildRectRounds(count = 5, random: () => number = Math.random): RectRound[] {
  const used = new Set<number>();
  const rounds: RectRound[] = [];
  for (let i = 0; i < count; i += 1) {
    const tier = RECT_TIERS[i % RECT_TIERS.length];
    let n = tier.pool[Math.floor(random() * tier.pool.length)];
    let guard = 0;
    while (used.has(n) && guard < 25) {
      n = tier.pool[Math.floor(random() * tier.pool.length)];
      guard += 1;
    }
    used.add(n);
    rounds.push(makeRectRound(n, `rect-${i + 1}`, tier.kind));
  }
  return rounds;
}

/** 長方形拼拼樂星等：零失誤 3 星、總失誤 ≤3 二星，其餘 1 星。 */
export function rectStars(totalMistakes: number): 1 | 2 | 3 {
  if (totalMistakes <= 0) return 3;
  if (totalMistakes <= 3) return 2;
  return 1;
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
