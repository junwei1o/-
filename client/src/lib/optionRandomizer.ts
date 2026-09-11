/**
 * 選項隨機化引擎：
 * 1. expandQuestionBankToSix — 把 4 選題擴充成 6 選題（額外產生 2 個確定錯誤的干擾選項）。
 * 2. shuffleQuestionOptions — 每次出題時隨機打乱選項順序，並同步修正 answer（與 strongDistractor）索引，
 *    讓正確答案不會固定在同一個位置（例如這次在 A、下次跳到 C）。
 *
 * 擴充只會「附加」在原選項後面，不會更動前 4 個選項的索引，因此 answer 欄位不需要修正；
 * 打乱時才會重新計算索引。整個模組為純函式，不依賴任何外部狀態。
 */

/** 可被打乱順序的題目形狀（试卷題、課綱題、遠征題都符合）。 */
export type ShuffleableQuestion = {
  options: string[];
  answer: number;
  strongDistractor?: { optionIndex: number; note: string };
};

/** 可被擴充成 6 選項的題目形狀（主題庫與遠征題庫的共同欄位）。 */
export type ExpandableQuestion = ShuffleableQuestion & {
  id: string;
  prompt: string;
  explanation: string;
  subject?: string;
  topic?: string;
  learningTopic?: string;
};

/** 題目條件無法安全產生數字干擾選項時的固定兜底（正解必為其他具體選項，兩者必定錯誤）。 */
const GENERIC_WRONG_OPTIONS = ["以上皆非", "以上皆是"] as const;

/** FNV-1a：把題目 id 轉成穩定的隨機種子。 */
export function hashStringToSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32：小型可重現亂數產生器。 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates：回傳 0..count-1 的隨機排列。 */
export function shuffledIndexes(count: number, random: () => number = Math.random): number[] {
  const indexes = Array.from({ length: count }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }
  return indexes;
}

/**
 * 打乱單題選項順序。`random` 可傳入 seededRandom(seed) 以在同一個出題session內維持穩定，
 * 或省略改用 Math.random 讓每次出題都不同。answer 與 strongDistractor.optionIndex 會同步對應新位置。
 */
export function shuffleQuestionOptions<T extends ShuffleableQuestion>(question: T, random: () => number = Math.random): T {
  if (!Array.isArray(question?.options) || question.options.length < 2) return question;
  if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) return question;
  const permutation = shuffledIndexes(question.options.length, random);
  const options = permutation.map((index) => question.options[index]);
  const answer = permutation.indexOf(question.answer);
  const strongDistractor = question.strongDistractor
    ? { ...question.strongDistractor, optionIndex: permutation.indexOf(question.strongDistractor.optionIndex) }
    : undefined;
  return { ...question, options, answer, ...(strongDistractor ? { strongDistractor } : {}) };
}

type BankPools = {
  /** key: `${subject} ${topic}` → 該主題所有題目的錯誤選項（已剔除全庫正解）。 */
  topicPools: Map<string, string[]>;
  /** key: subject → 該學科所有題目的錯誤選項（已剔除全庫正解）。 */
  subjectPools: Map<string, string[]>;
  /** 全題庫出現過的正解文字：借用的干擾選項絕不能是任何一題的正解。 */
  correctAnswers: Set<string>;
};

function topicKeyOf(question: ExpandableQuestion): string {
  const topic = question.learningTopic ?? question.topic ?? "";
  return `${String(question.subject ?? "")} ${String(topic)}`;
}

export function buildBankPools(questions: readonly ExpandableQuestion[]): BankPools {
  const correctAnswers = new Set<string>();
  for (const question of questions) {
    if (!Array.isArray(question?.options)) continue;
    const correct = question.options[question.answer];
    if (typeof correct === "string" && correct.trim()) correctAnswers.add(correct);
  }

  const topicPools = new Map<string, string[]>();
  const subjectPools = new Map<string, string[]>();
  const push = (map: Map<string, string[]>, key: string, option: string) => {
    const bucket = map.get(key);
    if (bucket) bucket.push(option);
    else map.set(key, [option]);
  };
  for (const question of questions) {
    if (!Array.isArray(question?.options)) continue;
    // 標點符號題的選項是「示範句子」，與其他題型永遠不相干，不進借用池
    if (/標點|句尾|句末/.test(question.prompt ?? "")) continue;
    const subject = String(question.subject ?? "");
    question.options.forEach((option, index) => {
      if (index === question.answer) return;
      // 借用別題干擾選項時，排除「曾經是任一題正解」的字串，大幅降低借到語意正確選項的風險。
      if (!option.trim() || correctAnswers.has(option)) return;
      if (subject) push(subjectPools, subject, option);
      push(topicPools, topicKeyOf(question), option);
    });
  }
  return { topicPools, subjectPools, correctAnswers };
}

