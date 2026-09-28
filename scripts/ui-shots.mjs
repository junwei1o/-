// UI 視覺基線/回歸截圖器
// 用法: node scripts/ui-shots.mjs <輸出子目錄> [SITE]
// 例:   node scripts/ui-shots.mjs before http://127.0.0.1:5233
//
// 在 375 / 768 / 1280 三檔寬度對主要路由截圖 + 收集版面度量，
// 供斷點統一與字級系統改動前後比對。
import wsPkg from "/Users/g/.dsh/profiles/desktop/node_modules/ws/index.js";
const { WebSocket } = wsPkg;
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import http from "node:http";

const TAG = process.argv[2] || "before";
const SITE = process.argv[3] || "http://127.0.0.1:5233";
const PORT = 9333;
const OUT = path.resolve("shots-ui", TAG);

const ROUTES = [
  "/", "/map", "/practice", "/quiz-room", "/matching",
  "/wrong-answers", "/review-hub", "/answer-board", "/learning",
  "/learning-insights", "/wisdom", "/principles", "/safety",
  "/astronomy", "/observatory", "/regions/taiwan", "/expedition",
  "/badges", "/camp", "/class", "/teacher", "/community",
  "/features", "/settings", "/graduation",
];

const VIEWPORTS = [
  { name: "375", width: 375, height: 812, mobile: true },
  { name: "768", width: 768, height: 1024, mobile: true },
  { name: "1280", width: 1280, height: 900, mobile: false },
];

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

// 每次執行都自建一個 page target，避免依賴既有分頁的生命週期
function newPageTarget() {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: PORT, path: "/json/new?about:blank", method: "PUT" },
      (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => resolve(JSON.parse(d)));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function connect() {
  return new Promise((resolve, reject) => {
    newPageTarget().then((page) => {
      const ws = new WebSocket(page.webSocketDebuggerUrl, {
        perMessageDeflate: false,
        maxPayload: 256 * 1024 * 1024,
      });
      let id = 0;
      const pending = new Map();
      ws.on("message", (raw) => {
        const msg = JSON.parse(raw.toString());
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
          dispose: () => {
            ws.close();
            const r = http.request(
              { host: "127.0.0.1", port: PORT, path: `/json/close/${page.id}`, method: "GET" },
              () => {},
            );
            r.on("error", () => {});
            r.end();
          },
        }),
      );
      ws.on("error", reject);
    }, reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await mkdir(OUT, { recursive: true });
  const cdp = await connect();
  const send = cdp.send;
  await send("Page.enable");
  await send("Runtime.enable");

  const report = [];

  // 繞過 AuthGate 登入閘：注入合法 session，否則所有路由都只渲染登入卡（txt≈112）。
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      try {
        localStorage.setItem('xue-session-v1', JSON.stringify({
          name: '視覺測試', role: 'student', lastPath: null, loginAt: Date.now(),
        }));
        localStorage.setItem('xue-guest-name-v1', '視覺測試');
      } catch (e) {}
    `,
  });

  for (const vp of VIEWPORTS) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile,
    });

    for (const route of ROUTES) {
      const url = SITE + route;
      let metrics = null;
      let errors = [];
      try {
        await send("Page.navigate", { url });
        await sleep(2200); // 等 SPA 路由與字體/樣式收斂

        const r = await send("Runtime.evaluate", {
          expression: `(() => {
            const de = document.documentElement;
            const overflow = de.scrollWidth - de.clientWidth;
            // 找出造成水平溢出的元素（若可歸因）
            const offenders = [];
            if (overflow > 1) {
              for (const el of document.querySelectorAll('body *')) {
                const b = el.getBoundingClientRect();
                if (b.right > de.clientWidth + 1 || b.left < -1) {
                  offenders.push({
                    tag: el.tagName.toLowerCase(),
                    cls: (el.className && String(el.className).slice(0,60)) || '',
                    left: Math.round(b.left), right: Math.round(b.right),
                  });
                }
                if (offenders.length >= 5) break;
              }
            }
            // 字級分佈（實際算繪值）
            const sizes = {};
            for (const el of document.querySelectorAll('body *')) {
              if (!el.childElementCount) {
                const fs = Math.round(parseFloat(getComputedStyle(el).fontSize));
                sizes[fs] = (sizes[fs] || 0) + 1;
              }
            }
            return {
              title: document.title,
              textLen: (document.body.innerText || '').length,
              overflowPx: overflow,
              offenders,
              fontSizes: sizes,
              h1: [...document.querySelectorAll('h1')].map(h => (h.innerText||'').trim().slice(0,40)),
            };
          })()`,
          returnByValue: true,
        });
        metrics = r.result.value;
      } catch (e) {
        errors.push(String(e.message || e));
      }

      const slug = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "_");
      const file = path.join(OUT, `${vp.name}-${slug}.png`);
      try {
        const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        await writeFile(file, Buffer.from(shot.data, "base64"));
      } catch (e) {
        errors.push("screenshot: " + (e.message || e));
      }

      report.push({ viewport: vp.name, route, ...metrics, errors });
      process.stdout.write(
        `${metrics?.overflowPx > 1 ? "⚠" : "✓"} ${vp.name} ${route} ` +
          `txt=${metrics?.textLen ?? 0} overflow=${metrics?.overflowPx ?? "?"}\n`,
      );
    }
  }

  await writeFile(path.join(OUT, "metrics.json"), JSON.stringify(report, null, 2));
  cdp.dispose();

  // 摘要
  const bad = report.filter((r) => (r.overflowPx ?? 0) > 1 || (r.textLen ?? 0) < 200);
  console.log(`\n=== 摘要 (${TAG}) ===`);
  console.log(`總路由數: ${report.length}`);
  console.log(`水平溢出: ${report.filter((r) => (r.overflowPx ?? 0) > 1).length}`);
  console.log(`內容過少(<200字): ${report.filter((r) => (r.textLen ?? 0) < 200).length}`);
  if (bad.length) {
    console.log("\n需檢視:");
    for (const b of bad) console.log(`  ${b.viewport} ${b.route} overflow=${b.overflowPx} txt=${b.textLen}`);
  }
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
