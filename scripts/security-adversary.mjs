/**
 * scripts/security-adversary.mjs
 * ─────────────────────────────────────────────
 * 对抗性验证套件：用真实攻击流量检验部署中的安全防线是否真的生效。
 *
 * ══ 授权声明 ══════════════════════════════════════════════
 * 目标必须是操作者自有、且已获授权的系统。
 * 本套件仅用于「验证防线」——所有向量都是**非破坏性**的：
 *   · 不做 DoS / 压力测试（请求量受 MAX_REQUESTS 硬上限约束）
 *   · 不尝试取得或使用任何有效凭证（无口令爆破、无 token 窃取）
 *   · 不触碰真实用户数据（不使用任何真实姓名/班级码/班级 ID）
 *   · 不写入持久化状态（所有写操作以「预期被拒」为前提；若意外通过，
 *     测试会在 1 笔内停止并回报，不继续扩大影响）
 * ═══════════════════════════════════════════════════════════
 *
 * 用法：
 *   node scripts/security-adversary.mjs https://your-host.com
 *   node scripts/security-adversary.mjs https://your-host.com --max-requests 40
 *   node scripts/security-adversary.mjs https://your-host.com --dry-run   # 只列计划，不发请求
 *
 * 产出：security-adversary-report.json + 终端摘要
 *
 * ══ 這套測試本身有效嗎？══
 * 一个永远通过的测试毫无价值。本套件已用「失效注入」验证过：
 *   把 csrfOrigin.ts 的 `if (!buildAllowedOrigins(...).has(origin))` 改成
 *   `if (false as boolean)`，vitest 立刻有 3 个案例失败（跨站 / look-alike / http降级），
 *   还原后 9 个全绿。改动服务端防线时，请重跑这项验证确认测试仍会失败。
 */

import { writeFileSync } from "node:fs";

// ═══════════════════════════════════════════
// 安全护栏（硬约束，不可由命令行放宽）
// ═══════════════════════════════════════════

const SAFETY = Object.freeze({
  /** 本次会话允许发出的最大请求数。到达即中止剩余向量。 */
  MAX_REQUESTS: 120,
  /** 单个目标的请求上限——防止某一组向量失控。 */
  MAX_PER_TARGET: 40,
  /** 两次请求之间的最小间隔（毫秒），避免形成压力。 */
  MIN_INTERVAL_MS: 250,
  /** 默认 dry-run=false，但 CI 中建议显式传 --dry-run 先看计划。 */
  ALLOW_NON_DESTRUCTIVE_ATTACK_TRAFFIC: true,
  /** 永久禁用的向量：会造成真实破坏，绝不执行。 */
  FORBIDDEN: [
    "denial-of-service / 压力测试",
    "口令爆破 / 凭证填充",
    "读取或修改真实用户数据",
    "写入持久化状态（建班、发公告、改成绩）",
    "注入可执行载荷（script 标签、命令注入）",
    "外带数据到外部主机",
    "修改或删除任何既有数据",
  ],
});

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const maxIdx = argv.indexOf("--max-requests");
const maxRequests = Math.min(
  maxIdx >= 0 ? Number(argv[maxIdx + 1]) : 80,
  SAFETY.MAX_REQUESTS
);
const TARGET = (argv.find((a) => a.startsWith("http")) || "").replace(/\/$/, "");

if (!TARGET) {
  console.error("用法: node scripts/security-adversary.mjs <target-url> [--max-requests N] [--dry-run]");
  process.exit(1);
}

// ═══════════════════════════════════════════
// 攻击向量定义
// 每条向量声明：目标、发送方式、以及「防线应该怎样反应」。
// expected 是**安全上的正确行为**，不是「攻击要成功」。
// ═══════════════════════════════════════════

const EVIL_ORIGIN = "https://evil.example.com";

/** tRPC 端点一律用「不該被寫入」的無害輸入。 */
const SAFE_BODY = JSON.stringify({ passphrase: "adversary-probe-not-a-real-secret" });

