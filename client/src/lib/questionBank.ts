import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
/**
 * 題庫已擴充到 5000 題（各科約 1000 題），精簡檔超過 2MB。
 * 若繼續用靜態 import，會整包塞進 index 主包（從 1.6MB 爆到近 4MB），
 * 首屏在手機上會明顯變慢。改成動態 import：主包只留英語 seed（很小），
 * 國小／國中題庫在掛載後背景載入，載入前照常使用後端題庫，不會卡住任何操作。
 *
 * 資料由 scripts/build-runtime-bank.mjs 從 data/taiwan_curriculum_500.json、
 * data/junior_high_bank.json 與 data/generated_bank.json 合併去重產生，勿手動編輯。
 */
// 英語文題目由前端本地題庫提供（後端 question_bank subject enum 尚未收錄英語，避免改動資料庫 schema）。
import englishSeed from "../../../data/taiwan_english_seed.json";
import { expandQuestionBankToSix, shuffleQuestionOptions } from "./optionRandomizer";

/** 與後端 question_bank 資料列一致的題目欄位（去掉僅後端使用的時間戳）。 */
export type CurriculumQuestionRow = {
  id: string;
  grade: number;
  subject: "數學" | "自然" | "社會" | "國語" | "英語";
  questionType: "選擇題" | "是非題";
  difficulty: "基礎" | "標準" | "挑戰";
  curriculumDomain: "語文領域" | "數學領域" | "自然科學領域" | "社會領域";
  learningTopic: string;
  /** 課綱欄位只存在於完整題庫（後端／工具使用），前端精簡檔沒有，故為可選。 */
  learningPerformance?: string;
  learningContent?: string;
  competency?: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  knowledge: string[];
  area?: string | null;
  /**
   * 跨學科結合題的科目組合（三科或五科）；一般單科題沒有這一欄。
   * 前端用它顯示「數學．自然．社會」的提示晶片，讓學生知道這題要跨科思考。
   */
  subjectCombination?: string[];
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

function rowsFrom(seed: unknown): CurriculumQuestionRow[] {
  const source = seed as { questions?: unknown };
  const questions = Array.isArray(source?.questions) ? source.questions.filter(isValidQuestion) : [];
  return questions.map((q) => ({ ...q, questionType: q.questionType ?? "選擇題" as const }));
}

/** 動態載入國小＋國中精簡題庫；同一份結果全程共用，只載一次。 */
let localCache: CurriculumQuestionRow[] | null = null;
let localPending: Promise<CurriculumQuestionRow[]> | null = null;

/**
 * 內建題庫的「活陣列」。
 * 5000 題的精簡檔超過 2.7MB，靜態 import 會整包塞進主 bundle，首屏在手機上會卡。
 * 改成動態 import 之後，這裡先用空陣列占位，載入完成後「就地填入同一個陣列」：
 * 所有拿到這個參考的人都看得到題目（classroomBank 等同步消費端才不會開天窗）。
 */
export const LOCAL_QUESTION_BANK: CurriculumQuestionRow[] = [];

export function loadLocalBank(): Promise<CurriculumQuestionRow[]> {
  if (localCache) return Promise.resolve(localCache);
  if (!localPending) {
    localPending = (async () => {
      const [elementary, junior] = await Promise.all([
        import("../../../data/runtime_bank_elementary.json"),
        import("../../../data/runtime_bank_junior.json"),
      ]);
      const rows = [
        ...rowsFrom((elementary as { default?: unknown }).default ?? elementary),
        ...rowsFrom((junior as { default?: unknown }).default ?? junior),
      ];
      localCache = rows;
      LOCAL_QUESTION_BANK.length = 0;
      LOCAL_QUESTION_BANK.push(...rows);
      return rows;
    })();
  }
  return localPending;
}

/** 英語文題庫（本地 seed，與 data/taiwan_english_seed.json 同步）。 */
export const LOCAL_ENGLISH_BANK: CurriculumQuestionRow[] = (() => {
  const seed = englishSeed as { questions?: unknown };
  const questions = Array.isArray(seed.questions) ? seed.questions.filter(isValidQuestion) : [];
  return questions.map((q) => ({ ...q, questionType: q.questionType ?? "選擇題" as const }));
})();

/**
 * 離線後備庫的「擴充成 6 選項」結果。擴充是純確定性運算（只依題目內容產生干擾項），
 * 因此模組載入時算一次即可，不必在每次 query.data 變動時對近千題重跑。
 * 打亂選項順序仍保留在 useQuestionBank 中每次執行（那是刻意要讓正解位置每次都不同）。
 */
/** 擴充結果依來源陣列快取：5000 題重算一次不便宜，不該每次 render 都重跑。 */
const expandedCache = new WeakMap<readonly CurriculumQuestionRow[], CurriculumQuestionRow[]>();

function expanded(questions: readonly CurriculumQuestionRow[]): CurriculumQuestionRow[] {
  const hit = expandedCache.get(questions);
  if (hit) return hit;
  const result = expandQuestionBankToSix(questions as CurriculumQuestionRow[]);
  expandedCache.set(questions, result);
  return result;
}

/**
 * 合併結果也要共用：useQuestionBank 每個元件各叫一次，若各自合併就會各自拿到
 * 不同的陣列，進而各自重跑一次 5000 題的展開（一次 1.4 秒，幾個畫面就卡好幾秒）。
 * 這裡用「後端陣列 → 本地陣列 → 合併結果」兩層快取，全站只展開一次。
 */
const mergedCache = new WeakMap<
  readonly CurriculumQuestionRow[],
  WeakMap<readonly CurriculumQuestionRow[], CurriculumQuestionRow[]>
>();

/**
 * 題幹正規化：用來把後端題庫與本地題庫重疊的題目去掉。
 * 沒有題幹的資料列（例如只帶 id 的測試假資料）改用 id 判斷，
 * 否則會被當成同一題刪到只剩一題。
 */
function dedupeKey(question: CurriculumQuestionRow): string {
  const prompt = String(question.prompt ?? "").replace(/\s+/g, "");
  return prompt ? `${question.subject}|${prompt}` : `id:${question.id}`;
}

function mergedBank(
  serverQuestions: readonly CurriculumQuestionRow[],
  localRows: readonly CurriculumQuestionRow[],
): CurriculumQuestionRow[] {
  let inner = mergedCache.get(serverQuestions);
  if (!inner) {
    inner = new WeakMap();
    mergedCache.set(serverQuestions, inner);
  }
  const hit = inner.get(localRows);
  if (hit) return hit;
  const seen = new Set<string>();
  const merged: CurriculumQuestionRow[] = [];
  for (const question of [...serverQuestions, ...localRows, ...LOCAL_ENGLISH_BANK]) {
    const key = dedupeKey(question);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(question);
  }
  inner.set(localRows, merged);
  return merged;
}

export type QuestionBankSource = "server" | "local";

/**
 * 取得正式題庫。後端有資料時使用後端資料；後端無法連線、查詢失敗或回傳空資料時，
 * 自動改用內建的 500 題題庫，因此回傳的 isLoading 永遠不會卡住操作、error 永遠為 null。
 *
 * 回傳前會把每題擴充成 6 個選項並隨機打亂順序（answer 索引同步修正），
 * 讓正確答案每次載入都出現在不同位置。
 */
export function useQuestionBank() {
  const query = trpc.questionBank.list.useQuery({ limit: 1200 });
  const [localRows, setLocalRows] = useState<CurriculumQuestionRow[]>([]);

  useEffect(() => {
    let alive = true;
    loadLocalBank().then((rows) => {
      if (alive) setLocalRows(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  const questions = useMemo(() => {
    const serverQuestions = (query.data?.questions ?? []) as CurriculumQuestionRow[];
    // 後端題庫與本地題庫聯集合併（後端只收錄部分題目，本地才是完整的 5000 題），
    // 以題幹去重避免同一題出現兩次；英語 seed 固定附加（後端 schema 未收錄英語）。
    const merged = mergedBank(serverQuestions, localRows);
    return expanded(merged).map((question) => shuffleQuestionOptions(question));
  }, [query.data, localRows]);
  const usingLocal = (query.data?.questions ?? []).length === 0 && localRows.length === 0;
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
