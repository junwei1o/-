import { describe, expect, it } from "vitest";
import { isNightHour, nightObservationBonus, nightSkyCaption } from "./nightObservation";

describe("night observation", () => {
  it("夜間時段判斷：18–6 為夜間，6–18 為白天", () => {
    expect(isNightHour(0)).toBe(true);
    expect(isNightHour(5)).toBe(true);
    expect(isNightHour(6)).toBe(false);
    expect(isNightHour(12)).toBe(false);
    expect(isNightHour(17)).toBe(false);
    expect(isNightHour(18)).toBe(true);
    expect(isNightHour(23)).toBe(true);
  });

  it("夜間有金幣與稀有遭遇加成，白天無加成", () => {
    const night = nightObservationBonus(Date.parse("2026-09-16T21:30:00"));
    expect(night.active).toBe(true);
    expect(night.goldBonus).toBeCloseTo(0.2);
    expect(night.rareRateBonus).toBeCloseTo(0.05);
    expect(night.label).toBe("星光加成");

    const day = nightObservationBonus(Date.parse("2026-09-16T10:00:00"));
    expect(day.active).toBe(false);
    expect(day.goldBonus).toBe(0);
    expect(day.rareRateBonus).toBe(0);
    expect(day.label).toBe("無加成");
  });

  it("夜間天文小語依時段變化，白天提示夜間再來", () => {
    expect(nightSkyCaption(21)).toContain("銀河");
    expect(nightSkyCaption(23)).toContain("北極星");
    expect(nightSkyCaption(3)).toContain("金星");
    expect(nightSkyCaption(12)).toContain("夜間再來");
  });
});
