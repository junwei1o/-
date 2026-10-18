#!/usr/bin/env node
/**
 * 擴充題庫到 5000 題（五科各 1000 題、年級平均、內容不重複）。
 *
 * 流程：
 *   1. 讀「課綱來源」題庫（不含上次產生的題目）→ 建立去重索引
 *   2. 依「每科 1000 題」計算各科缺口，並用「年級配額」把題目平均分到三～六年級
 *      （過去沒有配額，題目全擠在五、六年級，六年級以下年級幾乎沒有題目）
 *   3. 數學用計算式產生器（答案由程式算出）；其餘四科用知識事實表的六種題型
 *      （原始題／何者正確／何者錯誤／是非×2／雙概念組合題）產生變體題
 *   4. 輸出 data/generated_bank.json，再由 build-runtime-bank.mjs 合併
 *
 * 用法：node scripts/expand-question-bank.mjs [--seed N] [--quiet] [--dry-run] [--force-overwrite]
 *
 * 寫檔保護（2026-10-18，E2g 收案，選項 B）：
 *   預設 **覆蓋前先比對**：讀取現有 data/generated_bank.json，若新輸出會讓任何
 *   既有 id 消失，立即拒絕寫入並回報錯誤，避免靜默弄掉題庫內容。
 *   錯誤分兩類：
 *     (a) 生成器漂移：既有 id 消失，但題幹＋選項 hash 仍在新輸出裡
 *         —— 表示生成器邏輯變了、同樣內容被重新編號。訊息引導修生成器，
 *         **不**建議 --force-overwrite。
 *     (b) 真實刪除：既有 id 消失，且題幹＋選項 hash 也不在新輸出裡
 *         —— 表示內容被故意移除。訊息提示使用 --force-overwrite 確認。
 *   --dry-run：只比對不寫檔，適合 CI 預檢。
 *   --force-overwrite：跳過所有保護，整檔取代（僅用於明確的全量重生）。
 *   --seed：指定隨機種子（預設 20260920）。同 seed 連跑兩次必須產出相同內容。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { mulberry32, createCollector, createGradeQuota, normalize } from "./gen/common.mjs";
import { generateMath, generateMathCombo, generateMathRelation } from "./gen/math.mjs";
import { generateMatchingRelations } from "./gen/matchingRelation.mjs";
const CROSS_SUBJECT_TARGET = 200;
import { generateCrossSubject } from "./gen/crossSubject.mjs";
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
const SEED = Number(process.argv.find((a) => a.startsWith("--seed="))?.split("=")[1] ?? 20260920);
const GRADES = [3, 4, 5, 6];
const QUIET = process.argv.includes("--quiet");
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE_OVERWRITE = process.argv.includes("--force-overwrite");
const OUT_PATH = join(ROOT, "data/generated_bank.json");
const SOURCE_FILES = ["data/taiwan_curriculum_500.json", "data/taiwan_english_seed.json"];

/** 靜默 log：--quiet 時不輸出，否則正常 console.log。 */
const say = (...a) => {
  if (!QUIET) console.log(...a);
};

/** 題目去重指紋：科目＋正規化題幹＋排序後的選項（2026-10-18，條件 2 子項）。 */
const stemKey = (q) =>
  `${q.subject ?? ""}|${normalize(String(q.prompt ?? ""))}#${[...(q.options ?? [])].map(normalize).sort().join("|")}`;

function readQuestions(file) {
  const parsed = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  return Array.isArray(parsed.questions) ? parsed.questions : [];
}

const existingSource = SOURCE_FILES.flatMap(readQuestions);
const collector = createCollector();
existingSource.forEach((q) => collector.seedAll([q]));

