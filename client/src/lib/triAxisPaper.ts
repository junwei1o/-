/**
 * 三軸混編試卷：「過去／現在／未來」三條時間軸的組卷邏輯。
 *
 * 設計緣起
 * --------
 * 學生看到的題目若只按科目或難度排列，容易變成「一路往下做」的流水帳，
 * 感覺不到自己在學習歷程上的位置。這裡改用「時間軸」當組卷維度，
 * 讓同一張試卷同時回答三個問題：
 *
 *   過去 —— 我哪裡曾經跌倒？（錯題魔王：待克服的歷史錯誤）
 *   現在 —— 我正在練什麼？（當前航段：內容等級對應的當下進度）
 *   未來 —— 前方長什麼樣子？（未探海域：高一階、還沒練過的挑戰）
 *
 * 三個軸在同一張試卷中**交錯出現**（過去→現在→未來→過去→…），
 * 且不按科目分區，讓學生在「回顧→鞏固→展望」的節奏中前進。
 *
 * 與既有系統的關係
 * ----------------
 * 題目型別直接沿用 `PaperQuestion`，計分沿用同一套（每題 1 分），
 * 因此作答結果能與 `/practice`（常規試卷）互相比較，學習紀錄也共用同一份。
 */

import { MIN_GRADE, MAX_GRADE, type UserPreferences } from "@/game/adaptiveLearning";
import type { LearningRecord } from "@/utils/storage";
import type { PaperQuestion } from "./paperExam";

/** 三條時間軸。 */
export type PaperAxis = "過去" | "現在" | "未來";

/** 掛上軸別的題目。 */
export type TriAxisQuestion = PaperQuestion & { axis: PaperAxis };

/** 固定順序：回顧 → 鞏固 → 展望。 */
export const AXIS_ORDER: readonly PaperAxis[] = ["過去", "現在", "未來"] as const;

export type AxisMeta = {
  /** 軸的主題名（冒險／遠征風格）。 */
  name: string;
  /** 英文小標，與站上既有 eyebrow 風格一致。 */
  eyebrow: string;
  /** 這個軸代表的學習狀態。 */
  status: string;
  /** 一句話說明出題依據。 */
  hint: string;
};

export const AXIS_META: Record<PaperAxis, AxisMeta> = {
  過去: {
    name: "錯題魔王",
    eyebrow: "PAST · BOSS",
    status: "待克服的歷史錯誤",
    hint: "從你真實答錯過的題目，重練同一個知識點",
  },
  現在: {
    name: "當前航段",
    eyebrow: "NOW · CURRENT LEG",
    status: "正在鞏固的當下",
    hint: "依你的內容等級出題，把正在學的練穩",
  },
  未來: {
    name: "未探海域",
    eyebrow: "NEXT · UNCHARTED",
    status: "即將拓展的挑戰",
    hint: "高一階的題目，先看見前方的樣子",
  },
};

/** 預設每軸取幾題。12 題 = 4 過去 + 4 現在 + 4 未來。 */
export const DEFAULT_AXIS_QUOTA = 4;

/** 試卷總題數（三軸配額相加）。 */
export const DEFAULT_TRI_AXIS_SIZE = DEFAULT_AXIS_QUOTA * AXIS_ORDER.length;

