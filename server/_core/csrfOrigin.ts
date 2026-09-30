/**
 * server/_core/csrfOrigin.ts
 * ─────────────────────────────────────────────
 * CSRF 防護：對 tRPC 的非 GET 請求校驗 Origin 屬於本站。
 *
 * 為什麼需要（SEC-02）：
 *   session cookie 的 sameSite 為 'none'（允許跨站攜帶，見 cookies.ts），
 *   而 mutation 原本不驗證來源 → 已登入教師可能被誘導觸發寫入操作。
 *
 * 為什麼用 Origin 白名單而非同步 token：
 *   全站 tRPC 呼叫很多，要在前端每個入口帶 token 容易漏；相較之下
 *   瀏覽器發起的跨站請求「必定」帶 Origin 且值不可偽造，成本集中在伺服器一處。
 *
 * 豁免：沒有 Origin 頭的請求直接放行。那不是瀏覽器情境
 *   （curl、Render→LINE webhook 等伺服器對伺服器呼叫），
 *   攻擊者無法用瀏覽器偽裝成「沒有 Origin」。
 */
import type { RequestHandler } from "express";

/** 正式環境的固定 origin。dev 由 req.headers.host 推導，不寫死。 */
const PRODUCTION_ORIGIN = "https://xue-gr3a.onrender.com";

/** 本機開發用的 Vite dev server 與後端埠。 */
const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

export function buildAllowedOrigins(host: string | undefined): Set<string> {
  const origins = new Set<string>([PRODUCTION_ORIGIN, ...DEV_ORIGINS]);
  // 由請求 host 推導：自訂網域、preview 網址也能自動納入，不必改程式。
  if (host) origins.add(`https://${host}`);
  return origins;
}

/**
 * 建立 Origin 守衛。
 *
 * host 於「每次請求」時從 req.headers.host 推導，而非建立時閉包捕捉——
 * 同一個 process 服務多個網域（自訂網域／preview）時才不會誤擋，
 * 也不需要在啟動時就知道對外主機名。
 */
export function createCsrfOriginGuard(): RequestHandler {
  return (req, res, next) => {
    // GET/HEAD/OPTIONS 不改變狀態，無 CSRF 風險。
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      next();
      return;
    }

    const origin = req.headers.origin;
    if (!origin) {
      next(); // 非瀏覽器來源
      return;
    }

    if (!buildAllowedOrigins(req.headers.host).has(origin)) {
      res.status(403).json({
        error: {
          json: {
            message: "跨站請求已拒絕",
            code: -32000,
            data: { code: "CSRF_ORIGIN_REJECTED", httpStatus: 403 },
          },
        },
      });
      return;
    }

    next();
  };
}
