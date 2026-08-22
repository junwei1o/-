import { describe, expect, it } from "vitest";
import { academyOnboardingStatus, createAcademyOnboarding, recordAcademyOnboardingAnswer } from "./academyOnboarding";

describe("academy onboarding", () => {
  it("only records a first correct answer for each curriculum subject", () => {
    const first = recordAcademyOnboardingAnswer(createAcademyOnboarding(), { subject: "數學", correct: true });
    const duplicate = recordAcademyOnboardingAnswer(first.onboarding, { subject: "數學", correct: true });
    const incorrect = recordAcademyOnboardingAnswer(duplicate.onboarding, { subject: "自然", correct: false });
    expect(incorrect.onboarding.subjectChecks).toEqual({ 數學: true, 自然: false, 社會: false, 國語: false });
    expect(academyOnboardingStatus(incorrect.onboarding).completedCount).toBe(1);
  });

  it("completes once all four subjects have a real correct answer", () => {
    let onboarding = createAcademyOnboarding();
    for (const subject of ["數學", "自然", "社會"] as const) onboarding = recordAcademyOnboardingAnswer(onboarding, { subject, correct: true }).onboarding;
    const completion = recordAcademyOnboardingAnswer(onboarding, { subject: "國語", correct: true });
    expect(completion.justCompleted).toBe(true);
    expect(completion.onboarding.completed).toBe(true);
    expect(academyOnboardingStatus(completion.onboarding).next).toBeNull();
  });
});