/** 回傳 "integer"（純整數，可安全擾動）、"number"（小數／分數／百分比，僅走兜底）或 null（文字）。 */
function parseNumericKind(value: string): "integer" | "number" | null {
  const trimmed = value.trim();
  if (/^[+-]?\d{1,9}$/.test(trimmed)) return "integer";
  if (/^[+-]?\d{1,9}(\.\d+)?$/.test(trimmed) || /^[+-]?\d{1,9}\s*\/\s*\d{1,9}$/.test(trimmed) || /^[+-]?\d{1,9}(\.\d+)?%$/.test(trimmed)) {
    return "number";
  }
  return null;
}

function isPrime(value: number): boolean {
  if (!Number.isInteger(value) || value < 2) return false;
  if (value % 2 === 0) return value === 2;
  for (let divisor = 3; divisor * divisor <= value; divisor += 2) {
    if (value % divisor === 0) return false;
  }
  return true;
}

const NUMERIC_RULE_PATTERN = /(倍數|因數|整除|質數|偶數|奇數|平方|最簡|約分)/;

/**
 * 判斷候選數字「確定違反」題目敘述的條件（可安全當干擾選項）。
 * 無法解析題目規則時回傳 false（寧可不產生，也不冒險造出第二個正解）。
 */
function isDefinitelyWrongNumber(prompt: string, correct: number, candidate: number): boolean {
  if (candidate === correct) return false;
  const multipleMatch = prompt.match(/(?:被\s*)?(\d+)\s*的倍數/) ?? prompt.match(/被\s*(\d+)\s*整除/);
  if (multipleMatch) {
    const base = Number(multipleMatch[1]);
    if (base > 1 && correct % base === 0) return candidate % base !== 0;
    return false;
  }
  const factorMatch = prompt.match(/(\d+)\s*的因數/);
  if (factorMatch && !/公因數/.test(prompt)) {
    const base = Number(factorMatch[1]);
    if (base > 1 && base % correct === 0) return candidate > base || base % candidate !== 0;
    return false;
  }
  // 最大公因數／最小公倍數：答案是唯一計算值，任何相異數字都錯
  if (/公倍數|公因數/.test(prompt)) return true;
  if (/質數/.test(prompt)) {
    if (isPrime(correct)) return !isPrime(candidate);
    return false;
  }
  if (/偶數/.test(prompt)) {
    if (Math.abs(correct % 2) === 0) return Math.abs(candidate % 2) === 1;
    return false;
  }
  if (/奇數/.test(prompt)) {
    if (Math.abs(correct % 2) === 1) return candidate % 2 === 0;
    return false;
  }
  if (NUMERIC_RULE_PATTERN.test(prompt)) return false;
  // 一般計算／讀寫題：只要不是原答案，任何相異數字都確定錯誤。
  return true;
}

/** 比較類題目（誰最大／最遠…）數字擾動需檢查排序安全性。 */
const COMPARISON_PATTERN = /(最大|最小|最高|最低|最多|最少|最長|最短|最快|最慢|最接近|最遠|最大值|最小值)/;

/** 題幹已完整列出所有選項（列舉式題目），擾動／借用都容易產生第二正解。 */
function isEnumStylePrompt(prompt: string, options: readonly string[]): boolean {
  return options.every((option) => option.trim().length > 0 && prompt.includes(option));
}

function numericCandidatesFor(correct: number): number[] {
  const deltas = [1, -1, 2, -2, 3, -3, 10, -10, 11, -11, 100, -100];
  const candidates = deltas.map((delta) => correct + delta);
  candidates.push(correct * 2, Math.floor(correct / 2), correct * 10 + 5);
  return candidates.filter((candidate) => (correct >= 0 ? candidate >= 0 : true) && candidate !== correct);
}

/* ------------------------------------------------------------------ */
/* 擬真干擾項生成器（依題型選用，全部保證為錯誤答案）                       */
/* ------------------------------------------------------------------ */

/** 排序題（用 → 列出過程）：正確順序只有一種，其他排列都是「學生常見的順序錯誤」。 */
export function sequenceDistractors(options: readonly string[], correct: string): string[] {
  if (!options.some((option) => option.includes("→"))) return [];
  const stages = correct.split(/\s*→\s*/).map((stage) => stage.trim()).filter(Boolean);
  if (stages.length < 3 || new Set(stages).size !== stages.length) return [];
  const normalized = (value: string) => value.replace(/\s+/g, "");
  const taken = new Set(options.map(normalized));
  const arrow = correct.includes(" → ") ? " → " : "→";
  const results: string[] = [];
  for (let attempt = 0; attempt < 60 && results.length < 2; attempt += 1) {
    const permutation = shuffledIndexes(stages.length).map((index) => stages[index]);
    if (permutation.every((stage, index) => stage === stages[index])) continue;
    const candidate = permutation.join(arrow);
    if (taken.has(normalized(candidate)) || results.includes(candidate)) continue;
    taken.add(normalized(candidate));
    results.push(candidate);
  }
  return results;
}

