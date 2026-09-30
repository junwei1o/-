/**
 * 題庫審計 v2（五維度）
 *
 * 用法：node_modules/.bin/tsx scripts/audit-question-bank-v2.mts
 * 產出：audit-report.json / audit-report.md + 終端儀表板
 *
 * 與原提案的差異（皆為實測後修正）：
 *  1. **資料載入改走 JSON 檔**（沿用 qc-question-bank.mts 的模式）。
 *     原提案 `import { questionBank } from "../lib/questionBank"` 不存在——
 *     該檔只匯出 LOCAL_QUESTION_BANK（空陣列）與 loadLocalBank()；
 *     matchingBank 匯出的也是 MATCHING_SETS（配對集合），不是題目陣列。
 *  2. **科目字串改為實際值**：數學／自然／社會／國語／英語（原提案用「國語文」）。
 *  3. **grade 型別不一致**：sort/image/matching 用字串 "3-4年級"，其餘為數字。
 *     原提案的 `grade < 1 || grade > 6` 對字串會靜默判錯 → 本檔統一正規化。
 *  4. **中文同義詞偵測**：2 字標籤編輯距離 1 幾乎必然誤判
 *     （「沸點」↔「沸騰」語意不同）→ 僅在兩者皆 ≥3 字時採用距離判斷。
 *  5. **新增「接線狀態」檢查**：找出有資料但沒有任何程式引用的死題庫。
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

// ── 資料來源（含題型與 grade 正規化規則）──────────────────
type BankFile = {
  file: string;
  /** 該檔實際的題型（用來補 questionType；檔名常與實際題型不符） */
  type: string;
  /** grade 為字串範圍（如 "3-4年級"）時，取代表年級 */
  gradeFromRange?: boolean;
  /** 是否已被程式引用（false＝死資料） */
  wired: boolean;
};

const BANKS: BankFile[] = [
  { file: "data/runtime_bank_elementary.json", type: "single-choice", wired: true },
  { file: "data/taiwan_english_seed.json", type: "single-choice", wired: true },
  { file: "data/fill_bank.json", type: "single-choice", wired: true }, // 名為 fill，實為選量詞的選擇題（無 blanks）
  { file: "data/order_bank.json", type: "order", gradeFromRange: false, wired: false },
  { file: "data/sort_bank.json", type: "sort", gradeFromRange: true, wired: false },
  { file: "data/image_bank.json", type: "image-matching", gradeFromRange: true, wired: false },
  { file: "data/matching_bank.json", type: "matching", gradeFromRange: true, wired: true },
  { file: "data/matching_bank_extra.json", type: "matching", gradeFromRange: true, wired: true },
];

const SUBJECTS = ["數學", "自然", "社會", "國語", "英語"] as const;
const DIFFICULTIES = ["基礎", "標準", "挑戰"] as const;
const REGISTERED_TYPES = [
  "single-choice",
  "true-false",
  "matching",
  "fill-blank",
  "short-answer",
  "open-ended",
  "passage-group",
  "variant",
];
/** 各題型純猜測期望正確率（與 client/src/lib/questionTypes.ts 的 guessRate 一致） */
const GUESS_RATE: Record<string, number> = {
  "single-choice": 0.25,
  "true-false": 0.5,
  matching: 0.1,
  "fill-blank": 0.05,
};

type Row = Record<string, unknown> & {
  id?: string;
  grade?: unknown;
  subject?: string;
  difficulty?: string;
  prompt?: string;
  options?: string[];
  answer?: number;
  knowledge?: string[];
  explanation?: string;
  _bank: string;
  _type: string;
  _grade: number | null;
  _gradeRaw: string;
};

