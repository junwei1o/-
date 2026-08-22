import { describe, expect, it } from "vitest";
import { getAnimeWorldviewProgressSummary, normalizeAnimeWorldviewProgress, recordAnimeWorldviewQuizResult } from "./animeWorldviewProgress";

describe("動漫世界觀小測驗進度", () => {
  it("第一次完成時記錄分數並以已完成站數計算整體探索進度", () => {
    const progress = recordAnimeWorldviewQuizResult({}, { entryKey: "nailong", correct: 4, total: 5 }, 100);
    expect(progress.nailong).toEqual({ attempts: 1, lastCorrect: 4, bestCorrect: 4, total: 5, completedAt: 100 });
    expect(getAnimeWorldviewProgressSummary(progress)).toMatchObject({ completedStations: 1, totalStations: 3, completionPercentage: 33 });
  });

  it("重玩會保留較高的最佳分數，並如實記錄最近一次與挑戰次數", () => {
    const first = recordAnimeWorldviewQuizResult({}, { entryKey: "ultraman", correct: 5, total: 5 }, 100);
    const replayed = recordAnimeWorldviewQuizResult(first, { entryKey: "ultraman", correct: 2, total: 5 }, 200);
    expect(replayed.ultraman).toEqual({ attempts: 2, lastCorrect: 2, bestCorrect: 5, total: 5, completedAt: 200 });
  });

  it("忽略損毀或未知站點資料，保留舊版本本機存檔可讀性", () => {
    expect(normalizeAnimeWorldviewProgress({ nailong: { attempts: "bad" }, other: { attempts: 1 } })).toEqual({});
  });
});
