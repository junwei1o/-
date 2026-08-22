import { describe, expect, it } from "vitest";
import { buildBattleDefeatReflection } from "./battleDefeatReflection";

describe("battle defeat reflection", () => {
  const tactics = { actions: [{ id: "skill", label: "潮汐脈衝", unavailable: false }] } as never;

  it("uses only a verified question topic to offer a single-question reinforcement step", () => {
    const reflection = buildBattleDefeatReflection({
      battle: { performance: { correct: false } } as never,
      question: { id: "q-water", subject: "自然", learningTopic: "水循環", prompt: "水循環題" },
      tactics,
    });

    expect(reflection.strategy).toContain("水循環");
    expect(reflection.practice).toMatchObject({ status: "available", label: "進行「水循環」一題補強" });
  });

  it("keeps a calm safe fallback when a question topic cannot be verified", () => {
    const reflection = buildBattleDefeatReflection({ battle: { performance: null } as never, question: { id: "q-unknown", subject: "自然" }, tactics });

    expect(reflection.practice.status).toBe("unavailable");
    expect(reflection.practice.readout).toContain("尚無可驗證");
  });
});
