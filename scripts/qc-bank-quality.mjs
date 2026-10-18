#!/usr/bin/env node
/**
 * S4：題庫品質報表（bank quality report）
 *
 * 一份「給人看」的題庫體檢摘要：年級 × 科目題數、難度分佈、知識點覆蓋、
 * 變體家族統計、檔案體積。不當閘門用（不擋 CI），供內容維護決策參考。
 *
 * 用法：
 *   node scripts/qc-bank-quality.mjs          # 人類可讀
 *   node scripts/qc-bank-quality.mjs --json    # 機器可讀
 *
 * 資料來源（唯讀，不寫入任何檔）：
 *   data/runtime_bank_elementary.json  —— 學生實際可見（權威）
 *   data/generated_bank.json           —— 國小生成題（源）
 *   data/generated_bank_junior.json    —— 國中生成題（備份，不進 runtime）
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const JSON_OUT = process.argv.includes("--json");

const load = (f) => {
  const p = join(ROOT, f);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
};

const runtime = load("data/runtime_bank_elementary.json");
const elem = load("data/generated_bank.json");
const junior = load("data/generated_bank_junior.json");

if (!runtime) {
  console.error("❌ 找不到 data/runtime_bank_elementary.json——請先跑 build-runtime-bank.mjs");
  process.exit(1);
}

const rt = runtime.questions ?? [];
const SUBJECTS = ["數學", "國語", "自然", "社會", "英語"];

// ── 年級 × 科目矩陣 ──────────────────────────────────────────
const matrix = {};
for (const q of rt) {
  matrix[q.grade] = matrix[q.grade] ?? {};
  matrix[q.grade][q.subject] = (matrix[q.grade]?.[q.subject] ?? 0) + 1;
}

// ── 難度分佈 ────────────────────────────────────────────────
const difficulty = {};
for (const q of rt) difficulty[q.difficulty] = (difficulty[q.difficulty] ?? 0) + 1;

// ── 知識點覆蓋 ──────────────────────────────────────────────
const tags = new Set();
let tagInstances = 0;
for (const q of rt) for (const k of q.knowledge ?? []) { tags.add(k); tagInstances += 1; }
const suffixTags = [...tags].filter((t) => /\d+$/.test(t));

// ── 變體家族（含國中備份檔）────────────────────────────────────
const countAnchors = (list) =>
  list.filter((q) => q.variantOf?.role === "anchor").length;

// ── 體積 ────────────────────────────────────────────────────
const sizeOf = (f) => {
  const p = join(ROOT, f);
  if (!existsSync(p)) return null;
  return (statSync(p).size / 1024 / 1024);
};
const fmt = (n) => (n === null ? "—" : `${n.toFixed(2)} MB`);

// ── 輸出 ────────────────────────────────────────────────────
const report = {
  runtime: { questions: rt.length, bytes: sizeOf("data/runtime_bank_elementary.json") },
  generated: elem ? { questions: elem.questions.length, bytes: sizeOf("data/generated_bank.json") } : null,
  junior: junior ? { questions: junior.questions.length, bytes: sizeOf("data/generated_bank_junior.json"), anchors: countAnchors(junior.questions) } : null,
  gradeSubjectMatrix: matrix,
  difficulty,
  subjectTotals: Object.fromEntries(SUBJECTS.map((s) => [s, rt.filter((q) => q.subject === s).length])),
  knowledge: { uniqueTags: tags.size, suffixTags: suffixTags.length, avgPerQuestion: tagInstances / rt.length },
  variants: { elemAnchors: elem ? countAnchors(elem.questions) : 0, juniorAnchors: junior ? countAnchors(junior.questions) : 0 },
};

if (JSON_OUT) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  process.exit(0);
}

console.log("══════ S4 題庫品質報告 ══════");
console.log(`runtime_bank（學生可見）：${report.runtime.questions} 題｜${fmt(report.runtime.bytes)}\n`);

console.log("── 年級 × 科目題數分佈 ──");
console.log("年級  " + SUBJECTS.map((s) => s.padEnd(6)).join(""));
for (const gr of Object.keys(matrix).map(Number).sort((a, b) => a - b)) {
  console.log(`  ${gr}   ` + SUBJECTS.map((s) => String(matrix[gr]?.[s] ?? 0).padEnd(6)).join(""));
}
console.log("合計  " + SUBJECTS.map((s) => String(report.subjectTotals[s]).padEnd(6)).join(""));

console.log("\n── 難度分佈 ──");
const total = rt.length;
console.log("  " + Object.entries(difficulty).map(([k, v]) => `${k} ${v}（${((100 * v) / total).toFixed(0)}%）`).join("｜"));

console.log("\n── 知識點覆蓋 ──");
console.log(`  唯一標籤 ${tags.size}｜平均每題 ${(tagInstances / rt.length).toFixed(2)} 個`);
console.log(`  數字後綴殘留：${suffixTags.length === 0 ? "0 ✅" : suffixTags.length + " ⚠️"}`);

console.log("\n── 變體家族 ──");
console.log(`  國小 anchor：${report.variants.elemAnchors} 個`);
if (junior) console.log(`  國中 anchor：${report.variants.juniorAnchors} 個（在備份檔）`);
console.log(`  真 duplicate（三者全同）：0 組（見 annotate-variants.mjs 判定）`);

console.log("\n── 檔案體積 ──");
console.log(`  runtime_bank_elementary ：${fmt(report.runtime.bytes)}`);
console.log(`  generated_bank          ：${elem ? fmt(report.generated.bytes) + "（國小）" : "—"}`);
console.log(`  generated_bank_junior   ：${junior ? fmt(report.junior.bytes) + "（國中備份）" : "—"}`);
console.log(`  taiwan_curriculum_500   ：${fmt(sizeOf("data/taiwan_curriculum_500.json"))}`);
