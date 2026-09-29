import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // 快取策略：Vite 會為建置產物加上內容雜湊（如 index-BBWc1o5M.js），
  // 檔名即版本，可安全地永久快取；HTML 則必須每次重新驗證，
  // 否則改版後使用者會一直拿到舊的 index.html、指向已不存在的資源。
  app.use(
    express.static(distPath, {
      setHeaders(res, filePath) {
        // 帶雜湊的建置產物：一年 immutable
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return;
        }
        // index.html 與其他檔案（favicon、manifest、og-image…）：短快取，
        // 改版後最多一小時內生效，且不會卡住舊版本。
        res.setHeader("Cache-Control", "public, max-age=3600, must-revalidate");
      },
    }),
  );

  // 未命中的雜湊資產直接 404（覆核第⑥項）：讓 SPA fallback 只服務頁面路由，
  // 否則 /assets/不存在.js 會回 200+HTML，壞連結被狀態碼掩飾、難以察覺。
  app.use("/assets", (_req, res) => {
    res.status(404).type("text/plain; charset=utf-8").send("Not Found");
  });

  // 根目錄帶靜態副檔名的未命中路徑也回 404（覆核第⑥項補角）：否則
  // /x.css、/x.json 之類缺檔同樣被 SPA fallback 包成 200+HTML。
  // 用副檔名白名單而非「路徑有點就 404」——頁面路由參數可能含點
  //（如 regionKey），只攔真實靜態檔案類型；真實存在的檔案早被上面
  // 的 express.static 送出，不會走到這裡。
  const STATIC_EXT =
    /\.(?:m?js|cjs|css|map|json|webmanifest|txt|xml|svg|png|jpe?g|webp|gif|ico|woff2?|ttf|otf|mp[34]|wasm)$/i;
  app.use((req, res, next) => {
    if ((req.method === "GET" || req.method === "HEAD") && STATIC_EXT.test(req.path)) {
      res.status(404).type("text/plain; charset=utf-8").send("Not Found");
      return;
    }
    next();
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
