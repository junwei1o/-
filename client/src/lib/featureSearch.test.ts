import { describe, expect, it } from "vitest";
import { FEATURE_SEARCH_ITEMS, findFeatureSearchResults } from "./featureSearch";

describe("核心功能搜尋索引", () => {
  it("在尚未輸入關鍵字時顯示全部主要功能入口", () => {
    expect(findFeatureSearchResults("")).toHaveLength(FEATURE_SEARCH_ITEMS.length);
  });

  it.each([
    ["錯題", "wrongAnswers", "/wrong-answers"],
    ["天文", "astronomy", "/astronomy"],
  ])("可由「%s」找到 %s 功能並提供正確路由", (query, expectedId, expectedHref) => {
    const result = findFeatureSearchResults(query).find((item) => item.id === expectedId);

    expect(result).toMatchObject({ id: expectedId, href: expectedHref });
  });

  it("卡牌決鬥已下架，搜尋卡牌或決鬥不再出現", () => {
    expect(findFeatureSearchResults("卡牌")).toHaveLength(0);
    expect(findFeatureSearchResults("知識決鬥")).toHaveLength(0);
    expect(FEATURE_SEARCH_ITEMS.map((item) => item.id)).not.toContain("duel");
  });

  it("守護者 BOSS 主線已下架，搜尋不再出現", () => {
    expect(findFeatureSearchResults("守護者").map((item) => item.id)).not.toContain("guardian");
    expect(findFeatureSearchResults("守護者 BOSS")).toHaveLength(0);
  });

  it("答題戰鬥已下架，搜尋戰鬥或怪物不再出現", () => {
    expect(findFeatureSearchResults("戰鬥")).toHaveLength(0);
    expect(findFeatureSearchResults("怪物")).toHaveLength(0);
    expect(FEATURE_SEARCH_ITEMS.map((item) => item.id)).not.toContain("battle");
  });
});
