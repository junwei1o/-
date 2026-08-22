/**
 * 回合制答題戰鬥的框架層狀態機。
 *
 * 此模組不處理 DOM、動畫計時或傷害公式；React 元件只能讀取狀態並派發 action。
 * 每個輸出狀態都會被凍結，降低 UI 直接改寫狀態的風險。
 */
export const BattlePhase = {
  IDLE: "IDLE",
  PLAYER_TURN: "PLAYER_TURN",
  ANIMATING: "ANIMATING",
  ENEMY_TURN: "ENEMY_TURN",
  RESULT: "RESULT",
  REWARD: "REWARD",
} as const;

export type BattlePhase = (typeof BattlePhase)[keyof typeof BattlePhase];
export type BattleResult = "victory" | "defeat" | null;
export type BattleResolution = "ongoing" | "victory" | "defeat";
export type BattleActor = "player" | "enemy";

export type BattleMachineState = Readonly<{
  phase: BattlePhase;
  battleId: string | null;
  round: number;
  result: BattleResult;
  pendingAnimation: Readonly<{ actor: BattleActor; resolution: BattleResolution }> | null;
  lastAction: BattleAction["type"] | null;
}>;

export type BattleAction =
  | { type: "START"; battleId: string }
  | { type: "PLAYER_TURN_RESOLVED"; resolution: BattleResolution }
  | { type: "ENEMY_TURN_RESOLVED"; resolution: BattleResolution }
  | { type: "ANIMATION_FINISHED" }
  | { type: "ACKNOWLEDGE_RESULT" }
  | { type: "COLLECT_REWARD" }
  | { type: "RESET" };

function freezeState(state: Omit<BattleMachineState, "pendingAnimation"> & { pendingAnimation?: { actor: BattleActor; resolution: BattleResolution } | null }): BattleMachineState {
  const pendingAnimation = state.pendingAnimation ? Object.freeze({ ...state.pendingAnimation }) : null;
  return Object.freeze({ ...state, pendingAnimation });
}

export function createBattleState(): BattleMachineState {
  return freezeState({
    phase: BattlePhase.IDLE,
    battleId: null,
    round: 0,
    result: null,
    pendingAnimation: null,
    lastAction: null,
  });
}

function toAnimation(state: BattleMachineState, actor: BattleActor, resolution: BattleResolution, action: BattleAction["type"]): BattleMachineState {
  return freezeState({
    ...state,
    phase: BattlePhase.ANIMATING,
    pendingAnimation: { actor, resolution },
    lastAction: action,
  });
}

/**
 * 純 reducer：無效 action 會原樣回傳目前狀態，避免 UI 在非預期階段跨越流程。
 */
export function dispatchBattleAction(state: BattleMachineState, action: BattleAction): BattleMachineState {
  if (action.type === "RESET") return createBattleState();

  switch (state.phase) {
    case BattlePhase.IDLE:
      if (action.type !== "START" || !action.battleId.trim()) return state;
      return freezeState({
        phase: BattlePhase.PLAYER_TURN,
        battleId: action.battleId,
        round: 1,
        result: null,
        pendingAnimation: null,
        lastAction: action.type,
      });

    case BattlePhase.PLAYER_TURN:
      if (action.type !== "PLAYER_TURN_RESOLVED") return state;
      return toAnimation(state, "player", action.resolution, action.type);

    case BattlePhase.ENEMY_TURN:
      if (action.type !== "ENEMY_TURN_RESOLVED") return state;
      return toAnimation(state, "enemy", action.resolution, action.type);

    case BattlePhase.ANIMATING:
      if (action.type !== "ANIMATION_FINISHED" || !state.pendingAnimation) return state;
      if (state.pendingAnimation.resolution !== "ongoing") {
        return freezeState({
          ...state,
          phase: BattlePhase.RESULT,
          result: state.pendingAnimation.resolution,
          pendingAnimation: null,
          lastAction: action.type,
        });
      }
      if (state.pendingAnimation.actor === "player") {
        return freezeState({
          ...state,
          phase: BattlePhase.ENEMY_TURN,
          pendingAnimation: null,
          lastAction: action.type,
        });
      }
      return freezeState({
        ...state,
        phase: BattlePhase.PLAYER_TURN,
        round: state.round + 1,
        pendingAnimation: null,
        lastAction: action.type,
      });

    case BattlePhase.RESULT:
      if (action.type !== "ACKNOWLEDGE_RESULT") return state;
      return freezeState({ ...state, phase: BattlePhase.REWARD, lastAction: action.type });

    case BattlePhase.REWARD:
      if (action.type !== "COLLECT_REWARD") return state;
      return createBattleState();
  }
}

export type BattleDispatcher = Readonly<{
  getState: () => BattleMachineState;
  dispatch: (action: BattleAction) => BattleMachineState;
}>;

/**
 * UI 可保存這個容器並只呼叫 dispatch；不可取得可變 state reference。
 */
export function createBattleDispatcher(initialState = createBattleState()): BattleDispatcher {
  let currentState = initialState;
  return Object.freeze({
    getState: () => currentState,
    dispatch: (action: BattleAction) => {
      currentState = dispatchBattleAction(currentState, action);
      return currentState;
    },
  });
}