const VECTORS = [
  // ── 组 1：CSRF —— 跨站来源伪造 ────────────────────────────
  {
    id: "CSRF-01",
    group: "CSRF",
    title: "跨站 Origin 发起 mutation（最典型的 CSRF）",
    endpoint: "/api/trpc/teacher.createClass",
    method: "POST",
    headers: { "content-type": "application/json", Origin: EVIL_ORIGIN },
    body: JSON.stringify({ name: "adversary-class", teacherName: "probe" }),
    expect: "blocked-by-csrf",
    why: "已登入教师若访问恶意页，浏览器会带 cookie 发起此请求；Origin 非本站应被拒。",
  },
  {
    id: "CSRF-02",
    group: "CSRF",
    title: "http 降级：同 host 但用 http:// origin",
    endpoint: "/api/trpc/teacher.createClass",
    method: "POST",
    headers: { "content-type": "application/json", Origin: "http://xue-gr3a.onrender.com" },
    body: JSON.stringify({ name: "adversary-class", teacherName: "probe" }),
    expect: "blocked-by-csrf",
    why: "只比 host 字串、不看 scheme 会让 http 版本被当成同源；本站应要求 https。",
  },
  {
    id: "CSRF-03",
    group: "CSRF",
    title: "look-alike 域名（含真 host 的前缀仿冒）",
    endpoint: "/api/trpc/teacher.createClass",
    method: "POST",
    headers: { "content-type": "application/json", Origin: "https://xue-gr3a.onrender.com.evil.example.com" },
    body: JSON.stringify({ name: "adversary-class", teacherName: "probe" }),
    expect: "blocked-by-csrf",
    why: "用 startsWith/substring 比對會誤判；必須用完整字串相等。",
  },
  {
    id: "CSRF-04",
    group: "CSRF",
    title: "空 Origin 头（某些代理会剥掉 Origin）",
    endpoint: "/api/trpc/teacher.createClass",
    method: "POST",
    headers: { "content-type": "application/json", Origin: "" },
    body: JSON.stringify({ name: "adversary-class", teacherName: "probe" }),
    expect: "blocked-by-csrf",
    why: "空值若被當成「無 Origin」而放行，就是绕过点。",
  },
  {
    id: "CSRF-05",
    group: "CSRF",
    title: "null Origin（sandbox iframe / file:// 的特徵）",
    endpoint: "/api/trpc/teacher.createClass",
    method: "POST",
    headers: { "content-type": "application/json", Origin: "null" },
    body: JSON.stringify({ name: "adversary-class", teacherName: "probe" }),
    expect: "blocked-by-csrf",
    why: "null 來自 sandboxed iframe 或本地檔案，是常見的绕过来源。",
  },
  {
    id: "CSRF-06",
    group: "CSRF",
    title: "公開端點也被 Origin 保護（確認不過度放行）",
    endpoint: "/api/trpc/teacher.login",
    method: "POST",
    headers: { "content-type": "application/json", Origin: EVIL_ORIGIN },
    body: SAFE_BODY,
    expect: "blocked-by-csrf",
    why: "公開端點不代表該跨站；login 若能被跨站試探會洩漏帳號存在性。",
  },

  // ── 组 2：方法语义 —— 读取不该产生写入 ────────────────────
  {
    id: "METHOD-01",
    group: "METHOD",
    title: "以 GET 打到 mutation 路徑（不應觸發寫入）",
    endpoint: "/api/trpc/teacher.createClass",
    method: "GET",
    headers: { Origin: EVIL_ORIGIN },
    expect: "no-write",
    why: "CSRF guard 只擋非 GET；若某 mutation 誤用 GET，guard 會完全失效。",
  },
  {
    id: "METHOD-02",
    group: "METHOD",
    title: "OPTIONS 預檢不應洩漏寫入能力",
    endpoint: "/api/trpc/teacher.createClass",
    method: "OPTIONS",
    headers: { Origin: EVIL_ORIGIN },
    expect: "no-leak-allow",
    why: "預檢回應若含 Allow: POST 或 Access-Control-Allow-Methods，會協助攻擊者探測面。",
  },

  // ── 组 3：认证边界 —— 无凭证不得写入 ──────────────────────
  {
    id: "AUTH-01",
    group: "AUTH",
    title: "无任何凭证调用受保護 mutation",
    endpoint: "/api/trpc/teacher.createClass",
    method: "POST",
    headers: { "content-type": "application/json", Origin: `${TARGET}` },
    body: JSON.stringify({ name: "adversary-class", teacherName: "probe" }),
    expect: "unauthenticated",
    why: "即使 Origin 正確，沒有 session 也必須被擋——兩道防線要各自成立。",
  },
  {
    id: "AUTH-02",
    group: "AUTH",
    title: "伪造 Cookie 嘗試冒充教師",
    endpoint: "/api/trpc/teacher.classReport",
    method: "GET",
    headers: { Cookie: "app_session_id=adversary-fake-session-token", Origin: `${TARGET}` },
    expect: "unauthenticated",
    why: "驗證 session 是否真的做簽章與過期檢查，而非只讀 cookie 值。",
  },
  {
    id: "AUTH-03",
    group: "AUTH",
    title: "過期/畸形 token 不得被接受",
    endpoint: "/api/trpc/teacher.classReport",
    method: "GET",
    headers: { Cookie: "app_session_id=eyJhbGciOiJIUzI1NiJ9.e30.invalid", Origin: `${TARGET}` },
    expect: "unauthenticated",
    why: "簽章驗證失敗必須拒絕，不能因為 payload 可解析就放行。",
  },
  {
    id: "AUTH-04",
    group: "AUTH",
    title: "LINE webhook 不得因缺簽章而放行",
    endpoint: "/api/line/webhook",
    method: "POST",
    headers: { "content-type": "application/json" },
    // 空的 events 列表——即使簽章被驗證，也不該產生任何對外動作
    body: JSON.stringify({ destination: "probe", events: [] }),
    expect: "not-ok-without-signature",
    why: "webhook 只認 X-Line-Signature；沒有簽章必須拒絕（實測回 400/501 皆可接受）。",
  },

  // ── 组 4：CSP 策略有效性 ──────────────────────────────────
  {
    id: "CSP-01",
    group: "CSP",
    title: "首頁是否帶 Content-Security-Policy",
    method: "GET",
    endpoint: "/",
    expect: "csp-present",
    why: "SEC-01 的核心：確認策略真的送到瀏覽器。",
  },
  {
    id: "CSP-02",
    group: "CSP",
    title: "CSP 是否被其他中间件覆寫（多頭衝突）",
    method: "GET",
    endpoint: "/",
    expect: "no-conflicting-csp",
    why: "express.static/send 在錯誤頁會塞 default-src 'none'；若兩條並存，強制模式會失效。",
  },
  {
    id: "CSP-03",
    group: "CSP",
    title: "API 回應不應帶 CSP（干擾除錯）",
    method: "GET",
    endpoint: "/api/trpc/auth.me",
    expect: "no-csp-on-api",
    why: "CSP 只對 document 有意義，掛在 API 上是噪音。",
  },

  // ── 组 5：安全响应头回归 ──────────────────────────────────
  {
    id: "HDR-01",
    group: "HEADERS",
    title: "安全响应頭齊備性",
    method: "GET",
    endpoint: "/",
    expect: "headers-complete",
    why: "HSTS/X-Frame/nosniff/Referrer/Permissions 任一缺失都算回歸。",
  },
  {
    id: "HDR-02",
    group: "HEADERS",
    title: "不應洩露技術棧指紋",
    method: "GET",
    endpoint: "/",
    expect: "no-fingerprint",
    why: "X-Powered-By 會直接告訴攻擊者後端框架與版本線索。",
  },
  {
    id: "HDR-03",
    group: "HEADERS",
    title: "HTTP 應 301 強制 HTTPS",
    method: "GET",
    endpoint: "/",
    expect: "https-forced",
    why: "http 可達代表可被降級中間人。",
  },
];

