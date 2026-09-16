import { describe, expect, it } from "vitest";
import { aiChooseStat, applyTrumpAnswer, beginTrumpDuel, chooseTrumpStat, settleTrumpRound, themeAdvantage, type CardDef, type TrumpState } from "./trumpDuel";
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

describe("trump duel - AI 選牌", () => {
  const top = { id: "ai-top", name: "AI", theme: "數學" as const, rarity: "common" as const, stats: { power: 9, wisdom: 3, speed: 2, charm: 1 }, emoji: "🤖", flavor: "" };

  it("隨機值 >= 0.3 時選最優屬性", () => {
    expect(aiChooseStat([top], () => 0.5)).toBe("power");
    expect(aiChooseStat([top], () => 0.99)).toBe("power");
  });

  it("隨機值 < 0.3 時從「非最優」屬性中選，絕不落回最優", () => {
    // 固定 random 序列：第一次 0.1（進入隨機分支）、第二次 0（others[0]）
    const call = (() => {
      let i = 0;
      const seq = [0.1, 0];
      return () => seq[i++ % seq.length];
    })();
    const picked = aiChooseStat([top], call);
    expect(picked).not.toBe("power"); // 隨機分支不得選最優（power）
    expect(["wisdom", "speed", "charm"]).toContain(picked);
  });

  it("空牌堆回退 power", () => {
    expect(aiChooseStat([], () => 0.5)).toBe("power");
  });
});

describe("屬性相克（themeAdvantage）", () => {
  it("循環正確：自然剋社會、社會剋國語、國語剋數學、數學剋自然", () => {
    expect(themeAdvantage("自然", "社會")).toBe(true);
    expect(themeAdvantage("社會", "國語")).toBe(true);
    expect(themeAdvantage("國語", "數學")).toBe(true);
    expect(themeAdvantage("數學", "自然")).toBe(true);
  });

  it("反向不受剋制", () => {
    expect(themeAdvantage("社會", "自然")).toBe(false);
    expect(themeAdvantage("國語", "社會")).toBe(false);
    expect(themeAdvantage("數學", "國語")).toBe(false);
    expect(themeAdvantage("自然", "數學")).toBe(false);
  });

  it("聯盟卡中立：不剋任何主題、也不被剋", () => {
    (["國語", "數學", "社會", "自然"] as const).forEach((theme) => {
      expect(themeAdvantage("聯盟", theme)).toBe(false);
      expect(themeAdvantage(theme, "聯盟")).toBe(false);
    });
  });

  it("剋制時結算 +2：低一階數值也能逆轉", () => {
    // 數學剋自然：power 6（數學）＋相克 2 = 8 > 自然 8？不對，是 6+2 vs 8 → draw。
    const math = { id: "m1", name: "數學牌", theme: "數學" as const, rarity: "common" as const, stats: { power: 6, wisdom: 1, speed: 1, charm: 1 }, emoji: "🔢", flavor: "" };
    const nat = { id: "n1", name: "自然牌", theme: "自然" as const, rarity: "common" as const, stats: { power: 7, wisdom: 1, speed: 1, charm: 1 }, emoji: "🌿", flavor: "" };
    let state = beginTrumpDuel([math], [nat]);
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, false, "boost");
    const settled = settleTrumpRound(state);
    // 6 + 2(相克) = 8 > 7 → 玩家勝
    expect(settled.result).toBe("victory");
    expect(settled.playerDeck).toHaveLength(2);
  });

  it("被剋制時對方 +2：同等數值會落敗", () => {
    // 社會剋國語：國語 7 被剋，社會 7 + 2 = 9 → 玩家（國語）敗。
    const ch = { id: "c1", name: "國語牌", theme: "國語" as const, rarity: "common" as const, stats: { power: 7, wisdom: 1, speed: 1, charm: 1 }, emoji: "📖", flavor: "" };
    const soc = { id: "s1", name: "社會牌", theme: "社會" as const, rarity: "common" as const, stats: { power: 7, wisdom: 1, speed: 1, charm: 1 }, emoji: "🏛️", flavor: "" };
    let state = beginTrumpDuel([ch], [soc]);
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, false, "boost");
    const settled = settleTrumpRound(state);
    expect(settled.result).toBe("defeat");
    expect(settled.aiDeck).toHaveLength(2);
  });

  it("無相克（同主題）時維持原數值比較", () => {
    const math = { id: "m2", name: "數學牌", theme: "數學" as const, rarity: "common" as const, stats: { power: 6, wisdom: 1, speed: 1, charm: 1 }, emoji: "🔢", flavor: "" };
    const math2 = { id: "m3", name: "數學牌二", theme: "數學" as const, rarity: "common" as const, stats: { power: 6, wisdom: 1, speed: 1, charm: 1 }, emoji: "🔢", flavor: "" };
    let state = beginTrumpDuel([math], [math2]);
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, false, "boost");
    const settled = settleTrumpRound(state);
    expect(settled.result).toBe("draw");
    expect(settled.pot).toHaveLength(2);
  });
});
