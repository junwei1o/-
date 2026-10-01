/**
 * 請求統計（2026-10-01，站長後台用）。
 *
 * 為什麼需要：站長要判斷「站點現在忙不忙、有沒有在噴錯」，最直接的訊號是
 * HTTP 回應的分布（2xx/4xx/5xx）與耗時，而不是只看資料庫用量。
 *
 * 隱私與安全邊界（刻意設計）：
 * - **只保留聚合數字**：不記錄路徑、IP、User-Agent、查詢字串——那些既非必要，
 *   又會在後台暴露使用者行為。
 * - 只區分 HTTP 方法（GET/POST…），因為那與「讀或寫」直接相關，屬維運必要資訊。
 * - 全部存在記憶體，重新部署即歸零（與 dbUsage 同一取捨）。
 */

export type RequestStatsSnapshot = {
  startedAt: number;
  uptimeMs: number;
  total: number;
  /** 依狀態碼分級；5xx 是「伺服器自己的錯」，最需要被看見。 */
  byStatusClass: { s2xx: number; s3xx: number; s4xx: number; s5xx: number };
  byMethod: Record<string, number>;
  /** 目前為止最慢的一次請求（毫秒），用來抓偶發的卡頓。 */
  slowestMs: number;
  /** 超過 1 秒的請求次數（粗略的「慢請求」指標）。 */
  slowRequests: number;
};

const SLOW_THRESHOLD_MS = 1_000;

let startedAt = Date.now();
let total = 0;
let s2xx = 0;
let s3xx = 0;
let s4xx = 0;
let s5xx = 0;
let slowestMs = 0;
let slowRequests = 0;
const byMethod = new Map<string, number>();

/** 記錄一次請求。**絕不可拋錯**——它掛在每個請求的收尾路徑上。 */
export function recordRequest(input: { method?: string; status?: number; durationMs?: number } = {}): void {
  try {
    total += 1;
    const status = Number(input.status);
    if (Number.isFinite(status)) {
      if (status >= 500) s5xx += 1;
      else if (status >= 400) s4xx += 1;
      else if (status >= 300) s3xx += 1;
      else s2xx += 1;
    }
    const method = typeof input.method === "string" && input.method ? input.method.toUpperCase() : "OTHER";
    byMethod.set(method, (byMethod.get(method) ?? 0) + 1);

    const duration = Number(input.durationMs);
    if (Number.isFinite(duration) && duration >= 0) {
      if (duration > slowestMs) slowestMs = duration;
      if (duration >= SLOW_THRESHOLD_MS) slowRequests += 1;
    }
  } catch {
    /* 統計失敗不影響請求本身 */
  }
}

export function getRequestStats(now: number = Date.now()): RequestStatsSnapshot {
  return {
    startedAt,
    uptimeMs: Math.max(0, now - startedAt),
    total,
    byStatusClass: { s2xx, s3xx, s4xx, s5xx },
    byMethod: Object.fromEntries(Array.from(byMethod.entries()).sort((a, b) => b[1] - a[1])),
    slowestMs,
    slowRequests,
  };
}

/** 測試用：重置計數器。 */
export function resetRequestStatsForTest(at: number = Date.now()): void {
  startedAt = at;
  total = 0;
  s2xx = 0;
  s3xx = 0;
  s4xx = 0;
  s5xx = 0;
  slowestMs = 0;
  slowRequests = 0;
  byMethod.clear();
}

/** 慢請求門檻（供說明文案使用，避免前端與後端各寫一份）。 */
export const REQUEST_SLOW_THRESHOLD_MS = SLOW_THRESHOLD_MS;
