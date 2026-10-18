#!/usr/bin/env node
/**
 * 知識點標籤正規化（knowledge taxonomy normalizer）
 *
 * 依 `docs/knowledge-taxonomy.md` 的三層規則校驗／歸併全庫 `knowledge` 標籤。
 *
 * ⚠️ 只實作**第 1 層**（數字後綴正規化）——該層已實測驗證安全：
 *    `顏色單字` 與 `顏色單字2` 主題相同、且無任何一題同時標註兩者，
 *    後綴是生成器分批編號的遺留，不是獨立知識點。
 *
 * ⚠️ **第 2 層（同義詞）與第 3 層（禁止機械歸併）不自動執行**：
 *    實測相鄰編輯距離=1 的標籤有 74 組，但多數是不同知識點
 *    （`4的倍數`↔`6的倍數`、`一元一次方程式`↔`一元二次方程式`），
 *    機械合併會靜默刪除知識邊界。第 2 層需站長逐條核可。
 *
 * 用法：
 *   node scripts/normalize-knowledge-tags.mjs            # 僅報告（dry-run，預設）
 *   node scripts/normalize-knowledge-tags.mjs --apply    # 實際寫入第 1 層映射
 *   node scripts/normalize-knowledge-tags.mjs --json     # 機器可讀輸出
 *
 * 退出碼：0＝無待處理或已成功；1＝dry-run 發現有標籤可歸併（方便 CI 偵測）。
 *
 * ⚠️ 寫入前務必先 `git commit` 保留當前狀態（站長要求）。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const JSON_OUT = process.argv.includes("--json");

/**
 * 掃描範圍（2026-10-18 擴充）：
 *   · generated_bank       —— 生成題的單一真相
 *   · taiwan_curriculum_500 —— 課綱題的單一真相（第 2 層同義詞多來自此檔）
 * runtime_bank 是這兩者的去重投影，**不改它**：改完源再跑 build-runtime-bank 重新投影，
 * 避免「改了源、投影卻過期」的不一致。
 */
const TARGETS = ["data/generated_bank.json", "data/taiwan_curriculum_500.json"];

/**
 * 第 1 層映射表（由 docs/knowledge-taxonomy.md 抽出，程式內建以確保可重跑）。
 * key＝現行標籤，value＝標準標籤。
 */
const SUFFIX_MAP = {
  "be 動詞2": "be 動詞", "be 動詞3": "be 動詞",
  "介系詞2": "介系詞", "介系詞3": "介系詞", "介系詞4": "介系詞",
  "代名詞2": "代名詞", "六書2": "六書", "六書3": "六書", "冠詞2": "冠詞",
  "動物單字2": "動物單字", "句型轉換2": "句型轉換", "句子成分2": "句子成分",
  "可數不可數2": "可數不可數", "同音異字2": "同音異字", "單複數2": "單複數",
  "學校用品2": "學校用品", "家庭稱謂2": "家庭稱謂", "情態動詞2": "情態動詞",
  "成語運用2": "成語運用", "成語運用3": "成語運用",
  "數字單字2": "數字單字", "數字序數2": "數字序數",
  "文體2": "文體", "文體3": "文體", "日常用語2": "日常用語",
  "時間介系詞2": "時間介系詞",
  "標點符號2": "標點符號", "標點符號3": "標點符號",
  "水果單字2": "水果單字", "片語2": "片語",
  "現在進行式2": "現在進行式", "疑問詞2": "疑問詞", "疑問詞3": "疑問詞",
  "的得地2": "的得地", "職業單字2": "職業單字",
  "詞性2": "詞性", "詞語搭配2": "詞語搭配", "詩詞2": "詩詞",
  "連接詞2": "連接詞", "過去式2": "過去式",
  "部首辨識2": "部首辨識", "量詞2": "量詞",
  "閱讀理解2": "閱讀理解", "閱讀理解3": "閱讀理解",
  "關聯詞2": "關聯詞", "顏色單字2": "顏色單字", "食物單字2": "食物單字",
};

/** 第 3 層護欄：即使誤設映射，這些標籤也絕不合併（防呆）。 */
const NEVER_MERGE = new Set([
  "4的倍數", "6的倍數", "9的倍數",
  "一元一次方程式", "一元二次方程式",
  "最大公因數", "最小公倍數",
  "現在式", "現在進行式",
]);

/**
 * 第 2 層：人工核可的同義詞映射（2026-10-18，站長裁示「現在一起做」）。
 *
 * ⚠️ 加入前已逐條機械驗證（見本檔說明）：每一對都在**同一份資料檔**內
 *    各自存在、且**無任何一題同時標註兩者**（故合併不會誤刪知識邊界）。
 *    實測：5 對中僅 `分數換小數`↔`分數找小數` 兩者都在 generated_bank；
 *    其餘 4 對來自 taiwan_curriculum_500（故本檔掃描範圍已擴及該檔）。
 */
