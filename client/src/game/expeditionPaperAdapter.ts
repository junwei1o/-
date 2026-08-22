import type { PaperQuestion, PaperSubject } from "@/lib/paperExam";
import { CURRICULUM_QUESTIONS, type CurriculumQuestion, type SubjectKey } from "@/game/expeditionContent";

const SUBJECT_LABELS: Record<SubjectKey, PaperSubject> = {
  chinese: "國語",
  math: "數學",
  english: "英語",
  science: "自然",
};

const DIFFICULTY_LABELS: Record<CurriculumQuestion["difficulty"], PaperQuestion["difficulty"]> = {
  1: "基礎",
  2: "標準",
  3: "挑戰",
};

export function curriculumToPaperQuestion(question: CurriculumQuestion): PaperQuestion {
  return {
    id: question.id,
    grade: 4,
    subject: SUBJECT_LABELS[question.subject],
    difficulty: DIFFICULTY_LABELS[question.difficulty],
    prompt: question.prompt,
    options: question.options,
    answer: question.answer,
    explanation: question.explanation,
    learningTopic: question.topic,
  };
}

export const LOCAL_CURRICULUM_PAPER_QUESTIONS: PaperQuestion[] = (Object.keys(CURRICULUM_QUESTIONS) as SubjectKey[])
  .flatMap((subject) => CURRICULUM_QUESTIONS[subject].map(curriculumToPaperQuestion));

export function paperSubjectToSubjectKey(subject: PaperSubject): SubjectKey | null {
  if (subject === "國語") return "chinese";
  if (subject === "數學") return "math";
  if (subject === "英語") return "english";
  if (subject === "自然") return "science";
  return null;
}
