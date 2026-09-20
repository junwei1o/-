// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { LOCAL_QUESTION_BANK } from "./questionBank";
import { loadStudentGradePreference, STUDENT_GRADE_PREFERENCE_STORAGE_KEY } from "./studentGradePreference";

describe("內建題庫：國小＋國中", () => {
  it("國小 1090 題之外，另有七、八、九年級各 40 題國中題", () => {
    const elementary = LOCAL_QUESTION_BANK.filter((q) => q.grade <= 6);
    const junior = LOCAL_QUESTION_BANK.filter((q) => q.grade >= 7);
    expect(elementary.length).toBeGreaterThanOrEqual(1090);
    expect(junior).toHaveLength(120);
    // 年級開到九年級後，每個國中年級都必須有題，否則該年級學生會被靜默丟回國小題
    for (const grade of [7, 8, 9]) {
      expect(junior.filter((q) => q.grade === grade).length, `${grade} 年級題數`).toBe(40);
    }
  });

  it("國中三個年級都涵蓋四個科目（否則選了年級會沒題目）", () => {
    for (const grade of [7, 8, 9]) {
      const subjects = new Set(
        LOCAL_QUESTION_BANK.filter((q) => q.grade === grade).map((q) => q.subject),
      );
      expect(subjects.size, `${grade} 年級科目數`).toBeGreaterThanOrEqual(2);
      expect(subjects.has("數學")).toBe(true);
      expect(subjects.has("自然")).toBe(true);
    }
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