const SYNONYM_MAP = {
  "中位數的概念": "中位數概念",
  "倍數判斷": "倍數判別",
  "分數換小數": "分數找小數",
  "代詞指稱": "代詞指代",
  "價格上漲": "價格上升",
};

/** 合併後的完整映射（第 1 層 ∪ 第 2 層），護欄優先。 */
const FULL_MAP = { ...SUFFIX_MAP, ...SYNONYM_MAP };

function loadBank(path) {
  return JSON.parse(readFileSync(join(ROOT, path), "utf8"));
}

const report = [];
let totalChanged = 0;
let totalTagsBefore = 0;

for (const path of TARGETS) {
  const bank = loadBank(path);
  const questions = Array.isArray(bank.questions) ? bank.questions : [];
  const before = new Set();
  const after = new Set();
  const changes = [];
  let changedQuestions = 0;
  let renamedOnly = 0;   // 只是改名（標籤數不變）
  let dedupedTags = 0;   // 同時含 X 與 X2，映射後真的變少

  for (const q of questions) {
    const ks = Array.isArray(q.knowledge) ? q.knowledge : [];
    for (const k of ks) before.add(k);
    if (ks.length === 0) continue;

    const mapped = [...new Set(ks.map((k) => {
      if (NEVER_MERGE.has(k)) return k;          // 護欄
      return FULL_MAP[k] ?? k;
    }))];

    const changed = mapped.length !== ks.length || mapped.some((k, i) => k !== ks[i]);
    if (changed) {
      changedQuestions += 1;
      if (mapped.length < ks.length) dedupedTags += ks.length - mapped.length;
      else renamedOnly += 1;
      const renamed = ks.filter((k) => FULL_MAP[k] && !NEVER_MERGE.has(k));
      if (renamed.length && changes.length < 5) {
        changes.push({ id: q.id, from: renamed, to: renamed.map((k) => FULL_MAP[k]) });
      }
      if (APPLY) q.knowledge = mapped;
    }
    mapped.forEach((k) => after.add(k));
  }

  totalChanged += changedQuestions;
  totalTagsBefore += before.size;

  report.push({
    path,
    questions: questions.length,
    tagsBefore: before.size,
    tagsAfter: APPLY ? after.size : new Set([...before].map((k) => FULL_MAP[k] ?? k)).size,
    changedQuestions,
    renamedOnly,
    dedupedTags,
    sampleChanges: changes.slice(0, 5),
    apply: APPLY,
  });

  if (APPLY && changedQuestions > 0) {
    // 保持原檔序列化風格（minified + 尾換行）
    const raw = readFileSync(join(ROOT, path), "utf8");
    const trailing = raw.endsWith("\n") ? "\n" : "";
    writeFileSync(join(ROOT, path), JSON.stringify(bank) + trailing, "utf8");
  }
}

if (JSON_OUT) {
  process.stdout.write(JSON.stringify({ apply: APPLY, totalChanged, report }, null, 2) + "\n");
} else {
  console.log("═══ 知識點標籤正規化（第 1 層數字後綴 ＋ 第 2 層同義詞）═══");
  console.log(`模式：${APPLY ? "✅ --apply（實際寫入）" : "🔍 dry-run（僅報告）"}\n`);
  for (const r of report) {
    console.log(`📄 ${r.path}`);
    console.log(`   題數 ${r.questions}｜標籤 ${r.tagsBefore} → ${r.tagsAfter}（-${r.tagsBefore - r.tagsAfter}）`);
    console.log(`   受影響題數：${r.changedQuestions}`);
    console.log(`     ├─ 僅改名（標籤數不變）：${r.renamedOnly} 題`);
    console.log(`     └─ 真正去重（同時含 X 與 X2）：${r.dedupedTags} 個標籤實例`);
    if (r.sampleChanges.length) {
      console.log("   範例（只列被改名的標籤，非整題全部標籤）：");
      for (const c of r.sampleChanges) {
        console.log(`     ${c.id}: [${c.from.join(", ")}] → [${c.to.join(", ")}]`);
      }
    }
  }
  console.log(`\n合計受影響題數：${totalChanged}`);
  if (!APPLY && totalChanged > 0) {
    console.log("\nℹ️  這是 dry-run。確認無誤後執行：");
    console.log("   node scripts/normalize-knowledge-tags.mjs --apply");
  }
}

// dry-run 且有可歸併項 → exit 1（供 CI／人工判斷）
process.exit(!APPLY && totalChanged > 0 ? 1 : 0);
