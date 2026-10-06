#!/usr/bin/env node
// bundle 體積閘門（2026-10-06）
// ─────────────────────────────────────────────────────────────
// 目的：擋「一次性暴增」，不是禁止體積緩慢增長。
//
// 四軌設計（不設單一 chunk 硬上限——lazy chunk 變大不一定是問題）：
//   A. 入口關鍵路徑（index.html 直接引用的 JS）—— fail 閾值
//   B. runtime_bank*（題庫 chunk，最大宗）          —— fail 閾值
//   C. 全部 JS 總量                                 —— warn only
//   D. 單一 chunk 最大值                            —— 不設限
//
// 用法：node scripts/qc-bundle-size.mjs
// 退出碼：0 = 通過（C 超標只警告）；1 = A 或 B 超標

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DIST = path.join(ROOT, "dist/public");
const ASSETS = path.join(DIST, "assets");

// ── 閾值（皆為 code constants，隨 baseline 調整需 review） ──
const A_FAIL_KB = 800;      // 入口關鍵路徑 fail 閾值
const B_FAIL_MB = 2.2;      // runtime_bank fail 閾值
const C_WARN_MB = 5.75;     // JS 總量 warn 閾值（不擋 CI）
// D：不設單一 chunk 硬上限

// ── Track A：入口關鍵路徑 ──
// 收集 index.html 裡 <script src> 與 <link rel="modulepreload"> 指到的本地 JS
function collectEntryAssets() {
  const htmlPath = path.join(DIST, "index.html");
  if (!existsSync(htmlPath)) {
    console.error(`❌ 找不到 ${path.relative(ROOT, htmlPath)}——請先跑 pnpm build`);
    process.exit(1);
  }
  const html = readFileSync(htmlPath, "utf8");
  const refs = new Set();
  for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) refs.add(m[1]);
  for (const m of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)) refs.add(m[1]);
  const files = [];
  for (const ref of refs) {
    if (!ref.startsWith("/assets/")) continue; // 外連/字型不計
    const p = path.join(DIST, ref);
    if (existsSync(p) && p.endsWith(".js")) files.push(p);
  }
  return files;
}

function sizeOf(files) {
  return files.reduce((sum, f) => sum + statSync(f).size, 0);
}

function fmtKB(b) {
  return `${(b / 1024).toFixed(1)} KB`;
}
function fmtMB(b) {
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

const entryFiles = collectEntryAssets();
const entryBytes = sizeOf(entryFiles);

// ── Track B：runtime_bank* ──
const allJs = readdirSync(ASSETS)
  .filter((f) => f.endsWith(".js"))
  .map((f) => path.join(ASSETS, f));

const bankFiles = allJs.filter((f) => path.basename(f).startsWith("runtime_bank"));
const bankBytes = sizeOf(bankFiles);

// ── Track C：JS 總量 ──
const totalBytes = sizeOf(allJs);

let failed = false;

// A
if (entryBytes / 1024 > A_FAIL_KB) {
  console.log(`❌ [A] 入口關鍵路徑: ${fmtKB(entryBytes)} / ${A_FAIL_KB} KB 超過 fail 閾值`);
  failed = true;
} else {
  console.log(`✅ [A] 入口關鍵路徑: ${fmtKB(entryBytes)} / ${A_FAIL_KB} KB`);
}

// B
if (bankBytes / 1024 / 1024 > B_FAIL_MB) {
  console.log(`❌ [B] runtime_bank: ${fmtMB(bankBytes)} / ${B_FAIL_MB} MB 超過 fail 閾值`);
  failed = true;
} else {
  console.log(`✅ [B] runtime_bank: ${fmtMB(bankBytes)} / ${B_FAIL_MB} MB（${bankFiles.length} 個檔）`);
}

// C
if (totalBytes / 1024 / 1024 > C_WARN_MB) {
  console.log(`⚠️  [C] JS 總量: ${fmtMB(totalBytes)} / ${C_WARN_MB} MB 超過 warn 閾值（不擋 CI）`);
} else {
  console.log(`✅ [C] JS 總量: ${fmtMB(totalBytes)} / ${C_WARN_MB} MB（${allJs.length} 個檔）`);
}

// D
console.log(`ℹ️  [D] 單一 chunk 硬上限：未設定（lazy chunk 變大需個別評估）`);

if (failed) {
  console.log("\n❌ bundle 體積閘門失敗——入口關鍵路徑或 runtime_bank 超過閾值。");
  process.exit(1);
}
console.log("\n✅ bundle 體積閘門通過。");
process.exit(0);
