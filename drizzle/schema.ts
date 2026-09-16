import { int, index, json, mysqlEnum, mysqlTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

/**
 * AI 自動週測：每週五（台北時間）自動為每位學生出 10 題本週回顧，
 * 卷子在首次讀取時生成並固定（刷新不變），提交後寫入分數。
 * 同一 (studentName, weekKey) 只有一份，重複提交以最新分數覆寫、不重複給獎。
 */
export const weeklyQuizzes = mysqlTable("weekly_quizzes", {
  id: int("id").autoincrement().primaryKey(),
  studentName: varchar("studentName", { length: 24 }).notNull(),
  /** 週 key：ISO 週（台北時間），例 "2026-W37"。 */
  weekKey: varchar("weekKey", { length: 16 }).notNull(),
  grade: int("grade"),
  /** 卷子內容（含每題 subject/difficulty/learningTopic/prompt/options/answer/explanation）。 */
  questions: json("questions").$type<unknown>().notNull(),
  status: mysqlEnum("status", ["pending", "done"]).default("pending").notNull(),
  correctCount: int("correctCount").notNull().default(0),
  totalQuestions: int("totalQuestions").notNull().default(0),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  studentWeekIdx: index("weekly_quizzes_student_week_idx").on(table.studentName, table.weekKey),
}));

export type WeeklyQuiz = typeof weeklyQuizzes.$inferSelect;
export type InsertWeeklyQuiz = typeof weeklyQuizzes.$inferInsert;
export const aiUsage = mysqlTable("ai_usage", {
  name: varchar("name", { length: 24 }).notNull(),
  /** 使用日（台北時間 YYYY-MM-DD），配額每日重置。 */
  usageDate: varchar("usageDate", { length: 10 }).notNull(),
  count: int("count").notNull().default(0),
  /** 深度反思 token 用量（供應商回傳才累計；未回傳時為 0）。 */
  promptTokens: int("promptTokens").notNull().default(0),
  completionTokens: int("completionTokens").notNull().default(0),
  totalTokens: int("totalTokens").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  nameDateIdx: primaryKey({ columns: [table.name, table.usageDate] }),
}));

export type AiUsage = typeof aiUsage.$inferSelect;
export type InsertAiUsage = typeof aiUsage.$inferInsert;

export const pkChallenges = mysqlTable("pk_challenges", {
  code: varchar("code", { length: 8 }).primaryKey(),
  initiatorName: varchar("initiatorName", { length: 24 }).notNull(),
  initiatorScore: int("initiatorScore"),
  challengerName: varchar("challengerName", { length: 24 }),
  challengerScore: int("challengerScore"),
  /** 雙方共用的固定題目 ID 清單，確保 PK 公平。 */
  questionIds: json("questionIds").$type<string[]>().notNull(),
  status: mysqlEnum("status", ["waiting", "completed"]).default("waiting").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PkChallenge = typeof pkChallenges.$inferSelect;
export type InsertPkChallenge = typeof pkChallenges.$inferInsert;

/** 聯盟賽組別（由低到高）。新玩家預設青銅，結算時前 30% 升、後 30% 降。 */
export const LEAGUE_GROUPS = ["bronze", "silver", "gold", "diamond"] as const;
export type LeagueGroupType = (typeof LEAGUE_GROUPS)[number];

/**
 * 聯盟賽賽季：每 7 天一季（與每週一 00:00 的週榜週期對齊）。
 * 分組在賽季開始時依上季結算結果建立；賽季中即時聚合作答數排名。
 */
export const leagueSeasons = mysqlTable("league_seasons", {
  id: int("id").autoincrement().primaryKey(),
  seasonNumber: int("seasonNumber").notNull(),
  startAt: timestamp("startAt").notNull(),
  endAt: timestamp("endAt").notNull(),
  isSettled: mysqlEnum("isSettled", ["0", "1"]).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  seasonNumberIdx: index("league_seasons_number_idx").on(table.seasonNumber),
}));

export type LeagueSeason = typeof leagueSeasons.$inferSelect;
export type InsertLeagueSeason = typeof leagueSeasons.$inferInsert;

/** 聯盟賽分組快照：某賽季中每位參賽者的組別（賽季內不變，結算時重排）。 */
export const leagueGroups = mysqlTable("league_groups", {
  id: int("id").autoincrement().primaryKey(),
  seasonId: int("seasonId").notNull(),
  name: varchar("name", { length: 24 }).notNull(),
  groupType: mysqlEnum("groupType", LEAGUE_GROUPS).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  seasonNameIdx: index("league_groups_season_name_idx").on(table.seasonId, table.name),
  seasonGroupIdx: index("league_groups_season_group_idx").on(table.seasonId, table.groupType),
}));

export type LeagueGroup = typeof leagueGroups.$inferSelect;
export type InsertLeagueGroup = typeof leagueGroups.$inferInsert;

/** 聯盟賽獎勵領取紀錄：同一賽季同一玩家同一獎項只能領一次。 */
export const leagueRewards = mysqlTable("league_rewards", {
  id: int("id").autoincrement().primaryKey(),
  seasonId: int("seasonId").notNull(),
  name: varchar("name", { length: 24 }).notNull(),
  rewardType: mysqlEnum("rewardType", ["participate", "rank"]).notNull(),
  /** 排名獎的組內名次（參與獎為 null）。 */
  rank: int("rank"),
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
}, (table) => ({
  seasonNameTypeIdx: index("league_rewards_season_name_type_idx").on(table.seasonId, table.name, table.rewardType),
}));

export type LeagueReward = typeof leagueRewards.$inferSelect;
export type InsertLeagueReward = typeof leagueRewards.$inferInsert;
