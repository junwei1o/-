import { describe, expect, it } from "vitest";
import { LOCAL_ENGLISH_BANK, LOCAL_QUESTION_BANK } from "./questionBank";
import { buildPaperDeck } from "./paperExam";

describe("英語港口題庫", () => {
  it("英語題 seed 有足夠題目出卷（≥ 8 題）", () => {
    expect(LOCAL_ENGLISH_BANK.length).toBeGreaterThanOrEqual(8);
  });

  it("英語題欄位完整且答案索引合法", () => {
    for (const question of LOCAL_ENGLISH_BANK) {
      expect(question.subject).toBe("英語");
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(question.options.length);
      expect(question.explanation.length).toBeGreaterThan(0);
      expect(question.knowledge.length).toBeGreaterThan(0);
      expect(question.grade).toBeGreaterThanOrEqual(1);
      expect(question.grade).toBeLessThanOrEqual(9);
    }
  });

  it("英語科可從英語題單獨出卷", () => {
    const deck = buildPaperDeck(LOCAL_ENGLISH_BANK, "英語", 10);
    expect(deck.length).toBeGreaterThan(0);
    expect(deck.every((question) => question.subject === "英語")).toBe(true);
  });

  it("英語題不影響主題庫既有科目數量", () => {
    expect(LOCAL_QUESTION_BANK.length).toBeGreaterThan(500);
    const subjects = new Set(LOCAL_QUESTION_BANK.map((question) => question.subject));
    expect(subjects).toEqual(new Set(["數學", "自然", "社會", "國語"]));
  });
});
