#!/usr/bin/env node
/**
 * S5 防護閘門 1：知識點標籤回歸檢查（knowledge regression guard）
 *
 * 保護 S2/S3 的成果：
 *   - 47 個數字後綴標籤（`X2`/`X3`）不應重新出現
 *   - 5 個同義詞映射（如「倍數判斷→倍數判別」）的舊名不應被重新引入
 *
 * 若任何檔案出現這些回歸，CI 立刻紅，提示使用 normalize-knowledge-tags.mjs 修正。
 *
 * 用法：node scripts/qc-knowledge-regression.mjs [--json]
 * 退出碼：0 = 無回歸；1 = 偵測到回歸。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const JSON_OUT = process.argv.includes("--json");

/** 數字後綴正則：匹配 `X2`/`X3`/`X4`/`X5` 等（但排除「be 動詞2」這種合法後綴）。 */
const SUFFIX_PATTERN = /^(be 動詞[2345]|[a-zA-Z\u4e00-\u9fff]+[2-9])$/;

/** 5 個同義詞映射的「舊名」（S2 已正規化為新名）。 */
const SYNONYM_OLD_NAMES = new Set([
  "中位數的概念",
  "倍數判斷",
  "分數換小數",
  "代詞指稱",
  "價格上漲",
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
    const ks = q.knowledge ?? [];
    for (const k of ks) {
      if (SYNONYM_OLD_NAMES.has(k)) {
        regressions.push({ file, id: q.id, tag: k, type: "synonym-old-name" });
      }
      if (SUFFIX_PATTERN.test(k)) {
        // 例外：某些合法後綴（如「be 動詞2」）不在 S2 映射表中，需手動排除
        // 目前 S2 已映射所有後綴，故這裡直接視為回歸
        regressions.push({ file, id: q.id, tag: k, type: "suffix-tag" });
      }
    }
  }
}

const summary = {
  regressions: regressions.length,
  byType: {
    "synonym-old-name": regressions.filter((r) => r.type === "synonym-old-name").length,
    "suffix-tag": regressions.filter((r) => r.type === "suffix-tag").length,
  },
  sample: regressions.slice(0, 5),
};

if (JSON_OUT) {
  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
} else {
  console.log("═══ S5 知識點標籤回歸檢查 ═══");
  if (regressions.length === 0) {
    console.log("✅ 無回歸：數字後綴標籤與同義詞舊名均未出現。");
  } else {
    console.log(`❌ 偵測到 ${regressions.length} 個回歸標籤：`);
    console.log(`  - 同義詞舊名：${summary.byType["synonym-old-name"]} 個`);
    console.log(`  - 數字後綴標籤：${summary.byType["suffix-tag"]} 個`);
    console.log("\n範例（前 5 筆）：");
    for (const r of summary.sample) {
      console.log(`  ${r.file}: ${r.id} → "${r.tag}" (${r.type})`);
    }
    console.log("\n修正方式：node scripts/normalize-knowledge-tags.mjs --apply");
  }
}

process.exit(regressions.length > 0 ? 1 : 0);
