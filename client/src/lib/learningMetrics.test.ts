import { describe, expect, it } from "vitest";
import { calculateLearningReport, loadPersistedLearningState } from "./learningMetrics";

const fallback = { stars: 12, streak: 2, xp: 68, completed: [], wrong: [], notes: [], sound: true };
const questions = [
  { id: "a", subject: "數學", curriculumDomain: "數學領域", knowledge: ["分數"] },
  { id: "b", subject: "自然", curriculumDomain: "自然科學領域", knowledge: ["觀察"] },
  { id: "c", subject: "數學", curriculumDomain: "數學領域", knowledge: ["分數"] },
];

describe("learning metrics regression", () => {
  it("有效 localStorage 會完整恢復學習狀態", () => {
    const saved = { stars: 88, streak: 7, xp: 240, completed: ["a"], wrong: ["b"], notes: [{ text: "觀察筆記", date: "2026/8/13" }], sound: false };
    const storage = { getItem: () => JSON.stringify(saved), removeItem: () => undefined };
    expect(loadPersistedLearningState(storage, "state", fallback)).toEqual(saved);
  });

  it("損壞 localStorage 會清除並回退到預設狀態", () => {
    let removed = false;
    const storage = {
      getItem: () => "{broken-json",
      removeItem: () => { removed = true; },
    };
    expect(loadPersistedLearningState(storage, "state", fallback)).toEqual(fallback);
    expect(removed).toBe(true);
  });

  it("只計算有效題目，且答錯題會列入已作答但不列入答對", () => {
    const report = calculateLearningReport(questions, ["a"], ["b", "unknown"], ["數學領域", "自然科學領域"]);
    expect(report.answered).toBe(2);
    expect(report.correct).toBe(1);
    expect(report.wrong).toBe(1);
    expect(report.accuracy).toBe(50);
    expect(report.domainStats).toEqual([
      { domain: "數學領域", total: 2, answered: 1, correct: 1, mastery: 100 },
      { domain: "自然科學領域", total: 1, answered: 1, correct: 0, mastery: 0 },
    ]);
  });

  it("錯題本移除有效 ID 後，報告不會殘留不存在的題目", () => {
    const report = calculateLearningReport(questions, [], ["unknown"], ["數學領域"]);
    expect(report.answered).toBe(0);
    expect(report.wrong).toBe(0);
    expect(report.accuracy).toBe(0);
  });
});
