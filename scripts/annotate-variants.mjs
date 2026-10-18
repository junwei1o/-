#!/usr/bin/env node
/**
 * S1：變體組標註（variant group annotation）
 *
 * 為「同題幹、不同選項組合」的題組補上 `variantOf` 後設欄位。
 * **不刪任何題**——這些平行練習題是刻意設計（05 的 E2 警告過：把變體當重複會誤刪）。
 *
 * ## 三種關係的判定（機械，非人工）
 *   · `duplicate` —— 題幹＋選項＋答案**三者完全相同**且 id 不同 → 真重複（本庫實測 0 組）
 *   · `variant`   —— 題幹相同、選項或答案不同 → 平行練習題（保留＋標註）
 *
 * ## 標註放在哪裡
 * - 標註寫入**源檔**（`taiwan_curriculum_500.json`／`generated_bank.json`）。
 * - `runtime_bank_elementary.json` 是投影，**不改它**：其 `KEEP` 白名單不含
 *   `variantOf`（刻意——這是審計層後設資料，前端執行期不需要），
 *   故投影不會帶出此欄位，由審計腳本改讀源檔。
 *
 * ## 為什麼要這個欄位
 * - 審計的「84 組重複題」是 warning；標註後可讓審計區分「刻意變體」與「真重複」。
 * - 內容維護者能一眼看出某題屬於哪個變體家族，擴充時不會重複造題。
 *
 * 用法：
 *   node scripts/annotate-variants.mjs             # dry-run（預設）
 *   node scripts/annotate-variants.mjs --apply     # 實際寫入
 *   node scripts/annotate-variants.mjs --json      # 機器可讀
 *
 * 退出碼：0＝無待標註或已成功；1＝dry-run 發現有組別可標註。
 *
 * ⚠️ 寫入前務必先 `git commit`；寫入後**立刻 `git diff --stat`** 檢查格式
 *    （本專案踩過一次：JSON 壓成單行造成 -26252 行的假 diff）。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const JSON_OUT = process.argv.includes("--json");

/** 源檔（標註寫這裡）。runtime 是投影，刻意不動。 */
const SOURCE_FILES = ["data/taiwan_curriculum_500.json", "data/generated_bank.json"];

/** 題幹指紋：與 audit-question-bank-v2.mts 的 stemKeyOf 一致。 */
const stemKeyOf = (q) =>
  typeof q.prompt === "string" ? q.prompt : `${q.title ?? ""}｜${q.instruction ?? ""}`;

/** 標點與空白正規化（與審計同一口徑）。 */
const normText = (s) => String(s).replace(/\s+/g, "").replace(/[，。！？、；：（）]/g, "");

/** 選項指紋：排序後串接（順序不同視為同一組選項）。 */
const optKey = (q) => [...(q.options ?? [])].map((o) => normText(o)).sort().join("|");

function load(path) {
  return JSON.parse(readFileSync(join(ROOT, path), "utf8"));
}

// ── 掃描源檔，建立題幹 → 題目清單的索引 ──────────────────────
const all = [];
/** 源檔路徑 → 已載入的 bank 物件（標註直接改這裡，寫回時沿用同一物件）。 */
const bankCache = new Map();
for (const f of SOURCE_FILES) {
  const bank = load(f);
  bankCache.set(f, bank);
  for (const q of bank.questions ?? []) all.push({ q, file: f });
}

const groups = new Map();
for (const { q, file } of all) {
  const k = normText(stemKeyOf(q));
  if (!k) continue;
  groups.set(k, [...(groups.get(k) ?? []), { q, file }]);
}

const multi = [...groups.entries()].filter(([, list]) => list.length > 1);

// ── 逐組判定 variant / duplicate ──────────────────────────────
const results = [];
for (const [key, list] of multi) {
  // 真重複：題幹＋選項＋答案三者全同
  const fingerprints = new Map();
  for (const { q } of list) {
    const fp = `${optKey(q)}#${typeof q.answer === "number" ? q.answer : "?"}`;
    fingerprints.set(fp, [...(fingerprints.get(fp) ?? []), q]);
  }
  const isDuplicate = [...fingerprints.values()].every((fps) => fps.length === list.length);

  // 變體家族的代表 id＝**題組中最小 id**（穩定、可重現，不依賴檔案順序）
  const ids = list.map(({ q }) => String(q.id ?? "?")).sort();
  const anchor = ids[0];

  results.push({
    key,
    kind: isDuplicate ? "duplicate" : "variant",
    size: list.length,
    ids,
    anchor,
    members: list.map(({ q, file }) => ({ q, file })),
    subject: list[0].q.subject ?? "?",
    sample: String(stemKeyOf(list[0].q)).slice(0, 60),
  });
}

