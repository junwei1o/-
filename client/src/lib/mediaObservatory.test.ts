import { describe, expect, it } from "vitest";
import { OBSERVATORY_CATEGORIES, OBSERVATORY_ENTRIES, getObservatoryEntry } from "./mediaObservatory";

describe("media observatory metadata", () => {
  it("contains three copyright-safe worldview entries with complete learning fields", () => {
    const titles = OBSERVATORY_ENTRIES.map((entry) => entry.title);
    expect(titles).toEqual(["我是奶龍", "奧特曼", "假面騎士"]);
    expect(OBSERVATORY_ENTRIES.every((entry) => entry.shortDescription.length > 10 && entry.observation.length > 10 && entry.learning.length > 5 && entry.worldview.length > 30 && entry.learningPaths.length === 3 && entry.officialSourceUrl.startsWith("https://"))).toBe(true);
  });

  it("exposes stable categories and safe lookup behavior", () => {
    expect(OBSERVATORY_CATEGORIES[0]).toBe("全部");
    expect(new Set(OBSERVATORY_ENTRIES.map((entry) => entry.category))).toEqual(new Set(["親子動畫", "特攝英雄"]));
    expect(getObservatoryEntry("nailong")?.worldviewTitle).toBe("把小日子變成好奇實驗室");
    expect(getObservatoryEntry("ultraman")?.title).toBe("奧特曼");
    expect(getObservatoryEntry("kamen-rider")?.title).toBe("假面騎士");
    expect(getObservatoryEntry("unknown-entry")).toBeNull();
  });
});
