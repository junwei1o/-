import { and, asc, count, desc, eq, gt, gte, inArray, lt, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  aiUsage,
  assignmentSubmissions,
  assignments,
  classes,
  classAnnouncements,
  classMembers,
  cloudSaves,
  examRecords,
  InsertAssignment,
  InsertAssignmentSubmission,
  InsertClass,
  InsertClassAnnouncement,
  InsertClassMember,
  InsertCloudSave,
  InsertExamRecord,
  InsertLeagueGroup,
  InsertLeagueReward,
  InsertLeagueSeason,
  InsertQuestion,
  InsertUser,
  InsertWeeklyQuiz,
  leagueGroups,
  leagueRewards,
  leagueSeasons,
  LeagueGroupType,
  LeagueSeason,
  pkChallenges,
  questionBank,
  users,
  weeklyQuizzes,
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
    \`sessionKey\` varchar(160),
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
  `CREATE TABLE IF NOT EXISTS \`class_announcements\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`classCode\` varchar(8) NOT NULL,
    \`teacherName\` varchar(24) NOT NULL,
    \`content\` varchar(500) NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`class_announcements_class_idx\` (\`classCode\`),
    KEY \`class_announcements_created_idx\` (\`createdAt\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`weekly_quizzes\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`studentName\` varchar(24) NOT NULL,
    \`weekKey\` varchar(16) NOT NULL,
    \`grade\` int,
    \`questions\` json NOT NULL,
    \`status\` enum('pending','done') NOT NULL DEFAULT 'pending',
    \`correctCount\` int NOT NULL DEFAULT 0,
    \`totalQuestions\` int NOT NULL DEFAULT 0,
    \`submittedAt\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`weekly_quizzes_student_week_idx\` (\`studentName\`, \`weekKey\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`ai_usage\` (
    \`name\` varchar(24) NOT NULL,
    \`usageDate\` date NOT NULL,
    \`count\` int NOT NULL DEFAULT 0,
    \`promptTokens\` int NOT NULL DEFAULT 0,
    \`completionTokens\` int NOT NULL DEFAULT 0,
    \`totalTokens\` int NOT NULL DEFAULT 0,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`name\`, \`usageDate\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`pk_challenges\` (
    \`code\` varchar(8) NOT NULL,
    \`initiatorName\` varchar(24) NOT NULL,
    \`initiatorScore\` int,
    \`challengerName\` varchar(24),
    \`challengerScore\` int,
    \`questionIds\` json NOT NULL,
    \`status\` enum('waiting','completed') NOT NULL DEFAULT 'waiting',
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`code\`),
    KEY \`pk_challenges_status_idx\` (\`status\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`league_seasons\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`seasonNumber\` int NOT NULL,
    \`startAt\` timestamp NOT NULL,
    \`endAt\` timestamp NOT NULL,
    \`isSettled\` enum('0','1') NOT NULL DEFAULT '0',
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`league_seasons_number_idx\` (\`seasonNumber\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`league_groups\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`seasonId\` int NOT NULL,
    \`name\` varchar(24) NOT NULL,
    \`groupType\` enum('bronze','silver','gold','diamond') NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`league_groups_season_name_idx\` (\`seasonId\`, \`name\`),
    KEY \`league_groups_season_group_idx\` (\`seasonId\`, \`groupType\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`league_rewards\` (
    \`id\` int NOT NULL AUTO_INCREMENT,
    \`seasonId\` int NOT NULL,
    \`name\` varchar(24) NOT NULL,
    \`rewardType\` enum('participate','rank') NOT NULL,
    \`rank\` int,
    \`claimedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`league_rewards_season_name_type_idx\` (\`seasonId\`, \`name\`, \`rewardType\`)
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
  // 對應遷移：試卷補報用。同一份卷子重複上報時覆蓋，不新增重複紀錄。
  "ALTER TABLE `exam_records` ADD COLUMN `sessionKey` varchar(160)",
  // 對應遷移：AI 深度反思 token 用量統計三欄（老庫冪等補欄）。
  "ALTER TABLE `ai_usage` ADD COLUMN `promptTokens` int NOT NULL DEFAULT 0",
  "ALTER TABLE `ai_usage` ADD COLUMN `completionTokens` int NOT NULL DEFAULT 0",
  "ALTER TABLE `ai_usage` ADD COLUMN `totalTokens` int NOT NULL DEFAULT 0",
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

/**
 * 寫入航行紀錄。
 *
 * 帶 sessionKey 時採「同一份試卷覆蓋更新」：學生答完最後一題往往才回頭標
 * 錯誤原因，那時會再上報一次；沒有覆蓋機制的話，同一份卷子會變成兩筆紀錄，
 * 家長看到的航行紀錄會出現重複。
 */
export async function insertExamRecord(row: InsertExamRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const sessionKey = row.sessionKey?.trim();
  if (sessionKey) {
    const existing = await db
      .select({ id: examRecords.id })
      .from(examRecords)
      .where(and(eq(examRecords.name, row.name), eq(examRecords.sessionKey, sessionKey)))
      .orderBy(desc(examRecords.id))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(examRecords)
        .set({
          subject: row.subject,
          grade: row.grade ?? null,
          difficulty: row.difficulty ?? null,
          totalQuestions: row.totalQuestions,
          correctCount: row.correctCount,
          detail: row.detail ?? null,
        })
        .where(eq(examRecords.id, existing[0].id));
      return existing[0].id;
    }
  }
  const result = await db.insert(examRecords).values(row);
  const insertId = (result as unknown as [{ insertId?: number }])[0]?.insertId ?? 0;
  return Number(insertId);
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

/**
 * 列出所有已建立雲端船籍的船名（不含存檔內容）。
 * 用途：讓老師在督學台看到「哪些孩子已經有船籍但還沒加入班級」，
 * 直接點一下就能加入，不必叫孩子手輸 6 位班級碼。
 */
export async function listCloudSaveNames() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select({ name: cloudSaves.name, totalAnswers: cloudSaves.totalAnswers, updatedAt: cloudSaves.updatedAt })
    .from(cloudSaves)
    .orderBy(desc(cloudSaves.updatedAt))
    .limit(50);
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

/** 班級公告相關（老師發、學生按 classCode 拉取）。 */

/** 老師發一則公告到班級。 */
export async function createAnnouncement(row: InsertClassAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(classAnnouncements).values(row);
  const insertId = (result as unknown as [{ insertId?: number }])[0]?.insertId ?? 0;
  return { id: Number(insertId) };
}

/** 列出某班級最新 N 則公告（最新在前）。 */
export async function listAnnouncements(code: string, limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select()
    .from(classAnnouncements)
    .where(eq(classAnnouncements.classCode, code))
    .orderBy(desc(classAnnouncements.id))
    .limit(limit);
}

/** 刪除一則公告（僅限該班級老師本人）。 */
export async function deleteAnnouncement(id: number, classCode: string, teacherName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select({ id: classAnnouncements.id, classCode: classAnnouncements.classCode, teacherName: classAnnouncements.teacherName })
    .from(classAnnouncements)
    .where(eq(classAnnouncements.id, id))
    .limit(1);
  if (existing.length === 0) return { ok: false as const, reason: "notFound" as const };
  if (existing[0].classCode !== classCode || existing[0].teacherName !== teacherName) {
    return { ok: false as const, reason: "forbidden" as const };
  }
  await db.delete(classAnnouncements).where(eq(classAnnouncements.id, id));
  return { ok: true as const };
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

/* ---------- AI 自動週測 ---------- */

/** 讀取某位學生某週的週測卷（不存在回傳 null）。 */
export async function getWeeklyQuiz(studentName: string, weekKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select()
    .from(weeklyQuizzes)
    .where(and(eq(weeklyQuizzes.studentName, studentName), eq(weeklyQuizzes.weekKey, weekKey)))
    .limit(1);
  return rows[0] ?? null;
}

/** 建立週測卷（studentName + weekKey 唯一；重複建立回傳 null）。 */
export async function createWeeklyQuiz(row: InsertWeeklyQuiz) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select({ id: weeklyQuizzes.id })
    .from(weeklyQuizzes)
    .where(and(eq(weeklyQuizzes.studentName, row.studentName), eq(weeklyQuizzes.weekKey, row.weekKey)))
    .limit(1);
  if (existing.length > 0) return null;
  const result = await db.insert(weeklyQuizzes).values(row);
  const insertId = (result as unknown as [{ insertId?: number }])[0]?.insertId ?? 0;
  return { id: Number(insertId) };
}

/** 標記週測卷為已完成並寫入分數（同一份卷重複提交以最新分數覆寫）。 */
export async function markWeeklyQuizDone(id: number, correctCount: number, totalQuestions: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(weeklyQuizzes)
    .set({ status: "done", correctCount, totalQuestions, submittedAt: new Date() })
    .where(eq(weeklyQuizzes.id, id));
}

/** 本週聯盟賽：聚合 exam_records（排除教師檔案），按作答量排序回傳前 30 名。 */
export async function listWeeklyLeaderboard(weekStart: Date, limit = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select({
      name: examRecords.name,
      totalQuestions: sql`COALESCE(SUM(${examRecords.totalQuestions}), 0)`,
      correctCount: sql`COALESCE(SUM(${examRecords.correctCount}), 0)`,
      lastActiveAt: sql`MAX(${examRecords.createdAt})`,
    })
    .from(examRecords)
    .where(and(gte(examRecords.createdAt, weekStart), sql`${examRecords.name} NOT LIKE '__teacher_%'`))
    .groupBy(examRecords.name)
    .orderBy(desc(sql`COALESCE(SUM(${examRecords.totalQuestions}), 0)`))
    .limit(Math.min(Math.max(limit, 1), 100));
  return rows.map((row) => ({
    name: row.name,
    totalQuestions: Number(row.totalQuestions),
    correctCount: Number(row.correctCount),
    accuracy: Number(row.totalQuestions) > 0 ? Math.round((Number(row.correctCount) / Number(row.totalQuestions)) * 100) : 0,
    lastActiveAt: row.lastActiveAt instanceof Date ? row.lastActiveAt.getTime() : Date.now(),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 聯盟賽：賽季／分組／升降級／獎勵
// ─────────────────────────────────────────────────────────────────────────────

const LEAGUE_GROUP_ORDER: LeagueGroupType[] = ["bronze", "silver", "gold", "diamond"];

/**
 * 升降級純函數：每組依 score 降序，前 upRate 升一級、後 downRate 降一級。
 * 青銅不降、鑽石不升。回傳 name → 下一季組別。
 */
export function computeLeaguePromotionDemotion(
  entries: Array<{ name: string; groupType: LeagueGroupType; score: number }>,
  options?: { upRate?: number; downRate?: number },
): Map<string, LeagueGroupType> {
  const upRate = options?.upRate ?? 0.3;
  const downRate = options?.downRate ?? 0.3;
  const byGroup = new Map<LeagueGroupType, Array<{ name: string; groupType: LeagueGroupType; score: number }>>();
  for (const entry of entries) {
    const list = byGroup.get(entry.groupType) ?? [];
    list.push(entry);
    byGroup.set(entry.groupType, list);
  }
  const next = new Map<string, LeagueGroupType>();
  for (const group of LEAGUE_GROUP_ORDER) {
    const list = byGroup.get(group);
    if (!list || list.length === 0) continue;
    const sorted = [...list].sort((a, b) => b.score - a.score);
    const total = sorted.length;
    const idx = LEAGUE_GROUP_ORDER.indexOf(group);
    const upCount = Math.floor(total * upRate);
    const downCount = Math.floor(total * downRate);
    sorted.forEach((entry, i) => {
      let nextGroup: LeagueGroupType = group;
      if (idx < LEAGUE_GROUP_ORDER.length - 1 && i < upCount) {
        nextGroup = LEAGUE_GROUP_ORDER[idx + 1]!;
      } else if (idx > 0 && i >= total - downCount) {
        nextGroup = LEAGUE_GROUP_ORDER[idx - 1]!;
      }
      next.set(entry.name, nextGroup);
    });
  }
  return next;
}

export type LeagueRankReward = { coins: number; badge: string | null; title: string };

/** 排名獎純函數：依組內名次比例給金幣與限定徽章。 */
export function computeLeagueRankReward(groupType: LeagueGroupType, rank: number, total: number): LeagueRankReward {
  if (rank <= 0 || total <= 0) return { coins: 0, badge: null, title: "" };
  const rate = rank / total;
  if (rate <= 0.1) return { coins: 500, badge: `league-${groupType}-top10`, title: `${groupType}組前 10%` };
  if (rate <= 0.25) return { coins: 300, badge: `league-${groupType}-top25`, title: `${groupType}組前 25%` };
  if (rate <= 0.5) return { coins: 150, badge: null, title: `${groupType}組前半` };
  return { coins: 50, badge: null, title: `${groupType}組參賽` };
}

/** 賽季期間該玩家累計作答數（與週榜同來源：exam_records 即時聚合）。 */
async function leagueSeasonScore(name: string, season: Pick<LeagueSeason, "startAt" | "endAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select({ totalQuestions: sql`COALESCE(SUM(${examRecords.totalQuestions}), 0)` })
    .from(examRecords)
    .where(and(
      gte(examRecords.createdAt, season.startAt),
      lt(examRecords.createdAt, season.endAt),
      eq(examRecords.name, name),
    ));
  return Number(rows[0]?.totalQuestions ?? 0);
}

/**
 * 取得當前賽季；若上季已結束未結算會先結算並建立下一季（惰性結算）。
 * 完全沒有賽季時建立第一季。
 */
export async function ensureLeagueSeason(now = new Date()): Promise<{ season: LeagueSeason; settledPrevious: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const active = await db
    .select()
    .from(leagueSeasons)
    .where(and(lte(leagueSeasons.startAt, now), gt(leagueSeasons.endAt, now), eq(leagueSeasons.isSettled, "0")))
    .orderBy(desc(leagueSeasons.id))
    .limit(1);
  if (active.length > 0) return { season: active[0]!, settledPrevious: false };

  const expired = await db
    .select()
    .from(leagueSeasons)
    .where(and(lt(leagueSeasons.endAt, now), eq(leagueSeasons.isSettled, "0")))
    .orderBy(asc(leagueSeasons.id))
    .limit(1);
  if (expired.length > 0) {
    const nextSeason = await settleLeagueSeason(expired[0]!.id, now);
    return { season: nextSeason, settledPrevious: true };
  }

  const [created] = await db.insert(leagueSeasons).values({
    seasonNumber: 1,
    startAt: now,
    endAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    isSettled: "0",
  });
  const inserted = await db.select().from(leagueSeasons).where(eq(leagueSeasons.id, created.insertId)).limit(1);
  return { season: inserted[0]!, settledPrevious: false };
}

/** 結算某賽季：依各組作答數做升降級、建立下一季分組、標記本季已結算。回傳下一季。 */
export async function settleLeagueSeason(seasonId: number, now = new Date()): Promise<LeagueSeason> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(leagueSeasons).where(eq(leagueSeasons.id, seasonId)).limit(1);
  const season = rows[0];
  if (!season) throw new Error("賽季不存在");
  if (season.isSettled === "1") throw new Error("賽季已結算");

  const groupRows = await db.select().from(leagueGroups).where(eq(leagueGroups.seasonId, seasonId));
  const members = groupRows.filter((row) => !row.name.startsWith("__teacher_"));
  const scored: Array<{ name: string; groupType: LeagueGroupType; score: number }> = [];
  for (const member of members) {
    const score = await leagueSeasonScore(member.name, season);
    if (score > 0) scored.push({ name: member.name, groupType: member.groupType as LeagueGroupType, score });
  }
  const nextGroupMap = computeLeaguePromotionDemotion(scored);

  const nextStart = season.endAt;
  const nextEnd = new Date(season.endAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [created] = await db.insert(leagueSeasons).values({
    seasonNumber: season.seasonNumber + 1,
    startAt: nextStart,
    endAt: nextEnd,
    isSettled: "0",
  });
  const nextSeasonId = created.insertId;

  if (nextGroupMap.size > 0) {
    const values: InsertLeagueGroup[] = Array.from(nextGroupMap.entries()).map(([name, groupType]) => ({
      seasonId: nextSeasonId,
      name,
      groupType,
    }));
    for (const value of values) await db.insert(leagueGroups).values(value);
  }

  await db.update(leagueSeasons).set({ isSettled: "1" }).where(eq(leagueSeasons.id, seasonId));
  const nextRows = await db.select().from(leagueSeasons).where(eq(leagueSeasons.id, nextSeasonId)).limit(1);
  return nextRows[0]!;
}

/** 新玩家分組：該季無分組 → 青銅；已有 → 回傳原組別。 */
export async function getOrCreateLeagueGroup(name: string, seasonId: number): Promise<LeagueGroupType> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select({ groupType: leagueGroups.groupType })
    .from(leagueGroups)
    .where(and(eq(leagueGroups.seasonId, seasonId), eq(leagueGroups.name, name)))
    .limit(1);
  if (rows.length > 0) return rows[0]!.groupType as LeagueGroupType;
  await db.insert(leagueGroups).values({ seasonId, name, groupType: "bronze" });
  return "bronze";
}

export type LeagueStandingRow = { name: string; totalQuestions: number; accuracy: number };

/** 某組別（或全站）即時榜：賽季起訖內聚合作答數。 */
export async function listLeagueStandings(
  season: Pick<LeagueSeason, "id" | "startAt" | "endAt">,
  groupType?: LeagueGroupType,
  limit = 50,
): Promise<LeagueStandingRow[]> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  let names: string[] | null = null;
  if (groupType) {
    const rows = await db
      .select({ name: leagueGroups.name })
      .from(leagueGroups)
      .where(and(eq(leagueGroups.seasonId, season.id ?? -1), eq(leagueGroups.groupType, groupType)));
    names = rows.map((row) => row.name);
    if (names.length === 0) return [];
  }
  const conds = [gte(examRecords.createdAt, season.startAt), lt(examRecords.createdAt, season.endAt), sql`${examRecords.name} NOT LIKE '__teacher_%'`];
  if (names) conds.push(inArray(examRecords.name, names));
  const rows = await db
    .select({
      name: examRecords.name,
      totalQuestions: sql`COALESCE(SUM(${examRecords.totalQuestions}), 0)`,
      correctCount: sql`COALESCE(SUM(${examRecords.correctCount}), 0)`,
    })
    .from(examRecords)
    .where(and(...conds))
    .groupBy(examRecords.name)
    .orderBy(desc(sql`COALESCE(SUM(${examRecords.totalQuestions}), 0)`))
    .limit(Math.min(Math.max(limit, 1), 100));
  return rows.map((row) => ({
    name: row.name,
    totalQuestions: Number(row.totalQuestions),
    accuracy: Number(row.totalQuestions) > 0 ? Math.round((Number(row.correctCount) / Number(row.totalQuestions)) * 100) : 0,
  }));
}

/** 已領取獎勵清單。 */
export async function listClaimedLeagueRewards(seasonId: number, name: string): Promise<Array<{ rewardType: "participate" | "rank"; rank: number | null }>> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select({ rewardType: leagueRewards.rewardType, rank: leagueRewards.rank })
    .from(leagueRewards)
    .where(and(eq(leagueRewards.seasonId, seasonId), eq(leagueRewards.name, name)));
  return rows.map((row) => ({ rewardType: row.rewardType as "participate" | "rank", rank: row.rank }));
}

export type LeagueClaimResult = { ok: true; rewardType: "participate" | "rank"; coins: number; badge: string | null; title: string; rank?: number } | { ok: false; reason: string };

/** 領取賽季獎勵：防重複、條件檢查（參與獎需 ≥5 題；排名獎需有作答並依組內名次發放）。 */
export async function claimLeagueReward(seasonId: number, name: string, rewardType: "participate" | "rank"): Promise<LeagueClaimResult> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const seasonRows = await db.select().from(leagueSeasons).where(eq(leagueSeasons.id, seasonId)).limit(1);
  const season = seasonRows[0];
  if (!season) return { ok: false, reason: "seasonNotFound" };

  const already = await listClaimedLeagueRewards(seasonId, name);
  if (already.some((item) => item.rewardType === rewardType)) return { ok: false, reason: "alreadyClaimed" };

  const groupType = await getOrCreateLeagueGroup(name, seasonId);
  const score = await leagueSeasonScore(name, season);

  if (rewardType === "participate") {
    if (score < 5) return { ok: false, reason: "notEnoughScore" };
    await db.insert(leagueRewards).values({ seasonId, name, rewardType, rank: null });
    return { ok: true, rewardType, coins: 100, badge: "league-participate", title: "賽季參與獎" };
  }

  if (rewardType === "rank") {
    if (score < 1) return { ok: false, reason: "noScore" };
    const standings = await listLeagueStandings(season, groupType, 100);
    const rankIndex = standings.findIndex((row) => row.name === name);
    if (rankIndex < 0) return { ok: false, reason: "noScore" };
    const rank = rankIndex + 1;
    const reward = computeLeagueRankReward(groupType, rank, standings.length);
    await db.insert(leagueRewards).values({ seasonId, name, rewardType, rank });
    return { ok: true, rewardType, coins: reward.coins, badge: reward.badge, title: reward.title, rank };
  }
  return { ok: false, reason: "badType" };
}

/** AI 伴讀每日配額：取得某使用者當日已用次數。 */
export async function getAiUsage(name: string, usageDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select({ count: aiUsage.count })
    .from(aiUsage)
    .where(and(eq(aiUsage.name, name), eq(aiUsage.usageDate, usageDate)))
    .limit(1);
  return rows.length > 0 ? rows[0].count : 0;
}

/** AI 伴讀每日配額：遞增一次並回傳更新後的使用次數。 */
export async function incrementAiUsage(name: string, usageDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .insert(aiUsage)
    .values({ name, usageDate, count: 1 })
    .onDuplicateKeyUpdate({ set: { count: sql`${aiUsage.count} + 1` } });
  return getAiUsage(name, usageDate);
}

/** AI 深度反思 token 用量：累加一次呼叫與 token 數，回傳更新後的當日總量。 */
export async function addAiTokenUsage(
  name: string,
  usageDate: string,
  tokens: { promptTokens: number; completionTokens: number; totalTokens: number },
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const safe = {
    promptTokens: Math.max(0, Math.floor(tokens.promptTokens)),
    completionTokens: Math.max(0, Math.floor(tokens.completionTokens)),
    totalTokens: Math.max(0, Math.floor(tokens.totalTokens)),
  };
  await db
    .insert(aiUsage)
    .values({ name, usageDate, count: 1, ...safe })
    .onDuplicateKeyUpdate({
      set: {
        count: sql`${aiUsage.count} + 1`,
        promptTokens: sql`${aiUsage.promptTokens} + ${safe.promptTokens}`,
        completionTokens: sql`${aiUsage.completionTokens} + ${safe.completionTokens}`,
        totalTokens: sql`${aiUsage.totalTokens} + ${safe.totalTokens}`,
      },
    });
  const rows = await db
    .select({ count: aiUsage.count, promptTokens: aiUsage.promptTokens, completionTokens: aiUsage.completionTokens, totalTokens: aiUsage.totalTokens })
    .from(aiUsage)
    .where(and(eq(aiUsage.name, name), eq(aiUsage.usageDate, usageDate)))
    .limit(1);
  return rows.length > 0
    ? { calls: rows[0].count, promptTokens: rows[0].promptTokens, completionTokens: rows[0].completionTokens, totalTokens: rows[0].totalTokens }
    : { calls: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
}

export type AiTokenUsageRow = {
  usageDate: string;
  calls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

/** AI token 用量查詢：近 N 天（含今天）依日期遞增，可只限單一使用者或全站。 */
export async function listAiTokenUsage(days: number, name?: string): Promise<AiTokenUsageRow[]> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const startDate = new Date(Date.now() + 8 * 60 * 60 * 1000);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  const startKey = startDate.toISOString().slice(0, 10);
  const conditions = name
    ? and(gte(aiUsage.usageDate, startKey), eq(aiUsage.name, name))
    : gte(aiUsage.usageDate, startKey);
  const rows = await db
    .select({
      usageDate: aiUsage.usageDate,
      calls: aiUsage.count,
      promptTokens: aiUsage.promptTokens,
      completionTokens: aiUsage.completionTokens,
      totalTokens: aiUsage.totalTokens,
    })
    .from(aiUsage)
    .where(conditions);
  const byDate = new Map<string, AiTokenUsageRow>();
  for (const row of rows) {
    const prev = byDate.get(row.usageDate);
    if (prev) {
      prev.calls += row.calls;
      prev.promptTokens += row.promptTokens;
      prev.completionTokens += row.completionTokens;
      prev.totalTokens += row.totalTokens;
    } else {
      byDate.set(row.usageDate, { usageDate: row.usageDate, calls: row.calls, promptTokens: row.promptTokens, completionTokens: row.completionTokens, totalTokens: row.totalTokens });
    }
  }
  return Array.from(byDate.values()).sort((a, b) => (a.usageDate < b.usageDate ? -1 : 1));
}


/** 異步 PK：建立挑戰（邀請碼由 router 產生並保證唯一）。 */
export async function createPkChallenge(row: { code: string; initiatorName: string; questionIds: string[]; }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(pkChallenges).values({ code: row.code, initiatorName: row.initiatorName, questionIds: row.questionIds, status: "waiting" });
  return getPkChallenge(row.code);
}

/** 異步 PK：以邀請碼讀取挑戰。 */
export async function getPkChallenge(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(pkChallenges).where(eq(pkChallenges.code, code)).limit(1);
  return rows.length > 0 ? rows[0] : null;
}

/** 異步 PK：挑戰者加入（記名，尚未提交分數）。 */
export async function joinPkChallenge(code: string, challengerName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(pkChallenges).set({ challengerName }).where(eq(pkChallenges.code, code));
  return getPkChallenge(code);
}

/** 異步 PK：提交分數；雙方都完成時標記 completed。 */
export async function submitPkScore(code: string, side: "initiator" | "challenger", score: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const current = await getPkChallenge(code);
  if (!current) return null;
  const patch: Record<string, unknown> = side === "initiator" ? { initiatorScore: score } : { challengerScore: score };
  const initiatorScore = side === "initiator" ? score : current.initiatorScore;
  const challengerScore = side === "challenger" ? score : current.challengerScore;
  if (initiatorScore !== null && challengerScore !== null) patch.status = "completed";
  await db.update(pkChallenges).set(patch).where(eq(pkChallenges.code, code));
  return getPkChallenge(code);
}
