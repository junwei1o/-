export const STUDENT_GRADE_PREFERENCE_STORAGE_KEY = "xue-adventure-filters-v1";

export type StudentGradePreference = 3 | 4 | 5 | 6 | null;

import { readStoredJson } from "@/utils/storage";

const VALID_STUDENT_GRADES = new Set([3, 4, 5, 6]);

export function loadStudentGradePreference(): StudentGradePreference {
  if (typeof window === "undefined") return null;

  const parsed = readStoredJson<unknown>(STUDENT_GRADE_PREFERENCE_STORAGE_KEY, null);
  if (!parsed || typeof parsed !== "object" || !("grade" in parsed)) return null;
  const grade = (parsed as { grade?: unknown }).grade;
  return typeof grade === "number" && VALID_STUDENT_GRADES.has(grade) ? grade as Exclude<StudentGradePreference, null> : null;
}
