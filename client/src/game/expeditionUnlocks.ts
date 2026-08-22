import type { RegionKey } from "@/lib/mapRegions";

export type ExpeditionChapterKey = RegionKey | "academy";

export type ExpeditionChapter = {
  key: ExpeditionChapterKey;
  title: string;
  subtitle: string;
  coverSrc: string;
  badgeSrc: string;
  unlockTarget: number;
  unlockLabel: string;
  regionKey?: RegionKey;
};

export type ExpeditionChapterProgress = ExpeditionChapter & {
  answered: number;
  percent: number;
  unlocked: boolean;
  badgeCollected: boolean;
};

export const EXPEDITION_CHAPTERS: readonly ExpeditionChapter[] = [
  {
    key: "north",
    title: "北境觀測章",
    subtitle: "霧嶺港灣的第一枚座標",
    coverSrc: "/manus-storage/academy-chapter-covers_e6f99067.png",
    badgeSrc: "/manus-storage/academy-collectible-badges_3f7018ea.png",
    unlockTarget: 3,
    unlockLabel: "答對 3 題北部區域題",
    regionKey: "north",
  },
  {
    key: "central",
    title: "河谷追跡章",
    subtitle: "沿著水路讀懂土地",
    coverSrc: "/manus-storage/academy-chapter-covers_e6f99067.png",
    badgeSrc: "/manus-storage/academy-collectible-badges_3f7018ea.png",
    unlockTarget: 6,
    unlockLabel: "累積答對 6 題中部區域題",
    regionKey: "central",
  },
  {
    key: "east",
    title: "星海地層章",
    subtitle: "在山脈與海岸追蹤時間",
    coverSrc: "/manus-storage/academy-chapter-covers_e6f99067.png",
    badgeSrc: "/manus-storage/academy-collectible-badges_3f7018ea.png",
    unlockTarget: 9,
    unlockLabel: "累積答對 9 題東部區域題",
    regionKey: "east",
  },
  {
    key: "south",
    title: "潮境守護章",
    subtitle: "記錄暖流、濕地與生命",
    coverSrc: "/manus-storage/academy-chapter-covers_e6f99067.png",
    badgeSrc: "/manus-storage/academy-collectible-badges_3f7018ea.png",
    unlockTarget: 12,
    unlockLabel: "累積答對 12 題南部區域題",
    regionKey: "south",
  },
  {
    key: "academy",
    title: "學苑躍遷章",
    subtitle: "連接所有課綱航線",
    coverSrc: "/manus-storage/academy-chapter-covers_e6f99067.png",
    badgeSrc: "/manus-storage/academy-collectible-badges_3f7018ea.png",
    unlockTarget: 20,
    unlockLabel: "累積答對 20 題課綱題",
  },
] as const;

type QuestionLike = { id: string; area?: string | null };

function answeredForChapter(chapter: ExpeditionChapter, questions: readonly QuestionLike[], completedIds: ReadonlySet<string>) {
  if (!chapter.regionKey) return Array.from(completedIds).filter((id) => questions.some((question) => question.id === id)).length;
  return questions.filter((question) => completedIds.has(question.id) && (question.area ?? "").includes(chapter.regionKey as string)).length;
}

export function calculateExpeditionProgress(questions: readonly QuestionLike[], completedQuestionIds: readonly string[], claimedChapterKeys: readonly ExpeditionChapterKey[] = []) {
  const completedIds = new Set(completedQuestionIds);
  const claimed = new Set(claimedChapterKeys);
  return EXPEDITION_CHAPTERS.map((chapter): ExpeditionChapterProgress => {
    const answered = answeredForChapter(chapter, questions, completedIds);
    const percent = Math.min(100, Math.round((answered / chapter.unlockTarget) * 100));
    return { ...chapter, answered, percent, unlocked: answered >= chapter.unlockTarget, badgeCollected: claimed.has(chapter.key) };
  });
}

export function getExpeditionArtworkPosition(key: ExpeditionChapterKey) {
  return {
    north: "0% 0%",
    central: "50% 0%",
    east: "100% 0%",
    south: "0% 100%",
    academy: "100% 100%",
  }[key];
}
