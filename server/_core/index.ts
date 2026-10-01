import "dotenv/config";
import express, { type Request } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { rateLimit } from "express-rate-limit";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerBackupRoute } from "./backupRoute";
import { appRouter } from "../routers";
import { ensureQuestionBankReady } from "../db";
import { createContext } from "./context";
import { handleLineWebhook } from "./lineWebhook";
import { serveStatic, setupVite } from "./vite";
import { apiCacheControl } from "./apiCache";
import { createCsrfOriginGuard } from "./csrfOrigin";
import { recordRequest } from "./requestStats";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Render 反向代理的第一跳：讓 req.ip 是使用者真實 IP，
  // 否則限流鍵會全站共用同一個代理 IP，一超額就全站被擋。
  app.set("trust proxy", 1);
  // 安全回應標頭（覆核第⑤項；手動設置、不引外部依賴以免動 lockfile）：
  //   nosniff — 禁止 MIME 嗅探，防上傳/回應內容被當腳本執行；
  //   Referrer-Policy — 跨站導引只帶來源、不帶路徑；
  //   X-Frame-Options — 拒絕被 iframe 嵌入（點擊劫持）；
  //   HSTS — 強制後續 HTTPS（Render 已終止 TLS，此處為保險）。
  //
  // ── CSP（SEC-01）────────────────────────────────────────────
  // 現況：全站無 CSP。為避免誤傷功能，先上 Report-Only 觀察一個週期，
  // 確認零誤報後再改成正式 Content-Security-Policy（見下方 TODO）。
  //
  // 策略依據（皆為實測後的產物，非套用範本）：
  //   · script-src 需 'unsafe-inline' —— index.html 有 2 段內聯 script
  //     （主題防閃爍、骨架屏隱藏）。要移除得改架構（nonce/hash），本次不動。
  //     縱使有 unsafe-inline，仍能擋下外部來源的 script 注入。
  //   · style-src 需 'unsafe-inline' —— chart.tsx 動態注入 <style>，
  //     另有約 40 處 style={{}} 內聯樣式。
  //   · connect-src 'self' —— tRPC（含遠端 TTS，音檔走同源 tRPC 取 blob）、
  //     LINE webhook、umami（僅在設定 VITE_ANALYTICS_ENDPOINT 時跨源，
  //     故以 https: 放行 connect，憑證仍由瀏覽器強制）。
  //   · img-src 需 data: —— qrSvg.ts 產生 data:image/svg+xml。
  //   · media-src 需 blob: —— TTS 以 URL.createObjectURL 播放音檔。
  //   · worker-src 需 blob: —— optionExpandScheduler 以 Worker 展開選項。
  //   · object-src 'none'、base-uri 'self'、form-action 'self' —— 無用途，直接鎖死。
  //   · frame-ancestors 'self' —— 與既有 X-Frame-Options: SAMEORIGIN 對齊。
  const CSP_REPORT_ONLY = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "media-src 'self' blob:",
    "connect-src 'self' https:",
    "font-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("X-Powered-By", ""); // 移除 Express 指紋
    res.setHeader("X-Render-Origin-Server", ""); // 移除平台指紋
    // TODO(sec-01): Report-Only 觀察期滿、且確認零誤報後，改為正式標頭：
    //   res.setHeader("Content-Security-Policy", CSP_REPORT_ONLY);
    // 同時移除 Content-Security-Policy-Report-Only。
    res.setHeader("Content-Security-Policy-Report-Only", CSP_REPORT_ONLY);
    next();
  });
  // 背景自動佈建題庫（建表＋匯入內建 500 題）；不阻擋開機，失敗也不影響服務。
  void ensureQuestionBankReady();
  // LINE webhook：必須在 express.json 之前用 raw parser，才能拿原文驗簽章。
  app.use(
    "/api/line/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
    (req, res) => {
      (req as Request & { rawBody?: Buffer }).rawBody = req.body;
      void handleLineWebhook(req, res);
    },
  );
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerBackupRoute(app);
  // 請求統計（2026-10-01，站長後台用）：只記聚合數字（狀態碼分級、方法、耗時），
  // 不記路徑／IP／UA。掛在所有路由之前，於回應結束時結算。
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      recordRequest({ method: req.method, status: res.statusCode, durationMs: Date.now() - startedAt });
    });
    next();
  });
  // API 速率限制（計劃 A Phase 4）：每 IP 每分鐘 300 次。
  // 取捨：計畫範例值為 60/min，但校園 Wi-Fi 常整校共用一個對外 IP（NAT），
  // 60/min 會把一間教室的正常作答整批誤殺；300/min 足以擋自動化洪水，
  // 又不會傷到真人課堂。實際量測後可再收緊。
  const apiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    // 回 tRPC 錯誤形狀，讓前端解析得到結構化訊息而非純文字
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          json: {
            message: "請求過於頻繁，請稍等一分鐘再試",
            code: -32000,
            data: { code: "TOO_MANY_REQUESTS", httpStatus: 429 },
          },
        },
      });
    },
  });
  // ── CSRF 防護（SEC-02）────────────────────────────────────────
  // 問題：session cookie 的 sameSite 為 'none'（允許跨站攜帶），
  // 而 tRPC mutation 未驗證來源 → 已登入教師可能被誘導觸發寫入操作。
  //
  // 解法：對 /api/trpc 的「非 GET」請求校驗 Origin 屬於本站。
  // 不採用同步 token（前端全站 tRPC 呼叫，注入點多、容易漏），
  // 改用 Origin 白名單 —— 瀏覽器跨站請求必帶 Origin 且值不可偽造。
  // 實作與豁免規則見 ./csrfOrigin.ts（含單元測試）。
  //
  // LINE webhook 掛在 /api/line/webhook，不走這個 guard，且它以
  // X-Line-Signature 驗簽章，本來就不依賴 cookie。
  app.use(
    "/api/trpc",
    createCsrfOriginGuard(),
    apiLimiter,
    apiCacheControl,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
