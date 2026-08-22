import { describe, expect, it } from "vitest";
import { answerAdaptiveBoss, bossPhaseLabel, createAdaptiveBoss } from "./adaptiveBoss";

describe("guardian boss battle", () => {
  it("creates a guardian with three times the base HP", () => {
    const guardian = createAdaptiveBoss("孔子之靈", { kind: "guardian", baseHp: 30 });
    expect(guardian.kind).toBe("guardian");
    expect(guardian.maxHp).toBe(90);
    expect(guardian.hp).toBe(90);
    expect(bossPhaseLabel(guardian)).toContain("HP 90 / 90");
  });

  it("cycles behavior modes while preserving wrong-answer feedback", () => {
    const guardian = createAdaptiveBoss("颱風獵人", { kind: "guardian", baseHp: 30 });
    const wrong = answerAdaptiveBoss(guardian, false);
    expect(wrong.outcome).toBe("active");
    expect(wrong.wrongAnswers).toBe(1);
    expect(["berserk", "heal", "dodge", "curse"]).toContain(wrong.behavior);
    expect(wrong.hp).toBe(90);
  });

  it("reduces HP on correct answers and ends at zero", () => {
    let guardian = createAdaptiveBoss("數學羅盤守護者", { kind: "guardian", baseHp: 10 });
    for (let i = 0; i < 3; i += 1) guardian = answerAdaptiveBoss(guardian, true);
    expect(guardian.maxHp).toBe(30);
    expect(guardian.hp).toBeLessThan(30);
    expect(guardian.correctAnswers).toBe(3);
    expect(guardian.outcome).toBe("active");
    for (let i = 0; i < 4; i += 1) guardian = answerAdaptiveBoss(guardian, true);
    expect(guardian.hp).toBe(0);
    expect(guardian.outcome).toBe("victory");
    expect(guardian.feedback).toContain("知識之光");
  });
});
