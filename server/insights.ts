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
