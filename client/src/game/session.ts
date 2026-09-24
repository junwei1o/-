/**
 * 登入 Session 管理 — 寶島探險家
 *
 * 設計原則：
 * - 以「名字」（2–6 字）為帳號，沿用既有雲端船籍機制，不加密碼。
 * - Session 存於 localStorage `xue-session-v1`：包含 name、role、lastPath、loginAt。
 * - 登入時自動嘗試從雲端拉取進度（若該名字有雲端存檔）；離線/無 DB 時靜默退回純本機。
 * - 登出時清 session 但保留本機學習資料（孩子不會因登出就丟進度）。
 * - 路由切換時由 AuthGate 持續更新 lastPath，下次登入直接回到上次頁面。
 */

import {
  validateCloudName,
  loadCloud,
  applyCloudSave,
  getCloudMode,
  setCloudMode,
  type CloudModeState,
} from "./cloudSync";

const SESSION_KEY = "xue-session-v1";
const TEACHER_CLASS_CODE_KEY = "xue-teacher-class-code-v1";

export type UserRole = "student" | "teacher";

export interface XueSession {
  /** 登入名字（船長名） */
  name: string;
  /** 自動判斷的角色 */
  role: UserRole;
  /** 上次造訪的路由路徑，登入後自動還原 */
  lastPath: string | null;
  /** 登入時間戳 */
  loginAt: number;
}

/* ---------- 讀寫 ---------- */

function readSession(): XueSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<XueSession>;
    if (
      typeof parsed.name === "string" &&
      parsed.name &&
      typeof parsed.role === "string" &&
      typeof parsed.loginAt === "number"
    ) {
      return {
        name: parsed.name,
        role: parsed.role === "teacher" ? "teacher" : "student",
        lastPath: typeof parsed.lastPath === "string" ? parsed.lastPath : null,
        loginAt: parsed.loginAt,
      };
    }
  } catch {
    // 損壞的 session 視為未登入
  }
  return null;
}

function writeSession(session: XueSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ---------- 角色 判斷 ---------- */

/**
 * 判斷使用者是否為老師。
 * 依據：localStorage 是否有班級碼（老師台建立的 class code）。
 * 這是軟判斷——即便判為 student 也不封鎖 /teacher 路由（只是不預設導航到那）。
 */
export function detectRole(name: string): UserRole {
  // 如果本機有班級碼，很可能是老師
  try {
    const classCode = localStorage.getItem(TEACHER_CLASS_CODE_KEY);
    if (classCode) return "teacher";
  } catch {
    // 讀不到 localStorage 不影響登入
  }
  return "student";
}

/* ---------- 公開 API ---------- */

/** 目前是否已登入 */
export function isLoggedIn(): boolean {
  return readSession() !== null;
}

/** 取得當前 session（未登入回 null） */
export function getSession(): XueSession | null {
  return readSession();
}

/** 取得當前登入的名字；未登入回 null */
export function getLoggedInName(): string | null {
  return readSession()?.name ?? null;
}

/**
 * 登入：驗證名字 → 建立 session → 嘗試從雲端拉進度 → 回傳 session。
 * 雲端拉取是 best-effort：失敗不阻止登入，只是用本機既有資料。
 */
export async function login(rawName: string): Promise<{ ok: true; session: XueSession; cloudSynced: boolean } | { ok: false; reason: "invalid"; message: string }> {
  const name = rawName.trim();
  const invalid = validateCloudName(name);
  if (invalid) {
    return { ok: false, reason: "invalid", message: invalid };
  }

  const role = detectRole(name);
  const session: XueSession = {
    name,
    role,
    lastPath: null,
    loginAt: Date.now(),
  };

  // 先寫入 session，讓雲端同步能在已登入的狀態下進行
  writeSession(session);

  // 嘗試從雲端拉進度（best-effort）
  let cloudSynced = false;
  try {
    const loaded = await loadCloud(name);
    if (loaded.ok) {
      await applyCloudSave(loaded.save);
      cloudSynced = true;
    } else if (loaded.reason === "notFound") {
      // 雲端沒有這個名字的存檔——設定雲端船籍為這個名字，
      // 讓後續答題能自動同步（best-effort，靜默失敗）
      const mode = getCloudMode();
      if (mode.mode !== "cloud" || mode.name !== name) {
        const cloudState: CloudModeState = { mode: "cloud", name, linkedAt: Date.now() };
        setCloudMode(cloudState);
      }
    }
  } catch {
    // 雲端同步失敗不阻止登入
  }

  return { ok: true, session, cloudSynced };
}

/** 登出：清 session，保留本機學習資料不動 */
export function logout() {
  clearSession();
}

/** 更新上次造訪路徑（由 AuthGate 在路由切換時呼叫） */
export function updateLastPath(path: string) {
  const session = readSession();
  if (!session) return;
  // 不記首頁和登入頁本身
  if (path === "/" || path === "/login") return;
  session.lastPath = path;
  writeSession(session);
}

/** 取得上次造訪路徑（登入後還原用） */
export function getLastPath(): string | null {
  return readSession()?.lastPath ?? null;
}
