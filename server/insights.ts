/**
 * 試卷逐題明細彙總——督學台總覽（跨期間）與逐次試卷報表共用同一套算法。
 *
 * 為什麼要獨立成模組：這是「老師看到什麼」的核心判斷邏輯
 * （哪裡不會、為什麼錯、想多久），必須能單獨測，不能埋在路由裡。
 */

export type ExamTopicRow = {
  subject?: string;
  topic?: string;
  correct?: boolean;
  errorType?: string | null;
  responseMs?: number | null;
};

export type ErrorKind = "concept" | "careless" | "memory";

export const ERROR_KINDS: readonly ErrorKind[] = ["concept", "careless", "memory"];

/** 答錯且作答時間低於此毫秒數：研判沒想清楚就選了（可能是猜的）。 */
export const RUSHED_WRONG_MS = 5_000;
/** 答對但作答時間超過此毫秒數：研判想很久才想通，概念還不熟。 */
export const SLOW_CORRECT_MS = 20_000;

export type SpeedSummary = {
  /** 有速度資料的題數（舊紀錄沒有 responseMs，會是 0） */
  sampleCount: number;
  averageMs: number;
  correctAverageMs: number;
  wrongAverageMs: number;
  /** 答錯且 ≤ RUSHED_WRONG_MS 的題數 */
  rushedWrongCount: number;
  /** 答對但 ≥ SLOW_CORRECT_MS 的題數 */
  slowCorrectCount: number;
};

export type TopicSummary = {
  weakTopics: Array<{ subject: string; topic: string; total: number; wrong: number }>;
  errorPatterns: Array<{ type: ErrorKind; count: number }>;
  errorTaggedWrong: number;
  speed: SpeedSummary;
};

/**
 * AI 學伴主動委派任務的「學生掌握度」摘要。
 *
 * - subjectCorrectRate: 各學科正確率（小數 0–1）
 * - integratedCorrectRate: 「綜合課綱」正確率（小數 0–1；沒有就 null）
 * - weakTopics: 最多 3 個最薄弱知識點
 *
 * 為什麼是純函式：路由決策（派單科 / 派綜合題）只需要這張摘要，
 * 路由層不需要知道 detail 結構；測試也只需要餵 exam_records 列表。
 */
export type StudentMastery = {
  /** 各學科 → 答對 / 答錯題數 */
  bySubject: Record<string, { correct: number; wrong: number }>;
  /** 各學科正確率（小數 0–1；樣本為 0 時是 0）。 */
  subjectCorrectRate: Record<string, number>;
  /** 「綜合課綱」正確率（沒樣本時是 null）。 */
  integratedCorrectRate: number | null;
  /** 總題數（樣本太少的學生會被視為「資料不足」）。 */
  totalQuestions: number;
  /** 最薄弱 3 個知識點（綜合正確率計算時不計入）。 */
  weakTopics: Array<{ subject: string; topic: string; correctRate: number }>;
};

/** 主動委派的路由決策結果。 */
export type TaskRoute = {
  taskType: "single" | "integrated";
  /** single 模式推薦的學科；integrated 模式 null。 */
  subject: string | null;
  /** 決策依據（給前端顯示用）。 */
  reason: string;
};

const INTEGRATED_SUBJECT_KEYS = ["綜合課綱", "綜合", "integrated"] as const;
const WEAK_TOPIC_MIN_SAMPLES = 2;
const ROUTE_INTEGRATED_MIN_RATE = 0.7;
const ROUTE_SINGLE_MIN_RATE = 0.6;

/** 判斷 subject 是否屬於「綜合課綱」類。 */
export function isIntegratedSubject(subject: string): boolean {
  const norm = subject.trim().toLowerCase();
  return INTEGRATED_SUBJECT_KEYS.some((k) => norm === k.toLowerCase());
}

/**
 * 從考試記錄列表（已包含 detail）算出學生當前掌握度。
 *
 * examRecords: 至少要有 subject、totalQuestions、correctCount 與 detail。
 * （呼叫端從 listExamRecords 拉，再 map 出這幾欄。）
 */
