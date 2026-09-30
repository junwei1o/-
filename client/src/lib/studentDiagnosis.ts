/**
 * 學生學習診斷系統（StudentDiagnosis）
 *
 * 依賴：questionBank 的 knowledge / difficulty / questionType 欄位
 * 維護：任何修改 QUESTION_TYPES 或 knowledge 標籤者，需同步檢查本檔
 *
 * ⚠️ 與既有資料的落差（實作前必讀）
 * 現有 `utils/storage.ts` 的 `LearningRecord` 只有
 * `{ questionId, subject, isCorrect, errorType?, timestamp, flagged }`，
 * **沒有** timeSpentMs / retryCount / changedAnswer / skipped / knowledge / difficulty / questionType。
 * 因此：
 *  1. 用 `answerRecordsFromLearningRecords()` 把舊紀錄 join 題庫後轉成 `AnswerRecord`
 *  2. 缺漏的「互動訊號」（用時／重做／改答）以 **unknown** 表示（0 / false），
 *     且 `normalizeTimeFactor` 對 unknown 回傳中性值 1——**不可**當成「答太快」，
 *     否則舊資料的信心分數會被系統性壓低。
 *  3. 要讓診斷真正精準，需在作答流程補記這些訊號（見 docs/question-types.md §8 建議順序）。
 */

import type { LearningRecord } from "@/utils/storage";
import { isAutoGradable } from "@/lib/subjectConfig";

// ─────────────────────────────────────────────
// 1. 型別定義
// ─────────────────────────────────────────────

/** 單次作答記錄（最小單位） */
export interface AnswerRecord {
  /** 題目 id */
  questionId: string;
  /** 該題涵蓋的知識點（來自 questionBank） */
  knowledge: string[];
  /** 該題主要考察的知識點（若題庫有標註） */
  primaryKnowledge?: string;
  /** 科目（與題庫一致：數學／自然／社會／國語／英語） */
  subject: string;
  /** 課綱領域 */
  curriculumDomain: string;
  /** 學習主題 */
  learningTopic: string;
  /** 難度 */
  difficulty: "基礎" | "標準" | "挑戰";
  /** 題型 id（對應 QUESTION_TYPES） */
  questionType: string;
  /** 是否答對 */
  correct: boolean;
  /** 作答用時（毫秒）；**0 表示未知**（舊資料或未記錄） */
  timeSpentMs: number;
  /** 重做次數（同一題在本次 session 內重做） */
  retryCount: number;
  /** 是否修改過答案 */
  changedAnswer: boolean;
  /** 是否跳過未作答 */
  skipped: boolean;
  /** 作答時間戳 */
  timestamp: number;
  /** 同一次做題的 session id */
  sessionId: string;
}

/** 知識點統計 */
export interface KnowledgeStat {
  knowledge: string;
  totalAttempts: number;
  correctAttempts: number;
  /** 原始正確率（0–1） */
  accuracy: number;
  /** 信心分數（0–1），已修正猜測與不確定 */
  confidence: number;
  status: "mastered" | "stable" | "unstable" | "blindspot" | "needs-review";
  trend: "improving" | "stable" | "declining" | "insufficient-data";
  lastAttemptAt: number;
  /** 最近 5 次作答的對錯序列（1＝對、0＝錯），供趨勢圖使用 */
  recentAccuracy: number[];
}

/** 課綱領域統計 */
export interface DomainStat {
  domain: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  confidence: number;
  knowledgeCount: number;
  /** 該領域下信心 < 0.5 的知識點 */
  weakKnowledge: string[];
}

/** 難度層級統計 */
export interface DifficultyStat {
  difficulty: "基礎" | "標準" | "挑戰";
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
}

/** 題型統計 */
export interface QuestionTypeStat {
  questionType: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
}

/** 完整診斷結果 */
export interface StudentDiagnosis {
  captainName: string;
  generatedAt: number;
  totalAnswers: number;
  overallAccuracy: number;
  overallConfidence: number;
  knowledgeStats: Record<string, KnowledgeStat>;
  domainStats: Record<string, DomainStat>;
  difficultyStats: Record<string, DifficultyStat>;
  questionTypeStats: Record<string, QuestionTypeStat>;
  insights: DiagnosisInsight[];
  /** 資料版本（用於未來 schema 遷移） */
  version: number;
}

