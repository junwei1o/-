// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest";
import { loadLocalBank, LOCAL_ENGLISH_BANK, LOCAL_QUESTION_BANK, mergeAcrossSources } from "./questionBank";
import type { CurriculumQuestionRow } from "./questionBank";
import { loadStudentGradePreference, STUDENT_GRADE_PREFERENCE_STORAGE_KEY } from "./studentGradePreference";

// 題庫 2.7MB 採動態載入，測試必須等它讀進來才能看到內容。
beforeAll(async () => {
  await loadLocalBank();
});

describe("內建題庫：國小", () => {
  it("題庫規模足夠，五科皆有份量（刻意不斷言精確題數）", () => {
    // 2026-09-28：國中／高中題庫已移除，改為國小單一學段。
    // ⚠️ 這裡刻意不寫死精確題數：題庫會成長（948→1090→2895→3199），
    //    寫死數字只會製造下一次漂移。精確值以 data/runtime_bank_elementary.json 為準。
    const all = [...LOCAL_QUESTION_BANK, ...LOCAL_ENGLISH_BANK];
    expect(all.length).toBeGreaterThanOrEqual(2000);
    const counts = new Map<string, number>();
    for (const q of all) counts.set(q.subject, (counts.get(q.subject) ?? 0) + 1);
    for (const subject of ["數學", "自然", "社會", "國語", "英語"]) {
      expect(counts.get(subject) ?? 0, `${subject} 題數`).toBeGreaterThanOrEqual(100);
    }
  });

  it("跨學科結合題：三科結合 120 題＋五科結合 80 題，且每科都有對應知識點", () => {
    const cross = LOCAL_QUESTION_BANK.filter(
      (q) => Array.isArray((q as { subjectCombination?: unknown }).subjectCombination),
    ) as Array<{ subjectCombination: string[]; knowledge: string[] }>;
    expect(cross.length).toBeGreaterThanOrEqual(100);
    expect(cross.filter((q) => q.subjectCombination.length === 3).length).toBeGreaterThanOrEqual(60);
    expect(cross.filter((q) => q.subjectCombination.length === 5).length).toBeGreaterThanOrEqual(40);
    for (const q of cross) {
      // 科目不能重複，而且每個科目都要有對應的知識點——否則就是有科目只是「湊數」
      expect(new Set(q.subjectCombination).size).toBe(q.subjectCombination.length);
      expect(q.knowledge.length).toBe(q.subjectCombination.length);
    }
  });

  it("每個年級（3–6）都有題", () => {
    for (const grade of [3, 4, 5, 6]) {
      const count = LOCAL_QUESTION_BANK.filter((q) => q.grade === grade).length;
      expect(count, `${grade} 年級題數`).toBeGreaterThanOrEqual(100);
    }
  });

  it("國小題每題欄位完整：選項相異、答案索引合法、有解析與知識點", () => {
    for (const q of LOCAL_QUESTION_BANK.slice(0, 300)) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explanation.length).toBeGreaterThan(5);
      expect(q.knowledge.length).toBeGreaterThan(0);
      expect(["選擇題", "是非題"]).toContain(q.questionType);
    }
  });

  it("題目 id 全站唯一", () => {
    const ids = LOCAL_QUESTION_BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("正解位置平均分布（不出現集中在第一選項的狀況）", () => {
    const counts = [0, 1, 2, 3].map(
      (slot) => LOCAL_QUESTION_BANK.filter((q) => q.answer === slot).length,
    );
    for (const c of counts) expect(c).toBeGreaterThanOrEqual(5);
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


describe("mergeAcrossSources：只在跨來源去重", () => {
  /** 造一列合法題目；prompt 與 answer 可覆寫以便模擬「同題幹不同答案」。 */
  const row = (
    id: string,
    prompt: string,
    answer = 0,
    subject: CurriculumQuestionRow["subject"] = "國語",
  ): CurriculumQuestionRow => ({
    id,
    grade: 3,
    subject,
    questionType: "選擇題",
    difficulty: "基礎",
    curriculumDomain: "語文領域",
    learningTopic: "測試主題",
    prompt,
    options: ["甲", "乙", "丙", "丁"],
    answer,
    explanation: "解析",
    knowledge: ["知識點"],
  });

  const TEMPLATE = "下列四句英語的敘述中，有一句觀念錯誤，是哪一句？";

  it("同一來源內共用模板題幹的題目全部保留（這是回歸重點）", () => {
    // 本地題庫就是這種型態：同題幹、不同選項與答案，共 44 題
    const local = [
      row("a1", TEMPLATE, 0),
      row("a2", TEMPLATE, 1),
      row("a3", TEMPLATE, 2),
      row("a4", TEMPLATE, 3),
    ];
    const merged = mergeAcrossSources([[], local]);
    expect(merged).toHaveLength(4);
    expect(new Set(merged.map((q) => q.id)).size).toBe(4);
  });

  it("跨來源同題只留最先出現的那份", () => {
    const server = [row("s1", "同一題", 1), row("s2", "後端獨有", 0)];
    const local = [row("l1", "同一題", 3), row("l2", "本地獨有", 2)];
    const merged = mergeAcrossSources([server, local]);
    expect(merged.map((q) => q.id)).toEqual(["s1", "s2", "l2"]);
  });

  it("第三個來源跟「前兩個」比對，但不會跟自己比對", () => {
    const server = [row("s1", "前源已有", 0)];
    const local = [row("l1", "前源已有", 1)];
    const third = [
      row("e1", "前源已有", 2),           // 前源已有 → 略過
      row("e2", "第三源自己有兩題", 3),   // 第三源內部不去重
      row("e3", "第三源自己有兩題", 0),   // 同上，兩題都留
    ];
    const merged = mergeAcrossSources([server, local, third]);
    expect(merged.map((q) => q.id)).toEqual(["s1", "e2", "e3"]);
  });

  it("題幹空白的資料列改用 id 判斷，不會被整批刪掉", () => {
    const a = [row("id-1", ""), row("id-2", "")];
    const b = [row("id-1", ""), row("id-3", "")];
    const merged = mergeAcrossSources([a, b]);
    expect(merged.map((q) => q.id)).toEqual(["id-1", "id-2", "id-3"]);
  });

  it("實測資料集：合併後題數高於逐題去重的舊邏輯", async () => {
    await loadLocalBank();
    const local = [...LOCAL_QUESTION_BANK, ...LOCAL_ENGLISH_BANK];
    const merged = mergeAcrossSources([local, local.slice(0, 0)]);
    // 本地同源不去重 → 全數保留
    expect(merged).toHaveLength(local.length);
  });
});
