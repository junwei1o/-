export type LearningQuestionLike = {
  id: string;
  subject: string;
  curriculumDomain: string;
  knowledge: string[];
};

export type PersistedLearningState = {
  stars: number;
  streak: number;
  xp: number;
  completed: string[];
  wrong: string[];
  notes: { text: string; date: string }[];
  sound: boolean;
};

export function loadPersistedLearningState(
  storage: Pick<Storage, "getItem" | "removeItem"> | undefined,
  key: string,
  fallback: PersistedLearningState,
): PersistedLearningState {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw) as Partial<PersistedLearningState>;
    return {
      stars: Number.isFinite(data.stars) ? Math.max(0, Math.min(999999, data.stars as number)) : fallback.stars,
      streak: Number.isFinite(data.streak) ? Math.max(0, Math.min(9999, data.streak as number)) : fallback.streak,
      xp: Number.isFinite(data.xp) ? Math.max(0, Math.min(999999, data.xp as number)) : fallback.xp,
      completed: Array.isArray(data.completed) ? data.completed.filter((value): value is string => typeof value === "string").slice(0, 500) : [],
      wrong: Array.isArray(data.wrong) ? data.wrong.filter((value): value is string => typeof value === "string").slice(0, 500) : [],
      notes: Array.isArray(data.notes) ? data.notes.filter((note): note is { text: string; date: string } => Boolean(note) && typeof note === "object" && typeof note.text === "string").slice(0, 500) : [],
      sound: typeof data.sound === "boolean" ? data.sound : true,
    };
  } catch {
    storage?.removeItem(key);
    return fallback;
  }
}

export function calculateLearningReport(
  questions: LearningQuestionLike[],
  completed: string[],
  wrong: string[],
  domains: string[],
) {
  const validIds = new Set(questions.map((item) => item.id));
  const completedIds = new Set(completed.filter((id) => validIds.has(id)));
  const wrongIds = new Set(wrong.filter((id) => validIds.has(id)));
  const answeredIds = new Set(completedIds);
  wrongIds.forEach((id) => answeredIds.add(id));
  const subjectStats = Array.from(new Set(questions.map((item) => item.subject))).map((subject) => {
    const subjectQuestions = questions.filter((item) => item.subject === subject);
    const answered = subjectQuestions.filter((item) => answeredIds.has(item.id));
    const correct = subjectQuestions.filter((item) => completedIds.has(item.id)).length;
    return { subject, total: subjectQuestions.length, answered: answered.length, correct, accuracy: answered.length ? Math.round((correct / answered.length) * 100) : null };
  });
  const domainStats = domains.map((domain) => {
    const domainQuestions = questions.filter((item) => item.curriculumDomain === domain);
    const answered = domainQuestions.filter((item) => answeredIds.has(item.id));
    const correct = domainQuestions.filter((item) => completedIds.has(item.id)).length;
    return { domain, total: domainQuestions.length, answered: answered.length, correct, mastery: answered.length ? Math.round((correct / answered.length) * 100) : null };
  });
  const knowledgeMap = new Map<string, { total: number; answered: number; correct: number }>();
  questions.forEach((item) => item.knowledge.forEach((tag) => {
    const current = knowledgeMap.get(tag) ?? { total: 0, answered: 0, correct: 0 };
    current.total += 1;
    if (answeredIds.has(item.id)) current.answered += 1;
    if (completedIds.has(item.id)) current.correct += 1;
    knowledgeMap.set(tag, current);
  }));
  const knowledgeStats = Array.from(knowledgeMap.entries()).map(([tag, data]) => ({ tag, ...data, mastery: data.answered ? Math.round((data.correct / data.answered) * 100) : 0 })).sort((a, b) => b.mastery - a.mastery || a.tag.localeCompare(b.tag, "zh-TW"));
  return { answered: answeredIds.size, correct: completedIds.size, wrong: wrongIds.size, accuracy: answeredIds.size ? Math.round((completedIds.size / answeredIds.size) * 100) : 0, subjectStats, domainStats, knowledgeStats };
}
