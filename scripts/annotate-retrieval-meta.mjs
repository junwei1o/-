#!/usr/bin/env node
/**
 * 為「檢索型弱設計」題目補上 meta 標籤（決策備忘錄 A 收案）
 *
 * ## 背景
 * 審計把這 7 題歸為「檢索型：干擾項全不在材料（比對法可答）」：
 *   題幹含短文／通知／公告，正解是材料中的原句，其他 3 個干擾項全不在材料。
 *   字串比對即可命中，但學生仍須閱讀材料才能判斷。
 *
 * ## 站長裁示（決策備忘錄 A）
 * - **維持低年級難度，不改寫干擾項**。這是國小課綱「定位資訊」的合法能力，
 *   過度設計「材料內非答案」會造成低年級學生閱讀挫敗。
 * - 僅補 meta 標籤供內部分辨；未來若要擴充高難度變體，**針對 5-6 年級新增**，
 *   不要把現有 1-4 年級的題目改難。
 *
 * ## 標註形式
 *   在 knowledge 陣列加上前綴標籤 `[檢索型]`（方括號＋名稱，
 *   與既有知識點（純文字）明確區分，便於 tools 過濾）。
 *
 * ## 用法
 *   node scripts/annotate-retrieval-meta.mjs          # dry-run（預設）
 *   node scripts/annotate-retrieval-mjs --apply       # 實際寫入
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const ROOT = process.cwd();

/** 站長裁示「維持現狀」的 7 題（id → 所屬源檔）。 */
const TARGETS = [
  "data/taiwan_curriculum_500.json",
  "data/generated_bank.json",
];

const IDS = new Set([
  "q506", "q513", "q524", "q542", "q548", "q553",
  "gen-chi-0196",
]);

const META_TAG = "[檢索型]";

let annotated = 0;
const detail = [];

for (const file of TARGETS) {
  const path = join(ROOT, file);
  const raw = readFileSync(path, "utf8");
  const bank = JSON.parse(raw);
  if (!Array.isArray(bank.questions)) continue;

  let fileChanged = 0;
  for (const q of bank.questions) {
    if (!IDS.has(q.id)) continue;
    const ks = Array.isArray(q.knowledge) ? q.knowledge : [];
    if (ks.includes(META_TAG)) continue; // 已有標註（冪等）
    detail.push({ id: q.id, file, grade: q.grade, subject: q.subject, prompt: String(q.prompt).slice(0, 45) });
    if (APPLY) {
      q.knowledge = [...ks, META_TAG];
      fileChanged += 1;
    }
    annotated += 1;
  }

  if (APPLY && fileChanged > 0) {
    // 保留原格式（教訓：minified vs 2 空格縮排不可壓縮）
    const trailing = raw.endsWith("\n") ? "\n" : "";
    const isIndented = /\n\s{2}"/.test(raw);
    writeFileSync(
      path,
      isIndented ? JSON.stringify(bank, null, 2) + trailing : JSON.stringify(bank) + trailing,
      "utf8",
    );
    console.log(`   ↳ 寫回 ${file}（${fileChanged} 題，格式：${isIndented ? "2 空格縮排" : "minified"}）`);
  }
}

console.log("═══ 檢索型 meta 標註 ═══");
console.log(`模式：${APPLY ? "✅ --apply（實際寫入）" : "🔍 dry-run（僅報告）"}\n`);
console.log(`目標題數：${IDS.size}｜找到待標註：${annotated}\n`);
for (const d of detail) {
  console.log(`  ${d.id} g${d.grade} [${d.subject}] 「${d.prompt}…」`);
}
if (!APPLY) {
  console.log("\nℹ️  這是 dry-run。確認後執行：");
  console.log("   node scripts/annotate-retrieval-meta.mjs --apply");
}
process.exit(0);