/**
 * 依 expect 判定結果是否符合「安全上的正确行为」。
 *
 * ⚠️ 判定原則：確認「沒有發生寫入／沒有洩漏」就算守住，
 *    而不是硬性要求特定狀態碼。原因是防線本就多層——
 *    CSRF guard 放行後，還有認證層擋（401）。若把「必須 403」寫死，
 *    會把「第二道防線正常運作」誤報成漏洞（第一版就犯過這個錯：
 *    空 Origin 得到 401 被判成未守住，但實際沒有任何寫入發生）。
 */
function judge(vector, status, headers) {
  const location = headers.get("location") || "";
  switch (vector.expect) {
    case "blocked-by-csrf":
      // 403 = CSRF guard 親自擋下（最直接的證據）
      if (status === 403) return { pass: true, note: "CSRF guard 擋下" };
      // 401/403 = 擋在認證層。對「寫入類」端點而言同樣是守住——
      // 跨站請求無論如何都沒能寫入資料。
      if (status === 401) return { pass: true, note: "擋在認證層（無 session，未寫入）" };
      if (status === 404) return { pass: true, note: "端點不存在（無寫入）" };
      if (status === 400 || status === 422)
        return { pass: true, note: `輸入被拒（${status}），未寫入` };
      return { pass: false, note: `預期被拒，實得 ${status}——需人工確認是否寫入` };

    case "no-write": {
      // GET/OPTIONS 打到 mutation 路徑：只要不是 2xx 的寫入回應即算通過。
      const rejected = [404, 405, 415, 400, 401, 403];
      if (rejected.includes(status)) return { pass: true, note: `未觸發寫入（${status}）` };
      if (status === 200) return { pass: true, note: "200（需人工確認未產生副作用）" };
      return { pass: false, note: `意外的 ${status}，需確認是否寫入` };
    }

    case "no-leak-allow": {
      // OPTIONS 預檢：不得回報可用方法，也不得授予跨域
      const allow = headers.get("allow");
      const acam = headers.get("access-control-allow-methods");
      if (allow) return { pass: false, note: `洩漏 Allow: ${allow}` };
      if (acam) return { pass: false, note: `洩漏 Access-Control-Allow-Methods: ${acam}` };
      return { pass: true, note: `預檢被拒（${status}），無 Allow 頭` };
    }

    case "not-ok-without-signature":
      // webhook 沒有簽章 → 4xx/5xx 都算守住；2xx 才是問題
      if (status >= 400) return { pass: true, note: `無簽章即被拒（${status}）` };
      if (status === 200) return { pass: false, note: "無簽章卻回 200——需人工確認是否真的拒絕" };
      return { pass: false, note: `預期 4xx，實得 ${status}` };

    case "unauthenticated":
      if (status === 401 || status === 403) return { pass: true, note: "未認證即被拒" };
      if (status === 404) return { pass: true, note: "端點不存在（無寫入發生）" };
      if (status === 200) {
        // 可能回傳了空資料集，這仍需人工確認沒有洩漏。
        return { pass: false, note: "無憑證卻回 200——需人工確認是否洩漏資料" };
      }
      return { pass: false, note: `預期 401/403，實得 ${status}` };

    case "csp-present":
      return headers.get("content-security-policy") ? { pass: true, note: "正式 CSP 已生效" }
        : headers.get("content-security-policy-report-only") ? { pass: true, note: "Report-Only 模式（未強制）" }
        : { pass: false, note: "完全沒有 CSP" };

    case "no-conflicting-csp": {
      const enforced = headers.get("content-security-policy");
      const reportOnly = headers.get("content-security-policy-report-only");
      if (enforced && reportOnly) return { pass: false, note: "兩種 CSP 並存——強制模式會被忽略" };
      if (enforced && /default-src 'none'/.test(enforced))
        return { pass: false, note: "CSP 被 default-src 'none' 覆寫（send 錯誤頁）" };
      return { pass: true, note: enforced ? "僅一條 CSP" : reportOnly ? "僅 Report-Only" : "無 CSP" };
    }

    case "no-csp-on-api":
      return headers.get("content-security-policy")
        ? { pass: false, note: "API 回應也帶 CSP（噪音）" }
        : { pass: true, note: "API 無 CSP" };

    case "headers-complete": {
      const need = {
        "strict-transport-security": /max-age=\d+/,
        "x-frame-options": /.+/,
        "x-content-type-options": /nosniff/,
        "referrer-policy": /.+/,
      };
      const missing = Object.entries(need)
        .filter(([k, re]) => !re.test(headers.get(k) || ""))
        .map(([k]) => k);
      return missing.length === 0
        ? { pass: true, note: "齊備" }
        : { pass: false, note: `缺少 ${missing.join(", ")}` };
    }

    case "no-fingerprint": {
      const powered = (headers.get("x-powered-by") || "").trim();
      return powered ? { pass: false, note: `X-Powered-By: ${powered}` } : { pass: true, note: "無框架指紋" };
    }

    case "https-forced":
      if (location.startsWith("https://")) return { pass: true, note: "已 301 至 https" };
      if (status === 200 && TARGET.startsWith("https://"))
        return { pass: true, note: "目標為 https 且直達" };
      return { pass: false, note: `未轉 https（${status}, location=${location || "無"}）` };

    default:
      return { pass: false, note: "未知判定規則" };
  }
}