// ── 標註 ──────────────────────────────────────────────────────
let annotated = 0;
const byFile = new Map();

for (const r of results) {
  const variantIds = r.ids.filter((id) => id !== r.anchor);
  for (const { q, file } of r.members) {
    const id = String(q.id ?? "?");
    if (id === r.anchor) {
      // 家族代表：標記自己是一個變體家族的首項，並記錄成員
      const meta = { role: "anchor", groupSize: r.size, members: variantIds, kind: r.kind };
      if (APPLY) q.variantOf = meta;
      annotated += 1;
      byFile.set(file, (byFile.get(file) ?? 0) + 1);
    } else {
      const meta = { role: "variant", anchor: r.anchor, kind: r.kind };
      if (APPLY) q.variantOf = meta;
      annotated += 1;
      byFile.set(file, (byFile.get(file) ?? 0) + 1);
    }
  }
}

// ── 寫回（保留各檔原格式！）────────────────────────────────────
const written = [];
if (APPLY) {
  for (const f of SOURCE_FILES) {
    if (!byFile.has(f)) continue;
    const path = join(ROOT, f);
    const raw = readFileSync(path, "utf8");
    const trailing = raw.endsWith("\n") ? "\n" : "";
    // ⚠️ 偵測原格式：2 空格縮排 vs minified（2026-10-18 修過的教訓）
    const isIndented = /\n\s{2}"/.test(raw);
    // ⚠️ 用**一開始載入的 bank 物件**（已含新增的 variantOf）。
    //    首版在此 `load(f)` 從磁碟重讀，把記憶體中的標註全部蓋掉 → 寫入 0 個標註。
    const bank = bankCache.get(f);
    const serialized = isIndented
      ? JSON.stringify(bank, null, 2) + trailing
      : JSON.stringify(bank) + trailing;
    writeFileSync(path, serialized, "utf8");
    written.push({
      file: f,
      format: isIndented ? "2 空格縮排" : "minified",
      questions: bank.questions.length,
      annotated: bank.questions.filter((q) => q.variantOf).length,
    });
  }
}

// ── 報告 ──────────────────────────────────────────────────────
const kindDist = { variant: 0, duplicate: 0 };
results.forEach((r) => (kindDist[r.kind] += 1));

const subjectDist = {};
for (const r of results) {
  subjectDist[r.subject] = subjectDist[r.subject] ?? { groups: 0, questions: 0 };
  subjectDist[r.subject].groups += 1;
  subjectDist[r.subject].questions += r.size;
}

const sizeDist = {};
for (const r of results) sizeDist[r.size] = (sizeDist[r.size] ?? 0) + 1;

if (JSON_OUT) {
  process.stdout.write(
    JSON.stringify(
      { apply: APPLY, annotatedQuestions: annotated, groups: results.length, kindDist, subjectDist, sizeDist, written },
      null,
      2,
    ) + "\n",
  );
} else {
  console.log("═══ S1：變體組標註 ═══");
  console.log(`模式：${APPLY ? "✅ --apply（實際寫入）" : "🔍 dry-run（僅報告）"}\n`);
  console.log(`變體組數：${results.length}`);
  console.log(`  variant（不同選項/答案）：${kindDist.variant}`);
  console.log(`  duplicate（三者全同）    ：${kindDist.duplicate}`);
  console.log(`將標註題數：${annotated}\n`);

  console.log("── 各科目 × 群組數 × 題數 ──");
  const subs = Object.keys(subjectDist).sort();
  for (const s of subs) {
    console.log(`  ${s.padEnd(4)} ${String(subjectDist[s].groups).padStart(3)} 組｜${String(subjectDist[s].questions).padStart(4)} 題`);
  }

  console.log("\n── 群組大小分佈 ──");
  for (const sz of Object.keys(sizeDist).map(Number).sort((a, b) => a - b)) {
    console.log(`  ${sz} 題/組：${sizeDist[sz]} 組`);
  }

  console.log("\n── 範例（前 3 組）──");
  for (const r of results.slice(0, 3)) {
    console.log(`  [${r.kind}] ${r.size} 題  anchor=${r.anchor}`);
    console.log(`    "${r.sample}"`);
    console.log(`    members: ${r.ids.join(", ")}`);
  }

  if (written.length) {
    console.log("\n── 寫入檔案 ──");
    for (const w of written) console.log(`  ${w.file}（${w.format}，${w.questions} 題）`);
  }

  if (!APPLY) {
    console.log("\nℹ️  這是 dry-run。確認無誤後執行：");
    console.log("   node scripts/annotate-variants.mjs --apply");
  }
}

process.exit(!APPLY && results.length > 0 ? 1 : 0);
