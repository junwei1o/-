// 變體題產生器（白名單版）
// 只做兩種形狀：subtract（相減）與 divide（相除），且必須「唯一可推斷」。
// 設計目標：絕不產生錯答案。任何不確定都回 null。寧缺勿濫。
//
// 防範重點（來自可行性研究）：
//  - 最大公因數 / 數列 / 機率 等「巧合算式」→ 關鍵字 + 唯一推斷 + 重算閘門攔截
//  - 數字產生器必須真的整除、減法必為正、不可產生小數（硬約束 + 自我驗證）

export type VariantSource = {
  id: string;
  subject: string;
  grade: number;
  learningTopic: string;
  prompt: string;
  options: readonly string[];
  answer: number; // 0..3
  explanation?: string;
};

export type VariantOutcome = {
  question: {
    id: string; // `${source.id}#v${variantIndex}`
    subject: string;
    grade: number;
    learningTopic: string;
    prompt: string;
    options: string[];
    answer: number;
    explanation: string;
  };
  variantIndex: number;
  shape: "subtract" | "divide";
};

// ---------------------------------------------------------------------------
// 內部型別
// ---------------------------------------------------------------------------

type Shape = "subtract" | "divide";

interface NumToken {
  value: number;
  start: number;
  end: number;
}

interface Analyzed {
  shape: Shape;
  oldA: number; // 被減數 / 被除數
  oldB: number; // 減數 / 除數
  answerVal: number;
  suffix: string; // 正確選項尾部的單位（如 " 人"、" 顆"，可能為空）
}

interface Detected {
  shape: Shape;
  a: number;
  b: number;
  computed: number;
}

// ---------------------------------------------------------------------------
// 常數：排除關鍵字、中文數字
// ---------------------------------------------------------------------------

const KEYWORDS = [
  "最大公因數",
  "最小公倍數",
  "公因數",
  "公倍數",
  "因數",
  "倍數",
  "機率",
  "可能性",
  "可能",
  "規律",
  "數列",
  "下一個",
  "接下來",
  "餘數",
  "剩下",
  "至少",
  "最多",
] as const;

const KEYWORDS_RE = new RegExp(KEYWORDS.join("|"));
// 中文數字排除：大多數字元直接視為「數值」並排除；「一」較特殊——
// 只有緊接在白名單量詞前才當作量詞（非數值），其餘「一」仍排除。
// 「兩」一律視為數值（常當 2 用，風險高於收益）。
const CN_ALWAYS = /[零二三四五六七八九十百千半兩]/;
const MEASURE_WORDS = "個本位張隻棵朵次種件台輛份條片顆瓶盒包人題組共袋";

function hasRiskyChinese(text: string): boolean {
  if (CN_ALWAYS.test(text)) return true;
  let i = text.indexOf("一");
  while (i >= 0) {
    const next = text[i + 1];
    if (!MEASURE_WORDS.includes(next ?? "")) return true; // 「一」後面不是量詞 → 視為數值 → 排除
    i = text.indexOf("一", i + 1);
  }
  return false;
}

const EPS = 1e-9;

// ---------------------------------------------------------------------------
// 數字解析與抽取
// ---------------------------------------------------------------------------

const DECIMAL_RE = /(\d+\.\d+)/g;
const INTEGER_RE = /(\d+)/g;
const FRACTION_RE = /\d+\s*\/\s*\d+/g; // 分數（本版不處理）

