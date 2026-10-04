/**
 * 一鍵備份 — 全站原始碼 ZIP 下載（**站長專屬**）
 *
 * 產生一個包含完整專案原始碼的 ZIP 串流，讓**站長**一鍵下載到本機。
 * 排除 node_modules、dist、.git、環境設定檔等非原始碼內容。
 * 下載後解壓、pnpm install、pnpm build 即可在本機離線架站。
 *
 * ⚠️ 2026-10-04 安全修正（審查發現，實測）：
 *  1. **加入站長鑑權**——此路由掛在 `index.ts:119`，而速率限制與 CSRF 守衛只掛在
 *     `/api/trpc`，所以它原先是**完全無防護的公開端點**。實測未授權請求可拿到整包
 *     原始碼（8.3 MB），且因要同步走訪近百 MB 再用 zlib level 9 壓縮，單個匿名
 *     請求就能吃掉 512 MB 實例的 CPU/記憶體 → 同時是 **DoS 向量**。
 *  2. **修排除規則的巢狀漏擋與死規則**（見 `shouldExclude` 說明）。
 *  3. 抽出 `shouldExcludePath` 供 `backupExclude.test.ts` 直接驗證。
 *
 * 本路由的失效模式是「誤放＝外洩根檔案」，因此修法刻意保守：
 * **不改成 glob→regex**（沒有測試資產、替換順序錯一位就會誤擋或誤放）。
 */

import express from "express";
import { ZipArchive } from "archiver";
import fs from "fs";
import path from "path";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { sdk } from "./sdk";
import { hasRoleAtLeast } from "./trpc";

/** 要排除的目錄與檔案（glob 模式，相對於專案根目錄）。 */
const EXCLUDE_PATTERNS = [
  "node_modules/**",
  "node_modules",
  "dist/**",
  "dist",
  ".git/**",
  ".git",
  ".env",
  // ⚠️ 原本寫 `.env.*`，但它**永遠不會生效**：wildcard 分支只對 `*.` 開頭的
  // pattern 生效（`pattern.startsWith("*.")`），而 `.env.*` 是 `.` 開頭；
  // 它也沒有尾隨 `/**` 可剝，於是 `clean` 就是字面 `.env.*`，三條比對路徑全落空。
  // 實測 `.env.local`／`.env.production`／`.env.backup`／`.env.staging` 全部會外洩。
  // 改成字面清單，現有的比對分支就吃得到。
  ".env.local",
  ".env.production",
  ".env.backup",
  ".env.staging",
  ".env.development.local",
  ".env.test.local",
  ".env.production.local",
  "*.log",
  ".DS_Store",
  ".testlogs/**",
  ".testlogs",
  "ui-design-runs/**",
  "ui-design-runs",
  "server/_core/public/**",
  "server/_core/public",
  "coverage/**",
  "coverage",
  ".webdev/**",
  ".webdev",
  ".superpowers/**",
  ".superpowers",
  ".cache/**",
  ".cache",
  ".parcel-cache/**",
  ".parcel-cache",
  ".next/**",
  ".nuxt/**",
  "*.tsbuildinfo",
  "*.tgz",
  "*.lcov",
  ".nyc_output/**",
  ".eslintcache",
  ".npm/**",
  ".rpt2_cache/**",
  "pnpm-store/**",
];

/**
 * 只比對「單一 layer 的檔名」就整個跳過的目錄／檔案名（2026-10-04 新增）。
 *
 * 為什麼需要：原本的 `shouldExclude` 只做「整條 path 相等」＋「**頂層** prefix」比對，
 * 所以 `scripts/axe-nightly/node_modules/playwright/index.js` 這種**巢狀**路徑完全
 * 擋不住——21 MB 的第三方程式碼（playwright／axe-core）會被打進公開可下載的 ZIP，
 * 同時把 ZIP 撐到約 98 MB，壓垮 512 MB 免費層。深層 `.DS_Store` 同樣漏掉。
 * 一個迴圈就同時修掉這兩個實際發生的漏洞。
 */
const EXCLUDE_BY_LAYER_NAME = new Set([
  "node_modules",
  "dist",
  ".git",
  ".testlogs",
  "coverage",
  ".cache",
  ".DS_Store",
  ".eslintcache",
  ".nyc_output",
  "pnpm-store",
  "ui-design-runs",
  ".webdev",
  ".superpowers",
  ".next",
  ".nuxt",
]);

/**
 * 給 archiver 用的過濾函式。**導出供測試直接驗證**（`backupExclude.test.ts`）。
 *
 * 兩段判定：
 * 1. 任一 layer 名稱命中 → 跳過（修掉巢狀 `node_modules`／`dist`／`.DS_Store`）
 * 2. pattern 清單：整條 path 相等、頂層 prefix、或**檔名相等**。
 *    最後一種讓巢狀的 `.env.local`（例如 `server/.env.local`）也被擋下——
 *    環境設定檔放子目錄同樣會外洩，不能只保護根目錄那一層。
 */
