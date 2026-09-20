#!/usr/bin/env node
/**
 * 擴充題庫到 5000 題（五科各 1000 題、年級平均、內容不重複）。
 *
 * 流程：
 *   1. 讀「課綱來源」題庫（不含上次產生的題目）→ 建立去重索引
 *   2. 依「每科 1000 題」計算各科缺口，並用「年級配額」把題目平均分到三～九年級
 *      （過去沒有配額，題目全擠在五、六年級，九年級只剩下個位數）
 *   3. 數學用計算式產生器（答案由程式算出）；其餘四科用知識事實表的六種題型
 *      （原始題／何者正確／何者錯誤／是非×2／雙概念組合題）產生變體題
 *   4. 輸出 data/generated_bank.json，再由 build-runtime-bank.mjs 合併
 *
 * 用法：node scripts/expand-question-bank.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { mulberry32, createCollector, createGradeQuota, normalize } from "./gen/common.mjs";
import { generateMath, generateMathCombo } from "./gen/math.mjs";
import { generateFromFacts, withSlots } from "./gen/facts.mjs";
import { SCIENCE_FACTS } from "./gen/science.mjs";
import { SCIENCE_JUNIOR_FACTS } from "./gen/scienceJunior.mjs";
import { SOCIAL_FACTS } from "./gen/social.mjs";
import { SOCIAL_JUNIOR_FACTS } from "./gen/socialJunior.mjs";
import { CHINESE_FACTS } from "./gen/chinese.mjs";
import { CHINESE_JUNIOR_FACTS } from "./gen/chineseJunior.mjs";
import { ENGLISH_FACTS } from "./gen/english.mjs";
import { ENGLISH_JUNIOR_FACTS } from "./gen/englishJunior.mjs";

const ROOT = process.cwd();
const TARGET_PER_SUBJECT = 1000;
const SEED = 20260920;
const GRADES = [3, 4, 5, 6, 7, 8, 9];

/** 課綱來源（不含自動產生的題目，這樣重跑才會得到同一份結果）。 */
const EXISTING_FILES = [
  "data/taiwan_curriculum_500.json",
  "data/junior_high_bank.json",
  "data/taiwan_english_seed.json",
];

function readQuestions(file) {
  const parsed = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  return Array.isArray(parsed?.questions) ? parsed.questions : [];
}

const existing = EXISTING_FILES.flatMap(readQuestions);
const collector = createCollector();
existing.forEach((q) => collector.seedAll([q]));

/** 既有題目的「科目 × 年級」分佈。 */
const countOf = (list) => {
  const map = new Map();
  for (const q of list) {
    const key = `${q.subject}|${q.grade}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
};
const baseCount = countOf(existing);

const bySubject = new Map();
for (const q of existing) bySubject.set(q.subject, (bySubject.get(q.subject) ?? 0) + 1);
console.log(
  "既有課綱題庫：",
  [...bySubject.entries()].map(([k, v]) => `${k} ${v}`).join("、"),
  `共 ${existing.length} 題`,
);

const rng = mulberry32(SEED);

/** 各科事實表：國小＋國中（國中事實表是後來補的，之前國中年級幾乎沒有題目）。 */
const plan = [
  {
    subject: "數學",
    generate: (n, quota) => {
      // 先出跨單元組合題（約一成五），其餘才是單一單元題。
      // 組合題適量即可（約 40 題）：題幹相同，出太多學生會覺得一直在寫同一題。
      const comboTarget = Math.min(n, 40);
      const madeCombo = generateMathCombo(rng, collector, comboTarget, { quota });
      return madeCombo + generateMath(rng, collector, n - madeCombo, { quota });
    },
  },
  {
    subject: "自然",
    generate: (n, quota) =>
      generateFromFacts(rng, collector, "自然", withSlots([...SCIENCE_FACTS, ...SCIENCE_JUNIOR_FACTS]), n, { quota }),
  },
  {
    subject: "社會",
    generate: (n, quota) =>
      generateFromFacts(rng, collector, "社會", withSlots([...SOCIAL_FACTS, ...SOCIAL_JUNIOR_FACTS]), n, { quota }),
  },
  {
    subject: "國語",
    generate: (n, quota) =>
      generateFromFacts(rng, collector, "國語", withSlots([...CHINESE_FACTS, ...CHINESE_JUNIOR_FACTS]), n, { quota }),
  },
  {
    subject: "英語",
    generate: (n, quota) =>
      generateFromFacts(rng, collector, "英語", withSlots([...ENGLISH_FACTS, ...ENGLISH_JUNIOR_FACTS]), n, { quota }),
  },
];

/**
 * 年級配額：讓「既有＋已產生」在每個年級盡量平均。
 * 每次都把名額發給目前題量最少的年級，避免某個年級暴量（例如英語全擠在六年級）。
 */
function computeLimits(subject, already, need) {
  const have = (g) => (baseCount.get(`${subject}|${g}`) ?? 0) + (already.get(g) ?? 0);
  const limits = {};
  for (const g of GRADES) limits[g] = 0;
  let left = need;
  // 先把每個年級補到與最少者齊頭；齊頭之後再輪流分配，整體就會平均。
  while (left > 0) {
    let target = null;
    for (const g of GRADES) {
      if (target === null || have(g) + limits[g] < have(target) + limits[target]) target = g;
    }
    limits[target] += 1;
    left -= 1;
  }
  return limits;
}

const all = [];
for (const { subject, generate } of plan) {
  const have = bySubject.get(subject) ?? 0;
  let need = Math.max(0, TARGET_PER_SUBJECT - have);
  if (need === 0) {
    console.log(`${subject}：已達 ${have} 題，不需新增`);
    continue;
  }
  const before = collector.size;
  const already = new Map();
  let produced = 0;
  // 某一輪配額發完但還沒補滿（例如該年級素材不足），就重算配額再來一輪。
  for (let round = 0; round < 4 && produced < need; round += 1) {
    const quota = createGradeQuota(computeLimits(subject, already, need - produced));
    const made = generate(need - produced, quota);
    if (made === 0) break;
    produced += made;
    for (const g of GRADES) already.set(g, (already.get(g) ?? 0) + (quota.usedOf(g) ?? 0));
  }
  const batch = collector.list().slice(before);
  all.push(...batch);
  console.log(`${subject}：目標 ${TARGET_PER_SUBJECT}，既有 ${have}，新增 ${batch.length}`);
}

/** 最後再做一次全域去重（題幹＋選項都相同才算重複）。 */
const finalSeen = new Set();
const final = [];
for (const q of all) {
  const opts = [...q.options].map(normalize).sort();
  const key = `${q.subject}|${normalize(q.prompt)}#${opts.join("|")}`;
  if (finalSeen.has(key)) continue;
  finalSeen.add(key);
  final.push(q);
}

const out = {
  note: "由 scripts/expand-question-bank.mjs 自動產生的擴充題庫，勿手動編輯；重新執行會得到同一份結果（seed 固定）。",
  generatedAt: new Date().toISOString(),
  questionCount: final.length,
  questions: final,
};
writeFileSync(join(ROOT, "data/generated_bank.json"), JSON.stringify(out) + "\n", "utf8");

const stat = {};
for (const q of final) stat[q.subject] = (stat[q.subject] ?? 0) + 1;
console.log("\n產生完成：", JSON.stringify(stat), `共 ${final.length} 題`);
console.log(`既有 ${existing.length} + 新增 ${final.length} = ${existing.length + final.length} 題`);