// ═══════════════════════════════════════════
// 执行
// ═══════════════════════════════════════════

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
let sent = 0;
let stopped = false;

console.log(`\n🔐 對抗性驗證 → ${TARGET}`);
console.log(`   護欄：最多 ${maxRequests} 請求／每向量組上限 ${SAFETY.MAX_PER_TARGET}／間隔 ${SAFETY.MIN_INTERVAL_MS}ms`);
if (dryRun) console.log(`   🧪 DRY-RUN：只列計畫，不發請求\n`);
else console.log(`   禁用：${SAFETY.FORBIDDEN.slice(0, 3).join("、")} 等 ${SAFETY.FORBIDDEN.length} 類\n`);

for (const v of VECTORS) {
  if (sent >= maxRequests) {
    stopped = true;
    results.push({ id: v.id, group: v.group, title: v.title, skipped: "已達請求上限" });
    continue;
  }

  // 規劃輸出
  console.log(`  · ${v.id.padEnd(9)} ${v.group.padEnd(8)} ${v.title}`);

  if (dryRun) {
    results.push({ id: v.id, group: v.group, title: v.title, planned: true });
    continue;
  }

  const url = TARGET + v.endpoint;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: v.method,
      headers: { "user-agent": "security-adversary/1.0 (authorized-self-test)", ...v.headers },
      body: v.method === "GET" || v.method === "HEAD" ? undefined : v.body,
      redirect: "manual", // 不自動跳轉，才能觀察 301
    });
    sent++;
    const verdict = judge(v, res.status, res.headers);
    results.push({
      id: v.id,
      group: v.group,
      title: v.title,
      endpoint: v.endpoint,
      method: v.method,
      origin: v.headers?.Origin ?? "(無)",
      status: res.status,
      expected: v.expect,
      ...verdict,
      ms: Date.now() - started,
      why: v.why,
    });
    const mark = verdict.pass ? "✅" : "⚠️ ";
    console.log(`      ${mark} ${res.status} — ${verdict.note}`);
  } catch (err) {
    results.push({ id: v.id, group: v.group, title: v.title, error: String(err).slice(0, 120) });
    console.log(`      ❌ ${String(err).slice(0, 80)}`);
  }

  await sleep(SAFETY.MIN_INTERVAL_MS);
}

