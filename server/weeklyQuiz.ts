/**
 * AI 自動週測：每週五（台北時間）自動為學生出 10 題本週回顧。
 *
 * 為什麼是純函式模組：出題規則（哪個知識點該多出、出幾題）與計分／獎勵
 * 必須能單獨測，不能埋在路由裡。
 *
 * 出題邏輯（與使用者對齊的規則）：
 * 1. 從「本週作答紀錄」的逐題明細聚合薄弱知識點（錯誤率降冪、錯得多優先）。
 * 2. 依薄弱知識點抽題庫題：同知識點優先、同年級優先，每個知識點最多 2 題。
 * 3. 不足則補「本週有練習的科目」；再不足補同年級各科平衡題；最後補全庫。
 * 4. 卷子生成後固定（存 DB），刷新不變。
 */

export type WeeklyQuizQuestion = {
  id: string;
  subject: string;
  grade: number;
  difficulty: "基礎" | "標準" | "挑戰";
  learningTopic: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type WeeklyQuizBankRow = {
  id: string;
  subject: string;
  grade: number;
  difficulty: string;
  learningTopic: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

const TAIPEI_OFFSET_MS = 8 * 3_600_000;
const DAY_MS = 86_400_000;
/** 題庫學科輪替順序（補題時保持混合，避免整份卷同一科）。 */
const SUBJECT_ROTATION = ["國語", "數學", "自然", "社會"] as const;

/** 台北時間的日期組成（一律以 UTC getter 讀取加了 +8h 的時間）。 */
function taipeiParts(now: number) {
  const shifted = new Date(now + TAIPEI_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    date: shifted.getUTCDate(),
    day: shifted.getUTCDay(), // 0=Sun
  };
}

/** 台北時間該週週一 00:00 的 UTC 毫秒。 */
export function mondayOfWeek(now: number): number {
  const p = taipeiParts(now);
  const daysSinceMonday = (p.day + 6) % 7;
  return Date.UTC(p.year, p.month, p.date - daysSinceMonday) - TAIPEI_OFFSET_MS;
}

/** ISO 週 key（台北時間），例 "2026-W37"。 */
export function weekKeyFor(now: number): string {
  const monday = mondayOfWeek(now);
  const thursday = monday + 3 * DAY_MS;
  const year = taipeiParts(thursday).year;
  // ISO 週 1 = 包含 1 月 4 日的週；以該週週一為起點計算週數。
  const jan4 = Date.UTC(year, 0, 4) - TAIPEI_OFFSET_MS;
  const jan4Day = taipeiParts(jan4).day;
  const week1Monday = jan4 - ((jan4Day + 6) % 7) * DAY_MS;
  const week = Math.floor((monday - week1Monday) / (7 * DAY_MS)) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export type WeeklyQuizWindow = {
  weekKey: string;
  /** 週五 00:00（台北）的 UTC 毫秒。 */
  opensAt: number;
  /** 下週一 00:00（台北）的 UTC 毫秒，視窗結束。 */
  closesAt: number;
};

export function getWeeklyQuizWindow(now: number): WeeklyQuizWindow {
  const monday = mondayOfWeek(now);
  return {
    weekKey: weekKeyFor(now),
    opensAt: monday + 4 * DAY_MS,
    closesAt: monday + 7 * DAY_MS,
  };
}

export type WeeklyQuizStatus = "open" | "notOpen";

/** 週五 00:00（台北）～ 週日 23:59 視窗內才可作答。 */
export function getWeeklyQuizStatus(now: number): WeeklyQuizStatus {
  const window = getWeeklyQuizWindow(now);
  return now >= window.opensAt && now < window.closesAt ? "open" : "notOpen";
}

type TopicRow = { subject?: string; topic?: string; correct?: boolean };

/** 讀出 exam_records.detail 裡的逐題明細（格式不對時回空陣列，不要拋錯）。 */
export function readWeeklyTopicRows(detail: unknown): TopicRow[] {
  const parsed = detail as { topics?: unknown } | null;
  if (!parsed || !Array.isArray(parsed.topics)) return [];
  return (parsed.topics as TopicRow[]).filter(
    (row) => row && typeof row === "object" && typeof row.topic === "string",
  );
}

export type WeeklyQuizBuilderInput = {
  /** 本週作答紀錄（含 detail.topics）。 */
  records: Array<{ detail?: unknown }>;
  /** 題庫。 */
  bank: WeeklyQuizBankRow[];
  /** 學生年級（同知識點、同科目補題時優先同年級）。 */
  grade?: number;
  /** 出題數，預設 10。 */
  count?: number;
  /** 可注入亂數（測試用）。 */
  random?: () => number;
};

export type WeeklyTopicStat = { subject: string; topic: string; total: number; wrong: number };

/**
 * 從本週作答紀錄聚合薄弱知識點：只取有錯的知識點，
 * 依錯誤率降冪，同率錯得多優先，再同數答得多優先。
 */
export function collectWeakTopics(records: Array<{ detail?: unknown }>): WeeklyTopicStat[] {
  const stats = new Map<string, WeeklyTopicStat>();
  for (const record of records) {
    for (const row of readWeeklyTopicRows(record.detail)) {
      const topic = (row.topic ?? "").trim();
      if (!topic) continue;
      const subject = (row.subject ?? "").trim();
      const key = `${subject}|${topic}`;
      const current = stats.get(key) ?? { subject, topic, total: 0, wrong: 0 };
      current.total += 1;
      if (row.correct === false) current.wrong += 1;
      stats.set(key, current);
    }
  }
  return Array.from(stats.values())
    .filter((item) => item.wrong > 0)
    .sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong || b.total - a.total);
}

/** 依薄弱知識點組 10 題本週回顧卷。 */
export function buildWeeklyQuiz(input: WeeklyQuizBuilderInput): WeeklyQuizQuestion[] {
  const count = Math.max(1, Math.min(30, Math.floor(input.count ?? 10)));
  const random = input.random ?? Math.random;
  const grade = input.grade;
  const bank = input.bank;

  const weakTopics = collectWeakTopics(input.records);
  const studiedSubjects = new Set<string>();
  for (const record of input.records) {
    for (const row of readWeeklyTopicRows(record.detail)) {
      const subject = (row.subject ?? "").trim();
      if (subject) studiedSubjects.add(subject);
    }
  }

  const used = new Set<string>();
  const deck: WeeklyQuizQuestion[] = [];

  /** 從 pool 依序取題（跳過已用、最多取 max 題、不超過總數）。 */
  const take = (pool: WeeklyQuizBankRow[], max: number) => {
    const candidates = [...pool]
      .filter((question) => !used.has(question.id))
      .sort(() => random() - 0.5);
    for (const question of candidates) {
      if (deck.length >= count) break;
      deck.push({
        id: question.id,
        subject: question.subject,
        grade: question.grade,
        difficulty: question.difficulty as WeeklyQuizQuestion["difficulty"],
        learningTopic: question.learningTopic,
        prompt: question.prompt,
        options: question.options,
        answer: question.answer,
        explanation: question.explanation,
      });
      used.add(question.id);
      if (deck.length >= max) break;
    }
  };

  // 1) 薄弱知識點：同知識點同年級優先，其次同知識點其他年級，每個最多 2 題。
  const WEAK_PER_TOPIC = 2;
  for (const weak of weakTopics) {
    if (deck.length >= count) break;
    const inTopic = bank.filter((q) => q.subject === weak.subject && q.learningTopic === weak.topic);
    if (inTopic.length === 0) continue;
    take(inTopic.filter((q) => grade === undefined || q.grade === grade), WEAK_PER_TOPIC);
    take(inTopic, WEAK_PER_TOPIC);
  }

  // 2) 本週有練習的科目（同年級優先）。
  if (deck.length < count) {
    const studiedPool = bank.filter((q) => studiedSubjects.has(q.subject));
    take(studiedPool.filter((q) => grade === undefined || q.grade === grade), count);
    take(studiedPool, count);
  }

  // 3) 同年級各科輪流補（保持混合）。
  if (deck.length < count && grade !== undefined) {
    const gradePool = bank.filter((q) => q.grade === grade);
    let round = 0;
    while (deck.length < count && round < SUBJECT_ROTATION.length * 4) {
      const subject = SUBJECT_ROTATION[round % SUBJECT_ROTATION.length];
      take(gradePool.filter((q) => q.subject === subject), 1);
      round += 1;
    }
    take(gradePool, count);
  }

  // 4) 最後：全庫補滿（資料極少的保險）。
  if (deck.length < count) {
    take(bank, count);
  }

  return deck.slice(0, count);
}

export type WeeklyQuizScore = {
  answered: number;
  correct: number;
  total: number;
};

export function scoreWeeklyQuiz(
  questions: WeeklyQuizQuestion[],
  answers: Record<string, number>,
): WeeklyQuizScore {
  const answered = questions.filter((question) => typeof answers[question.id] === "number").length;
  const correct = questions.filter((question) => answers[question.id] === question.answer).length;
  return { answered, correct, total: questions.length };
}

/** 難度 → 金幣（基礎/標準/挑戰各 6/12/20，與學伴任務卡一致）。 */
export function goldForDifficulty(difficulty: string): number {
  return difficulty === "挑戰" ? 20 : difficulty === "標準" ? 12 : 6;
}

/** 難度 → 經驗（基礎/標準/挑戰各 5/10/18，與學伴任務卡一致）。 */
export function expForDifficulty(difficulty: string): number {
  return difficulty === "挑戰" ? 18 : difficulty === "標準" ? 10 : 5;
}

export type WeeklyRewards = { goldEarned: number; expEarned: number };

export function computeWeeklyRewards(
  questions: WeeklyQuizQuestion[],
  correctIds: Set<string>,
): WeeklyRewards {
  let goldEarned = 0;
  let expEarned = 0;
  for (const question of questions) {
    if (!correctIds.has(question.id)) continue;
    goldEarned += goldForDifficulty(question.difficulty);
    expEarned += expForDifficulty(question.difficulty);
  }
  return { goldEarned, expEarned };
}