/** 既有題目的「科目 × 年級」分佈。 */
const countOf = (list) => {
  const map = new Map();
  for (const q of list) {
    const key = `${q.subject}|${q.grade}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
};
const baseCount = countOf(existingSource);

const bySubject = new Map();
for (const q of existingSource) bySubject.set(q.subject, (bySubject.get(q.subject) ?? 0) + 1);
say(
  "既有課綱題庫：",
  [...bySubject.entries()].map(([k, v]) => `${k} ${v}`).join("、"),
  `共 ${existingSource.length} 題`,
);

const rng = mulberry32(SEED);

/**
 * 庫存互相利用的組合題（配對關係＋數學互相印證）：
 * 這些題先把名額吃下來，剩下的才交給一般產生器，
 * 每科總數仍然精準落在 1000 題。
 */
const comboPreGenerated = new Map();
const matchingQuestions = [];
{
  // 配對關係題：約 170 題，各科依配對組數自然分佈。
  // 產生的題目要記下來（稍後直接併入輸出）——收集器裡的題目只會在
  // 各科的 batch 之外，漏記就會整批消失、還白白佔掉各科名額。
  const sizeBefore = collector.size;
  generateMatchingRelations(rng, collector, 170);
  matchingQuestions.push(...collector.list().slice(sizeBefore));
  for (const q of matchingQuestions) {
    comboPreGenerated.set(q.subject, (comboPreGenerated.get(q.subject) ?? 0) + 1);
  }
}
const MATH_RELATION_TARGET = 40;

/** 跨學科結合題：三科 120 ＋ 五科 80 ＝ 200 題。 */
const crossQuestions = [];
{
  const sizeBefore = collector.size;
  const made = generateCrossSubject(rng, collector, CROSS_SUBJECT_TARGET);
  crossQuestions.push(...collector.list().slice(sizeBefore));
  for (const q of crossQuestions) {
    comboPreGenerated.set(q.subject, (comboPreGenerated.get(q.subject) ?? 0) + 1);
  }
  say(
    `跨學科結合題：${made.total} 題（三科結合 ${made.three}、五科結合 ${made.five}）`,
  );
}

/** 各科事實表：國小＋國中（國中事實表是後來補的，之前國中年級幾乎沒有題目）。 */
const plan = [
  {
    subject: "數學",
    generate: (n, quota) => {
      // 依序：跨單元比較 → 同單元互相印證 → 一般計算題。
      // 組合類題幹相似，各約 40 題就好：出太多學生會覺得一直在寫同一題。
      const comboTarget = Math.min(n, 40);
      const madeCombo = generateMathCombo(rng, collector, comboTarget, { quota });
      const relationTarget = Math.min(n - madeCombo, MATH_RELATION_TARGET);
      const madeRelation = generateMathRelation(rng, collector, relationTarget, { quota });
      return madeCombo + madeRelation + generateMath(rng, collector, n - madeCombo - madeRelation, { quota });
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

const all = [...matchingQuestions, ...crossQuestions];
for (const { subject, generate } of plan) {
  const have = bySubject.get(subject) ?? 0;
  let need = Math.max(0, TARGET_PER_SUBJECT - have);
  if (need === 0) {
    say(`${subject}：已達 ${have} 題，不需新增`);
    continue;
  }
  const before = collector.size;
  const already = new Map();
  let produced = 0;
  // 配對關係題已先進收集器，這裡把它算進「已產生」，一般產生器才不會超量。
  const preGenerated = comboPreGenerated.get(subject) ?? 0;
  produced += preGenerated;
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
  say(`${subject}：目標 ${TARGET_PER_SUBJECT}，既有 ${have}，新增 ${batch.length}`);
}

/** 最後再做一次全域去重（題幹＋選項都相同才算重複）。 */
const finalSeen = new Set();
const final = [];
for (const q of all) {
  const k = stemKey(q);
  if (finalSeen.has(k)) continue;
  finalSeen.add(k);
  final.push(q);
}

/**
 * 寫檔保護（選項 B）：覆蓋前比對既有 id。
 * 若新輸出會讓任何既有 id 消失，拒絕寫入並分兩類回報：
 *   (a) 生成器漂移：id 消失但 stem+options hash 仍在新輸出 → 內容被重新編號，
 *       引導修生成器，**不**建議 --force-overwrite。
 *   (b) 真實刪除：id 消失且 hash 也不在新輸出 → 內容被故意移除，
 *       提示使用 --force-overwrite 確認。
 */
const existingBank = (() => {
  if (FORCE_OVERWRITE) return [];
  try {
    const parsed = JSON.parse(readFileSync(OUT_PATH, "utf8"));
    return Array.isArray(parsed.questions) ? parsed.questions : [];
  } catch {
    return []; // 檔不存在或損毀：視為無既有內容，安全新增
  }
})();

const existingIds = new Set(existingBank.map((q) => q.id));
const existingStems = new Set(existingBank.map(stemKey));
const lostIds = [];
const lostButContentExists = [];
for (const q of existingBank) {
  if (final.some((nq) => nq.id === q.id)) continue; // id 仍在新輸出裡
  lostIds.push(q.id);
  if (final.some((nq) => stemKey(nq) === stemKey(q))) {
    lostButContentExists.push(q.id); // 內容仍在，只是 id 變了 → 生成器漂移
  }
}

if (lostIds.length > 0 && !DRY_RUN && !FORCE_OVERWRITE) {
  const driftCount = lostButContentExists.length;
  const deleteCount = lostIds.length - driftCount;
  if (driftCount > 0 && deleteCount === 0) {
    // 全是漂移：建議修生成器，不建議 --force-overwrite
    console.error(
      `❌ 拒絕寫入：${lostIds.length} 個既有 id 在新輸出中消失（全部為生成器漂移）\n` +
        `   這些題的題幹＋選項仍在新輸出裡，只是 id 被重新編號。\n` +
        `   請先修生成器邏輯（scripts/gen/），使其產出穩定 id，而非使用 --force-overwrite。\n` +
        `   涉及 id：${lostIds.slice(0, 10).join(", ")}${lostIds.length > 10 ? ` …(+${lostIds.length - 10})` : ""}`,
    );
    process.exit(1);
  }
  if (deleteCount > 0) {
    // 有真實刪除：建議 --force-overwrite
    console.error(
      `❌ 拒絕寫入：${lostIds.length} 個既有 id 在新輸出中消失\n` +
        `   其中 ${driftCount} 個為生成器漂移（內容仍在、id 變了），${deleteCount} 個為真實刪除（內容不在新輸出）。\n` +
        `   若確定要刪除，請使用 --force-overwrite 覆蓋；若非 intentional，請先修生成器。\n` +
        `   刪除 id：${lostIds.slice(0, 10).join(", ")}${lostIds.length > 10 ? ` …(+${lostIds.length - 10})` : ""}`,
    );
    process.exit(1);
  }
}

const out = {
  note: "由 scripts/expand-question-bank.mjs 自動產生的擴充題庫。預設為覆寫前比對（選項 B）：\n" +
    "  若新輸出會讓任何既有 id 消失，會拒絕寫入並回報錯誤。\n" +
    "  使用 --force-overwrite 可跳過保護整檔取代；使用 --dry-run 僅比對不寫檔。\n" +
    "  修個別題目直接改本檔，並在 04 工作紀錄留痕。",
  generatedAt: new Date().toISOString(),
  questionCount: final.length,
  questions: final,
};

if (DRY_RUN) {
  say(`[dry-run] 將寫入 ${final.length} 題（既有 ${existingBank.length} 題）`);
  if (lostIds.length > 0) {
    say(`[dry-run] 將丟失 ${lostIds.length} 個既有 id（${lostButContentExists.length} 個為漂移、${lostIds.length - lostButContentExists.length} 個為真實刪除）`);
    process.exit(1);
  }
  process.exit(0);
}

writeFileSync(OUT_PATH, JSON.stringify(out) + "\n", "utf8");

const stat = {};
for (const q of final) stat[q.subject] = (stat[q.subject] ?? 0) + 1;
say("\n產生完成：", JSON.stringify(stat), `共 ${final.length} 題`);
say(`既有 ${existingBank.length} 題，新增 ${final.length - existingBank.length} 題，共 ${final.length} 題`);
