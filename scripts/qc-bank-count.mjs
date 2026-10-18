#!/usr/bin/env node
/**
 * 題庫規模守門（2026-10-18，選項 B 配套）：
 * 各題庫檔的題數**不得低於上一個 commit**（git show HEAD~1:<file>）。
 *
 * 為什麼需要：E2g 實測「重跑生成器會靜默弄掉 2487 個既有 id」。
 * 生成器端已有寫入前守門（expand-question-bank.mjs 選項 B），但那只防
 * 「重跑生成器」這一條路徑；直接手改資料檔、或未來新增的其他腳本，
 * 仍可能把題庫弄少。此閘門在 CI 端兜底，不依賴任何單一腳本的自律。
 *
 * 比對基準＝上一個 commit（HEAD~1）。所以：
 *   · 正常新增/修改題目 → 題數不減 → 通過。
 *   · 故意刪題 → 必須讓題數不變（補回來）或**明知故犯**地走
 *     BANK_COUNT_ALLOW_REDUCTION=1（僅供人工明確決定後使用，勿在 CI 設）。
 *   · 無法取得 HEAD~1（淺 clone／首個 commit）→ 跳過該檔並提示，不誤殺。
 *
 * 結束碼：0＝全部通過；1＝有題庫縮水（且未允許）。
 * CI 前置：actions/checkout 需 fetch-depth ≥ 2。
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

/** 規模守門的對象：路徑＋該檔存題目的欄位。 */
const BANKS = [
  ["data/taiwan_curriculum_500.json", "questions"],
  ["data/generated_bank.json", "questions"],
  ["data/runtime_bank_elementary.json", "questions"],
  ["data/matching_bank.json", "sets"],
  ["data/matching_bank_extra.json", "sets"],
  ["data/image_bank.json", "sets"],
];

const ALLOW = process.env.BANK_COUNT_ALLOW_REDUCTION === "1";

const countOf = (json, key) => (Array.isArray(json?.[key]) ? json[key].length : 0);

const readCurrent = (file, key) => {
  if (!existsSync(file)) return null;
  try {
    return countOf(JSON.parse(readFileSync(file, "utf8")), key);
  } catch {
    return null;
  }
};

/** 上一個 commit 的版本；拿不到（淺 clone／首個 commit）回 null。 */
const readPrev = (file, key) => {
  try {
    const out = execFileSync("git", ["show", `HEAD~1:${file}`], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024, // generated_bank.json 約 1.5MB，預設 1MB 不夠
      stdio: ["ignore", "pipe", "pipe"],
    });
    return countOf(JSON.parse(out), key);
  } catch {
    return null;
  }
};

let shrank = 0;
let checked = 0;
console.log("題庫規模守門：與上一個 commit（HEAD~1）比對題數\n");
for (const [file, key] of BANKS) {
  const cur = readCurrent(file, key);
  if (cur === null) {
    console.log(`  ⏭  ${file}：目前無法讀取（不存在或損毀），跳過`);
    continue;
  }
  const prev = readPrev(file, key);
  if (prev === null) {
    console.log(`  ⏭  ${file}：${cur} 題（無 HEAD~1 基準可比：淺 clone 或首個 commit）`);
    continue;
  }
  checked += 1;
  const delta = cur - prev;
  if (delta < 0) {
    shrank += 1;
    const tag = ALLOW ? "⚠️ 已允許縮水（BANK_COUNT_ALLOW_REDUCTION=1）" : "❌ 縮水";
    console.log(`  ${tag}  ${file}：${prev} → ${cur}（${delta}）`);
  } else {
    console.log(`  ✅  ${file}：${prev} → ${cur}（${delta >= 0 ? "+" : ""}${delta}）`);
  }
}

console.log("");
if (shrank > 0 && !ALLOW) {
  console.error(
    `❌ ${shrank} 個題庫縮水。題庫只增不減是本專案的規則（05 的 E2g 教訓）。\n` +
      `   若刪題是有意的：先確認內容品質，再以 BANK_COUNT_ALLOW_REDUCTION=1 重跑確認，\n` +
      `   然後在 commit message 寫明刪了什麼、為什麼（並在 04 工作執行紀錄留痕）。`,
  );
  process.exit(1);
}
console.log(
  shrank > 0
    ? `✅ 通過（${shrank} 個縮水已由環境變數明確允許）｜共比對 ${checked} 檔`
    : `✅ 通過｜共比對 ${checked} 檔，題庫無縮水`,
);