export function computeStudentMastery(
  examRecords: Array<{
    subject: string;
    totalQuestions: number;
    correctCount: number;
    detail?: unknown;
  }>,
): StudentMastery {
  const bySubject: Record<string, { correct: number; wrong: number }> = {};
  const bySubjectTopic: Record<string, Record<string, { correct: number; total: number }>> = {};

  for (const record of examRecords) {
    const subject = record.subject;
    if (!bySubject[subject]) bySubject[subject] = { correct: 0, wrong: 0 };
    bySubject[subject].correct += record.correctCount;
    bySubject[subject].wrong += record.totalQuestions - record.correctCount;

    // 逐題明細用於找「最薄弱知識點」
    const topics = readExamTopicRows(record.detail);
    if (!bySubjectTopic[subject]) bySubjectTopic[subject] = {};
    const topicMap = bySubjectTopic[subject];
    for (const row of topics) {
      const topic = (row.topic ?? "").trim();
      if (!topic) continue;
      if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
      topicMap[topic].total += 1;
      if (row.correct) topicMap[topic].correct += 1;
    }
  }

  // 各學科正確率
  const subjectCorrectRate: Record<string, number> = {};
  for (const [subject, agg] of Object.entries(bySubject)) {
    const total = agg.correct + agg.wrong;
    subjectCorrectRate[subject] = total === 0 ? 0 : agg.correct / total;
  }

  // 綜合課綱正確率
  const integrated = bySubject["綜合課綱"] ?? bySubject["綜合"] ?? null;
  const integratedTotal = integrated ? integrated.correct + integrated.wrong : 0;
  const integratedCorrectRate = integratedTotal === 0
    ? null
    : integrated.correct / integratedTotal;

  // 最薄弱 3 個知識點（樣本 ≥ WEAK_TOPIC_MIN_SAMPLES）
  const allTopics: Array<{ subject: string; topic: string; correctRate: number }> = [];
  for (const [subject, topicMap] of Object.entries(bySubjectTopic)) {
    if (isIntegratedSubject(subject)) continue; // 綜合題不進單薄排名
    for (const [topic, agg] of Object.entries(topicMap)) {
      if (agg.total < WEAK_TOPIC_MIN_SAMPLES) continue;
      allTopics.push({ subject, topic, correctRate: agg.correct / agg.total });
    }
  }
  allTopics.sort((a, b) => a.correctRate - b.correctRate);
  const weakTopics = allTopics.slice(0, 3);

  const totalQuestions = Object.values(bySubject).reduce(
    (sum, agg) => sum + agg.correct + agg.wrong,
    0,
  );

  return {
    bySubject,
    subjectCorrectRate,
    integratedCorrectRate,
    totalQuestions,
    weakTopics,
  };
}

/**
 * 根據學生掌握度決定「主動委派」要派哪種任務卡。
 *
 * 規則（與用戶對齊的版本）：
 * - 樣本 < 20 題：資料不足，不派綜合題，先派單科最薄弱點。
 * - 綜合課綱正確率 ≥ 70% 且各單科都 ≥ 60%：派「綜合」題（培養跨學科）。
 * - 否則：派「單科」題（用 weakTopics 第一個）。
 */
