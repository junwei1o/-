import { describe, expect, it } from "vitest";
import { activeHabitatDailyStatus, habitatDailyMissionFor, habitatDailyStatuses, normalizeHabitatDailyProgress, recordHabitatDailyAnswer } from "./habitatDailyMissions";
import { defaultRpgState } from "./rpgStorage";

const DAY_KEY = "2026-08-15";

describe("habitat daily micro quests", () => {
  it("creates a stable, curriculum-aligned mission for the same habitat and day", () => {
    const first = habitatDailyMissionFor("tidal-grove", DAY_KEY);
    const second = habitatDailyMissionFor("tidal-grove", DAY_KEY);
    expect(first).toEqual(second);
    expect(first.subject).toBe("數學");
    expect(first.targetCorrectAnswers).toBe(2);
  });

  it("counts only correct answers from an unlocked matching habitat route", () => {
    const first = recordHabitatDailyAnswer(defaultRpgState, { correct: true, subject: "數學" }, DAY_KEY);
    expect(first.progress.correctByHabitat["tidal-grove"]).toBe(1);
    expect(first.completed).toBeNull();

    const locked = recordHabitatDailyAnswer(defaultRpgState, { correct: true, subject: "自然" }, DAY_KEY);
    expect(locked.progress.correctByHabitat["cloud-shelf"]).toBeUndefined();
    expect(locked.completed).toBeNull();
  });

  it("completes one habitat once, then prevents additional daily rewards", () => {
    const first = recordHabitatDailyAnswer(defaultRpgState, { correct: true, subject: "數學" }, DAY_KEY);
    const stateAfterFirst = { ...defaultRpgState, habitatDailyProgress: first.progress };
    const second = recordHabitatDailyAnswer(stateAfterFirst, { correct: true, subject: "數學" }, DAY_KEY);
    expect(second.completed?.id).toBe("tidal-grove");
    expect(second.progress.completedHabitatIds).toEqual(["tidal-grove"]);

    const stateAfterComplete = { ...defaultRpgState, habitatDailyProgress: second.progress };
    const repeated = recordHabitatDailyAnswer(stateAfterComplete, { correct: true, subject: "數學" }, DAY_KEY);
    expect(repeated.completed).toBeNull();
    expect(repeated.progress.correctByHabitat["tidal-grove"]).toBe(2);
  });

  it("resets progress on a new local day and falls back from malformed saved values", () => {
    const progress = normalizeHabitatDailyProgress({ dayKey: DAY_KEY, correctByHabitat: { "tidal-grove": 9, unknown: 2 }, completedHabitatIds: ["tidal-grove", "unknown"] });
    expect(progress).toEqual({ dayKey: DAY_KEY, correctByHabitat: { "tidal-grove": 2 }, completedHabitatIds: ["tidal-grove"] });

    const state = { ...defaultRpgState, habitatDailyProgress: progress };
    const nextDay = habitatDailyStatuses(state, "2026-08-16").find((item) => item.mission.id === "tidal-grove");
    expect(nextDay?.correctAnswers).toBe(0);
    expect(nextDay?.completed).toBe(false);
  });

  it("prefers a selected unlocked habitat and otherwise shows the current unlocked route", () => {
    const state = {
      ...defaultRpgState,
      currentRegion: "central" as const,
      arenaHabitatId: "cloud-shelf" as const,
      academyProgress: { central: { correctAnswers: 3, bossVictories: 0 } },
    };
    expect(activeHabitatDailyStatus(state, DAY_KEY)?.mission.id).toBe("cloud-shelf");
  });
});
