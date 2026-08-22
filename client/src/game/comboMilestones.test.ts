import { describe, expect, it } from "vitest";
import { COMBO_MILESTONE_DISPLAY_MS, comboMilestoneFor } from "./comboMilestones";

describe("連擊里程碑", () => {
  it("只在四個指定連擊數發放一次性獎勵資料", () => {
    expect(comboMilestoneFor(4)).toBeNull();
    expect(comboMilestoneFor(5)).toMatchObject({ tone: "blue", reward: "本回合傷害 +10%" });
    expect(comboMilestoneFor(10)).toMatchObject({ tone: "gold", reward: "生命值 +10" });
    expect(comboMilestoneFor(15)).toMatchObject({ tone: "rainbow", reward: "解鎖稱號：連擊大師" });
    expect(comboMilestoneFor(20)).toMatchObject({ tone: "star", reward: "金幣 +50" });
    expect(comboMilestoneFor(21)).toBeNull();
  });

  it("為答題計時暫停提供短暫且一致的展示時間", () => {
    expect(COMBO_MILESTONE_DISPLAY_MS).toBeGreaterThanOrEqual(500);
    expect(COMBO_MILESTONE_DISPLAY_MS).toBeLessThanOrEqual(1_500);
  });
});
