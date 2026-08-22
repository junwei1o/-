import type { BattlePendingAction, BattlePerformance, BattleRageSkill, BattleState, Companion, Encounter } from "./rpgTypes";
import { calculateCritical, calculateDamage } from "../game-engine/battleCalculator";

export const RAGE_SKILL_DEFINITIONS: Record<BattleRageSkill, Readonly<{ label: string; cost: number; description: string; actionType: `rage-${BattleRageSkill}` }>> = {
  precise: { label: "精準打擊", cost: 30, description: "答對時造成 2.5 倍傷害。", actionType: "rage-precise" },
  shield: { label: "防護壁壘", cost: 25, description: "答錯時抵銷一次守門者反擊。", actionType: "rage-shield" },
  heal: { label: "緊急包紮", cost: 20, description: "立即恢復 20 HP，接著照常答題。", actionType: "rage-heal" },
};

export type BattleAction =
  | { type: "skill"; cost: number; power: number; label: string }
  | { type: "ultimate"; cost: number; power: number; label: string }
  | { type: "capture"; cost: number; success: boolean }
  | { type: "basic"; power?: number; label?: string }
  | { type: "rage-precise"; cost: number; power: number; label: string }
  | { type: "rage-shield"; cost: number; power: number; label: string }
  | { type: "rage-heal"; cost: number; power: number; label: string }
  | { type: "enemy"; damage: number };

export function createBattle(companion: Companion, encounter: Encounter, questionId = "battle-intro"): BattleState {
  return {
    playerHp: companion.maxHp,
    playerMaxHp: companion.maxHp,
    enemyHp: encounter.maxHp,
    enemyMaxHp: encounter.maxHp,
    energy: 0,
    enemyName: encounter.name,
    turn: "player",
    phase: "ready",
    questionId,
    pendingAction: null,
    performance: null,
    ultimateUsed: false,
    strategyShieldActive: false,
    log: [`${encounter.name} 從觀測草叢出現了！`, `${companion.name} 可以直接行動；必殺技與超必殺技會啟動課綱答題。`],
    result: "active",
  };
}

export function beginBattleQuestion(state: BattleState, action: BattlePendingAction, questionId: string): BattleState {
  if (state.result !== "active" || state.turn !== "player" || state.phase !== "ready" && state.phase !== "action") return state;
  if (action.type === "ultimate" && state.ultimateUsed) return { ...state, log: [...state.log, "超必殺本場已使用，下一場再集結能量吧。"] };
  if (state.energy < action.cost) return { ...state, log: [...state.log, `能量不足，無法啟動${action.label}的答題施放。`] };
  return { ...state, phase: "question", questionId, pendingAction: action, log: [...state.log, `啟動${action.label}；回答課綱題後決定技能威力。`] };
}

export function applyBattleAnswer(state: BattleState, performance: BattlePerformance): BattleState {
  if (state.result !== "active" || state.turn !== "player" || state.phase !== "question" || state.questionId !== performance.questionId) return state;
  const answered = {
    ...state,
    phase: "action" as const,
    performance,
    energy: Math.min(20, state.energy + (performance.correct ? 3 : 1)),
    log: [...state.log, performance.correct ? `答對了！獲得 3 點能量；${state.pendingAction ? `準備施放${state.pendingAction.label}。` : "可以選擇一般行動。"}` : "答案需要再觀察一次；本次技能威力會降低。"],
  };
  if (!state.pendingAction) return answered;
  const next = applyBattleAction({ ...answered, pendingAction: null }, state.pendingAction);
  return { ...next, log: [...next.log, state.pendingAction.label + (performance.correct ? "完成答題增幅。" : "以保守威力施放。")] };
}

