import { describe, expect, it } from "vitest";
import { FEATURE_SEARCH_ITEMS, findFeatureSearchResults } from "./featureSearch";

describe("核心功能搜尋索引", () => {
  it("在尚未輸入關鍵字時顯示全部主要功能入口", () => {
    expect(findFeatureSearchResults("")).toHaveLength(FEATURE_SEARCH_ITEMS.length);
  });

  it.each([
    ["戰鬥", "battle", "/battle"],
    ["卡牌", "duel", "/knowledge-duel"],
    ["知識決鬥", "duel", "/knowledge-duel"],
    ["守護者", "guardian", "/guardian"],
    ["錯題", "wrongAnswers", "/wrong-answers"],
  ])("可由「%s」找到 %s 功能並提供正確路由", (query, expectedId, expectedHref) => {
    const result = findFeatureSearchResults(query).find((item) => item.id === expectedId);

    expect(result).toMatchObject({ id: expectedId, href: expectedHref });
  });

  it("忽略多餘空白與英文大小寫，保留守護者 BOSS 搜尋結果", () => {
    expect(findFeatureSearchResults("  守護者 BOSS  ").map((item) => item.id)).toContain("guardian");
  });
});
