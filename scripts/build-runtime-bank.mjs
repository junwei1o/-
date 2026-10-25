#!/usr/bin/env node
/**
 * 產生前端用的「精簡題庫」：data/runtime_bank_elementary.json
 *
 * 為什麼需要：完整的 data/taiwan_curriculum_500.json 有 1.1MB（含縮排），
 * 其中 learningPerformance / learningContent / competency 三個課綱欄位佔 185KB，
 * 但前端完全沒有顯示它們 → 白白被打包進 index 主包（1.6MB）。
 * 精簡檔只留執行期真的會用到的欄位，主包可瘦身。
 *
 * 來源仍是 data/taiwan_curriculum_500.json 與 data/generated_bank.json（單一真相）。
 * 用法：node scripts/build-runtime-bank.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const KEEP = [
  "id",
  "grade",
  "subject",
  "questionType",
  "difficulty",
  "curriculumDomain",
  "learningTopic",
  "prompt",
  "options",
  "answer",
  "explanation",
  "knowledge",
    // 變體家族標記（S5 的 qc:variant-regression 鎖住其完整性）。
    // 2026-10-25 加進白名單：前端自適應出題要用「同知識點 → 同家族換variant」
    // 做錯題變體重練。anchor 題帶 members 清單、variant 題帶錨點 id；
    // 無此欄的題（約 76%）走一般 knowledge 路徑，不影響出題。
    // 體積影響：+86KB → runtime_bank 約 1.93MB，qc:bundle B 閘門（2.2MB）內。
    "variantOf",
    // 跨學科結合題的科目組合（三科／五科）——前端要顯示「這題結合了哪幾科」時需要。
    "subjectCombination",
    // 深思題的作答上限秒數（未帶此欄＝使用預設 30 秒）。
    "timeLimitSec",
    "area",
];

/**
 * 來源對照：同一個輸出檔可以由多個來源合併（課綱題庫 + 自動產生的擴充題庫），
 * 擴充題庫依年級分流到國小／國中檔。合併時以題幹去重，保證「不重複」。
 */
const SOURCES = [
  {
    to: "data/runtime_bank_elementary.json",
    from: ["data/taiwan_curriculum_500.json"],
    generated: (q) => Number(q.grade) <= 6,
  },
  {
    generated: (q) => Number(q.grade) >= 7,
  },
];

let generated = [];
try {
  const parsed = JSON.parse(readFileSync(join(ROOT, "data/generated_bank.json"), "utf8"));
  generated = Array.isArray(parsed?.questions) ? parsed.questions : [];
} catch {
  console.log("（未找到 data/generated_bank.json，略過擴充題庫；可執行 node scripts/expand-question-bank.mjs 產生）");
}

let totalRaw = 0;
let totalSlim = 0;

