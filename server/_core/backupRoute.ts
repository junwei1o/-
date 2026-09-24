/**
 * 一鍵備份 — 全站原始碼 ZIP 下載
 *
 * 產生一個包含完整專案原始碼的 ZIP 串流，讓使用者一鍵下載到本機。
 * 排除 node_modules、dist、.git、環境設定檔等非原始碼內容。
 * 下載後解壓、pnpm install、pnpm build 即可在本機離線架站。
 */

import express from "express";
import { ZipArchive } from "archiver";
import fs from "fs";
import path from "path";

/** 要排除的目錄與檔案（glob 模式，相對於專案根目錄）。 */
const EXCLUDE_PATTERNS = [
  "node_modules/**",
  "node_modules",
  "dist/**",
  "dist",
  ".git/**",
  ".git",
  ".env",
  ".env.*",
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

/** 給 archiver 用的 glob 過濾函式。 */
function shouldExclude(entryPath: string): boolean {
  const normalized = entryPath.replace(/\\/g, "/");
  return EXCLUDE_PATTERNS.some((pattern) => {
    const clean = pattern.replace(/\/\*+$/, "");
    return (
      normalized === clean ||
      normalized.startsWith(clean + "/") ||
      // 處理 *.log 等 wildcard
      (pattern.startsWith("*.") &&
        new RegExp(pattern.replace(/\./g, "\\.").replace(/\*/, ".*") + "$").test(
          normalized.split("/").pop() ?? ""
        ))
    );
  });
}

export function registerBackupRoute(app: express.Express) {
  app.get("/api/backup", async (_req, res) => {
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

        if (shouldExclude(relPath)) continue;

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