export function routeTaskType(mastery: StudentMastery): TaskRoute {
  if (mastery.totalQuestions < 20) {
    const firstWeak = mastery.weakTopics[0];
    return {
      taskType: "single",
      subject: firstWeak?.subject ?? null,
      reason: `資料不足（${mastery.totalQuestions} 題），先鞏固單科${firstWeak ? "：${firstWeak.topic}" : ""}`.replace("${firstWeak.topic}", firstWeak ? `：${firstWeak.topic}` : ""),
    };
  }

  const integratedRate = mastery.integratedCorrectRate;
  const subjectEntries = Object.entries(mastery.subjectCorrectRate)
    .filter(([subject]) => !isIntegratedSubject(subject));

  if (
    integratedRate !== null &&
    integratedRate >= ROUTE_INTEGRATED_MIN_RATE &&
    subjectEntries.length > 0 &&
    subjectEntries.every(([, rate]) => rate >= ROUTE_SINGLE_MIN_RATE)
  ) {
    return {
      taskType: "integrated",
      subject: null,
      reason: `綜合課綱正確率 ${Math.round(integratedRate * 100)}% ≥ 70% 且各單科都 ≥ 60%，可挑戰跨學科題`,
    };
  }

  const firstWeak = mastery.weakTopics[0];
  return {
    taskType: "single",
    subject: firstWeak?.subject ?? null,
    reason: firstWeak
      ? `${firstWeak.subject}：${firstWeak.topic} 正確率 ${Math.round(firstWeak.correctRate * 100)}%，先鞏固這裡`
      : "尚未發現明顯薄弱點，先派綜合題暖身",
  };
}

export function averageMs(list: number[]): number {
  if (list.length === 0) return 0;
  return Math.round(list.reduce((sum, value) => sum + value, 0) / list.length);
}

/** 讀出 exam_records.detail 裡的逐題明細（格式不對時回空陣列，不要拋錯）。 */
export function readExamTopicRows(detail: unknown): ExamTopicRow[] {
  const parsed = detail as { topics?: ExamTopicRow[] } | null;
  return Array.isArray(parsed?.topics) ? parsed.topics : [];
}

/**
 * 把逐題明細收斂成老師看得懂的三件事：
 * 1. 薄弱知識點（哪裡不會）
 * 2. 錯誤型態（為什麼不會——粗心／觀念／記憶）
 * 3. 作答速度（想多久——快速答錯 vs 慢速答對）
 */
export function summarizeExamTopics(rows: ExamTopicRow[], fallbackSubject: string): TopicSummary {
  const stats = new Map<string, { subject: string; topic: string; total: number; wrong: number }>();
  const errorCounts: Record<ErrorKind, number> = { concept: 0, careless: 0, memory: 0 };
  let errorTaggedWrong = 0;

  const allMs: number[] = [];
  const correctMs: number[] = [];
  const wrongMs: number[] = [];
  let rushedWrongCount = 0;
  let slowCorrectCount = 0;

  for (const item of rows) {
    if (!item?.topic) continue;
    const subject = item.subject ?? fallbackSubject;
    const key = `${subject}/${item.topic}`;
    const current = stats.get(key) ?? { subject, topic: item.topic, total: 0, wrong: 0 };
    current.total += 1;
    if (!item.correct) current.wrong += 1;
    stats.set(key, current);

    // 只採計學生真的自評過的錯誤原因；未自評不可計入，否則等於用假資料誤導老師。
    if (!item.correct) {
      const tagged = item.errorType;
      if (tagged === "concept" || tagged === "careless" || tagged === "memory") {
        errorCounts[tagged] += 1;
        errorTaggedWrong += 1;
      }
    }

    const ms = typeof item.responseMs === "number" && Number.isFinite(item.responseMs) && item.responseMs > 0
      ? item.responseMs
      : null;
    if (ms !== null) {
      allMs.push(ms);
      if (item.correct) {
        correctMs.push(ms);
        if (ms >= SLOW_CORRECT_MS) slowCorrectCount += 1;
      } else {
        wrongMs.push(ms);
        if (ms <= RUSHED_WRONG_MS) rushedWrongCount += 1;
      }
    }
  }

  return {
    // 錯誤率高的排前面；同率時錯得多的排前面。
    weakTopics: Array.from(stats.values())
      .filter((item) => item.wrong > 0)
      .sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong)
      .slice(0, 5),
    errorPatterns: ERROR_KINDS
      .map((type) => ({ type, count: errorCounts[type] }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count),
    errorTaggedWrong,
    speed: {
      sampleCount: allMs.length,
      averageMs: averageMs(allMs),
      correctAverageMs: averageMs(correctMs),
      wrongAverageMs: averageMs(wrongMs),
      rushedWrongCount,
      slowCorrectCount,
    },
  };
}
