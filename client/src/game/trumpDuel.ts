import type { CardDef, CardStat } from "./trumpCardData";

export type TrumpPhase = "choose-stat" | "answer" | "reveal" | "finished";
export type TrumpResult = "active" | "victory" | "defeat" | "draw";
export type AnswerChoice = "boost" | "peek";
export const MAX_ROUNDS = 40;

export type TrumpState = {
  playerDeck: CardDef[];
  aiDeck: CardDef[];
  pot: CardDef[];
  turnLeader: "player" | "ai";
  round: number;
  phase: TrumpPhase;
  pendingStat: CardStat | null;
  peekRevealed: boolean;
  pendingBoost: boolean;
  result: TrumpResult;
};

export function beginTrumpDuel(playerDeck: CardDef[], aiDeck: CardDef[], startLeader: "player" | "ai" | null = null): TrumpState {
  const turnLeader: "player" | "ai" = startLeader ?? (Math.random() < 0.5 ? "player" : "ai");
  return {
    playerDeck: [...playerDeck],
    aiDeck: [...aiDeck],
    pot: [],
    turnLeader,
    round: 1,
    phase: "choose-stat",
    pendingStat: null,
    peekRevealed: false,
    pendingBoost: false,
    result: "active",
  };
}

export function chooseTrumpStat(state: TrumpState, stat: CardStat): TrumpState {
  if (state.phase !== "choose-stat") throw new Error("非 choose-stat 階段");
  return { ...state, pendingStat: stat, phase: "answer" };
}

export function applyTrumpAnswer(state: TrumpState, correct: boolean, choice: AnswerChoice): TrumpState {
  if (state.phase !== "answer") throw new Error("非 answer 階段");
  return {
    ...state,
    phase: "reveal",
    peekRevealed: correct && choice === "peek",
    pendingBoost: correct && choice === "boost",
  };
}

function compareStat(player: CardDef, ai: CardDef, stat: CardStat, playerBoost: boolean): "player" | "ai" | "draw" {
  const playerVal = player.stats[stat] + (playerBoost ? 2 : 0);
  const aiVal = ai.stats[stat];
  if (playerVal > aiVal) return "player";
  if (aiVal > playerVal) return "ai";
  return "draw";
}

export function settleTrumpRound(state: TrumpState): TrumpState {
  if (state.result !== "active") return state;
  if (state.round >= MAX_ROUNDS) {
    return concludeByDeckSize(state);
  }
  if (state.phase !== "reveal") throw new Error("非 reveal 階段");
  const playerTop = state.playerDeck[0];
  const aiTop = state.aiDeck[0];
  if (!playerTop || !aiTop) {
    return concludeByDeckSize(state);
  }
  const stat = state.pendingStat;
  if (!stat) throw new Error("缺少 pendingStat");
  const winner = compareStat(playerTop, aiTop, stat, state.pendingBoost);
  let playerDeck = state.playerDeck.slice(1);
  let aiDeck = state.aiDeck.slice(1);
  let pot = [...state.pot];
  let turnLeader = state.turnLeader;
  if (winner === "player") {
    playerDeck = [...playerDeck, aiTop, playerTop, ...pot];
    pot = [];
    turnLeader = "player";
  } else if (winner === "ai") {
    aiDeck = [...aiDeck, playerTop, aiTop, ...pot];
    pot = [];
    turnLeader = "ai";
  } else {
    pot = [...pot, playerTop, aiTop];
  }
  const next: TrumpState = {
    ...state,
    playerDeck,
    aiDeck,
    pot,
    turnLeader,
    round: state.round + 1,
    phase: "choose-stat",
    pendingStat: null,
    peekRevealed: false,
    pendingBoost: false,
  };
  if (playerDeck.length === 0 || aiDeck.length === 0) {
    return concludeByDeckSize(next);
  }
  if (next.round > MAX_ROUNDS) {
    return concludeByDeckSize(next);
  }
  return next;
}

function concludeByDeckSize(state: TrumpState): TrumpState {
  if (state.playerDeck.length === 0 && state.aiDeck.length === 0) return { ...state, result: "draw", phase: "finished" };
  if (state.aiDeck.length === 0) return { ...state, result: "victory", phase: "finished" };
  if (state.playerDeck.length === 0) return { ...state, result: "defeat", phase: "finished" };
  return state.playerDeck.length > state.aiDeck.length
    ? { ...state, result: "victory", phase: "finished" }
    : state.playerDeck.length < state.aiDeck.length
      ? { ...state, result: "defeat", phase: "finished" }
      : { ...state, result: "draw", phase: "finished" };
}

export function aiChooseStat(deck: CardDef[], random: () => number = Math.random): CardStat {
  const top = deck[0];
  if (!top) return "power";
  const stats: CardStat[] = ["power", "wisdom", "speed", "charm"];
  const best = stats.reduce((acc, stat) => (top.stats[stat] > top.stats[acc] ? stat : acc), "power" as CardStat);
  return random() < 0.3 ? stats[Math.floor(random() * stats.length)] ?? best : best;
}

export function aiAnswerCorrect(difficulty: number, seed: number): boolean {
  const threshold = difficulty <= 1 ? 4 : difficulty === 2 ? 3 : 2;
  return seed % 5 < threshold;
}

export function buildDeckFromCollection(ownedIds: readonly string[], allCards: readonly CardDef[], count: number, random: () => number = Math.random): CardDef[] {
  const pool = allCards.filter((card) => ownedIds.includes(card.id));
  const deck: CardDef[] = [];
  const candidates = [...pool];
  while (deck.length < count && candidates.length > 0) {
    const index = Math.floor(random() * candidates.length);
    deck.push(candidates[index]);
    candidates.splice(index, 1);
  }
  return deck;
}
