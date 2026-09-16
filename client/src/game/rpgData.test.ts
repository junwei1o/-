import { describe, expect, it } from "vitest";
import { COMPANION_CATALOG, ENCOUNTERS, encounterForRegion, STARTER_COMPANION } from "./rpgData";

describe("rpg data 夥伴怪獸多樣化", () => {
  it("主角夥伴目錄 5 隻（含新夥伴黑熊護衛），id 全唯一", () => {
    expect(COMPANION_CATALOG).toHaveLength(5);
    expect(COMPANION_CATALOG.map((item) => item.id)).toEqual([
      "tide-scout",
      "ember-guard",
      "star-runner",
      "milk-dragonling",
      "formosa-bear",
    ]);
    expect(STARTER_COMPANION.id).toBe("tide-scout");
  });

  it("捕捉怪 12 隻：四個棲息地各 3 隻，稀有度三檔齊全", () => {
    expect(ENCOUNTERS).toHaveLength(12);
    const ids = ENCOUNTERS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    const byRegion: Record<string, typeof ENCOUNTERS> = {};
    for (const encounter of ENCOUNTERS) {
      (byRegion[encounter.region] ??= []).push(encounter);
    }
    for (const region of ["north", "central", "east", "south"] as const) {
      expect(byRegion[region]).toHaveLength(3);
      const rarities = new Set(byRegion[region].map((item) => item.rarity));
      expect(rarities.has("common")).toBe(true);
      expect(rarities.has("rare")).toBe(true);
      expect(rarities.has("legendary")).toBe(true);
    }
  });

  it("遭遇輪替：先遇低階未捕捉怪，捕捉後輪到下一隻，全捕捉後回傳最高階", () => {
    const north = ENCOUNTERS.filter((item) => item.region === "north").sort((a, b) => a.level - b.level);
    // 未擁有任何 → 第一隻（moss-mote）
    expect(encounterForRegion("north").id).toBe(north[0].id);
    // 已擁有第一隻 → 第二隻
    expect(encounterForRegion("north", [north[0].id]).id).toBe(north[1].id);
    // 已擁有前兩隻 → 第三隻（legendary）
    expect(encounterForRegion("north", [north[0].id, north[1].id]).id).toBe(north[2].id);
    // 全捕捉 → 回傳最高階（再次挑戰）
    expect(encounterForRegion("north", north.map((item) => item.id)).id).toBe(north[2].id);
  });

  it("新夥伴黑熊護衛具備完整養成欄位", () => {
    const bear = COMPANION_CATALOG.find((item) => item.id === "formosa-bear");
    expect(bear).toBeDefined();
    expect(bear!.rarity).toBe("legendary");
    expect(bear!.region).toBe("central");
    expect(bear!.energyPower).toBeGreaterThanOrEqual(10);
    expect(bear!.defense).toBeGreaterThanOrEqual(6);
    expect(bear!.dialogue.length).toBeGreaterThanOrEqual(2);
  });
});
