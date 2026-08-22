import type { AdaptiveProfile } from "@/game/adaptiveLearning";
import { buildKnowledgeIslandSnapshots, type KnowledgeIslandId, type KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";

export type SupporterTimelineEvent = {
  id: string;
  questionId: string;
  timestamp: number;
  islandId: KnowledgeIslandId;
  subject: KnowledgeIslandSubject;
  islandTitle: string;
  knowledge: string;
  activityLabel: string;
  correct: boolean;
};

export type SupporterLearningTimeline = {
  events: SupporterTimelineEvent[];
  islandsRepresented: KnowledgeIslandSubject[];
};

/**
 * 將已套用篩選條件的真實作答紀錄排序為跨島時間軸；不補造未發生的學習事件。
 */
export function buildSupporterLearningTimeline(profile: AdaptiveProfile, maxEvents = 16): SupporterLearningTimeline {
  const islands = buildKnowledgeIslandSnapshots(profile);
  const islandBySubject = new Map(islands.map((island) => [island.subject, island]));
  const newestFirst = [...profile.attempts]
    .filter((attempt) => islandBySubject.has(attempt.curriculumDomain as KnowledgeIslandSubject))
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, Math.max(1, maxEvents));

  const events = newestFirst
    .reverse()
    .map((attempt, index) => {
      const island = islandBySubject.get(attempt.curriculumDomain as KnowledgeIslandSubject)!;
      return {
        id: `${attempt.questionId}-${attempt.timestamp}-${index}`,
        questionId: attempt.questionId,
        timestamp: attempt.timestamp,
        islandId: island.id,
        subject: island.subject,
        islandTitle: island.title,
        knowledge: attempt.knowledge.find(Boolean) ?? "探索練習",
        activityLabel: attempt.correct ? "完成一次練習" : "留下一筆練習足跡",
        correct: attempt.correct,
      };
    });

  return {
    events,
    islandsRepresented: Array.from(new Set(events.map((event) => event.subject))),
  };
}

export function formatSupporterTimelineTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildSupporterTimelineReadout(timeline: SupporterLearningTimeline) {
  if (timeline.events.length === 0) return "目前範圍內還沒有學習時間軸紀錄。";
  return `時間軸包含 ${timeline.events.length} 筆真實學習足跡，跨越 ${timeline.islandsRepresented.join("、")}島。`;
}
