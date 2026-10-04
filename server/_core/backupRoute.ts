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
import { ADMIN_OPEN_ID } from "./context";

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
 * 站長鑑權。
 *
 * ⚠️ 2026-10-04 修正（初版寫錯，導致**連站長自己都下載不了**）：
 *
 * 初版寫成 `hasRoleAtLeast(await sdk.verifySession(cookie), "admin")`。但
 * `verifySession` 回傳的是 session payload `{ openId, appId, name }`——**沒有 role 欄位**，
 * 而 `hasRoleAtLeast` 第一行就是 `if (!role) return false` → **永遠回 false**。
 * 症狀：站長登入成功（`admin.me` 回 `isAdmin: true`）卻仍被 401 擋下。
 *
 * 正確做法：比對哨兵 `openId`。這與 `context.ts` 把 `session.openId === ADMIN_OPEN_ID`
 * 映射成 `role: "admin"` 是**同一件事**，只是不經過 ctx.user 那條路。
 *
 * 為什麼原本的測試沒抓到：只驗了「未授權 → 401」這個負面路徑，而**壞掉的實作也回 401**，
 * 於是測試「因為錯的理由而通過」。→ 已補正面路徑測試（`backupAuth.test.ts`）。
 *
 * 沒有 cookie 就不驗 session——`context.ts` 早就踩過這個坑：`verifySession` 對空 cookie
 * 會印 console.warn，而匿名學生流量佔多數，日誌會被灌爆。
 */
export async function isAdminRequest(req: express.Request): Promise<boolean> {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return false;
  const cookieValue = parseCookieHeader(rawCookie)[COOKIE_NAME];
  if (!cookieValue) return false;
  try {
    const session = await sdk.verifySession(cookieValue);
    return session?.openId === ADMIN_OPEN_ID;
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

    /**
     * ⚠️ 2026-10-04 修正：原本兩個分支寫成同一個表達式 `../..`，是**錯的**。
     *
     * `import.meta.dirname` 指的是「**執行中檔案**的所在目錄」，兩種跑法不同：
     * - dev（tsx 跑 `server/_core/index.ts`）→ `<repo>/server/_core` → 上兩層才是專案根
     * - prod（esbuild 打包成 `dist/index.js`）→ `<repo>/dist` → **上一層**就是專案根
     *
     * 原本 prod 用 `../..` 會指到**專案的上一層**，把整個上層目錄都打包進去。
     * 本機實測證據：zip 內路徑是 `hdmx/.gitignore`（多了專案資料夾名），
     * 甚至把我放在上層的 `axe-nightly-unpublished-*.bundle` 也包了進來。
     * 在 Render 上 `../..` = `/opt/render/project`（含 `src/` 等非本專案內容）。
     */
    const projectRoot =
      process.env.NODE_ENV === "development"
        ? path.resolve(import.meta.dirname, "../..")
        : path.resolve(import.meta.dirname, "..");

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
