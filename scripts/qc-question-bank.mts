/**
 * 題庫體檢（QC）：找出會讓學生覺得「這題怪怪的」的變態題。
 *
 * 檢查項目：
 *  1. 結構：答案索引越界、選項重複、是非題選項數不對、缺詳解、缺 id
 *  2. 展開造成的變態題：干擾項落到「以上皆非／以上皆是」兜底的比例
 *     （這兩個選項出現在不該出現的地方，就是最典型的怪題）
 *  3. 干擾項是否出現「其實也是對的」嫌疑：與正解文字互相包含、長度落差過大
 *  4. 同題幹但答案不同（互相矛盾的雙胞胎題）
 *  5. 題幹過長、選項過長
 *
 * 用法：node_modules/.bin/tsx scripts/qc-question-bank.mts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expandQuestionBankToSix } from "../client/src/lib/optionRandomizer";

const ROOT = process.cwd();
const FILES = [
  "data/runtime_bank_elementary.json",
  "data/runtime_bank_junior.json",
  "data/taiwan_english_seed.json",
];

type Row = {
  id: string;
  grade: number;
  subject: string;
  questionType?: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  learningTopic?: string;
};

const rows: Row[] = FILES.flatMap((file) => {
  const parsed = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  return (Array.isArray(parsed?.questions) ? parsed.questions : []) as Row[];
});

console.log(`讀入 ${rows.length} 題\n`);

const problems: Array<{ type: string; detail: string }> = [];
const add = (type: string, detail: string) => problems.push({ type, detail });

// ── 1. 結構檢查 ──────────────────────────────────────────────────────
const ids = new Set<string>();
for (const q of rows) {
  if (!q.id) add("缺 id", q.prompt.slice(0, 30));
  else if (ids.has(q.id)) add("id 重複", q.id);
  ids.add(q.id);
  if (!Array.isArray(q.options) || q.options.length < 2) {
    add("選項數異常", `${q.id} 只有 ${q.options?.length ?? 0} 個選項`);
    continue;
  }
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
    add("答案索引越界", `${q.id} answer=${q.answer} options=${q.options.length}`);
  }
  const normalized = q.options.map((o) => o.replace(/\s+/g, ""));
  if (new Set(normalized).size !== normalized.length) add("選項內容重複", `${q.id}`);
  if (q.questionType === "是非題" && q.options.length !== 2) {
    add("是非題選項數不對", `${q.id} → ${q.options.length}`);
  }
  if (!q.explanation || q.explanation.trim().length < 6) add("詳解過短或缺漏", `${q.id}`);
  /**
   * 長度上限分兩類：
   * 一般題要求精簡（題幹 150 字、選項 60 字），超過就是敘述太囉嗦；
   * 跨學科結合題的情境與選項天生較長——它的選項要同時承載「數據 ＋ 各科判斷」，
   * 硬砍反而會讓題意不清，所以放寬到題幹 200 字、選項 110 字。
   */
  const isCrossSubject = Array.isArray((q as { subjectCombination?: unknown }).subjectCombination);
  const promptLimit = isCrossSubject ? 200 : 150;
  const optionLimit = isCrossSubject ? 110 : 60;
  if (q.prompt.length > promptLimit) add("題幹過長", `${q.id}（${q.prompt.length} 字）`);
  if (Math.max(...q.options.map((o) => o.length)) > optionLimit) {
    add("選項過長", `${q.id}（${Math.max(...q.options.map((o) => o.length))} 字）`);
  }
}

