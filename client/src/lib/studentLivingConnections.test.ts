import { describe, expect, it } from "vitest";
import { buildStudentLivingConnections } from "@/lib/studentLivingConnections";

describe("buildStudentLivingConnections", () => {
  it("returns no fabricated connection when the student has no attempts, favorites, or completed stations", () => {
    expect(buildStudentLivingConnections({
      profile: { version: 2, attempts: [], spacedReviews: [] },
      favoriteScenarioIds: [],
      observatoryStations: [],
    })).toEqual({});
  });

  it("uses only an observed knowledge tag and domain for ordinary practice examples", () => {
    const connections = buildStudentLivingConnections({
      profile: {
        version: 2,
        attempts: [{
          questionId: "science-shadow-1",
          curriculumDomain: "自然科學",
          knowledge: ["影子的變化"],
          difficulty: "基礎",
          correct: false,
          responseMs: 12_000,
          timeLimitMs: 30_000,
          timestamp: 1,
        }],
        spacedReviews: [],
      },
      favoriteScenarioIds: [],
      observatoryStations: [],
    });

    expect(connections.exam?.subject).toBe("自然科學");
    expect(connections.exam?.lifeExamples).toEqual(["你最近練習的「影子的變化」，可以在觀察校園的天氣、影子或天空時，先找找和它有關的線索。"]);
    expect(connections.exam?.lifeExamples.join(" ")).not.toMatch(/正確答案|答對|答錯|選項/);
  });

  it("creates a media connection only for a genuinely completed station", () => {
    const connections = buildStudentLivingConnections({
      profile: { version: 2, attempts: [], spacedReviews: [] },
      favoriteScenarioIds: [],
      observatoryStations: [{ title: "奧特曼", completed: false }, { title: "假面騎士", completed: true }],
    });

    expect(connections.observatory?.lifeExamples[0]).toContain("假面騎士");
    expect(connections.observatory?.lifeExamples[0]).not.toContain("奧特曼");
  });
});
