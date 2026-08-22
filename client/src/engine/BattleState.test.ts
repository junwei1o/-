import { describe, expect, it } from "vitest";
import { BattleState, createBattleDispatcher, createBattleMachine } from "./BattleState";

describe("Battle-Quiz FSM", () => {
  it("only advances through dispatch in the requested order", () => {
    const machine = createBattleDispatcher();
    expect(machine.dispatch({ type: "START" }).phase).toBe(BattleState.PLAYER_TURN);
    expect(machine.dispatch({ type: "ANSWER", correct: true, critical: false }).phase).toBe(BattleState.RESULT_SHOW);
    expect(machine.dispatch({ type: "ANIMATION_DONE" }).phase).toBe(BattleState.BATTLE_ANIMATION);
    expect(machine.dispatch({ type: "ANIMATION_DONE" }).phase).toBe(BattleState.REWARD);
  });
  it("resolves a wrong answer through enemy turn and resets after reward", () => {
    const machine = createBattleDispatcher(createBattleMachine());
    machine.dispatch({ type: "START" });
    machine.dispatch({ type: "ANSWER", correct: false, critical: false });
    expect(machine.dispatch({ type: "ANIMATION_DONE" }).phase).toBe(BattleState.ENEMY_TURN);
    expect(machine.dispatch({ type: "ENEMY_DONE" })).toMatchObject({ phase: BattleState.REWARD, outcome: "defeat" });
    expect(machine.dispatch({ type: "CLAIM_REWARD" })).toEqual(createBattleMachine());
  });
  it("stores combo and critical data without exposing mutable state", () => {
    const machine = createBattleDispatcher();
    machine.dispatch({ type: "START" });
    const next = machine.dispatch({ type: "ANSWER", correct: true, critical: true });
    expect(next).toMatchObject({ combo: 1, critical: true });
    expect(Object.isFrozen(next)).toBe(true);
  });
});
