import { and, count, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  assignmentSubmissions,
  assignments,
  classes,
  classMembers,
  cloudSaves,
  examRecords,
  InsertAssignment,
  InsertAssignmentSubmission,
  InsertClass,
  InsertClassMember,
  InsertCloudSave,
  InsertExamRecord,
  InsertQuestion,
  InsertUser,
  questionBank,
  users,
} from "../drizzle/schema";
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
  `CREATE TABLE IF NOT EXISTS \`cloud_saves\` (
    \`name\` varchar(24) NOT NULL,
    \`payload\` json NOT NULL,
    \`coins\` int NOT NULL DEFAULT 0,
    \`totalAnswers\` int NOT NULL DEFAULT 0,
    \`badges\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`name\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`exam_records\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(24) NOT NULL,
    \`subject\` varchar(32) NOT NULL,
    \`grade\` int,
    \`difficulty\` varchar(16),
    \`totalQuestions\` int NOT NULL,
    \`correctCount\` int NOT NULL,
    \`detail\` json,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`exam_records_name_idx\` (\`name\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`classes\` (
    \`code\` varchar(8) NOT NULL,
    \`name\` varchar(40) NOT NULL,
    \`teacherName\` varchar(24) NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`code\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`class_members\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`classCode\` varchar(8) NOT NULL,
    \`studentName\` varchar(24) NOT NULL,
    \`joinedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`class_members_class_idx\` (\`classCode\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`assignments\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`classCode\` varchar(8) NOT NULL,
    \`subject\` varchar(32) NOT NULL,
    \`grade\` int NOT NULL,
    \`questionCount\` int NOT NULL,
    \`learningTopic\` varchar(255),
    \`studentName\` varchar(24),
    \`dueDate\` varchar(10),
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`assignments_class_idx\` (\`classCode\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`assignment_submissions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`assignmentId\` int NOT NULL,
    \`studentName\` varchar(24) NOT NULL,
    \`correctCount\` int NOT NULL,
    \`totalQuestions\` int NOT NULL,
    \`submittedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`assignment_submissions_assignment_idx\` (\`assignmentId\`)
  )`,
];

const ENSURE_COLUMN_STATEMENTS = [
  // 對應遷移 0001：早期資料表的 area 為 NOT NULL，改為可空。
  "ALTER TABLE `question_bank` MODIFY COLUMN `area` varchar(64)",
  // 對應遷移 0002：新增 questionType 欄位。
  "ALTER TABLE `question_bank` ADD COLUMN `questionType` enum('選擇題','是非題') NOT NULL DEFAULT '選擇題'",
  // 對應遷移：作業可指定知識點與對象學生，讓老師能針對單一學生的薄弱處出題。
  "ALTER TABLE `assignments` ADD COLUMN `learningTopic` varchar(255)",
  "ALTER TABLE `assignments` ADD COLUMN `studentName` varchar(24)",
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
      (row.options.length === 2 || row.options.length === 4) &&
      Number.isInteger(row.answer),
  );
})();

export interface QuestionBankSyncReport {
  seedCount: number;
  before: number;
  missing: number;
  inserted: number;
  error?: string;
}

/**
 * 啟動時自動佈建題庫，並回報同步結果（供維運端點查詢，避免只能翻日誌）。
 * 冪等：只補進缺的題目 id，重複執行不會產生重複資料。
 */