function loadBanks(): { rows: Row[]; files: Array<{ file: string; count: number; wired: boolean; type: string }> } {
  const rows: Row[] = [];
  const files: Array<{ file: string; count: number; wired: boolean; type: string }> = [];

  for (const bank of BANKS) {
    const path = join(ROOT, bank.file);
    if (!existsSync(path)) {
      files.push({ file: bank.file, count: -1, wired: bank.wired, type: bank.type });
      continue;
    }
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    const items: Row[] = Array.isArray(parsed)
      ? parsed
      : (parsed.questions ?? parsed.items ?? parsed.sets ?? []);

    for (const raw of items) {
      const gradeRaw = String(raw.grade ?? "");
      const numeric = typeof raw.grade === "number" ? raw.grade : Number.parseInt(gradeRaw, 10);
      rows.push({
        ...raw,
        _bank: bank.file,
        _type: (raw.questionType as string) ?? bank.type,
        _grade: Number.isFinite(numeric) ? numeric : null,
        _gradeRaw: gradeRaw,
      });
    }
    files.push({ file: bank.file, count: items.length, wired: bank.wired, type: bank.type });
  }
  return { rows, files };
}

// ── 題型正規化（題庫用中文，註冊表用英文 id）──────────────
function normalizeType(raw: string): string {
  const map: Record<string, string> = {
    選擇題: "single-choice",
    是非題: "true-false",
    配對題: "matching",
    填空題: "fill-blank",
    簡答題: "short-answer",
    申論題: "open-ended",
    題組題: "passage-group",
    變體題: "variant",
    order: "order",
    sort: "sort",
    "image-matching": "image-matching",
  };
  return map[raw] ?? raw;
}

type Issue = {
  severity: "critical" | "error" | "warning" | "info";
  dimension: "structure" | "knowledge" | "content" | "diagnosis" | "coverage" | "wiring";
  category: string;
  message: string;
  questionId?: string;
  fix?: string;
};

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i, ...Array(n).fill(0)];
    for (let j = 1; j <= n; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], cur[j - 1], prev[j - 1]);
    }
    prev = cur;
  }
  return prev[n];
}

// ═══ 五維度 ═══

function dimStructure(rows: Row[], issues: Issue[]) {
  const byType: Record<string, number> = {};
  let valid = 0;

  for (const q of rows) {
    const t = normalizeType(String(q._type));
    byType[t] = (byType[t] ?? 0) + 1;

    let ok = true;
    if (!q.id) { issues.push({ severity: "critical", dimension: "structure", category: "缺 id", message: "缺少 id" }); ok = false; }
    if (q._grade === null) { issues.push({ severity: "error", dimension: "structure", category: "grade 無法解析", message: `grade="${q._gradeRaw}"`, questionId: q.id }); ok = false; }
    else if (q._grade < 1 || q._grade > 6) { issues.push({ severity: "error", dimension: "structure", category: "grade 越界", message: `grade=${q._grade}`, questionId: q.id }); ok = false; }
    if (!q.subject) { issues.push({ severity: "critical", dimension: "structure", category: "缺 subject", message: "缺少 subject", questionId: q.id }); ok = false; }
    else if (!SUBJECTS.includes(q.subject as (typeof SUBJECTS)[number])) {
      issues.push({ severity: "error", dimension: "structure", category: "科目非標準值", message: `subject="${q.subject}"`, questionId: q.id, fix: "改為 數學／自然／社會／國語／英語" });
      ok = false;
    }
    if (!q.difficulty) { issues.push({ severity: "error", dimension: "structure", category: "缺 difficulty", message: "缺少 difficulty", questionId: q.id }); ok = false; }
    else if (!DIFFICULTIES.includes(q.difficulty as (typeof DIFFICULTIES)[number])) {
      issues.push({ severity: "error", dimension: "structure", category: "difficulty 非法", message: `difficulty="${q.difficulty}"`, questionId: q.id });
      ok = false;
    }
    if (!q.prompt) { issues.push({ severity: "error", dimension: "structure", category: "缺 prompt", message: "缺少 prompt", questionId: q.id }); ok = false; }

    // 題型專屬
    if (t === "single-choice") {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        issues.push({ severity: "error", dimension: "structure", category: "選項數不為 4", message: `選項數=${q.options?.length ?? 0}`, questionId: q.id });
        ok = false;
      }
      if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= (q.options?.length ?? 0)) {
        issues.push({ severity: "error", dimension: "structure", category: "answer 越界", message: `answer=${q.answer}`, questionId: q.id });
        ok = false;
      }
    }
    if (t === "true-false" && (!Array.isArray(q.options) || q.options.length !== 2)) {
      issues.push({ severity: "error", dimension: "structure", category: "是非題選項數不為 2", message: `選項數=${q.options?.length ?? 0}`, questionId: q.id });
      ok = false;
    }
    if (!REGISTERED_TYPES.includes(t) && !["order", "sort", "image-matching"].includes(t)) {
      issues.push({ severity: "warning", dimension: "structure", category: "題型未註冊", message: `題型「${q._type}」不在註冊表`, questionId: q.id });
    }
    if (ok) valid++;
  }

  // id 唯一性（跨檔）
  const idCount = new Map<string, number>();
  for (const q of rows) if (q.id) idCount.set(q.id, (idCount.get(q.id) ?? 0) + 1);
  const dupIds = [...idCount.entries()].filter(([, c]) => c > 1);
  for (const [id, c] of dupIds) {
    issues.push({ severity: "error", dimension: "structure", category: "id 重複", message: `id="${id}" 出現 ${c} 次` });
  }

  const score = Math.max(0, Math.round((valid / Math.max(rows.length, 1)) * 100) - dupIds.length * 2);
  return { score, byType, summary: `${valid}/${rows.length} 題結構完整，${dupIds.length} 個重複 id` };
}

