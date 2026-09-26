#!/usr/bin/env node
/**
 * 打散題庫答案位置 + 修復已知錯誤題
 *
 * ## 為什麼需要
 * 審計（2026-09-26）發現題庫答案位置嚴重偏 A，學生只要「全選 A」就能答對 44-62%，
 * 評量完全失效。實測：
 *   小學部 社會  A:62.5%  B:14.4%  C:13.0%  D:10.1%   （理想 25%）
 *   小學部 國語  A:54.0%  B:20.2%  C:12.5%  D:13.4%
 *   小學部 自然  A:46.8%  B:25.0%  C:14.3%  D:13.9%
 *   小學部 數學  A:44.5%  B:32.3%  C:14.0%  D: 9.2%
 *   國中部 全部  A:24.9~28.3%  ✅ 正常（不需處理）
 *
 * 根因：taiwan_curriculum_500.json 匯入時未做答案位置隨機化（A 66.7%、D 1.2%）；
 *       generated_bank.json 小學段（g3-g6）也有輕度偏差（A 27-41%）。
 *       生成腳本 scripts/gen/common.mjs 的 shuffle() 實測均勻（25.0%），無問題。
 *
 * ## 做什麼
 * 1. 修復 q207（答案與解析矛盾：解析算出 174 元，選項卻無 174）
 * 2. 打散 taiwan_curriculum_500.json 全部四選題的選項順序
 * 3. 打散 generated_bank.json 小學段（g3-g6）四選題的選項順序
 * 4. 保持原檔案格式（indent / compact）與尾端換行，避免無謂 diff
 *
 * ## 用法
 *   node scripts/shuffle-answer-positions.mjs --dry-run   # 只報告，不寫檔
 *   node scripts/shuffle-answer-positions.mjs             # 實際執行
 *   node scripts/build-runtime-bank.mjs                   # 之後重新產生前端題庫
 *
 * 以固定 SEED 執行，可重現。是非題（正確／錯誤）固定順序，不打散。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SEED = 20260926;
const DRY_RUN = process.argv.includes("--dry-run");

/** mulberry32：可重現亂數 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 打散單題選項並同步 answer 索引。回傳 true 表示有變動。 */
function shuffleOptions(rng, q) {
  if (q.questionType === "是非題") return false;
  const opts = q.options;
  if (!Array.isArray(opts) || opts.length < 3) return false;
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= opts.length) return false;

  const correct = opts[q.answer];
  const next = [...opts];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  const newAnswer = next.indexOf(correct);
  if (newAnswer < 0) return false;

  q.options = next;
  q.answer = newAnswer;
  return true;
}

/** 已知錯誤題的人工修正表。 */
const QUESTION_FIXES = {
  q207: {
    // 原題：餅乾 45 元買 4 包打 9 折，另需付運費 12 元，問「最後需要付多少元？」
    // 原解析自己算出 174 元並說「正確應為 174 元」，但選項裡沒有 174 → 學生無法作答。
    options: ["162元", "170元", "174元", "180元"],
    answer: 2,
    explanation:
      "原價 45×4＝180 元；打 9 折為 180×0.9＝162 元；加上運費 12 元，實付 162＋12＝174 元。",
  },
};

/** 要處理的目標檔案。filter 為 null 表示整檔處理。 */
const TARGETS = [
  {
    file: "data/taiwan_curriculum_500.json",
    indent: 2, // 原檔為 indent=2 + 尾端換行
    filter: null,
    label: "課綱題庫（全部年級）",
  },
  {
    file: "data/generated_bank.json",
    indent: null, // 原檔為 compact + 尾端換行
    // 只處理小學段；國中段（g7-g9）分布已正常（A 24.7-29.8%），無需更動
    filter: (q) => {
      const g = Number(q?.grade);
      return Number.isFinite(g) && g >= 3 && g <= 6;
    },
    label: "擴充題庫（僅小學段 g3-g6）",
  },
];

/** 統計一組題目的答案位置分布。 */
function distribution(questions) {
  const counts = [0, 0, 0, 0];
  let n = 0;
  for (const q of questions) {
    if (q.questionType === "是非題") continue;
    if (!Array.isArray(q.options) || q.options.length !== 4) continue;
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= 4) continue;
    counts[q.answer] += 1;
    n += 1;
  }
  if (n === 0) return { n: 0, pct: [0, 0, 0, 0] };
  return { n, pct: counts.map((c) => (c / n) * 100) };
}

function fmtPct(pct) {
  return `A:${pct[0].toFixed(1)}% B:${pct[1].toFixed(1)}% C:${pct[2].toFixed(1)}% D:${pct[3].toFixed(1)}%`;
}

const rng = mulberry32(SEED);
let grandTotal = 0;
let grandChanged = 0;
let grandFixed = 0;

console.log("=== 打散題庫答案位置 ===");
console.log(`SEED=${SEED}  ${DRY_RUN ? "【DRY RUN — 不會寫檔】" : ""}\n`);

for (const target of TARGETS) {
  const path = join(ROOT, target.file);
  const raw = readFileSync(path, "utf8");
  const data = JSON.parse(raw);
  const list = data.questions ?? data.items ?? [];

  const before = distribution(list);

  let changed = 0;
  let fixed = 0;
  for (const q of list) {
    const fix = QUESTION_FIXES[q?.id];
    if (fix) {
      Object.assign(q, fix);
      fixed += 1;
      continue; // 修完後不再打散，保留人工指定的位置以便驗證
    }
    if (target.filter && !target.filter(q)) continue;
    if (shuffleOptions(rng, q)) changed += 1;
  }

  const after = distribution(list);

  const text = (target.indent === null ? JSON.stringify(data) : JSON.stringify(data, null, target.indent)) + "\n";
  if (!DRY_RUN) writeFileSync(path, text, "utf8");

  console.log(`【${target.label}】${target.file}`);
  console.log(`  題數 ${list.length}  |  打散 ${changed} 題  |  修復 ${fixed} 題`);
  console.log(`  打散前 ${before.n} 題四選一  ${fmtPct(before.pct)}`);
  console.log(`  打散後 ${after.n} 題四選一  ${fmtPct(after.pct)}`);
  console.log();

  grandTotal += list.length;
  grandChanged += changed;
  grandFixed += fixed;
}

console.log(`=== 合計：${grandTotal} 題，打散 ${grandChanged} 題，修復 ${grandFixed} 題 ===`);
if (DRY_RUN) console.log("（DRY RUN，未寫入任何檔案）");
else console.log("下一步：執行 node scripts/build-runtime-bank.mjs 重新產生前端題庫");