export async function ensureQuestionBankReady(): Promise<QuestionBankSyncReport> {
  const seedCount = SEED_QUESTIONS.length;
  const db = await getDb();
  if (!db) {
    console.warn("[Database] DATABASE_URL 未設定，跳過題庫自動佈建（前端仍有內建題庫可離線作答）");
    return { seedCount, before: -1, missing: 0, inserted: 0, error: "DATABASE_URL 未設定" };
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

    if (total === 0) {
      for (let offset = 0; offset < SEED_QUESTIONS.length; offset += 50) {
        const chunk = SEED_QUESTIONS.slice(offset, offset + 50).map((row) => ({ ...row, area: row.area ?? null }));
        await db.insert(questionBank).values(chunk);
      }
      console.log(`[Database] 已自動匯入 ${SEED_QUESTIONS.length} 題至 question_bank`);
      return { seedCount, before: 0, missing: SEED_QUESTIONS.length, inserted: SEED_QUESTIONS.length };
    }

    // 題庫已存在時改為增量同步：只補進缺的題目 id，讓後續擴充題庫能自動上線，
    // 同時保留既有資料列（避免每次啟動都重建、也避免打斷線上作答）。
    const existing = await db.select({ id: questionBank.id }).from(questionBank);
    const have = new Set(existing.map((row) => row.id));
    const missing = SEED_QUESTIONS.filter((row) => !have.has(row.id));

    if (missing.length === 0) {
      console.log(`[Database] question_bank 已有 ${total} 題，與內建題庫一致，無需補題`);
      return { seedCount, before: total, missing: 0, inserted: 0 };
    }

    let inserted = 0;
    for (let offset = 0; offset < missing.length; offset += 50) {
      const chunk = missing.slice(offset, offset + 50).map((row) => ({ ...row, area: row.area ?? null }));
      await db.insert(questionBank).values(chunk);
      inserted += chunk.length;
    }
    console.log(`[Database] 題庫增量同步：補入 ${inserted} 題（原有 ${total} 題）`);
    return { seedCount, before: total, missing: missing.length, inserted };
  } catch (err) {
    const message = (err as Error)?.message ?? String(err);
    console.error("[Database] 題庫自動匯入失敗（前端仍可使用內建題庫）：", err);
    return { seedCount, before: -1, missing: 0, inserted: 0, error: message };
  }
}

/* ---------- 雲端船籍（以名字為鍵的免註冊雲端存檔） ---------- */

/** 建立新船籍；名字已被使用時回傳 null。 */
export async function createCloudSave(row: InsertCloudSave) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select({ name: cloudSaves.name }).from(cloudSaves).where(eq(cloudSaves.name, row.name)).limit(1);
  if (existing.length > 0) return null;
  await db.insert(cloudSaves).values(row);
  return { name: row.name };
}

/** 讀取船籍（認船／載入進度用）；不存在回傳 null。 */
export async function getCloudSave(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(cloudSaves).where(eq(cloudSaves.name, name)).limit(1);
  return rows[0] ?? null;
}

