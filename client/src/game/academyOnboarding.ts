import type { AcademyOnboarding, AcademySubject } from "./rpgTypes";

export const ACADEMY_SUBJECTS: AcademySubject[] = ["數學", "自然", "社會", "國語"];

export function createAcademyOnboarding(): AcademyOnboarding {
  return { subjectChecks: {}, completed: false };
}

export function normalizeAcademyOnboarding(value: AcademyOnboarding | undefined): AcademyOnboarding {
  const subjectChecks = Object.fromEntries(
    ACADEMY_SUBJECTS.map((subject) => [subject, value?.subjectChecks?.[subject] === true]),
  ) as Partial<Record<AcademySubject, boolean>>;
  return { subjectChecks, completed: ACADEMY_SUBJECTS.every((subject) => subjectChecks[subject]) };
}

export function isAcademySubject(subject: string | undefined): subject is AcademySubject {
  return Boolean(subject && ACADEMY_SUBJECTS.includes(subject as AcademySubject));
}

export function recordAcademyOnboardingAnswer(
  current: AcademyOnboarding | undefined,
  input: { subject?: string; correct: boolean },
) {
  const normalized = normalizeAcademyOnboarding(current);
  if (!input.correct || !isAcademySubject(input.subject) || normalized.subjectChecks[input.subject]) {
    return { onboarding: normalized, justCompleted: false };
  }

  const subjectChecks = { ...normalized.subjectChecks, [input.subject]: true };
  const completed = ACADEMY_SUBJECTS.every((subject) => subjectChecks[subject]);
  return {
    onboarding: { subjectChecks, completed },
    justCompleted: completed && !normalized.completed,
  };
}

export function academyOnboardingStatus(current: AcademyOnboarding | undefined) {
  const onboarding = normalizeAcademyOnboarding(current);
  const subjects = ACADEMY_SUBJECTS.map((subject) => ({ subject, complete: onboarding.subjectChecks[subject] === true }));
  const next = subjects.find((item) => !item.complete)?.subject ?? null;
  return { ...onboarding, subjects, completedCount: subjects.filter((item) => item.complete).length, next };
}
