/**
 * `/api/backup` 的防回歸測試（2026-10-04 審查後補）。
 *
 * ## 為什麼必須有這個測試
 *
 * 審查發現這個端點曾經**完全無防護**：它掛在 `index.ts:119`，
 * 而速率限制與 CSRF 守衛只掛在 `/api/trpc`——所以任何人無需憑據
 * 就能下載整包源碼（實測 8.3 MB），且因為要同步走訪近百 MB 再 zlib level 9 壓縮，
 * 單個匿名請求就能吃掉 512 MB 免費實例的 CPU/記憶體。
 *
 * 更隱蔽的是 `shouldExcludePath`：它的 wildcard 分支只對 `*.` 開頭的 pattern 生效，
 * 而 `.env.*` 是 `.` 開頭 → **那條排除規則永遠不會生效**。
 * 這種「防護看起來在、其實失效」的狀態，光靠 code review 抓不住第二次。
 *
 * 所以這裡把三條關鍵不變量釘死。
 */
import { describe, expect, it } from "vitest";
import { shouldExcludePath } from "./backupRoute";

describe("backup 排除規則（防回歸）", () => {
  it("巢狀 node_modules 必須被擋下（2026-10-04 實測 21MB 第三方程式碼曾外洩）", () => {
    expect(shouldExcludePath("scripts/axe-nightly/node_modules/playwright/index.js")).toBe(true);
    expect(shouldExcludePath("scripts/axe-nightly/node_modules/axe-core/axe.js")).toBe(true);
    expect(shouldExcludePath("node_modules/react/index.js")).toBe(true);
    // 巢狀 dist / .git 同理
    expect(shouldExcludePath("packages/app/dist/index.js")).toBe(true);
    expect(shouldExcludePath("vendor/.git/config")).toBe(true);
  });

  it(".env.* 曾是死規則，根目錄與巢狀都必須被擋下", () => {
    // 這些是實際會含憑證的路徑（JWT_SECRET / GROQ_API_KEY / DATABASE_URL）
    expect(shouldExcludePath(".env")).toBe(true);
    expect(shouldExcludePath(".env.local")).toBe(true);
    expect(shouldExcludePath(".env.production")).toBe(true);
    expect(shouldExcludePath(".env.staging")).toBe(true);
    expect(shouldExcludePath(".env.backup")).toBe(true);
    // 巢狀：放在子目錄同樣會外洩，不能只保護根目錄那一層
    expect(shouldExcludePath("server/.env.local")).toBe(true);
    expect(shouldExcludePath("apps/api/.env.production")).toBe(true);
  });

  it("深層 .DS_Store 與 *.log 要排除", () => {
    expect(shouldExcludePath("a/b/.DS_Store")).toBe(true);
    expect(shouldExcludePath("a/b.log")).toBe(true);
    expect(shouldExcludePath("deep/nested/path/x.lcov")).toBe(true);
  });

  it("⚠️ 真正的原始碼必須保留（排除規則不能太寬，否則備份變無用）", () => {
    const mustKeep = [
      "client/src/App.tsx",
      "client/src/index.css",
      "client/src/lib/questionBank.ts",
      "server/routers.ts",
      "package.json",
      "pnpm-lock.yaml",
      "README.md",
      "data/generated_bank.json",
      "data/runtime_bank_elementary.json",
      "docs/knowledge-base/01-專案總覽.md",
      "client/public/icon-512.png",
      "scripts/gen/crossSubject.mjs",
    ];
    for (const p of mustKeep) {
      expect(shouldExcludePath(p), `${p} 不該被排除`).toBe(false);
    }
  });

  it("同名的子目錄不該被誤判（只擋 layer 名稱，不擋前綴相同者）", () => {
    // 專案裡真的有一個叫 distributions 的資料夾，不能因為 dist 就被砍掉
    expect(shouldExcludePath("data/distributions/notes.md")).toBe(false);
    expect(shouldExcludePath("src/distillery/index.ts")).toBe(false);
  });
});
