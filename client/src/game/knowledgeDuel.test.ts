import { describe, expect, it } from "vitest";
import { ALL_CURRICULUM_QUESTIONS } from "@/game/expeditionContent";
import { createDuelRound, createRolePair, describeAiStrategy, DUEL_QUESTIONS_PER_ROUND, isValidLoadout, resolveDuelTurn, roleCounters, selectDuelQuestions, chooseAiCard, type DuelRound } from "./knowledgeDuel";

const question = ALL_CURRICULUM_QUESTIONS[0]!;

describe("knowledge duel rules", () => {
  it("always assigns different roles with a counter relationship", () => {
    const pair = createRolePair(() => 0.1);
    expect(pair.playerRole).not.toBe(pair.aiRole);
    expect(roleCounters(pair.playerRole, pair.aiRole) || roleCounters(pair.aiRole, pair.playerRole)).toBe(true);
  });

  it("requires a distinct three-card loadout", () => {
    expect(isValidLoadout(["knowledge-blessing", "shield", "first-aid"])).toBe(true);
    expect(isValidLoadout(["shield", "shield", "first-aid"])).toBe(false);
  });

  it("applies correct-answer damage, advances the round, and unlocks a high strategy card at three combo", () => {
    let round = createDuelRound(1);
    for (let index = 0; index < 3; index += 1) {
      const resolved = resolveDuelTurn({ round, question, playerRole: "detective", aiRole: "wolf", playerAnswer: question.answer, aiCorrect: false });
      round = resolved.round;
      if (index === 2) expect(resolved.highStrategyUnlocked).toBe(true);
    }
    expect(round.questionIndex).toBe(3);
    expect(round.playerCombo).toBe(3);
    expect(round.advancedStrategyAvailable).toBe(true);
    expect(round.aiHp).toBeLessThan(40);
  });

  it("treats timeout as an incorrect answer and honors a shield", () => {
    const round = createDuelRound(1, ["shield", "knowledge-blessing", "first-aid"]);
    const resolved = resolveDuelTurn({ round, question, playerRole: "knight", aiRole: "mage", playerAnswer: null, playerCard: "shield", aiCorrect: false });
    expect(resolved.turn.playerCorrect).toBe(false);
    expect(resolved.round.playerHp).toBe(100);
  });

  it("makes the AI choose distinct cards within a round", () => {
    const round = createDuelRound(1, undefined, ["knowledge-blessing", "shield", "first-aid"]);
    const first = chooseAiCard(round, 2);
    const afterFirst = { ...round, usedCards: [{ owner: "ai" as const, cardId: first!, enhanced: false, effective: true, effectValue: 10, note: "測試" }] } as DuelRound;
    const second = chooseAiCard(afterFirst, 2);
    expect(second).not.toBe(first);
  });

  it("explains the AI defensive choice without exposing the hidden role", () => {
    const round = { ...createDuelRound(1), playerCombo: 2 };
    const resolved = resolveDuelTurn({ round, question, playerRole: "detective", aiRole: "wolf", playerAnswer: question.answer, aiCorrect: false });
    const insight = describeAiStrategy(round, question.difficulty, resolved.turn.aiCard);

    expect(insight).toMatchObject({ cardId: "shield", cardName: "護盾" });
    expect(insight?.reason).toContain("連續答對");
    expect(insight?.outcome).toContain("護盾");
  });

  it("creates a five-question-or-longer weak-subject-weighted deck without duplicate ids", () => {
    const deck = selectDuelQuestions(ALL_CURRICULUM_QUESTIONS, ["math"], DUEL_QUESTIONS_PER_ROUND, () => 0);
    expect(deck).toHaveLength(DUEL_QUESTIONS_PER_ROUND);
    expect(new Set(deck.map((item) => item.id)).size).toBe(DUEL_QUESTIONS_PER_ROUND);
    expect(deck[0]?.subject).toBe("math");
  });
});
