import { describe, expect, it } from "vitest";
import { BattlePhase } from "./battleState";
import { DEFAULT_BATTLE_SIMULATION_COUNT, runBattleSimulations } from "./battleSimulator";

describe("battle stage five simulator", () => {
  it("settles 100 deterministic production-engine battles without invalid HP, stalled state, or stranded dispatcher phases", () => {
    const report = runBattleSimulations(DEFAULT_BATTLE_SIMULATION_COUNT);

    expect(report.requestedBattles).toBe(100);
    expect(report.completedBattles).toBe(100);
    expect(report.integrityIssues).toEqual([]);
    expect(report.records.every((record) => record.finalMachinePhase === BattlePhase.IDLE)).toBe(true);
    expect(report.records.every((record) => record.playerHp >= 0 && record.enemyHp >= 0)).toBe(true);
    expect(report.records.every((record) => record.playerTurns > 0 && record.playerTurns <= 16)).toBe(true);
  });

  it("covers winning, recovery, critical-combo, guardian-disruption, and forced-player-HP-zero outcomes", () => {
    const report = runBattleSimulations(100);

    expect(report.victories).toBeGreaterThan(0);
    expect(report.defeats).toBeGreaterThan(0);
    expect(report.criticalHits).toBeGreaterThan(0);
    expect(report.guardianDisruptions).toBeGreaterThan(0);
    expect(report.longestVictoryStreak).toBeGreaterThan(1);
    expect(report.longestDefeatStreak).toBeGreaterThan(0);
    expect(report.records.some((record) => record.mode === "defeat-check" && record.result === "defeat" && record.playerHp === 0)).toBe(true);
  });

  it("normalizes malformed simulation counts to a safe, completed run", () => {
    const report = runBattleSimulations(Number.NaN);

    expect(report.completedBattles).toBe(DEFAULT_BATTLE_SIMULATION_COUNT);
    expect(report.integrityIssues).toEqual([]);
  });
});
