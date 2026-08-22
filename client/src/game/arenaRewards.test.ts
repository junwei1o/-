import { describe, expect, it } from "vitest";
import { defaultRpgState } from "./rpgStorage";
import { encounterForRegion } from "./rpgData";
import { capturedCompanionId, resolveArenaCapture, settleArenaLoot } from "./arenaRewards";

describe("arena capture and loot", () => {
  it("keeps capture rolls bounded and deterministic when a roll is supplied", () => {
    expect(resolveArenaCapture({ chance: 120, correct: true, roll: 0.94 })).toMatchObject({ success: true, chance: 95, correct: true });
    expect(resolveArenaCapture({ chance: -5, correct: false, roll: 0 })).toMatchObject({ success: false, chance: 0, correct: false });
  });

  it("adds a newly captured encounter exactly once and turns repeats into sample rewards", () => {
    const encounter = encounterForRegion("north");
    const captured = { attempted: true, success: true, chance: 72, correct: true };
    const first = settleArenaLoot(structuredClone(defaultRpgState), encounter, captured);
    expect(first.loot.companionAdded).toBe(true);
    expect(first.state.companions.some((item) => item.id === capturedCompanionId(encounter.id))).toBe(true);
    expect(first.state.coins).toBeGreaterThan(defaultRpgState.coins);
    expect(first.state.energy).toBeGreaterThan(defaultRpgState.energy);

    const repeated = settleArenaLoot(first.state, encounter, captured);
    expect(repeated.loot.companionAdded).toBe(false);
    expect(repeated.loot.duplicateSample).toBe(true);
    expect(repeated.state.companions.filter((item) => item.id === capturedCompanionId(encounter.id))).toHaveLength(1);
  });
});
