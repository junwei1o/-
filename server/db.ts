import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, questionBank, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      _db = drizzle(pool);
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

  return db
    .select()
    .from(questionBank)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(Math.min(Math.max(filters.limit ?? 500, 1), 500));
}
