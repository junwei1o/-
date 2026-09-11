import { describe, expect, it } from "vitest";
import { applyTrumpAnswer, beginTrumpDuel, chooseTrumpStat, settleTrumpRound, type CardDef, type TrumpState } from "./trumpDuel";
import { getCardById } from "./trumpCardData";

const D = (id: string): CardDef => getCardById(id)!;
const deck = (ids: string[]): CardDef[] => ids.map(D);

function freshState(): TrumpState {
  return beginTrumpDuel(deck(["math-01", "ch-01", "soc-01", "nat-01", "nat-02", "soc-02", "ch-02", "math-02"]), deck(["nat-03", "soc-03", "ch-03", "math-03", "nat-04", "soc-04", "ch-04", "math-04"]));
}

describe("trump duel engine", () => {
  it("初始雙方各 8 張、第一回合主動方隨機、階段為 choose-stat", () => {
    const state = freshState();
    expect(state.playerDeck).toHaveLength(8);
    expect(state.aiDeck).toHaveLength(8);
    expect(state.pot).toHaveLength(0);
    expect(state.round).toBe(1);
    expect(state.phase).toBe("choose-stat");
    expect(state.result).toBe("active");
    expect(["player", "ai"]).toContain(state.turnLeader);
  });

  it("choose-stat 後進入 answer 並記錄 pendingStat", () => {
    const state = freshState();
    const next = chooseTrumpStat(state, "power");
    expect(next.pendingStat).toBe("power");
    expect(next.phase).toBe("answer");
  });

  it("答對強化 +2 並進入 reveal，答錯維持原值進入 reveal", () => {
    let state = freshState();
    state = chooseTrumpStat(state, "power");
    const correct = applyTrumpAnswer(state, true, "boost");
    expect(correct.phase).toBe("reveal");
    expect(correct.peekRevealed).toBe(false);
    const wrong = applyTrumpAnswer(state, false, "boost");
    expect(wrong.phase).toBe("reveal");
  });

  it("答對情報會標記 peekRevealed", () => {
    let state = freshState();
    state = chooseTrumpStat(state, "power");
    const peek = applyTrumpAnswer(state, true, "peek");
    expect(peek.peekRevealed).toBe(true);
    expect(peek.phase).toBe("reveal");
  });

  it("比大小：高者贏走對方頂牌放到自己牌堆底，並續當主動方", () => {
    const strong = { id: "x-1", name: "強", theme: "數學" as const, rarity: "common" as const, stats: { power: 10, wisdom: 1, speed: 1, charm: 1 }, emoji: "💪", flavor: "" };
    const weak = { id: "x-2", name: "弱", theme: "數學" as const, rarity: "common" as const, stats: { power: 1, wisdom: 1, speed: 1, charm: 1 }, emoji: "🐌", flavor: "" };
    let state = beginTrumpDuel([strong], [weak]);
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, false, "boost");
    const settled = settleTrumpRound(state);
    expect(settled.playerDeck).toHaveLength(2);
    expect(settled.aiDeck).toHaveLength(0);
    expect(settled.turnLeader).toBe("player");
    expect(settled.result).toBe("victory");
  });

  it("平手：兩張牌進 pot，主動方不變", () => {
    const a = { id: "a", name: "A", theme: "數學" as const, rarity: "common" as const, stats: { power: 5, wisdom: 1, speed: 1, charm: 1 }, emoji: "🅰️", flavor: "" };
    const b = { id: "b", name: "B", theme: "數學" as const, rarity: "common" as const, stats: { power: 5, wisdom: 1, speed: 1, charm: 1 }, emoji: "🅱️", flavor: "" };
    let state = beginTrumpDuel([a], [b]);
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, false, "boost");
    const settled = settleTrumpRound(state);
    expect(settled.pot).toHaveLength(2);
    expect(settled.playerDeck).toHaveLength(0);
    expect(settled.aiDeck).toHaveLength(0);
    expect(settled.turnLeader).toBe(state.turnLeader);
  });

  it("平手後再戰，贏家全拿 pot + 當回合兩張", () => {
    const a = { id: "a", name: "A", theme: "數學" as const, rarity: "common" as const, stats: { power: 5, wisdom: 1, speed: 1, charm: 1 }, emoji: "🅰️", flavor: "" };
    const a2 = { id: "a2", name: "A2", theme: "數學" as const, rarity: "common" as const, stats: { power: 9, wisdom: 1, speed: 1, charm: 1 }, emoji: "🅰️", flavor: "" };
    const b = { id: "b", name: "B", theme: "數學" as const, rarity: "common" as const, stats: { power: 5, wisdom: 1, speed: 1, charm: 1 }, emoji: "🅱️", flavor: "" };
    const b2 = { id: "b2", name: "B2", theme: "數學" as const, rarity: "common" as const, stats: { power: 1, wisdom: 1, speed: 1, charm: 1 }, emoji: "🅱️", flavor: "" };
    let state = beginTrumpDuel([a, a2], [b, b2]);
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, false, "boost");
    state = settleTrumpRound(state);
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, false, "boost");
    const settled = settleTrumpRound(state);
    expect(settled.playerDeck).toHaveLength(4);
    expect(settled.aiDeck).toHaveLength(0);
    expect(settled.result).toBe("victory");
  });

  it("達 40 回合上限時比牌堆剩餘牌數，相同為 draw", () => {
    const state = freshState();
    state.round = 40;
    const settled = settleTrumpRound(state);
    expect(settled.result).toBe("draw");
  });

  it("偷看情報持續到下一輪選屬性（不再結算時無條件重置）", () => {
    const strong = { id: "x-1", name: "強", theme: "數學" as const, rarity: "common" as const, stats: { power: 10, wisdom: 1, speed: 1, charm: 1 }, emoji: "💪", flavor: "" };
    const weak = { id: "x-2", name: "弱", theme: "數學" as const, rarity: "common" as const, stats: { power: 1, wisdom: 1, speed: 1, charm: 1 }, emoji: "🐌", flavor: "" };
    let state = beginTrumpDuel([strong, strong], [weak, weak]);
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, true, "peek");
    // 結算後：情報仍在，phase 回到 choose-stat
    const settled = settleTrumpRound(state);
    expect(settled.phase).toBe("choose-stat");
    expect(settled.peekRevealed).toBe(true);
  });

  it("選屬性時消耗偷看情報（用過即焚）", () => {
    const strong = { id: "x-1", name: "強", theme: "數學" as const, rarity: "common" as const, stats: { power: 10, wisdom: 1, speed: 1, charm: 1 }, emoji: "💪", flavor: "" };
    const weak = { id: "x-2", name: "弱", theme: "數學" as const, rarity: "common" as const, stats: { power: 1, wisdom: 1, speed: 1, charm: 1 }, emoji: "🐌", flavor: "" };
    let state = beginTrumpDuel([strong, strong], [weak, weak]);
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, true, "peek");
    state = settleTrumpRound(state);
    expect(state.peekRevealed).toBe(true);
    // 玩家在下一輪選屬性時消耗情報
    state = chooseTrumpStat(state, "speed");
    expect(state.peekRevealed).toBe(false);
  });

  it("答錯偷看不產生情報", () => {
    let state = freshState();
    state = chooseTrumpStat(state, "power");
    const wrongPeek = applyTrumpAnswer(state, false, "peek");
    expect(wrongPeek.peekRevealed).toBe(false);
  });
});
