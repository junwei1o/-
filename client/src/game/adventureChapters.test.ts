import { describe, expect, it } from "vitest";
import { ALL_CHAPTERS, getChapterById, validateChapter } from "./adventureChapters";

describe("adventure chapters", () => {
  it("每章節的所有 nextNodeId 都指向存在的節點", () => {
    ALL_CHAPTERS.forEach((chapter) => validateChapter(chapter));
  });

  it("check 節點必須有 subject 與正確/錯誤分支", () => {
    ALL_CHAPTERS.forEach((chapter) => {
      Object.values(chapter.nodes).forEach((node) => {
        if (node.type === "check") {
          expect(node.check?.subject).toBeTruthy();
          expect(chapter.nodes[node.check!.nextCorrectId]).toBeTruthy();
          expect(chapter.nodes[node.check!.nextWrongId]).toBeTruthy();
        }
      });
    });
  });

  it("ending 節點必須有 ending 型態", () => {
    ALL_CHAPTERS.forEach((chapter) => {
      Object.values(chapter.nodes).forEach((node) => {
        if (node.type === "ending") {
          expect(["good", "bad", "neutral"]).toContain(node.ending);
        }
      });
    });
  });

  it("第一章免費、第二章付費", () => {
    expect(getChapterById("lighthouse-call")?.cost).toBe(0);
    expect(getChapterById("lost-classic")?.cost).toBe(30);
  });

  it("共 6 個章節且都有多選擇分支與結局", () => {
    expect(ALL_CHAPTERS).toHaveLength(6);
    for (const chapter of ALL_CHAPTERS) {
      const nodes = Object.values(chapter.nodes);
      expect(nodes.some((node) => node.type === "choice" && (node.choices?.length ?? 0) >= 2)).toBe(true);
      expect(nodes.some((node) => node.type === "check")).toBe(true);
      expect(nodes.filter((node) => node.type === "ending").length).toBeGreaterThanOrEqual(2);
      expect(chapter.title.trim()).not.toBe("");
      expect(chapter.icon).not.toBe("");
    }
  });

  it("good 結局章節授予限定稱號（與酒館 CHAPTER_TITLES 對應）", () => {
    for (const chapter of ALL_CHAPTERS) {
      const goodEnding = Object.values(chapter.nodes).find((node) => node.type === "ending" && node.ending === "good");
      if (goodEnding?.reward?.title) {
        expect(goodEnding.reward.title.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
