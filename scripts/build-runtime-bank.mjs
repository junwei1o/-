#!/usr/bin/env node
/**
 * 產生前端用的「精簡題庫」：data/runtime_bank_elementary.json、data/runtime_bank_junior.json
 *
 * 為什麼需要：完整的 data/taiwan_curriculum_500.json 有 1.1MB（含縮排），
 * 其中 learningPerformance / learningContent / competency 三個課綱欄位佔 185KB，
 * 但前端完全沒有顯示它們 → 白白被打包進 index 主包（1.6MB）。
 * 精簡檔只留執行期真的會用到的欄位，主包可瘦身。
 *
 * 來源仍是 data/taiwan_curriculum_500.json 與 data/junior_high_bank.json（單一真相）。
 * 用法：node scripts/build-runtime-bank.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const KEEP = [
  "id",
  "grade",
  "subject",
  "questionType",
  "difficulty",
  "curriculumDomain",
  "learningTopic",
  "prompt",
  "options",
  "answer",
  "explanation",
  "knowledge",
  // 跨學科結合題的科目組合（三科／五科）——前端要顯示「這題結合了哪幾科」時需要。
  "subjectCombination",
  "area",
];

/**
 * 來源對照：同一個輸出檔可以由多個來源合併（課綱題庫 + 自動產生的擴充題庫），
 * 擴充題庫依年級分流到國小／國中檔。合併時以題幹去重，保證「不重複」。
 */
const SOURCES = [
  {
    to: "data/runtime_bank_elementary.json",
    from: ["data/taiwan_curriculum_500.json"],
    generated: (q) => Number(q.grade) <= 6,
  },
  {
    to: "data/runtime_bank_junior.json",
    from: ["data/junior_high_bank.json"],
    generated: (q) => Number(q.grade) >= 7,
  },
];

let generated = [];
try {
  const parsed = JSON.parse(readFileSync(join(ROOT, "data/generated_bank.json"), "utf8"));
  generated = Array.isArray(parsed?.questions) ? parsed.questions : [];
} catch {
  console.log("（未找到 data/generated_bank.json，略過擴充題庫；可執行 node scripts/expand-question-bank.mjs 產生）");
}

let totalRaw = 0;
let totalSlim = 0;

for (const source of SOURCES) {
  const { to, from, generated: keepGenerated } = source;
  const questions = [];
  const seen = new Set();
  /**
   * 去重鍵＝科目＋題幹＋選項內容。
   * 只用題幹會把「同一題幹、不同選項」的變體題全部誤刪，題庫就鋪不開；
   * 但完全相同的題目（課綱題庫與擴充題庫重疊）仍會被擋掉。
   */
  const push = (question) => {
    const opts = [...(question.options ?? [])]
      .map((o) => String(o).replace(/\s+/g, ""))
      .sort();
    const key = `${question.subject ?? ""}|${String(question.prompt ?? "").replace(/\s+/g, "")}#${opts.join("|")}`;
    if (seen.has(key)) return;
    seen.add(key);
    questions.push(question);
  };
  let rawBytes = 0;
  for (const file of from) {
    const raw = readFileSync(join(ROOT, file), "utf8");
    rawBytes += Buffer.byteLength(raw, "utf8");
    const parsed = JSON.parse(raw);
    (Array.isArray(parsed?.questions) ? parsed.questions : []).forEach(push);
  }
  generated.filter(keepGenerated).forEach(push);
  totalRaw += rawBytes;
  const slim = questions.map((question) => {
    const out = {};
    for (const key of KEEP) {
      if (question[key] !== undefined && question[key] !== null) out[key] = question[key];
    }
    // 題型缺漏時依選項數推斷：兩個選項就是是非題，其餘視為選擇題。
    // 課綱題庫有近千題沒寫 questionType，前端會一律當成選擇題，是非題就失效了。
    if (!out.questionType) out.questionType = out.options?.length === 2 ? "是非題" : "選擇題";
    return out;
  });
  const out = {
    note: `由 ${from.join("、")} 與 data/generated_bank.json 自動產生的前端精簡題庫，請勿手動編輯；執行 node scripts/build-runtime-bank.mjs 重新產生。`,
    questions: slim,
  };
  const text = JSON.stringify(out);
  writeFileSync(join(ROOT, to), text + "\n", "utf8");
  totalRaw += rawBytes;
  totalSlim += Buffer.byteLength(text, "utf8");
  console.log(`${to}: ${slim.length} 題，${(Buffer.byteLength(text) / 1024).toFixed(0)} KB`);
}

const saved = ((totalRaw - totalSlim) / 1024).toFixed(0);
console.log(`原始 ${(totalRaw / 1024).toFixed(0)} KB → 精簡 ${(totalSlim / 1024).toFixed(0)} KB（省 ${saved} KB）`);
