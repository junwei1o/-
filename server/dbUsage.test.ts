import { beforeEach, describe, expect, it } from "vitest";
import {
  RU_BASE_PER_STATEMENT,
  RU_PER_ROW,
  RU_QUOTA_PER_MONTH,
  classifyUsage,
  countRowsFromResult,
  estimateRu,
  getDbUsageStatus,
  instrumentPool,
  recordDbOperation,
  resetDbUsageForTest,
  sustainableRuPerHour,
} from "./dbUsage";

beforeEach(() => {
  resetDbUsageForTest();
});

describe("RU 推估模型", () => {
  it("語句數與列數各自計價", () => {
    expect(estimateRu(0, 0)).toBe(0);
    expect(estimateRu(1, 0)).toBe(RU_BASE_PER_STATEMENT);
    expect(estimateRu(0, 10)).toBeCloseTo(10 * RU_PER_ROW, 6);
    expect(estimateRu(3, 20)).toBeCloseTo(3 * RU_BASE_PER_STATEMENT + 20 * RU_PER_ROW, 6);
  });

  it("非法輸入不會產生 NaN（回 0）", () => {
    expect(estimateRu(Number.NaN, 10)).toBeCloseTo(10 * RU_PER_ROW, 6);
    expect(estimateRu(-5, -5)).toBe(0);
  });

  it("可持續速度＝月額度 ÷ (30×24) 小時", () => {
    expect(sustainableRuPerHour(RU_QUOTA_PER_MONTH)).toBeCloseTo(RU_QUOTA_PER_MONTH / 720, 6);
    // 5000 萬 ÷ 720 ≈ 69,444 RU/小時
    expect(Math.round(sustainableRuPerHour())).toBe(69444);
  });
});

describe("countRowsFromResult：從 mysql2 回傳值粗估列數", () => {
  it("SELECT 回傳 [rows, fields] → 取列數", () => {
    expect(countRowsFromResult([[{ id: 1 }, { id: 2 }, { id: 3 }], []])).toBe(3);
    expect(countRowsFromResult([[], []])).toBe(0);
  });

  it("寫入回傳 OkPacket → 取 affectedRows", () => {
    expect(countRowsFromResult([{ affectedRows: 7 }, []])).toBe(7);
    expect(countRowsFromResult([{ affectedRows: 0 }, []])).toBe(0);
  });

  it("形狀不符或例外一律回 0（不得影響主要流程）", () => {
    expect(countRowsFromResult(null)).toBe(0);
    expect(countRowsFromResult(undefined)).toBe(0);
    expect(countRowsFromResult("字串")).toBe(0);
    expect(countRowsFromResult(42)).toBe(0);
    expect(countRowsFromResult({ 奇怪的物件: true })).toBe(0);
  });
});

describe("classifyUsage：依消耗速度分級", () => {
  it("未知速度 → unknown（資料累積中）", () => {
    expect(classifyUsage(null)).toBe("unknown");
    expect(classifyUsage(Number.NaN)).toBe("unknown");
  });

  it("依「目前速度 vs 可持續速度」分級", () => {
    const budget = sustainableRuPerHour();
    expect(classifyUsage(budget * 0.1)).toBe("ok");
    expect(classifyUsage(budget * 0.6)).toBe("watch");
    expect(classifyUsage(budget * 0.95)).toBe("watch");
    expect(classifyUsage(budget)).toBe("high");
    expect(classifyUsage(budget * 10)).toBe("high");
  });
});

