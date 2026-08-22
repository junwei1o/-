import { describe, expect, it } from "vitest";
import { getMapRegion, MAP_REGIONS } from "./mapRegions";

describe("map regions", () => {
  it("defines the four explorable Taiwan regions with accessible metadata", () => {
    expect(MAP_REGIONS.map((region) => region.key)).toEqual(["north", "central", "east", "south"]);
    MAP_REGIONS.forEach((region) => {
      expect(region.name).not.toHaveLength(0);
      expect(region.description.length).toBeGreaterThan(12);
      expect(region.learning).toContain("×");
      expect(region.className).toMatch(/^map-hotspot-/);
      expect(region.longDescription.length).toBeGreaterThan(40);
      expect(region.observationPoints).toHaveLength(3);
      expect(region.curriculumFocus.length).toBeGreaterThanOrEqual(2);
      expect(region.fieldQuestion).toMatch(/[？?]/);
    });
  });

  it("returns a stable fallback for an unknown region key", () => {
    expect(getMapRegion("unknown" as never)).toEqual(MAP_REGIONS[0]);
  });
});
