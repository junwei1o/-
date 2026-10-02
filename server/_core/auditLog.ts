/**
 * 維運操作審計（2026-10-02 第四輪）。
 *
 * 站長後台有會**改變伺服器狀態**的操作（執行健康檢查、重設熔斷）。
 * 這類操作如果沒有紀錄，出了問題就無法回答最基本的問題：
 * 「這是誰做的、什麼時候做的、做了幾次」。
 *
 * 設計取捨：
 * - **只記聚合式的操作名稱與時間，不記參數、不記個體資料**——
 *   審計紀錄本身不該變成另一個隱私問題。
 * - **記憶體環形緩衝**（固定 100 筆）：重啟即歸零是可接受的，
 *   因為部署本身也是一次明確的狀態重置；而把日誌寫進資料庫會新增
 *   一個需要備份與遷移的表，收益不抵成本。
 * - 這是「盡力而為」的紀錄，不是稽核等級的紀錄——誠實標示出來，
 *   不要讓人以為它防得住什麼。
 */

export type AuditEntry = {
  at: number;
  /**
   * 單調遞增的序號。
   *
   * 為什麼需要它：`Date.now()` 只有毫秒解析度，連續兩次操作很可能落在
   * 同一毫秒。此時只靠 `at` 排序會得到**插入順序**（等於 oldest-first），
   * 站長看到的紀錄順序是錯的。序號作為 tiebreaker 讓「後來的永遠在後面」。
   */
  seq: number;
  /** 操作識別碼（例如 `healthCheck`）。 */
  action: string;
  /** 誰做的。站長後台只有一種身分，所以記成「站長」；預留欄位是為了
   * 日後若加了多站長或老師維運權限，不必改資料結構。 */
  actor: string;
  ok: boolean;
  /** 一句話摘要，不含敏感值。 */
  detail: string;
};

const MAX_ENTRIES = 100;

/** 測試用：把容量常數暴露出去，測試不該把數字寫死。 */
export const MAX_AUDIT_ENTRIES_FOR_TEST = MAX_ENTRIES;

let ring: AuditEntry[] = [];
let sequence = 0;

/** 附加一筆審計紀錄。刻意 never throw——審計不該讓主流程失敗。 */
export function recordAudit(action: string, ok: boolean, detail: string, actor = "站長"): void {
  try {
    sequence += 1;
    ring.push({ at: Date.now(), seq: sequence, action, actor, ok, detail: detail.slice(0, 160) });
    if (ring.length > MAX_ENTRIES) ring = ring.slice(-MAX_ENTRIES);
  } catch {
    // 記錄失敗不影響操作本身
  }
}

/** 由新到舊的審計紀錄。 */
export function listAudit(limit = 50): { entries: AuditEntry[]; total: number; capacity: number } {
  // 主要依 seq 由新到舊；seq 單調遞增，時間戳只當顯示用。
  const sorted = [...ring].sort((a, b) => b.seq - a.seq);
  return { entries: sorted.slice(0, Math.max(1, Math.min(limit, MAX_ENTRIES))), total: sorted.length, capacity: MAX_ENTRIES };
}

export function clearAuditForTest(): void {
  ring = [];
  sequence = 0;
}