function dimKnowledge(rows: Row[], issues: Issue[]) {
  const tagCount: Record<string, number> = {};
  let withKnowledge = 0;
  let withPrimary = 0;
  let totalTags = 0;
  let noKnowledge = 0;

  for (const q of rows) {
    const ks = Array.isArray(q.knowledge) ? (q.knowledge as string[]) : [];
    if (ks.length > 0) {
      withKnowledge++;
      totalTags += ks.length;
      for (const k of ks) tagCount[k] = (tagCount[k] ?? 0) + 1;
    } else {
      noKnowledge++;
    }
    if (q.primaryKnowledge) withPrimary++;
  }
  if (noKnowledge > 0) {
    issues.push({
      severity: "critical",
      dimension: "knowledge",
      category: "缺 knowledge 標籤",
      message: `${noKnowledge} 題沒有 knowledge 標籤（診斷系統無法運作）`,
      fix: "為這些題補上至少一個知識點標籤",
    });
  }

  const entries = Object.entries(tagCount);
  const unique = entries.length;
  const singletons = entries.filter(([, c]) => c === 1).map(([k]) => k);
  const orphans = entries.filter(([, c]) => c < 3).map(([k]) => k);
  const singletonRatio = singletons.length / Math.max(unique, 1);

  // 疑似同義（修正：2 字標籤不用編輯距離，避免「沸點↔沸騰」誤判）
  const candidates: Array<{ a: string; b: string; reason: string }> = [];
  const tags = entries.map(([k]) => k);
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const a = tags[i];
      const b = tags[j];
      if (a.includes(b) || b.includes(a)) {
        candidates.push({ a, b, reason: "包含關係" });
      } else if (a.length >= 3 && b.length >= 3 && levenshtein(a, b) <= 1) {
        candidates.push({ a, b, reason: "編輯距離 ≤ 1（皆 ≥3 字）" });
      }
    }
  }

  const sorted = entries.sort((x, y) => y[1] - x[1]);
  const total = sorted.reduce((s, [, c]) => s + c, 0);
  const top20 = sorted.slice(0, Math.ceil(sorted.length * 0.2));
  const top20Coverage = top20.reduce((s, [, c]) => s + c, 0) / Math.max(total, 1);
  const zipfDeviation = Math.max(0, 0.8 - top20Coverage);

  const sufficient = entries.filter(([, c]) => c >= 10).length;
  const marginal = entries.filter(([, c]) => c >= 3 && c < 10).length;
  const insufficient = entries.filter(([, c]) => c < 3).length;

  let score = 100;
  score -= Math.min(noKnowledge * 2, 40);
  if (singletonRatio > 0.5) score -= 25;
  else if (singletonRatio > 0.3) score -= 15;
  else if (singletonRatio > 0.15) score -= 5;
  if (candidates.length > 20) score -= 20;
  else if (candidates.length > 10) score -= 10;
  else if (candidates.length > 3) score -= 3;
  score -= Math.round(zipfDeviation * 30);
  score -= Math.round((insufficient / Math.max(unique, 1)) * 15);

  if (singletonRatio > 0.3) {
    issues.push({
      severity: "warning",
      dimension: "knowledge",
      category: "單例標籤過多",
      message: `${(singletonRatio * 100).toFixed(0)}% 的知識點只出現 1 次（${singletons.length}/${unique}）`,
      fix: "建立 docs/knowledge-taxonomy.md 合併同義詞並為孤兒標籤補題",
    });
  }
  if (candidates.length > 10) {
    issues.push({ severity: "warning", dimension: "knowledge", category: "疑似同義標籤", message: `${candidates.length} 組疑似同義`, fix: "人工檢視後合併" });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    summary: `${unique} 個知識點｜單例 ${singletons.length}｜疑似同義 ${candidates.length}｜齊夫偏離 ${(zipfDeviation * 100).toFixed(0)}%`,
    detail: {
      totalUnique: unique,
      singletonCount: singletons.length,
      orphanCount: orphans.length,
      singletons: singletons.slice(0, 40),
      sameVariants: candidates.slice(0, 40),
      topTags: sorted.slice(0, 20),
      coverageRatio: Number((withKnowledge / Math.max(rows.length, 1)).toFixed(3)),
      primaryCoverage: Number((withPrimary / Math.max(rows.length, 1)).toFixed(3)),
      avgTagsPerQuestion: Number((totalTags / Math.max(withKnowledge, 1)).toFixed(2)),
      zipfDeviation: Number(zipfDeviation.toFixed(3)),
      sampleAdequacy: { sufficient, marginal, insufficient },
    },
  };
}

