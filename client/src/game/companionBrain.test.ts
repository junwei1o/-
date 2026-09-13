// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_COMPANION_MODEL,
  BRAIN_SOURCE_LABEL,
  buildRuleReflection,
  clearCompanionConfig,
  loadCompanionConfig,
  saveCompanionConfig,
  type RuleReflectionInput,
} from "./companionBrain";

const wrongInput: RuleReflectionInput = {
  question: "3 + 2 等於多少？",
  options: ["3", "5", "6", "8"],
  selectedAnswer: "6",
  correctAnswer: "5",
  correct: false,
  subject: "數學",
  learningTopic: "加法",
  turn: "first",
};

afterEach(() => localStorage.clear());

describe("buildRuleReflection 離線規則腦", () => {
  it("答錯首輪：用提問引導、不直接給答案，且對準他選的選項", () => {
    const text = buildRuleReflection(wrongInput);
    expect(text.endsWith("？") || text.endsWith("呢？")).toBe(true);
    expect(text).not.toContain("正確答案是");
    // 是一個問題（蘇格拉底引導）
    expect(text.includes("？")).toBe(true);
  });

  it("答對首輪：引導他解釋自己的推理", () => {
    const text = buildRuleReflection({ ...wrongInput, correct: true, selectedAnswer: "5" });
    expect(text).toMatch(/為什麼|理由|怎麼/);
  });

  it("追問輪換不同角度，且與首輪不同句", () => {
    const first = buildRuleReflection(wrongInput);
    const more = buildRuleReflection({ ...wrongInput, turn: "more" });
    expect(more).not.toBe(first);
    expect(more.includes("？")).toBe(true);
  });

  it("同一題同一輪具確定性（不會每次亂跳）", () => {
    expect(buildRuleReflection(wrongInput)).toBe(buildRuleReflection(wrongInput));
  });

  it("來源標籤齊全", () => {
    expect(BRAIN_SOURCE_LABEL.rule).toContain("離線");
    expect(BRAIN_SOURCE_LABEL.proxy).toBeTruthy();
    expect(BRAIN_SOURCE_LABEL.builtin).toBeTruthy();
  });
});

describe("代理設定本機存取", () => {
  it("沒設定時回 null", () => {
    expect(loadCompanionConfig()).toBeNull();
  });

  it("儲存後可讀回，並自動 trim", () => {
    saveCompanionConfig({ base: " https://x.com/v1/ ", key: " sk-1 ", model: " gpt-4o " });
    expect(loadCompanionConfig()).toEqual({ base: "https://x.com/v1", key: "sk-1", model: "gpt-4o" });
  });

  it("缺 base 或 key 視為未設定", () => {
    saveCompanionConfig({ base: "", key: "sk", model: "" });
    expect(loadCompanionConfig()).toBeNull();
  });

  it("清除後回到 null", () => {
    saveCompanionConfig({ base: "https://x.com/v1", key: "sk", model: DEFAULT_COMPANION_MODEL });
    clearCompanionConfig();
    expect(loadCompanionConfig()).toBeNull();
  });
});
