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
});
