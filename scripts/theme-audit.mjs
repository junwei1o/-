// 主題切換實測：對同一頁面在 4 個 data-theme 下取樣，量化「哪些元素沒有跟著換色」
// 用法: node scripts/theme-audit.mjs [SITE]
import wsPkg from "/Users/g/.dsh/profiles/desktop/node_modules/ws/index.js";
const { WebSocket } = wsPkg;
import http from "node:http";

const SITE = process.argv[2] || "http://127.0.0.1:5234";
const PORT = 9333;
const THEMES = ["", "festival", "exlibris", "sunny"];
const ROUTES = ["/", "/features", "/observatory", "/principles", "/settings"];

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

  for (const route of ROUTES) {
    await send("Page.navigate", { url: SITE + route });
    await sleep(2500);

    const snaps = {};
    for (const th of THEMES) {
      const r = await send("Runtime.evaluate", {
        expression: `(() => {
          const t = ${JSON.stringify(th)};
          if (t) document.documentElement.setAttribute('data-theme', t);
          else document.documentElement.removeAttribute('data-theme');
          // 強制重繪
          void document.body.offsetHeight;
          const cs = getComputedStyle(document.documentElement);
          const vars = {};
          for (const k of ['--paper','--white','--ink','--tidal','--coral','--moss','--yellow','--line','--muted'])
            vars[k] = cs.getPropertyValue(k).trim();
          // 取一批代表性元素的實際算繪色
          const pick = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const s = getComputedStyle(el);
            return s.color + '|' + s.backgroundColor + '|' + s.borderTopColor;
          };
          return {
            vars,
            body: getComputedStyle(document.body).backgroundColor,
            color: getComputedStyle(document.body).color,
            samples: {
              h1: pick('h1'), p: pick('main p, p'), btn: pick('button'),
              card: pick('[class*="card"]'), nav: pick('nav, header'),
            },
          };
        })()`,
        returnByValue: true,
      });
      snaps[th || "default"] = r.result.value;
    }

    console.log(`\n=== ${route} ===`);
    const base = snaps["default"];
    for (const th of THEMES) {
      const s = snaps[th || "default"];
      const t = th || "default";
      console.log(`  [${t.padEnd(9)}] body bg=${s.body}  text=${s.color}`);
      console.log(`              ${t === "default" ? "" : "Δ"}paper=${s.vars["--paper"]}  tidal=${s.vars["--tidal"]}  ink=${s.vars["--ink"]}`);
    }
    // 比較哪些東西在四個主題下完全不變（=沒被 token 化的元素）
    const alwaysSame = [];
    for (const key of Object.keys(base.samples)) {
      const vals = THEMES.map((t) => snaps[t || "default"].samples[key]);
      if (vals.every((v) => v === vals[0])) alwaysSame.push(key);
    }
    if (alwaysSame.length) {
      console.log(`  ⚠ 四主題下完全不變的元素: ${alwaysSame.join(", ")}  → 這些沒吃到 token，換主題不會變`);
    }
  }
  ws.close();
  process.exit(0);
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
