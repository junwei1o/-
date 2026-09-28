// 字級遷移：把散落的 font-size px 字面值收斂到 var(--type-*) 語意變數
//
// 策略（保守、零回退）：
//   1. 只替換「純 px 值」且落在對應語意桶內的宣告；
//      clamp()/calc()/em/rem 與 var() 一律不動（它們已是響應式或已 token 化）。
//   2. 映射只做「放大或等值」，不做縮小 —— 避免任何文字變小造成可讀性倒退。
//   3. 6–8px 的裝飾性戳記／浮水印（.hero-stamp/.note-stamp/.brand-lockup span
//      等刻意極小的排版元素）列入排除，不動。
//   4. --dry 只報告不改檔。
//
// 用法: node scripts/normalize-type.mjs [--dry] [--only=檔名.css]

import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const DRY = process.argv.includes("--dry");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1];

/** 字級桶：由小到大，每桶一個 token。數值取自 index.css 的 :root 定義。 */
const BUCKETS = [
  { token: "--type-micro", px: 12, min: 11 }, // 原本 10–12 的 meta/標籤 → 12
  { token: "--type-meta", px: 13, min: 13 },
  { token: "--type-support", px: 14, min: 14 },
  { token: "--type-body", px: 15, min: 15 },
  { token: "--type-lead", px: 18, min: 16 },
];

/** 明確排除的選擇器：刻意極小的排版元素（戳記、浮水印、裝飾數字）。 */
const EXCLUDE_SEL = [
  /\.hero-stamp/,
  /\.note-stamp/,
  /\.brand-lockup span/,
  /\.astronomy-sun/,
  /\.side-footer/,
  /\.map-pin/,
  /\.fc-n/,
  /\.on-frac-den/,
  /\.streak-meteor/,
  /\.streak-burst/,
  /\.bx-error__art/,
  /\.observatory-radar/,
  /\.map-hotspot/,
  /\.map-interaction-hint/,
  /\.principle-code/,
  /\.eyebrow/,
  // 表單控制項：16px 是刻意下限 —— iOS Safari 在 <16px 時會自動放大整個 viewport，
  // 這個值不能為了統一而改動。
  /input/,
  /textarea/,
  /select/,
];

/** 把 px 值對到「不小於它」的最小桶（保證只放大不小）。 */
function bucketFor(px) {
  for (const b of BUCKETS) {
    if (px <= b.px) return b;
  }
  return null; // > 18px 屬標題層，交給 --type-title/section，不在本腳本範圍
}

const files = (
  ONLY ? [ONLY] : execSync(`grep -rl 'font-size' client/src --include='*.css' || true`, { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
);

let total = 0;
const perFile = [];
const samples = [];

for (const file of files) {
  const src = await readFile(file, "utf8");
  let changed = 0;

  const out = src.replace(/([^{}]*)\{([^{}]*)\}/g, (full, sel, body) => {
    if (!/font-size\s*:/.test(body)) return full;
    if (EXCLUDE_SEL.some((re) => re.test(sel))) return full;

    let hit = 0;
    const newBody = body.replace(
      /font-size\s*:\s*([0-9]+(?:\.[0-9])?)px/g,
      (m, num) => {
        const px = Number(num);
        const b = bucketFor(px);
        if (!b) return m; // 標題層不動
        if (px === b.px) return `font-size: var(${b.token})`;
        if (px > b.px) return m; // 理論上不會發生（bucketFor 保證 px<=b.px）
        hit++;
        if (samples.length < 40)
          samples.push(`${file}: ${px}px → var(${b.token}) (=${b.px}px)  ⟨${sel.trim().slice(-40)}⟩`);
        return `font-size: var(${b.token})`;
      },
    );
    changed += hit;
    return hit ? `${sel}{${newBody}}` : full;
  });

  if (changed > 0) {
    total += changed;
    perFile.push({ file, changed });
    if (!DRY) await writeFile(file, out, "utf8");
  }
}

console.log(DRY ? "[DRY] 將替換：" : "已套用：");
for (const p of perFile.sort((a, b) => b.changed - a.changed))
  console.log(`  ${String(p.changed).padStart(4)}  ${p.file}`);
console.log(`\n合計 ${total} 處 / ${perFile.length} 檔`);
if (DRY && samples.length) {
  console.log("\n抽樣對應：");
  for (const s of samples) console.log("  " + s);
}
console.log("\n桶定義：");
for (const b of BUCKETS) console.log(`  var(${b.token}) = ${b.px}px  (收原本 ≤${b.px}px 且 >${b.min - 1}px 的值)`);
