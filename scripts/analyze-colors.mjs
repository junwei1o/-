// 色碼等值分析：哪些 hex 與既有 brand token 數值上完全等值？
// 只有「等值」的才值得收斂成 var()；不等值的應該新增語意 token 或保留。
//
// 用法: node scripts/analyze-colors.mjs [--by=file]
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const BYFILE = process.argv.includes("--by=file");

// 從 index.css 的 :root 讀出所有品牌 token 定義
const css = await readFile("client/src/index.css", "utf8");
const rootBlock = css.slice(0, css.indexOf("\n}"));
const tokens = {};
for (const m of rootBlock.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})\s*;/g)) {
  tokens[m[1]] = m[2].toUpperCase();
}

const hexToRgb = (h) => {
  let s = h.replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const rgbToHex = (r, g, b) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

console.log(`=== 品牌 token（${Object.keys(tokens).length} 個）===`);
for (const [k, v] of Object.entries(tokens)) console.log(`  ${k.padEnd(14)} ${v}`);

// 建立 hex → token[] 反查（大小寫不敏感、3/6 位互通）
const byHex = {};
for (const [k, v] of Object.entries(tokens)) {
  const full = rgbToHex(...hexToRgb(v));
  (byHex[full] ||= []).push(k);
}

const files = execSync(
  `grep -rl '#[0-9a-fA-F]\\{3,8\\}' client/src --include='*.css' || true`,
  { encoding: "utf8" },
)
  .split("\n")
  .filter(Boolean);

const allCounts = new Map(); // hex -> {count, files:Set}
let inRootRegion = 0;

for (const file of files) {
  const src = await readFile(file, "utf8");
  // 排除 :root token 定義區本身（那些是「定義」，不是「殘留」）
  const isIndex = file.endsWith("index.css");
  const scan = isIndex ? src.slice(src.indexOf("\n}")) : src;

  for (const m of scan.matchAll(/#[0-9A-Fa-f]{3,8}\b/g)) {
    const raw = m[0];
    const full = rgbToHex(...hexToRgb(raw));
    if (isIndex) inRootRegion++;
    if (!allCounts.has(full)) allCounts.set(full, { count: 0, files: new Set() });
    const e = allCounts.get(full);
    e.count++;
    e.files.add(file);
  }
}

const equiv = [];
const novel = [];
for (const [hex, e] of allCounts) {
  (byHex[hex] ? equiv : novel).push([hex, e]);
}
equiv.sort((a, b) => b[1].count - a[1].count);
novel.sort((a, b) => b[1].count - a[1].count);

console.log(`\n=== 等值於既有 token 的（可安全收斂）===`);
let eqCount = 0;
for (const [hex, e] of equiv) {
  eqCount += e.count;
  console.log(
    `  ${hex}  ×${String(e.count).padStart(4)}  → ${byHex[hex].join(" 或 ")}   [${e.files.size}檔]`,
  );
}
console.log(`  小計 ${equiv.length} 種 / ${eqCount} 處`);

console.log(`\n=== 不等值的（需新增語意 token 或保留原樣）top 40 ===`);
let nvCount = 0;
for (const [hex, e] of novel.slice(0, 40)) {
  nvCount += e.count;
  console.log(`  ${hex}  ×${String(e.count).padStart(4)}  [${e.files.size}檔]  ${[...e.files][0]}`);
}
console.log(
  `  合計 ${novel.length} 種不等值 / ${novel.reduce((s, [, e]) => s + e.count, 0)} 處`,
);
console.log(`\n可安全收斂比例: ${eqCount}/${eqCount + [...allCounts.values()].reduce((s, e) => s + e.count, 0)}`);
