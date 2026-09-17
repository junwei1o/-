import { describe, expect, it } from "vitest";
import { SORT_SETS, buildSortBoard, sortStars, type SortSet } from "./sortBank";

describe("C 分類題庫", () => {
  it("共有 5 組，id 唯一，每組至少 2 籃且每籃至少 1 項", () => {
    expect(SORT_SETS.length).toBeGreaterThanOrEqual(5);
    const ids = new Set<string>();
    for (const set of SORT_SETS) {
      expect(ids.has(set.id)).toBe(false);
      ids.add(set.id);
      expect(set.categories.length).toBeGreaterThanOrEqual(2);
      for (const category of set.categories) {
        expect(category.items.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("buildSortBoard 打散全部項目並標記所屬分類", () => {
    const set = SORT_SETS[0];
    const board = buildSortBoard(set, () => 0.5);
    const total = set.categories.reduce((sum, category) => sum + category.items.length, 0);
    expect(board.items).toHaveLength(total);
    for (const item of board.items) {
      expect(set.categories[item.category].items).toContain(item.text);
    }
  });

  it("sortStars 沿用失誤計星：0→3、≤2→2、其餘→1", () => {
    expect(sortStars(0)).toBe(3);
    expect(sortStars(1)).toBe(2);
    expect(sortStars(2)).toBe(2);
    expect(sortStars(3)).toBe(1);
    expect(sortStars(9)).toBe(1);
  });
});
