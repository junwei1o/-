/**
 * 全站 DB 用量計量與 RU 推估（2026-10-01）。
 *
 * ── 為什麼需要這個模組 ─────────────────────────────────────────────
 * 本站資料庫是 TiDB Cloud（MySQL 相容），它以 **RU（Request Unit）** 計費，
 * 免費層額度為 **5000 萬 RU/月**。RU 會隨 SQL 掃描列數與寫入量成長，
 * 「高頻 API 呼叫、大量寫入」的情境會消耗得特別快。
 *
 * ── ⚠️ 這個數字是「估算」，不是 TiDB 帳單數字 ──────────────────────
 * 真實 RU 只能從 TiDB Cloud 主控台或其 **Cloud API** 取得（需 public/private
 * key 與 cluster id，本站 env 目前沒有這些憑證）。本模組改為**自己計量本站
 * 實際發出的 DB 操作**，再用一個**明示、可調**的模型推估 RU：
 *
 *     estimatedRu = 語句數 × RU_BASE_PER_STATEMENT ＋ 觸及列數 × RU_PER_ROW
 *
 * 因此它最可靠的用途是**相對趨勢與消耗速度**（例如「這一小時的用量是平常的
 * 十倍」），而不是「我這個月用了 123 萬 RU」這種絕對值。
 * 要換成官方數字，見 `describeDataSource()` 與 `DbUsageStatus.source`。
 *
 * ── 已知限制（務必誠實揭露給使用者）──────────────────────────────
 * 1. 計數器存在**記憶體**：每次部署／實例重建即歸零 → 面板上的「期間」是
 *    「本次實例啟動以來」，不是「本月」。
 * 2. 因此月用量是**外推值**（`ruPerHour × 24 × 30`），不是實測月累計。
 * 3. 推估係數是粗估：TiDB 的實際 RU 依掃描列數、索引、網路傳輸而定，
 *    與「語句數＋列數」不會完全成正比。
 */

/** TiDB Cloud Serverless 免費層額度（RU／月）。 */
export const RU_QUOTA_PER_MONTH = 50_000_000;
/** 給使用者看的中文標示。 */
export const RU_QUOTA_LABEL = "5000 萬 RU/月";

/**
 * 推估係數（可調，改這裡即全站生效）。
 * 這兩條是**保守的粗估**，不是 TiDB 官方換算表。
 */
export const RU_BASE_PER_STATEMENT = 1;
export const RU_PER_ROW = 0.1;

/** 每小時一個桶，保留 24 小時，用於「最近消耗速度」。 */
const HOUR_MS = 3_600_000;
const BUCKET_COUNT = 24;
/** 實例存活未滿此時間前不外推（樣本太少，外推會爆走）。 */
const MIN_UPTIME_MS_FOR_RATE = 5 * 60_000;

export type DbUsageWarningLevel = "ok" | "watch" | "high" | "unknown";

export type DbUsageStatus = {
  /** 資料來源：目前一律為自行計量的推估值。 */
  source: "estimate";
  /** 說明資料來源的一句話，直接顯示給使用者。 */
  sourceNote: string;
  quota: { ruPerMonth: number; label: string };
  /** 本次實例啟動時間／已存活毫秒數（面板的統計期間）。 */
  startedAt: number;
  uptimeMs: number;
  statements: number;
  failedStatements: number;
  rowsTouched: number;
  estimatedRu: number;
  /** 佔月額度百分比（0–100，未四捨五入到整數前不夾擠）。 */
  percentOfQuota: number;
  /** 每小時推估 RU；存活時間不足時為 null（資料累積中）。 */
  ruPerHour: number | null;
  /** 依目前速度外推的月用量；ruPerHour 為 null 時同為 null。 */
  projectedMonthlyRu: number | null;
  /** 可持續的每小時額度＝月額度 ÷ (30×24)，用來判斷「速度是否偏高」。 */
  sustainableRuPerHour: number;
  level: DbUsageWarningLevel;
  /** 最近 24 小時的分桶（舊→新），供前端畫趨勢。 */
  recentBuckets: { hourStart: number; ru: number }[];
};

// ── 純函式（可獨立測試，不碰任何全域狀態）────────────────────────────

/** 依模型推估 RU。 */
export function estimateRu(statements: number, rowsTouched: number): number {
  const safeStatements = Number.isFinite(statements) ? Math.max(0, statements) : 0;
  const safeRows = Number.isFinite(rowsTouched) ? Math.max(0, rowsTouched) : 0;
  return safeStatements * RU_BASE_PER_STATEMENT + safeRows * RU_PER_ROW;
}