/** 覆寫船籍進度（僅在已存在時更新；不存在回傳 false 讓呼叫端走建立流程）。 */
export async function updateCloudSave(name: string, payload: unknown, metrics: { coins: number; totalAnswers: number; badges: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db
    .update(cloudSaves)
    .set({ payload, coins: metrics.coins, totalAnswers: metrics.totalAnswers, badges: metrics.badges })
    .where(eq(cloudSaves.name, name));
  const affected = (result as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0;
  return affected > 0;
}

export async function insertExamRecord(row: InsertExamRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(examRecords).values(row);
}

/** 依名字取最近 N 筆航行紀錄（新的在前）。 */
export async function listExamRecords(name: string, limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select()
    .from(examRecords)
    .where(eq(examRecords.name, name))
    .orderBy(desc(examRecords.id))
    .limit(Math.min(Math.max(limit, 1), 50));
}

/* ---------- 教師端：班級與作業 ---------- */

/** 產生 6 位班級碼（去掉容易看錯的 0/O/1/I）。 */
function generateClassCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/** 建立班級；班級碼重複時重試，回傳新班級或 null。 */
export async function createClass(name: string, teacherName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateClassCode();
    const existing = await db.select({ code: classes.code }).from(classes).where(eq(classes.code, code)).limit(1);
    if (existing.length > 0) continue;
    await db.insert(classes).values({ code, name, teacherName });
    return { code, name, teacherName };
  }
  return null;
}

/** 讀取班級資料。 */
export async function getClassRow(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(classes).where(eq(classes.code, code)).limit(1);
  return rows[0] ?? null;
}

/** 加入班級；已在同一班級時回傳 duplicated。 */
export async function joinClass(code: string, studentName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = await getClassRow(code);
  if (!target) return { ok: false as const, reason: "notFound" as const };
  const existing = await db
    .select({ id: classMembers.id })
    .from(classMembers)
    .where(and(eq(classMembers.classCode, code), eq(classMembers.studentName, studentName)))
    .limit(1);
  if (existing.length > 0) return { ok: false as const, reason: "duplicated" as const };
  await db.insert(classMembers).values({ classCode: code, studentName });
  return { ok: true as const, className: target.name };
}

/** 列出班級成員。 */
export async function listClassMembers(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(classMembers).where(eq(classMembers.classCode, code)).orderBy(classMembers.joinedAt);
}

/**
 * 移除班級成員，並一併清掉他的作業繳交紀錄與學習紀錄。
 * 小班場景裡孩子可能打錯名字加錯班，沒有移除機制就只能整班砍掉重練。
 */
export async function removeClassMember(code: string, studentName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const mine = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(eq(assignments.classCode, code));
  for (const row of mine) {
    await db
      .delete(assignmentSubmissions)
      .where(and(eq(assignmentSubmissions.assignmentId, row.id), eq(assignmentSubmissions.studentName, studentName)));
  }
  await db.delete(examRecords).where(eq(examRecords.name, studentName));
  await db.delete(classMembers).where(and(eq(classMembers.classCode, code), eq(classMembers.studentName, studentName)));
}

/**
 * 刪除整個班級：成員、作業、繳交紀錄全部清掉。
 * 供老師砍掉測試班或重新開始，不做軟刪除（資料量小、且無個資）。
 */
export async function deleteClass(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const mine = await db.select({ id: assignments.id }).from(assignments).where(eq(assignments.classCode, code));
  for (const row of mine) {
    await db.delete(assignmentSubmissions).where(eq(assignmentSubmissions.assignmentId, row.id));
  }
  await db.delete(assignments).where(eq(assignments.classCode, code));
  await db.delete(classMembers).where(eq(classMembers.classCode, code));
  await db.delete(classes).where(eq(classes.code, code));
}

/**
 * 清除某個船名在雲端的一切痕跡（船籍存檔＋學習紀錄）。
 * 用來清掉測試帳號，或孩子換船名後不想留下舊紀錄。
 */
export async function purgeStudentName(studentName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(examRecords).where(eq(examRecords.name, studentName));
  await db.delete(cloudSaves).where(eq(cloudSaves.name, studentName));
  await db.delete(classMembers).where(eq(classMembers.studentName, studentName));
}

/** 新增作業。 */
export async function createAssignment(row: InsertAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(assignments).values(row);
  const insertId = (result as unknown as [{ insertId?: number }])[0]?.insertId ?? 0;
  return { id: Number(insertId) };
}

/** 列出班級作業（新的在前）。 */
export async function listAssignments(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(assignments).where(eq(assignments.classCode, code)).orderBy(desc(assignments.id)).limit(50);
}

/** 繳交作業（同一份作業重複繳交時以最新成績覆寫）。 */
export async function submitAssignment(row: InsertAssignmentSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select({ id: assignmentSubmissions.id })
    .from(assignmentSubmissions)
    .where(
      and(
        eq(assignmentSubmissions.assignmentId, row.assignmentId),
        eq(assignmentSubmissions.studentName, row.studentName),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(assignmentSubmissions)
      .set({ correctCount: row.correctCount, totalQuestions: row.totalQuestions })
      .where(eq(assignmentSubmissions.id, existing[0].id));
    return { id: existing[0].id, updated: true as const };
  }
  const result = await db.insert(assignmentSubmissions).values(row);
  const insertId = (result as unknown as [{ insertId?: number }])[0]?.insertId ?? 0;
  return { id: Number(insertId), updated: false as const };
}

/** 列出某份作業的所有繳交紀錄。 */
export async function listSubmissions(assignmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(assignmentSubmissions).where(eq(assignmentSubmissions.assignmentId, assignmentId));
}

/** 學生已加入的班級（取最近一筆）。 */
export async function listClassesOfStudent(studentName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select({ classCode: classMembers.classCode })
    .from(classMembers)
    .where(eq(classMembers.studentName, studentName))
    .orderBy(desc(classMembers.id))
    .limit(10);
  const codes = Array.from(new Set(rows.map((row) => row.classCode)));
  if (codes.length === 0) return [];
  const found = [];
  for (const code of codes) {
    const row = await getClassRow(code);
    if (row) found.push({ code: row.code, name: row.name, teacherName: row.teacherName });
  }
  return found;
}
