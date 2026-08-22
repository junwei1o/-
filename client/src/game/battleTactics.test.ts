import { describe, expect, it } from "vitest";
import { createBattle } from "./rpgBattle";
import { getBattleTactics } from "./battleTactics";

const companion = { energyPower: 8, skillCost: 4, skillName: "潮汐脈衝" };
const encounter = { level: 4, name: "苔光小靈", maxHp: 20, hp: 20, id: "moss", region: "north" as const, defense: 1, captureCost: 3, description: "", accent: "#fff" };

describe("battle tactics preview", () => {
  it("keeps the free basic action and makes existing answer-gated effects readable", () => {
    const battle = { ...createBattle({ ...companion, id: "ally", name: "測試夥伴", epithet: "", region: "north" as const, rarity: "common" as const, level: 1, xp: 0, hp: 20, maxHp: 20, defense: 1, dialogue: [], accent: "#fff" }, encounter), energy: 4 };
    const tactics = getBattleTactics({ battle, companion, encounter, ultimateLabel: "潮汐終曲" });

    expect(tactics.intent.damage).toBe(5);
    expect(tactics.actions[0]).toMatchObject({ id: "basic", unavailable: false, availability: "隨時可用" });
    expect(tactics.actions[1].detail).toContain("答對至少造成 17 點");
    expect(tactics.actions[2]).toMatchObject({ unavailable: true, availability: "尚需 4 能量" });
  });

  it("shows the exact existing defense reduction when a question performance is present", () => {
    const battle = { ...createBattle({ ...companion, id: "ally", name: "測試夥伴", epithet: "", region: "north" as const, rarity: "common" as const, level: 1, xp: 0, hp: 20, maxHp: 20, defense: 1, dialogue: [], accent: "#fff" }, encounter), turn: "enemy" as const, performance: { questionId: "q", correct: true, responseMs: 1_000, accuracy: 90, attackPower: 10, defensePower: 3, captureChance: 65 } };
    const tactics = getBattleTactics({ battle, companion, encounter, ultimateLabel: "潮汐終曲" });

    expect(tactics.intent).toMatchObject({ title: "守門者正準備回應", damage: 2 });
    expect(tactics.intent.detail).toContain("由 5 降為 2 點");
  });
});
