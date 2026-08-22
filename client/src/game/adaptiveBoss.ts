export type BossDifficulty = "基礎" | "標準" | "挑戰";

export type BossPhase = 1 | 2 | 3;
export type BossOutcome = "active" | "victory" | "defeat";
export type BossVisualEvent = "start" | "combo" | "phase-transition" | "mistake" | "victory" | null;
export type GuardianBehavior = "berserk" | "heal" | "dodge" | "curse";

export type AdaptiveBossState = {
  name: string;
  phase: BossPhase;
  streak: number;
  requiredStreak: number;
  correctAnswers: number;
  wrongAnswers: number;
  outcome: BossOutcome;
  questionDifficulty: BossDifficulty;
  feedback: string;
  kind?: "adaptive" | "guardian";
  maxHp?: number;
  hp?: number;
  behavior?: GuardianBehavior;
  behaviorTurn?: number;
};

const PHASE_CONFIG: Record<BossPhase, { difficulty: BossDifficulty; requiredStreak: number; label: string }> = {
  1: { difficulty: "基礎", requiredStreak: 1, label: "先觀察線索，建立第一道防線。" },
  2: { difficulty: "標準", requiredStreak: 2, label: "線索開始交織，請把概念連起來。" },
  3: { difficulty: "挑戰", requiredStreak: 3, label: "最後的綜合挑戰，慢慢拆解再作答。" },
};

export function createAdaptiveBoss(name = "課綱守門者", options: { kind?: "adaptive" | "guardian"; baseHp?: number } = {}): AdaptiveBossState {
  const kind = options.kind ?? "adaptive";
  const maxHp = kind === "guardian" ? Math.max(30, (options.baseHp ?? 30) * 3) : undefined;
  return {
    name,
    phase: 1,
    streak: 0,
    requiredStreak: PHASE_CONFIG[1].requiredStreak,
    correctAnswers: 0,
    wrongAnswers: 0,
    outcome: "active",
    questionDifficulty: PHASE_CONFIG[1].difficulty,
    feedback: kind === "guardian" ? "守護者的行為模式將隨回合切換；先觀察，再穩定作答。" : PHASE_CONFIG[1].label,
    kind,
    maxHp,
    hp: maxHp,
    behavior: kind === "guardian" ? "berserk" : undefined,
    behaviorTurn: 0,
  };
}

function answerGuardian(state: AdaptiveBossState, correct: boolean): AdaptiveBossState {
  const turn = (state.behaviorTurn ?? 0) + 1;
  const behavior = (["berserk", "heal", "dodge", "curse"] as GuardianBehavior[])[turn % 4];
  const hp = state.hp ?? state.maxHp ?? 90;
  if (!correct) {
    return {
      ...state,
      streak: 0,
      wrongAnswers: state.wrongAnswers + 1,
      behavior,
      behaviorTurn: turn,
      feedback: behavior === "curse" ? "詛咒干擾了思緒；放慢速度，找出題目關鍵詞。" : "守護者反擊成功；讀完解析後再整理線索。",
    };
  }
  const dodge = behavior === "dodge" && turn % 2 === 0;
  const damage = dodge ? 0 : behavior === "berserk" ? 8 : 10;
  const healed = behavior === "heal" ? Math.min(state.maxHp ?? 90, hp + 4) : hp;
  const nextHp = Math.max(0, healed - damage);
  const feedback = nextHp <= 0
    ? "守護者的封印已解除，區域知識之光重新綻放！"
    : dodge
      ? "守護者閃避了這次攻勢；下一回合仍有機會突破。"
      : behavior === "heal"
        ? "守護者治癒自身，但你的正確答案仍造成了穩定傷害。"
        : `守護者切換為${behavior === "berserk" ? "狂暴" : "一般"}模式，繼續保持節奏。`;
  return {
    ...state,
    streak: state.streak + 1,
    correctAnswers: state.correctAnswers + 1,
    hp: nextHp,
    behavior,
    behaviorTurn: turn,
    outcome: nextHp <= 0 ? "victory" : "active",
    feedback,
  };
}

export function answerAdaptiveBoss(state: AdaptiveBossState, correct: boolean): AdaptiveBossState {
  if (state.outcome !== "active") return state;
  if (state.kind === "guardian") return answerGuardian(state, correct);
  if (!correct) return { ...state, streak: 0, wrongAnswers: state.wrongAnswers + 1, feedback: "這不是失敗；先讀解析、整理線索，下一題會回到可掌握的節奏。" };
  const streak = state.streak + 1;
  const correctAnswers = state.correctAnswers + 1;
  if (streak < state.requiredStreak) return { ...state, streak, correctAnswers, feedback: `連續答對 ${streak} 題，再穩住 ${state.requiredStreak - streak} 題即可推進。` };
  if (state.phase === 3) return { ...state, streak, correctAnswers, outcome: "victory", feedback: "三階段線索已串起來！你用理解力完成了 Boss 挑戰。" };
  const nextPhase = (state.phase + 1) as BossPhase;
  const config = PHASE_CONFIG[nextPhase];
  return { ...state, phase: nextPhase, streak: 0, correctAnswers, requiredStreak: config.requiredStreak, questionDifficulty: config.difficulty, feedback: `進入第 ${nextPhase} 階段：${config.label}` };
}

export function retryAdaptiveBoss(state: AdaptiveBossState): AdaptiveBossState {
  return state.outcome === "victory" ? createAdaptiveBoss(state.name, { kind: state.kind, baseHp: state.maxHp ? state.maxHp / 3 : undefined }) : state;
}

export function bossPhaseLabel(state: AdaptiveBossState): string {
  return state.kind === "guardian" ? `守護者／${state.behavior ?? "berserk"}／HP ${state.hp ?? 0} / ${state.maxHp ?? 0}` : `第 ${state.phase} 階段／${state.questionDifficulty}題／連續 ${state.streak} 題`;
}

export function bossVisualEvent(previous: AdaptiveBossState | null, next: AdaptiveBossState | null): BossVisualEvent {
  if (!next) return null;
  if (!previous) return "start";
  if (previous.outcome !== "victory" && next.outcome === "victory") return "victory";
  if (next.phase !== previous.phase) return "phase-transition";
  if (next.wrongAnswers > previous.wrongAnswers) return "mistake";
  if (next.correctAnswers > previous.correctAnswers && next.streak > 0) return "combo";
  return null;
}
