import { count } from "drizzle-orm";
import {
  aiUsage,
  assignments,
  classAnnouncements,
  classMembers,
  classes,
  cloudSaves,
  examRecords,
  questionBank,
  users,
  weeklyQuizzes,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb, getQuestionBank } from "./db";

/**
 * 站長後台的總覽資料（2026-10-01）。
 *
 * 設計原則：**只回傳真的量得到的東西**。
 * - 資料庫計數走真正的 `COUNT(*)`；資料庫未設定時明確回報，不用 0 假裝。
 * - 題庫統計取自伺服器既有的記憶體快取（`getQuestionBank`），不额外打 DB。
 * - 環境變數**只回報「是否已設定」，絕不回傳值**——後台不該成為機密外洩管道。
 *
 * 快取：資料庫計數不快取會讓每次開後台都打十幾個 COUNT（消耗 RU），
 * 故加 60 秒 TTL；題庫統計則直接沿用既有快取。
 */

export type AdminSiteStats = {
  database: { configured: boolean; reachable: boolean; pingMs: number | null; error: string | null };
  counts: {
    users: number;
    cloudSaves: number;
    examRecords: number;
    classes: number;
    classMembers: number;
    assignments: number;
    announcements: number;
    weeklyQuizzes: number;
    aiUsageRows: number;
  } | null;
  bank: {
    total: number;
    bySubject: Record<string, number>;
    byGrade: Record<string, number>;
    byDifficulty: Record<string, number>;
    /** 選項數分布——用來確認「是非題／四選一」比例是否符合預期。 */
    byOptionCount: Record<string, number>;
  } | null;
  cachedAt: number | null;
};

const COUNTS_TTL_MS = 60_000;
let countsCache: { at: number; value: AdminSiteStats["counts"] } | null = null;

async function loadCounts(): Promise<{ counts: AdminSiteStats["counts"]; database: AdminSiteStats["database"] }> {
  const startedAt = Date.now();
  const db = await getDb();
  if (!db) {
    return {
      counts: null,
      database: { configured: false, reachable: false, pingMs: null, error: "DATABASE_URL 未設定" },
    };
  }
  try {
    const [cloudSavesRow] = await db.select({ n: count() }).from(cloudSaves);
    const [examRecordsRow] = await db.select({ n: count() }).from(examRecords);
    const [classesRow] = await db.select({ n: count() }).from(classes);
    const [classMembersRow] = await db.select({ n: count() }).from(classMembers);
    const [assignmentsRow] = await db.select({ n: count() }).from(assignments);
    const [announcementsRow] = await db.select({ n: count() }).from(classAnnouncements);
    const [weeklyRow] = await db.select({ n: count() }).from(weeklyQuizzes);
    const [aiRow] = await db.select({ n: count() }).from(aiUsage);
    const [bankRow] = await db.select({ n: count() }).from(questionBank);
    const [usersRow] = await db.select({ n: count() }).from(users);

    return {
      counts: {
        users: Number(usersRow?.n ?? 0),
        cloudSaves: Number(cloudSavesRow?.n ?? 0),
        examRecords: Number(examRecordsRow?.n ?? 0),
        classes: Number(classesRow?.n ?? 0),
        classMembers: Number(classMembersRow?.n ?? 0),
        assignments: Number(assignmentsRow?.n ?? 0),
        announcements: Number(announcementsRow?.n ?? 0),
        weeklyQuizzes: Number(weeklyRow?.n ?? 0),
        aiUsageRows: Number(aiRow?.n ?? 0),
      },
      database: { configured: true, reachable: true, pingMs: Date.now() - startedAt, error: null },
    };
  } catch (error) {
    return {
      counts: null,
      database: {
        configured: true,
        reachable: false,
        pingMs: null,
        error: error instanceof Error ? error.message.slice(0, 160) : "未知錯誤",
      },
    };
  }
}