for (const source of SOURCES) {
  const { to, from, generated: keepGenerated } = source;
  // 沒有輸出檔的來源（例如國中档 runtime_bank_junior 移除後，只剩年級分流條件）
  // 整個跳過。少了這行，腳本會在跑完第一個來源之後才崩，等於**建置到一半失敗**。
  if (!to) continue;
  const questions = [];
  const seen = new Set();
  /**
   * 去重鍵＝科目＋題幹＋選項內容。
   * 只用題幹會把「同一題幹、不同選項」的變體題全部誤刪，題庫就鋪不開；
   * 但完全相同的題目（課綱題庫與擴充題庫重疊）仍會被擋掉。
   */
  const push = (question) => {
    const opts = [...(question.options ?? [])]
      .map((o) => String(o).replace(/\s+/g, ""))
      .sort();
    const key = `${question.subject ?? ""}|${String(question.prompt ?? "").replace(/\s+/g, "")}#${opts.join("|")}`;
    if (seen.has(key)) return;
    seen.add(key);
    questions.push(question);
  };
    let rawBytes = 0;
    // `from ?? []`：來源可以只宣告篩選條件而沒有輸入檔，沒有就整個跳過
    for (const file of from ?? []) {
    const raw = readFileSync(join(ROOT, file), "utf8");
    rawBytes += Buffer.byteLength(raw, "utf8");
    const parsed = JSON.parse(raw);
    (Array.isArray(parsed?.questions) ? parsed.questions : []).forEach(push);
  }
  generated.filter(keepGenerated).forEach(push);
  totalRaw += rawBytes;
  const slim = questions.map((question) => {
    const out = {};
    for (const key of KEEP) {
      if (question[key] !== undefined && question[key] !== null) out[key] = question[key];
    }
    // 題型缺漏時依選項數推斷：兩個選項就是是非題，其餘視為選擇題。
    // 課綱題庫有近千題沒寫 questionType，前端會一律當成選擇題，是非題就失效了。
    if (!out.questionType) out.questionType = out.options?.length === 2 ? "是非題" : "選擇題";
    return out;
  });

  /**
   * variantOf 引用完整性清洗（2026-10-25）。
   *
   * 為什麼不能直接把源頭的 variantOf 放行：源頭 `generated_bank.json` 的家族
   * 可能橫跨國小／國中。本檔只收 `grade <= 6`，錨點題若被分流到國中檔，
   * 留在本檔的變體題就指向**庫中不存在的 id**（實測 220 個 variant、
   * 241 個 members 懸空）。前端自適應出題照著它找「同家族另一題」會拿到
   * 查不到的 id → 靜默降級或出錯，屬型 5（環境假設未驗證）。
   *
   * 策略：**剝除壞引用、絕不刪題**。
   * - variant 題的 anchor 不在庫內 → 去掉 variantOf（變回普通題，照常可出）。
   * - anchor 題的 members 部分不在庫內 → 只留庫內的；全空則去掉 variantOf。
   * - anchor 題的 groupSize 保持原值（語意是「原始家族大小」，供後台分析），
   *   前端一律以 members 為準；members 已被裁剪，故额外記 visibleSize。
   */
  const ids = new Set(slim.map((q) => q.id));
  let strippedVariant = 0;
  let trimmedMembers = 0;
  for (const q of slim) {
    const v = q.variantOf;
    if (!v || typeof v !== "object") continue;
    if (v.role === "variant") {
      if (typeof v.anchor !== "string" || !ids.has(v.anchor)) {
        delete q.variantOf;
        strippedVariant += 1;
      }
    } else if (v.role === "anchor") {
      const members = Array.isArray(v.members) ? v.members.filter((m) => ids.has(m)) : [];
      if (members.length === 0) {
        delete q.variantOf;
        strippedVariant += 1;
      } else {
        if (members.length !== (v.members?.length ?? 0)) trimmedMembers += 1;
        q.variantOf = { ...v, members, visibleSize: members.length + 1 };
      }
    } else {
      delete q.variantOf;
      strippedVariant += 1;
    }
  }
  const keptFamilies = slim.filter((q) => q.variantOf).length;
  if (strippedVariant || trimmedMembers) {
    console.log(
      `  ↳ variantOf 清洗：保留 ${keptFamilies} 題／剝除懸空引用 ${strippedVariant} 題／裁剪 members ${trimmedMembers} 題（跨年級分流所致，題目本身不刪）`,
    );
  }
  const out = {
    note: `由 ${from.join("、")} 與 data/generated_bank.json 自動產生的前端精簡題庫，請勿手動編輯；執行 node scripts/build-runtime-bank.mjs 重新產生。`,
    questions: slim,
  };
  const text = JSON.stringify(out);
  writeFileSync(join(ROOT, to), text + "\n", "utf8");
  totalRaw += rawBytes;
  totalSlim += Buffer.byteLength(text, "utf8");
  console.log(`${to}: ${slim.length} 題，${(Buffer.byteLength(text) / 1024).toFixed(0)} KB`);
}

const saved = ((totalRaw - totalSlim) / 1024).toFixed(0);
console.log(`原始 ${(totalRaw / 1024).toFixed(0)} KB → 精簡 ${(totalSlim / 1024).toFixed(0)} KB（省 ${saved} KB）`);
