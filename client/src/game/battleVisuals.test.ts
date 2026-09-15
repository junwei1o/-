import { describe, expect, it } from "vitest";
import { battleBackgroundForHabitat, battlePortraitForCompanion, battlePortraitForEncounter } from "./battleVisuals";

describe("battle visual mapping", () => {
  it("maps every arena habitat to a deployed background asset", () => {
    // A 路線手繪島嶼冒險風格：棲息地背景統一換成手繪 webp 素材。
    expect(battleBackgroundForHabitat("tidal-grove")).toContain("/assets/illustration/bg-mossland");
    expect(battleBackgroundForHabitat("cloud-shelf")).toContain("/assets/illustration/bg-mountain");
    expect(battleBackgroundForHabitat("star-current")).toContain("/assets/illustration/bg-ocean");
    expect(battleBackgroundForHabitat("coral-shallows")).toContain("/assets/illustration/bg-ocean");
  });

  it("uses original CSS portrait classes with deployed CC0-derived original image compositions", () => {
    expect(battlePortraitForCompanion({ id: "tide-scout" })).toMatchObject({ description: "原創潮芽獸戰鬥頭像", glyph: "◈", imageUrl: expect.stringContaining("academy-tide-scout") });
    expect(battlePortraitForCompanion({ id: "arena-moss-mote" })).toBeUndefined();
    expect(battlePortraitForEncounter({ id: "moss-mote" })).toMatchObject({ className: "avatar-moss-mote", imageUrl: expect.stringContaining("academy-moss-mote") });
    expect(battlePortraitForEncounter({ id: "reef-warden" })).toMatchObject({ className: "avatar-reef-warden", glyph: "⬟", imageUrl: expect.stringContaining("academy-reef-warden") });
  });
});
