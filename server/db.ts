import { and, count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertQuestion, InsertUser, questionBank, users } from "../drizzle/schema";
import questionSeed from "../data/taiwan_curriculum_500.json";
import { ENV } from './_core/env';

function createDb(pool: mysql.Pool) {
  return drizzle(pool);
}

type Db = ReturnType<typeof createDb>;

let _db: Db | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      _db = createDb(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export type QuestionBankFilters = {
  grade?: number;
  subject?: "數學" | "自然" | "社會" | "國語";
  difficulty?: "基礎" | "標準" | "挑戰";
  curriculumDomain?: "語文領域" | "數學領域" | "自然科學領域" | "社會領域";
  limit?: number;
};

export async function getQuestionBank(filters: QuestionBankFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const conditions = [
    filters.grade === undefined ? undefined : eq(questionBank.grade, filters.grade),
    filters.subject === undefined ? undefined : eq(questionBank.subject, filters.subject),
    filters.difficulty === undefined ? undefined : eq(questionBank.difficulty, filters.difficulty),
    filters.curriculumDomain === undefined ? undefined : eq(questionBank.curriculumDomain, filters.curriculumDomain),
  ].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));
  try {
    return db
      .select()
      .from(questionBank)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(Math.min(Math.max(filters.limit ?? 500, 1), 500));
  } catch (err) {
    console.error("[DB] getQuestionBank failed:", err);
    throw err;
  }
}

/**
 * 啟動時自動佈建題庫：資料表不存在就建立（含 users 表，避免登入流程也壞掉），
 * question_bank 為空就把內建 500 題寫入。所有敘述各自容錯，
 * 即使資料庫無法連線也不影響伺服器開機（前端仍有內建題庫可離線作答）。
 */
const ENSURE_TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS \`question_bank\` (
    \`id\` varchar(32) NOT NULL,
    \`area\` varchar(64),
    \`grade\` int NOT NULL,
    \`subject\` enum('數學','自然','社會','國語') NOT NULL,
    \`difficulty\` enum('基礎','標準','挑戰') NOT NULL,
    \`curriculumDomain\` enum('語文領域','數學領域','自然科學領域','社會領域') NOT NULL,
    \`learningTopic\` varchar(255) NOT NULL,
    \`learningPerformance\` text NOT NULL,
    \`learningContent\` text NOT NULL,
    \`competency\` text NOT NULL,
    \`prompt\` text NOT NULL,
    \`options\` json NOT NULL,
    \`answer\` int NOT NULL,
    \`explanation\` text NOT NULL,
    \`knowledge\` json NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`question_bank_grade_idx\` (\`grade\`),
    KEY \`question_bank_subject_idx\` (\`subject\`),
    KEY \`question_bank_difficulty_idx\` (\`difficulty\`),
    KEY \`question_bank_curriculum_domain_idx\` (\`curriculumDomain\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`openId\` varchar(64) NOT NULL,
    \`name\` text,
    \`email\` varchar(320),
    \`loginMethod\` varchar(64),
    \`role\` enum('user','admin') NOT NULL DEFAULT 'user',
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`lastSignedIn\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`users_openId_unique\` (\`openId\`)
  )`,
];

const ENSURE_COLUMN_STATEMENTS = [
  // 對應遷移 0001：早期資料表的 area 為 NOT NULL，改為可空。
  "ALTER TABLE `question_bank` MODIFY COLUMN `area` varchar(64)",
];

const ENSURE_INDEX_STATEMENTS = [
  "CREATE INDEX `question_bank_grade_idx` ON `question_bank` (`grade`)",
  "CREATE INDEX `question_bank_subject_idx` ON `question_bank` (`subject`)",
  "CREATE INDEX `question_bank_difficulty_idx` ON `question_bank` (`difficulty`)",
  "CREATE INDEX `question_bank_curriculum_domain_idx` ON `question_bank` (`curriculumDomain`)",
];

const SEED_QUESTIONS: InsertQuestion[] = (() => {
  const seed = questionSeed as { questions?: unknown };
  const rows = Array.isArray(seed.questions) ? (seed.questions as unknown as InsertQuestion[]) : [];
  return rows.filter(
    (row) =>
      row &&
      typeof row.id === "string" &&
      Number.isInteger(row.grade) &&
      typeof row.prompt === "string" &&
      Array.isArray(row.options) &&
      row.options.length === 4 &&
      Number.isInteger(row.answer),
  );
})();

export async function ensureQuestionBankReady(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] DATABASE_URL 未設定，跳過題庫自動佈建（前端仍有內建題庫可離線作答）");
    return;
  }

  for (const statement of ENSURE_TABLE_STATEMENTS) {
    try {
      await db.execute(statement);
    } catch (err) {
      console.warn("[Database] 建立資料表敘述未成功：", (err as Error)?.message ?? err);
    }
  }
  for (const statement of ENSURE_COLUMN_STATEMENTS) {
    try {
      await db.execute(statement);
    } catch {
      // 資料表不存在或欄位已符合時都可能報錯，略過即可。
    }
  }
  for (const statement of ENSURE_INDEX_STATEMENTS) {
    try {
      await db.execute(statement);
    } catch {
      // 索引已存在（MySQL 不支援 CREATE INDEX IF NOT EXISTS）時略過。
    }
  }

  try {
    const result = await db.select({ value: count() }).from(questionBank);
    const total = result[0]?.value ?? 0;
    if (total > 0) {
      console.log(`[Database] question_bank 已有 ${total} 題，無需匯入`);
      return;
    }
    for (let offset = 0; offset < SEED_QUESTIONS.length; offset += 50) {
      const chunk = SEED_QUESTIONS.slice(offset, offset + 50).map((row) => ({ ...row, area: row.area ?? null }));
      await db.insert(questionBank).values(chunk);
    }
    console.log(`[Database] 已自動匯入 ${SEED_QUESTIONS.length} 題至 question_bank`);
  } catch (err) {
    console.error("[Database] 題庫自動匯入失敗（前端仍可使用內建題庫）：", err);
  }
}