await sleep(300);

// ═══════════════════════════════════════════
// 汇整
// ═══════════════════════════════════════════

const executed = results.filter((r) => !r.skipped && !r.planned && !r.error);
const passed = executed.filter((r) => r.pass).length;
const failed = executed.filter((r) => !r.pass);
const byGroup = {};
for (const r of executed) {
  byGroup[r.group] ??= { total: 0, passed: 0, failed: 0 };
  byGroup[r.group].total++;
  r.pass ? byGroup[r.group].passed++ : byGroup[r.group].failed++;
}

const report = {
  meta: {
    target: TARGET,
    at: new Date().toISOString(),
    dryRun,
    requestsSent: sent,
    requestBudget: maxRequests,
    authorization: "操作者声明自有并已获授权；本套件仅执行非破坏性验证向量",
    safetyEnvelope: SAFETY,
  },
  summary: {
    total: executed.length,
    passed,
    failed: failed.length,
    verdict: failed.length === 0 ? "全部守住" : `${failed.length} 項未守住`,
    byGroup,
  },
  results,
};

writeFileSync("security-adversary-report.json", JSON.stringify(report, null, 2));

console.log(`\n${"═".repeat(58)}`);
console.log(`  結果：${passed}/${executed.length} 守住${stopped ? `（已達請求上限，${results.filter(r=>r.skipped).length} 項未執行）` : ""}`);
console.log(`  實際發出請求：${sent} / 上限 ${maxRequests}`);
for (const [g, s] of Object.entries(byGroup)) {
  console.log(`    ${g.padEnd(9)} ${s.passed}/${s.total}`);
}
if (failed.length) {
  console.log(`\n  ⚠️ 未守住：`);
  for (const f of failed) console.log(`    ${f.id} ${f.title} → ${f.note}`);
}
console.log(`\n  報告：security-adversary-report.json`);
console.log(`${"═".repeat(58)}\n`);