import { describe, expect, it } from "vitest";
import { speedInsight, toSecondsLabel, type SpeedSummary } from "./TeacherDashboard";

const baseSpeed: SpeedSummary = {
  sampleCount: 20,
  averageMs: 12_000,
  correctAverageMs: 13_000,
  wrongAverageMs: 9_000,
  rushedWrongCount: 0,
  slowCorrectCount: 0,
};

describe("speedInsight", () => {
  it("提示有題 5 秒內答錯（可能是猜的）", () => {
    const speed: SpeedSummary = { ...baseSpeed, rushedWrongCount: 3 };
    const lines = speedInsight(speed);
    expect(lines).toContain("有 3 題 5 秒內就答錯，可能是用猜的——建議提醒他先把題目讀完。");
  });

  it("提示有題答對但想超過 20 秒（概念不熟）", () => {
    const speed: SpeedSummary = { ...baseSpeed, slowCorrectCount: 2 };
    const lines = speedInsight(speed);
    expect(lines).toContain(
      "有 2 題答對但想了超過 20 秒，概念還不熟——建議同一題型再練幾次。",
    );
  });

  it("兩者都有就都顯示", () => {
    const speed: SpeedSummary = { ...baseSpeed, rushedWrongCount: 1, slowCorrectCount: 4 };
    const lines = speedInsight(speed);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("5 秒內就答錯");
    expect(lines[1]).toContain("想了超過 20 秒");
  });

  it("都沒有時，若答錯平均明顯比答對快則提示「答錯比答對還快」", () => {
    const speed: SpeedSummary = {
      ...baseSpeed,
      correctAverageMs: 30_000,
      wrongAverageMs: 17_000,
    };
    const lines = speedInsight(speed);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("答錯比答對還快");
  });

  it("都沒有、且速度分布正常時回傳「速度分布正常。」", () => {
    const lines = speedInsight(baseSpeed);
    expect(lines).toEqual(["速度分布正常。"]);
  });

  it("答錯只比答對略快（未達 0.6 倍）不算異常", () => {
    const speed: SpeedSummary = {
      ...baseSpeed,
      correctAverageMs: 20_000,
      wrongAverageMs: 15_000,
    };
    const lines = speedInsight(speed);
    expect(lines).toEqual(["速度分布正常。"]);
  });

  it("答錯平均恰好等於答對的 0.6 倍不視為明顯較快", () => {
    const speed: SpeedSummary = {
      ...baseSpeed,
      correctAverageMs: 20_000,
      wrongAverageMs: 12_000,
    };
    const lines = speedInsight(speed);
    expect(lines).toEqual(["速度分布正常。"]);
  });

  it("rushed 已命中時，不再重複顯示「答錯比答對還快」", () => {
    const speed: SpeedSummary = {
      ...baseSpeed,
      rushedWrongCount: 1,
      correctAverageMs: 30_000,
      wrongAverageMs: 5_000,
    };
    const lines = speedInsight(speed);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("5 秒內就答錯");
  });
});

describe("toSecondsLabel", () => {
  it("把毫秒四捨五入成秒", () => {
    expect(toSecondsLabel(0)).toBe("0");
    expect(toSecondsLabel(2_400)).toBe("2");
    expect(toSecondsLabel(4_600)).toBe("5");
    expect(toSecondsLabel(12_000)).toBe("12");
  });
});
