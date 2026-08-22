import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

type Bank = {
  questionCount: number;
  questions: Array<{
    id: string;
    grade: number;
    subject: string;
    difficulty: string;
    curriculumDomain: string;
    options: string[];
    answer: number;
    prompt: string;
    explanation: string;
    knowledge: string[];
  }>;
};

describe("正式 500 題題庫", () => {
  it("具備完整數量與唯一題目 ID", async () => {
    const bank = JSON.parse(await readFile(new URL("../data/taiwan_curriculum_500.json", import.meta.url), "utf8")) as Bank;
    expect(bank.questionCount).toBe(500);
    expect(bank.questions).toHaveLength(500);
    expect(new Set(bank.questions.map((question) => question.id)).size).toBe(500);
  });

  it("每題都有四個選項、有效答案與課綱 metadata", async () => {
    const bank = JSON.parse(await readFile(new URL("../data/taiwan_curriculum_500.json", import.meta.url), "utf8")) as Bank;
    for (const question of bank.questions) {
      expect(question.grade).toBeGreaterThanOrEqual(3);
      expect(question.grade).toBeLessThanOrEqual(6);
      expect(["數學", "自然", "社會", "國語"]).toContain(question.subject);
      expect(["基礎", "標準", "挑戰"]).toContain(question.difficulty);
      expect(["語文領域", "數學領域", "自然科學領域", "社會領域"]).toContain(question.curriculumDomain);
      expect(question.options).toHaveLength(4);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(4);
      expect(question.prompt.trim()).not.toBe("");
      expect(question.explanation.trim()).not.toBe("");
      expect(question.knowledge.length).toBeGreaterThan(0);
    }
  });
});