/** 從記憶體題庫算分布（題庫是靜態碼表，快取命中時幾乎零成本）。 */
async function loadBankStats(): Promise<AdminSiteStats["bank"]> {
  try {
    const rows = await getQuestionBank();
    if (!rows.length) return null;
    const bySubject: Record<string, number> = {};
    const byGrade: Record<string, number> = {};
    const byDifficulty: Record<string, number> = {};
    const byOptionCount: Record<string, number> = {};
    for (const row of rows as Array<Record<string, unknown>>) {
      const subject = String(row.subject ?? "未分類");
      bySubject[subject] = (bySubject[subject] ?? 0) + 1;
      const grade = String(row.grade ?? "未標示");
      byGrade[grade] = (byGrade[grade] ?? 0) + 1;
      const difficulty = String(row.difficulty ?? "未標示");
      byDifficulty[difficulty] = (byDifficulty[difficulty] ?? 0) + 1;
      const options = Array.isArray(row.options) ? row.options.length : 0;
      const key = `${options} 個選項`;
      byOptionCount[key] = (byOptionCount[key] ?? 0) + 1;
    }
    return { total: rows.length, bySubject, byGrade, byDifficulty, byOptionCount };
  } catch {
    return null;
  }
}

export async function getAdminSiteStats(now: number = Date.now()): Promise<AdminSiteStats> {
  const fresh = countsCache && now - countsCache.at < COUNTS_TTL_MS;
  const loaded = fresh
    ? { counts: countsCache!.value, database: { configured: true, reachable: true, pingMs: null, error: null } }
    : await loadCounts();
  if (!fresh) countsCache = { at: now, value: loaded.counts };

  return {
    database: loaded.database,
    counts: loaded.counts,
    bank: await loadBankStats(),
    cachedAt: fresh ? countsCache!.at : now,
  };
}

/** 測試用：清掉計數快取。 */
export function clearAdminStatsCacheForTest(): void {
  countsCache = null;
}

// ── 執行環境 ────────────────────────────────────────────────────────

export type AdminRuntimeInfo = {
  nodeVersion: string;
  platform: string;
  environment: "production" | "development" | "test" | "other";
  startedAt: number;
  uptimeMs: number;
  memory: { rssMb: number; heapUsedMb: number; heapTotalMb: number };
  /** 只回報「是否已設定」，**不回傳任何值**。 */
  env: { name: string; configured: boolean; note: string }[];
};

export function getAdminRuntimeInfo(now: number = Date.now()): AdminRuntimeInfo {
  const memory = process.memoryUsage();
  const nodeEnv = process.env.NODE_ENV;
  return {
    nodeVersion: process.version,
    platform: process.platform,
    environment: nodeEnv === "production" || nodeEnv === "development" || nodeEnv === "test" ? nodeEnv : "other",
    startedAt: now - Math.round(process.uptime() * 1000),
    uptimeMs: Math.round(process.uptime() * 1000),
    memory: {
      rssMb: Math.round(memory.rss / 1024 / 1024),
      heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
    },
    env: [
      { name: "DATABASE_URL", configured: Boolean(ENV.databaseUrl), note: "雲端存檔、班級、公告、試卷紀錄" },
      { name: "JWT_SECRET", configured: Boolean(ENV.cookieSecret), note: "會話簽章；生產環境未設會拒絕啟動" },
      { name: "TEACHER_PASSPHRASE", configured: Boolean(ENV.teacherPassphrase), note: "教師登入（督學台）" },
      { name: "ADMIN_PASSPHRASE", configured: Boolean(ENV.adminPassphrase), note: "站長登入（本站長後台）" },
      { name: "GROQ_API_KEY", configured: Boolean(ENV.groqApiKey), note: "AI 主要供應商" },
      { name: "CEREBRAS_API_KEY", configured: Boolean(ENV.cerebrasApiKey), note: "AI 備援供應商" },
      { name: "DEEPSEEK_API_KEY", configured: Boolean(ENV.deepseekApiKey), note: "AI 備援供應商" },
      { name: "QWEN_API_KEY", configured: Boolean(ENV.qwenApiKey), note: "AI 備援供應商" },
      { name: "LINE_CHANNEL_SECRET", configured: Boolean(ENV.lineChannelSecret), note: "LINE 通知（webhook 驗簽）" },
      { name: "LINE_CHANNEL_ACCESS_TOKEN", configured: Boolean(ENV.lineChannelAccessToken), note: "LINE 推播" },
    ],
  };
}
