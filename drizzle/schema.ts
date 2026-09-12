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
  questionType: mysqlEnum("questionType", ["選擇題", "是非題"]).default("選擇題").notNull(),
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

/**
 * 雲端船籍：以孩子自選的「名字」（2–6 字，無密碼）作為主鍵的整包進度存檔。
 * metrics 欄位（coins/totalAnswers/badges）用於「認船」確認畫面與合併判斷。
 */
export const cloudSaves = mysqlTable("cloud_saves", {
  name: varchar("name", { length: 24 }).primaryKey(),
  payload: json("payload").$type<unknown>().notNull(),
  coins: int("coins").notNull().default(0),
  totalAnswers: int("totalAnswers").notNull().default(0),
  badges: int("badges").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CloudSave = typeof cloudSaves.$inferSelect;
export type InsertCloudSave = typeof cloudSaves.$inferInsert;

/** 每份試卷完成後寫入一筆的航行紀錄。 */
export const examRecords = mysqlTable("exam_records", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 24 }).notNull(),
  subject: varchar("subject", { length: 32 }).notNull(),
  grade: int("grade"),
  difficulty: varchar("difficulty", { length: 16 }),
  totalQuestions: int("totalQuestions").notNull(),
  correctCount: int("correctCount").notNull(),
  detail: json("detail").$type<unknown>(),
  /**
   * 同一份試卷的識別碼（學生 + 開始時間 + 題目組成）。
   * 用來讓「補報」覆蓋同一筆紀錄，而不是灌出重複的航行紀錄——
   * 學生常常答完最後一題才回頭標錯誤原因，那時需要再上報一次。
   */
  sessionKey: varchar("sessionKey", { length: 160 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("exam_records_name_idx").on(table.name),
}));

export type ExamRecord = typeof examRecords.$inferSelect;
export type InsertExamRecord = typeof examRecords.$inferInsert;

/* ---------- 教師端：班級、成員、作業 ---------- */

/** 班級：以 6 位班級碼作為主鍵，老師與學生都靠這組碼相認。 */
export const classes = mysqlTable("classes", {
  code: varchar("code", { length: 8 }).primaryKey(),
  name: varchar("name", { length: 40 }).notNull(),
  teacherName: varchar("teacherName", { length: 24 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClassRow = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

/** 班級成員：學生的雲端船籍名字加入班級的對應關係。 */
export const classMembers = mysqlTable("class_members", {
  id: int("id").autoincrement().primaryKey(),
  classCode: varchar("classCode", { length: 8 }).notNull(),
  studentName: varchar("studentName", { length: 24 }).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  classIdx: index("class_members_class_idx").on(table.classCode),
  uniqueMember: index("class_members_unique_idx").on(table.classCode, table.studentName),
}));

export type ClassMember = typeof classMembers.$inferSelect;
export type InsertClassMember = typeof classMembers.$inferInsert;

/** 作業：老師指派給某班級的一份練習（科目＋年級＋題數＋截止日）。 */
export const assignments = mysqlTable("assignments", {
  id: int("id").autoincrement().primaryKey(),
  classCode: varchar("classCode", { length: 8 }).notNull(),
  subject: varchar("subject", { length: 32 }).notNull(),
  grade: int("grade").notNull(),
  questionCount: int("questionCount").notNull(),
  /** 指定知識點時，組卷會優先出該知識點的題（學生薄弱處加強用）。 */
  learningTopic: varchar("learningTopic", { length: 255 }),
  /** 空值＝全班；有值時只有這位學生看得到（兩個學生的場景常需要「只給阿明」）。 */
  studentName: varchar("studentName", { length: 24 }),
  dueDate: varchar("dueDate", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  classIdx: index("assignments_class_idx").on(table.classCode),
}));

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;

/** 作業繳交紀錄：一位學生對一份作業的成績。 */
export const assignmentSubmissions = mysqlTable("assignment_submissions", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  studentName: varchar("studentName", { length: 24 }).notNull(),
  correctCount: int("correctCount").notNull(),
  totalQuestions: int("totalQuestions").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
}, (table) => ({
  assignmentIdx: index("assignment_submissions_assignment_idx").on(table.assignmentId),
  uniqueSubmission: index("assignment_submissions_unique_idx").on(table.assignmentId, table.studentName),
}));

export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type InsertAssignmentSubmission = typeof assignmentSubmissions.$inferInsert;

/** 班級公告：老師發的「週末作業」「下週主題」一類訊息，學生按 classCode 拉取。 */
export const classAnnouncements = mysqlTable("class_announcements", {
  id: int("id").autoincrement().primaryKey(),
  classCode: varchar("classCode", { length: 8 }).notNull(),
  teacherName: varchar("teacherName", { length: 24 }).notNull(),
  content: varchar("content", { length: 500 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  classIdx: index("class_announcements_class_idx").on(table.classCode),
  createdIdx: index("class_announcements_created_idx").on(table.createdAt),
}));

export type ClassAnnouncement = typeof classAnnouncements.$inferSelect;
export type InsertClassAnnouncement = typeof classAnnouncements.$inferInsert;