/** 分數題：擾動分子／分母；比較題會驗證新分數確實落在安全側（不會比正解更大／更小）。 */
export function fractionDistractors(prompt: string, options: readonly string[], correct: string): string[] {
  // 帶分數答案（如「78 1/3」）：整數部分與分數部分分別擾動，數值相異即為錯誤
  const mixedMatch = correct.match(/^([+-]?\d{1,3})\s+(\d{1,3})\s*\/\s*(\d{1,3})$/);
  if (mixedMatch) {
    if (isEnumStylePrompt(prompt, options)) return [];
    const whole = Number(mixedMatch[1]);
    const numerator = Number(mixedMatch[2]);
    const denominator = Number(mixedMatch[3]);
    if (denominator === 0 || numerator >= denominator) return [];
    const existing = new Set(options);
    const raw = [
      `${whole + 1} ${numerator}/${denominator}`,
      `${whole - 1} ${numerator}/${denominator}`,
      `${whole} ${numerator}/${denominator + 1}`,
      `${whole} ${(numerator + 1) % denominator}/${denominator}`,
    ].filter((text) => text !== correct && !existing.has(text) && !text.startsWith("-"));
    return raw.slice(0, 2);
  }
  const correctMatch = correct.match(/^([+-]?\d{1,3})\s*\/\s*(\d{1,3})\s*$/);
  if (!correctMatch) return [];
  const numerator = Number(correctMatch[1]);
  const denominator = Number(correctMatch[2]);
  if (denominator === 0) return [];
  const correctValue = numerator / denominator;
  const existingValues: Array<{ text: string; value: number }> = [];
  const registerFraction = (text: string) => {
    const match = text.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
    if (!match) return;
    const denominator2 = Number(match[2]);
    if (denominator2 === 0) return;
    existingValues.push({ text: `${match[1]}/${match[2]}`, value: Number(match[1]) / denominator2 });
  };
  options.forEach(registerFraction);
  (prompt.match(/\d{1,3}\s*\/\s*\d{1,3}/g) ?? []).forEach(registerFraction);
  const comparison = COMPARISON_PATTERN.test(prompt);
  const wantsLower = /(最大|最多|最高|最長|最快)/.test(prompt);
  const wantsHigher = /(最小|最少|最低|最短|最慢)/.test(prompt);

  const rawPairs: Array<[number, number]> = [
    [numerator, denominator + 1],
    [numerator, denominator + 2],
    [numerator + 1, denominator],
    [numerator - 1, denominator],
    [numerator + 2, denominator],
    [denominator, numerator],
    [numerator, denominator - 1],
    [numerator - 1, denominator + 1],
  ];
  const results: string[] = [];
  for (const [num, den] of rawPairs) {
    if (results.length >= 2) break;
    if (den <= 0 || num < 0) continue;
    if (num === numerator && den === denominator) continue;
    const value = num / den;
    const text = `${num}/${den}`;
    if (existingValues.some((item) => Math.abs(item.value - value) < 0.001) || results.includes(text)) continue;
    if (comparison) {
      if (wantsLower && value >= correctValue - 0.001) continue;
      if (wantsHigher && value <= correctValue + 0.001) continue;
    }
    results.push(text);
  }
  return results;
}

/** 小數／百分比題：小幅擾動數值（比較題同樣做排序安全檢查）。 */
export function decimalDistractors(prompt: string, options: readonly string[], correct: string): string[] {
  const percentMatch = correct.match(/^([+-]?\d{1,3}(?:\.\d+)?)%$/);
  const decimalMatch = correct.match(/^[+-]?\d{1,3}\.\d+$/);
  if (!percentMatch && !decimalMatch) return [];
  const isPercent = Boolean(percentMatch);
  const value = Number(isPercent ? percentMatch![1] : decimalMatch![0]);
  const existing = new Set(options);
  const comparison = COMPARISON_PATTERN.test(prompt);
  const wantsLower = /(最大|最多|最高)/.test(prompt);
  const wantsHigher = /(最小|最少|最低)/.test(prompt);
  const deltas = isPercent ? [5, -5, 10, -10, 1, -1] : [0.1, -0.1, 0.2, -0.2, 0.05, -0.05];
  const results: string[] = [];
  for (const delta of deltas) {
    if (results.length >= 6) break;
    const candidateValue = Math.round((value + delta) * 100) / 100;
    if (isPercent && (candidateValue <= 0 || candidateValue >= 100)) continue;
    if (!isPercent && candidateValue < 0) continue;
    if (comparison) {
      if (wantsLower && candidateValue >= value) continue;
      if (wantsHigher && candidateValue <= value) continue;
    }
    const text = isPercent ? `${candidateValue}%` : String(candidateValue);
    if (existing.has(text) || results.includes(text)) continue;
    results.push(text);
  }
  return results;
}

