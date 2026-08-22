import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./CommunityHub.tsx", import.meta.url), "utf8");

describe("限時自我挑戰", () => {
  it("僅在 timed 查詢模式啟動倒數，並於逾時安全結算個人最佳紀錄", () => {
    expect(source).toContain('new URLSearchParams(search).get("mode") === "timed"');
    expect(source).toContain("TIMED_CHALLENGE_SECONDS = 60");
    expect(source).toContain("window.setInterval");
    expect(source).toContain("window.clearInterval");
    expect(source).toContain("saveSelfChallengeBest({ completed: challengeCount, correct: correctCount })");
  });
});
