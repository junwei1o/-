import { loadUserPreferences, getTargetDifficultiesFromPrefs, filterQuestionsByGrade, targetDifficulties, type AdaptiveProfile } from "@/game/adaptiveLearning";
export type PaperSubject = "數學" | "自然" | "社會" | "國語" | "英語";

export type PaperQuestion = {
  id: string;
  grade: number;
  subject: PaperSubject;
  difficulty: string;
  learningTopic: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  /** Optional verified distractor feedback from the formal question bank. */
  strongDistractor?: { optionIndex: number; note: string };
};

export type PaperScope = "綜合課綱" | PaperSubject;
export type PaperMistakeReason = "基礎題需重看" | "標準題需練習" | "挑戰題需拆解";

export const PAPER_SCOPES: readonly PaperScope[] = ["綜合課綱", "國語", "數學", "英語", "自然", "社會"] as const;
export const PAPER_MISTAKE_REASONS: readonly PaperMistakeReason[] = ["基礎題需重看", "標準題需練習", "挑戰題需拆解"] as const;
export const DEFAULT_PAPER_SIZE = 12;

export function getPaperMistakeReason(question: Pick<PaperQuestion, "difficulty">): PaperMistakeReason {
  if (question.difficulty === "挑戰") return "挑戰題需拆解";
  if (question.difficulty === "標準") return "標準題需練習";
  return "基礎題需重看";
}

export function filterWrongPaperQuestions(
  questions: readonly PaperQuestion[],
  filters: { subject?: PaperSubject | "全部"; reason?: PaperMistakeReason | "全部" },
) {
  return questions.filter((question) => {
    const subjectMatches = !filters.subject || filters.subject === "全部" || question.subject === filters.subject;
    const reasonMatches = !filters.reason || filters.reason === "全部" || getPaperMistakeReason(question) === filters.reason;
    return subjectMatches && reasonMatches;
  });
}

export type PaperAttemptRecord = {
  questionId: string;
  correct: boolean;
  timestamp: number;
};

/**
 * 僅保留每題最後一次真實作答仍未答對的紀錄，讓跨頁錯題重練不會把
 * 已重新掌握的題目帶入；排序維持最近紀錄優先且不含任何答案資訊。
 */
export function buildSubjectWrongReviewDeck(
  questions: readonly PaperQuestion[],
  attempts: readonly PaperAttemptRecord[],
  subject: PaperSubject,
  size = DEFAULT_PAPER_SIZE,
) {
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const latestAttemptByQuestion = new Map<string, PaperAttemptRecord>();

  attempts.forEach((attempt) => {
    const question = questionById.get(attempt.questionId);
    const latest = latestAttemptByQuestion.get(attempt.questionId);
    if (question?.subject === subject && (!latest || attempt.timestamp > latest.timestamp)) {
      latestAttemptByQuestion.set(attempt.questionId, attempt);
    }
  });

  return Array.from(latestAttemptByQuestion.values())
    .filter((attempt) => !attempt.correct)
    .sort((left, right) => right.timestamp - left.timestamp)
    .map((attempt) => questionById.get(attempt.questionId))
    .filter((question): question is PaperQuestion => Boolean(question))
    .slice(0, size);
}

/** 根據用戶偏好篩選題庫（難度 + 年級），未設定則最難優先 */
export function buildPersonalizedPaperDeck(
  questions: readonly PaperQuestion[],
  scope: PaperScope,
  size = DEFAULT_PAPER_SIZE,
  profile?: AdaptiveProfile,
) {
  const prefs = loadUserPreferences();
  const hasUserPrefs = prefs.updatedAt > 0 && (prefs.gradeLevel !== 4 || prefs.difficultyPreference !== "均衡混合");
  
  let filteredQuestions = questions;
  
  if (hasUserPrefs) {
    // 有用戶偏好：按年級 + 難度篩選
    const userAllowedDifficulties = getTargetDifficultiesFromPrefs(prefs);
    const adaptiveTargets = profile ? targetDifficulties(profile, questions as any) : userAllowedDifficulties;
    const finalTargets = adaptiveTargets.filter(d => userAllowedDifficulties.includes(d));
    const targetDifficulties = finalTargets.length > 0 ? finalTargets : userAllowedDifficulties;
    
    const scopeFiltered = scope === "綜合課綱" ? questions : questions.filter((q) => q.subject === scope);
    const gradeFiltered = filterQuestionsByGrade(scopeFiltered, prefs);
    const difficultyFiltered = gradeFiltered.filter((q) => targetDifficulties.includes(q.difficulty as any));
    filteredQuestions = difficultyFiltered.length >= Math.min(size, gradeFiltered.length) ? difficultyFiltered : gradeFiltered;
  } else {
    // 無用戶偏好：最難的排最前面
    const scopeFiltered = scope === "綜合課綱" ? questions : questions.filter((q) => q.subject === scope);
    const difficultyOrder = { "挑戰": 3, "標準": 2, "基礎": 1 };
    filteredQuestions = [...scopeFiltered].sort((a, b) => 
      (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] ?? 0) - 
      (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] ?? 0)
    );
  }
  
  return buildPaperDeck(filteredQuestions, scope, size);
}

