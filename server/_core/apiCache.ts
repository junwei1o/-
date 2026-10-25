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
 * - `cloud.examLeaderboard`（答題榜）→ `public, max-age=0, s-maxage=30`：
 *   輸入只有 `limit`，不含任何使用者身分，回應對每位訪客相同，因此可共享。
 *   它含學生自選的「船名」，但那本來就是公開榜單上要展示的暱稱
 *   （孩子自行取名、非真實姓名，且此榜單頁對所有訪客可見）。
 *   只進 CDN 邊緣（s-maxage）、不進瀏覽器（max-age=0），TTL 壓在 30 秒，
 *   新成績的顯示延遲因此有明確上限。若日後要改成含真實姓名／班級，
 *   必須把這個白名單項目拿掉。
 * - 其餘一律 `no-store`：涵蓋 auth.me、個人成績、公告等一切 session
 *   相關端點與所有 mutation——共享快取若按 URL 鍵存取，會把 A 使用者
 *   的回應發給 B；no-store 從源頭封死這類錯存錯發。
 *
 * 注意 httpBatchLink：多個 query 可能逗號接在同一個 GET（/a,b?batch=1）。
 * 只有「整批都是白名單」才可 public；混入任一 session 端點即整批 no-store。
 */
const STATIC_QUERY_PATH = /^(?:questionBank|targetedPractice)\.list$/;

/** 可共享但 TTL 很短的端點（內容對所有訪客相同，只是更新較頻繁）。 */
const SHORT_LIVED_SHARED_PATH = /^cloud\.examLeaderboard$/;

export function apiCacheControl(req: Request, res: Response, next: NextFunction): void {
  const segments =
    req.method === "GET" && req.path !== "/"
      ? req.path.replace(/^\//, "").split(",")
      : [];

  const isStaticQuery =
    segments.length > 0 && segments.every((segment) => STATIC_QUERY_PATH.test(segment));
  const isShortLivedShared =
    segments.length > 0 && segments.every((segment) => SHORT_LIVED_SHARED_PATH.test(segment));

  // 整批共享性：任一 segment 不是「對所有訪客相同」就整批 no-store。
  //
  // 白名單之間混批（例如榜單 + 靜態題庫）也視為 no-store：兩者 TTL
  // 不同，不投機取較寬的那個。寧可少命中一次邊緣快取，也不要讓兒童
  // 資料的顯示延遲超出預期。
  res.setHeader(
    "Cache-Control",
    isStaticQuery
      ? "public, max-age=60"
      : isShortLivedShared
        ? "public, max-age=0, s-maxage=30"
        : "no-store"
  );
  next();
}
