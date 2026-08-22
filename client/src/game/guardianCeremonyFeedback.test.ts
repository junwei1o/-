import { describe, expect, it } from "vitest";
import { guardianCeremonyNarration, guardianCeremonySoundProfile, playGuardianCeremonySfx } from "./guardianCeremonyFeedback";

describe("guardian ceremony feedback", () => {
  it("provides distinct subject profiles for every guardian entrance and victory", () => {
    const subjects = ["chinese", "math", "english", "science"] as const;
    const entranceProfiles = subjects.map((subject) => guardianCeremonySoundProfile(subject, "entrance"));
    const victoryProfiles = subjects.map((subject) => guardianCeremonySoundProfile(subject, "victory"));

    expect(new Set(entranceProfiles.map((profile) => profile.notes.join(","))).size).toBe(4);
    expect(new Set(victoryProfiles.map((profile) => profile.notes.join(","))).size).toBe(4);
  });

  it("provides child-friendly Traditional Chinese entrance and liberation prompts", () => {
    expect(guardianCeremonyNarration("chinese", "entrance")).toContain("孔子之靈");
    expect(guardianCeremonyNarration("math", "victory")).toContain("數學城");
    expect(guardianCeremonyNarration("english", "entrance")).toContain("英文港");
    expect(guardianCeremonyNarration("science", "victory")).toContain("自然山");
  });

  it("does not construct ceremony audio when sound is disabled", () => {
    expect(playGuardianCeremonySfx("science", "entrance", false)).toBe(false);
  });
});
