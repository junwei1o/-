/**
 * 三軸試卷排行榜視圖：分數由高至低，同分以耗時較短者優先。
 *
 * 資料來源是既有的 examLeaderboard（跨所有作答者，含遊客）；
 * 這裡只做「三軸混編試卷」scope 的篩選＋需求排序，不改後端。
 */

export type TriBoardRow = {
  id: number;
  name: string;
  subject: string;
  totalQuestions: number;
  correctCount: number;
  /** 試卷總耗時（秒），null 表示舊資料未記錄。 */
  durationSec: number | null;
  /** 完成時間戳。 */
  createdAt: number;
};

export type TriBoardEntry = TriBoardRow & {
  /** 本次排名（1-based，同分同耗時並列時占同一名次）。 */
  rank: number;
};

function accuracyRate(row: TriBoardRow): number {
  return row.totalQuestions > 0 ? row.correctCount / row.totalQuestions : 0;
}

function durationOrInfinity(row: TriBoardRow): number {
  // 未記錄耗時視為無限大，排在有記錄的後面（鼓勵完整計時）。
  return typeof row.durationSec === "number" ? row.durationSec : Number.POSITIVE_INFINITY;
}

/**
 * 三軸榜排序：分數（正確率）高→低；同分比耗時短→先；再同則先完成者先。
 * 排名並列：完全同分＋同耗時才並列（competition ranking，跳號：1,1,3）。
 */
export function sortTriBoard(rows: readonly TriBoardRow[]): TriBoardEntry[] {
  const sorted = [...rows].sort((a, b) => {
    const rateGap = accuracyRate(b) - accuracyRate(a);
    if (rateGap !== 0) return rateGap;
    const correctGap = b.correctCount - a.correctCount;
    if (correctGap !== 0) return correctGap;
    const durationGap = durationOrInfinity(a) - durationOrInfinity(b);
    if (durationGap !== 0) return durationGap;
    return a.createdAt - b.createdAt;
  });
  let rank = 0;
  let lastKey = "";
  return sorted.map((row, index) => {
    const key = `${accuracyRate(row).toFixed(6)}|${row.correctCount}|${durationOrInfinity(row)}`;
    if (key !== lastKey) {
      rank = index + 1;
      lastKey = key;
    }
    return { ...row, rank };
  });
}

/** mm:ss 格式（排行榜「試卷時間」欄位用）。 */
export function formatDurationMmSs(durationSec: number | null | undefined): string {
  if (durationSec === null || durationSec === undefined) return "未記錄";
  const totalSec = Math.max(0, Math.floor(durationSec));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** 查詢參數名（完成時間顯示用，與 AnswerLeaderboard 共用格式即可）。 */
export function formatFinishTime(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}/${month}/${day} ${hour}:${minute}`;
}
