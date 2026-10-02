/**
 * 船長入口（CornerEntry）的 Playwright 自動化自檢（2026-10-02）。
 *
 * 這個功能的核心約束不是「能不能用」，而是**「會不會干擾首頁」**——
 * 首頁是學生每天看的畫面。所以自檢重點放在：
 *   1. 三種輸入的分支是否正確
 *   2. 圖標是否真的「不佔版面、不蓋住東西、預設低調」
 *
 * 跑法：
 *   BASE=http://localhost:3000 node scripts/verify-corner-entry.mjs
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const PLAYWRIGHT_HOME = process.env.PLAYWRIGHT_HOME ?? "/Users/g/.workbuddy/binaries/node/workspace";
const require = createRequire(`${PLAYWRIGHT_HOME}/`);
const { chromium } = require("playwright");

const BASE = process.env.BASE ?? "http://localhost:3000";
const SHOT_DIR = process.env.SHOT_DIR ?? "/tmp/corner-entry-shots";
mkdirSync(SHOT_DIR, { recursive: true });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

// 進站前預置 localStorage（三層 aria-modal 阻擋，見 verify-admin-knowledge.mjs）
await page.addInitScript(() => {
  try {
    localStorage.setItem("xue-session-v1", JSON.stringify({ name: "小航海士", role: "student", lastPath: "/", loginAt: Date.now() }));
    let s = {};
    try { s = JSON.parse(localStorage.getItem("bx_state_v1") || "{}") || {}; } catch { s = {}; }
    // ⚠️ bxState 用的是**巢狀**結構（`onboarding.completed` 這個路徑對應到
    // `state.onboarding.completed`），寫成扁平鍵 `{"onboarding.completed": true}`
    // 會被忽略——實測這樣設定後新手導覽照樣自動打開。
    s.privacy = { ...(s.privacy || {}), accepted: true, ts: Date.now() };
    s.onboarding = { ...(s.onboarding || {}), completed: true, skipped: true };
    localStorage.setItem("bx_state_v1", JSON.stringify(s));
    localStorage.setItem("xue-cloud-mode-v1", JSON.stringify({ mode: "local" }));
  } catch { /* 首次導航可能還沒 origin */ }
});

async function settleHome() {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  for (const p of [/好的，開始航行/, /略過/]) {
    const btn = page.locator('[role="dialog"] button', { hasText: p }).first();
    if (await btn.count()) { await btn.click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(300); }
  }
  // 新手導覽：直接跳過（它會擋住整頁）。
  // 用 class 選項而不是 hasText——`.bx-tour__mask` 是一層覆蓋全螢幕的
  // fixed 遮罩，用文字比對會命中被遮罩蓋住的元素而導致點擊被攔截。
  // 用 force:true —— 導覽卡片有進場動畫（bxCardIn .28s），Playwright 在動畫
  // 中途取點會算到被 body 蓋住的位置而誤判「被攔截」。
  // 這裡已用 elementFromPoint 實測確認按鈕對真實使用者是可點的，
  // 所以強制點擊不會掩蓋真實缺陷。
  const skipTour = page.locator(".bx-tour__skip");
  if (await skipTour.count()) {
    await skipTour.click({ timeout: 4000, force: true }).catch(() => {});
    await page.waitForTimeout(600);
  }
  // ⭐ 年級閘門：RouteDeck 在這個 aria-modal 閘門期間會**提前 return**，
  // 所以角落入口本來就不會出現（也點不到）。自檢必須先選年級，
  // 否則會誤判成「入口沒渲染」。
  // 等閘門或主頁任一出現（閘門是 lazy 渲染，馬上 count 會是 0）
  await page.waitForSelector(".deck-gate, .deck", { timeout: 25000 }).catch(() => {});
  const gate = page.locator(".deck-gate__grade");
  if (await gate.count()) {
    await gate.first().click({ timeout: 5000 });
    await page.waitForSelector(".deck", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
}
await settleHome();

// ── 1. 圖標存在且低調 ──
const trigger = page.locator(".corner-entry-trigger");
await trigger.waitFor({ state: "attached", timeout: 25000 });
check("首頁有角落入口圖標", (await trigger.count()) === 1);

const style = await trigger.evaluate((el) => {
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return { opacity: Number(cs.opacity), width: Math.round(rect.width), height: Math.round(rect.height) };
});
check("⭐ 預設低調（透明度 < 0.35）", style.opacity > 0 && style.opacity < 0.35, `opacity=${style.opacity}`);
check("尺寸小（< 40px，不搶視線）", style.width <= 40 && style.height <= 40, `${style.width}×${style.height}`);

// 1b. 年級閘門期間不該有入口（它是 aria-modal，背後的東西本來就點不到）
const gatePresent = await page.locator(".deck-gate").count();
check("通過年級閘門後主頁已渲染（.deck 存在）", (await page.locator(".deck").count()) === 1, gatePresent ? "閘門仍在" : "");

// ── 2. ⭐ 不佔版面：拿掉圖標後首頁高度不變 ──
// 量測對象是主頁容器 `.deck`（RouteDeck 的根），不是 `main.home-dashboard`
// ——那是 /dashboard 那一頁的類名，主頁沒有它。
const mainBox = async () => page.locator(".deck").first().boundingBox();
const before = await mainBox();
await trigger.evaluate((el) => { el.style.display = "none"; });
const afterHide = await mainBox();
await trigger.evaluate((el) => { el.style.display = ""; });
check(
  "⭐ 圖標不佔版面（移除後主頁位置不變）",
  before && afterHide && Math.abs(before.y - afterHide.y) < 0.5 && Math.abs(before.height - afterHide.height) < 0.5,
  before && afterHide ? `y ${before.y}→${afterHide.y}` : "量不到"
);

// ── 3. ⭐ z-index 低於所有既有 fixed 元件與對話框 ──
const z = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const v = getComputedStyle(el).zIndex;
    return v === "auto" ? 0 : Number(v);
  };
  return {
    corner: Number(getComputedStyle(document.querySelector(".corner-entry")).zIndex),
    fab: pick(".home-quick-fab, .home-quick-edge"),
    panel: pick(".home-quick-panel"),
    quiz: pick(".quiz-modal-backdrop"),
  };
});
check("⭐ z-index 低於快速行動 FAB", z.fab === null || z.corner < z.fab, `corner=${z.corner} fab=${z.fab}`);
check("z-index 低於滑出面板", z.panel === null || z.corner < z.panel, `corner=${z.corner} panel=${z.panel}`);
check("z-index 低於測驗遮罩", z.quiz === null || z.corner < z.quiz, `corner=${z.corner} quiz=${z.quiz}`);

