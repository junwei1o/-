import type { AdaptiveProfile } from "@/game/adaptiveLearning";
import { buildKnowledgeIslandSnapshots, type KnowledgeIslandSnapshot } from "@/lib/studentKnowledgeIslands";
import { resolveTopicTagFromAttempt } from "@/lib/topicTag";

export type SupporterIslandSummary = {
  island: KnowledgeIslandSnapshot;
  status: "尚未啟航" | "探索中" | "穩定航行";
  latestActivityAt: number | null;
  recentCorrectCount: number;
  recentAttemptCount: number;
};

/** 單一弱點主題的可操作建議（設計稿 P3 問題13：弱點 Top3＋建議練習題數）。 */
export type WeakTopicRecommendation = {
  topic: string;
  subject: string;
  attemptCount: number;
  wrongCount: number;
  accuracy: number;
  /** 依弱點程度換算的建議練習題數。 */
  recommendedQuestions: number;
};

export type TeacherParentSummary = {
  generatedAt: number;
  totalAttempts: number;
  activeIslands: number;
  visitedTopics: string[];
  islands: SupporterIslandSummary[];
  /** 依答錯程度排序的弱點主題，最多 3 個。 */
  weakTopics: WeakTopicRecommendation[];
  /** 所有弱點主題建議練習題數的加總；無弱點時為 0。 */
  recommendedWeeklyQuestions: number;
  nextConversation: string;
};

/**
 * 從作答紀錄聚合最弱的主題：
 * 以「中階主題標籤」（見 lib/topicTag.ts）分組——舊做法直接用每題第一個知識標籤，
 * 但題庫有 1049 組細標籤、1130 題，等於每組只會出現一次，永遠達不到「至少作答 2 次」
 * 的門檻，弱點分析形同失效。收斂成約 30 個中階主題後才可穩定聚合。
 *
 * 只保留至少作答 2 次、正確率低於七成且有答錯的主題，
 * 排序為「答錯多→正確率低」，取前 3 名。建議題數依嚴重度 3／4／5 題遞增。
 */
export function buildWeakTopicRecommendations(profile: AdaptiveProfile, limit = 3): WeakTopicRecommendation[] {
  const buckets = new Map<string, { subject: string; attemptCount: number; wrongCount: number }>();
  for (const attempt of profile.attempts) {
    const topic = (attempt.topicTag ?? resolveTopicTagFromAttempt(attempt)).trim();
    if (!topic) continue;
    const current = buckets.get(topic) ?? { subject: attempt.curriculumDomain, attemptCount: 0, wrongCount: 0 };
    current.attemptCount += 1;
    if (!attempt.correct) current.wrongCount += 1;
    buckets.set(topic, current);
  }

  return Array.from(buckets.entries())
    .map(([topic, stat]) => ({
      topic,
      subject: stat.subject,
      attemptCount: stat.attemptCount,
      wrongCount: stat.wrongCount,
      accuracy: stat.attemptCount ? (stat.attemptCount - stat.wrongCount) / stat.attemptCount : 1,
      recommendedQuestions: 0,
    }))
    .filter((item) => item.attemptCount >= 2 && item.wrongCount >= 1 && item.accuracy < 0.7)
    .sort((a, b) => (b.wrongCount - a.wrongCount) || (a.accuracy - b.accuracy) || b.attemptCount - a.attemptCount)
    .slice(0, limit)
    .map((item) => {
      let recommendedQuestions = 3;
      if (item.accuracy < 0.4 || item.wrongCount >= 3) recommendedQuestions = 5;
      else if (item.accuracy < 0.6) recommendedQuestions = 4;
      return { ...item, recommendedQuestions };
    });
}

function latestActivity(profile: AdaptiveProfile, subject: string) {
  return profile.attempts
    .filter((attempt) => attempt.curriculumDomain === subject)
    .sort((left, right) => right.timestamp - left.timestamp)[0]?.timestamp ?? null;
}

function recentStats(profile: AdaptiveProfile, subject: string) {
  const attempts = profile.attempts.filter((attempt) => attempt.curriculumDomain === subject).slice(-5);
  return {
    recentAttemptCount: attempts.length,
    recentCorrectCount: attempts.filter((attempt) => attempt.correct).length,
  };
}

function statusForIsland(island: KnowledgeIslandSnapshot, recentAttemptCount: number): SupporterIslandSummary["status"] {
  if (!island.attemptCount) return "尚未啟航";
  if (recentAttemptCount >= 3 && island.dueReviewCount === 0) return "穩定航行";
  return "探索中";
}

/**
 * 只從本機實際作答紀錄產生陪讀摘要；尚未練習的島嶼不會被推測成弱項。
 */
export function buildTeacherParentSummary(profile: AdaptiveProfile, now = Date.now()): TeacherParentSummary {
  const islands = buildKnowledgeIslandSnapshots(profile, now).map((island) => {
    const stats = recentStats(profile, island.subject);
    return {
      island,
      status: statusForIsland(island, stats.recentAttemptCount),
      latestActivityAt: latestActivity(profile, island.subject),
      ...stats,
    };
  });
  const visitedTopics = Array.from(new Set(islands.flatMap(({ island }) => [...island.observedKnowledge, ...island.recentReviewTopics]))).slice(0, 8);
  const activeIslands = islands.filter(({ island }) => island.attemptCount > 0).length;
  const weakTopics = buildWeakTopicRecommendations(profile);
  const recommendedWeeklyQuestions = weakTopics.reduce((sum, item) => sum + item.recommendedQuestions, 0);
  const nextConversation = activeIslands === 0
    ? "可以先邀請學生挑選一座知識島，從一個小主題開始探索。"
    : weakTopics.length > 0
      ? `這週可陪學生優先複習「${weakTopics[0].topic}」，建議練 ${weakTopics[0].recommendedQuestions} 題找回把握，再往下一個主題前進。`
      : "目前沒有明顯弱點，可以請學生分享最近最有把握的主題，再挑戰稍微進階的內容。";
  return { generatedAt: now, totalAttempts: profile.attempts.length, activeIslands, visitedTopics, islands, weakTopics, recommendedWeeklyQuestions, nextConversation };
}

export function formatSupporterActivity(timestamp: number | null) {
  if (!timestamp) return "尚無作答足跡";
  return new Date(timestamp).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
}
