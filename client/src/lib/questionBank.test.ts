// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { LOCAL_QUESTION_BANK } from "./questionBank";
import { loadStudentGradePreference, STUDENT_GRADE_PREFERENCE_STORAGE_KEY } from "./studentGradePreference";

describe("內建題庫：國小＋國中", () => {
  it("國小 1090 題之外，另有 40 題七年級國中題（對應四堂國中動畫微課）", () => {
    const elementary = LOCAL_QUESTION_BANK.filter((q) => q.grade <= 6);
    const junior = LOCAL_QUESTION_BANK.filter((q) => q.grade === 7);
    expect(elementary.length).toBeGreaterThanOrEqual(1090);
    expect(junior).toHaveLength(40);
  });

  it("國中題每題欄位完整：4 個選項、答案索引合法、有解析與知識點", () => {
    for (const q of LOCAL_QUESTION_BANK.filter((x) => x.grade === 7)) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
      expect(q.explanation.length).toBeGreaterThan(5);
      expect(q.knowledge.length).toBeGreaterThan(0);
      expect(q.questionType).toBe("選擇題");
    }
  });

  it("國中題 id 不與國小題重複", () => {
    const ids = LOCAL_QUESTION_BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("國中題正解位置平均分布（不出現集中在第一選項的狀況）", () => {
    const junior = LOCAL_QUESTION_BANK.filter((q) => q.grade === 7);
    const counts = [0, 1, 2, 3].map((slot) => junior.filter((q) => q.answer === slot).length);
    for (const c of counts) expect(c).toBeGreaterThanOrEqual(5);
  });

  it("國中題涵蓋四個微課主題", () => {
    const topics = new Set(LOCAL_QUESTION_BANK.filter((q) => q.grade === 7).map((q) => q.learningTopic));
    expect([...topics].sort()).toEqual(["光合作用", "一元一次方程式", "細胞的構造", "負數與數線"].sort());
  });
});

describe("年級偏好支援國中", () => {
  it("七、八、九年級可被記憶（原本只接受 3-6）", () => {
    const cases: Array<[number, number | null]> = [
      [7, 7],
      [8, 8],
      [9, 9],
      [3, 3],
      [10, null],
    ];
    for (const [stored, expected] of cases) {
      localStorage.setItem(STUDENT_GRADE_PREFERENCE_STORAGE_KEY, JSON.stringify({ grade: stored }));
      expect(loadStudentGradePreference()).toBe(expected);
    }
    localStorage.clear();
  });
});