export function shouldExcludePath(entryPath: string): boolean {
  const normalized = entryPath.replace(/\\/g, "/");
  const layers = normalized.split("/");

  if (layers.some((layer) => EXCLUDE_BY_LAYER_NAME.has(layer))) return true;

  const baseName = layers[layers.length - 1] ?? "";
  return EXCLUDE_PATTERNS.some((pattern) => {
    const clean = pattern.replace(/\/\*+$/, "");
    if (clean.includes("*")) {
      // 處理 *.log 等 wildcard（比對檔名，不比對整條 path）
      return (
        pattern.startsWith("*.") &&
        new RegExp(
          pattern.replace(/\./g, "\\.").replace(/\*/, ".*") + "$"
        ).test(baseName)
      );
    }
    return (
      normalized === clean ||
      normalized.startsWith(clean + "/") ||
      baseName === clean
    );
  });
}

/**
 * 站長鑑權（2026-10-04 新增）。
 *
 * 走的是與 `adminProcedure`（`trpc.ts`）**同一套**判斷：`sdk.verifySession` 驗
 * httpOnly cookie → `hasRoleAtLeast(user, "admin")`。沒有 cookie 就不驗 session
 * ——`context.ts` 早就踩過這個坑：`verifySession` 對空 cookie 會印 console.warn，
 * 而匿名學生流量佔多數，日誌會被灌爆。
 */
async function isAdminRequest(req: express.Request): Promise<boolean> {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return false;
  const cookieValue = parseCookieHeader(rawCookie)[COOKIE_NAME];
  if (!cookieValue) return false;
  try {
    const session = await sdk.verifySession(cookieValue);
    return hasRoleAtLeast(session, "admin");
  } catch {
    return false;
  }
}

export function registerBackupRoute(app: express.Express) {
  app.get("/api/backup", async (req, res) => {
    // 未授權直接 401，且**在建立 ZipArchive 之前**就返回——
    // 讓未授權請求連目錄走訪都不會開始，這是同時消除 DoS 的關鍵。
    if (!(await isAdminRequest(req))) {
      res.status(401).json({
        error: "unauthorized",
        message: "備份下載僅限站長",
      });
      return;
    }

    const projectRoot =
      process.env.NODE_ENV === "development"
        ? path.resolve(import.meta.dirname, "../..")
        : path.resolve(import.meta.dirname, "../..");

    const zipName = `baodao-expedition-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipName}"`
    );
    res.setHeader("Cache-Control", "no-store");

    const archive = new ZipArchive({
      zlib: { level: 9 }, // 最大壓縮
    });

    archive.on("error", (err: Error) => {
      console.error("[backup] zip error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "backup_failed", message: err.message });
      }
      res.end();
    });

    archive.on("warning", (warn: { code?: string; message?: string }) => {
      console.warn("[backup] zip warning:", warn);
    });

    // 串流直接打到 response
    archive.pipe(res);

    // 遞迴走訪專案目錄，把符合條件的檔案加入 zip
    function walkDir(dir: string, baseDir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(baseDir, fullPath);

        if (shouldExcludePath(relPath)) continue;

        if (entry.isDirectory()) {
          walkDir(fullPath, baseDir);
        } else if (entry.isFile()) {
          // 加到 zip，用相對路徑作為壓縮檔內路徑
          archive.file(fullPath, { name: relPath });
        }
      }
    }

    walkDir(projectRoot, projectRoot);

    // 加一個 README 說明檔
    const readme = `# 寶島探險家 — 全站原始碼備份

## 這是什麼

這個 ZIP 檔包含「寶島探險家」學習平台的完整原始碼。
產生時間：${new Date().toISOString()}

## 如何在本機架站

### 需求
- Node.js 22+
- pnpm 10+

### 步驟

1. 解壓 ZIP 檔
   \`\`\`
   unzip baodao-expedition-backup-*.zip -d baodao
   cd baodao
   \`\`\`

2. 安裝依賴
   \`\`\`
   pnpm install
   \`\`\`

3. 建置前端
   \`\`\`
   pnpm build
   \`\`\`

4. 啟動伺服器
   \`\`\`
   pnpm start
   \`\`\`

5. 打開 http://localhost:3000

### 環境變數

需要設定以下環境變數（可建 .env 檔）：
- DATABASE_URL：MySQL 連線字串（沒有 DB 時多數功能仍可用本機模式）
- 其他可選變數見 .gitignore 排除的 .env 範例

### 離線使用

建置完成後，dist/public 目錄包含所有前端靜態檔。
可以直接用任何靜態伺服器（如 npx serve dist/public）提供前端，
但雲端同步、班級管理等功能需要後端 API。
`;
    archive.append(readme, { name: "BACKUP_README.md" });

    await archive.finalize();
  });
}
