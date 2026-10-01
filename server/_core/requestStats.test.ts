import { beforeEach, describe, expect, it } from "vitest";
import { REQUEST_SLOW_THRESHOLD_MS, getRequestStats, recordRequest, resetRequestStatsForTest } from "./requestStats";
import { resetSpeechBreaker } from "../tts";

beforeEach(() => {
  resetRequestStatsForTest();
});

describe("請求統計：聚合計數", () => {
  it("依狀態碼分級累計", () => {
    recordRequest({ method: "GET", status: 200, durationMs: 10 });
    recordRequest({ method: "POST", status: 302, durationMs: 20 });
    recordRequest({ method: "GET", status: 404, durationMs: 30 });
    recordRequest({ method: "GET", status: 500, durationMs: 40 });
    const stats = getRequestStats();
    expect(stats.total).toBe(4);
    expect(stats.byStatusClass).toEqual({ s2xx: 1, s3xx: 1, s4xx: 1, s5xx: 1 });
    expect(stats.byMethod).toEqual({ GET: 3, POST: 1 });
  });

  it("慢請求依門檻計數，最慢值取最大", () => {
    recordRequest({ method: "GET", status: 200, durationMs: REQUEST_SLOW_THRESHOLD_MS - 1 });
    recordRequest({ method: "GET", status: 200, durationMs: REQUEST_SLOW_THRESHOLD_MS });
    recordRequest({ method: "GET", status: 200, durationMs: 4_200 });
    const stats = getRequestStats();
    expect(stats.slowRequests).toBe(2); // 剛好達門檻＋超過門檻
    expect(stats.slowestMs).toBe(4_200);
  });

  it("⭐ 絕不因異常輸入而拋錯（它掛在每個請求的收尾路徑）", () => {
    expect(() => recordRequest({ method: undefined, status: Number.NaN, durationMs: -5 })).not.toThrow();
    expect(() => recordRequest({ method: "", status: 200 })).not.toThrow();
    const stats = getRequestStats();
    expect(stats.total).toBe(2);
    // 無法判斷狀態碼的請求不會被硬歸類
    expect(stats.byStatusClass).toEqual({ s2xx: 1, s3xx: 0, s4xx: 0, s5xx: 0 });
    // 兩筆都無法識別方法（undefined 與空字串）→ 都歸 OTHER
    expect(stats.byMethod).toEqual({ OTHER: 2 });
  });

  it("方法以大小寫無關的方式正規化", () => {
    recordRequest({ method: "get", status: 200 });
    recordRequest({ method: "GET", status: 200 });
    expect(getRequestStats().byMethod).toEqual({ GET: 2 });
  });

  it("只保留聚合數字——快照不含路徑、IP 或使用者代理欄位", () => {
    recordRequest({ method: "GET", status: 200, durationMs: 5 });
    const serialized = JSON.stringify(getRequestStats());
    expect(serialized).not.toMatch(/path|url|ip|user-agent|referer/i);
  });
});

describe("resetSpeechBreaker：維運操作", () => {
  it("重設後回報零失敗、零冷卻，且可重複呼叫", () => {
    expect(resetSpeechBreaker()).toEqual({ failures: 0, brokenForMs: 0 });
    expect(resetSpeechBreaker()).toEqual({ failures: 0, brokenForMs: 0 });
  });
});