/**
 * 代數式答案（如「3(x+5)」）：交換係數與加數、變換加減號——代表不同的算式，必然錯誤。
 */
export function algebraicDistractors(prompt: string, options: readonly string[], correct: string): string[] {
  if (isEnumStylePrompt(prompt, options)) return [];
  const match = correct.match(/^(\d+)\s*[（(]\s*([A-Za-z□])\s*([+\-－])\s*(\d+)\s*[)）]$/);
  if (!match) return [];
  const coefficient = Number(match[1]);
  const variable = match[2];
  const sign = match[3] === "－" ? "-" : match[3];
  const constant = Number(match[4]);
  const existing = new Set(options);
  const format = (coef: number, op: string, num: number) => `${coef}(${variable}${op}${num})`;
  const raw = [
    format(coefficient, sign === "+" ? "-" : "+", constant),
    format(constant, sign, coefficient),
    format(coefficient, sign, constant + 1),
    format(coefficient, sign, Math.max(0, constant - 1)),
  ];
  return raw.filter((text) => text !== correct && !existing.has(text)).slice(0, 2);
}

/** 時刻答案（如 10:05）：在小時／分鐘上產生合理偏移。 */
export function clockDistractors(correct: string): string[] {
  const match = correct.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return [];
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 24 || minute >= 60) return [];
  const format = (h: number, m: number) => `${String(h).padStart(match[1].length, "0")}:${String(m).padStart(2, "0")}`;
  const raw: Array<[number, number]> = [
    [hour, minute + 5],
    [hour, minute - 5],
    [hour, minute + 10],
    [hour, minute - 10],
    [hour + 1, minute],
    [hour - 1, minute],
  ];
  const results: string[] = [];
  for (const [h, m] of raw) {
    if (results.length >= 2) break;
    if (h < 0 || h > 24 || m < 0 || m >= 60 || (h === hour && m === minute)) continue;
    const text = format(h, m);
    if (!results.includes(text)) results.push(text);
  }
  return results;
}

/**
 * 含中文文字的數字答案（如「每位4支，剩2支」「2 小時 35 分鐘」「6顆檸檬和200克糖」）：
 * 保留文字骨架，擾動其中的數字——文字應用題的答案數值唯一，更動後即為錯誤答案。
 */
export function embeddedNumberDistractors(prompt: string, options: readonly string[], correct: string): string[] {
  if (isEnumStylePrompt(prompt, options)) return [];
  if (!/[一-龥]/.test(correct)) return [];
  // 判斷句（「每戶1人最多只有120人，未達200人」）內含算術約束，擾動任一數字
  // 都會讓句子自相矛盾（如「每戶2人……最多只有120人」），必須整題跳過。
  if (/最多(只有|只能)|至少(要|需要)|未達/.test(correct)) return [];
  const numberMatches = Array.from(correct.matchAll(/\d+/g));
  if (numberMatches.length === 0) return [];
  const existing = new Set(options);
  const results: string[] = [];
  const seenTokens = new Set<string>();
  for (const match of numberMatches) {
    if (results.length >= 6) break;
    if (seenTokens.has(match[0])) continue; // 同一數字出現多次（如「-21 公釐（下降21公釐）」）只處理一次，全部同步取代
    seenTokens.add(match[0]);
    const value = Number(match[0]);
    // 數量級小的數用 ±1±2；時間／分數值較大的數用 ±5±10 更像學生計算錯誤
    const deltas = value >= 20 ? [5, -5, 10, -10, 1, -1] : [1, -1, 2, -2, 5, -5];
    for (const delta of deltas) {
      if (results.length >= 6) break;
      const next = value + delta;
      if (next < 0 || next === value) continue;
      // 同步取代所有同值數字（不誤傷其他數字內部的子字串）
      const tokenPattern = new RegExp(`(?<!\\d)${value}(?!\\d)`, "g");
      const candidate = correct.replace(tokenPattern, String(next));
      if (candidate === correct || existing.has(candidate) || results.includes(candidate)) continue;
      results.push(candidate);
    }
  }
  return results;
}

