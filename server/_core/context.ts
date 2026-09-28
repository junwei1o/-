import { COOKIE_NAME } from "@shared/const";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookieHeader } from "cookie";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * 教師哨兵 openId：teacher.login 簽發 session 與本檔的映射必須一致
 * （計劃 A §1.2／§2.1 約定，兩處共用此常數避免漂移）。
 */
export const TEACHER_OPEN_ID = "__teacher__";

/**
 * 解析真實會話（計劃 A Phase 1）。
 *
 * 訪客船長模式已移除：過去這裡硬編碼回傳永遠為真的 guestUser，
 * 導致 protectedProcedure 是空操作（計劃 F3/F4）。現在：
 * - 有有效教師 session → user = 教師身份（role: "teacher"）
 * - 其餘一律 → user = null（匿名學生操作不依賴 ctx.user，維持現狀）
 */
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // 陷阱 5：sdk.verifySession 對「沒有 cookie」會印 console.warn。匿名學生
  // 流量佔多數，無條件呼叫會把日誌灌爆——沒帶 cookie 就直接早退 user = null。
  const rawCookie = opts.req.headers.cookie;
  if (!rawCookie) {
    return { req: opts.req, res: opts.res, user: null };
  }
  const cookieValue = parseCookieHeader(rawCookie)[COOKIE_NAME];
  if (!cookieValue) {
    return { req: opts.req, res: opts.res, user: null };
  }

  try {
    const session = await sdk.verifySession(cookieValue);
    // 無效／過期會話，或非教師哨兵的一般使用者會話：一律視為未登入。
    if (!session || session.openId !== TEACHER_OPEN_ID) {
      return { req: opts.req, res: opts.res, user: null };
    }

    // 陷阱 4：教師身份只存在於 session payload，不查 users 表、零 DB 變更。
    // users.role 的 mysqlEnum 不含 "teacher"，以結構型別繞過既有 union。
    const teacherUser = {
      id: 0,
      openId: TEACHER_OPEN_ID,
      name: session.name || "teacher",
      email: "",
      loginMethod: "passphrase",
      role: "teacher",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as unknown as User;

    return { req: opts.req, res: opts.res, user: teacherUser };
  } catch {
    // 會話驗證拋錯（簽章不符、演算法不符等）一律視為未登入，不外洩內部錯誤。
    return { req: opts.req, res: opts.res, user: null };
  }
}
