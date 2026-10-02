/**
 * 站長後台「知識與文件」的 Playwright 自動化自檢（2026-10-02）。
 *
 * 為什麼用獨立腳本而不是加 `@playwright/test` 進專案：
 * 本專案部署走 `pnpm install --frozen-lockfile`，`pnpm add` 會改 lockfile
 * → 直接讓部署失敗。Playwright 裝在 WorkBuddy 的隔離 workspace，
 * 專案本身零新增依賴。
 *
 * 跑法：
 *   BASE=http://localhost:3000 PASSPHRASE=local-admin \
 *   node scripts/verify-admin-knowledge.mjs
 *
 * 解析 playwright 的方式：用 `createRequire` 指向隔離 workspace。
 * ESM **不遵守 NODE_PATH**，所以不能只設環境變數——必須從一個
 * 「下面有 playwright 的目錄」建立 require。
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const PLAYWRIGHT_HOME =
  process.env.PLAYWRIGHT_HOME ?? "/Users/g/.workbuddy/binaries/node/workspace";
const require = createRequire(`${PLAYWRIGHT_HOME}/`);
const { chromium } = require("playwright");

const BASE = process.env.BASE ?? "http://localhost:3000";
const PASSPHRASE = process.env.PASSPHRASE ?? "local-admin";
const SHOT_DIR = process.env.SHOT_DIR ?? "/tmp/admin-kb-shots";
mkdirSync(SHOT_DIR, { recursive: true });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(String(error)));

// ── 1. 進站前先預置 localStorage ──
// 隱私橫幅是 aria-modal 的 dialog，會攔截所有點擊，而且**每次導航都會再出現**
// （它讀 bx_state_v1 的 privacy.accepted ＋ privacy.ts）。
// 用 addInitScript 在「任何頁面腳本執行之前」寫好，比事後點掉可靠——
// 寫晚了 React 已經 mount，`show` 狀態就已經是 true 了。
await page.addInitScript(() => {
  try {
    localStorage.setItem(
      "xue-session-v1",
      JSON.stringify({ name: "QA站長", role: "student", lastPath: "/", loginAt: Date.now() })
    );
    let state = {};
    try {
      state = JSON.parse(localStorage.getItem("bx_state_v1") || "{}") || {};
    } catch {
      state = {};
    }
    state["privacy.accepted"] = true;
    state["privacy.ts"] = Date.now();
    // 新手導覽：隱私決定後會自動開啟，同樣是 aria-modal，會攔截點擊
    state["onboarding.completed"] = true;
    state["onboarding.skipped"] = true;
    localStorage.setItem("bx_state_v1", JSON.stringify(state));
    // 雲端模式選擇（xue-cloud-mode-v1）：沒選過就會彈「選擇航行方式」對話框，
    // 也是 aria-modal，會攔截點擊。QA 用本機模式即可。
    localStorage.setItem("xue-cloud-mode-v1", JSON.stringify({ mode: "local" }));
  } catch {
    /* 首次導航可能還沒有 origin，忽略；下一次 initScript 會再試 */
  }
});

await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });

