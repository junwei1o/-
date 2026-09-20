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
  "area",
];

const SOURCES = [
  { from: "data/taiwan_curriculum_500.json", to: "data/runtime_bank_elementary.json" },
  { from: "data/junior_high_bank.json", to: "data/runtime_bank_junior.json" },
];

let totalRaw = 0;
let totalSlim = 0;

for (const { from, to } of SOURCES) {
  const raw = readFileSync(join(ROOT, from), "utf8");
  const parsed = JSON.parse(raw);
  const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
  const slim = questions.map((question) => {
    const out = {};
    for (const key of KEEP) {
      if (question[key] !== undefined) out[key] = question[key];
    }
    return out;
  });
  const out = {
    note: `由 ${from} 自動產生的前端精簡題庫，請勿手動編輯；執行 node scripts/build-runtime-bank.mjs 重新產生。`,
    questions: slim,
  };
  const text = JSON.stringify(out);
  writeFileSync(join(ROOT, to), text + "\n", "utf8");
  totalRaw += Buffer.byteLength(raw, "utf8");
  totalSlim += Buffer.byteLength(text, "utf8");
  console.log(`${to}: ${slim.length} 題，${(Buffer.byteLength(text) / 1024).toFixed(0)} KB`);
}

const saved = ((totalRaw - totalSlim) / 1024).toFixed(0);
console.log(`原始 ${(totalRaw / 1024).toFixed(0)} KB → 精簡 ${(totalSlim / 1024).toFixed(0)} KB（省 ${saved} KB）`);
