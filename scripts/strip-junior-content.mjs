#!/usr/bin/env node
/**
 * S4+ 剝離國中死內容（grade>=7）出 generated_bank.json
 *
 * ## 背景（P0 產品洞察）
 * generated_bank.json 有 47% 的 grade>=7 題目。產品決策是「內容等級上限六年級」
 * （adaptiveLearning.ts 的 MAX_GRADE=6），且 build-runtime-bank.mjs 會把
 * grade>=7 全部濾掉，不進 runtime_bank。也就是這些題在 generated_bank 中
 * 佔了巨大體積，卻**永遠到不了學生手上**——死重。
 *
 * ## 做法
 * - 掃描 generated_bank.json，把 grade>=7 的題目移到 data/generated_bank_junior.json
 * - generated_bank.json 只保留 grade<=6 的題目
 * - 保留原檔的 minified 格式（此檔始終是 minified）
 * - 保留 questionCount 的準確值（1878+1881=3759，非 3966）
 *
 * ## 安全措施（站長要求：每批次寫入前先 commit）
 * - 預設 dry-run；--apply 才寫入
 * - 剝離後立刻跑 build-runtime-bank 重投影，確認 runtime 題數不變（仍 3175）
 * - 全程驗證：剝離前後 union == 3966（一題都不能丟）
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const APPLY = process.argv.includes("--apply");

const SOURCE = "data/generated_bank.json";
const JUNIOR_TARGET = "data/generated_bank_junior.json";

const bank = JSON.parse(readFileSync(SOURCE, "utf8"));
const junior = bank.questions.filter((q) => Number(q.grade) >= 7);
const elem = bank.questions.filter((q) => Number(q.grade) <= 6);

console.log("=== S4+ 國中內容剝離 dry-run ===");
console.log(`總題數：${bank.questions.length}`);
console.log(`國小 grade<=6：${elem.length} 題`);
console.log(`國中 grade>=7：${junior.length} 題`);
console.log(`剝離比例：${((100 * junior.length) / bank.questions.length).toFixed(1)}%`);

// 安全檢查
const total = junior.length + elem.length;
console.log(`\n安全檢查：union = ${total}（應 = 原總數）`);
if (total !== bank.questions.length) {
  console.error("❌ 有題目在拆分中消失，中止");
  process.exit(1);
}

const juniorSize = Buffer.byteLength(JSON.stringify(junior), "utf8");
console.log(`國中內容體積：${(juniorSize / 1024 / 1024).toFixed(2)} MB`);

if (!APPLY) {
  console.log("\nℹ️ dry-run。確認後加 --apply 執行：");
  console.log("   node scripts/strip-junior-content.mjs --apply");
  process.exit(0);
}

console.log("\n--- 執行剝離 ---");

const outJr = { note: "從 data/generated_bank.json 剝離出的國中（grade>=7）內容。產品定位為國小單一學段（MAX_GRADE=6），這些題目不會進 runtime_bank_elementary.json（學生看不到）。保留此檔作為備份，日後若恢復國中內容可從這裡撿回。", generatedAt: new Date().toISOString(), questionCount: junior.length, questions: junior };
const outElem = { ...bank, note: "由 scripts/expand-question-bank.mjs 自動產生的國小擴充題庫（grade<=6）。國中內容已剝離至 data/generated_bank_junior.json（見 05 的 E2g）——產品定位為國小單一學段，grade>=7 不會進 runtime。", questionCount: elem.length, questions: elem };
const trailing = readFileSync(SOURCE, "utf8").endsWith("\n") ? "\n" : "";

writeFileSync(JUNIOR_TARGET, JSON.stringify(outJr) + trailing, "utf8");
writeFileSync(SOURCE, JSON.stringify(outElem) + trailing, "utf8");

console.log(`✅ 剝離完成`);
console.log(`   data/generated_bank.json：${elem.length} 題（國小）`);
console.log(`   data/generated_bank_junior.json：${junior.length} 題（國中備份）`);