/** 「數字＋單位」答案（如「9 包」「26 公尺」「60 公里/小時」）：擾動數字但保留單位。 */
export function numberWithUnitDistractors(prompt: string, options: readonly string[], correct: string): string[] {
  if (isEnumStylePrompt(prompt, options)) return [];
  const match = correct.match(/^([+-]?\d{1,9})(\s*)([\u4e00-\u9fff（）()/]{1,8})$/);
  if (!match) return [];
  const number = Number(match[1]);
  const spacing = match[2];
  const unit = match[3];
  if (!/[一-龥]/.test(unit)) return [];
  const existing = new Set(options);
  const results: string[] = [];
  for (const candidate of numericCandidatesFor(number)) {
    if (results.length >= 6) break;
    if (!isDefinitelyWrongNumber(prompt, number, candidate)) continue;
    const text = `${candidate}${spacing}${unit}`;
    if (existing.has(text) || results.includes(text)) continue;
    results.push(text);
  }
  return results;
}

/** 國語閱讀題：從題幹文段抽出「故事中真的提到、但答非所問」的事件句，最為擬真。 */
export function passageClauseDistractors(subject: string | undefined, prompt: string, options: readonly string[], correct: string): string[] {
  if (subject !== "國語" && subject !== "chinese") return [];
  if (/心情|感受|感覺/.test(prompt)) return [];
  // 是非／評價題（選項共用「恰當／不恰當／正確／錯誤」等答案框架）：故事子句無法回答這類題型
  const answerFrameCount = options.filter((option) => /^(不)?(恰當|正確|錯誤|同意|應該|可以|可能|一樣)/.test(option.trim())).length;
  if (answerFrameCount >= 3) return [];
  const body = prompt.replace(/^(段落|寓言|故事|短文|文章|閱讀)[：:]/, "").split(/[?？]/)[0] ?? "";
  if (!body.includes("，") && !body.includes("。")) return [];
  const existingBigramSets = options.map((option) => contentBigrams(option));
  const correctBigramSet = contentBigrams(correct);
  const results: string[] = [];
  const sentences = body.split(/[。！？]/).map((sentence) => sentence.trim()).filter(Boolean);
  for (const sentence of sentences) {
    for (let clause of sentence.split(/[，；;、]/)) {
      clause = clause.trim().replace(/^(然後|接著|後來|於是|因此|所以|但是|可是|不過|再來|她|他|他們|她們|牠|它)/, "").trim();
      if (clause.length < 6 || clause.length > 36) continue;
      if (/[「」『』]/.test(clause)) continue;
      // 避開疑問／對話引導性文字
      if (/[請問下列哪一什麼誰多少何時哪裡為何為什麼怎麼如何]/.test(clause)) continue;
      // 不能與正解或任一現有選項描述同一件事（語意重疊過高）
      const clauseBigramSet = contentBigrams(clause);
      const overlapsWith = (other: Set<string>) => {
        let count = 0;
        clauseBigramSet.forEach((bigram) => {
          if (other.has(bigram)) count += 1;
        });
        return count;
      };
      const correctOverlap = overlapsWith(correctBigramSet);
      if (correctOverlap >= 2) continue;
      if (existingBigramSets.some((other) => overlapsWith(other) >= Math.max(2, other.size * 0.5))) continue;
      if (results.includes(clause)) continue;
      results.push(clause);
      if (results.length >= 2) return results;
    }
  }
  return results;
}

/**
 * 封閉類別概念庫：當選項空間本身就屬於同一類別（≥3 個現有選項落在類別中），
 * 補上同類別的其他成員——題目只問其中唯一正解，其他成員必然錯誤且很擬真。
 */
const CATEGORY_DISTRACTORS: Array<{ name: string; members: string[] }> = [
  { name: "direction", members: ["北方", "南方", "東方", "西方", "東北方", "東南方", "西北方", "西南方", "北", "南", "東", "西"] },
  {
    name: "emotion",
    members: ["高興", "快樂", "開心", "興奮", "期待", "驕傲", "感動", "放心", "安心", "傷心", "難過", "失望", "後悔", "委屈", "害怕", "恐懼", "緊張", "擔心", "生氣", "憤怒", "驚訝", "好奇", "無聊", "冷漠", "不耐煩", "羨慕", "感謝", "疲倦", "煩惱", "憂愁"],
  },
  { name: "season", members: ["春天", "夏天", "秋天", "冬天", "春季", "夏季", "秋季", "冬季"] },
  { name: "plantPart", members: ["根", "莖", "葉", "花", "果實", "種子"] },
  // 雲的分類：正解只有一種雲，其他真實雲名必然答非所問
  { name: "cloud", members: ["卷雲", "積雲", "層雲", "積雨雲", "高積雲", "層積雲", "雨層雲", "高層雲", "卷積雲", "卷層雲"] },
  // 時段：只與明確時段並列，且避開「傍晚／黃昏」「清晨／凌晨」等同義詞，杜絕第二正解
  { name: "timeOfDay", members: ["清晨時分", "中午時分", "傍晚時分", "深夜時分", "上午時分", "下午時分"] },
  // 幾何圖形與角：性質題正解唯一，其他圖形／角類必然不符合條件
  { name: "shape", members: ["正方形", "長方形", "三角形", "梯形", "平行四邊形", "菱形", "圓形", "五邊形", "六邊形", "正三角形"] },
  { name: "angle", members: ["銳角", "直角", "鈍角", "平角", "周角"] },
  // 統計／喜好調查題：題目只問列出的項目，沒列入的同類項目必然不是答案
  {
    name: "fruit",
    members: ["蘋果", "香蕉", "葡萄", "柳橙", "橘子", "西瓜", "草莓", "芒果", "鳳梨", "水梨", "桃子", "李子", "木瓜", "芭樂", "哈密瓜", "櫻桃", "檸檬", "火龍果"],
  },
  {
    name: "sport",
    members: ["足球", "籃球", "棒球", "游泳", "跑步", "跳繩", "桌球", "羽毛球", "排球", "網球", "躲避球"],
  },
];

