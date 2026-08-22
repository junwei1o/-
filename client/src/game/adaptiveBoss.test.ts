import { describe, expect, it } from "vitest";
import { answerAdaptiveBoss, bossPhaseLabel, bossVisualEvent, createAdaptiveBoss, retryAdaptiveBoss } from "./adaptiveBoss";

describe("adaptive boss", () => {
  it("progresses through three curriculum phases", () => {
    let state = createAdaptiveBoss("山海守門者");
    state = answerAdaptiveBoss(state, true);
    expect(state.phase).toBe(2);
    expect(state.questionDifficulty).toBe("標準");
    state = answerAdaptiveBoss(state, true);
    state = answerAdaptiveBoss(state, true);
    expect(state.phase).toBe(3);
    state = answerAdaptiveBoss(state, true);
    state = answerAdaptiveBoss(state, true);
    state = answerAdaptiveBoss(state, true);
    expect(state.outcome).toBe("victory");
  });

  it("supports a non-punitive reset of the streak", () => {
    let state = createAdaptiveBoss();
    state = answerAdaptiveBoss(state, true);
    state = answerAdaptiveBoss(state, false);
    expect(state.streak).toBe(0);
    expect(state.wrongAnswers).toBe(1);
    expect(state.feedback).toContain("不是失敗");
    expect(bossPhaseLabel(state)).toContain("標準題");
  });

  it("retries only after victory", () => {
    const active = createAdaptiveBoss();
    expect(retryAdaptiveBoss(active)).toBe(active);
    let victory = active;
    for (const correct of [true, true, true, true, true, true]) victory = answerAdaptiveBoss(victory, correct);
    expect(retryAdaptiveBoss(victory).outcome).toBe("active");
    expect(retryAdaptiveBoss(victory).phase).toBe(1);
  });

  it("maps boss transitions to visual events", () => {
    const initial = createAdaptiveBoss("山海守門者");
    expect(bossVisualEvent(null, initial)).toBe("start");
    expect(bossVisualEvent(initial, { ...initial, correctAnswers: 1, streak: 1 })).toBe("combo");
    expect(bossVisualEvent(initial, { ...initial, phase: 2, correctAnswers: 2, streak: 0 })).toBe("phase-transition");
    expect(bossVisualEvent(initial, { ...initial, wrongAnswers: 1, streak: 0 })).toBe("mistake");
    expect(bossVisualEvent(initial, { ...initial, outcome: "victory" })).toBe("victory");
    expect(bossVisualEvent(initial, initial)).toBeNull();
  });
});
