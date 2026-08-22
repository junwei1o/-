import type { AdaptiveProfile } from "@/game/adaptiveLearning";
import { buildKnowledgeIslandSnapshots, type KnowledgeIslandSnapshot } from "@/lib/studentKnowledgeIslands";

export type SupporterIslandSummary = {
  island: KnowledgeIslandSnapshot;
  status: "尚未啟航" | "探索中" | "穩定航行";
  latestActivityAt: number | null;
  recentCorrectCount: number;
  recentAttemptCount: number;
};

export type TeacherParentSummary = {
  generatedAt: number;
  totalAttempts: number;
  activeIslands: number;
  visitedTopics: string[];
  islands: SupporterIslandSummary[];
  nextConversation: string;
};

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
  const nextConversation = activeIslands === 0
    ? "可以先邀請學生挑選一座知識島，從一個小主題開始探索。"
    : "可以請學生分享最近最有把握的一個主題，再一起選擇下一個想探索的方向。";
  return { generatedAt: now, totalAttempts: profile.attempts.length, activeIslands, visitedTopics, islands, nextConversation };
}

export function formatSupporterActivity(timestamp: number | null) {
  if (!timestamp) return "尚無作答足跡";
  return new Date(timestamp).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
}