function categoryMemberMatches(option: string, member: string): boolean {
  const normalized = option.trim();
  if (normalized === member) return true;
  // 前綴匹配（如「高興又放心」以「高興」開頭、「卷雲（高空薄雲）」以「卷雲」開頭）
  return member.length >= 2 && normalized.startsWith(member);
}

/**
 * 標籤枚舉題（題幹列了甲～丁幾個對象、A～C 幾組、星期一～五，選項就是這些標籤）：
 * 補上「序列中存在、但題幹完全沒提到」的標籤——題目只問列舉對象，沒提到的標籤必然錯誤。
 * 支援「乙公園」「A 組」「社區A」「星期一」等前後綴形式。
 */
const LABEL_SEQUENCES: string[][] = [
  ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"],
  ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日", "星期天"],
  ["A", "B", "C", "D", "E", "F", "G", "H"],
];

export function labelDistractors(prompt: string, options: readonly string[], correct: string): string[] {
  for (const labels of LABEL_SEQUENCES) {
    const labelAlt = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((a, b) => b.length - a.length).join("|");
    const extract = (text: string): { prefix: string; label: string; suffix: string } | null => {
      const match = text.trim().match(new RegExp(`^(.*?)(${labelAlt})(.*)$`));
      if (!match) return null;
      return { prefix: match[1], label: match[2], suffix: match[3] };
    };
    const parsed = options.map((option) => extract(option));
    const matched = parsed.filter((item): item is NonNullable<typeof item> => Boolean(item));
    if (matched.length < 3) continue;
    // 取前後綴模板一致的最大群組（如「村A／村B／村C」一組，容許夾雜「村B與村C一樣」這類選項）
    const groups = new Map<string, NonNullable<typeof matched[number]>[]>();
    for (const item of matched) {
      const key = `${item.prefix}⟦${item.suffix}`;
      const group = groups.get(key);
      if (group) group.push(item);
      else groups.set(key, [item]);
    }
    const templateGroup = Array.from(groups.values()).sort((a, b) => b.length - a.length)[0];
    if (!templateGroup || templateGroup.length < 3) continue;
    const template = templateGroup[0];
    const correctParsed = extract(correct);
    if (!correctParsed || correctParsed.prefix !== template.prefix || correctParsed.suffix !== template.suffix) continue;
    const promptLabels = new Set(Array.from(prompt.matchAll(new RegExp(labelAlt, "g"))).map((match) => match[0]));
    const usedLabels = new Set(templateGroup.map((item) => item.label));
    const results: string[] = [];
    for (const label of labels) {
      if (results.length >= 2) break;
      if (promptLabels.has(label) || usedLabels.has(label)) continue;
      results.push(template.prefix + label + template.suffix);
    }
    return results;
  }
  return [];
}

export function categoryDistractors(options: readonly string[], correctAnswerSet: Set<string>): string[] {
  const averageLength = options.reduce((total, option) => total + option.length, 0) / options.length;
  if (averageLength > 12) return []; // 長句選項不適用單詞類別（含括號說明的類別成員可達 10 字左右）
  for (const category of CATEGORY_DISTRACTORS) {
    const matchCount = options.filter((option) => category.members.some((member) => categoryMemberMatches(option, member))).length;
    if (matchCount < 3) continue;
    return category.members.filter((member) =>
      options.every((option) => !categoryMemberMatches(option, member)) &&
      !correctAnswerSet.has(member));
  }
  return [];
}

/**
 * 長句情緒選項（「情緒，因為……」形式）：選項空間是各種情緒反應時，
 * 補上其他合理情緒反應——正確情緒只有一個，其他情緒必然是錯的。
 */
const EMOTION_PHRASE_DISTRACTORS: Array<{ word: string; text: string }> = [
  { word: "興奮", text: "興奮，因為覺得新鮮有趣" },
  { word: "失望", text: "失望，因為期待沒有實現" },
  { word: "後悔", text: "後悔，因為自己沒有及時幫忙" },
  { word: "驕傲", text: "驕傲，因為想在大家面前炫耀" },
  { word: "不耐煩", text: "不耐煩，因為覺得等待很浪費時間" },
  { word: "緊張", text: "緊張，因為害怕事情出錯" },
];

