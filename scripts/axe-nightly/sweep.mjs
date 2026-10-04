// 全站 a11y 夜間巡檢
// 用法：
//   node sweep.mjs                     # 巡檢並與 baseline.json 比對（有回歸則 exit 1）
//   node sweep.mjs --update-baseline   # 以本次結果更新 baseline（簽核後使用）
// 環境變數：
//   AXE_BASE_URL   目標站（預設正式站）
//   AXE_CAPTAIN    登入用船長名（預設 稽查夜巡）
//   AXE_BROWSER    本機想用系統 Chrome 時設 "chrome"（CI 留空用 Playwright Chromium）
//
// 設計原則（2026-09-29/30 兩輪人工巡檢的教訓）：
// 1. 違規數隨渲染內容浮動 → 報告必須記錄量測時點 + 線上 bundle hash
// 2. strict 比對：新違規類型或任何已知類型數量惡化 = 失敗；改善僅提示
// 3. baseline 是簽核過的快照——故意放寬必須走 --update-baseline 並留紀錄
import { chromium } from "playwright";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE = process.env.AXE_BASE_URL || "https://xue-gr3a.onrender.com";
const CAPTAIN = process.env.AXE_CAPTAIN || "稽查夜巡";
/**
 * 巡檢路由清單（2026-10-04：由 10 條擴充到 40 條）。
 *
 * 全站共 44 條 `<Route>`（見 `client/src/App.tsx`）。本巡檢覆蓋 40 條，
 * 排除 4 條並註明理由：
 *
 * - `/admin`、`/teacher`、`/learning-summary`：包在 `AdminOnlyRoute` 內，**需要站長身分**。
 *   本巡檢以學員船長登入，掃過去只會量到閘門／轉址，不是頁面本身
 *   → 需另一趟站長身分的巡檢（未做）。
 *   ⚠️ 舊清單裡的 `/teacher` 就屬於這種：它量到的是閘門，不是教師儀表板。
 * - `/classroom/:gameId`：需要**真實的班級遊戲 id**（由老師在課堂建立），
 *   無法從原始碼取得固定樣本。
 *
 * 參數化路由一律用「**資料來源的第一筆真實 key**」，不是隨手編的字串——
 * 假 key 會量到「找不到」的 fallback 頁面，那是另一種 UI，不是這個頁面。
 * key 來源：@/lib/astronomy、@/lib/wisdomStories、@/lib/mapRegions、
 *           @/lib/worldPrinciples、@/lib/mediaObservatory、@/lib/safetyAcademy
 *
 * ⚠️ 這些 key 是**資料內容**：若該筆資料被刪除／改名，路由會變成 fallback 頁面，
 *    基線數字跟著變動 → 看到這幾條「改善」時，先確認資料還在，別急著收緊基線。
 */
const ROUTES = [
  // 首頁與主要入口
  "/", "/dashboard", "/map", "/features",
  // 學習
  "/quiz-room", "/weekly-quiz", "/practice", "/tri-axis-paper", "/matching",
  "/wrong-answers", "/review-hub", "/learning", "/learning-insights", "/learning-report",
  "/study-tips", "/error-statistics",
  // 探索、收藏與社群
  "/expedition", "/camp", "/treasure", "/gallery", "/badges", "/graduation",
  "/answer-board", "/adventure-journal", "/community", "/student-dashboard",
  // 館舍首頁
  "/observatory", "/principles", "/astronomy", "/wisdom", "/safety",
  // 館舍詳情（真實 key）
  "/regions/north",
  "/observatory/nailong",
  "/principles/relativity",
  "/astronomy/cosmic-scale",
  "/wisdom/draw-snake-add-feet",
  "/safety/food-safety",
  // 其他
  "/settings", "/class", "/404",
];
const UPDATE = process.argv.includes("--update-baseline");

const baselinePath = path.join(__dirname, "baseline.json");
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));

