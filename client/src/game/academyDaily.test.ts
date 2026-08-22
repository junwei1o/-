import { describe, expect, it } from "vitest";
import { academyDayKey, dailyExpeditionForDate } from "./academyDaily";

describe("academy daily expedition", () => {
  it("uses a stable local calendar key", () => {
    expect(academyDayKey(new Date(2026, 7, 14))).toBe("2026-08-14");
  });

  it("creates a deterministic original route linked to one curriculum subject", () => {
    const first = dailyExpeditionForDate("2026-08-14");
    const second = dailyExpeditionForDate("2026-08-14");
    expect(second).toEqual(first);
    expect(["數學", "自然", "社會", "國語"]).toContain(first.routeSubject);
    expect(first.targetCorrectAnswers).toBe(3);
  });
});
