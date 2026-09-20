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

  it("設定頁存國中年級後讀得到（兩份偏好已打通，否則國中生會被當國小生）", () => {
    // 設定頁（Settings）寫的是 UserPreferences.gradeLevel，與 filters key 是不同一份
    for (const grade of [7, 8, 9] as const) {
      localStorage.clear();
      saveUserPreferences({
        version: 1,
        gradeLevel: grade,
        difficultyPreference: "均衡混合",
        updatedAt: Date.now(),
      });
      expect(loadStudentGradePreference()).toBe(grade);
    }
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
