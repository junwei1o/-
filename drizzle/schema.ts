import { int, index, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const questionBank = mysqlTable("question_bank", {
  id: varchar("id", { length: 32 }).primaryKey(),
  area: varchar("area", { length: 64 }),
  grade: int("grade").notNull(),
  subject: mysqlEnum("subject", ["數學", "自然", "社會", "國語"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["基礎", "標準", "挑戰"]).notNull(),
  curriculumDomain: mysqlEnum("curriculumDomain", ["語文領域", "數學領域", "自然科學領域", "社會領域"]).notNull(),
  learningTopic: varchar("learningTopic", { length: 255 }).notNull(),
  learningPerformance: text("learningPerformance").notNull(),
  learningContent: text("learningContent").notNull(),
  competency: text("competency").notNull(),
  prompt: text("prompt").notNull(),
  options: json("options").$type<string[]>().notNull(),
  answer: int("answer").notNull(),
  explanation: text("explanation").notNull(),
  knowledge: json("knowledge").$type<string[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  gradeIdx: index("question_bank_grade_idx").on(table.grade),
  subjectIdx: index("question_bank_subject_idx").on(table.subject),
  difficultyIdx: index("question_bank_difficulty_idx").on(table.difficulty),
  curriculumDomainIdx: index("question_bank_curriculum_domain_idx").on(table.curriculumDomain),
}));

export type Question = typeof questionBank.$inferSelect;
export type InsertQuestion = typeof questionBank.$inferInsert;