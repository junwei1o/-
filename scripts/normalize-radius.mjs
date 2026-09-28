// 圓角收斂：把等於既有 token 的字面值換成 var(--radius-*)
// 只處理「數值完全等於 token」且「非刻意裝飾」的情況；
// 彩旗幾何、memphis 皮膚、focus ring、地圖圖釘等刻意設計一律保留。
//
// 用法: node scripts/normalize-radius.mjs [--dry]
import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const DRY = process.argv.includes("--dry");

/** 等值映射：數值 → token */
const EQ = { 8: "--radius-sm", 12: "--radius-md", 18: "--radius-lg", 24: "--radius-xl", 999: "--radius-pill" };

/** 刻意保留的選擇器：裝飾幾何、遊戲皮膚、focus ring、圖釘、進度條。 */
const KEEP =
  /(mc-page|data-skin|mm-|md-|rg-|confetti|on-scene-dot|region-node|focus-visible|map-route|map-pin|edge|signin-pill-dot|energy-fill|milestone-bar|wrong-book-(count|tag)|answer-board-name|gradient|fallback|hero-art img|region-detail-map|filter-controls|line-notify|global-top-brand|login-gate)/;

const files = execSync(`grep -rl 'border-radius' client/src --include='*.css' || true`, {
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean);

let total = 0;
const perFile = [];
const samples = [];

for (const file of files) {
  const src = await readFile(file, "utf8");
  let changed = 0;

  const out = src.replace(/([^{}]*)\{([^{}]*)\}/g, (full, sel, body) => {
    if (!/border-radius\s*:/.test(body)) return full;
    if (KEEP.test(sel)) return full;

    let hit = 0;
    const newBody = body.replace(/border-radius:\s*([0-9.]+)px/g, (m, num) => {
      const v = Number(num);
      if (!Number.isInteger(v) || !EQ[v]) return m;
      hit++;
      if (samples.length < 30)
        samples.push(`${file}: ${v}px → var(${EQ[v]})  ⟨${sel.trim().slice(-40)}⟩`);
      return `border-radius: var(${EQ[v]})`;
    });
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
for (const p of perFile) console.log(`  ${String(p.changed).padStart(3)}  ${p.file}`);
console.log(`\n合計 ${total} 處 / ${perFile.length} 檔`);
if (DRY && samples.length) {
  console.log("\n抽樣：");
  for (const s of samples) console.log("  " + s);
}
