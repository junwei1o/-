import { describe, expect, it } from "vitest";
import {
  getSafetyAcademySummary,
  isSafetyCardCompleted,
  normalizeSafetyAcademyProgress,
  recordSafetyCardAnswer,
} from "./safetyAcademyProgress";

describe("生活安全學院答題進度", () => {
  it("答錯不會完成卡片，但會記錄嘗試次數", () => {
    const { progress, justCompleted } = recordSafetyCardAnswer({}, { cardKey: "handwashing", correct: false }, 100);
    expect(justCompleted).toBe(false);
    expect(progress.handwashing).toEqual({ attempts: 1, completedAt: 0 });
    expect(isSafetyCardCompleted(progress, "handwashing")).toBe(false);
  });

  it("首次答對標記完成並回報 justCompleted", () => {
    const wrong = recordSafetyCardAnswer({}, { cardKey: "handwashing", correct: false }, 100);
    const right = recordSafetyCardAnswer(wrong.progress, { cardKey: "handwashing", correct: true }, 200);
    expect(right.justCompleted).toBe(true);
    expect(right.progress.handwashing).toEqual({ attempts: 2, completedAt: 200 });
    expect(isSafetyCardCompleted(right.progress, "handwashing")).toBe(true);
  });

  it("重複答對不再回報 justCompleted（金幣只發一次）", () => {
    const first = recordSafetyCardAnswer({}, { cardKey: "fire-evacuation", correct: true }, 100);
    const second = recordSafetyCardAnswer(first.progress, { cardKey: "fire-evacuation", correct: true }, 200);
    expect(first.justCompleted).toBe(true);
    expect(second.justCompleted).toBe(false);
    expect(second.progress["fire-evacuation"]?.attempts).toBe(2);
    expect(second.progress["fire-evacuation"]?.completedAt).toBe(100);
  });

  it("摘要正確計算總進度與各館進度", () => {
    let run = recordSafetyCardAnswer({}, { cardKey: "handwashing", correct: true }, 1);
    run = recordSafetyCardAnswer(run.progress, { cardKey: "fire-evacuation", correct: true }, 2);
    const summary = getSafetyAcademySummary(run.progress);
    expect(summary.completedCards).toBe(2);
    expect(summary.totalCards).toBe(16);
    expect(summary.completionPercentage).toBe(13);
    const medical = summary.halls.find((hall) => hall.hall === "medical");
    const fire = summary.halls.find((hall) => hall.hall === "fire");
    expect(medical).toMatchObject({ completed: 1, total: 4 });
    expect(fire).toMatchObject({ completed: 1, total: 4 });
  });

  it("忽略損毀或未知卡片資料，保留舊存檔可讀性", () => {
    expect(normalizeSafetyAcademyProgress({ handwashing: { attempts: "bad" }, other: { attempts: 1 } })).toEqual({});
    const { progress } = recordSafetyCardAnswer({ handwashing: { attempts: 9, completedAt: 123 } }, { cardKey: "eye-care", correct: true }, 456);
    expect(progress.handwashing).toEqual({ attempts: 9, completedAt: 123 });
    expect(progress["eye-care"]?.completedAt).toBe(456);
  });
});
