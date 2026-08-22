import { describe, expect, it } from "vitest";
import { academyGearBonuses, academyObjectiveStatus, academyRouteForSubject } from "./academyQuestData";
import { completeAcademyBoss, defaultRpgState } from "./rpgStorage";

describe("學苑遠征進度", () => {
  it("依科目選擇對應學苑路徑", () => {
    expect(academyRouteForSubject("數學")?.region).toBe("north");
    expect(academyRouteForSubject("不存在")).toBeUndefined();
  });

  it("以答對次數與 Boss 勝利逐步完成任務目標", () => {
    expect(academyObjectiveStatus(0, 0).filter((item) => item.complete)).toHaveLength(0);
    expect(academyObjectiveStatus(3, 1).filter((item) => item.complete)).toHaveLength(3);
  });

  it("首次突破守門者授予一次原創徽記，重複勝利不重複授予", () => {
    const first = completeAcademyBoss(defaultRpgState, "north");
    const second = completeAcademyBoss(first, "north");
    expect(first.academyGearIds).toContain("tide-abacus");
    expect(second.academyGearIds?.filter((id) => id === "tide-abacus")).toHaveLength(1);
    expect(second.academyProgress?.north?.bossVictories).toBe(2);
  });

  it("徽記加成僅計算已獲得的原創裝備", () => {
    expect(academyGearBonuses(["tide-abacus", "wind-observer", "unknown"])).toEqual({ attack: 1, defense: 1, capture: 0 });
  });
});
