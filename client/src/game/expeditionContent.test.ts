import { describe, expect, it } from "vitest";
import { CURRICULUM_QUESTIONS, SUBJECT_MONSTERS, getRandomSubjectMonster, getRareMonsters, type SubjectKey } from "./expeditionContent";

describe("expedition content", () => {
  it("provides four complete 100-question subject banks", () => {
    (Object.keys(CURRICULUM_QUESTIONS) as SubjectKey[]).forEach((subject) => {
      const questions = CURRICULUM_QUESTIONS[subject];
      expect(questions).toHaveLength(100);
      expect(new Set(questions.map((question) => question.id)).size).toBe(100);
      questions.forEach((question) => {
        expect(question.options).toHaveLength(4);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(4);
        expect(question.prompt.trim()).not.toBe("");
        expect(question.explanation.trim()).not.toBe("");
        expect(["concept", "careless", "memory"]).toContain(question.errorTag);
      });
    });
  });

  it("provides three regular and three rare monsters per subject", () => {
    (Object.keys(SUBJECT_MONSTERS) as SubjectKey[]).forEach((subject) => {
      expect(SUBJECT_MONSTERS[subject]).toHaveLength(3);
      expect(new Set(SUBJECT_MONSTERS[subject].map((monster) => monster.id)).size).toBe(3);
      const rareMonsters = getRareMonsters(subject);
      expect(rareMonsters).toHaveLength(3);
      expect(new Set(rareMonsters.map((monster) => monster.id)).size).toBe(3);
      rareMonsters.forEach((monster) => {
        expect(monster.requiredStreak).toBe(10);
        expect(monster.title).toMatch(/^擊敗後獲得限定稱號：/);
      });
    });
  });

  it("does not encounter rare monsters before a ten-answer streak", () => {
    for (let index = 0; index < 100; index += 1) {
      expect(getRandomSubjectMonster("chinese", () => 0, 9).isRare).not.toBe(true);
    }
  });

  it("can encounter a rare monster at the ten-answer threshold", () => {
    const rare = getRandomSubjectMonster("chinese", () => 0, 10);
    expect(rare.isRare).toBe(true);
    expect(rare.requiredStreak).toBe(10);
  });
});
