export const BattleState = {
  IDLE: "IDLE",
  PLAYER_TURN: "PLAYER_TURN",
  RESULT_SHOW: "RESULT_SHOW",
  BATTLE_ANIMATION: "BATTLE_ANIMATION",
  ENEMY_TURN: "ENEMY_TURN",
  REWARD: "REWARD",
} as const;

export type BattlePhase = (typeof BattleState)[keyof typeof BattleState];
export type BattleOutcome = "correct" | "wrong" | "victory" | "defeat" | null;
export type BattleAction =
  | { type: "START" }
  | { type: "ANSWER"; correct: boolean; critical: boolean }
  | { type: "ANIMATION_DONE" }
  | { type: "ENEMY_DONE" }
  | { type: "CLAIM_REWARD" }
  | { type: "RESET" };

export type BattleMachine = Readonly<{
  phase: BattlePhase;
  outcome: BattleOutcome;
  combo: number;
  critical: boolean;
  lastActor: "player" | "enemy" | null;
}>;

const freeze = (state: BattleMachine): BattleMachine => Object.freeze({ ...state });

export const createBattleMachine = (): BattleMachine => freeze({
  phase: BattleState.IDLE,
  outcome: null,
  combo: 0,
  critical: false,
  lastActor: null,
});

export function dispatchBattle(state: BattleMachine, action: BattleAction): BattleMachine {
  if (action.type === "RESET") return createBattleMachine();
  switch (state.phase) {
    case BattleState.IDLE:
      return action.type === "START" ? freeze({ ...state, phase: BattleState.PLAYER_TURN }) : state;
    case BattleState.PLAYER_TURN:
      return action.type === "ANSWER"
        ? freeze({ ...state, phase: BattleState.RESULT_SHOW, outcome: action.correct ? "correct" : "wrong", combo: action.correct ? state.combo + 1 : 0, critical: action.critical, lastActor: "player" })
        : state;
    case BattleState.RESULT_SHOW:
      return action.type === "ANIMATION_DONE"
        ? freeze({ ...state, phase: state.outcome === "correct" ? BattleState.BATTLE_ANIMATION : BattleState.ENEMY_TURN })
        : state;
    case BattleState.BATTLE_ANIMATION:
      return action.type === "ANIMATION_DONE" ? freeze({ ...state, phase: BattleState.REWARD, outcome: "victory" }) : state;
    case BattleState.ENEMY_TURN:
      return action.type === "ENEMY_DONE" ? freeze({ ...state, phase: BattleState.REWARD, outcome: "defeat", lastActor: "enemy" }) : state;
    case BattleState.REWARD:
      return action.type === "CLAIM_REWARD" ? createBattleMachine() : state;
  }
}

export function createBattleDispatcher(initial = createBattleMachine()) {
  let current = initial;
  return Object.freeze({
    getState: () => current,
    dispatch: (action: BattleAction) => {
      current = dispatchBattle(current, action);
      return current;
    },
  });
}
