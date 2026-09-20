// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { saveUserPreferences, USER_PREFERENCES_STORAGE_KEY } from "@/game/adaptiveLearning";
import { loadStudentGradePreference, STUDENT_GRADE_PREFERENCE_STORAGE_KEY } from "./studentGradePreference";

describe("學生年級偏好", () => {
  beforeEach(() => localStorage.clear());

  it("只讀取既有篩選設定中有效的小學年級，缺漏或損壞資料安全降級", () => {
    expect(loadStudentGradePreference()).toBeNull();

    localStorage.setItem(STUDENT_GRADE_PREFERENCE_STORAGE_KEY, JSON.stringify({ grade: 3, subject: "自然" }));
    expect(loadStudentGradePreference()).toBe(3);

    localStorage.setItem(STUDENT_GRADE_PREFERENCE_STORAGE_KEY, JSON.stringify({ grade: "all" }));
    expect(loadStudentGradePreference()).toBeNull();

    localStorage.setItem(STUDENT_GRADE_PREFERENCE_STORAGE_KEY, "{");
    expect(loadStudentGradePreference()).toBeNull();
  });

  it("設定頁存舊國中年級（7–9）會被夾成六年級，而不是讀不到", () => {
    // 本站服務國小，內容等級上限六年級；舊國中資料載入時夾成 6，保留「已設定」狀態。
    // 設定頁（Settings）寫的是 UserPreferences.gradeLevel，與 filters key 是不同一份。
    for (const grade of [7, 8, 9] as const) {
      localStorage.clear();
      saveUserPreferences({
        version: 1,
        gradeLevel: grade,
        difficultyPreference: "均衡混合",
        updatedAt: Date.now(),
      });
      expect(loadStudentGradePreference()).toBe(6);
    }
  });

  it("設定頁存六年級時仍讀得到六年級", () => {
    localStorage.clear();
    saveUserPreferences({
      version: 1,
      gradeLevel: 6,
      difficultyPreference: "均衡混合",
      updatedAt: Date.now(),
    });
    expect(loadStudentGradePreference()).toBe(6);
  });

  it("從沒設定過就維持 null（不會被預設值四年級吃掉）", () => {
    localStorage.clear();
    expect(localStorage.getItem(USER_PREFERENCES_STORAGE_KEY)).toBeNull();
    expect(loadStudentGradePreference()).toBeNull();
  });

  it("filters 那份有值時以它為優先（舊資料相容）", () => {
    localStorage.clear();
    saveUserPreferences({ version: 1, gradeLevel: 8, difficultyPreference: "均衡混合", updatedAt: Date.now() });
    localStorage.setItem(STUDENT_GRADE_PREFERENCE_STORAGE_KEY, JSON.stringify({ grade: 5 }));
    expect(loadStudentGradePreference()).toBe(5);
  });
});
