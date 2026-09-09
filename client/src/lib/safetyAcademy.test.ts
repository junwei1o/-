import { describe, expect, it } from "vitest";
import {
  SAFETY_CARDS,
  SAFETY_CARD_KEYS,
  SAFETY_HALLS,
  SAFETY_QUIZ_REWARD_COINS,
  getSafetyCard,
  getSafetyCardsByHall,
  getSafetyHall,
} from "./safetyAcademy";

describe("生活安全學院資料", () => {
  it("共有 20 張卡，四個主題館各 5 張", () => {
    expect(SAFETY_CARDS).toHaveLength(20);
    expect(SAFETY_CARD_KEYS).toHaveLength(20);
    for (const hall of SAFETY_HALLS) {
      expect(getSafetyCardsByHall(hall.key)).toHaveLength(5);
    }
  });

  it("每張卡的 key 唯一且欄位完整", () => {
    const keys = new Set<string>();
    for (const card of SAFETY_CARDS) {
      expect(keys.has(card.key)).toBe(false);
      keys.add(card.key);
      expect(card.title.trim().length).toBeGreaterThan(0);
      expect(card.short.trim().length).toBeGreaterThan(0);
      expect(card.paragraphs.length).toBeGreaterThanOrEqual(2);
      expect(card.actionTips.length).toBeGreaterThanOrEqual(3);
      expect(card.lifeConnection.trim().length).toBeGreaterThan(0);
      expect(card.sourceLabel.trim().length).toBeGreaterThan(0);
      expect(card.sourceUrl.startsWith("https://")).toBe(true);
      expect(getSafetyHall(card.hall)).toBeDefined();
    }
  });

  it("每張卡的測驗都有 4 個不重複選項、合法答案索引與解析", () => {
    for (const card of SAFETY_CARDS) {
      const { quiz } = card;
      expect(quiz.options).toHaveLength(4);
      expect(new Set(quiz.options).size).toBe(4);
      expect(quiz.answer).toBeGreaterThanOrEqual(0);
      expect(quiz.answer).toBeLessThanOrEqual(3);
      expect(quiz.prompt.trim().length).toBeGreaterThan(0);
      expect(quiz.explanation.trim().length).toBeGreaterThan(0);
      // 選項文字不可與正解重複（干擾項必須是不同敘述）
      quiz.options.forEach((option, index) => {
        if (index !== quiz.answer) expect(option).not.toBe(quiz.options[quiz.answer]);
      });
    }
  });

  it("getSafetyCard 能依 key 取回卡片，未知 key 回傳 undefined", () => {
    expect(getSafetyCard("handwashing")?.title).toBe("正確洗手五步驟");
    expect(getSafetyCard("not-exists")).toBeUndefined();
    expect(getSafetyCard(undefined)).toBeUndefined();
  });

  it("金幣獎勵為正數且全部完成獎勵量級合理", () => {
    expect(SAFETY_QUIZ_REWARD_COINS).toBeGreaterThan(0);
    expect(SAFETY_QUIZ_REWARD_COINS * SAFETY_CARDS.length).toBe(40);
  });
});