/** 抽出題幹中的阿拉伯數字 token（跳過分數 span 與小數已涵蓋的整數）。 */
export function tokenizeNumbers(text: string): NumToken[] {
  const tokens: NumToken[] = [];
  const fracSpans: Array<[number, number]> = [];
  for (const m of Array.from(text.matchAll(FRACTION_RE))) {
    fracSpans.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
  }
  const inFrac = (s: number, e: number) =>
    fracSpans.some(([a, b]) => s < b && e > a);

  for (const m of Array.from(text.matchAll(DECIMAL_RE))) {
    const s = m.index ?? 0;
    const e = s + m[0].length;
    if (inFrac(s, e)) continue;
    tokens.push({ value: parseFloat(m[0]), start: s, end: e });
  }
  for (const m of Array.from(text.matchAll(INTEGER_RE))) {
    const s = m.index ?? 0;
    const e = s + m[0].length;
    if (inFrac(s, e)) continue;
    if (tokens.some((t) => s < t.end && e > t.start)) continue; // 與小數重疊
    tokens.push({ value: parseFloat(m[0]), start: s, end: e });
  }
  return tokens;
}

/**
 * 解析正確選項文字為數值 + 單位尾綴。
 * - 含分數（含 "/"）本版不處理 → 回 null
 * - 無法解析出開頭數字 → 回 null
 * - 尾綴含數字 → 回 null（視為畸形）
 */
