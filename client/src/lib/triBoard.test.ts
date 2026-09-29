import { describe, expect, it } from "vitest";
import { formatDurationMmSs, sortTriBoard, type TriBoardRow } from "./triBoard";

function row(overrides: Partial<TriBoardRow> & { id: number; name: string }): TriBoardRow {
  return {
    subject: "三軸混編試卷",
    totalQuestions: 12,
    correctCount: 10,
    durationSec: 300,
    createdAt: 1000,
    ...overrides,
  };
}

describe("三軸榜排序：分數高→低，同分耗時短優先", () => {
  it("正確率高者在前", () => {
    const rows = [row({ id: 1, name: "甲", correctCount: 8 }), row({ id: 2, name: "乙", correctCount: 10 })];
    const sorted = sortTriBoard(rows);
    expect(sorted.map((entry) => entry.name)).toEqual(["乙", "甲"]);
    expect(sorted[0].rank).toBe(1);
    expect(sorted[1].rank).toBe(2);
  });

  it("同分時耗時短者在前", () => {
    const rows = [
      row({ id: 1, name: "慢", correctCount: 10, durationSec: 600 }),
      row({ id: 2, name: "快", correctCount: 10, durationSec: 300 }),
    ];
    const sorted = sortTriBoard(rows);
    expect(sorted.map((entry) => entry.name)).toEqual(["快", "慢"]);
  });

  it("完全同分同耗時並列同名次（competition ranking，跳號 1,1,3）", () => {
    const rows = [
      row({ id: 1, name: "甲", correctCount: 10, durationSec: 300, createdAt: 1000 }),
      row({ id: 2, name: "乙", correctCount: 10, durationSec: 300, createdAt: 1000 }),
      row({ id: 3, name: "丙", correctCount: 8, durationSec: 200 }),
    ];
    const sorted = sortTriBoard(rows);
    expect(sorted[0].rank).toBe(1);
    expect(sorted[1].rank).toBe(1);
    expect(sorted[2].rank).toBe(3);
  });

  it("未記錄耗時排在有記錄的後面", () => {
    const rows = [
      row({ id: 1, name: "無", correctCount: 10, durationSec: null }),
      row({ id: 2, name: "有", correctCount: 10, durationSec: 900 }),
    ];
    const sorted = sortTriBoard(rows);
    expect(sorted.map((entry) => entry.name)).toEqual(["有", "無"]);
  });
});

describe("試卷時間 mm:ss", () => {
  it("不足一分鐘補零", () => {
    expect(formatDurationMmSs(5)).toBe("00:05");
    expect(formatDurationMmSs(59)).toBe("00:59");
  });

  it("超過一分鐘正常進位", () => {
    expect(formatDurationMmSs(65)).toBe("01:05");
    expect(formatDurationMmSs(600)).toBe("10:00");
  });

  it("未記錄顯示未記錄", () => {
    expect(formatDurationMmSs(null)).toBe("未記錄");
    expect(formatDurationMmSs(undefined)).toBe("未記錄");
  });
});
