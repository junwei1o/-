// 單一路由的溢出診斷：重複取樣，區分「穩定溢出」與「動畫中間態」
// 用法: node scripts/ui-overflow.mjs <route> <width> [SITE]
import wsPkg from "/Users/g/.dsh/profiles/desktop/node_modules/ws/index.js";
const { WebSocket } = wsPkg;
import http from "node:http";

const ROUTE = process.argv[2] || "/";
const WIDTH = Number(process.argv[3] || 1280);
const SITE = process.argv[4] || "http://127.0.0.1:5234";
const PORT = 9333;

const httpGet = (url) =>
  new Promise((res, rej) => {
    http
      .get(url, (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => res(d));
      })
      .on("error", rej);
  });

function connect() {
  return new Promise((resolve, reject) => {
    httpGet(`http://127.0.0.1:${PORT}/json/list`).then((raw) => {
      const list = JSON.parse(raw);
      const page = list.find((t) => t.type === "page");
      const ws = new WebSocket(page.webSocketDebuggerUrl, {
        perMessageDeflate: false,
        maxPayload: 256 * 1024 * 1024,
      });
      let id = 0;
      const pending = new Map();
      ws.on("message", (raw2) => {
        const msg = JSON.parse(raw2.toString());
        if (msg.id && pending.has(msg.id)) {
          const { resolve: r, reject: j } = pending.get(msg.id);
          pending.delete(msg.id);
          msg.error ? j(new Error(msg.error.message)) : r(msg.result);
        }
      });
      ws.on("open", () =>
        resolve({
          send: (method, params = {}) =>
            new Promise((r, j) => {
              const mid = ++id;
              pending.set(mid, { resolve: r, reject: j });
              ws.send(JSON.stringify({ id: mid, method, params }));
            }),
          close: () => ws.close(),
        }),
      );
      ws.on("error", reject);
    }, reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const send = (await connect()).send;
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `try{localStorage.setItem('xue-session-v1',JSON.stringify({name:'視覺測試',role:'student',lastPath:null,loginAt:Date.now()}));localStorage.setItem('xue-guest-name-v1','視覺測試');}catch(e){}`,
  });
  await send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: 900,
    deviceScaleFactor: 1,
    mobile: WIDTH < 768,
  });

  await send("Page.navigate", { url: SITE + ROUTE });
  await sleep(3000);

  console.log(`=== ${ROUTE} @ ${WIDTH}px ===`);
  for (let i = 1; i <= 5; i++) {
    const r = await send("Runtime.evaluate", {
      expression: `(() => {
        const de = document.documentElement;
        const of = de.scrollWidth - de.clientWidth;
        const list = [];
        if (of > 1) {
          for (const el of document.querySelectorAll('body *')) {
            const b = el.getBoundingClientRect();
            if (b.right > de.clientWidth + 1) {
              const cs = getComputedStyle(el);
              list.push({
                sel: el.tagName.toLowerCase() + '.' + String(el.className||'').split(' ').slice(0,3).join('.'),
                right: Math.round(b.right),
                w: Math.round(b.width),
                pos: cs.position, transform: cs.transform.slice(0,30),
                opacity: cs.opacity,
              });
            }
            if (list.length >= 6) break;
          }
        }
        return { of, list };
      })()`,
      returnByValue: true,
    });
    const v = r.result.value;
    console.log(`\n[取樣 ${i}] overflow=${v.of}px`);
    for (const x of v.list) console.log("   ", JSON.stringify(x));
    await sleep(700);
  }
  await send("Page.close").catch(() => {});
  process.exit(0);
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
