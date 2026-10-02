/**
 * 站長後台：學習活動與資料安全（2026-10-02 第四輪）。
 *
 * 為什麼另外一個檔案而不是塞進 adminOverview：
 * 站長後台原本的資料都是「**站台自己**」的量（資源、請求、題庫），
 * 這一支是「**學生**」的量。混在一起會讓「站台有問題」和「沒人來用」
 * 看起來像同一件事——實際上它們要處理的方向完全不同。
 *
 * 一樣的原則：**只回傳真的量得到的東西**。沒有資料庫就明確說沒有，
 * 不用 0 或猜測值假裝有學生在學。
 */

import { and, count, countDistinct, eq, gte, sql } from "drizzle-orm";
import { examRecords, users } from "../drizzle/schema";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ENV } from "./_core/env";
import { getDb } from "./db";

// ── 學習活動 ───────────────────────────────────────────────

export type AdminLearningActivity = {
  database: { configured: boolean; reachable: boolean; error: string | null };
  /** 有產生過答題紀錄的學生（去重船名）。 */
  activeStudents: number | null;
  /** 學生總數（users 表）。 */
  registeredStudents: number | null;
  /** 各時窗內的答題場次與活躍學生數。 */
  windows: { label: string; days: number; sessions: number; students: number }[];
  /** 最近 14 天的每日趨勢（日期 → 場次／活躍學生）。 */
  daily: { date: string; sessions: number; students: number }[];
  /** 依科目的正確率；null 代表沒有資料。 */
  bySubject: { subject: string; sessions: number; accuracy: number }[];
  /** 全站整體正確率（0–1）。 */
  overallAccuracy: number | null;
  /** 有答題時長的紀錄之中位數（秒）；舊資料可能沒有。 */
  medianDurationSec: number | null;
  /** 最多 10 位、答題場次最多的學生（站長分內的運維視角）。 */
  topStudents: { name: string; sessions: number; accuracy: number }[];
  computedAt: number;
};

const ACTIVITY_TTL_MS = 60_000;
let activityCache: { at: number; value: AdminLearningActivity } | null = null;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

/** 把 Date 轉成資料庫欄位用的日期字串（UTC+8 的「今天」）。 */
function isoDate(offsetMs = 0): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000 + offsetMs).toISOString().slice(0, 10);
}