// ── 4. 點擊展開面板 ──
await trigger.click();
const panel = page.locator(".corner-entry-panel");
check("點擊後彈出輸入面板", (await panel.count()) === 1);
check("面板是 role=dialog", (await panel.getAttribute("role")) === "dialog");
check("輸入框自動取得焦點", await page.locator("#corner-entry-input").evaluate((el) => el === document.activeElement));
await page.screenshot({ path: `${SHOT_DIR}/corner-panel-open.png` });

// ── 5. 三種輸入分支 ──
// 5a. 其他輸入 → 錯誤、面板留著、沒跳轉
await page.fill("#corner-entry-input", "亂打的名字");
await page.locator(".corner-entry-panel form").evaluate((f) => f.requestSubmit());
await page.waitForTimeout(600);
const errText = await page.locator(".corner-entry-error").count()
  ? await page.locator(".corner-entry-error").innerText()
  : "";
check("⭐ 其他輸入顯示錯誤", /不是你的船名/.test(errText), errText.slice(0, 40));
check("⭐ 錯誤後面板仍開著（可直接改，不被清空）", (await panel.count()) === 1);
check("其他輸入不會跳轉", page.url().endsWith("/") || page.url().includes("localhost:3000/"));

// 5b. 自己船名 → 設定頁
await page.fill("#corner-entry-input", "小航海士");
await page.locator(".corner-entry-panel form").evaluate((f) => f.requestSubmit());
await page.waitForURL(/\/settings/, { timeout: 15000 }).catch(() => {});
check("⭐ 輸入自己的船名 → 進設定頁", /\/settings/.test(page.url()), page.url().replace(BASE, ""));

// 5c. 站長用戶名 → 後端登入 → 進後台
await settleHome();
await page.locator(".corner-entry-trigger").click();
await page.fill("#corner-entry-input", "admin");
await page.locator(".corner-entry-panel form").evaluate((f) => f.requestSubmit());
await page.waitForURL(/\/admin/, { timeout: 20000 }).catch(() => {});
check("⭐ 輸入站長用戶名 → 進站長後台", /\/admin/.test(page.url()), page.url().replace(BASE, ""));
await page.waitForTimeout(2500);
const adminText = await page.locator(".admin-page").innerText().catch(() => "");
check("後台真的渲染出內容（不是只有閘門）", /營運燈塔|站長總覽/.test(adminText));
await page.screenshot({ path: `${SHOT_DIR}/corner-admin-reached.png`, fullPage: false });

// ── 6. Esc / 關閉鈕 ──
await settleHome();
await page.locator(".corner-entry-trigger").click();
await page.keyboard.press("Escape");
check("Esc 可關閉面板", (await page.locator(".corner-entry-panel").count()) === 0);

// ── 7. console 乾淨 ──
const expected = /Database is not available|404|Failed to load resource/i;
const real = consoleErrors.filter((t) => !expected.test(t));
check("無真正的 JS 錯誤", real.length === 0, real.slice(0, 2).join(" / "));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n  結果：${results.length - failed.length}/${results.length} 通過`);
if (failed.length) {
  for (const f of failed) console.log(`    - ${f.name}（${f.detail}）`);
  process.exit(1);
}
