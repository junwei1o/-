#!/usr/bin/env node
/**
 * S5 防護閘門 2：變體家族回歸檢查（variant regression guard）
 *
 * 保護 S1 的成果：95 組變體家族的 anchor 必須保留 `variantOf` 標註。
 *
 * 若任何 anchor 的 `variantOf` 被刪除或修改，CI 立刻紅，提示使用
 * annotate-variants.mjs 重新標註。
 *
 * 用法：node scripts/qc-variant-regression.mjs [--json]
 * 退出碼：0 = 無回歸；1 = 偵測到回歸。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const JSON_OUT = process.argv.includes("--json");

/** 已知的 95 個 anchor ID（S1 標註時建立）。 */
const ANCHOR_IDS = new Set([
  // generated_bank.json (65 anchors)
  "gen-chi-0003", "gen-chi-0007", "gen-chi-0009", "gen-chi-0011", "gen-chi-0021",
  "gen-chi-0031", "gen-chi-0084", "gen-chi-0086", "gen-chi-0094", "gen-chi-0110",
  "gen-chi-0119", "gen-chi-0182", "gen-chi-0217",
  "gen-eng-0013", "gen-eng-0050", "gen-eng-0052", "gen-eng-0056", "gen-eng-0059",
  "gen-eng-0070", "gen-eng-0074", "gen-eng-0082", "gen-eng-0109", "gen-eng-0134",
  "gen-math-0007", "gen-math-0019", "gen-math-0021", "gen-math-0027", "gen-math-0029",
  "gen-math-0104", "gen-math-0197", "gen-math-0273", "gen-math-0289",
  "gen-sci-0001", "gen-sci-0009", "gen-sci-0013", "gen-sci-0023", "gen-sci-0025",
  "gen-sci-0027", "gen-sci-0031", "gen-sci-0106", "gen-sci-0117", "gen-sci-0129",
  "gen-sci-0148", "gen-sci-0176", "gen-sci-0184", "gen-sci-0203",
  "gen-soc-0005", "gen-soc-0011", "gen-soc-0017", "gen-soc-0021", "gen-soc-0023",
  "gen-soc-0025", "gen-soc-0101", "gen-soc-0106", "gen-soc-0112", "gen-soc-0116",
  "gen-soc-0117", "gen-soc-0134", "gen-soc-0201",
  "gen-國語-cs001", "gen-國語-cs002", "gen-國語-cs010", "gen-國語-deep005",
  "gen-自然-deep009", "gen-英語-deep012",
  // taiwan_curriculum_500.json (1 anchor)
  "q710",
  // generated_bank_junior.json (29 anchors)
  "gen-chi-0091", "gen-chi-0097", "gen-chi-0128", "gen-chi-0134", "gen-chi-0160",
  "gen-chi-0210", "gen-eng-0077", "gen-eng-0123", "gen-eng-0217",
  "gen-math-0035", "gen-math-0094", "gen-math-0095", "gen-math-0096", "gen-math-0100",
  "gen-math-0101", "gen-math-0343", "gen-sci-0099", "gen-sci-0102", "gen-sci-0151",
  "gen-sci-0168", "gen-sci-0171", "gen-soc-0037", "gen-soc-0039", "gen-soc-0092",
  "gen-soc-0119", "gen-soc-0120", "gen-soc-0143", "gen-soc-0147", "gen-soc-0235",
]);

/** 掃描的檔案（源檔，不含 runtime）。 */
const TARGETS = [
  "data/generated_bank.json",
  "data/taiwan_curriculum_500.json",
  "data/generated_bank_junior.json",
];

const regressions = [];

for (const file of TARGETS) {
  const path = join(ROOT, file);
  let bank;
  try {
    bank = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    continue; // 檔案不存在或損壞，跳過（其他閘門會擋）
  }
  const questions = bank.questions ?? [];
  for (const q of questions) {
    if (ANCHOR_IDS.has(q.id)) {
      // 這是 anchor，檢查 variantOf 是否存在且 role === "anchor"
      if (!q.variantOf || q.variantOf.role !== "anchor") {
        regressions.push({
          file,
          id: q.id,
          issue: "anchor-missing-variantOf",
          current: q.variantOf ?? null,
        });
      }
    }
  }
}

const summary = {
  totalAnchors: ANCHOR_IDS.size,
  regressions: regressions.length,
  sample: regressions.slice(0, 5),
};

if (JSON_OUT) {
  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
} else {
  console.log("═══ S5 變體家族回歸檢查 ═══");
  console.log(`追蹤 anchor 數量：${ANCHOR_IDS.size}`);
  if (regressions.length === 0) {
    console.log("✅ 無回歸：所有 anchor 均保留 variantOf 標註。");
  } else {
    console.log(`❌ 偵測到 ${regressions.length} 個 anchor 失去 variantOf 標註：`);
    console.log("\n範例（前 5 筆）：");
    for (const r of summary.sample) {
      console.log(`  ${r.file}: ${r.id} → variantOf=${JSON.stringify(r.current)}`);
    }
    console.log("\n修正方式：node scripts/annotate-variants.mjs --apply");
  }
}

process.exit(regressions.length > 0 ? 1 : 0);
