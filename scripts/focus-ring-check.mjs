// focus ring 驗收：實測「聚焦後的計算樣式」與四主題下的視覺對比
// 用法: node scripts/focus-ring-check.mjs [SITE]
//
// 驗的不是靜態定義，而是瀏覽器最終算出來的 outline / box-shadow ——
// 因為規則間的特異度與先後順序可能覆蓋掉 token 定義（本次就發現
// .mc-mode-card:focus-visible 的 outline:none 被 3277 行的規則蓋掉）。
import wsPkg from "/Users/g/.dsh/profiles/desktop/node_modules/ws/index.js";
const { WebSocket } = wsPkg;
import http from "node:http";

const SITE = process.argv[2] || "http://127.0.0.1:5234";
const PORT = 9333;
const THEMES = [null, "festival", "exlibris", "sunny"];

const newPage = () =>
  new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: PORT, path: "/json/new?about:blank", method: "PUT" },
      (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => resolve(JSON.parse(d))); },
    );
    req.on("error", reject); req.end();
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const page = await newPage();
  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256e6 });
  let id = 0; const pending = new Map();
  ws.on("message", (raw) => {
    const m = JSON.parse(raw.toString());
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); }
  });
  const send = (method, params = {}) => new Promise((r, j) => {
    const mid = ++id; pending.set(mid, { resolve: r, reject: j });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  await new Promise((r) => (ws.on("open", r)));
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `try{localStorage.setItem('xue-session-v1',JSON.stringify({name:'視覺測試',role:'student',lastPath:null,loginAt:Date.now()}));localStorage.setItem('xue-guest-name-v1','視覺測試');}catch(e){}`,
  });

  const ROUTES = ["/features", "/settings", "/practice"];
  let rows = [];

  for (const route of ROUTES) {
    await send("Page.navigate", { url: SITE + route });
    await sleep(2600);

    for (const theme of THEMES) {
      const r = await send("Runtime.evaluate", {
        expression: `(() => {
          const t = ${JSON.stringify(theme)};
          if (t) document.documentElement.setAttribute('data-theme', t);
          else document.documentElement.removeAttribute('data-theme');
          void document.body.offsetHeight;

          // 找 .app-btn / .app-input / .theme-card 等帶 focus token 的可聚焦元素
          const pick = ['.app-btn', '.app-input', '.theme-card', '.casual-category-list button'];
          let target = null;
          for (const sel of pick) {
            const el = document.querySelector(sel);
            if (el) { target = { sel, el }; break; }
          }
          if (!target) return { route: ${JSON.stringify(route)}, found: false };

          const { sel, el } = target;
          el.focus();
          const cs = getComputedStyle(el);
          const out = {
            route: ${JSON.stringify(route)}, theme: t || 'default',
            sel, found: true,
            matchesFocus: el.matches(':focus-visible'),
            outline: cs.outlineWidth + ' ' + cs.outlineStyle + ' ' + cs.outlineColor,
            outlineOffset: cs.outlineOffset,
            boxShadow: cs.boxShadow,
          };
          el.blur();
          return out;
        })()`,
        returnByValue: true,
      });
      const v = r.result.value;
      if (!v || !v.found) { rows.push({ route, theme: theme || "default", found: false }); continue; }
      rows.push(v);
    }
  }

  console.log("═══ focus ring 計算樣式實測（瀏覽器最終算出的值）═══\n");
  const seen = new Set();
  for (const r of rows) {
    if (!r.found) { console.log(`  ${r.route} @ ${r.theme}: 找不到目標元素`); continue; }
    const key = r.sel + (r.theme === "default" ? "" : "@" + r.theme);
    const hasOuter = /\d+px solid/.test(r.outline) && !/^0px/.test(r.outline);
    const hasInner = /inset|-?\d+px -?\d+px 0px 2px|0px 0px 0px 2px/.test(r.boxShadow) || /0px 0px 0px 2px/.test(r.boxShadow);
    const ok = hasOuter && hasInner;
    if (seen.has(r.sel) === false || true) {
      console.log(`  ${ok ? "✓" : "✗"} ${r.sel.padEnd(34)} @ ${(r.theme || "default").padEnd(9)}`);
      if (r.theme === "default") {
        console.log(`      outline : ${r.outline}  offset=${r.outlineOffset}`);
        console.log(`      shadow  : ${r.boxShadow.slice(0, 110)}`);
      }
      seen.add(r.key);
    }
    if (!ok) r._fail = true;
  }

  const fails = rows.filter((r) => r.found && r._fail);
  console.log(`\n═══ 結果 ═══`);
  console.log(`  測 ${rows.filter((r) => r.found).length} 組，失敗 ${fails.length} 組`);
  process.exit(fails.length ? 1 : 0);
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