/** 單條診斷洞察 */
export interface DiagnosisInsight {
  kind: "blindspot" | "unstable" | "difficulty-gap" | "type-gap" | "improving" | "mastered";
  severity: "high" | "medium" | "low" | "positive";
  title: string;
  description: string;
  related: string[];
  action?: string;
}

/** 診斷結果版本。schema 變更時遞增並在 deserializeDiagnosis 補遷移。 */
export const DIAGNOSIS_VERSION = 1;

// ─────────────────────────────────────────────
// 2. 核心計算
// ─────────────────────────────────────────────

/**
 * 計算單一知識點的信心分數
 *
 * 設計理念：
 * - 單純正確率無法區分「真懂」與「猜對」（選擇題猜對率 25%）
 * - 用「用時 + 重做 + 修改」三維修正
 * - 樣本量不足時向 0.5 回歸（避免小樣本極端值）
 */
export function calculateConfidence(records: AnswerRecord[]): number {
  const valid = records.filter((r) => !r.skipped);
  if (valid.length === 0) return 0;

  // 1. 基礎正確率
  const accuracy = valid.filter((r) => r.correct).length / valid.length;

  // 2. 用時修正（未知用時→中性 1，不得視為「太快」）
  const timed = valid.filter((r) => r.timeSpentMs > 0);
  const timeFactor =
    timed.length === 0 ? 1 : normalizeTimeFactor(mean(timed.map((r) => r.timeSpentMs)));

  // 3. 重做修正：重做次數越多表示越不確定
  const retryFactor = 1 / (1 + mean(valid.map((r) => r.retryCount)) * 0.5);

  // 4. 修改修正：修改過答案表示猶豫，輕微降低信心
  const changeRate = valid.filter((r) => r.changedAnswer).length / valid.length;
  const changeFactor = 1 - changeRate * 0.3;

  // 5. 加權組合（用時／重做／修改只修正正確率，不獨立加分）
  const raw =
    accuracy * 0.5 +
    accuracy * timeFactor * 0.2 +
    accuracy * retryFactor * 0.15 +
    accuracy * changeFactor * 0.15;

  // 6. 樣本量回歸：< 10 筆向 0.5 收斂
  const sampleFactor = Math.min(valid.length / 10, 1);
  const confidence = raw * sampleFactor + 0.5 * (1 - sampleFactor);

  return clamp(confidence, 0, 1);
}

/** 用時修正係數：3 秒以下過快、60 秒以上過慢，中間為 1 */
function normalizeTimeFactor(avgTimeMs: number): number {
  const fast = 3000;
  const slow = 60000;
  const ideal = 15000; // 理想用時 15 秒

  if (avgTimeMs <= 0) return 1; // 未知用時：中性（見檔頭說明）
  if (avgTimeMs < fast) return 0.6; // 過快，可能是猜
  if (avgTimeMs > slow) return 0.8; // 過慢，可能不熟
  if (avgTimeMs < ideal) return 0.6 + (0.4 * (avgTimeMs - fast)) / (ideal - fast);
  return 1 - (0.2 * (avgTimeMs - ideal)) / (slow - ideal);
}

/** 判斷知識點狀態（attempts < 3 為防禦性分支：buildDiagnosis 已用 minSample 過濾） */
function classifyStatus(confidence: number, attempts: number): KnowledgeStat["status"] {
  if (attempts < 3) return "needs-review";
  if (confidence >= 0.75) return "mastered";
  if (confidence >= 0.55) return "stable";
  if (confidence >= 0.35) return "unstable";
  return "blindspot";
}