export function applyBattleAction(state: BattleState, action: BattleAction, nextQuestionId = state.questionId): BattleState {
  if (state.result !== "active") return state;
  if (action.type !== "enemy" && (state.turn !== "player" || (state.phase !== "ready" && state.phase !== "action"))) return state;
  if (action.type === "skill" || action.type === "ultimate" || action.type === "rage-precise" || action.type === "rage-shield" || action.type === "rage-heal") {
    if (action.type === "ultimate" && state.ultimateUsed) return { ...state, log: [...state.log, "超必殺本場已使用，下一場再集結能量吧。"] };
    if (state.energy < action.cost) return { ...state, log: [...state.log, `能量不足，無法使用${action.label}。`] };
    const rageAction = action.type === "rage-precise" || action.type === "rage-shield" || action.type === "rage-heal";
    const precise = action.type === "rage-precise";
    const shield = action.type === "rage-shield";
    const multiplier = action.type === "ultimate" ? 2 : 1;
    const ultimatePassiveBonus = action.type === "ultimate" ? (state.performance?.ultimatePowerBonus ?? 0) : 0;
    const answerBonus = state.performance?.correct ? 2 : 0;
    const baseDamage = Math.max(1, action.power * multiplier + (state.performance?.attackPower ?? 1) - 1 + ultimatePassiveBonus + answerBonus);
    const comboCount = state.performance?.comboCount ?? 0;
    const critical = state.performance?.criticalHit
      ? { isCritical: true, multiplier: 1.5 }
      : calculateCritical(comboCount);
    const effectiveComboCount = critical.isCritical ? Math.max(3, comboCount) : comboCount;
    const standardDamage = calculateDamage(baseDamage, state.performance?.correct ? 1 : 0, effectiveComboCount);
    const damage = rageAction && !state.performance?.correct ? 0 : precise ? Math.max(1, Math.round(standardDamage * 2.5)) : standardDamage;
    const criticalSuffix = state.performance?.correct && critical.isCritical
      ? state.performance?.comboCount && state.performance.comboCount >= 3
        ? ` 🔥 連擊！連答 ${state.performance.comboCount} 題，答題增幅以 1.5 倍呈現。`
        : " ✦ 裝備暴擊！答題增幅以 1.5 倍呈現。"
      : "";
    const enemyHp = Math.max(0, state.enemyHp - damage);
    const common = { enemyHp, energy: state.energy - action.cost, ultimateUsed: state.ultimateUsed || action.type === "ultimate", strategyShieldActive: shield && !state.performance?.correct };
    const actionLine = damage > 0
      ? `${action.label}造成 ${damage} 點答題增幅傷害！${criticalSuffix}`
      : shield
        ? `${action.label}已展開；這題未命中時會抵銷下一次反擊。`
        : `${action.label}尚未鎖定要害，守門者準備回應。`;
    if (enemyHp === 0) return { ...state, ...common, turn: "ended", phase: "action", result: "victory", log: [...state.log, actionLine, `${state.enemyName} 暫時失去戰鬥力。`] };
    return { ...state, ...common, turn: "enemy", phase: "action", log: [...state.log, actionLine] };
  }
  if (action.type === "capture") {
    if (state.energy < action.cost) return { ...state, log: [...state.log, "捕捉需要更多能量，先完成幾題觀察任務吧。"] };
    if (action.success) return { ...state, energy: state.energy - action.cost, turn: "ended", phase: "action", result: "victory", log: [...state.log, `${state.enemyName} 願意加入探險隊！`] };
    return { ...state, energy: state.energy - action.cost, turn: "enemy", phase: "action", log: [...state.log, `${state.enemyName} 躲開了捕捉光圈！`] };
  }
  if (action.type === "basic") {
    const damage = Math.max(1, action.power ?? 3);
    const enemyHp = Math.max(0, state.enemyHp - damage);
    if (enemyHp === 0) return { ...state, enemyHp, turn: "ended", phase: "action", result: "victory", log: [...state.log, `${action.label ?? "基礎攻擊"}造成 ${damage} 點傷害！`, `${state.enemyName} 暫時失去戰鬥力。`] };
    return { ...state, enemyHp, turn: "enemy", phase: "action", log: [...state.log, `${action.label ?? "基礎攻擊"}造成 ${damage} 點傷害。`] };
  }
  const shielded = state.strategyShieldActive && action.damage > 0;
  const effectiveDamage = shielded ? 0 : action.damage;
  const playerHp = Math.max(0, state.playerHp - effectiveDamage);
  return {
    ...state,
    playerHp,
    turn: playerHp === 0 ? "ended" : "player",
    phase: playerHp === 0 ? "action" : "ready",
    questionId: playerHp === 0 ? state.questionId : nextQuestionId,
    pendingAction: null,
    performance: playerHp === 0 ? state.performance : null,
    strategyShieldActive: false,
    result: playerHp === 0 ? "defeat" : "active",
    log: [...state.log, shielded ? "防護壁壘成功抵銷守門者反擊。" : `${state.enemyName} 反應造成 ${effectiveDamage} 點傷害。`, ...(playerHp > 0 ? ["下一回合：可直接行動；使用必殺或超必殺時再回答課綱題。"] : [])],
  };
}

export function healBattleHp(state: BattleState, amount: number): BattleState {
  if (state.result !== "active" || state.turn !== "player") return state;
  const restored = Math.max(0, Math.min(amount, state.playerMaxHp - state.playerHp));
  return { ...state, playerHp: Math.min(state.playerMaxHp, state.playerHp + restored), log: [...state.log, `緊急包紮恢復 ${restored} 點 HP。`] };
}

export function addBattleEnergy(state: BattleState, amount: number): BattleState {
  if (state.result !== "active") return state;
  return { ...state, energy: Math.min(20, Math.max(0, state.energy + amount)), log: [...state.log, `答題能量注入戰場：+${amount}。`] };
}
