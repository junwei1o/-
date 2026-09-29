import type { NextFunction, Request, Response } from "express";

/**
 * tRPC 快取標頭（2026-09-30 覆核 P6）。
 *
 * 現況問題：/api/trpc 回應只有 `vary: trpc-accept, accept`，沒有
 * `Cache-Control`——前置 CDN 把整組 API 判成 DYNAMIC、一律不存，
 * 連「內容與使用者無關、可安全共享」的題庫查詢也吃不到邊緣快取。
 *
 * 策略（白名單制，個資安全優先）：
 * - GET 且整批 path 都是靜態題庫查詢（questionBank.list /
 *   targetedPractice.list）→ `public, max-age=60`：
 *   回應只取決於 URL 輸入（grade/subject/limit…）、與 cookie 無關，
 *   內容來自磁碟碼表，可安全共享快取。
 * - 其餘一律 `no-store`：涵蓋 auth.me、個人成績、公告等一切 session
 *   相關端點與所有 mutation——共享快取若按 URL 鍵存取，會把 A 使用者
 *   的回應發給 B；no-store 從源頭封死這類錯存錯發。
 *
 * 注意 httpBatchLink：多個 query 可能逗號接在同一個 GET（/a,b?batch=1）。
 * 只有「整批都是白名單」才可 public；混入任一 session 端點即整批 no-store。
 */
const STATIC_QUERY_PATH = /^(?:questionBank|targetedPractice)\.list$/;

export function apiCacheControl(req: Request, res: Response, next: NextFunction): void {
  const isStaticQuery =
    req.method === "GET" &&
    req.path !== "/" &&
    req.path
      .replace(/^\//, "")
      .split(",")
      .every((segment) => STATIC_QUERY_PATH.test(segment));

  res.setHeader("Cache-Control", isStaticQuery ? "public, max-age=60" : "no-store");
  next();
}
