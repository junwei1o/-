import { readFile } from "node:fs/promises";
import { drizzle } from "drizzle-orm/mysql2";
import { questionBank, type InsertQuestion } from "../drizzle/schema";

type SourceQuestion = Omit<InsertQuestion, "createdAt" | "updatedAt" | "area"> & {
  area?: string;
};
type SourceFile = { questionCount: number; questions: SourceQuestion[] };

const REQUIRED_SUBJECTS = new Set(["數學", "自然", "社會", "國語"]);
const REQUIRED_DIFFICULTIES = new Set(["基礎", "標準", "挑戰"]);
const REQUIRED_DOMAINS = new Set(["語文領域", "數學領域", "自然科學領域", "社會領域"]);

function assertQuestion(value: SourceQuestion, index: number): InsertQuestion {
  if (!value || typeof value !== "object") throw new Error(`第 ${index + 1} 題不是物件`);
  if (!value.id || typeof value.id !== "string") throw new Error(`第 ${index + 1} 題缺少 id`);
  if (!Number.isInteger(value.grade) || value.grade < 3 || value.grade > 6) throw new Error(`${value.id} 年級無效`);
  if (typeof value.subject !== "string" || !REQUIRED_SUBJECTS.has(value.subject)) throw new Error(`${value.id} 科目無效`);
  if (typeof value.difficulty !== "string" || !REQUIRED_DIFFICULTIES.has(value.difficulty)) throw new Error(`${value.id} 難度無效`);
  if (typeof value.curriculumDomain !== "string" || !REQUIRED_DOMAINS.has(value.curriculumDomain)) throw new Error(`${value.id} 課綱領域無效`);
  if (!Array.isArray(value.options) || value.options.length !== 4 || value.options.some((item) => typeof item !== "string")) throw new Error(`${value.id} 必須有四個文字選項`);
  if (!Number.isInteger(value.answer) || value.answer < 0 || value.answer > 3) throw new Error(`${value.id} 答案索引無效`);
  for (const field of ["learningTopic", "learningPerformance", "learningContent", "competency", "prompt", "explanation"] as const) {
    if (typeof value[field] !== "string" || value[field].trim().length === 0) throw new Error(`${value.id} 缺少 ${field}`);
  }
  if (!Array.isArray(value.knowledge) || value.knowledge.length === 0 || value.knowledge.some((item) => typeof item !== "string")) throw new Error(`${value.id} knowledge 無效`);
  return {
    id: value.id,
    area: value.area ?? null,
    grade: value.grade,
    subject: value.subject as InsertQuestion["subject"],
    difficulty: value.difficulty as InsertQuestion["difficulty"],
    curriculumDomain: value.curriculumDomain as InsertQuestion["curriculumDomain"],
    learningTopic: value.learningTopic,
    learningPerformance: value.learningPerformance,
    learningContent: value.learningContent,
    competency: value.competency,
    prompt: value.prompt,
    options: value.options,
    answer: value.answer,
    explanation: value.explanation,
    knowledge: value.knowledge,
  };
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL 未設定，停止匯入以避免寫入錯誤環境");

const sourcePath = new URL("../data/taiwan_curriculum_500.json", import.meta.url);
const source = JSON.parse(await readFile(sourcePath, "utf8")) as SourceFile;
if (!Array.isArray(source.questions) || source.questions.length !== 500 || source.questionCount !== 500) {
  throw new Error(`題庫數量驗證失敗：宣告 ${source.questionCount}，實際 ${source.questions?.length ?? 0}`);
}

const rows = source.questions.map(assertQuestion);
const ids = new Set(rows.map((row) => row.id));
if (ids.size !== rows.length) throw new Error("題目 ID 重複，停止匯入");

const db = drizzle(databaseUrl);
await db.transaction(async (tx) => {
  for (let offset = 0; offset < rows.length; offset += 1) {
    const row = rows[offset];
    await tx.insert(questionBank).values(row).onDuplicateKeyUpdate({
      set: {
        area: row.area,
        grade: row.grade,
        subject: row.subject,
        difficulty: row.difficulty,
        curriculumDomain: row.curriculumDomain,
        learningTopic: row.learningTopic,
        learningPerformance: row.learningPerformance,
        learningContent: row.learningContent,
        competency: row.competency,
        prompt: row.prompt,
        options: row.options,
        answer: row.answer,
        explanation: row.explanation,
        knowledge: row.knowledge,
      },
    });
    if ((offset + 1) % 100 === 0 || offset === rows.length - 1) console.log(`已匯入 ${offset + 1}/${rows.length}`);
  }
});
console.log(`完成：${rows.length} 題已寫入 question_bank`);
