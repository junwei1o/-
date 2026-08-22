import { describe, expect, it } from "vitest";
import { BattlePhase, createBattleDispatcher, createBattleState, dispatchBattleAction } from "./battleState";

describe("battle state machine", () => {
  it("follows the successful strict flow from IDLE through REWARD", () => {
    const idle = createBattleState();
    const playerTurn = dispatchBattleAction(idle, { type: "START", battleId: "north-language" });
    const animating = dispatchBattleAction(playerTurn, { type: "PLAYER_TURN_RESOLVED", resolution: "victory" });
    const result = dispatchBattleAction(animating, { type: "ANIMATION_FINISHED" });
    const reward = dispatchBattleAction(result, { type: "ACKNOWLEDGE_RESULT" });
    const completed = dispatchBattleAction(reward, { type: "COLLECT_REWARD" });

    expect(playerTurn).toMatchObject({ phase: BattlePhase.PLAYER_TURN, battleId: "north-language", round: 1 });
    expect(animating).toMatchObject({ phase: BattlePhase.ANIMATING, pendingAnimation: { actor: "player", resolution: "victory" } });
    expect(result).toMatchObject({ phase: BattlePhase.RESULT, result: "victory" });
    expect(reward.phase).toBe(BattlePhase.REWARD);
    expect(completed).toEqual(createBattleState());
  });

  it("returns to the player only after the player and enemy animation sequence completes", () => {
    const playerTurn = dispatchBattleAction(createBattleState(), { type: "START", battleId: "east-science" });
    const enemyTurn = dispatchBattleAction(
      dispatchBattleAction(playerTurn, { type: "PLAYER_TURN_RESOLVED", resolution: "ongoing" }),
      { type: "ANIMATION_FINISHED" },
    );
    const nextPlayerTurn = dispatchBattleAction(
      dispatchBattleAction(enemyTurn, { type: "ENEMY_TURN_RESOLVED", resolution: "ongoing" }),
      { type: "ANIMATION_FINISHED" },
    );

    expect(enemyTurn.phase).toBe(BattlePhase.ENEMY_TURN);
    expect(nextPlayerTurn).toMatchObject({ phase: BattlePhase.PLAYER_TURN, round: 2, battleId: "east-science" });
  });

  it("blocks invalid cross-phase actions and freezes the exposed state", () => {
    const idle = createBattleState();
    const untouched = dispatchBattleAction(idle, { type: "ACKNOWLEDGE_RESULT" });
    const active = dispatchBattleAction(idle, { type: "START", battleId: "south-social" });
    const stillActive = dispatchBattleAction(active, { type: "ENEMY_TURN_RESOLVED", resolution: "ongoing" });
    const animating = dispatchBattleAction(active, { type: "PLAYER_TURN_RESOLVED", resolution: "ongoing" });

    expect(untouched).toBe(idle);
    expect(stillActive).toBe(active);
    expect(Object.isFrozen(active)).toBe(true);
    expect(Object.isFrozen(animating.pendingAnimation)).toBe(true);
  });

  it("keeps transition ownership in the dispatcher and resets safely from any phase", () => {
    const battle = createBattleDispatcher();
    battle.dispatch({ type: "START", battleId: "central-math" });
    battle.dispatch({ type: "PLAYER_TURN_RESOLVED", resolution: "defeat" });
    battle.dispatch({ type: "RESET" });

    expect(battle.getState()).toEqual(createBattleState());
  });
});
