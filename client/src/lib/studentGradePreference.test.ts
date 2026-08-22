// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
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
});
