import { describe, expect, it } from "vitest";
import {
  ASTRONOMY_EXHIBITS,
  ASTRONOMY_QUIZ_QUESTIONS,
  ASTRONOMY_QUIZ_ROUND_SIZE,
  ASTRONOMY_QUIZ_TIERS,
  createAstronomyQuizDeck,
  getAstronomyExhibit,
  getAstronomyQuestionTier,
  getAstronomyQuizTier,
} from "./astronomy";

describe("astronomy exhibits", () => {
  it("contains a rich eight-zone observatory collection", () => {
    expect(ASTRONOMY_EXHIBITS).toHaveLength(8);
    expect(new Set(ASTRONOMY_EXHIBITS.map((item) => item.key)).size).toBe(8);
    expect(ASTRONOMY_EXHIBITS.map((item) => item.name)).toEqual([
      "宇宙尺度", "太陽系", "地球與月球", "恆星生命", "星系與黑洞", "觀星實驗室", "太空探索", "宇宙中的生命",
    ]);
  });

  it("keeps every exhibit complete and student-oriented", () => {
    for (const exhibit of ASTRONOMY_EXHIBITS) {
      expect(exhibit.short.length).toBeGreaterThan(10);
      expect(exhibit.explanation.length).toBeGreaterThan(30);
      expect(exhibit.lifeConnection.length).toBeGreaterThan(15);
      expect(exhibit.mission.length).toBeGreaterThan(15);
      expect(exhibit.question.length).toBeGreaterThan(10);
      expect(exhibit.keyIdeas).toHaveLength(3);
      expect(exhibit.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it("supports stable lookup for deep links", () => {
    expect(getAstronomyExhibit("solar-system")?.name).toBe("太陽系");
    expect(getAstronomyExhibit("missing")).toBeUndefined();
  });

  it("keeps the quiz bank anchored to astronomy exhibits only", () => {
    const keys = new Set(ASTRONOMY_EXHIBITS.map((exhibit) => exhibit.key));
    expect(ASTRONOMY_QUIZ_QUESTIONS.length).toBeGreaterThanOrEqual(32);
    for (const question of ASTRONOMY_QUIZ_QUESTIONS) {
      expect(keys.has(question.exhibitKey)).toBe(true);
      expect(question.topic).toBeTruthy();
      expect(question.options).toHaveLength(4);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(question.options.length);
      expect(question.explanation).toBeTruthy();
      expect(getAstronomyQuizTier(getAstronomyQuestionTier(question))).toBeDefined();
    }
  });

  it("provides four increasingly focused astronomy tiers with an isolated fixed deck", () => {
    expect(ASTRONOMY_QUIZ_TIERS.map((tier) => tier.id)).toEqual(["planet", "galaxy", "mission", "tools"]);
    expect(ASTRONOMY_QUIZ_TIERS.map((tier) => tier.name)).toEqual(["行星入門", "星系探索", "太空任務", "觀測工具"]);
    for (const tier of ASTRONOMY_QUIZ_TIERS) {
      const tierQuestions = ASTRONOMY_QUIZ_QUESTIONS.filter((question) => getAstronomyQuestionTier(question) === tier.id);
      expect(tierQuestions.length).toBeGreaterThanOrEqual(ASTRONOMY_QUIZ_ROUND_SIZE);
      const deck = createAstronomyQuizDeck(tier.id, () => 0.42);
      expect(deck).toHaveLength(ASTRONOMY_QUIZ_ROUND_SIZE);
      expect(new Set(deck.map((question) => question.id)).size).toBe(deck.length);
      expect(deck.every((question) => getAstronomyQuestionTier(question) === tier.id)).toBe(true);
    }
  });
});
