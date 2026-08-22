import { describe, expect, it } from "vitest";
import { calculateExpeditionProgress } from "./expeditionUnlocks";

const questions = [
  { id: "n1", area: "north" },
  { id: "n2", area: "north" },
  { id: "n3", area: "north" },
  { id: "c1", area: "central" },
  { id: "c2", area: "central" },
  { id: "e1", area: "east" },
  { id: "s1", area: "south" },
];

describe("expedition chapter unlocks", () => {
  it("uses only completed questions for regional unlock progress", () => {
    const progress = calculateExpeditionProgress(questions, ["n1", "n2", "n3", "c1"]);
    expect(progress.find((item) => item.key === "north")).toMatchObject({ answered: 3, unlocked: true, percent: 100 });
    expect(progress.find((item) => item.key === "central")).toMatchObject({ answered: 1, unlocked: false, percent: 17 });
  });

  it("uses the total completed question count for the academy chapter and caps percent", () => {
    const progress = calculateExpeditionProgress(questions, questions.map((question) => question.id), ["north"]);
    expect(progress.find((item) => item.key === "academy")).toMatchObject({ answered: 7, unlocked: false, percent: 35 });
    expect(progress.find((item) => item.key === "north")).toMatchObject({ badgeCollected: true });
  });

  it("ignores completed ids that are not in the formal question pool", () => {
    const progress = calculateExpeditionProgress(questions, ["unknown", "n1"]);
    expect(progress.find((item) => item.key === "academy")?.answered).toBe(1);
    expect(progress.find((item) => item.key === "north")?.answered).toBe(1);
  });
});
