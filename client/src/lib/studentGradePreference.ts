export const STUDENT_GRADE_PREFERENCE_STORAGE_KEY = "xue-adventure-filters-v1";

export type StudentGradePreference = 3 | 4 | 5 | 6 | 7 | 8 | 9 | null;

import { USER_PREFERENCES_STORAGE_KEY, loadUserPreferences } from "@/game/adaptiveLearning";
import { readStoredJson } from "@/utils/storage";

const VALID_STUDENT_GRADES = new Set([3, 4, 5, 6, 7, 8, 9]);

/**
 * 學生的年級。
 *
 * 注意：站內本來有兩份年級偏好，而且**沒有同步**——
 * 設定頁（Settings）寫的是 `UserPreferences.gradeLevel`（xue-adventure-user-prefs-v1），
 * 但這裡讀的是另一份 filters key（xue-adventure-filters-v1），而該 key 全站沒有任何寫入點，
 * 結果是永遠 null：老師在設定頁選七年級後，洋蔥選課頁的預設學段、原則測驗、教室取題
 * 全部都拿不到年級，國中生仍被當成國小生。
 *
 * 修法：以「設定頁那份」為單一真相——先讀 filters key（保留舊資料相容），
 * 沒有就 fallback 到 UserPreferences.gradeLevel。
 */
export function loadStudentGradePreference(): StudentGradePreference {
  if (typeof window === "undefined") return null;

  const parsed = readStoredJson<unknown>(STUDENT_GRADE_PREFERENCE_STORAGE_KEY, null);
  if (parsed && typeof parsed === "object" && "grade" in parsed) {
    const grade = (parsed as { grade?: unknown }).grade;
    if (typeof grade === "number" && VALID_STUDENT_GRADES.has(grade)) {
      return grade as Exclude<StudentGradePreference, null>;
    }
  }

  // fallback：設定頁實際寫入的那份。
  // 注意必須先確認該 key 真的存在——loadUserPreferences() 的預設值是四年級，
  // 直接呼叫會讓「從沒設定過的學生」一律被當成四年級，反而限縮了題目範圍。
  try {
    if (!window.localStorage.getItem(USER_PREFERENCES_STORAGE_KEY)) return null;
    const prefs = loadUserPreferences();
    const grade = prefs.gradeLevel;
    if (typeof grade === "number" && VALID_STUDENT_GRADES.has(grade)) {
      return grade as Exclude<StudentGradePreference, null>;
    }
  } catch {
    /* 讀不到就當沒設定 */
  }
  return null;
}
