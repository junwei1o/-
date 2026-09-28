// 標題層收斂：頁面級 h1 目前散在 38/39/46/47/48/50/57/58px 共 8 種，
// 同一層級用 8 種尺寸是明顯的不一致。統一到 var(--type-title)（clamp，維持響應式）。
//
// 只動「頁面級 h1 與區塊級 h2」——也就是 <h1>/<h2> 這兩個語意層級，
// 卡片標題 h3、數字 stat、裝飾字、遊戲 sprite 全部不動（那些是刻意設計）。
//
// 用法: node scripts/normalize-headings.mjs [--dry]
import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const DRY = process.argv.includes("--dry");

/**
 * h1：頁面級主標題原本散在 38/39/46/47/48/50/57/58px 共 8 種。
 * 統一到 --type-hero = clamp(2.25rem, 4.2vw, 3.375rem)（36–54px，隨視窗縮放）。
 * 選 --type-hero 而非 --type-title：title 上限 34px 會讓 57/58px 的章節主視覺
 * 標題縮小 40%，那是視覺退步而不是統一。
 */
const H1 = { token: "--type-hero", lo: 36, hi: 60 };
/** h2：21–31px 收斂到 --type-section（clamp 19.2–24.8px）。 */
const H2 = { token: "--type-section", lo: 20, hi: 33 };

/**
 * 排除：非語意裝飾的 h1/h2。
 *  - .*-empty h1 / .*-not-found h1 是空狀態訊息，字級本來就小
 *  - 學習歷程迴圈、考卷標題等屬特定版面，另行判斷
 */
const KEEP = /(empty|not-found|mp-header|de-card|streak-dialog)/;

const files = execSync(`grep -rl 'font-size' client/src --include='*.css' || true`, {
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
    if (KEEP.test(sel)) return full;
    // 選擇器必須真的含 h1 或 h2（排除 .card h3、.stat strong 之類）
    const isH1 = /(^|[\s,>+~])h1(\s|$|[.:\[,>~+])/.test(sel);
    const isH2 = /(^|[\s,>+~])h2(\s|$|[.:\[,>~+])/.test(sel);
    if (!isH1 && !isH2) return full;
    const spec = isH1 ? H1 : H2;
    if (!new RegExp(`font-size\\s*:\\s*[0-9.]+px`).test(body)) return full;

    let hit = 0;
    const newBody = body.replace(/font-size\s*:\s*([0-9.]+)px/g, (m, num) => {
      const v = Number(num);
      if (v < spec.lo || v > spec.hi) return m;
      hit++;
      if (samples.length < 26)
        samples.push(`${file}: h${isH1 ? 1 : 2} ${v}px → var(${spec.token})  ⟨${sel.trim().slice(-38)}⟩`);
      return `font-size: var(${spec.token})`;
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
for (const p of perFile.sort((a, b) => b.changed - a.changed))
  console.log(`  ${String(p.changed).padStart(3)}  ${p.file}`);
console.log(`\n合計 ${total} 處 / ${perFile.length} 檔`);
if (DRY && samples.length) {
  console.log("\n抽樣：");
  for (const s of samples) console.log("  " + s);
}
