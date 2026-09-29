import { writeStoredJson, removeStoredValue } from "@/utils/storage";

/**
 * 三軸試卷作答進度（重整不遺失）。
 *
 * - 每次作答／換題都寫入，重新整理後自動恢復到同一題。
 * - 完成結算後清除（成績已進排行榜＋學習紀錄，不再需要草稿）。
 * - 同一瀏覽器只保留一份進行中草稿；重開新卷會覆蓋舊草稿。
 */

export const TRI_AXIS_PROGRESS_KEY = "xue-tri-axis-progress-v1";

export type TriAxisAnswerEntry = {
  /** 作答選項索引。 */
  picked: number;
  /** 該題作答時間戳（Date.now）。 */
  answeredAt: number;
};

export type TriAxisProgress = {
  version: 1;
  /** 組卷 seed：恢復時用同 seed 重組，題序與上次一致。 */
  seed: number;
  /** 當前題號（0-based）。 */
  index: number;
  /** 作答內容：questionId → 選項索引＋時間戳。 */
  answers: Record<string, TriAxisAnswerEntry>;
  /** 開始作答時間戳（試卷計時起點）。 */
  startedAt: number;
  /** 最後寫入時間戳。 */
  updatedAt: number;
  /** 當時 deck 的題目 id 序列（用來判斷題庫變化後草稿是否仍有效）。 */
  deckIds: string[];
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidProgress(value: unknown): value is TriAxisProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<TriAxisProgress>;
  return (
    candidate.version === 1 &&
    typeof candidate.seed === "number" &&
    Number.isFinite(candidate.seed) &&
    typeof candidate.index === "number" &&
    candidate.index >= 0 &&
    typeof candidate.answers === "object" &&
    candidate.answers !== null &&
    typeof candidate.startedAt === "number" &&
    Array.isArray(candidate.deckIds)
  );
}

export function loadTriAxisProgress(storage: StorageLike | null = browserStorage()): TriAxisProgress | null {
  if (!storage) return null;
  let raw: string | null = null;
  try {
    raw = storage.getItem(TRI_AXIS_PROGRESS_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // 損壞資料：清掉，避免下次還讀到壞的。
    removeStoredValue(TRI_AXIS_PROGRESS_KEY, storage);
    return null;
  }
  if (!isValidProgress(parsed)) {
    removeStoredValue(TRI_AXIS_PROGRESS_KEY, storage);
    return null;
  }
  return parsed;
}

export function saveTriAxisProgress(
  progress: Omit<TriAxisProgress, "version" | "updatedAt">,
  storage: StorageLike | null = browserStorage(),
): void {
  if (!storage) return;
  writeStoredJson(
    TRI_AXIS_PROGRESS_KEY,
    { ...progress, version: 1 as const, updatedAt: Date.now() },
    storage,
  );
}

export function clearTriAxisProgress(storage: StorageLike | null = browserStorage()): void {
  if (!storage) return;
  removeStoredValue(TRI_AXIS_PROGRESS_KEY, storage);
}

/** mm:ss 格式（排行榜「試卷時間」欄位用）。 */
export function formatElapsedMmSs(elapsedMs: number): string {
  const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
