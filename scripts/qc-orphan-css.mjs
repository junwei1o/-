// 孤兒 CSS 閘門（2026-10-02）
// ─────────────────────────────────────────────────────────────
// 問題：`qc-css-structure` 只檢查「選擇器有沒有被改壞」，
// **不檢查「CSS 裡的 class 是否真的有人用」**。所以刪掉一個模組之後，
// 它專屬的樣式會一直躺著沒人發現——2026-10-02 深度審查就抓到 7 個。
//
// 這支腳本做對帳：CSS 定義了什麼 vs .tsx 實際用到了什麼。
//
// ⚠️ 為什麼這件事比「CSS 放在哪」更值得做：
// 架構好不好是主觀判斷，但「有沒有人用」是可驗證的事實。
// 把可驗證的部分自動化，就不必靠感覺決定要不要重構。
//
// 用法：node scripts/qc-orphan-css.mjs
// 退出碼：0 = 沒有孤兒；1 = 有孤兒（CI 應該會擋住）
//
// scope: AdminConsole.css only
// ─────────────────────────────────────────────────────────────
// ⚠️ 範圍限定：本閘門只掃 `client/src/pages/AdminConsole.css`。
// 「泛化到全部 CSS」是 ③.5 之後的獨立任務，不混進本閘門——
// 貿然擴大範圍會把誤報率（動態 class、第三方庫 class）拉高，
// 讓閘門因誤報被關掉。先守住 AdminConsole 這個確定可驗證的範圍。
//
// 掃描範圍：client/src/admin/**/*（.tsx 不含 .test）＋ client/src/pages/AdminConsole.tsx

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CSS_FILE = path.join(ROOT, "client/src/pages/AdminConsole.css");

/** 掃描範圍：後台元件 ＋ 頁面本身（漏掉 pages/AdminConsole.tsx 會誤判外殼層是孤兒）。 */
const SCAN_DIRS = ["client/src/admin"];
const SCAN_FILES = ["client/src/pages/AdminConsole.tsx"];

function collectSourceFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSourceFiles(full, acc);
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

