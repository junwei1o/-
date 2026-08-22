import { describe, expect, it } from "vitest";
import { buildExpeditionObservations, currentExpeditionObservation } from "./expeditionObservations";
import { defaultRpgState } from "./rpgStorage";

describe("expedition observations", () => {
  it("derives a non-punitive next step from the same habitat unlock rules", () => {
    const observations = buildExpeditionObservations(defaultRpgState);
    const north = observations.find((item) => item.habitatId === "tidal-grove");
    const central = observations.find((item) => item.habitatId === "cloud-shelf");

    expect(north?.unlocked).toBe(true);
    expect(north?.progressPercent).toBe(100);
    expect(central?.unlocked).toBe(false);
    expect(central?.nextStep).toContain("再答對 3 題");
  });

  it("surfaces an earned rare signal without granting an extra reward", () => {
    const state = {
      ...defaultRpgState,
      arenaHabitatId: "tidal-grove" as const,
      academyProgress: { north: { correctAnswers: 5, bossVictories: 0 } },
    };
    const active = currentExpeditionObservation(state);

    expect(active.rareEligible).toBe(true);
    expect(active.nextStep).toContain("稀有觀測訊號已就緒");
    expect(active.companions).toBe(defaultRpgState.companions.filter((item) => item.region === "north").length);
    expect(state.energy).toBe(defaultRpgState.energy);
    expect(state.coins).toBe(defaultRpgState.coins);
  });
});
