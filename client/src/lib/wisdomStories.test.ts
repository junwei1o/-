import { describe, expect, it } from "vitest";
import { WISDOM_CATEGORIES, WISDOM_STORIES } from "./wisdomStories";

describe("wisdom story library", () => {
  it("contains all four classic wisdom categories plus verified cases", () => {
    expect(WISDOM_CATEGORIES).toEqual(["全部", "成語新解", "寓言故事", "歷史典故", "名人名言", "真實案例"]);
    expect(new Set(WISDOM_STORIES.map((story) => story.category)).size).toBe(5);
    expect(WISDOM_STORIES.filter((story) => story.category === "真實案例").every((story) => story.source?.url.startsWith("http"))).toBe(true);
  });

  it("keeps every story complete and uniquely addressable", () => {
    const keys = WISDOM_STORIES.map((story) => story.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(WISDOM_STORIES.length).toBeGreaterThanOrEqual(12);
    for (const story of WISDOM_STORIES) {
      expect(story.title.length).toBeGreaterThan(2);
      expect(story.story.length).toBeGreaterThan(20);
      expect(story.newMeaning.length).toBeGreaterThan(15);
      expect(story.lifeLink.length).toBeGreaterThan(15);
      expect(story.question).toContain("？");
    }
  });
});
