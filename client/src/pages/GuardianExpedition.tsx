import { ArrowLeft, Crown } from "lucide-react";
import { useLocation } from "wouter";
import RpgAdventure from "@/components/RpgAdventure";
import { ALL_CURRICULUM_QUESTIONS, type SubjectKey } from "@/game/expeditionContent";

const SUBJECT_LABELS: Record<SubjectKey, string> = {
  chinese: "國文島",
  math: "數學城",
  english: "英文港",
  science: "自然山",
};

const DIFFICULTY_LABELS = { 1: "基礎", 2: "標準", 3: "挑戰" } as const;

const GUARDIAN_QUESTION_POOL = ALL_CURRICULUM_QUESTIONS.map((question) => ({
  id: question.id,
  area: SUBJECT_LABELS[question.subject],
  subject: SUBJECT_LABELS[question.subject],
  grade: 5,
  difficulty: DIFFICULTY_LABELS[question.difficulty],
  prompt: question.prompt,
  options: [...question.options],
  answer: question.answer,
  explanation: question.explanation,
  learningTopic: question.topic,
  curriculumDomain: SUBJECT_LABELS[question.subject],
}));

export default function GuardianExpedition() {
  const [, setLocation] = useLocation();

  return (
    <main className="min-h-screen bg-[#f9f3e8] pb-10">
      <div className="mx-auto flex w-[min(100%-2rem,1240px)] items-center justify-between gap-4 pt-5">
        <button
          type="button"
          className="settings-back-button"
          onClick={() => setLocation("/map")}
        >
          <ArrowLeft size={16} aria-hidden="true" /> 返回學習地圖
        </button>
        <p className="m-0 inline-flex items-center gap-2 text-xs font-extrabold text-[#805e1d]">
          <Crown size={17} aria-hidden="true" /> 守護者主線遠征
        </p>
      </div>
      <RpgAdventure questionPool={GUARDIAN_QUESTION_POOL} onOpenChallenge={() => setLocation("/battle")} />
    </main>
  );
}