function dimContent(rows: Row[], issues: Issue[]) {
  const pos = [0, 0, 0, 0];
  let scCount = 0;
  let answerLongest = 0;
  let absolute = 0;
  let withExplanation = 0;
  const promptLens: number[] = [];
  const absolutes = ["一定", "永遠", "絕不", "絕對", "全部", "所有", "必然", "必定", "從不", "總是"];
  const byPrompt = new Map<string, string[]>();

  for (const q of rows) {
    const t = normalizeType(String(q._type));
    const prompt = String(q.prompt ?? "");
    promptLens.push(prompt.length);
    if (q.explanation) withExplanation++;

    if (t === "single-choice" && Array.isArray(q.options) && typeof q.answer === "number") {
      scCount++;
      pos[q.answer] = (pos[q.answer] ?? 0) + 1;
      const ansLen = q.options[q.answer]?.length ?? 0;
      const others = q.options.filter((_, i) => i !== q.answer).map((o) => o.length);
      if (others.length > 0 && ansLen > Math.max(...others)) answerLongest++;
      const ansText = q.options[q.answer];
      if (ansText && prompt.includes(ansText)) {
        issues.push({ severity: "warning", dimension: "content", category: "題幹洩漏正解", message: "題幹包含正解文字", questionId: q.id });
      }
    }

    if (t === "true-false") {
      for (const w of absolutes) {
        if (prompt.includes(w)) {
          issues.push({ severity: "warning", dimension: "content", category: "絕對化措辭", message: `是非題含「${w}」`, questionId: q.id, fix: "改寫為非絕對化陳述" });
          break;
        }
      }
    }
    let hasAbs = false;
    for (const w of absolutes) if (`${prompt}${q.explanation ?? ""}`.includes(w)) { hasAbs = true; break; }
    if (hasAbs) absolute++;

    const key = prompt.replace(/\s+/g, "").replace(/[，。！？、；：（）]/g, "");
    if (key) byPrompt.set(key, [...(byPrompt.get(key) ?? []), String(q.id ?? "?")]);
  }

  const dupGroups = [...byPrompt.values()].filter((ids) => ids.length > 1);
  if (dupGroups.length > 0) {
    issues.push({ severity: "error", dimension: "content", category: "重複題目", message: `${dupGroups.length} 組題幹重複`, fix: "移除或改用 variant 機制" });
  }

  const expected = scCount / 4;
  const maxDev = expected > 0 ? Math.max(...pos.map((p) => Math.abs(p - expected))) / expected : 0;
  if (maxDev > 0.3) {
    issues.push({ severity: "error", dimension: "content", category: "正解位置嚴重不均", message: `最大偏差 ${(maxDev * 100).toFixed(0)}%`, fix: "重新分配正解位置（選項洗牌已由 optionRandomizer 處理，此處指題庫原始分佈）" });
  } else if (maxDev > 0.2) {
    issues.push({ severity: "warning", dimension: "content", category: "正解位置不均", message: `最大偏差 ${(maxDev * 100).toFixed(0)}%` });
  }

  const longestRatio = answerLongest / Math.max(scCount, 1);
  const explanationRatio = withExplanation / Math.max(rows.length, 1);

  let score = 100;
  score -= Math.min(dupGroups.length * 5, 30);
  score -= Math.round(maxDev * 40);
  score -= Math.round(Math.max(0, longestRatio - 0.3) * 30);
  score -= Math.round((1 - explanationRatio) * 15);

  const sortedLens = [...promptLens].sort((a, b) => a - b);
  return {
    score: Math.max(0, Math.min(100, score)),
    summary: `${dupGroups.length} 組重複題｜正解位置偏差 ${(maxDev * 100).toFixed(0)}%｜解析覆蓋 ${(explanationRatio * 100).toFixed(0)}%`,
    detail: {
      answerPositionDistribution: pos,
      answerPositionMaxDeviation: Number(maxDev.toFixed(3)),
      answerIsLongestRatio: Number(longestRatio.toFixed(3)),
      absoluteWordingCount: absolute,
      duplicateGroups: dupGroups.slice(0, 20),
      explanationCoverage: Number(explanationRatio.toFixed(3)),
      promptLength: {
        min: sortedLens[0] ?? 0,
        max: sortedLens[sortedLens.length - 1] ?? 0,
        avg: Math.round(sortedLens.reduce((a, b) => a + b, 0) / Math.max(sortedLens.length, 1)),
        median: sortedLens[Math.floor(sortedLens.length / 2)] ?? 0,
      },
    },
  };
}

