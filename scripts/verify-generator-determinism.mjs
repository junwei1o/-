#!/usr/bin/env node
/**
 * E2g 验证：`expand-question-bank.mjs` 是否真的「seed 固定、重跑同結果」，
 * 以及重跑相對於 HEAD 現檔的**漂移量**。
 *
 * 三個獨立判準（缺一不可，別把「確定性」當成「可重現 HEAD」）：
 *   ① 確定性：同 seed 連跑兩次，產出是否逐字元相等（排除 generatedAt）。
 *   ② 可重現性：現行腳本跑出的內容，是否等於工作區现有的 data/generated_bank.json。
 *      —— 這才是 E2g 的危險點：① 成立不代表 ② 成立。
 *   ③ 覆蓋危險：若 ② 不成立，重跑會**靜默刪除**現檔裡有多少題（丟失 id 數）。
 *
 * 用法：node scripts/verify-generator-determinism.mjs
 * 結束碼：0＝三項全安全；1＝偵測到漂移（重跑會毀內容）。
 *
 * ⚠️ 2026-10-18 改為**沙箱執行**：生成器會寫 data/generated_bank.json，
 *    在真實工作區跑會真的改檔（append-only 模式下更會追加兩千題、污染 git）。
 *    現在把生成器＋其所需的來源檔複製到系統臨時目錄後才跑，跑完即刪，
 *    真實工作區從頭到尾不被寫入。
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdirSync, cpSync, rmSync, mkdtempSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const ROOT = process.cwd();
const SRC = join(ROOT, "data/generated_bank.json");
const GENERATOR = join(ROOT, "scripts/expand-question-bank.mjs");

if (!existsSync(SRC)) {
  console.error("找不到 data/generated_bank.json，請在 repo 根執行。");
  process.exit(2);
}

const parseJson = (text) => JSON.parse(text);
const load = (p) => parseJson(readFileSync(p, "utf8"));

// ⓪ 沙箱執行：生成器會寫 data/generated_bank.json，若在真實工作區跑，
//    會真的改檔（污染 git）。全部在臨時目錄重現：
//    · 複製 scripts/expand-question-bank.mjs 與整個 scripts/gen/（生成器依賴鏈）
//    · 複製 data/ 底下生成器會讀的來源：課綱、英語 seed，以及它從
//      matching_bank／matching_bank_extra 轉關係題（實測缺 matching_bank 會 ENOENT）
//    · generated_bank.json 也要放一份（生成器寫入目標；防被誤刪時 diff 崩）
const SANDBOX = mkdtempSync(join(tmpdir(), "gen-verify-"));
const TARGET = join(SANDBOX, "data/generated_bank.json");
mkdirSync(join(SANDBOX, "data"), { recursive: true });
mkdirSync(join(SANDBOX, "scripts"), { recursive: true });
copyFileSync(GENERATOR, join(SANDBOX, "scripts/expand-question-bank.mjs"));
cpSync(join(ROOT, "scripts/gen"), join(SANDBOX, "scripts/gen"), { recursive: true });
const NEEDED_DATA = [
  "data/generated_bank.json",
  "data/taiwan_curriculum_500.json",
  "data/taiwan_english_seed.json",
  "data/matching_bank.json",
  "data/matching_bank_extra.json",
];
for (const f of NEEDED_DATA) {
  const s = join(ROOT, f);
  if (existsSync(s)) copyFileSync(s, join(SANDBOX, f));
}

// 基準＝工作區的 HEAD 內容（未經生成器）。
// ⚠️ parseJson 吃的是「字串」；load() 吃的是「路徑」。這裡傳入的是檔案內容，
//    誤用 load() 會讓 readFileSync 把整份 JSON 當成檔名 → ENAMETOOLONG。
const baselineRaw = readFileSync(SRC, "utf8");
const baseline = parseJson(baselineRaw);

/**
 * 跑一次生成器並取回產出。
 *
 * ⚠️ 不用 execFileSync：它失敗時會把 **child 的完整 stdout/stderr buffer**
 *   掛在拋出的 error 上，父程序一旦 print 該 error 就會灌出整份題庫 JSON
 *   （實測本腳本第一版就這麼漏了 2.4 MB）。改成 spawnSync＋手動截斷，
 *   只保留 stderr 全部＋stdout 前 50 行。
 */
