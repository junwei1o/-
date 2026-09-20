#!/usr/bin/env node
/**
 * 繁體用字檢查：掃描程式碼與題庫，找出混入的簡體字。
 *
 * 用法： node scripts/check-traditional.mjs
 * 結束碼：有命中 = 1（適合接 pre-commit / CI），無命中 = 0。
 *
 * 說明：只檢查「簡體專用字」（繁簡同形者不列入），避免誤報。
 * 內部調研文件（docs/*.md）預設不檢查，若要一併檢查請傳 --docs。
 */
import fs from "node:fs";
import path from "node:path";

/** 常見簡體專用字 → 對應繁體（僅供提示，不做自動改寫）。 */
const SIMPLIFIED = {
  说: "說", 学: "學", 国: "國", 级: "級", 题: "題", 这: "這", 时: "時", 来: "來",
  对: "對", 为: "為", 个: "個", 们: "們", 电: "電", 车: "車", 书: "書", 见: "見",
  关: "關", 应: "應", 没: "沒", 点: "點", 万: "萬", 东: "東", 习: "習", 买: "買",
  卖: "賣", 产: "產", 单: "單", 厂: "廠", 厅: "廳", 历: "歷", 压: "壓", 听: "聽",
  图: "圖", 错: "錯", 练: "練", 验: "驗", 难: "難", 还: "還", 经: "經", 样: "樣",
  种: "種", 觉: "覺", 记: "記", 讲: "講", 识: "識", 语: "語", 读: "讀", 谁: "誰",
  请: "請", 认: "認", 让: "讓", 间: "間", 问: "問", 备: "備", 务: "務", 报: "報",
  导: "導", 层: "層", 实: "實", 现: "現", 亚: "亞", 卫: "衛", 吨: "噸", 启: "啟",
  吴: "吳", 吕: "呂", 围: "圍", 乐: "樂", 厉: "厲", 乱: "亂", 网: "網", 钟: "鐘",
  发: "發", 业: "業", 动: "動", 会: "會", 从: "從", 众: "眾", 优: "優", 体: "體",
};

const ROOTS = ["client/src", "server", "shared", "data"];
const EXTS = [".ts", ".tsx", ".json"];
const SKIP_DIR = ["node_modules", "dist", ".pnpm-store"];
const includeDocs = process.argv.includes("--docs");
if (includeDocs) ROOTS.push("docs");
/** --fix：直接把命中處改寫成建議的繁體字（僅建議用於內部文件，程式碼請人工確認）。 */
const autoFix = process.argv.includes("--fix");

const pattern = new RegExp(`[${Object.keys(SIMPLIFIED).join("")}]`, "g");
let hits = 0;
let fixedCount = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.includes(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
    } else if (includeDocs || EXTS.some((e) => entry.name.endsWith(e))) {
      if (includeDocs && !/\.(ts|tsx|json|md)$/.test(entry.name)) continue;
      scan(p);
    }
  }
}

function scan(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  let changed = null;
  lines.forEach((line, i) => {
    const found = [...line.matchAll(pattern)];
    if (!found.length) return;
    if (autoFix) {
      const fixed = line.replace(pattern, (ch) => SIMPLIFIED[ch]);
      if (fixed !== line) {
        (changed ??= lines.slice())[i] = fixed;
        fixedCount += found.length;
      }
      return;
    }
    for (const m of found) {
      hits += 1;
      const s = Math.max(0, m.index - 25);
      const e = Math.min(line.length, m.index + 25);
      console.log(
        `${file}:${i + 1}  簡體「${m[0]}」→ 建議「${SIMPLIFIED[m[0]]}」\n    …${line.slice(s, e).trim()}…`,
      );
    }
  });
  if (changed) {
    fs.writeFileSync(file, changed.join("\n"), "utf8");
    console.log(`🔧 ${file}：已改寫 ${fixedCount} 處（累計）`);
  }
}

for (const root of ROOTS) {
  if (fs.existsSync(root)) walk(root);
}

if (autoFix) {
  console.log(`\n🔧 --fix 完成，共改寫 ${fixedCount} 處；建議再跑一次純檢查確認。`);
  process.exit(0);
}
if (hits) {
  console.error(`\n❌ 發現 ${hits} 處簡體字，請改為繁體後再送出。`);
  process.exit(1);
}
console.log("✅ 繁體用字檢查通過，未發現簡體字。");