function dimDiagnosis(rows: Row[], issues: Issue[]) {
  // 可診斷＝已註冊且支援診斷（此處以「有 knowledge 且題型可自動評分」近似）
  const diagnostic = rows.filter(
    (q) => Array.isArray(q.knowledge) && (q.knowledge as string[]).length > 0 && q._type !== "open-ended",
  );
  const tagCount: Record<string, number> = {};
  for (const q of diagnostic) for (const k of q.knowledge as string[]) tagCount[k] = (tagCount[k] ?? 0) + 1;
  const sufficient = Object.values(tagCount).filter((c) => c >= 10).length;
  const marginal = Object.values(tagCount).filter((c) => c >= 3 && c < 10).length;
  const insufficient = Object.values(tagCount).filter((c) => c < 3).length;

  const gradeCoverage: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const q of diagnostic) if (q._grade !== null && q._grade >= 1 && q._grade <= 6) gradeCoverage[q._grade]++;

  let score = 100;
  const count = diagnostic.length;
  if (count < 100) score -= 30;
  else if (count < 150) score -= 15;
  else if (count < 300) score -= 5;
  score -= Math.round((insufficient / Math.max(sufficient + marginal + insufficient, 1)) * 25);
  const emptyGrades = Object.values(gradeCoverage).filter((c) => c === 0).length;
  score -= emptyGrades * 5;

  if (count < 300) {
    issues.push({ severity: count < 100 ? "critical" : "warning", dimension: "diagnosis", category: "可診斷題不足", message: `可診斷題 ${count} 題（建議 ≥300）`, fix: "補 knowledge 標籤或擴充可自動評分題型" });
  }
  if (insufficient / Math.max(Object.keys(tagCount).length, 1) > 0.5) {
    issues.push({ severity: "warning", dimension: "diagnosis", category: "知識點樣本不足", message: `${((insufficient / Math.max(Object.keys(tagCount).length, 1)) * 100).toFixed(0)}% 的知識點樣本 < 3`, fix: "為孤兒知識點補題或合併" });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    summary: `可診斷題 ${count}｜樣本充足知識點 ${sufficient}｜${emptyGrades} 個年級無可診斷題`,
    detail: { diagnosticCount: count, sampleAdequacy: { sufficient, marginal, insufficient }, gradeCoverage, guessRates: GUESS_RATE },
  };
}