/** 判斷趨勢：把紀錄按時間切成前後兩半，比較正確率（樣本少時比線性回歸穩定） */
function detectTrend(records: AnswerRecord[]): KnowledgeStat["trend"] {
  if (records.length < 4) return "insufficient-data";

  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  const half = Math.floor(sorted.length / 2);
  const earlier = sorted.slice(0, half);
  const later = sorted.slice(half);

  const earlierAcc = earlier.filter((r) => r.correct).length / earlier.length;
  const laterAcc = later.filter((r) => r.correct).length / later.length;
  const diff = laterAcc - earlierAcc;

  if (diff > 0.15) return "improving";
  if (diff < -0.15) return "declining";
  return "stable";
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function roundTo(v: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(v * f) / f;
}

// ─────────────────────────────────────────────
// 3. 診斷產生
// ─────────────────────────────────────────────

/** 從作答記錄產生完整診斷 */
export function buildDiagnosis(
  captainName: string,
  records: AnswerRecord[],
  options: { minSampleSize?: number; subject?: string } = {},
): StudentDiagnosis {
  const minSample = options.minSampleSize ?? 3;

  // 指定科目時：只取該科紀錄，並排除該科「不可自動評分」的題型
  // （題型→可自動評分與否由 subjectConfig 決定，與 docs/question-types.md §3 矩陣一致）
  const scoped = options.subject
    ? records.filter(
        (r) => r.subject === options.subject && isAutoGradable(options.subject as string, r.questionType),
      )
    : records;

  // 1. 知識點統計
  const byKnowledge = groupBy(scoped, (r) => r.knowledge);
  const knowledgeStats: Record<string, KnowledgeStat> = {};

  for (const [knowledge, recs] of Object.entries(byKnowledge)) {
    const valid = recs.filter((r) => !r.skipped);
    if (valid.length < minSample) continue;

    const confidence = calculateConfidence(valid);
    const correctCount = valid.filter((r) => r.correct).length;

    knowledgeStats[knowledge] = {
      knowledge,
      totalAttempts: valid.length,
      correctAttempts: correctCount,
      accuracy: roundTo(correctCount / valid.length, 3),
      confidence: roundTo(confidence, 3),
      status: classifyStatus(confidence, valid.length),
      trend: detectTrend(valid),
      lastAttemptAt: Math.max(...valid.map((r) => r.timestamp)),
      recentAccuracy: getRecentAccuracy(valid, 5),
    };
  }

  // 2. 課綱領域統計
  const byDomain = groupBy(scoped, (r) => r.curriculumDomain);
  const domainStats: Record<string, DomainStat> = {};

  for (const [domain, recs] of Object.entries(byDomain)) {
    const valid = recs.filter((r) => !r.skipped);
    if (valid.length === 0) continue;

    const correctCount = valid.filter((r) => r.correct).length;
    const domainKnowledge = new Set(valid.flatMap((r) => r.knowledge));
    const weakKnowledge = Array.from(domainKnowledge).filter((k) => {
      const stat = knowledgeStats[k];
      return stat && stat.confidence < 0.5;
    });

    domainStats[domain] = {
      domain,
      totalAttempts: valid.length,
      correctAttempts: correctCount,
      accuracy: roundTo(correctCount / valid.length, 3),
      confidence: roundTo(calculateConfidence(valid), 3),
      knowledgeCount: domainKnowledge.size,
      weakKnowledge,
    };
  }

  // 3. 難度統計
  const byDifficulty = groupBy(scoped, (r) => r.difficulty);
  const difficultyStats: Record<string, DifficultyStat> = {};
  for (const [difficulty, recs] of Object.entries(byDifficulty)) {
    const valid = recs.filter((r) => !r.skipped);
    if (valid.length === 0) continue;
    const correctCount = valid.filter((r) => r.correct).length;
    difficultyStats[difficulty] = {
      difficulty: difficulty as DifficultyStat["difficulty"],
      totalAttempts: valid.length,
      correctAttempts: correctCount,
      accuracy: roundTo(correctCount / valid.length, 3),
    };
  }

  // 4. 題型統計
  const byType = groupBy(scoped, (r) => r.questionType);
  const questionTypeStats: Record<string, QuestionTypeStat> = {};
  for (const [type, recs] of Object.entries(byType)) {
    const valid = recs.filter((r) => !r.skipped);
    if (valid.length === 0) continue;
    const correctCount = valid.filter((r) => r.correct).length;
    questionTypeStats[type] = {
      questionType: type,
      totalAttempts: valid.length,
      correctAttempts: correctCount,
      accuracy: roundTo(correctCount / valid.length, 3),
    };
  }

  // 5. 整體指標
  const validAll = scoped.filter((r) => !r.skipped);
  const overallAccuracy =
    validAll.length > 0
      ? roundTo(validAll.filter((r) => r.correct).length / validAll.length, 3)
      : 0;

  // 6. 產生洞察
  const insights = generateInsights({
    knowledgeStats,
    domainStats,
    difficultyStats,
    questionTypeStats,
  });

  return {
    captainName,
    generatedAt: Date.now(),
    totalAnswers: validAll.length,
    overallAccuracy,
    overallConfidence: roundTo(calculateConfidence(validAll), 3),
    knowledgeStats,
    domainStats,
    difficultyStats,
    questionTypeStats,
    insights,
    version: DIAGNOSIS_VERSION,
  };
}

/** 取最近 n 次的對錯序列 */
function getRecentAccuracy(records: AnswerRecord[], n: number): number[] {
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  return sorted.slice(-n).map((r) => (r.correct ? 1 : 0));
}

/** 按 key 分組（keyFn 可回傳多個 key，例如一題多個知識點） */
function groupBy<T>(arr: T[], keyFn: (item: T) => string | string[]): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const keys = keyFn(item);
    for (const k of Array.isArray(keys) ? keys : [keys]) {
      (result[k] ??= []).push(item);
    }
  }
  return result;
}