export function emotionPhraseDistractors(options: readonly string[]): string[] {
  const emotionLike = options.filter((option) =>
    option.includes("因為") && CATEGORY_DISTRACTORS[1].members.some((member) => option.startsWith(member)));
  if (emotionLike.length < 2) return [];
  const used = new Set(options);
  return EMOTION_PHRASE_DISTRACTORS
    .filter((item) => !options.some((option) => option.startsWith(item.word)) && !used.has(item.text))
    .slice(0, 2)
    .map((item) => item.text);
}

/* ---- 跨題借用：加嚴語意關聯過濾，避免借到跟題幹無關的選項 ---- */

const FUNCTION_CHARACTERS = /[的了在是他她它們著地之與和也都會要把被向從對為或及等以可能我你一這那有個種項上下中裡時後前又再很最不沒]/;

/** 擷取中文連續二元詞（依標點/非中文字斷詞，去除功能字），作為語意關聯指紋。 */
export function contentBigrams(text: string): Set<string> {
  const bigrams = new Set<string>();
  for (const run of text.match(/[一-龥]+/g) ?? []) {
    for (let index = 0; index < run.length - 1; index += 1) {
      if (FUNCTION_CHARACTERS.test(run[index]) || FUNCTION_CHARACTERS.test(run[index + 1])) continue;
      bigrams.add(run[index] + run[index + 1]);
    }
  }
  return bigrams;
}

/** 抽出文中出現的稱呼（小明／阿美／王老師），用於過濾借來選項中無中生有的人物。 */
function nameTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  (text.match(/[小阿老][一-龥]/g) ?? []).forEach((token) => tokens.add(token));
  return tokens;
}

export function borrowingCandidates(
  question: ExpandableQuestion,
  pools: BankPools,
  prompt: string,
): string[] {
  const topicPool = pools.topicPools.get(topicKeyOf(question)) ?? [];
  const subjectPool = pools.subjectPools.get(String(question.subject ?? "")) ?? [];
  const promptBigrams = contentBigrams(prompt);
  const promptNames = nameTokens(prompt);
  const averageOptionLength = question.options.reduce((total, option) => total + option.length, 0) / question.options.length;
  // 標點符號題的選項是標點示範句，任何文字借項都不相干
  const isPunctuationQuestion = /標點|句尾|句末/.test(prompt);
  const promptCharacters = new Set(prompt.match(/[一-龥]/g) ?? []);
  const candidates: string[] = [];
  const seen = new Set<string>();

  const evaluate = (candidateRaw: string, bigramThreshold: number, allowShort: boolean): void => {
    const candidate = candidateRaw.trim();
    if (!candidate || seen.has(candidate)) return;
    if (isPunctuationQuestion) return;
    // 人物一致性：借來的選項不能冒出題幹裡不存在的角色
    const candidateNames = nameTokens(candidate);
    for (const name of Array.from(candidateNames)) {
      if (!promptNames.has(name)) return;
    }
    // 語意關聯：長選項需共享實詞二元詞，且內容字覆蓋率達一定比例（防止只靠一個常見詞通過）；
    // 短選項（字詞題）僅開放同主題池，且需共享至少 2 個實字。
    const candidateContentChars = (candidate.match(/[一-龥]/g) ?? []).filter((character) => !FUNCTION_CHARACTERS.test(character));
    if (averageOptionLength > 6) {
      let overlap = 0;
      for (const bigram of Array.from(contentBigrams(candidate))) {
        if (promptBigrams.has(bigram)) overlap += 1;
      }
      if (overlap < bigramThreshold) return;
      const sharedCharacters = candidateContentChars.filter((character) => promptCharacters.has(character)).length;
      if (candidateContentChars.length > 0 && sharedCharacters / candidateContentChars.length < 0.2) return;
    } else {
      if (!allowShort) return;
      if (candidate.length > 6) return;
      const sharedCharacters = candidateContentChars.filter((character) => promptCharacters.has(character)).length;
      if (sharedCharacters < 2) return;
    }
    // 長度級距：不要拿簡短詞當長句題的選項，反之亦然
    if (candidate.length < averageOptionLength * 0.4 || candidate.length > averageOptionLength * 2.8) return;
    seen.add(candidate);
    candidates.push(candidate);
  };

  for (const candidate of topicPool) {
    if (candidates.length >= 20) break;
    evaluate(candidate, 1, true); // 同主題：可提供短選項
  }
  for (const candidate of subjectPool) {
    if (candidates.length >= 20) break;
    evaluate(candidate, 1, false); // 同學科不同主題：僅長選項且需通過覆蓋率
  }
  return shuffledIndexes(candidates.length).map((index) => candidates[index]);
}

