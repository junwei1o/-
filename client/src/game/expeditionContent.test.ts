import { describe, expect, it } from "vitest";
import { CURRICULUM_QUESTIONS, getRareMonsters, type SubjectKey } from "./expeditionContent";

describe("expedition content", () => {
  it("provides four complete 100-question subject banks", () => {
    (Object.keys(CURRICULUM_QUESTIONS) as SubjectKey[]).forEach((subject) => {
      const questions = CURRICULUM_QUESTIONS[subject];
      expect(questions).toHaveLength(100);
      expect(new Set(questions.map((question) => question.id)).size).toBe(100);
      questions.forEach((question) => {
        // 找到幾個真的干擾項就用幾個（4、5 或 6 個選項）；
        // 找不到時維持 4 選題，不為了湊滿 6 個硬塞「以上皆非」——那正是會被學生唸的變態題。
        expect([4, 5, 6]).toContain(question.options.length);
        expect(new Set(question.options).size).toBe(question.options.length);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(question.options.length);
        if (question.options.length === 4) {
          expect(question.options).not.toContain("以上皆非");
          expect(question.options).not.toContain("以上皆是");
        }
        expect(question.prompt.trim()).not.toBe("");
        expect(question.explanation.trim()).not.toBe("");
        expect(["concept", "careless", "memory"]).toContain(question.errorTag);
      });
    });
  });

  it("provides three rare monsters per subject", () => {
    (Object.keys(CURRICULUM_QUESTIONS) as SubjectKey[]).forEach((subject) => {
      const rareMonsters = getRareMonsters(subject);
      expect(rareMonsters).toHaveLength(3);
      expect(new Set(rareMonsters.map((monster) => monster.id)).size).toBe(3);
      rareMonsters.forEach((monster) => {
        expect(monster.requiredStreak).toBe(10);
        expect(monster.title).toMatch(/^擊敗後獲得限定稱號：/);
      });
    });
  });
});
