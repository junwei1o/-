import { describe, expect, it } from "vitest";
import { ALL_CARDS, getCardById, getCardsByTheme, type CardStat, type CardTheme } from "./trumpCardData";

describe("trump card data", () => {
  it("總卡數 48：四學科各 11 張＋聯盟限定 4 張，id 全唯一", () => {
    expect(ALL_CARDS).toHaveLength(48);
    const ids = ALL_CARDS.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
    (["國語", "數學", "社會", "自然"] as CardTheme[]).forEach((theme) => {
      expect(getCardsByTheme(theme)).toHaveLength(11);
    });
    expect(getCardsByTheme("聯盟")).toHaveLength(4);
  });

  it("每張卡都有唯一 id、完整四屬性 1–10、稀有度與主題", () => {
    ALL_CARDS.forEach((card) => {
      expect(card.name.trim()).not.toBe("");
      expect(card.emoji.length).toBeGreaterThan(0);
      expect(card.flavor.trim()).not.toBe("");
      expect(["common", "rare", "legendary"]).toContain(card.rarity);
      expect(["國語", "數學", "社會", "自然", "聯盟"]).toContain(card.theme);
      (["power", "wisdom", "speed", "charm"] as CardStat[]).forEach((stat) => {
        expect(card.stats[stat]).toBeGreaterThanOrEqual(1);
        expect(card.stats[stat]).toBeLessThanOrEqual(10);
      });
    });
  });

  it("稀有度分布合理：普通最多，傳說（含聯盟限定）不超過普通", () => {
    const byRarity = ALL_CARDS.reduce((acc, card) => {
      acc[card.rarity] = (acc[card.rarity] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    expect(byRarity.common ?? 0).toBeGreaterThan(byRarity.rare ?? 0);
    expect(byRarity.common ?? 0).toBeGreaterThan(byRarity.legendary ?? 0);
  });

  it("聯盟限定卡 id 與組別對應（供聯盟賽 top10 發卡）", () => {
    for (const group of ["bronze", "silver", "gold", "diamond"]) {
      const card = getCardById(`league-${group}`);
      expect(card).not.toBeNull();
      expect(card!.theme).toBe("聯盟");
    }
  });

  it("getCardById 可查詢且找不到回傳 null", () => {
    expect(getCardById(ALL_CARDS[0].id)).toEqual(ALL_CARDS[0]);
    expect(getCardById("not-exist")).toBeNull();
  });
});
