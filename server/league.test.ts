import { describe, expect, it } from "vitest";

// 每週聯盟賽的週期計算：台北時區週一 00:00 為起點（與 routers.ts 同邏輯）。
function weekStartOf(now: Date): { weekStart: number; weekKey: string } {
  const taipeiNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const day = taipeiNow.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const monday = new Date(Date.UTC(taipeiNow.getUTCFullYear(), taipeiNow.getUTCMonth(), taipeiNow.getUTCDate() - daysSinceMonday));
  const weekStart = new Date(monday.getTime() - 8 * 60 * 60 * 1000);
  const weekKey = `${monday.getUTCFullYear()}-W${String(Math.floor((monday.getUTCDate() - 1) / 7) + 1).padStart(2, "0")}`;
  return { weekStart: weekStart.getTime(), weekKey };
}

describe("每週聯盟賽週期", () => {
  it("週三的週起點是當週週一 00:00（台北時間）", () => {
    // 2026-09-16 是週三（台北時間）。
    const now = new Date("2026-09-16T12:00:00+08:00");
    const { weekStart } = weekStartOf(now);
    expect(new Date(weekStart).toISOString()).toBe("2026-09-13T16:00:00.000Z"); // 台北 09-14 00:00
  });

  it("週日的週起點仍是當週週一", () => {
    const now = new Date("2026-09-20T08:00:00+08:00"); // 週日
    const { weekStart } = weekStartOf(now);
    expect(new Date(weekStart).toISOString()).toBe("2026-09-13T16:00:00.000Z");
  });

  it("週一起點落在週一（跨日後立即重啟）", () => {
    const now = new Date("2026-09-21T00:30:00+08:00"); // 下週一凌晨
    const { weekStart } = weekStartOf(now);
    expect(new Date(weekStart).toISOString()).toBe("2026-09-20T16:00:00.000Z"); // 台北 09-21 00:00
  });

  it("週Key格式為 YYYY-Www", () => {
    const now = new Date("2026-09-16T12:00:00+08:00");
    const { weekKey } = weekStartOf(now);
    expect(weekKey).toMatch(/^\d{4}-W\d{2}$/);
  });
});