// Render 免費層 15 分休眠 → 先喚醒再巡檢（最多 ~2.5 分鐘）
async function warmUp() {
  for (let i = 0; i < 15; i++) {
    try {
      const r = await fetch(BASE, { redirect: "follow" });
      if (r.ok) { console.log(`  站點已喚醒（第 ${i + 1} 次探測）`); return; }
    } catch {}
    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error(`站點喚醒逾時：${BASE}`);
}

async function dismissDialogs(page) {
  for (const label of ["好的，開始航行", "跳過導覽"]) {
    const btn = page.getByRole("button", { name: new RegExp(label) });
    try { if (await btn.count()) await btn.first().click({ timeout: 1500 }); } catch {}
  }
  await page.waitForTimeout(400);
}

const results = {};
const browser = await chromium.launch({
  channel: process.env.AXE_BROWSER || undefined,
  headless: true,
});
try {
  await warmUp();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(BASE + "/", { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2000);
  const input = page.locator("input").first();
  if (await input.count()) {
    await input.fill(CAPTAIN);
    await page.getByRole("button", { name: /登入/ }).first().click();
    await page.waitForTimeout(2500);
  }
  await dismissDialogs(page);
  await dismissDialogs(page);

  // axe 來自 npm 依賴本體，不依賴 CDN（離線/網路波動不影響巡檢）
  const axeSrc = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2500); // SPA 懶載入 + 骨架屏收起
    await page.addScriptTag({ content: axeSrc });
    const res = await page.evaluate(() =>
      window.axe.run(document, { resultTypes: ["violations"] })
    );
    const counts = {};
    for (const v of res.violations) counts[v.id] = v.nodes.length;
    results[route] = counts;
    console.log(`  ${route}: ${JSON.stringify(counts)}`);
  }
  await context.close();
} finally {
  await browser.close();
}

// 線上 bundle hash 一起記錄（違規數要對著部署版本看）
let bundle = "unknown";
try {
  const html = await (await fetch(BASE)).text();
  bundle = (html.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || ["unknown"])[0];
} catch {}

const report = {
  meta: {
    date: new Date().toISOString(),
    baseUrl: BASE,
    bundle,
    axeVersion: JSON.parse(fs.readFileSync(require.resolve("axe-core/package.json"), "utf8")).version,
  },
  results,
};
fs.writeFileSync(path.join(__dirname, "axe-report.json"), JSON.stringify(report, null, 2));

// 比對：新類型 / 數量惡化 = 失敗；改善僅提示
const fail = [];
const improve = [];
for (const route of ROUTES) {
  const b = baseline.routes?.[route] || {};
  const now = results[route] || {};
  for (const [id, n] of Object.entries(now)) {
    if (!(id in b)) fail.push(`${route}: 新違規類型 ${id}(${n})`);
    else if (n > b[id]) fail.push(`${route}: ${id} ${b[id]}→${n}（惡化）`);
    else if (n < b[id]) improve.push(`${route}: ${id} ${b[id]}→${n}`);
  }
  for (const [id, n] of Object.entries(b)) {
    if (n > 0 && !(id in now)) improve.push(`${route}: ${id} ${n}→0`);
  }
}

if (UPDATE) {
  baseline.meta = { ...report.meta, note: "量測時點+部署版本必須一併記錄（違規數隨渲染內容浮動）" };
  baseline.routes = results;
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + "\n");
  console.log("✅ baseline 已更新（請在提交訊息寫明簽核原因）");
  process.exit(0);
}

console.log("\n═══ 巡檢結果 ═══");
if (improve.length) { console.log("改善:"); improve.forEach((x) => console.log("  ↑", x)); }
if (fail.length) {
  console.log("回歸:");
  fail.forEach((x) => console.log("  ↓", x));
  console.log(`\n❌ ${fail.length} 項回歸 —— 詳見 axe-report.json`);
  process.exit(1);
}
console.log(`\n✅ 無回歸（另錄得改善 ${improve.length} 項——可考慮 --update-baseline 收緊基線）`);