/** 產生診斷洞察（依嚴重程度排序） */
export function generateInsights(ctx: {
  knowledgeStats: Record<string, KnowledgeStat>;
  domainStats: Record<string, DomainStat>;
  difficultyStats: Record<string, DifficultyStat>;
  questionTypeStats: Record<string, QuestionTypeStat>;
}): DiagnosisInsight[] {
  const insights: DiagnosisInsight[] = [];

  const blindspots = Object.values(ctx.knowledgeStats)
    .filter((s) => s.status === "blindspot")
    .sort((a, b) => a.confidence - b.confidence);
  if (blindspots.length > 0) {
    insights.push({
      kind: "blindspot",
      severity: "high",
      title: `發現 ${blindspots.length} 個知識盲點`,
      description: `這些知識點信心分數偏低：${blindspots.slice(0, 3).map((s) => s.knowledge).join("、")}${blindspots.length > 3 ? " 等" : ""}`,
      related: blindspots.map((s) => s.knowledge),
      action: "建議優先複習這些知識點，並重做相關題目",
    });
  }

  const unstable = Object.values(ctx.knowledgeStats)
    .filter((s) => s.status === "unstable")
    .sort((a, b) => a.confidence - b.confidence);
  if (unstable.length > 0) {
    insights.push({
      kind: "unstable",
      severity: "medium",
      title: `有 ${unstable.length} 個知識點表現不穩定`,
      description: `正確率忽高忽低，可能是尚未真正理解：${unstable.slice(0, 3).map((s) => s.knowledge).join("、")}`,
      related: unstable.map((s) => s.knowledge),
      action: "建議多做同知識點的變體題，確認是否真的理解",
    });
  }

  const d = ctx.difficultyStats;
  if (d["基礎"] && d["標準"]) {
    const gap = d["基礎"].accuracy - d["標準"].accuracy;
    if (gap > 0.25) {
      insights.push({
        kind: "difficulty-gap",
        severity: "medium",
        title: "基礎與標準題之間有明顯落差",
        description: `基礎題正確率 ${(d["基礎"].accuracy * 100).toFixed(0)}%，標準題僅 ${(d["標準"].accuracy * 100).toFixed(0)}%，落差 ${(gap * 100).toFixed(0)}%`,
        related: ["基礎", "標準"],
        action: "基本功可能不扎實，建議回頭鞏固基礎題對應的知識點",
      });
    }
  }

  const typeAccuracies = Object.values(ctx.questionTypeStats);
  if (typeAccuracies.length >= 2) {
    const max = typeAccuracies.reduce((a, b) => (a.accuracy > b.accuracy ? a : b));
    const min = typeAccuracies.reduce((a, b) => (a.accuracy < b.accuracy ? a : b));
    if (max.accuracy - min.accuracy > 0.3) {
      insights.push({
        kind: "type-gap",
        severity: "medium",
        title: "不同題型表現差異大",
        description: `${max.questionType} 正確率 ${(max.accuracy * 100).toFixed(0)}%，但 ${min.questionType} 僅 ${(min.accuracy * 100).toFixed(0)}%`,
        related: [max.questionType, min.questionType],
        action: `建議多練習 ${min.questionType}，加強對應能力`,
      });
    }
  }

  const improving = Object.values(ctx.knowledgeStats).filter((s) => s.trend === "improving");
  if (improving.length > 0) {
    insights.push({
      kind: "improving",
      severity: "positive",
      title: `${improving.length} 個知識點正在進步`,
      description: `近期表現明顯提升：${improving.slice(0, 3).map((s) => s.knowledge).join("、")}`,
      related: improving.map((s) => s.knowledge),
      action: "繼續保持！",
    });
  }

  const mastered = Object.values(ctx.knowledgeStats).filter((s) => s.status === "mastered");
  if (mastered.length > 0) {
    insights.push({
      kind: "mastered",
      severity: "positive",
      title: `已掌握 ${mastered.length} 個知識點`,
      description: `表現穩定且信心分數高：${mastered.slice(0, 5).map((s) => s.knowledge).join("、")}${mastered.length > 5 ? " 等" : ""}`,
      related: mastered.map((s) => s.knowledge),
    });
  }

  const severityOrder: Record<DiagnosisInsight["severity"], number> = {
    high: 0,
    medium: 1,
    low: 2,
    positive: 3,
  };
  return insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

// ─────────────────────────────────────────────
// 4. 與既有資料的橋接
// ─────────────────────────────────────────────

/** 題庫的題目中介資料（用結構型別，避免把整個題庫拉進 bundle） */
export type QuestionMeta = {
  knowledge?: string[];
  difficulty?: "基礎" | "標準" | "挑戰";
  questionType?: string;
  curriculumDomain?: string;
  learningTopic?: string;
};

/**
 * 把既有的 `LearningRecord` 轉成 `AnswerRecord`（join 題庫補齊知識點／難度／題型）。
 *
 * 缺漏的互動訊號以 unknown 表示：timeSpentMs=0、retryCount=0、changedAnswer=false、skipped=false。
 * `sessionId` 由呼叫端提供（現有紀錄沒有 session 概念）。
 */
export function answerRecordsFromLearningRecords(
  records: readonly LearningRecord[],
  meta: ReadonlyMap<string, QuestionMeta>,
  sessionId = "legacy",
): AnswerRecord[] {
  return records.map((r) => {
    const m = meta.get(r.questionId);
    return {
      questionId: r.questionId,
      knowledge: m?.knowledge ?? [],
      subject: r.subject,
      curriculumDomain: m?.curriculumDomain ?? r.subject,
      learningTopic: m?.learningTopic ?? "未分類",
      difficulty: m?.difficulty ?? "標準",
      questionType: m?.questionType ?? "single-choice",
      correct: r.isCorrect,
      timeSpentMs: 0, // unknown：舊資料未記錄
      retryCount: 0,
      changedAnswer: false,
      skipped: false,
      timestamp: r.timestamp,
      sessionId,
    };
  });
}

// ─────────────────────────────────────────────
// 5. 儲存與同步（介面；實作待接後端）
// ─────────────────────────────────────────────

export interface DiagnosisStorage {
  loadRecords(captainName: string): Promise<AnswerRecord[]>;
  appendRecord(captainName: string, record: AnswerRecord): Promise<void>;
  loadDiagnosis?(captainName: string): Promise<StudentDiagnosis | null>;
  saveDiagnosis?(captainName: string, diagnosis: StudentDiagnosis): Promise<void>;
}

/** 取得（或重算）某船長的診斷；快取有效期預設 5 分鐘 */
export async function getDiagnosis(
  captainName: string,
  storage: DiagnosisStorage,
  options: { maxCacheAgeMs?: number } = {},
): Promise<StudentDiagnosis> {
  const maxAge = options.maxCacheAgeMs ?? 5 * 60 * 1000;

  if (storage.loadDiagnosis) {
    const cached = await storage.loadDiagnosis(captainName);
    if (cached && Date.now() - cached.generatedAt < maxAge) return cached;
  }

  const records = await storage.loadRecords(captainName);
  const diagnosis = buildDiagnosis(captainName, records);
  if (storage.saveDiagnosis) await storage.saveDiagnosis(captainName, diagnosis);
  return diagnosis;
}

/** 記錄一筆作答（每次作答都重算成本高，建議攢一批再算） */
export async function recordAnswer(
  captainName: string,
  record: AnswerRecord,
  storage: DiagnosisStorage,
): Promise<void> {
  await storage.appendRecord(captainName, record);
}

/** 序列化為可儲存的 JSON */
export function serializeDiagnosis(d: StudentDiagnosis): string {
  return JSON.stringify(d);
}

/** 從 JSON 還原，並做版本遷移 */
export function deserializeDiagnosis(json: string): StudentDiagnosis | null {
  try {
    const parsed = JSON.parse(json) as { version?: unknown };
    if (typeof parsed.version !== "number") return null;
    // 未來版本升級時在此加遷移邏輯
    if (parsed.version > DIAGNOSIS_VERSION) return null;
    return parsed as StudentDiagnosis;
  } catch {
    return null;
  }
}
