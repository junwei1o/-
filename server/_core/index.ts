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
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
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
  // tRPC API（先過限流）
  app.use(
    "/api/trpc",
    apiLimiter,
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