function dimCoverage(rows: Row[], issues: Issue[]) {
  const subjectCounts: Record<string, number> = {};
  const gradeCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const difficulty: Record<string, number> = { 基礎: 0, 標準: 0, 挑戰: 0 };
  const matrix: Record<string, Record<number, number>> = {};
  for (const s of SUBJECTS) { subjectCounts[s] = 0; matrix[s] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; }

  for (const q of rows) {
    const s = String(q.subject ?? "?");
    subjectCounts[s] = (subjectCounts[s] ?? 0) + 1;
    if (q._grade !== null && q._grade >= 1 && q._grade <= 6) {
      gradeCounts[q._grade]++;
      if (matrix[s]) matrix[s][q._grade]++;
    }
    if (q.difficulty && difficulty[q.difficulty] !== undefined) difficulty[q.difficulty]++;
  }

  let score = 100;
  for (const s of SUBJECTS) {
    const c = subjectCounts[s] ?? 0;
    if (c === 0) { score -= 12; issues.push({ severity: "warning", dimension: "coverage", category: "科目無題", message: `科目「${s}」尚無題目` }); }
    else if (c < 10) { score -= 8; issues.push({ severity: "warning", dimension: "coverage", category: "科目題數過少", message: `「${s}」僅 ${c} 題` }); }
    else if (c < 50) score -= 4;
    else if (c < 100) score -= 1;
  }
  for (const g of [1, 2, 3, 4, 5, 6]) {
    if (gradeCounts[g] === 0) { score -= 4; issues.push({ severity: "warning", dimension: "coverage", category: "年級無題", message: `${g} 年級尚無題目` }); }
  }
  const total = Math.max(rows.length, 1);
  const basicRatio = difficulty["基礎"] / total;
  const challengeRatio = difficulty["挑戰"] / total;
  if (basicRatio > 0.7) score -= 8;
  if (challengeRatio < 0.05) score -= 5;

  return {
    score: Math.max(0, Math.min(100, score)),
    summary: `${Object.values(subjectCounts).filter((c) => c > 0).length}/${SUBJECTS.length} 科目有題｜基礎題 ${(basicRatio * 100).toFixed(0)}%`,
    detail: { subjectCounts, gradeCounts, subjectGradeMatrix: matrix, difficultyBalance: difficulty },
  };
}

/** 新增維度：接線狀態（有資料但沒有任何程式引用＝死資料） */
function dimWiring(files: Array<{ file: string; count: number; wired: boolean; type: string }>, issues: Issue[]) {
  const dead = files.filter((f) => !f.wired && f.count > 0);
  for (const d of dead) {
    issues.push({
      severity: "warning",
      dimension: "wiring",
      category: "死題庫",
      message: `${d.file}（${d.count} 筆，題型 ${d.type}）沒有任何程式引用`,
      fix: "接線到 UI，或標記為未使用以免後續 agent 誤以為已上線",
    });
  }
  return {
    score: Math.max(0, 100 - dead.length * 20),
    summary: `${files.length} 個題庫檔，其中 ${dead.length} 個未接線（死資料）`,
    detail: { files },
  };
}

// ═══ 主流程 ═══

