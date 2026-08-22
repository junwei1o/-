import { describe, expect, it } from "vitest";
import {
  ACADEMY_STORY_QUESTS,
  claimStoryQuest,
  defaultStoryProgress,
  normalizeStoryProgress,
  recordStoryAnswer,
  storyQuestStatus,
  calculateStoryReport,
} from "./academyStory";
import { defaultRpgState } from "./rpgStorage";

describe("academy story progression", () => {
  it("normalizes missing or malformed progress without losing the version contract", () => {
    expect(normalizeStoryProgress(null)).toEqual(defaultStoryProgress());
    expect(normalizeStoryProgress({ correctByQuest: { "story-star-map": 2 }, completedQuestIds: ["ok", 4] })).toEqual({
      version: 1,
      correctByQuest: { "story-star-map": 2 },
      completedQuestIds: ["ok"],
      claimedQuestIds: [],
      eventFlags: [],
    });
  });

  it("advances only matching subject and domain answers", () => {
    const before = { ...defaultRpgState, storyProgress: defaultStoryProgress() };
    const wrongSubject = recordStoryAnswer(before, { subject: "社會", curriculumDomain: "數與運算", correct: true });
    expect(wrongSubject.completed).toHaveLength(0);
    expect(wrongSubject.state.storyProgress?.correctByQuest).toEqual({});

    const first = recordStoryAnswer(before, { subject: "數學", curriculumDomain: "數與運算", correct: true });
    expect(first.state.storyProgress?.correctByQuest["story-star-map"]).toBe(1);
    expect(first.completed).toHaveLength(0);
  });

  it("completes a quest after the configured number of correct answers", () => {
    let state = { ...defaultRpgState, storyProgress: defaultStoryProgress() };
    let completed = [] as typeof ACADEMY_STORY_QUESTS;
    for (let index = 0; index < 5; index += 1) {
      const result = recordStoryAnswer(state, { subject: "數學", curriculumDomain: "數與運算", correct: true });
      state = result.state;
      completed = result.completed;
    }
    const quest = ACADEMY_STORY_QUESTS.find((item) => item.id === "story-star-map")!;
    expect(completed.map((item) => item.id)).toContain(quest.id);
    expect(storyQuestStatus(state.storyProgress!, quest)).toMatchObject({ correct: 5, target: 5, complete: true, claimed: false, percent: 100 });
  });

  it("summarizes story participation by quest kind and curriculum domain", () => {
    const progress = {
      ...defaultStoryProgress(),
      correctByQuest: { "story-star-map": 5, "side-river-clues": 1 },
      completedQuestIds: ["story-star-map"],
      claimedQuestIds: ["story-star-map"],
      eventFlags: ["中央嶺地"],
    };
    const report = calculateStoryReport(progress);
    expect(report).toMatchObject({ attempted: 2, completed: 1, claimed: 1, total: 4, totalTarget: 13, totalCorrect: 6, percent: 46, eventFlags: ["中央嶺地"] });
    expect(report.byKind.find((item) => item.kind === "主線")).toMatchObject({ attempted: 1, completed: 1, claimed: 1 });
    expect(report.byDomain.find((item) => item.domain === "數與運算")).toMatchObject({ correct: 5, target: 5, percent: 100, completed: 1 });
  });

  it("grants a completed quest reward once and unlocks its event flag", () => {
    const quest = ACADEMY_STORY_QUESTS.find((item) => item.id === "event-market-route")!;
    const completedState = {
      ...defaultRpgState,
      storyProgress: {
        ...defaultStoryProgress(),
        completedQuestIds: [quest.id],
      },
    };
    const claimed = claimStoryQuest(completedState, quest.id);
    expect(claimed.energy).toBe(defaultRpgState.energy + quest.rewardEnergy);
    expect(claimed.coins).toBe(defaultRpgState.coins + quest.rewardCoins);
    expect(claimed.storyProgress?.claimedQuestIds).toEqual([quest.id]);
    expect(claimed.storyProgress?.eventFlags).toContain(quest.unlocks);
    expect(claimStoryQuest(claimed, quest.id)).toEqual(claimed);
  });
});