/** 關掉可能蓋住頁面的 modal（隱私橫幅／新手導覽）。 */
async function dismissOverlays() {
  for (const pattern of [/好的，開始航行/, /略過[，,]?/, /跳過導覽/, /^\s*跳過\s*$/]) {
    const btn = page.locator('[role="dialog"] button', { hasText: pattern }).first();
    if (await btn.count()) {
      await btn.click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
  }
}
await dismissOverlays();

// ── 2. 進 /admin 並登入 ──
await page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
await dismissOverlays();
await page.waitForSelector("#admin-passphrase", { timeout: 20000 });
check("後台登入閘出現（密語已設定）", true);

await page.fill("#admin-passphrase", PASSPHRASE);
await page.locator("#admin-passphrase").evaluate((el) => el.closest("form")?.querySelector("button")?.click());
await page.waitForSelector("#admin-passphrase", { state: "detached", timeout: 25000 });
check("站長登入成功（登入閘消失）", true);

await page.waitForSelector(".admin-page", { timeout: 20000 });

// ── 3. 分組與模組齊全 ──
const headings = await page.locator(".admin-page h2, .admin-page h3").allInnerTexts();
const groups = ["營運與資源", "內容與題庫", "成本與用量", "存取與角色", "維護工具", "系統與部署", "知識與文件"];
const missingGroups = groups.filter((g) => !headings.includes(g));
check("七個分組都渲染", missingGroups.length === 0, missingGroups.length ? `缺：${missingGroups.join("、")}` : `${groups.length} 組`);

const modules = ["專案速覽", "知識文件中心", "全站資源監控", "安全防線", "維運操作"];
const missingModules = modules.filter((m) => !headings.includes(m));
check("關鍵模組都渲染", missingModules.length === 0, missingModules.length ? `缺：${missingModules.join("、")}` : `${modules.length} 個`);

const knowledgeIdx = headings.indexOf("知識與文件");
const systemIdx = headings.indexOf("系統與部署");
check("知識與文件排在巡檢動線之後", knowledgeIdx > systemIdx, `知識=${knowledgeIdx} 系統=${systemIdx}`);

// ── 4. 專案速覽：關鍵資訊要一眼看到 ──
const mapText = await page.locator(".admin-page").innerText();
const keyFacts = [
  "/Users/g/Documents/trae_projects/hdmx",
  "xue-gr3a.onrender.com",
  "督學台 /teacher",
  "後台 /admin",
  "docs/knowledge-base/05-踩坑與陷阱.md",
];
const missingFacts = keyFacts.filter((f) => !mapText.includes(f));
check("專案速覽含關鍵路徑與角色入口", missingFacts.length === 0, missingFacts.length ? `缺：${missingFacts.join("、")}` : `${keyFacts.length} 項`);

// ── 5. 知識文件中心：清單有真實檔案 ──
const docButtons = page.locator(".admin-doc-head");
// 等清單真的渲染出來——索引是異步取回來的，數太快會拿到 0
await docButtons.first().waitFor({ state: "visible", timeout: 25000 });
const docCount = await docButtons.count();
check("文件清單有內容", docCount > 10, `${docCount} 份`);

const kbCount = await page.locator(".admin-doc-tag.is-kb").count();
check("知識庫文件分類存在", kbCount >= 5, `${kbCount} 份知識庫`);

// ── 6. 搜尋篩選真的有效 ──
await page.fill("#admin-doc-keyword", "踩坑");
await page.waitForTimeout(400);
const afterSearch = await docButtons.count();
check("搜尋有篩選效果", afterSearch < docCount && afterSearch > 0, `${docCount} → ${afterSearch}`);

// ── 7. 展開文件，markdown 真的被渲染（不是原始文字）──
async function openDoc(namePattern) {
  await page.locator(".admin-doc-head", { hasText: namePattern }).first().click();
  await page.waitForSelector(".admin-doc-scroll .admin-md", { timeout: 25000 });
  await page.waitForTimeout(250);
  return page.locator(".admin-doc-scroll .admin-md").last();
}

// 05 是「症狀 → 根因 → 解法」：純標題 + 清單 + 行內格式
let md = await openDoc("踩坑與陷阱");
let mdText = await md.innerText();
check("展開後渲染出 markdown 內容", mdText.length > 80, `${mdText.length} 字`);
check("標題被渲染成 h3（不是文字）", (await md.locator("h3").count()) > 0);
check("清單被渲染成 li", (await md.locator("li").count()) > 0);

/**
 * 斷言「markdown 語法沒有漏出成原始文字」時，**必須排除 code 元素**。
 * 05 文件正好在講「`**粗體**` 在 JSX 裡會原樣顯示」，
 * 所以反引號裡本來就有 `**`——那是正確行為，不是洩漏。
 */
const outsideCode = await md.evaluate((el) => {
  const clone = el.cloneNode(true);
  clone.querySelectorAll("code, pre").forEach((n) => n.remove());
  return clone.textContent ?? "";
});
const leaks = [];
if (outsideCode.includes("**")) leaks.push("**");
if (outsideCode.includes("|---")) leaks.push("|---");
if (outsideCode.includes("](")) leaks.push("](");
if (outsideCode.includes("##")) leaks.push("##");
check("⭐ markdown 語法沒有漏出成原始文字（code 區段除外）", leaks.length === 0, leaks.join("、"));
check("沒有把 markdown 當 HTML 注入（不該出現 script 元素）", (await md.locator("script").count()) === 0);

// 01 確實含表格——另外驗一次表格渲染
// 注意：上一步的搜尋把清單篩成 1 份，要先清掉才找得到第二份文件
await page.fill("#admin-doc-keyword", "");
await page.waitForTimeout(400);
md = await openDoc("專案總覽");
check("表格被渲染成 table（非原始文字）", (await md.locator("table").count()) > 0, `${await md.locator("table").count()} 個`);

// ── 8. 截圖（給人看，也給我自己日後比對）──
const kbCard = page.locator(".admin-card", { has: page.locator("h3", { hasText: "知識文件中心" }) }).first();
await kbCard.scrollIntoViewIfNeeded();
await page.screenshot({ path: `${SHOT_DIR}/knowledge-expanded.png` });
await page.screenshot({ path: `${SHOT_DIR}/admin-full.png`, fullPage: true });

// ── 9. console 乾淨 ──
// 本機沒有 DATABASE_URL，`admin.siteStats` 必然報「Database is not available」——
// 那是**預期的降級行為**（模組會顯示錯誤態），不是缺陷。所以要把它分類出來，
// 只對「真正的 JS 錯誤」與「知識庫相關錯誤」設門檻。
const EXPECTED_LOCAL = [
  /Database is not available/i,
  /Failed to load resource.*404/,
];
const isExpected = (text) => EXPECTED_LOCAL.some((re) => re.test(text));
const realErrors = consoleErrors.filter((text) => !isExpected(text));
const expectedErrors = consoleErrors.filter(isExpected);

check("無真正的 JS／知識庫錯誤", realErrors.length === 0, realErrors.slice(0, 2).join(" / "));
if (expectedErrors.length) {
  console.log(`     ℹ️  本機預期錯誤 ${expectedErrors.length} 則（無 DATABASE_URL 造成，非缺陷）`);
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n  結果：${results.length - failed.length}/${results.length} 通過`);
if (failed.length) {
  console.log("  失敗：");
  for (const f of failed) console.log(`    - ${f.name}（${f.detail}）`);
  process.exit(1);
}
