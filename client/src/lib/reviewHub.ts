/**
 * 今日複習中心（Review Hub）的純邏輯層。
 *
 * 目的：把「間隔重複」兩條既有的到期來源收斂成一份可作答的複習清單：
 *   1. spacedReviews —— 答對晉級的 20 分鐘 / 1 天 / 3 天 / 7 天排程（adaptiveLearning.ts）
 *   2. 錯題的 nextReviewDate —— 答錯後 1 天 / 3 天的錯誤複習（adaptiveLearning.ts）
 *
 * 為什麼獨立成模組：這是「學生今天該複習什麼、看到哪一題」的核心判斷，
 * 必須能單獨測試，不能埋在頁面元件裡。組卷時沿用錯題重練的變體替換策略
 * （記憶類錯誤刻意出原題，其餘優先出變體），但作答與學習紀錄一律寫回
 * 原始題目 id，讓間隔節點能正常晉級。
 */
import type { AdaptiveProfile, AdaptiveDifficulty } from "@/game/adaptiveLearning";
import type { PaperQuestion } from "./paperExam";

/** 到期來源：spaced = 間隔排程；error = 錯題複習（nextReviewDate）。 */
export type DueReviewSource = "spaced" | "error";

export type DueReviewItem = {
  questionId: string;
  /** 到期時間戳（毫秒）。 */
  dueAt: number;
  /** spaced 來源的間隔節點（0..3）；error 來源為 null。 */
  intervalIndex: number | null;
  source: DueReviewSource;
};

/** 間隔節點的中文標籤（與 SPACED_REVIEW_INTERVALS_MS 順序一致）。 */
export const SPACED_INTERVAL_LABELS = ["20 分鐘後", "1 天後", "3 天後", "7 天後"] as const;

/** 複習清單的預設上限：一次太多題會讓孩子放棄，先給最有感的 12 題。 */
export const REVIEW_DECK_LIMIT = 12;

export function intervalLabel(item: Pick<DueReviewItem, "source" | "intervalIndex">): string {
  if (
    item.source === "spaced" &&
    item.intervalIndex !== null &&
    item.intervalIndex >= 0 &&
    item.intervalIndex < SPACED_INTERVAL_LABELS.length
  ) {
    return SPACED_INTERVAL_LABELS[item.intervalIndex];
  }
  return "今日複習";
}

/**
 * 收斂兩條到期來源為一份排序去重的複習清單。
 * - spaced 優先：同一題同時在兩條來源時只算一次（間隔節點資訊較完整）。
 * - 依到期時間升冪，超出上限的部分不進清單（明天再來）。
 */
export function collectDueReviews(profile: AdaptiveProfile, now = Date.now(), limit = REVIEW_DECK_LIMIT): DueReviewItem[] {
  const items: DueReviewItem[] = [];
  const seen = new Set<string>();

  const spaced = (profile.spacedReviews ?? []).filter((review) => review.dueAt <= now);
  for (const review of spaced) {
    if (seen.has(review.questionId)) continue;
    seen.add(review.questionId);
    items.push({
      questionId: review.questionId,
      dueAt: review.dueAt,
      intervalIndex: review.intervalIndex,
      source: "spaced",
    });
  }

  // 錯題複習：只看「最新一筆是錯的」且已到期的題目，避免用舊錯誤覆蓋後續已掌握狀態。
  const errorByQuestion = new Map<string, number>();
  for (const attempt of profile.attempts) {
    if (attempt.correct) continue;
    if (typeof attempt.nextReviewDate !== "number" || attempt.nextReviewDate > now) continue;
    errorByQuestion.set(attempt.questionId, attempt.nextReviewDate);
  }
  errorByQuestion.forEach((dueAt, questionId) => {
    if (seen.has(questionId)) return;
    seen.add(questionId);
    items.push({ questionId, dueAt, intervalIndex: null, source: "error" });
  });

  return items.sort((a, b) => a.dueAt - b.dueAt).slice(0, Math.max(1, limit));
}

/** 變體替換函式簽名：與錯題重練共用同一份策略。 */
export type ReviewReplacement = (ctx: {
  source: PaperQuestion;
  usedIds: ReadonlySet<string>;
}) => PaperQuestion | null;

export type ReviewDeckItem = {
  /** 卡片唯一鍵（同題換了變體也是新卡片）。 */
  key: string;
  due: DueReviewItem;
  /** 實際顯示的題目（原題或變體）。 */
  display: PaperQuestion;
  /** 學習／自適應紀錄寫回的原始題目 id（讓間隔節點正常晉級）。 */
  recordQuestionId: string;
  isVariant: boolean;
};

/**
 * 把到期清單組裝成可作答的卡片清單。
 * 題庫裡找不到的題目（尚未載入或已下架）直接跳過，不阻塞其他複習。
 * 變體只影響「顯示」，紀錄一律寫回原始題目 id。
 */
export function buildReviewDeck(
  due: readonly DueReviewItem[],
  bankById: ReadonlyMap<string, PaperQuestion>,
  replace: ReviewReplacement,
): ReviewDeckItem[] {
  const usedIds = new Set<string>();
  const deck: ReviewDeckItem[] = [];
  for (const item of due) {
    const original = bankById.get(item.questionId);
    if (!original) continue;
    const replacement = replace({ source: original, usedIds });
    if (replacement) {
      usedIds.add(replacement.id);
      deck.push({
        key: `${item.questionId}:${replacement.id}`,
        due: item,
        display: replacement,
        recordQuestionId: item.questionId,
        isVariant: replacement.id !== original.id,
      });
    } else {
      usedIds.add(original.id);
      deck.push({
        key: item.questionId,
        due: item,
        display: original,
        recordQuestionId: item.questionId,
        isVariant: false,
      });
    }
  }
  return deck;
}

export type ReviewProgress = {
  total: number;
  answered: number;
  correct: number;
  rate: number;
};

export function reviewProgress(total: number, answered: number, correct: number): ReviewProgress {
  return {
    total: Math.max(0, total),
    answered: Math.max(0, Math.min(total, answered)),
    correct: Math.max(0, Math.min(answered, correct)),
    rate: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}

/** 依間隔節點統計「已排程／已到期」的數量（供進度階梯圖使用）。 */
export function intervalDistribution(
  profile: AdaptiveProfile,
  now = Date.now(),
): Array<{ label: string; scheduled: number; due: number }> {
  const counts = SPACED_INTERVAL_LABELS.map(() => ({ scheduled: 0, due: 0 }));
  for (const review of profile.spacedReviews ?? []) {
    const index = Math.max(0, Math.min(counts.length - 1, Math.floor(review.intervalIndex ?? 0)));
    counts[index].scheduled += 1;
    if (review.dueAt <= now) counts[index].due += 1;
  }
  return counts.map((count, index) => ({ label: SPACED_INTERVAL_LABELS[index], ...count }));
}

export function isAdaptiveDifficulty(value: string | undefined): value is AdaptiveDifficulty {
  return value === "基礎" || value === "標準" || value === "挑戰";
}