export function parseNumeric(text: string): { value: number; suffix: string } | null {
  if (/\//.test(text)) return null; // 分數
  // 尾綴只接受「空白 + 中文單位 / % / ° / ℃」，其餘視為畸形；保留數字與單位間的空格
  const m = text.trim().match(/^([+-]?\d+(?:\.\d+)?)(\s*[一-鿿%°℃]*)\s*$/);
  if (!m) return null;
  const value = Number(m[1]);
  const suffix = m[2] ?? "";
  if (/\d/.test(suffix)) return null;
  return { value, suffix };
}

function approx(a: number, b: number): boolean {
  return Math.abs(a - b) < EPS;
}

// ---------------------------------------------------------------------------
// 形狀偵測：唯一可推斷的 subtract 或 divide
// ---------------------------------------------------------------------------

/** 給定題幹兩個數值與正確答案，判斷是否唯一可推斷為 subtract / divide。 */
export function detectShape(values: number[], answerVal: number): Detected | null {
  if (values.length !== 2) return null;
  const [x, y] = values;

  let sub: Detected | null = null;
  if (x > y && approx(x - y, answerVal)) {
    sub = { shape: "subtract", a: x, b: y, computed: x - y };
  } else if (y > x && approx(y - x, answerVal)) {
    sub = { shape: "subtract", a: y, b: x, computed: y - x };
  }

  let div: Detected | null = null;
  const tryDiv = (num: number, den: number): Detected | null => {
    if (den < 2) return null;
    if (!Number.isInteger(answerVal)) return null;
    if (!approx(num / den, answerVal)) return null;
    return { shape: "divide", a: num, b: den, computed: num / den };
  };
  div = tryDiv(x, y) ?? tryDiv(y, x);

  if (sub && div) return null; // 兩種形狀同時成立 → 歧義
  return sub ?? div;
}

// ---------------------------------------------------------------------------
// 來源分析（套用全部放行 / 排除規則）
// ---------------------------------------------------------------------------

function analyze(source: VariantSource): Analyzed | null {
  // 邊界：選項數、answer 範圍
  if (!source.options || source.options.length < 4) return null;
  if (!Number.isInteger(source.answer) || source.answer < 0 || source.answer > 3) return null;

  // 排除：關鍵字
  if (KEYWORDS_RE.test(source.prompt)) return null;
  // 排除：中文數字（含「一」非量詞、以及「兩」等）
  if (hasRiskyChinese(source.prompt)) return null;

  // 解析正確選項
  const correctText = source.options[source.answer];
  const parsed = parseNumeric(correctText);
  if (!parsed) return null; // 無法解析 / 分數
  const answerVal = parsed.value;
  const suffix = parsed.suffix;

  // 題幹阿拉伯數字數量必須恰好為 2
  const tokens = tokenizeNumbers(source.prompt);
  if (tokens.length !== 2) return null;
  const vals = tokens.map((t) => t.value);

  // 排除：答案數值原樣出現在題幹
  if (approx(vals[0], answerVal) || approx(vals[1], answerVal)) return null;

  // 形狀偵測（必須唯一可推斷）
  const det = detectShape(vals, answerVal);
  if (!det) return null;

  return {
    shape: det.shape,
    oldA: det.a,
    oldB: det.b,
    answerVal,
    suffix,
  };
}

// ---------------------------------------------------------------------------
// 可重現 PRNG（seeded）
// ---------------------------------------------------------------------------

function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFor(id: string, index: number): number {
  return (hashString(id) ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
}

function randInt(rng: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

// ---------------------------------------------------------------------------
// 數字產生（硬約束 + 否決）
// ---------------------------------------------------------------------------

function genSubtract(rng: () => number): { a: number; b: number } | null {
  for (let i = 0; i < 64; i++) {
    const a = randInt(rng, 10, 99); // 被減數 [10,99]
    const maxB = a - 2;
    if (maxB < 2) continue;
    const b = randInt(rng, 2, maxB); // 減數 [2, a-2] → a-b >= 2 且 a>b
    const ans = a - b;
    if (ans < 2) continue;
    if (a === 2 * b) continue; // 否決：新答案 == 減數（會出現在題幹）
    if (approx(ans, b) || approx(ans, a)) continue;
    return { a, b };
  }
  return null;
}

function genDivide(rng: () => number): { a: number; b: number } | null {
  for (let i = 0; i < 64; i++) {
    const b = randInt(rng, 2, 9); // 除數 [2,9]
    const q = randInt(rng, 2, 12); // 商 [2,12]
    const a = b * q; // 被除數，必為整數且整除
    if (a > 144) continue;
    if (q === b) continue; // 否決：新答案 == 除數（會出現在題幹）
    if (approx(q, a)) continue;
    return { a, b };
  }
  return null;
}

// ---------------------------------------------------------------------------
// 文字替換（保留單位與語意位置）
// ---------------------------------------------------------------------------

function replaceNumbers(
  text: string,
  reps: Array<{ from: number; to: number }>
): string {
  const tokens = tokenizeNumbers(text);
  const used = new Array(reps.length).fill(false);
  let result = "";
  let cursor = 0;
  for (const t of tokens) {
    let idx = -1;
    for (let k = 0; k < reps.length; k++) {
      if (!used[k] && approx(reps[k].from, t.value)) {
        idx = k;
        break;
      }
    }
    const to = idx >= 0 ? reps[idx].to : t.value;
    if (idx >= 0) used[idx] = true;
    result += text.slice(cursor, t.start) + String(to);
    cursor = t.end;
  }
  result += text.slice(cursor);
  return result;
}

// ---------------------------------------------------------------------------
// explanation 處理
// ---------------------------------------------------------------------------

function buildExplanation(
  source: VariantSource,
  a0: Analyzed,
  nums: { a: number; b: number },
  ans: number
): string {
  const generic =
    a0.shape === "subtract"
      ? `解題思路：把兩個數量相減，答案是 ${ans}${a0.suffix}。`
      : `解題思路：用除法把總數平均分成幾份，答案是 ${ans}${a0.suffix}。`;

  if (!source.explanation) return generic;

  const replaced = replaceNumbers(source.explanation, [
    { from: a0.oldA, to: nums.a },
    { from: a0.oldB, to: nums.b },
  ]);

  // 若替換後仍殘留「舊答案」數值（且不等於新答案）→ 說明會誤導 → 改用通用說明
  const hasOld = tokenizeNumbers(replaced).some(
    (t) => approx(t.value, a0.answerVal) && !approx(t.value, ans)
  );
  return hasOld ? generic : replaced;
}

// ---------------------------------------------------------------------------
// 自我驗證閘門（return 前必須全過，否則回 null）
// ---------------------------------------------------------------------------

function verify(outcome: VariantOutcome): boolean {
  const q = outcome.question;
  if (q.options.length !== 4) return false;
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) return false;
  if (new Set(q.options).size !== 4) return false;

  const correctVal = parseNumeric(q.options[q.answer]);
  if (!correctVal) return false;

  const tokens = tokenizeNumbers(q.prompt);
  if (tokens.length !== 2) return false;
  const vals = tokens.map((t) => t.value);

  // 答案不得等於題幹中的任一數字
  if (approx(vals[0], correctVal.value) || approx(vals[1], correctVal.value)) return false;

  // 重算：題幹數字必須能唯一推導出正確答案
  const det = detectShape(vals, correctVal.value);
  if (!det) return false;
  if (!approx(det.computed, correctVal.value)) return false;

  // 三個干擾項都不等於正確答案
  for (let i = 0; i < 4; i++) {
    if (i === q.answer) continue;
    const dv = parseNumeric(q.options[i]);
    if (!dv) return false;
    if (approx(dv.value, correctVal.value)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// 對外 API
// ---------------------------------------------------------------------------

/** 這題能不能安全變體（內部等於 buildVariant(source, 0) !== null）。 */
export function canBuildVariant(source: VariantSource): boolean {
  if (source.id.includes("#")) return false; // 變體不可再變體，避免誤差累積
  return analyze(source) !== null;
}

/**
 * 產生變體。不安全一律回 null。
 * 同一個 (source, variantIndex) 必須產生完全相同的結果（可重現、可測試）。
 */
export function buildVariant(
  source: VariantSource,
  variantIndex: number
): VariantOutcome | null {
  if (source.id.includes("#")) return null; // 變體不可再變體，避免誤差累積
  if (!Number.isInteger(variantIndex) || variantIndex < 0) return null;

  const a0 = analyze(source);
  if (!a0) return null;

  const rng = mulberry32(seedFor(source.id, variantIndex));
  const nums = a0.shape === "subtract" ? genSubtract(rng) : genDivide(rng);
  if (!nums) return null;

  const { a, b } = nums;
  const ans = a0.shape === "subtract" ? a - b : a / b;

  // 題幹數字替換（保留單位與位置）
  const newPrompt = replaceNumbers(source.prompt, [
    { from: a0.oldA, to: a },
    { from: a0.oldB, to: b },
  ]);

  // 正確選項
  const correctText = `${ans}${a0.suffix}`;

  // 干擾項（典型錯誤）：減法可用 a+b、±1、±10；除法可用 a+b、±1、±2
  const raw =
    a0.shape === "subtract"
      ? [a + b, ans + 1, ans - 1, ans + 10, ans - 10]
      : [a + b, ans + 1, ans - 1, ans + 2, ans - 2];
  const candidates = raw.filter((v) => v >= 0 && !approx(v, ans));

  const seen = new Set<number>();
  const distractors: number[] = [];
  for (const c of candidates) {
    const r = Math.round(c);
    if (seen.has(r)) continue;
    seen.add(r);
    distractors.push(r);
    if (distractors.length === 3) break;
  }
  if (distractors.length < 3) return null;

  const optionTexts = [correctText, ...distractors.map((v) => `${v}${a0.suffix}`)];

  // 可重現洗牌（用同一支 rng）
  for (let i = optionTexts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [optionTexts[i], optionTexts[j]] = [optionTexts[j], optionTexts[i]];
  }

  const answerIdx = optionTexts.indexOf(correctText);
  if (answerIdx < 0) return null;

  const explanation = buildExplanation(source, a0, nums, ans);

  const outcome: VariantOutcome = {
    question: {
      id: `${source.id}#v${variantIndex}`,
      subject: source.subject,
      grade: source.grade,
      learningTopic: source.learningTopic,
      prompt: newPrompt,
      options: optionTexts,
      answer: answerIdx,
      explanation,
    },
    variantIndex,
    shape: a0.shape,
  };

  if (!verify(outcome)) return null;
  return outcome;
}
