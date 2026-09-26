#!/usr/bin/env node
/**
 * 把干擾項／答案優化 patch 應用到題庫。
 *
 * 用法：node scripts/apply-distractor-fixes.mjs <patch.json> [--dry-run]
 *
 * patch 格式（`_` 開頭的鍵會被忽略）：
 *   { "q373": { "options": ["...","...","...","..."], "answer": 1 }, ... }
 *
 * 會同時更新來源檔（taiwan_curriculum_500 / generated_bank）與產物檔
 * （runtime_bank_elementary / runtime_bank_junior），保持一致性。
 * 套用後若改到來源檔，記得重跑 scripts/build-runtime-bank.mjs。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const patchPath = process.argv[2];
const DRY = process.argv.includes("--dry-run");
if (!patchPath) {
  console.error("用法：node scripts/apply-distractor-fixes.mjs <patch.json> [--dry-run]");
  process.exit(2);
}

const raw = JSON.parse(readFileSync(patchPath, "utf8"));
const patch = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("_")));
console.log(`patch 題數：${Object.keys(patch).length}`);

const TARGETS = [
  { file: "data/taiwan_curriculum_500.json", indent: 2 },
  { file: "data/generated_bank.json", indent: null },
  { file: "data/runtime_bank_elementary.json", indent: null },
  { file: "data/runtime_bank_junior.json", indent: null },
];

const missing = new Set(Object.keys(patch));
let grand = 0;

for (const t of TARGETS) {
  const path = join(ROOT, t.file);
  if (!existsSync(path)) { console.log(`  跳過（不存在）${t.file}`); continue; }
  const data = JSON.parse(readFileSync(path, "utf8"));
  const list = data.questions ?? data.items ?? [];
  let n = 0;
  for (const q of list) {
    const fix = q && patch[q.id];
    if (!fix) continue;
    if (!Array.isArray(fix.options) || fix.options.length < 2) continue;
    if (!Number.isInteger(fix.answer) || fix.answer < 0 || fix.answer >= fix.options.length) continue;
    q.options = [...fix.options];
    q.answer = fix.answer;
    n += 1;
    missing.delete(q.id);
  }
  const text = (t.indent === null ? JSON.stringify(data) : JSON.stringify(data, null, t.indent)) + "\n";
  if (!DRY) writeFileSync(path, text, "utf8");
  console.log(`  ${DRY ? "[dry] " : ""}${t.file}: 套用 ${n} 題`);
  grand += n;
}

console.log(`合計套用 ${grand} 次（同一題可能出現在來源與產物檔）`);
if (missing.size) console.log(`⚠️ patch 中未在題庫找到：${[...missing].join(", ")}`);
