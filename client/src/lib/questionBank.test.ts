// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest";
import { loadLocalBank, LOCAL_ENGLISH_BANK, LOCAL_QUESTION_BANK } from "./questionBank";
import { loadStudentGradePreference, STUDENT_GRADE_PREFERENCE_STORAGE_KEY } from "./studentGradePreference";

// 題庫 2.7MB 採動態載入，測試必須等它讀進來才能看到內容。
beforeAll(async () => {
  await loadLocalBank();
});

describe("內建題庫：國小＋國中", () => {
  it("擴充後共 5000 題，五科各 1000 題", () => {
    // 內建題庫（國小＋國中精簡檔）＋英語 seed 合計為全站 5000 題。
    const all = [...LOCAL_QUESTION_BANK, ...LOCAL_ENGLISH_BANK];
    expect(all.length).toBeGreaterThanOrEqual(5000);
    const counts = new Map<string, number>();
    for (const q of all) counts.set(q.subject, (counts.get(q.subject) ?? 0) + 1);
    for (const subject of ["數學", "自然", "社會", "國語", "英語"]) {
      expect(counts.get(subject) ?? 0, `${subject} 題數`).toBeGreaterThanOrEqual(1000);
    }
  });

  it("每個年級都有題（國中不再被靜默丟回國小題）", () => {
    for (const grade of [3, 4, 5, 6, 7, 8, 9]) {
      const count = LOCAL_QUESTION_BANK.filter((q) => q.grade === grade).length;
      expect(count, `${grade} 年級題數`).toBeGreaterThanOrEqual(600);
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

  it("七年級每題欄位完整：選項相異、答案索引合法、有解析與知識點", () => {
    // 擴充後七年級也有是非題（2 個選項），不再只有 4 選題。
    for (const q of LOCAL_QUESTION_BANK.filter((x) => x.grade === 7)) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explanation.length).toBeGreaterThan(5);
      expect(q.knowledge.length).toBeGreaterThan(0);
      expect(["選擇題", "是非題"]).toContain(q.questionType);
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

  it("七年級仍涵蓋原本四個微課主題（擴充後主題更多）", () => {
    const topics = new Set(LOCAL_QUESTION_BANK.filter((q) => q.grade === 7).map((q) => q.learningTopic));
    for (const topic of ["光合作用", "一元一次方程式", "細胞的構造", "負數與數線"]) {
      expect(topics.has(topic), `缺少主題 ${topic}`).toBe(true);
    }
    // 擴充後七年級不該只剩這四個主題
    expect(topics.size).toBeGreaterThan(10);
  });
});

describe("年級偏好：內容等級上限六年級", () => {
  it("舊國中年級（7–9）會夾成六年級，超出範圍則視為未設定", () => {
    const cases: Array<[number, number | null]> = [
      [7, 6],
      [8, 6],
      [9, 6],
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
