import type { AdaptiveAttempt, AdaptiveProfile } from "@/game/adaptiveLearning";
import type { CurriculumQuestionRow, LookupQuestion } from "@/lib/questionLookup";
import type { StudentDiagnosis } from "@/lib/studentDiagnosis";
import type { AccuracyBySubject } from "@/lib/studentDashboard";
import { collectWrongBookGroups } from "@/lib/wrongBook";

/**
 * 學生端「今日任務」建議。
 *
 * 純函式：輸入 profile / lookup / rows / diagnosis 等，輸出建議卡片；
 * 不直接讀 storage，隨機性可經 opts.random 注入以便測試重現。
 */

export interface TodayTask {
  id: string;
  kind: "wrong-book" | "subject-practice" | "knowledge" | "challenge";
  knowledge?: string;
  questionCount: number;
  questionIds: string[];
  /** max(1, round(questionCount * 0.7)) */
  estimatedMinutes: number;
  reason: string;
  reward?: string;
  /** knowledge 級資料不足／標籤不可信 → "building" */
  reliability: "ok" | "building";
  completed: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function estimatedMinutesFor(questionCount: number): number {
  return Math.max(1, Math.round(questionCount * 0.7));
}

/** 該題在 profile.attempts 中最新一筆作答是否答對（無紀錄視為未完成）。 */
function latestAttemptCorrect(profile: AdaptiveProfile, questionId: string): boolean {
  let latest: AdaptiveAttempt | null = null;
  for (const attempt of profile.attempts) {
    if (attempt.questionId === questionId) latest = attempt;
  }
  return latest?.correct === true;
}

/** 每題最新一筆全部答對才視為完成。 */
function allCompleted(profile: AdaptiveProfile, questionIds: readonly string[]): boolean {
  if (questionIds.length === 0) return false;
  return questionIds.every((id) => latestAttemptCorrect(profile, id));
}

/** 以注入的 random 做部分 Fisher–Yates，取前 n 筆（測試固定 random 可重現）。 */
function pickRandom<T>(arr: readonly T[], n: number, random: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(0, n));
}

export function generateTodayTasks(opts: {
  profile: AdaptiveProfile;
  lookup: ReadonlyMap<string, LookupQuestion>;
  rows: readonly CurriculumQuestionRow[];
  diagnosis: StudentDiagnosis;
  tagReliability: ReadonlyMap<string, number>;
  subjectAccuracies: AccuracyBySubject[];
  now?: number;
  random?: () => number;
}): TodayTask[] {
  const {
    profile,
    lookup,
    rows,
    diagnosis,
    tagReliability,
    subjectAccuracies,
    random = Math.random,
  } = opts;

  // now 保留在簽章中（供未來「今日」邊界判斷），現行選題不依賴它。
  void opts.now;

  const tasks: TodayTask[] = [];
  const usedIds = new Set<string>();
  const stats = Object.values(diagnosis.knowledgeStats);

  // ── 1. wrong-book（最高優先：快畢業的錯題） ──
  const wrongItems = collectWrongBookGroups(profile, lookup)
    .flatMap((group) => group.items)
    .sort((a, b) => a.remaining - b.remaining);
  if (wrongItems.length > 0) {
    const picked = wrongItems.slice(0, 3);
    const ids = picked.map((item) => item.questionId);
    ids.forEach((id) => usedIds.add(id));
    tasks.push({
      id: "wrong-book",
      kind: "wrong-book",
      questionCount: ids.length,
      questionIds: ids,
      estimatedMinutes: estimatedMinutesFor(ids.length),
      reason: "這些題目再練熟就畢業了！",
      reward: "錯題畢業",
      reliability: "ok",
      completed: allCompleted(profile, ids),
    });
  }

  // ── 3. knowledge（先算，供 subject-practice 排除重複題） ──
  const focusCandidates = stats
    .filter((s) => s.status === "unstable" || s.status === "blindspot")
    .sort((a, b) => a.confidence - b.confidence);
  let knowledgeTask: TodayTask | null = null;
  if (focusCandidates.length > 0) {
    const weakest = focusCandidates[0];
    const reliable = (tagReliability.get(weakest.knowledge) ?? 0) >= 3;
    const candidates = rows.filter(
      (r) => (r.knowledge ?? []).includes(weakest.knowledge) && !usedIds.has(r.id),
    );
    if (reliable && candidates.length > 0) {
      const picked = pickRandom(candidates, 3, random);
      const ids = picked.map((q) => q.id);
      ids.forEach((id) => usedIds.add(id));
      knowledgeTask = {
        id: "knowledge",
        kind: "knowledge",
        knowledge: weakest.knowledge,
        questionCount: ids.length,
        questionIds: ids,
        estimatedMinutes: estimatedMinutesFor(ids.length),
        reason: `把『${weakest.knowledge}』練得更熟吧`,
        reliability: "ok",
        completed: allCompleted(profile, ids),
      };
    } else {
      // reliable 但找不到題、或標籤不可信 → 仍給卡片，標 building。
      knowledgeTask = {
        id: "knowledge",
        kind: "knowledge",
        knowledge: weakest.knowledge,
        questionCount: 0,
        questionIds: [],
        estimatedMinutes: 1,
        reason: `「${weakest.knowledge}」的建議還在建置中，先完成其他任務吧`,
        reliability: "building",
        completed: false,
      };
    }
  }

  // ── 2. subject-practice（正確率最低、有資料的科目，做 3 題標準題） ──
  const dataSubjects = subjectAccuracies.filter((s) => s.hasData && s.attempts > 0);
  if (dataSubjects.length > 0) {
    const weakestSubject = [...dataSubjects].sort((a, b) => a.accuracy - b.accuracy)[0];
    const candidates = rows.filter(
      (r) =>
        r.subject === weakestSubject.subject &&
        r.difficulty === "標準" &&
        !usedIds.has(r.id),
    );
    if (candidates.length > 0) {
      const picked = pickRandom(candidates, 3, random);
      const ids = picked.map((q) => q.id);
      ids.forEach((id) => usedIds.add(id));
      tasks.push({
        id: "subject-practice",
        kind: "subject-practice",
        questionCount: ids.length,
        questionIds: ids,
        estimatedMinutes: estimatedMinutesFor(ids.length),
        reason: `在『${weakestSubject.subject}』上再加油，做幾題標準題鞏固一下`,
        reliability: "ok",
        completed: allCompleted(profile, ids),
      });
    }
  }

  // 依契約輸出順序：wrong-book → subject-practice → knowledge → challenge。
  if (knowledgeTask) tasks.push(knowledgeTask);

  // ── 4. challenge（有 mastered 強項就挑 2 題挑戰題） ──
  const mastered = stats
    .filter((s) => s.status === "mastered" && s.confidence >= 0.75)
    .sort((a, b) => b.confidence - a.confidence);
  if (mastered.length > 0) {
    const strongest = mastered[0];
    const candidates = rows.filter(
      (r) =>
        (r.knowledge ?? []).includes(strongest.knowledge) &&
        r.difficulty === "挑戰" &&
        !usedIds.has(r.id),
    );
    if (candidates.length > 0) {
      const picked = pickRandom(candidates, 2, random);
      const ids = picked.map((q) => q.id);
      tasks.push({
        id: "challenge",
        kind: "challenge",
        knowledge: strongest.knowledge,
        questionCount: ids.length,
        questionIds: ids,
        estimatedMinutes: estimatedMinutesFor(ids.length),
        reason: "挑戰一下，建立信心！",
        reward: "挑戰者徽章",
        reliability: "ok",
        completed: allCompleted(profile, ids),
      });
    }
  }

  return tasks;
}