describe("累計與快照", () => {
  it("recordDbOperation 會累計語句、列數與失敗數", () => {
    recordDbOperation({ rows: 5 });
    recordDbOperation({ rows: 10 });
    recordDbOperation({ rows: 0, failed: true });
    const status = getDbUsageStatus();
    expect(status.statements).toBe(3);
    expect(status.failedStatements).toBe(1);
    expect(status.rowsTouched).toBe(15);
    expect(status.estimatedRu).toBeCloseTo(estimateRu(3, 15), 6);
  });

  it("存活時間不足 5 分鐘時不外推（回 null，避免樣本太少爆走）", () => {
    const boot = Date.now();
    resetDbUsageForTest(boot);
    recordDbOperation({ rows: 100, at: boot + 1000 });
    const early = getDbUsageStatus(boot + 60_000); // 1 分鐘
    expect(early.ruPerHour).toBeNull();
    expect(early.projectedMonthlyRu).toBeNull();
    expect(early.level).toBe("unknown");
  });

  it("存活足夠後給出每小時速度與外推月用量", () => {
    const boot = Date.now();
    resetDbUsageForTest(boot);
    // 10 小時內累計：每小時 1000 語句、0 列 → 每小時 1000 RU
    for (let hour = 0; hour < 10; hour += 1) {
      for (let i = 0; i < 1000; i += 1) recordDbOperation({ rows: 0, at: boot + hour * 3_600_000 + i });
    }
    const status = getDbUsageStatus(boot + 10 * 3_600_000);
    expect(status.ruPerHour).toBeCloseTo(1000, 0);
    expect(status.projectedMonthlyRu).toBeCloseTo(1000 * 24 * 30, 0);
    expect(status.level).toBe("ok");
    expect(status.percentOfQuota).toBeGreaterThan(0);
  });

  it("高消耗速度會被判為 high", () => {
    const boot = Date.now();
    resetDbUsageForTest(boot);
    // 1 小時內就打爆月額度 → 速度遠超可持續值
    for (let i = 0; i < 60_000; i += 1) recordDbOperation({ rows: 1000, at: boot + i });
    const status = getDbUsageStatus(boot + 3_600_000);
    expect(status.level).toBe("high");
    expect(status.projectedMonthlyRu).toBeGreaterThan(RU_QUOTA_PER_MONTH);
  });

  it("狀態快照含 24 個分桶，且不含任何敏感資訊", () => {
    const status = getDbUsageStatus();
    expect(status.recentBuckets).toHaveLength(24);
    const serialized = JSON.stringify(status);
    expect(serialized).not.toMatch(/DATABASE_URL|mysql:\/\/|password|SELECT|INSERT/i);
    expect(status.source).toBe("estimate");
    expect(status.quota.label).toBe("5000 萬 RU/月");
  });
});

describe("instrumentPool：計量不得改變資料庫行為（最重要）", () => {
  it("包裝後回傳值完全相同（Promise 與同步值都要原樣）", async () => {
    const pool = {
      query: () => Promise.resolve([[{ id: 1 }], []]),
      execute: () => "同步值",
    };
    instrumentPool(pool);
    await expect(pool.query()).resolves.toEqual([[{ id: 1 }], []]);
    expect(pool.execute()).toBe("同步值");
  });

  it("包裝後例外必須原樣拋出（不可被吞掉）", async () => {
    const boom = new Error("資料庫掛了");
    const pool = {
      query: () => Promise.reject(boom),
      execute: () => {
        throw boom;
      },
    };
    instrumentPool(pool);
    await expect(pool.query()).rejects.toBe(boom);
    expect(() => pool.execute()).toThrow(boom);
  });

  it("計數 query 與 execute 的語句數與列數", async () => {
    const pool = {
      query: () => Promise.resolve([[{ a: 1 }, { a: 2 }], []]),
      execute: () => Promise.resolve([{ affectedRows: 3 }, []]),
    };
    instrumentPool(pool);
    await pool.query();
    await pool.execute();
    const status = getDbUsageStatus();
    expect(status.statements).toBe(2);
    expect(status.rowsTouched).toBe(5); // 2 列 + 3 受影響列
  });

  it("⭐ 必須涵蓋 getConnection 路徑（drizzle 會走，只包 pool 會漏）", async () => {
    const connection = {
      query: () => Promise.resolve([[{ x: 1 }, { x: 2 }, { x: 3 }], []]),
      execute: () => Promise.resolve([{ affectedRows: 1 }, []]),
    };
    const pool = {
      query: () => Promise.resolve([[], []]),
      execute: () => Promise.resolve([{ affectedRows: 0 }, []]),
      getConnection: () => Promise.resolve(connection),
    };
    instrumentPool(pool);

    const conn = (await pool.getConnection()) as typeof connection;
    await conn.query();
    await conn.execute();

    const status = getDbUsageStatus();
    expect(status.statements).toBe(2);
    expect(status.rowsTouched).toBe(4); // 3 列 + 1 受影響列
  });

  it("重複 instrumentPool 不會重複計數（pooled connection 會被重複取得）", async () => {
    const connection = { query: () => Promise.resolve([[{ x: 1 }], []]), execute: () => Promise.resolve([[], []]) };
    const pool = {
      query: () => Promise.resolve([[{ y: 1 }], []]),
      execute: () => Promise.resolve([{ affectedRows: 0 }, []]),
      getConnection: () => Promise.resolve(connection),
    };
    instrumentPool(pool);
    instrumentPool(pool); // 第二次應為 no-op
    await pool.query();
    await pool.query();
    const conn = (await pool.getConnection()) as typeof connection;
    await conn.query();
    instrumentPool(pool); // 再次呼叫仍不應重複包裝
    await conn.query();
    expect(getDbUsageStatus().statements).toBe(4);
  });

  it("pool 形狀異常時不拋錯（計量層失敗不可影響啟用）", () => {
    expect(() => instrumentPool({} as object)).not.toThrow();
    expect(() => instrumentPool({ query: "不是函式" } as unknown as object)).not.toThrow();
  });
});