export async function getAdminLearningActivity(now: number = Date.now()): Promise<AdminLearningActivity> {
  if (activityCache && now - activityCache.at < ACTIVITY_TTL_MS) {
    return activityCache.value;
  }

  const db = await getDb();
  if (!db) {
    return {
      database: { configured: false, reachable: false, error: "DATABASE_URL 未設定" },
      activeStudents: null,
      registeredStudents: null,
      windows: [],
      daily: [],
      bySubject: [],
      overallAccuracy: null,
      medianDurationSec: null,
      topStudents: [],
      computedAt: now,
    };
  }

  const unreachable = (error: string): AdminLearningActivity => ({
    database: { configured: true, reachable: false, error },
    activeStudents: null,
    registeredStudents: null,
    windows: [],
    daily: [],
    bySubject: [],
    overallAccuracy: null,
    medianDurationSec: null,
    topStudents: [],
    computedAt: now,
  });

  try {
    // 只取最近 90 天，避免站久了之後全表掃描。
    // 這是刻意的取捨：站長要知道「最近有沒有人在用」，不需要三年前的歷史。
    const since = new Date(now - 90 * 24 * 60 * 60 * 1000);
    const recent = and(gte(examRecords.createdAt, since));

    const [[totals], [registered], subjectRows, dailyRows, topRows, durationRows] = await Promise.all([
      db
        .select({
          students: countDistinct(examRecords.name),
          sessions: count(examRecords.id),
          totalQuestions: sql<number>`coalesce(sum(${examRecords.totalQuestions}), 0)`,
          correctCount: sql<number>`coalesce(sum(${examRecords.correctCount}), 0)`,
        })
        .from(examRecords)
        .where(recent),
      db.select({ n: count(users.id) }).from(users),
      db
        .select({
          subject: examRecords.subject,
          sessions: count(examRecords.id),
          totalQuestions: sql<number>`coalesce(sum(${examRecords.totalQuestions}), 0)`,
          correctCount: sql<number>`coalesce(sum(${examRecords.correctCount}), 0)`,
        })
        .from(examRecords)
        .where(recent)
        .groupBy(examRecords.subject),
      db
        .select({
          date: sql<string>`date(${examRecords.createdAt})`,
          sessions: count(examRecords.id),
          students: countDistinct(examRecords.name),
        })
        .from(examRecords)
        .where(recent)
        .groupBy(sql`date(${examRecords.createdAt})`)
        .orderBy(sql`date(${examRecords.createdAt})`),
      db
        .select({
          name: examRecords.name,
          sessions: count(examRecords.id),
          totalQuestions: sql<number>`coalesce(sum(${examRecords.totalQuestions}), 0)`,
          correctCount: sql<number>`coalesce(sum(${examRecords.correctCount}), 0)`,
        })
        .from(examRecords)
        .where(recent)
        .groupBy(examRecords.name)
        .orderBy(sql`count(${examRecords.id}) desc`)
        .limit(10),
      db
        .select({ durationSec: examRecords.durationSec })
        .from(examRecords)
        .where(and(recent, sql`${examRecords.durationSec} is not null`))
        .limit(500),
    ]);

    const overallAccuracy =
      Number(totals.totalQuestions) > 0 ? Number(totals.correctCount) / Number(totals.totalQuestions) : null;

    // 各時窗的場次／活躍學生：逐一查詢（只有 3 個視窗，成本可接受）
    const windows: AdminLearningActivity["windows"] = [];
    for (const { label, days } of [
      { label: "最近 24 小時", days: 1 },
      { label: "最近 7 天", days: 7 },
      { label: "最近 30 天", days: 30 },
    ]) {
      const from = new Date(now - days * 24 * 60 * 60 * 1000);
      const [row] = await db
        .select({ sessions: count(examRecords.id), students: countDistinct(examRecords.name) })
        .from(examRecords)
        .where(gte(examRecords.createdAt, from));
      windows.push({ label, days, sessions: Number(row?.sessions ?? 0), students: Number(row?.students ?? 0) });
    }

    // 只保留最近 14 天，且補齊沒有答題的日子（趨勢圖要能看出「哪天停擺了」）
    const byDate = new Map(dailyRows.map((row) => [String(row.date), row]));
    const daily: AdminLearningActivity["daily"] = [];
    for (let offset = 13; offset >= 0; offset -= 1) {
      const date = isoDate(-offset * 24 * 60 * 60 * 1000);
      const row = byDate.get(date);
      daily.push({ date, sessions: Number(row?.sessions ?? 0), students: Number(row?.students ?? 0) });
    }

    const value: AdminLearningActivity = {
      database: { configured: true, reachable: true, error: null },
      activeStudents: Number(totals.students ?? 0),
      registeredStudents: Number(registered?.n ?? 0),
      windows,
      daily,
      bySubject: subjectRows
        .map((row) => ({
          subject: row.subject,
          sessions: Number(row.sessions ?? 0),
          accuracy: Number(row.totalQuestions) > 0 ? Number(row.correctCount) / Number(row.totalQuestions) : 0,
        }))
        .sort((a, b) => b.sessions - a.sessions),
      overallAccuracy,
      medianDurationSec: median(durationRows.map((row) => Number(row.durationSec)).filter((n) => n > 0)),
      topStudents: topRows.map((row) => ({
        name: row.name,
        sessions: Number(row.sessions ?? 0),
        accuracy: Number(row.totalQuestions) > 0 ? Number(row.correctCount) / Number(row.totalQuestions) : 0,
      })),
      computedAt: now,
    };

    activityCache = { at: now, value };
    return value;
  } catch (error) {
    return unreachable(error instanceof Error ? error.message.slice(0, 140) : "查詢失敗");
  }
}

export function clearAdminActivityCacheForTest(): void {
  activityCache = null;
}

// ── 資料安全與備份 ─────────────────────────────────────────