/** CSS 中定義的 class（只取選擇器裡的 `.foo`，排除 pseudo / 巢狀） */
function collectCssClasses(css) {
  // 去掉註解，避免把註解裡的 `.foo` 當成定義
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const classes = new Set();
  // 抓選擇器區段（{ 之前的最後一段），再從裡面取 .class
  for (const match of stripped.matchAll(/([^{}]+)\{/g)) {
    const selector = match[1];
    if (selector.trim().startsWith("@")) continue; // @media / @keyframes 本身
    for (const c of selector.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) {
      classes.add(c[1]);
    }
  }
  return classes;
}

/**
 * 收集 .tsx 裡實際使用的 class。
 *
 * ⭐ 關鍵：必須辨認**動態拼接**的 class，否則誤報會讓這道閘門失去作用。
 * 本專案有兩種寫法：
 *   1. `admin-md-h${n}`  → 前綴 `admin-md-h` 開頭的 class 都算有用到
 *   2. `${cond ? " is-open" : ""}` → 條件類，要從字串裡抓
 */
function collectUsedClasses(sources) {
  const used = new Set();
  /** 動態前綴：`admin-md-h${...}` 會貢獻前綴 "admin-md-h" */
  const dynamicPrefixes = [];

  for (const file of sources) {
    const src = readFileSync(file, "utf8");

    // 動態前綴只認「像 class 名稱」的：`admin-md-h${n}` → "admin-md-h"
    //
    // ⚠️ 這裡的寬嚴直接決定閘門還有沒有用：
    //   太鬆 → `${i}` 貢獻前綴 "i"，於是**所有** is-* 都被誤判為已使用（等於沒有閘門）
    //   太緊 → `is-${tone}` 的前綴 "is-" 被排除，條件類全被誤報（等於壞掉的閘門）
    // 判準：像 class 名稱（含連字號）且長度 ≥ 3。
    //
    // ⚠️ 這裡要允許**以連字號結尾**的前綴（`is-${tone}` → "is-"），
    // 否則 `.is-kb`／`.is-ref` 這些條件類會被誤報成孤兒——
    // 而誤報會讓人直接關掉閘門，那比沒有閘門更糟。
    for (const m of src.matchAll(/([a-z][\w-]*)\$\{/g)) {
      const prefix = m[1];
      if (prefix.length >= 3 && prefix.includes("-")) dynamicPrefixes.push(prefix);
    }
    // ⚠️ 開頭的 `\s*` 不能省：條件類寫成 `${cond ? " is-open" : ""}`，
    // 字串**前面有空格**，沒有它就會整批漏掉（然後被誤報成孤兒）。
    for (const m of src.matchAll(/"\s*([a-z][\w-]*(?:\s+[a-z][\w-]*)*)\s*"/g)) {
      for (const token of m[1].split(/\s+/)) {
        if (token) used.add(token);
      }
    }
    for (const m of src.matchAll(/'\s*([a-z][\w-]*(?:\s+[a-z][\w-]*)*)\s*'/g)) {
      for (const token of m[1].split(/\s+/)) {
        if (token) used.add(token);
      }
    }
    // 反引號裡的靜態片段，例如 `admin-md-h admin-md-h${n}`
    for (const m of src.matchAll(/`([^`]+)`/g)) {
      const inner = m[1].replace(/\$\{[^}]*\}/g, " ");
      for (const token of inner.split(/\s+/)) {
        if (/^[a-z][\w-]*$/.test(token)) used.add(token);
      }
    }
  }

  return { used, dynamicPrefixes: [...new Set(dynamicPrefixes)] };
}

const sources = [
  ...SCAN_DIRS.map((d) => collectSourceFiles(path.join(ROOT, d))).flat(),
  ...SCAN_FILES.map((f) => path.join(ROOT, f)),
].filter((f) => {
  try {
    return statSync(f).isFile();
  } catch {
    return false;
  }
});

const css = readFileSync(CSS_FILE, "utf8");
const cssClasses = collectCssClasses(css);
const { used, dynamicPrefixes } = collectUsedClasses(sources);

// 動態前綴命中的 class 也算「有使用」
const isCoveredByPrefix = (cls) => dynamicPrefixes.some((p) => cls.startsWith(p));

const orphans = [...cssClasses].filter((cls) => !used.has(cls) && !isCoveredByPrefix(cls)).sort();

const adminClasses = [...cssClasses].filter((c) => c.startsWith("admin-"));
const orphanAdmin = orphans.filter((c) => c.startsWith("admin-"));

console.log(`  掃描 CSS: ${path.relative(ROOT, CSS_FILE)}`);
console.log(`  掃描程式碼: ${sources.length} 個檔案`);
console.log(`  CSS 定義 class: ${cssClasses.size}（其中 admin-* ${adminClasses.length}）`);
console.log(`  動態前綴: ${dynamicPrefixes.length} 個（${dynamicPrefixes.slice(0, 5).join(", ")}${dynamicPrefixes.length > 5 ? "…" : ""}）`);
console.log(`  掃描原始碼使用 class: ${used.size} 個`);

if (orphans.length === 0) {
  console.log("✅ 沒有孤兒 CSS——每個 class 都有模組在用。");
  process.exit(0);
}

console.log(`\n❌ 發現 ${orphans.length} 個孤兒 CSS（沒有任何模組使用）：`);
for (const cls of orphans) {
  console.log(`   .${cls}`);
}
console.log(
  `\n  處理方式：刪掉它們，或確認是動態拼接（那樣應該在動態前綴清單裡）。`,
);
console.log(`  這是為了在 CSS 還小時就保持乾淨——1338 行時已能抓到 7 個。`);
process.exit(1);
