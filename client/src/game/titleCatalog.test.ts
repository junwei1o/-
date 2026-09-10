import { describe, expect, it } from "vitest";
import { countOwnedTitles, isTitleOwned, stripTitlePrefix, TITLE_CATALOG } from "./titleCatalog";

describe("title catalog", () => {
  it("lists every obtainable title with a unique id and complete metadata", () => {
    const ids = TITLE_CATALOG.map((title) => title.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(TITLE_CATALOG.length).toBe(21);
    TITLE_CATALOG.forEach((title) => {
      expect(title.displayTitle.length).toBeGreaterThan(1);
      expect(title.condition.length).toBeGreaterThan(6);
      expect(title.hint.label.length).toBeGreaterThan(0);
      expect(title.hint.href.startsWith("/")).toBe(true);
      expect(["簽到成長", "連擊挑戰", "稀有遠征", "潮汐牌局", "文字冒險"]).toContain(title.category);
    });
  });

  it("includes the sign-in and combo titles plus fifteen rare expedition titles", () => {
    expect(TITLE_CATALOG.filter((title) => title.category === "簽到成長")).toHaveLength(1);
    expect(TITLE_CATALOG.filter((title) => title.category === "連擊挑戰")).toHaveLength(1);
    expect(TITLE_CATALOG.filter((title) => title.category === "稀有遠征")).toHaveLength(15);
  });

  it("strips the storage prefix for display but keeps it on the matching id", () => {
    const rare = TITLE_CATALOG.filter((title) => title.category === "稀有遠征");
    rare.forEach((title) => {
      expect(title.id.startsWith("擊敗後獲得限定稱號：")).toBe(true);
      expect(title.displayTitle.startsWith("擊敗後獲得限定稱號：")).toBe(false);
      expect(stripTitlePrefix(title.id)).toBe(title.displayTitle);
    });
    expect(stripTitlePrefix("連擊大師")).toBe("連擊大師");
  });

  it("matches owned titles against the exact stored strings", () => {
    const sample = TITLE_CATALOG[0];
    expect(isTitleOwned(sample.id, [sample.id])).toBe(true);
    expect(isTitleOwned(sample.id, ["其他稱號"])).toBe(false);
    expect(countOwnedTitles([sample.id])).toBe(1);
    expect(countOwnedTitles(["未知稱號"])).toBe(0);
  });
});