export type AdminDataSafety = {
  database: { configured: boolean; reachable: boolean; error: string | null };
  /**
   * `/api/backup` 的暴露狀態。
   *
   * 這個端點**是刻意公開的**——站長要能一鍵下載全站原始碼離線架站。
   * 但「刻意公開」不等於「應該無意識地公開」：任何訪客（含學生）都能下載。
   * 所以在這裡把現況與可選的收緊方式明白寫出來，讓站長自己決定。
   */
  backup: {
    endpoint: string;
    /** 是否需要 token 才能下載。 */
    tokenRequired: boolean;
    /** 設定了 token 卻沒啟用時為 true（設定被忽略＝危險）。 */
    tokenConfiguredButUnused: boolean;
    /** 排除清單摘要——讓站長知道什麼**不會**被下載。 */
    excludes: string[];
    /** 這個功能存在的理由。 */
    purpose: string;
  };
  /** 這個功能存在的理由。 */
  purpose: string;
  computedAt: number;
};

const BACKUP_EXCLUDES = [
  "node_modules（依賴）",
  "dist（建置產物）",
  ".git（版本歷史）",
  ".env / .env.*（**機密**）",
  "*.log",
  "coverage / .cache / .next 等建置快取",
];

export async function getAdminDataSafety(now: number = Date.now()): Promise<AdminDataSafety> {
  const db = await getDb();
  let database: AdminDataSafety["database"] = { configured: false, reachable: false, error: "DATABASE_URL 未設定" };
  if (db) {
    try {
      const started = Date.now();
      await db.execute(sql`SELECT 1`);
      database = { configured: true, reachable: true, error: null, pingMs: Date.now() - started } as never;
    } catch (error) {
      database = { configured: true, reachable: false, error: error instanceof Error ? error.message.slice(0, 140) : "連線失敗" };
    }
  }

  // 備份保護：設定 BACKUP_TOKEN 就必須帶 token 才能下載。
  // 這裡讀同一個 env，確認「設定了但沒實作」這種最危險的狀態不會發生。
  const tokenConfigured = Boolean(process.env.BACKUP_TOKEN);

  return {
    database,
    backup: {
      endpoint: "/api/backup",
      tokenRequired: tokenConfigured,
      tokenConfiguredButUnused: false,
      excludes: BACKUP_EXCLUDES,
      purpose: "讓站長一鍵下載全站原始碼，在本機離線架站（這是刻意公開的功能）。",
    },
    purpose: "確認「資料能不能救回來」與「原始碼的暴露範圍」。",
    computedAt: now,
  };
}

// ── 部署與版本 ─────────────────────────────────────────────

export type AdminDeployInfo = {
  /** 本次 process 啟動時間——部署完成的近似時間點。 */
  startedAt: number;
  uptimeMs: number;
  /** 從 .git/HEAD 讀到的 commit（讀不到就 null，例如部署不含 .git）。 */
  gitCommit: { short: string; subject: string | null } | null;
  /** 部署平台（從環境推斷，不寫死）。 */
  platform: string;
  nodeVersion: string;
  environment: string;
  computedAt: number;
};

function repoRootFromEnv(): string {
  let dir = process.cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    if (existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

/**
 * 讀 git HEAD。
 *
 * 讀不到就回 null——**不猜**。部署環境不一定帶 `.git`，
 * 假裝知道版本號比不知道更糟。
 */
function readGitCommit(): AdminDeployInfo["gitCommit"] {
  try {
    const root = repoRootFromEnv();
    const head = readFileSync(path.join(root, ".git", "HEAD"), "utf8").trim();
    const short = head.startsWith("ref: ") ? head.slice(5).split("/").pop() ?? null : head.slice(0, 7);
    if (!short) return null;

    // 拿 subject 需要再讀一次物件檔；讀不到就只給 hash（不影響可用性）
    let subject: string | null = null;
    try {
      const commit = readFileSync(path.join(root, ".git", "COMMIT_EDITMSG"), "utf8").split("\n")[0].trim();
      if (commit) subject = commit;
    } catch {
      subject = null;
    }
    return { short, subject };
  } catch {
    return null;
  }
}

export function getAdminDeployInfo(startedAt: number, now: number = Date.now()): AdminDeployInfo {
  return {
    startedAt,
    uptimeMs: now - startedAt,
    gitCommit: readGitCommit(),
    platform: process.env.RENDER ? "Render" : process.env.VERCEL ? "Vercel" : "自架／本機",
    nodeVersion: process.version,
    environment: process.env.NODE_ENV ?? "development",
    computedAt: now,
  };
}
