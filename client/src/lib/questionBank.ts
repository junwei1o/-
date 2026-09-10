import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
// 正式題庫 500 題隨安裝包一起發布；後端題庫無法使用時，用它作為離線後備，讓作答功能永遠可用。
import curriculumSeed from "../../../data/taiwan_curriculum_500.json";
import { expandQuestionBankToSix, shuffleQuestionOptions } from "./optionRandomizer";

/** 與後端 question_bank 資料列一致的題目欄位（去掉僅後端使用的時間戳）。 */
export type CurriculumQuestionRow = {
  id: string;
  grade: number;
  subject: "數學" | "自然" | "社會" | "國語";
  questionType: "選擇題" | "是非題";
  difficulty: "基礎" | "標準" | "挑戰";
  curriculumDomain: "語文領域" | "數學領域" | "自然科學領域" | "社會領域";
  learningTopic: string;
  learningPerformance: string;
  learningContent: string;
  competency: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  knowledge: string[];
  area?: string | null;
};

function isValidQuestion(value: unknown): value is CurriculumQuestionRow {
  if (!value || typeof value !== "object") return false;
  const question = value as Record<string, unknown>;
  const questionType = question.questionType;
  const isTrueFalse = questionType === "是非題";
  const expectedOptionCount = isTrueFalse ? 2 : 4;
  return (
    typeof question.id === "string" &&
    Number.isInteger(question.grade) &&
    typeof question.subject === "string" &&
    (questionType === undefined || typeof questionType === "string") &&
    typeof question.difficulty === "string" &&
    typeof question.curriculumDomain === "string" &&
    typeof question.learningTopic === "string" &&
    typeof question.prompt === "string" &&
    typeof question.explanation === "string" &&
    Number.isInteger(question.answer) &&
    Array.isArray(question.options) &&
    question.options.length === expectedOptionCount &&
    question.options.every((option) => typeof option === "string") &&
    Array.isArray(question.knowledge) &&
    question.knowledge.length > 0
  );
}

/** 內建題庫（與 data/taiwan_curriculum_500.json 同步）。 */
export const LOCAL_QUESTION_BANK: CurriculumQuestionRow[] = (() => {
  const seed = curriculumSeed as { questions?: unknown };
  const questions = Array.isArray(seed.questions) ? seed.questions.filter(isValidQuestion) : [];
  return questions.map((q) => ({ ...q, questionType: q.questionType ?? "選擇題" as const }));
})();

export type QuestionBankSource = "server" | "local";

/**
 * 取得正式題庫。後端有資料時使用後端資料；後端無法連線、查詢失敗或回傳空資料時，
 * 自動改用內建的 500 題題庫，因此回傳的 isLoading 永遠不會卡住操作、error 永遠為 null。
 *
 * 回傳前會把每題擴充成 6 個選項並隨機打乱順序（answer 索引同步修正），
 * 讓正確答案每次載入都出現在不同位置。
 */
export function useQuestionBank() {
  const query = trpc.questionBank.list.useQuery({ limit: 500 });
  const questions = useMemo(() => {
    const serverQuestions = (query.data?.questions ?? []) as CurriculumQuestionRow[];
    const base = serverQuestions.length > 0 ? serverQuestions : LOCAL_QUESTION_BANK;
    return expandQuestionBankToSix(base).map((question) => shuffleQuestionOptions(question));
  }, [query.data]);
  const usingLocal = (query.data?.questions ?? []).length === 0;
  const source = (usingLocal ? "local" : "server") as QuestionBankSource;
  return {
    questions,
    total: questions.length,
    /** 內建題庫永遠可用，載入中不會封鎖任何操作。 */
    isLoading: false as const,
    error: null as null,
    refetch: query.refetch,
    source,
    /** 後端查詢失敗而改用內建題庫時為 true（可用於顯示離線提示）。 */
    isFallback: usingLocal && query.isError,
  };
}
