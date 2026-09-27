import {
  WRONG_GRADUATION_STREAK,
  type AdaptiveAttempt,
  type AdaptiveProfile,
} from "@/game/adaptiveLearning";
import type { KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import type { LookupQuestion } from "@/lib/questionLookup";

/** 分組固定用這四科，順序與頁面標題一致。 */
export const WRONG_BOOK_SUBJECTS: KnowledgeIslandSubject[] = ["國語", "數學", "社會", "自然"];

export type WrongBookItem = {
  questionId: string;
  subject: KnowledgeIslandSubject;
  prompt: string;
  knowledge: string[];
  streak: number;
  remaining: number;
};

export type GraduatedItem = {
  questionId: string;
  subject: KnowledgeIslandSubject;
  prompt: string;
  knowledge: string[];
  graduatedAt: number | null;
};

export type WrongBookGroup<T> = { subject: KnowledgeIslandSubject; items: T[] };

/**
 * 題目在錯題本裡的「代表紀錄」：同題多筆時取最新一筆的科目與知識點。
 * 原本兩個頁面各自在迴圈裡重複 set 同一個 key（等同每次覆寫），這裡改成只取最後一筆。
 */
type AttemptMeta = { subject: string; knowledge: string[] };

/**
 * 找不到題幹時的備援文案。
 *
 * 根因（題目來自 fill_bank / order_bank 卻查不到）已由 questionLookup 修正，
 * 這裡只保留「題目確實已被下架」的最後防線：有知識點就顯示知識點，
 * 沒有才退回 id，不再把「題目資料待補」直接丟給學生看。
 */
function fallbackPrompt(meta: AttemptMeta, questionId: string): string {
  const knowledge = meta.knowledge.filter(Boolean).join("、");
  return knowledge || `題目 ${questionId}`;
}

function resolvePrompt(
  lookup: ReadonlyMap<string, LookupQuestion>,
  meta: AttemptMeta,
  questionId: string,
): string {
  const question = lookup.get(questionId);
  return question?.prompt || fallbackPrompt(meta, questionId);
}

function resolveKnowledge(
  lookup: ReadonlyMap<string, LookupQuestion>,
  meta: AttemptMeta,
  questionId: string,
): string[] {
  const question = lookup.get(questionId);
  return question?.knowledge?.length ? question.knowledge : meta.knowledge;
}

/**
 * 依題目 id 分組作答紀錄。
 *
 * 原本每個 id 都要跑一次 attempts.filter（isInWrongBook／getCorrectStreak 各一次），
 * 等於 O(題數 × 紀錄數)；這裡先分組一次，之後每題都是 O(該題紀錄數)。
 */
function groupAttemptsByQuestion(
  attempts: readonly AdaptiveAttempt[],
): Map<string, AdaptiveAttempt[]> {
  const grouped = new Map<string, AdaptiveAttempt[]>();
  for (const attempt of attempts) {
    const bucket = grouped.get(attempt.questionId);
    if (bucket) bucket.push(attempt);
    else grouped.set(attempt.questionId, [attempt]);
  }
  return grouped;
}

/** 從最新一筆往前數，連續答對幾次。 */
function correctStreak(mine: readonly AdaptiveAttempt[]): number {
  let streak = 0;
  for (let index = mine.length - 1; index >= 0; index -= 1) {
    if (mine[index]?.correct) streak += 1;
    else break;
  }
  return streak;
}

/**
 * 是否仍在錯題本，口徑與 adaptiveLearning.isInWrongBook 完全一致：
 * 最新是錯 → 在；最新對但前一筆不是連續對 → 在；連續兩次對 → 已移出。
 */
function isInWrongBook(mine: readonly AdaptiveAttempt[]): boolean {
  const latest = mine[mine.length - 1];
  if (!latest) return false;
  if (!latest.correct) return true;
  const previous = mine[mine.length - 2];
  return previous?.correct !== true;
}

/** 是否已畢業，口徑與 adaptiveLearning.isGraduated 完全一致。 */
function isGraduated(mine: readonly AdaptiveAttempt[]): boolean {
  if (!mine.some((attempt) => !attempt.correct)) return false;
  return correctStreak(mine) >= WRONG_GRADUATION_STREAK;
}

type Grouped = ReturnType<typeof groupAttemptsByQuestion>;

function metaIndex(grouped: Grouped): Map<string, AttemptMeta> {
  const index = new Map<string, AttemptMeta>();
  grouped.forEach((mine, questionId) => {
    const latest = mine[mine.length - 1];
    if (!latest) return;
    index.set(questionId, {
      subject: latest.curriculumDomain,
      knowledge: latest.knowledge ?? [],
    });
  });
  return index;
}

/** 錯題重練：只留下仍在錯題本的題，各科分組、科內把「快畢業的」排前面。 */
export function collectWrongBookGroups(
  profile: AdaptiveProfile,
  lookup: ReadonlyMap<string, LookupQuestion>,
): WrongBookGroup<WrongBookItem>[] {
  const grouped = groupAttemptsByQuestion(profile.attempts);
  const meta = metaIndex(grouped);

  const items: WrongBookItem[] = [];
  grouped.forEach((mine, questionId) => {
    if (!isInWrongBook(mine)) return;
    const info = meta.get(questionId);
    if (!info) return;
    const streak = correctStreak(mine);
    items.push({
      questionId,
      subject: info.subject as KnowledgeIslandSubject,
      prompt: resolvePrompt(lookup, info, questionId),
      knowledge: resolveKnowledge(lookup, info, questionId),
      streak,
      remaining: Math.max(0, WRONG_GRADUATION_STREAK - streak),
    });
  });

  return groupBySubject(items, (a, b) => a.remaining - b.remaining);
}

/** 畢業紀念榜：只留下已畢業的題，各科分組、科內把最近畢業的排前面。 */
export function collectGraduatedGroups(
  profile: AdaptiveProfile,
  lookup: ReadonlyMap<string, LookupQuestion>,
): WrongBookGroup<GraduatedItem>[] {
  const grouped = groupAttemptsByQuestion(profile.attempts);
  const meta = metaIndex(grouped);

  const items: GraduatedItem[] = [];
  grouped.forEach((mine, questionId) => {
    if (!isGraduated(mine)) return;
    const info = meta.get(questionId);
    if (!info) return;
    items.push({
      questionId,
      subject: info.subject as KnowledgeIslandSubject,
      prompt: resolvePrompt(lookup, info, questionId),
      knowledge: resolveKnowledge(lookup, info, questionId),
      graduatedAt: mine[mine.length - 1]?.timestamp ?? null,
    });
  });

  return groupBySubject(items, (a, b) => (b.graduatedAt ?? 0) - (a.graduatedAt ?? 0));
}

function groupBySubject<T extends { subject: KnowledgeIslandSubject }>(
  items: T[],
  compare: (a: T, b: T) => number,
): WrongBookGroup<T>[] {
  return WRONG_BOOK_SUBJECTS.map((subject) => ({
    subject,
    items: items.filter((item) => item.subject === subject).sort(compare),
  })).filter((group) => group.items.length > 0);
}