/**
 * 從 mysql2 的回傳值粗估「觸及列數」。
 * SELECT → 列數；INSERT/UPDATE/DELETE → affectedRows。
 * 形狀不符或任何例外一律回 0（**絕不因計量而影響主要流程**）。
 */
export function countRowsFromResult(result: unknown): number {
  try {
    if (result === null || result === undefined) return 0;
    const first = Array.isArray(result) ? result[0] : result;
    if (Array.isArray(first)) return first.length;
    if (typeof first === "object" && first !== null && "affectedRows" in first) {
      const affected = Number((first as { affectedRows?: unknown }).affectedRows);
      return Number.isFinite(affected) ? Math.max(0, affected) : 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

/** 可持續的每小時 RU 額度。 */
export function sustainableRuPerHour(quotaPerMonth: number = RU_QUOTA_PER_MONTH): number {
  return quotaPerMonth / (30 * 24);
}

/**
 * 依「目前消耗速度 vs 可持續速度」分級。
 * 用速度而不是用累計量，才能回答使用者真正想知道的「照這個速度會不會爆額度」。
 */
export function classifyUsage(
  ruPerHour: number | null,
  quotaPerMonth: number = RU_QUOTA_PER_MONTH,
): DbUsageWarningLevel {
  if (ruPerHour === null || !Number.isFinite(ruPerHour)) return "unknown";
  const budget = sustainableRuPerHour(quotaPerMonth);
  if (budget <= 0) return "unknown";
  const ratio = ruPerHour / budget;
  if (ratio >= 1) return "high";
  if (ratio >= 0.6) return "watch";
  return "ok";
}

// ── 全域計數器（每實例一份，重啟即歸零）──────────────────────────────

let startedAt = Date.now();
let statements = 0;
let failedStatements = 0;
let rowsTouched = 0;
/** 以「桶起始時間」為鍵，避免用陣列索引造成漂移。 */
const buckets = new Map<number, number>();

function bucketStartOf(at: number): number {
  return Math.floor(at / HOUR_MS) * HOUR_MS;
}

/**
 * 記錄一次 DB 操作。**絕對不可拋出**——它是在每個查詢的熱路徑上被呼叫，
 * 一旦拋錯就會把正常的查詢一起弄壞。
 */
export function recordDbOperation(input: { rows?: number; failed?: boolean; at?: number } = {}): void {
  try {
    const at = input.at ?? Date.now();
    statements += 1;
    if (input.failed) failedStatements += 1;
    const rows = Number.isFinite(input.rows) ? Math.max(0, input.rows as number) : 0;
    rowsTouched += rows;

    const key = bucketStartOf(at);
    buckets.set(key, (buckets.get(key) ?? 0) + estimateRu(1, rows));

    // 清掉超過保留範圍的桶（避免長時間執行後無界成長）
    const oldest = bucketStartOf(at) - (BUCKET_COUNT - 1) * HOUR_MS;
    for (const existing of Array.from(buckets.keys())) {
      if (existing < oldest) buckets.delete(existing);
    }
  } catch {
    /* 計量失敗絕不影響主要流程 */
  }
}

/** 測試用：重置全部計數器。 */
export function resetDbUsageForTest(at: number = Date.now()): void {
  startedAt = at;
  statements = 0;
  failedStatements = 0;
  rowsTouched = 0;
  buckets.clear();
}

/** 產生目前狀態快照（給 tRPC 端點與面板用）。 */
export function getDbUsageStatus(now: number = Date.now()): DbUsageStatus {
  const uptimeMs = Math.max(0, now - startedAt);
  const estimatedRu = estimateRu(statements, rowsTouched);
  const uptimeHours = uptimeMs / HOUR_MS;
  const ruPerHour = uptimeMs >= MIN_UPTIME_MS_FOR_RATE && uptimeHours > 0 ? estimatedRu / uptimeHours : null;
  const projectedMonthlyRu = ruPerHour === null ? null : ruPerHour * 24 * 30;

  const recentBuckets: { hourStart: number; ru: number }[] = [];
  const currentBucket = bucketStartOf(now);
  for (let index = BUCKET_COUNT - 1; index >= 0; index -= 1) {
    const key = currentBucket - index * HOUR_MS;
    recentBuckets.push({ hourStart: key, ru: buckets.get(key) ?? 0 });
  }

  return {
    source: "estimate",
    sourceNote: "由本站自行計量 DB 操作推估，非 TiDB Cloud 帳單數字。",
    quota: { ruPerMonth: RU_QUOTA_PER_MONTH, label: RU_QUOTA_LABEL },
    startedAt,
    uptimeMs,
    statements,
    failedStatements,
    rowsTouched,
    estimatedRu,
    percentOfQuota: estimatedRu === 0 ? 0 : (estimatedRu / RU_QUOTA_PER_MONTH) * 100,
    ruPerHour,
    projectedMonthlyRu,
    sustainableRuPerHour: sustainableRuPerHour(),
    level: classifyUsage(ruPerHour),
    recentBuckets,
  };
}

// ── 連線層計量（把計數器接到真實的 DB 操作上）──────────────────────────

/** 標記已包裝過的方法，避免重複包裝（pooled connection 會被重複取得）。 */
const INSTRUMENTED = Symbol("hdmx.dbUsage.instrumented");

/** 已包裝標記的存取（用 symbol 掛在函式上；不改變函式本身的行為）。 */
type SymbolMarked = { [INSTRUMENTED]?: boolean };
function isInstrumented(fn: unknown): boolean {
  return Boolean((fn as SymbolMarked | null | undefined)?.[INSTRUMENTED]);
}
function markInstrumented(fn: unknown): void {
  try {
    (fn as SymbolMarked)[INSTRUMENTED] = true;
  } catch {
    /* 標記失敗只會導致重複包裝，不影響功能 */
  }
}

type AnyFn = (...args: unknown[]) => unknown;

/**
 * 包裝單一方法（query／execute）：計數但不改變任何行為。
 *
 * 設計原則（很重要，這是最熱的路徑）：
 * - **絕不吞掉或改變例外**：失敗時原樣 rethrow。
 * - **絕不改變回傳值**：成功時原樣回傳（Promise 也原樣鏈回）。
 * - **絕不因計量而拋錯**：`recordDbOperation` 內部已自行 try/catch。
 */
function wrapMethod(target: object, method: "query" | "execute"): void {
  try {
    const record = target as Record<string, unknown>;
    const original = record[method];
    if (typeof original !== "function") return;
    if (isInstrumented(original)) return;

    const wrapped = function (this: unknown, ...args: unknown[]): unknown {
      const at = Date.now();
      let result: unknown;
      try {
        result = (original as AnyFn).apply(this, args);
      } catch (error) {
        recordDbOperation({ rows: 0, failed: true, at });
        throw error;
      }
      // 非 Promise（同步回傳）→ 直接記一筆
      if (!result || typeof (result as Promise<unknown>).then !== "function") {
        recordDbOperation({ rows: countRowsFromResult(result), at });
        return result;
      }
      return (result as Promise<unknown>).then(
        (value) => {
          recordDbOperation({ rows: countRowsFromResult(value), at });
          return value;
        },
        (error: unknown) => {
          recordDbOperation({ rows: 0, failed: true, at });
          throw error;
        },
      );
    };
    markInstrumented(wrapped);
    record[method] = wrapped;
  } catch {
    /* 包裝失敗就放棄計量，資料庫功能優先 */
  }
}

/**
 * 在 mysql2 pool 上掛計量。
 *
 * ⚠️ 三個都要包：drizzle 的 mysql2 driver 除了 `client.query`／`client.execute`，
 * 還會走 **`client.getConnection()` 取得連線後再對該連線下 query**
 * （見 `drizzle-orm/mysql2/session.cjs`）。只包 pool 會漏掉那條路徑，
 * 導致計數嚴重偏低。
 */
export function instrumentPool<T extends object>(pool: T): T {
  const record = pool as Record<string, unknown>;
  wrapMethod(pool, "query");
  wrapMethod(pool, "execute");

  try {
    const originalGetConnection = record.getConnection;
    if (typeof originalGetConnection === "function" && !isInstrumented(originalGetConnection)) {
      const wrapped = function (this: unknown, ...args: unknown[]): unknown {
        const result = (originalGetConnection as AnyFn).apply(this, args);
        if (!result || typeof (result as Promise<unknown>).then !== "function") return result;
        return (result as Promise<unknown>).then((connection) => {
          // pooled connection 會被重複取得；wrapMethod 內有防重複標記
          if (connection && typeof connection === "object") {
            wrapMethod(connection, "query");
            wrapMethod(connection, "execute");
          }
          return connection;
        });
      };
      markInstrumented(wrapped);
      record.getConnection = wrapped;
    }
  } catch {
    /* 同上：計量失敗不影響資料庫 */
  }
  return pool;
}
