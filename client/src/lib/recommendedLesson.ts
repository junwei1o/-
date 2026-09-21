/**
 * 首頁「今日推薦動畫微課」
 *
 * 動畫微課（洋蔥動畫講解）原本只存在於「我的教室」裡，首頁完全沒有入口，
 * 學生幾乎不會發現。此處依「學段」與「本週最弱科目」挑一堂課推到首頁。
 */
// 只依賴輕量目錄（每堂 id/標題/學科/年級/學段/介紹），不要 import 完整 ONION_LESSONS，
// 否則首頁會把 200 堂課的分鏡與題目（約 580KB）一起打進首屏主 bundle。
// 完整課程只在「我的教室」洋蔥學園 lazy 載入。
import { ONION_LESSON_CATALOG, type OnionLessonSummary } from "@/game/onionLessonCatalog.gen";
import type { OnionStage } from "@/game/onionAcademyLessons";

export type RecommendedLesson = {
  lesson: OnionLessonSummary;
  reason: string;
};

/** 本週（週一起算）各科目答錯數，取最弱的那一科；沒有資料回傳 null。 */
export function weakestSubjectThisWeek(
  rows: ReadonlyArray<{ subject: string; isCorrect?: boolean; correct?: boolean; timestamp: number }>,
  now = Date.now(),
): { subject: string; wrong: number; total: number } | null {
  const current = new Date(now);
  const daysSinceMonday = (current.getUTCDay() + 6) % 7;
  const weekStart = Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate() - daysSinceMonday,
  );
  const bySubject = new Map<string, { wrong: number; total: number }>();
  for (const row of rows) {
    if (row.timestamp < weekStart || row.timestamp > now) continue;
    const ok = row.isCorrect ?? row.correct ?? false;
    const entry = bySubject.get(row.subject) ?? { wrong: 0, total: 0 };
    entry.total += 1;
    if (!ok) entry.wrong += 1;
    bySubject.set(row.subject, entry);
  }
  const ranked = Array.from(bySubject.entries())
    .map(([subject, stat]) => ({ subject, ...stat }))
    .filter((item) => item.wrong > 0)
    .sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong);
  return ranked[0] ?? null;
}

/**
 * 挑選推薦課程：
 * 1. 先依學段過濾（國中生不推國小課）
 * 2. 本週有最弱科目 → 優推該科；否則依日期輪替，每天換一堂，避免永遠同一堂
 */
export function pickRecommendedLesson(input: {
  stage: OnionStage;
  weakSubject?: string | null;
  now?: number;
}): RecommendedLesson | null {
  const now = input.now ?? Date.now();
  const pool = ONION_LESSON_CATALOG.filter((lesson) => lesson.stages.includes(input.stage));
  if (!pool.length) return null;

  const weak = input.weakSubject ? pool.filter((lesson) => lesson.subject === input.weakSubject) : [];
  if (weak.length) {
    const index = Math.floor(now / 86_400_000) % weak.length;
    return {
      lesson: weak[index],
      reason: `你本週「${input.weakSubject}」答錯較多，先看這堂動畫再練習`,
    };
  }

  // 沒有弱科資料：依 UTC 日期輪替
  const dayIndex = Math.floor(now / 86_400_000);
  const lesson = pool[dayIndex % pool.length];
  return { lesson, reason: "今天的推薦動畫課，看完再闖 5 題" };
}

/** 微課入口路由。 */
export const ONION_ACADEMY_ROUTE = "/classroom/onion-academy";
