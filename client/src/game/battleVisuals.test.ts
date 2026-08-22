import { describe, expect, it } from "vitest";
import { battleBackgroundForHabitat, battlePortraitForCompanion, battlePortraitForEncounter } from "./battleVisuals";

describe("battle visual mapping", () => {
  it("maps every arena habitat to a deployed background asset", () => {
    expect(battleBackgroundForHabitat("tidal-grove")).toContain("academy-tidal-grove-arena");
    expect(battleBackgroundForHabitat("cloud-shelf")).toContain("uncolored_peaks");
    expect(battleBackgroundForHabitat("star-current")).toContain("sky_");
    expect(battleBackgroundForHabitat("coral-shallows")).toContain("colored_talltrees");
  });

  it("uses original CSS portrait classes with deployed CC0-derived original image compositions", () => {
    expect(battlePortraitForCompanion({ id: "tide-scout" })).toMatchObject({ description: "原創潮芽獸戰鬥頭像", glyph: "◈", imageUrl: expect.stringContaining("academy-tide-scout") });
    expect(battlePortraitForCompanion({ id: "arena-moss-mote" })).toBeUndefined();
    expect(battlePortraitForEncounter({ id: "moss-mote" })).toMatchObject({ className: "avatar-moss-mote", imageUrl: expect.stringContaining("academy-moss-mote") });
    expect(battlePortraitForEncounter({ id: "reef-warden" })).toMatchObject({ className: "avatar-reef-warden", glyph: "⬟", imageUrl: expect.stringContaining("academy-reef-warden") });
  });
});
