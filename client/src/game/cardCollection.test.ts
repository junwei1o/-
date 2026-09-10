// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { addCardToCollection, getCardCollection, hasAllThemeCards, maybeDropUnownedCard, openCardPack, recordCardDuelResult } from "./cardCollection";

beforeEach(() => localStorage.clear());

describe("card collection", () => {
  it("初始收藏為空、勝負計數為零", () => {
    const col = getCardCollection();
    expect(col.ownedCardIds).toEqual([]);
    expect(col.wins).toBe(0);
    expect(col.losses).toBe(0);
    expect(col.packsOpened).toBe(0);
  });

  it("addCardToCollection 新增卡片且不重複", () => {
    addCardToCollection("math-01");
    addCardToCollection("math-01");
    addCardToCollection("ch-01");
    expect(getCardCollection().ownedCardIds).toEqual(["math-01", "ch-01"]);
  });

  it("recordCardDuelResult 累計勝負與總回合", () => {
    recordCardDuelResult("victory");
    recordCardDuelResult("defeat");
    recordCardDuelResult("draw");
    const col = getCardCollection();
    expect(col.wins).toBe(1);
    expect(col.losses).toBe(1);
    expect(col.draws).toBe(1);
    expect(col.totalRounds).toBe(3);
  });

  it("openCardPack 回傳 3 張不重複卡並累加 packsOpened", () => {
    const cards = openCardPack(() => 0);
    expect(cards).toHaveLength(3);
    expect(new Set(cards.map((c) => c.id)).size).toBe(3);
    expect(getCardCollection().packsOpened).toBe(1);
  });

  it("maybeDropUnownedCard 只掉未擁有的卡", () => {
    addCardToCollection("math-01");
    const dropped = maybeDropUnownedCard(() => 0.99);
    expect(dropped).not.toBeNull();
    expect(dropped?.id).not.toBe("math-01");
  });

  it("hasAllThemeCards 判斷是否集滿單一學科", () => {
    ["math-01", "math-02", "math-03", "math-04", "math-05"].forEach(addCardToCollection);
    expect(hasAllThemeCards("數學")).toBe(true);
    expect(hasAllThemeCards("國語")).toBe(false);
  });
});