function main() {
  const t0 = Date.now();
  const { rows, files } = loadBanks();
  const issues: Issue[] = [];

  const structure = dimStructure(rows, issues);
  const knowledge = dimKnowledge(rows, issues);
  const content = dimContent(rows, issues);
  const diagnosis = dimDiagnosis(rows, issues);
  const coverage = dimCoverage(rows, issues);
  const wiring = dimWiring(files, issues);

  const W = { structure: 0.25, knowledge: 0.3, content: 0.15, diagnosis: 0.2, coverage: 0.1 };
  const overall = Math.round(
    structure.score * W.structure + knowledge.score * W.knowledge + content.score * W.content +
    diagnosis.score * W.diagnosis + coverage.score * W.coverage,
  );

  const grade = (s: number) => (s >= 80 ? "🟢" : s >= 60 ? "🟡" : "🔴");
  const report = {
    scannedAt: new Date().toISOString(),
    totalQuestions: rows.length,
    scores: {
      overall,
      overallGrade: grade(overall),
      dimensions: {
        structure: { score: structure.score, grade: grade(structure.score), summary: structure.summary },
        knowledge: { score: knowledge.score, grade: grade(knowledge.score), summary: knowledge.summary },
        content: { score: content.score, grade: grade(content.score), summary: content.summary },
        diagnosis: { score: diagnosis.score, grade: grade(diagnosis.score), summary: diagnosis.summary },
        coverage: { score: coverage.score, grade: grade(coverage.score), summary: coverage.summary },
        wiring: { score: wiring.score, grade: grade(wiring.score), summary: wiring.summary },
      },
    },
    byType: structure.byType,
    knowledge: knowledge.detail,
    content: content.detail,
    diagnosis: diagnosis.detail,
    coverage: coverage.detail,
    wiring: wiring.detail,
    issues,
  };

  writeFileSync(join(ROOT, "audit-report.json"), JSON.stringify(report, null, 2));

  // ── 終端儀表板 ──
  const bar = (s: number, w = 20) => "█".repeat(Math.round((s / 100) * w)) + "░".repeat(w - Math.round((s / 100) * w));
  console.log(`\n${"═".repeat(66)}`);
  console.log(`  📊 題庫審計 v2  總題數：${rows.length}`);
  console.log(`${"═".repeat(66)}\n`);
  console.log(`  🎯 總分 ${overall}/100 ${grade(overall)}  ${bar(overall, 30)}\n`);
  for (const [k, v] of Object.entries(report.scores.dimensions)) {
    console.log(`  ${k.padEnd(10)} ${String(v.score).padStart(3)}/100 ${v.grade}  ${bar(v.score)}`);
    console.log(`             ${v.summary}`);
  }
  console.log(`\n  📚 題型分佈`);
  for (const [t, c] of Object.entries(structure.byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(16)} ${String(c).padStart(5)}`);
  }
  console.log(`\n  🧠 知識點`);
  console.log(`  唯一 ${knowledge.detail.totalUnique}｜單例 ${knowledge.detail.singletonCount}｜疑似同義 ${knowledge.detail.sameVariants.length}｜平均每題 ${knowledge.detail.avgTagsPerQuestion} 標籤`);
  if (knowledge.detail.singletons.length > 0) {
    console.log(`  單例標籤（前 10）：${knowledge.detail.singletons.slice(0, 10).join("、")}`);
  }
  if (knowledge.detail.sameVariants.length > 0) {
    console.log(`  疑似同義（前 8）：`);
    for (const v of knowledge.detail.sameVariants.slice(0, 8)) console.log(`    • 「${v.a}」↔「${v.b}」（${v.reason}）`);
  }
  console.log(`\n  ✍️  內容：正解位置 ${JSON.stringify(content.detail.answerPositionDistribution)}｜偏差 ${(content.detail.answerPositionMaxDeviation * 100).toFixed(0)}%｜重複 ${content.detail.duplicateGroups.length} 組｜解析覆蓋 ${(content.detail.explanationCoverage * 100).toFixed(0)}%`);
  console.log(`  🩺 診斷：可診斷 ${diagnosis.detail.diagnosticCount} 題｜樣本充足 ${diagnosis.detail.sampleAdequacy.sufficient}｜不足 ${diagnosis.detail.sampleAdequacy.insufficient}`);
  console.log(`  🔌 接線：${wiring.summary}`);
  const bySev = { critical: 0, error: 0, warning: 0, info: 0 } as Record<string, number>;
  for (const i of issues) bySev[i.severity]++;
  console.log(`\n  🚨 問題：critical ${bySev.critical}｜error ${bySev.error}｜warning ${bySev.warning}`);
  console.log(`\n  報告：audit-report.json｜耗時 ${Date.now() - t0}ms\n${"═".repeat(66)}\n`);
}

main();
