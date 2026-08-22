import { describe, expect, it } from "vitest";
import { WORLD_PRINCIPLES, getWorldPrinciple, getWormholeQuestionGuidance, WORMHOLE_GUIDE_QUESTIONS } from "./worldPrinciples";

describe("world principles wormhole content", () => {
  it("contains the seven requested world principles", () => {
    expect(WORLD_PRINCIPLES).toHaveLength(7);
    expect(WORLD_PRINCIPLES.map((item) => item.name)).toEqual([
      "相對論",
      "第一性原理",
      "量子力學",
      "熱力學",
      "電磁學",
      "宇宙四大力",
      "不可能三角",
    ]);
  });

  it("keeps every learning card complete and addressable", () => {
    const keys = WORLD_PRINCIPLES.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
    WORLD_PRINCIPLES.forEach((item) => {
      expect(item.short.length).toBeGreaterThan(12);
      expect(item.explanation.length).toBeGreaterThan(40);
      expect(item.lifeConnection.length).toBeGreaterThan(12);
      expect(item.keyIdeas).toHaveLength(3);
      expect(item.prompt.length).toBeGreaterThan(12);
      expect(getWorldPrinciple(item.key)).toEqual(item);
    });
  });

  it("keeps wormhole pre-answer guidance limited to reasoning support rather than answer disclosure", () => {
    WORMHOLE_GUIDE_QUESTIONS.forEach((question) => {
      const guidance = getWormholeQuestionGuidance(question);
      expect(guidance.keywords).toHaveLength(3);
      expect(guidance.reasoningSteps).toHaveLength(3);
      expect(guidance.scenario.title.length).toBeGreaterThan(6);
      expect(guidance.scenario.location.length).toBeGreaterThan(6);
      expect(guidance.scenario.context.length).toBeGreaterThan(24);
      expect(guidance.scenario.choices).toHaveLength(3);
      expect(new Set(guidance.scenario.choices.map((choice) => choice.id)).size).toBe(3);
      expect(guidance.scenario.choices.every((choice) => choice.label.length > 8 && choice.reflection.length > 16)).toBe(true);
      expect(guidance.scenario.choices.every((choice) => !choice.label.includes(question.options[question.correctIndex]))).toBe(true);
      expect(guidance.ttsText).not.toContain(question.options[question.correctIndex]);
      expect(guidance.ttsText).not.toContain(question.explanation);
    });
  });
});