/** 確定性的偽隨機（同一 seed 產生同一份試卷，方便重現與測試）。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: readonly T[], rand: () => number): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 依題目內容取一個穩定 seed，讓同一份試卷可重現。 */
export function seedFromDeck(questions: readonly PaperQuestion[]): number {
  const key = questions
    .slice(0, DEFAULT_TRI_AXIS_SIZE)
    .map((q) => q.id)
    .join("|");
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export type BuildTriAxisInput = {
  /** 全部可選題目（通常來自 useQuestionBank 的 questions）。 */
  questions: readonly PaperQuestion[];
  /** 學生的作答紀錄（用來找出「過去」的錯題與「未來」的未練題）。 */
  records: readonly LearningRecord[];
  /** 使用者偏好（內容等級／難度）。 */
  preferences: UserPreferences;
  /** 每軸取幾題。 */
  quota?: number;
  /** 指定 seed 以便重現。 */
  seed?: number;
};

export type TriAxisDeck = {
  questions: TriAxisQuestion[];
  /** 各軸實際取得的題數（可能因題庫不足而少於 quota）。 */
  counts: Record<PaperAxis, number>;
};

/** 取出「過去」軸：真實答錯過、且仍在題庫中的題目，最近答錯的優先。 */
function buildPastPool(
  byId: ReadonlyMap<string, PaperQuestion>,
  records: readonly LearningRecord[],
): PaperQuestion[] {
  const seen = new Set<string>();
  const out: PaperQuestion[] = [];
  // records 由舊到新附加，這裡反向走訪讓「最近答錯」排前面。
  for (let i = records.length - 1; i >= 0; i -= 1) {
    const record = records[i];
    if (record.isCorrect) continue;
    if (seen.has(record.questionId)) continue;
    const question = byId.get(record.questionId);
    if (!question) continue;
    seen.add(record.questionId);
    out.push(question);
  }
  return out;
}

/** 年級夾在可出題範圍內。 */
function clampGrade(grade: number): number {
  return Math.max(MIN_GRADE, Math.min(MAX_GRADE, grade));
}

/**
 * 組出三軸混編試卷。
 *
 * 取題規則
 *  - 過去：答錯過且仍在題庫中的題目（最近的優先）
 *  - 現在：年級等於內容等級的題目
 *  - 未來：年級高一階（不超過六年級）或難度為「挑戰」、且**尚未作答過**的題目
 *
 * 排題規則
 *  - 每軸先各自打散（因此同一軸內的科目順序不固定）
 *  - 再以「過去→現在→未來」循環交錯取出，達成軸別交錯、科目混編、難度起伏
 *  - 任一軸題數不足時，由其他軸補齊，確保試卷長度穩定
 */
export function buildTriAxisPaper(input: BuildTriAxisInput): TriAxisDeck {
  const { questions, records, preferences } = input;
  const quota = input.quota ?? DEFAULT_AXIS_QUOTA;

  const byId = new Map(questions.map((question) => [question.id, question]));
  const answeredIds = new Set(records.map((record) => record.questionId));
  const myGrade = clampGrade(preferences.gradeLevel ?? 4);

  const pastPool = buildPastPool(byId, records);
  const pastIds = new Set(pastPool.map((question) => question.id));

  const nowPool = questions.filter((question) => question.grade === myGrade && !pastIds.has(question.id));

  const futurePool = questions.filter(
    (question) =>
      !pastIds.has(question.id) &&
      !answeredIds.has(question.id) &&
      (question.grade === myGrade + 1 || question.difficulty === "挑戰"),
  );

  const rand = mulberry32(input.seed ?? 20260928);
  const pools: Record<PaperAxis, PaperQuestion[]> = {
    過去: shuffle(pastPool, rand),
    現在: shuffle(nowPool, rand),
    未來: shuffle(futurePool, rand),
  };

  // 每軸先取 quota 題。
  const picked: Record<PaperAxis, PaperQuestion[]> = { 過去: [], 現在: [], 未來: [] };
  const usedIds = new Set<string>();
  const take = (axis: PaperAxis, count: number) => {
    while (count > 0 && pools[axis].length > 0) {
      const question = pools[axis].shift()!;
      if (usedIds.has(question.id)) continue;
      usedIds.add(question.id);
      picked[axis].push(question);
      count -= 1;
    }
    return count;
  };

  for (const axis of AXIS_ORDER) {
    take(axis, quota);
  }

  // 某一軸題數不足時，由「仍有存量的軸」補齊**總題數**，
  // 但補進去的題目**保留自己的真實軸別** —— 軸別標示必須誠實：
  // 新玩家沒有任何錯題時，「錯題魔王」就是 0 題，不會拿普通題冒充錯題。
  const target = quota * AXIS_ORDER.length;
  let totalPicked = AXIS_ORDER.reduce((sum, axis) => sum + picked[axis].length, 0);
  if (totalPicked < target) {
    for (const donor of AXIS_ORDER) {
      if (totalPicked >= target) break;
      while (totalPicked < target && pools[donor].length > 0) {
        const question = pools[donor].shift()!;
        if (usedIds.has(question.id)) continue;
        usedIds.add(question.id);
        picked[donor].push(question);
        totalPicked += 1;
      }
    }
  }

  // 交錯排出：過去 → 現在 → 未來 → 過去 → …
  const interleaved: TriAxisQuestion[] = [];
  const cursors: Record<PaperAxis, number> = { 過去: 0, 現在: 0, 未來: 0 };
  const total = Math.max(...AXIS_ORDER.map((axis) => picked[axis].length));
  for (let round = 0; round < total; round += 1) {
    for (const axis of AXIS_ORDER) {
      const question = picked[axis][cursors[axis]];
      if (!question) continue;
      cursors[axis] += 1;
      interleaved.push({ ...question, axis });
    }
  }

  return {
    questions: interleaved,
    counts: {
      過去: picked.過去.length,
      現在: picked.現在.length,
      未來: picked.未來.length,
    },
  };
}

export type TriAxisScore = {
  answered: number;
  correct: number;
  total: number;
  percentage: number;
  /** 各軸的作答與正確數。 */
  byAxis: Record<PaperAxis, { answered: number; correct: number; total: number }>;
};

/** 計分：總分與各軸分項（讓學生看見自己在哪一條時間軸上最穩）。 */
export function scoreTriAxisPaper(
  deck: readonly TriAxisQuestion[],
  answers: Readonly<Record<string, number>>,
): TriAxisScore {
  const byAxis: TriAxisScore["byAxis"] = {
    過去: { answered: 0, correct: 0, total: 0 },
    現在: { answered: 0, correct: 0, total: 0 },
    未來: { answered: 0, correct: 0, total: 0 },
  };

  let answered = 0;
  let correct = 0;

  for (const question of deck) {
    const slot = byAxis[question.axis];
    slot.total += 1;
    const given = answers[question.id];
    if (typeof given !== "number") continue;
    answered += 1;
    slot.answered += 1;
    if (given === question.answer) {
      correct += 1;
      slot.correct += 1;
    }
  }

  return {
    answered,
    correct,
    total: deck.length,
    percentage: deck.length ? Math.round((correct / deck.length) * 100) : 0,
    byAxis,
  };
}
