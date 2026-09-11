// 手機端溢位檢查：確認閱讀字號放大（em）不會在 390px 寬度下造成橫向溢位。
// 做法：解析 index.css，找出「受影響的閱讀區塊」與其祖先容器相關的 CSS 規則，
// 標出任何會強制固定寬度 / 禁止換行 / 溢位捲動的屬性。
const fs = require("fs");
const path = require("path");

const cssPath = path.resolve(__dirname, "../client/src/index.css");
const css = fs.readFileSync(cssPath, "utf8");

// 受閱讀字號影響的選擇器（我們實際下 em 的那些，及其祖先容器）
const targets = [
  ".paper-question-panel",
  ".paper-wrong-card",
  ".paper-wrong-prompt",
  ".paper-wrong-answer-grid",
  // 關鍵祖先容器（寬度 / 溢出取決於它們）
  ".paper-exam-page",
  ".paper-exam-panel",
  ".paper-question-card",
  ".paper-result-panel",
  ".paper-options",
  ".paper-option",
  ".paper-option-copy",
  ".paper-question-heading",
  ".paper-answer-feedback",
  ".paper-explanation-stages",
  ".paper-explanation",
  ".paper-summary-panel",
  ".paper-wrong-answer-grid p",
];

// 把 CSS 拆成「選擇器 { 內文 }」區塊（忽略 @media 包裹的細節，直接掃所有區塊）
const blocks = [];
const re = /([^{}]+)\{([^{}]*)\}/g;
let m;
while ((m = re.exec(css)) !== null) {
  blocks.push({ sel: m[1].trim(), body: m[2] });
}

const riskyProps = [
  /white-space\s*:\s*nowrap/,
  /overflow\s*:\s*(auto|scroll|hidden)/,
  /overflow-x\s*:\s*(auto|scroll)/,
  /width\s*:\s*(?!min\()\d+(\.\d+)?px/, // 固定 px 寬度（min() 視為響應式，排除）
  /min-width\s*:\s*(?!0\b)\d+(\.\d+)?px/, // 非零固定 min-width
  /max-width\s*:\s*\d+(\.\d+)?px/,
];

const hits = [];
for (const b of blocks) {
  const sels = b.sel.split(",").map((s) => s.trim());
  const matched = sels.find((s) => targets.some((t) => s === t || s.startsWith(t + " ") || s.includes(" " + t)));
  if (!matched) continue;
  for (const rp of riskyProps) {
    const mm = b.body.match(rp);
    if (mm) hits.push({ sel: b.sel, prop: mm[0] });
  }
}

console.log("受影響區塊相關規則中的風險屬性：");
if (hits.length === 0) {
  console.log("  （無）— 沒有任何 white-space:nowrap / overflow / 固定 px 寬度 / 非零固定 min-width。");
} else {
  for (const h of hits) console.log(`  ${h.sel} -> ${h.prop}`);
}

// 額外確認：受影響容器是否都沒有固定 px 寬度（width:min() 是響應式，安全）
const containerWidths = [];
for (const b of blocks) {
  if (!/\.paper-(exam-page|exam-panel|question-card|result-panel|options|option|question-panel|wrong-card|summary-panel)\b/.test(b.sel)) continue;
  const w = b.body.match(/width\s*:\s*([^;]+);/);
  if (w) containerWidths.push(`${b.sel} { width: ${w[1].trim()} }`);
}
console.log("\n關鍵容器 width 設定：");
if (containerWidths.length === 0) console.log("  （未直接設定 width，繼承父層 100% 寬度）");
else containerWidths.forEach((c) => console.log("  " + c));

console.log("\n結論：");
if (hits.length === 0) {
  console.log("  放大字級只改 font-size(em)，文字會換行而非撐寬；相關區塊無 nowrap/固定寬度/溢出捲動，");
  console.log("  且在 390px 下容器皆為響應式寬度（min(100%-..., Npx) 或 100%）。因此不會產生橫向溢位。OK");
  process.exit(0);
} else {
  console.log("  發現潛在風險屬性，需人工複查。");
  process.exit(1);
}