const runOnce = (label) => {
  // 執行沙箱內的副本，不是真實工作區的腳本（cwd 已在沙箱）。
  // ⚠️ 必須帶 --force-overwrite：選項 B 的寫入守門會因「既有 id 消失」拒絕寫入，
  //    而本腳本**就是**為了測量那個漂移量才存在的——在沙箱裡覆寫是安全的
  //    （沙箱內的 generated_bank.json 是複本，真實工作區從頭到尾不被寫）。
  const res = spawnSync(
    process.execPath,
    [join(SANDBOX, "scripts/expand-question-bank.mjs"), "--quiet", "--force-overwrite"],
    {
      cwd: SANDBOX,
      encoding: "utf8",
    },
  );
  if (res.error) throw new Error(`生成器無法啟動：${res.error.message}`);
  if (res.status !== 0) {
    // 截斷：stdout/stderr 都可能很大（生成器失敗時可能印出題目）。
    // 只保留 stderr 前 40 行＋stdout 前 50 行，避免把整份題庫灌進日誌。
    const cut = (s, n) => (s ?? "").split("\n").slice(0, n).join("\n");
    throw new Error(
      `生成器第 ${label} 次跑失敗（exit=${res.status}）\n` +
        `--- stderr（前 40 行）---\n${cut(res.stderr, 40)}\n--- stdout（前 50 行）---\n${cut(res.stdout, 50)}`,
    );
  }
  return readFileSync(TARGET, "utf8");
};

let run1Raw, run2Raw;
try {
  run1Raw = runOnce(1);
  run2Raw = runOnce(2);
} finally {
  // 沙箱是臨時目錄，直接刪除即可；真實工作區從頭到尾沒被寫過。
  rmSync(SANDBOX, { recursive: true, force: true });
  process.stdout.write("🧹 沙箱已清除（真實工作區 data/generated_bank.json 全程未被寫入）\n");
}

const run1 = parseJson(run1Raw);
const run2 = parseJson(run2Raw);

// ① 確定性：排除 generatedAt（時間戳必然不同）。
const strip = (o) => {
  const { generatedAt, ...rest } = o;
  return JSON.stringify(rest);
};
const deterministic = strip(run1) === strip(run2);

// ② 可重現 HEAD：run1 的 id 集合 vs 現檔。
const idSet = (o) => new Set(o.questions.map((q) => q.id));
const baseIds = idSet(baseline);
const r1Ids = idSet(run1);
const lost = [...baseIds].filter((x) => !r1Ids.has(x));
const gained = [...r1Ids].filter((x) => !baseIds.has(x));
const reproducible = lost.length === 0 && gained.length === 0;

console.log("══════ E2g 生成器驗證 ══════");
console.log(`現檔（工作區/HEAD）：${baseline.questions.length} 題`);
console.log(`run1：${run1.questions.length} 題｜run2：${run2.questions.length} 題`);
console.log("");
console.log(`① 確定性（同 seed 連跑兩次一致）：${deterministic ? "✅ 是" : "❌ 否——生成器有非決定性來源，需查"}`);
console.log(`② 可重現 HEAD（重跑＝現檔）      ：${reproducible ? "✅ 是" : "❌ 否"}`);
console.log(
  `   丟失 id：${lost.length}｜新增 id：${gained.length}` +
    (lost.length || gained.length ? `（共 ${lost.length + gained.length} 題會因重跑而變動）` : ""),
);

// 附帶：題數差、以及「現檔独有的題」抽樣（看是哪些 topic 掉）。
if (lost.length) {
  const byTopic = {};
  for (const q of baseline.questions) {
    if (r1Ids.has(q.id)) continue;
    const t = q.learningTopic || q.questionType || "?";
    byTopic[t] = (byTopic[t] || 0) + 1;
  }
  const top = Object.entries(byTopic).sort((a, b) => b[1] - a[1]).slice(0, 6);
  console.log(`   丟失題 topic 分佈（前 6）：${top.map(([k, v]) => `${k}×${v}`).join("｜")}`);
}

const safe = deterministic && reproducible;
console.log("");
console.log(safe ? "✅ 安全：可放心用生成器重生本檔。" : "🚫 危險：請勿拿「重跑」當作修題手段——會覆蓋掉大量現檔內容。");
console.log(`   （修個別題目：直接改 data/generated_bank.json，並在 04 工作紀錄留痕。）`);
process.exit(safe ? 0 : 1);
