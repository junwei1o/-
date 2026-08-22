import { describe, expect, it } from "vitest";
import { arenaHabitatStatuses, encounterForArenaHabitat, selectArenaHabitat } from "./arenaHabitats";
import { defaultRpgState } from "./rpgStorage";

describe("arena habitats", () => {
  it("keeps the starter habitat available and locks other habitats until real regional answers are recorded", () => {
    const habitats = arenaHabitatStatuses(defaultRpgState);
    expect(habitats.find((item) => item.id === "tidal-grove")?.unlocked).toBe(true);
    expect(habitats.find((item) => item.id === "cloud-shelf")?.unlocked).toBe(false);
    expect(selectArenaHabitat(defaultRpgState, "cloud-shelf")).toBe(defaultRpgState);
  });

  it("unlocks a habitat from its regional answer progress and preserves the selection without changing rewards", () => {
    const state = { ...defaultRpgState, academyProgress: { central: { correctAnswers: 3, bossVictories: 0 } } };
    const selected = selectArenaHabitat(state, "cloud-shelf");
    expect(selected.arenaHabitatId).toBe("cloud-shelf");
    expect(selected.currentRegion).toBe("central");
    expect(selected.energy).toBe(state.energy);
    expect(selected.coins).toBe(state.coins);
  });

  it("only enables a rare encounter when the documented learning conditions are met and supports deterministic rolls", () => {
    const incomplete = { ...defaultRpgState, academyProgress: { north: { correctAnswers: 4, bossVictories: 0 } } };
    expect(encounterForArenaHabitat(incomplete, "tidal-grove", 0).rare).toBe(false);

    const ready = { ...defaultRpgState, academyProgress: { north: { correctAnswers: 5, bossVictories: 0 } } };
    const rare = encounterForArenaHabitat(ready, "tidal-grove", 0);
    const common = encounterForArenaHabitat(ready, "tidal-grove", 0.99);
    expect(rare.rare).toBe(true);
    expect(rare.encounter.id).toBe("tide-wisp");
    expect(common.rare).toBe(false);
    expect(common.encounter.id).toBe("moss-mote");
  });

  it("requires both regional answers and the extra study condition for later rare encounters", () => {
    const withoutBoss = { ...defaultRpgState, academyProgress: { central: { correctAnswers: 6, bossVictories: 0 } } };
    const withBoss = { ...defaultRpgState, academyProgress: { central: { correctAnswers: 6, bossVictories: 1 } } };
    expect(encounterForArenaHabitat(withoutBoss, "cloud-shelf", 0).rare).toBe(false);
    expect(encounterForArenaHabitat(withBoss, "cloud-shelf", 0).encounter.id).toBe("ember-ibis");
  });
});
