import { describe, expect, it } from "vitest";
import {
  normalizeMapVictoryProgress,
  recordMapVictory,
  routeIdForRegion,
  supplyMarkerIdForHabitat,
  supplyMarkerIdForRegion,
} from "@/game/mapVictoryProgress";

describe("mapVictoryProgress", () => {
  it("只為真實勝利區域建立航線與補給標記", () => {
    const progress = recordMapVictory(undefined, { region: "north", habitatId: "tidal-grove" });

    expect(progress).toEqual({
      unlockedRouteIds: [routeIdForRegion("north")],
      supplyMarkerIds: [supplyMarkerIdForRegion("north"), supplyMarkerIdForHabitat("tidal-grove")],
    });
  });

  it("重複勝利保持冪等，不重複累加地圖狀態", () => {
    const first = recordMapVictory(null, { region: "central", habitatId: "cloud-shelf" });
    const second = recordMapVictory(first, { region: "central", habitatId: "cloud-shelf" });

    expect(second).toEqual(first);
  });

  it("正規化舊存檔與重複識別碼，保留可用的真實資料", () => {
    expect(normalizeMapVictoryProgress({
      unlockedRouteIds: ["victory-route-east", "victory-route-east", ""],
      supplyMarkerIds: ["supply-east", "supply-east", ""],
    })).toEqual({
      unlockedRouteIds: ["victory-route-east"],
      supplyMarkerIds: ["supply-east"],
    });
  });
});
