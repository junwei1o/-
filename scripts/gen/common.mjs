/**
 * 題庫擴充管線共用工具。
 *
 * 設計重點：
 *  1. 決定性亂數（seed）→ 每次執行產生同一份題庫，方便 code review 與回歸。
 *  2. 選項一律經 uniqueOptions() 組裝：正解一定在、干擾項與正解不重複、彼此不重複。
 *  3. 去重以「正規化題幹」為鍵，避免不同數字/情境其實長一樣。
 *  4. 數學題的答案由程式「算出來」，不是寫死的，從根源避免答案錯誤的變態題。
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickMany(rng, arr, count) {
  const pool = [...arr];
  const out = [];
  while (out.length < count && pool.length > 0) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

export function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 去掉標點與空白，用於比對題幹是否重複。 */
export function normalize(text) {
  return String(text ?? "")
    .replace(/\s+/g, "")
    .replace(/[，。！？、；：「」『』（）()．.,!?;:]/g, "");
}

/**
 * 組裝四選一選項：正解 + 從干擾池取不重複者。
 * 干擾池湊不滿時直接回傳不足的選項（makeQuestion 會擋下來回傳 null），
 * 讓呼叫端換一組數字重出——絕不用「以上皆非」這類通用選項補位。
 * 那 103 題混進題庫的「以上皆非」就是這個補位造成的（2026-09-20 移除）。
 */
export function uniqueOptions(rng, correct, distractors, count = 4) {
  const options = [String(correct)];
  const seen = new Set([normalize(String(correct))]);
  for (const d of shuffle(rng, distractors)) {
    if (options.length >= count) break;
    const key = normalize(d);
    if (key === "" || seen.has(key)) continue;
    seen.add(key);
    options.push(String(d));
  }
  return shuffle(rng, options);
}

/** 是非題固定兩個選項。 */
export function trueFalseOptions(correctIsTrue) {
  return correctIsTrue ? ["正確", "錯誤"] : ["正確", "錯誤"];
}

let idCounter = 0;
const idPrefixes = new Map();

/** 產生穩定且唯一的分層 id（例：gen-math-0042）。 */
export function nextId(subject) {
  const prefixMap = {
    數學: "math",
    自然: "sci",
    社會: "soc",
    國語: "chi",
    英語: "eng",
  };
  const prefix = prefixMap[subject] ?? "gen";
  const n = (idPrefixes.get(prefix) ?? 0) + 1;
  idPrefixes.set(prefix, n);
  idCounter += 1;
  return `gen-${prefix}-${String(n).padStart(4, "0")}`;
}

export const DOMAIN = {
  數學: "數學領域",
  自然: "自然科學領域",
  社會: "社會領域",
  國語: "語文領域",
  英語: "語文領域",
};

/**
 * 建立一題標準題目物件，並做基本的合法性檢查。
 * 任何一題不合法就回傳 null，由呼叫端丟棄（寧可少一題，也不要出現變態題）。
 */
export function makeQuestion({
  subject,
  grade,
  topic,
  difficulty = "標準",
  prompt,
  options,
  answer,
  explanation,
  knowledge,
  questionType = "選擇題",
  /** 跨學科結合題會帶這欄：這題結合了哪幾個科目（單科題不帶）。 */
  subjectCombination,
}) {
  const opts = options.map((o) => String(o));
  const expected = questionType === "是非題" ? 2 : 4;
  if (!prompt || opts.length !== expected) return null;
  if (new Set(opts.map(normalize)).size !== opts.length) return null;
  if (!Number.isInteger(answer) || answer < 0 || answer >= opts.length) return null;
  if (!explanation) return null;
  if (!Array.isArray(knowledge) || knowledge.length === 0) return null;
  return {
    id: nextId(subject),
    grade,
    subject,
    questionType,
    difficulty,
    curriculumDomain: DOMAIN[subject] ?? "語文領域",
    learningTopic: topic,
    prompt: String(prompt),
    options: opts,
    answer,
    explanation: String(explanation),
    knowledge,
    area: null,
    ...(subjectCombination ? { subjectCombination } : {}),
  };
}

/** 四選一：從干擾池組選項並自動定位正解索引。 */
export function buildChoice(rng, spec) {
  const options = uniqueOptions(rng, spec.correct, spec.distractors ?? []);
  const answer = options.indexOf(String(spec.correct));
  if (answer < 0) return null;
  return makeQuestion({ ...spec, options, answer });
}

/** 是非題。 */
export function buildTrueFalse(rng, spec) {
  const options = trueFalseOptions(spec.isTrue);
  const answer = spec.isTrue ? 0 : 1;
  return makeQuestion({ ...spec, options, answer, questionType: "是非題" });
}

/**
 * 去重鍵＝題幹＋選項內容。
 *
 * 早期版本只用題幹當鍵，結果「下列關於自然的敘述，哪一項是正確的？」這種
 * 跨單元題永遠只能生出一題（題幹相同就被丟掉），變體題的空間全被浪費。
 * 改成題幹＋選項後，同一題幹配不同選項仍算不同題，變體題才能真正鋪開。
 * 注意：選項順序不影響鍵值，避免亂數排序造成假重複。
 */
export function contentKey(question) {
  const opts = [...(question?.options ?? [])].map((o) => normalize(o)).sort();
  return `${normalize(question?.prompt)}#${opts.join("|")}`;
}

/**
 * 年級配額：避免題庫集中在五、六年級，讓每個年級都有一定的題量。
 * 產生器取到名額才生題；題目最後被去重丟掉時要 release 歸還名額。
 */
export function createGradeQuota(limits) {
  const used = new Map();
  const limitOf = (grade) => Number(limits?.[grade] ?? 0);
  return {
    take(grade) {
      if ((used.get(grade) ?? 0) >= limitOf(grade)) return false;
      used.set(grade, (used.get(grade) ?? 0) + 1);
      return true;
    },
    release(grade) {
      used.set(grade, Math.max(0, (used.get(grade) ?? 1) - 1));
    },
    usedOf(grade) {
      return used.get(grade) ?? 0;
    },
    limitOf,
  };
}

/** 去重收集器：內容（題幹＋選項）相同的題目只保留第一次出現的。 */
export function createCollector() {
  const seen = new Set();
  const items = [];
  return {
    get size() {
      return items.length;
    },
    has(question) {
      return seen.has(contentKey(question));
    },
    add(question) {
      if (!question) return false;
      const key = contentKey(question);
      if (seen.has(key)) return false;
      seen.add(key);
      items.push(question);
      return true;
    },
    /** 先載入既有題庫，讓新題自動避開已有的題目內容。 */
    seedAll(questions) {
      for (const q of questions) seen.add(contentKey(q));
    },
    list() {
      return items;
    },
  };
}
