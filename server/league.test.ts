import { describe, expect, it } from "vitest";
import { computeLeaguePromotionDemotion, computeLeagueRankReward } from "./db";

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

describe("聯盟賽升降級（computeLeaguePromotionDemotion）", () => {
  function mk(names: string[], group: "bronze" | "silver" | "gold" | "diamond", scores: number[]) {
    return names.map((name, i) => ({ name, groupType: group, score: scores[i] ?? 0 }));
  }

  it("黃金組前 30% 晉升鑽石、後 30% 降白銀、中間不動", () => {
    const entries = mk(["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g10"], "gold", [100, 90, 80, 70, 60, 50, 40, 30, 20, 10]);
    const next = computeLeaguePromotionDemotion(entries);
    expect(next.get("g1")).toBe("diamond");
    expect(next.get("g2")).toBe("diamond");
    expect(next.get("g3")).toBe("diamond"); // floor(10*0.3)=3 人升
    expect(next.get("g5")).toBe("gold");
    expect(next.get("g8")).toBe("silver");
    expect(next.get("g9")).toBe("silver");
    expect(next.get("g10")).toBe("silver"); // 後 30% 3 人降
  });

  it("青銅組不降級：後 30% 仍留在青銅", () => {
    const entries = mk(["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "b10"], "bronze", [100, 90, 80, 70, 60, 50, 40, 30, 20, 10]);
    const next = computeLeaguePromotionDemotion(entries);
    expect(next.get("b1")).toBe("silver");
    expect(next.get("b2")).toBe("silver");
    expect(next.get("b3")).toBe("silver");
    expect(next.get("b8")).toBe("bronze");
    expect(next.get("b10")).toBe("bronze");
  });

  it("鑽石組不晉升：前 30% 留在鑽石，後 30% 降黃金", () => {
    const entries = mk(["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "d10"], "diamond", [100, 90, 80, 70, 60, 50, 40, 30, 20, 10]);
    const next = computeLeaguePromotionDemotion(entries);
    expect(next.get("d1")).toBe("diamond");
    expect(next.get("d2")).toBe("diamond");
    expect(next.get("d3")).toBe("diamond");
    expect(next.get("d8")).toBe("gold");
    expect(next.get("d10")).toBe("gold");
  });

  it("同分時依原順序穩定處理，且每組獨立計算", () => {
    const bronze = mk(["b1", "b2", "b3", "b4"], "bronze", [10, 10, 10, 10]);
    const diamond = mk(["d1", "d2", "d3", "d4"], "diamond", [5, 5, 5, 5]);
    const next = computeLeaguePromotionDemotion([...bronze, ...diamond]);
    expect(next.get("b1")).toBe("silver"); // floor(4*0.3)=1 升
    expect(next.get("b2")).toBe("bronze");
    expect(next.get("d1")).toBe("diamond"); // 頂組不升
    expect(next.get("d4")).toBe("gold"); // floor(4*0.3)=1 降（最後一名）
  });
});

describe("聯盟賽排名獎（computeLeagueRankReward）", () => {
  it("前 10%：500 金幣＋限定徽章", () => {
    const reward = computeLeagueRankReward("gold", 1, 20);
    expect(reward.coins).toBe(500);
    expect(reward.badge).toBe("league-gold-top10");
  });

  it("前 25%：300 金幣＋前 25% 徽章", () => {
    const reward = computeLeagueRankReward("silver", 4, 20);
    expect(reward.coins).toBe(300);
    expect(reward.badge).toBe("league-silver-top25");
  });

  it("前 50%：150 金幣", () => {
    const reward = computeLeagueRankReward("bronze", 9, 20);
    expect(reward.coins).toBe(150);
  });

  it("其餘：50 金幣保底", () => {
    const reward = computeLeagueRankReward("diamond", 19, 20);
    expect(reward.coins).toBe(50);
  });

  it("無效參數回傳 0 金幣", () => {
    expect(computeLeagueRankReward("bronze", 0, 10).coins).toBe(0);
    expect(computeLeagueRankReward("bronze", 3, 0).coins).toBe(0);
  });
});