function shuffled<T>(items: readonly T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildPaperDeck(
  questions: readonly PaperQuestion[],
  scope: PaperScope,
  size = DEFAULT_PAPER_SIZE,
) {
  const source = scope === "綜合課綱" ? questions : questions.filter((question) => question.subject === scope);
  if (scope !== "綜合課綱") return shuffled(source).slice(0, size);

  const anchors = (['國語', '數學', '自然', '社會'] as const)
    .map((subject) => shuffled(source.filter((question) => question.subject === subject))[0])
    .filter((question): question is PaperQuestion => Boolean(question));
  const selectedIds = new Set(anchors.map((question) => question.id));
  const remaining = shuffled(source.filter((question) => !selectedIds.has(question.id)));
  return [...anchors, ...remaining].slice(0, size);
}

export function scorePaper(deck: readonly PaperQuestion[], answers: Record<string, number>) {
  const answered = deck.filter((question) => typeof answers[question.id] === "number").length;
  const correct = deck.filter((question) => answers[question.id] === question.answer).length;
  return {
    answered,
    correct,
    total: deck.length,
    percentage: deck.length ? Math.round((correct / deck.length) * 100) : 0,
    incomplete: deck.length - answered,
  };
}

/** 將實際已作答題數映射為玉山（3,952m）高度計，避免以分數作為旅程回饋。 */
export function questionIndexToAltitude(answered: number, total: number): number {
  if (total <= 0) return 0;
  const boundedAnswered = Math.min(Math.max(answered, 0), total);
  return Math.round((boundedAnswered / total) * 3952);
}

export type PaperStrategyRecap = {
  title: string;
  summary: string;
  strategies: string[];
  knowledgeTopics: string[];
};

const PAPER_SUBJECT_STRATEGIES: Record<PaperQuestion["subject"], string> = {
  國語: "國語閱讀策略：先標出關鍵詞與前後文關係，再回題幹核對自己的想法。",
  英語: "英語理解策略：先找出句子的關鍵字與時態，再用上下文確認語意。",
  數學: "數學觀察策略：先整理題目中的量、單位與關係，再一步一步檢查。",
  自然: "自然觀察策略：先分開看現象、條件與證據，再用線索支持推論。",
  社會: "社會觀察策略：先整理人物、情境與資料來源，再比較它們之間的關係。",
};

/**
 * 從這一組實際題目整理可帶走的作答策略；僅使用題目的學科與知識點，
 * 不依正誤或答案產生評語，也不會揭露解答。
 */
export function getPaperStrategyRecap(deck: readonly Pick<PaperQuestion, "subject" | "learningTopic">[]): PaperStrategyRecap {
  const subjects = Array.from(new Set(deck.map((question) => question.subject)));
  const knowledgeTopics = Array.from(new Set(deck.map((question) => question.learningTopic.trim()).filter(Boolean)));
  const strategies = subjects.map((subject) => PAPER_SUBJECT_STRATEGIES[subject]);
  const subjectLabel = subjects.length > 0 ? subjects.join("、") : "本組";

  return {
    title: "把剛才的解題技巧帶到下一次",
    summary: `${subjectLabel}題目提供了這些可重複使用的觀察方式；它們只整理作答方向，不列出選項或作答結果。`,
    strategies,
    knowledgeTopics,
  };
}

export type PaperNextGroupStrategyHint = {
  subjectLabel: string;
  tip: string;
};

const PAPER_NEXT_GROUP_STRATEGY_HINTS: Record<PaperScope, PaperNextGroupStrategyHint> = {
  綜合課綱: {
    subjectLabel: "綜合課綱準備提示",
    tip: "先讀清楚每題的題幹與條件，再跟著該題的學科線索一步一步整理。",
  },
  國語: {
    subjectLabel: "國語準備提示",
    tip: "先圈出題幹中的關鍵詞，再回前後文找能支持自己想法的線索。",
  },
  英語: {
    subjectLabel: "英語準備提示",
    tip: "先找出句子的關鍵字與時態，再用上下文確認語意。",
  },
  數學: {
    subjectLabel: "數學準備提示",
    tip: "先寫下已知的量和單位，再逐步檢查每個關係。",
  },
  自然: {
    subjectLabel: "自然準備提示",
    tip: "先分開看現象與條件，再用題目裡的證據支持推論。",
  },
  社會: {
    subjectLabel: "社會準備提示",
    tip: "先整理人物、情境與資料來源，再比較它們之間的關係。",
  },
};

/** 在建立下一組題目之前提供學科專屬策略，只指向讀題與整理方向，絕不揭示答案。 */
export function getPaperNextGroupStrategyHint(scope: PaperScope): PaperNextGroupStrategyHint {
  return PAPER_NEXT_GROUP_STRATEGY_HINTS[scope];
}

export type ReviewSelfCheckDifficulty = "基礎" | "標準" | "挑戰";

export type ReviewSelfCheckAdaptation = {
  difficulty: ReviewSelfCheckDifficulty;
  optionCount: 2 | 3 | 4;
  focusTopics: Array<{ topic: string; count: number; highestDifficulty: ReviewSelfCheckDifficulty }>;
};

const DIFFICULTY_RANK: Record<ReviewSelfCheckDifficulty, number> = { 基礎: 1, 標準: 2, 挑戰: 3 };

export function getReviewSelfCheckAdaptation(
  questions: readonly Pick<PaperQuestion, "learningTopic" | "difficulty">[],
): ReviewSelfCheckAdaptation {
  const byTopic = new Map<string, { count: number; highestDifficulty: ReviewSelfCheckDifficulty }>();
  for (const question of questions) {
    const topic = question.learningTopic.trim() || "目前錯題重點";
    const difficulty = question.difficulty === "挑戰" ? "挑戰" : question.difficulty === "標準" ? "標準" : "基礎";
    const current = byTopic.get(topic);
    if (!current) byTopic.set(topic, { count: 1, highestDifficulty: difficulty });
    else {
      current.count += 1;
      if (DIFFICULTY_RANK[difficulty] > DIFFICULTY_RANK[current.highestDifficulty]) current.highestDifficulty = difficulty;
    }
  }
  const focusTopics = Array.from(byTopic.entries())
    .sort(([, left], [, right]) => right.count - left.count || DIFFICULTY_RANK[right.highestDifficulty] - DIFFICULTY_RANK[left.highestDifficulty])
    .slice(0, 2)
    .map(([topic, value]) => ({ topic, ...value }));
  const highest = focusTopics.reduce<ReviewSelfCheckDifficulty>((current, topic) => (
    DIFFICULTY_RANK[topic.highestDifficulty] > DIFFICULTY_RANK[current] ? topic.highestDifficulty : current
  ), "基礎");
  const repeated = focusTopics.some((topic) => topic.count >= 2);
  const difficulty: ReviewSelfCheckDifficulty = repeated && highest === "基礎" ? "標準" : highest;
  const optionCount: 2 | 3 | 4 = difficulty === "基礎" ? 2 : difficulty === "標準" ? 3 : 4;
  return { difficulty, optionCount, focusTopics };
}


export type KnowledgeMasterySummary = {
  topic: string;
  status: "待加強" | "練習中";
  detail: string;
};

export function getKnowledgeMasterySummary(
  questions: readonly Pick<PaperQuestion, "learningTopic" | "difficulty">[],
): KnowledgeMasterySummary[] {
  const byTopic = new Map<string, { count: number; highestDifficulty: ReviewSelfCheckDifficulty }>();
  for (const question of questions) {
    const topic = question.learningTopic.trim() || "目前錯題重點";
    const difficulty = question.difficulty === "挑戰" ? "挑戰" : question.difficulty === "標準" ? "標準" : "基礎";
    const current = byTopic.get(topic);
    if (!current) byTopic.set(topic, { count: 1, highestDifficulty: difficulty });
    else {
      current.count += 1;
      if (DIFFICULTY_RANK[difficulty] > DIFFICULTY_RANK[current.highestDifficulty]) current.highestDifficulty = difficulty;
    }
  }
  return Array.from(byTopic.entries())
    .sort(([, left], [, right]) => right.count - left.count || DIFFICULTY_RANK[right.highestDifficulty] - DIFFICULTY_RANK[left.highestDifficulty])
    .slice(0, 3)
    .map(([topic, value]) => ({
      topic,
      status: value.count >= 2 || value.highestDifficulty === "挑戰" ? "待加強" : "練習中",
      detail: `${value.count} 題錯題 · 最高難度${value.highestDifficulty}`,
    }));
}
