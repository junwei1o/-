import { describe, expect, it } from "vitest";
import { ACADEMY_ROUTES, academyRouteFor, expeditionStage } from "./academyQuestData";

describe("academy quest data", () => {
  it("provides one original learning route for each island region", () => {
    expect(ACADEMY_ROUTES.map((route) => route.region)).toEqual(["north", "central", "east", "south"]);
    expect(new Set(ACADEMY_ROUTES.map((route) => route.subject))).toEqual(new Set(["數學", "自然", "社會", "國語"]));
    expect(ACADEMY_ROUTES.every((route) => route.questTitle && route.bossTitle && route.domain && route.objectives.length === 3)).toBe(true);
  });

  it("returns a stable route for a selected region", () => {
    expect(academyRouteFor("south")).toMatchObject({ subject: "國語", landmark: "故事貝殼館" });
  });

  it("describes expedition progression without inventing learner performance", () => {
    expect(expeditionStage(0).label).toBe("入學定位");
    expect(expeditionStage(2).label).toBe("路徑延伸");
    expect(expeditionStage(4).label).toBe("星圖完成");
  });
});