// ── 1.5 跨學科結合題 ────────────────────────────────────────────────
// 老師要的是「三科結合＋五科結合共 200 題」。這裡除了數量，也檢查
// 科目組合與知識點是否一對一（每個科目都要有對應的知識點，不能有科目是湊數的）。
const crossSubject = rows.filter((row) => {
  const combo = (row as { subjectCombination?: unknown }).subjectCombination;
  return Array.isArray(combo);
}) as Array<{ subjectCombination: string[]; knowledge: string[]; subject: string }>;
const three = crossSubject.filter((row) => row.subjectCombination.length === 3).length;
const five = crossSubject.filter((row) => row.subjectCombination.length === 5).length;
console.log("── 跨學科結合題 ──");
console.log(`總數：${crossSubject.length}（三科結合 ${three}、五科結合 ${five}）`);
console.log(`主科分布：${JSON.stringify(
  crossSubject.reduce<Record<string, number>>((acc, row) => {
    acc[row.subject] = (acc[row.subject] ?? 0) + 1;
    return acc;
  }, {}),
)}`);
for (const row of crossSubject) {
  const combo = row.subjectCombination;
  if (combo.length !== 3 && combo.length !== 5) {
    add("跨科題科目數不對", `${combo.join("、")}（${row.knowledge?.[0] ?? ""}）`);
  }
  if (new Set(combo).size !== combo.length) {
    add("跨科題科目重複", combo.join("、"));
  }
  // 每個科目都要有對應的知識點：知識點數必須與科目數相同，否則就是有科目沒真正參與。
  if (!Array.isArray(row.knowledge) || row.knowledge.length !== combo.length) {
    add("跨科題知識點與科目數不符", `${combo.join("、")} → ${row.knowledge?.length ?? 0} 個知識點`);
  }
}
if (crossSubject.length !== 200) add("跨科題數量不足", `應為 200，實際 ${crossSubject.length}`);

// ── 2. 同題幹不同答案 ────────────────────────────────────────────────
// 這是「變體題」設計的結果（同一句題幹配不同的選項組），不算錯誤；
// 但如果同一句題幹下面出現上百題，學生會覺得一直在寫同一題，這裡單獨統計。
const byPrompt = new Map<string, Set<string>>();
for (const q of rows) {
  const key = `${q.subject}|${q.prompt.replace(/\s+/g, "")}`;
  const set = byPrompt.get(key) ?? new Set<string>();
  set.add(q.options[q.answer]);
  byPrompt.set(key, set);
}
const variantGroups = [...byPrompt].filter(([, answers]) => answers.size > 1);
console.log("── 變體題統計（同一題幹、不同選項組）──");
console.log(`題幹重複使用的組數：${variantGroups.length}`);
for (const [key, answers] of variantGroups.sort((a, b) => b[1].size - a[1].size).slice(0, 5)) {
  console.log(`  ${answers.size} 種答案：${key.slice(0, 46)}`);
}
if (variantGroups.some(([, answers]) => answers.size > 40)) {
  add("同一題幹的變體過多", "超過 40 種，建議再拆題幹");
}

// ── 3. 展開後是否長出變態題 ──────────────────────────────────────────
const expanded = expandQuestionBankToSix(rows);
let genericCount = 0;
let expandedCount = 0;
let suspiciousLength = 0;
for (let i = 0; i < rows.length; i += 1) {
  const before = rows[i];
  const after = expanded[i];
  if (after.options.length === before.options.length) continue;
  expandedCount += 1;
  const extras = after.options.slice(before.options.length);
  if (extras.some((e) => e === "以上皆非" || e === "以上皆是")) genericCount += 1;
  const correct = before.options[before.answer];
  const avg = before.options.reduce((t, o) => t + o.length, 0) / before.options.length;
  if (extras.some((e) => e.length < avg * 0.3 || e.length > avg * 3)) suspiciousLength += 1;
  // 干擾項不該把正解包進去，也不該被正解包住（會出現兩個「看起來都對」的選項）
  if (extras.some((e) => e.includes(correct) || correct.includes(e))) {
    add("展開干擾項與正解互相包含", `${before.id}：${correct} vs ${extras.join(" / ")}`);
  }
}

console.log("── 展開統計 ──");
console.log(`可展開（4 選題）：${expandedCount} 題`);
console.log(`用到「以上皆非／以上皆是」兜底：${genericCount} 題（${((genericCount / Math.max(1, expandedCount)) * 100).toFixed(1)}%）`);
console.log(`干擾項長度與原選項落差過大：${suspiciousLength} 題（${((suspiciousLength / Math.max(1, expandedCount)) * 100).toFixed(1)}%）`);

console.log("\n── 問題清單 ──");
if (problems.length === 0) {
  console.log("沒有發現問題 ✅");
} else {
  const byType = new Map<string, number>();
  for (const p of problems) byType.set(p.type, (byType.get(p.type) ?? 0) + 1);
  for (const [type, count] of [...byType].sort((a, b) => b[1] - a[1])) {
    console.log(`${type}：${count} 題`);
  }
  console.log("\n前 15 筆明細：");
  for (const p of problems.slice(0, 15)) console.log(`  [${p.type}] ${p.detail}`);
}
