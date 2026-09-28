// CSS 結構閘門（qc:css）— 依 implementation-plan §1.4 規格實作
//
// 偵測「選擇器被吃掉」的特徵：
//   1. `{` 緊接在 `}` 之後或檔案開頭（中間可有空白／換行）  → 規則沒有選擇器
//   2. 同一檔案 `{` 與 `}` 數量不相等                        → 結構破損
//
// 正則要點：用 /(^|\})\s*\{/g。合法壓縮寫法 `.a{...}.b{...}` 因 `}` 後接 `.b`
// 而非空白+`{`，不會誤報；`@keyframes` 的 `}` 換行 `}` 也不會誤報。
//
// 用法: node scripts/qc-css-structure.mjs   （或 pnpm qc:css）
//   exit 0 = 全部乾淨；exit 1 = 有損壞（列出 檔案:行號）
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const files = execSync(`grep -rl --include='*.css' -e '' client/src 2>/dev/null || true`, {
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean)
  .sort();

const EMPTY_SELECTOR = /(^|})\s*\{/g;

let bad = 0;
const damagedFiles = new Set();

for (const file of files) {
  const src = await readFile(file, "utf8");

  // ── 檢查 1：空選擇器規則 ──
  for (const m of src.matchAll(EMPTY_SELECTOR)) {
    const line = src.slice(0, m.index).split("\n").length;
    console.log(`  ✗ ${file}:${line}  選擇器被吃掉（${JSON.stringify(m[0].slice(0, 12))}）`);
    bad++;
    damagedFiles.add(file);
  }

  // ── 檢查 2：花括號平衡 ──
  const open = (src.match(/\{/g) || []).length;
  const close = (src.match(/\}/g) || []).length;
  if (open !== close) {
    console.log(`  ✗ ${file}  花括號不平衡：${open} { vs ${close} }`);
    bad++;
    damagedFiles.add(file);
  }
}

if (bad > 0) {
  console.log("");
  console.log(`  共 ${bad} 個結構問題，涉及 ${damagedFiles.size} 個檔案（掃描 ${files.length} 檔）。`);
  console.log("");
  console.log("  常見成因：正規化腳本的 replace 回傳值漏掉 sel（選擇器）：");
  console.log("    錯誤  return hit ? `{...}` : full;      // 丟了 sel");
  console.log("    正確  return hit ? `${sel}{...}` : full;");
  console.log("");
  console.log("  修復方式：git checkout HEAD -- <受損檔>，修好腳本後重跑 normalize-*。");
  process.exit(1);
}

console.log(`  ✓ ${files.length} 個 CSS 檔結構正常（無空選擇器、花括號平衡）`);
process.exit(0);