/**
 * 把整份題庫擴充成 6 選項（原本已是 6 選項或非 4 選題維持原樣）。
 * 干擾選項依題型產生，優先序：
 * 1. 排序題：正確過程的另一種（錯誤）排列；
 * 2. 數字題：規則驗證的整數／分數／小數／單位擾動；
 * 3. 文字題：文段事件抽取 → 封閉類別概念庫 → 加嚴關聯過濾的跨題借用；
 * 4. 兜底：「以上皆非」「以上皆是」（正解為具體選項時必定錯誤）。
 */
export function expandQuestionBankToSix<T extends ExpandableQuestion>(questions: readonly T[]): T[] {
  const pools = buildBankPools(questions);
  return questions.map((question) => expandOne(question, pools));
}

function expandOne<T extends ExpandableQuestion>(question: T, pools: BankPools): T {
  if (!Array.isArray(question?.options) || question.options.length !== 4) return question;
  if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= 4) return question;
  const correct = question.options[question.answer];
  if (typeof correct !== "string" || !correct.trim()) return question;

  const prompt = question.prompt ?? "";
  const explanation = question.explanation ?? "";
  const banned = new Set(question.options);
  const extras: string[] = [];
  const isUsable = (candidate: string, trusted = false) =>
    candidate.trim().length > 0 &&
    !banned.has(candidate) &&
    (trusted || !pools.correctAnswers.has(candidate)) &&
    !explanation.includes(candidate) &&
    !(candidate.includes(correct) || correct.includes(candidate));

  const tryAdd = (candidate: string, allowInPrompt = false, trusted = false): boolean => {
    if (extras.length >= 2 || !isUsable(candidate, trusted)) return false;
    if (!allowInPrompt && prompt.includes(candidate)) return false;
    extras.push(candidate);
    banned.add(candidate);
    return true;
  };

  const runGenerator = (generator: () => string[], allowInPrompt = false, trusted = false) => {
    if (extras.length >= 2) return;
    for (const candidate of generator()) {
      if (extras.length >= 2) break;
      tryAdd(candidate, allowInPrompt, trusted);
    }
  };

  // 1. 排序題：錯誤排列（文段內容本身，允許出現在題幹中）
  runGenerator(() => sequenceDistractors(question.options, correct), true, true);
  // 2. 分數／小數：擾動後驗證排序安全（規則生成，trusted）
  runGenerator(() => fractionDistractors(prompt, question.options, correct), false, true);
  runGenerator(() => decimalDistractors(prompt, question.options, correct), false, true);
  // 時刻（10:05）小時分鐘偏移
  runGenerator(() => clockDistractors(correct), false, true);
  // 3. 純整數：依題目規則驗證（倍數／因數／質數／奇偶）
  if (parseNumericKind(correct) === "integer" && !isEnumStylePrompt(prompt, question.options)) {
    runGenerator(() =>
      numericCandidatesFor(Number(correct))
        .filter((candidateNumber) => isDefinitelyWrongNumber(prompt, Number(correct), candidateNumber))
        .map(String), false, true);
  }
  // 4. 數字＋單位；句中夾帶數字的文字敘述答案；代數式
  runGenerator(() => numberWithUnitDistractors(prompt, question.options, correct), false, true);
  runGenerator(() => embeddedNumberDistractors(prompt, question.options, correct), false, true);
  runGenerator(() => algebraicDistractors(prompt, question.options, correct), false, true);
  // 5. 國語文字題：文段事件抽取（來自題幹本身，允許在 prompt 中）
  runGenerator(() => passageClauseDistractors(String(question.subject ?? ""), prompt, question.options, correct), true, true);
  // 6. 封閉類別概念庫（方向／情緒／季節／植物部位／雲類／時段）與長句情緒反應
  runGenerator(() => categoryDistractors(question.options, pools.correctAnswers), false, true);
  runGenerator(() => emotionPhraseDistractors(question.options), false, true);
  // 6.5 標籤枚舉題（甲乙丙丁、A～C 組、星期一～五）：補題幹沒提到的序列標籤
  runGenerator(() => labelDistractors(prompt, question.options, correct), false, true);
  // 7. 加嚴關聯過濾的跨題借用（來自他題，仍維持全庫正解排除）
  runGenerator(() => borrowingCandidates(question, pools, prompt));

  for (const generic of GENERIC_WRONG_OPTIONS) {
    if (extras.length >= 2) break;
    if (banned.has(generic)) continue;
    extras.push(generic);
    banned.add(generic);
  }

  if (extras.length === 0) return question;
  // 只附加在後面：前 4 個選項索引不變，answer／strongDistractor 維持有效。
  return { ...question, options: [...question.options, ...extras] };
}
