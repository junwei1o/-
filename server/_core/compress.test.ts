/**
 * httpCompression 集成測試：起真實 express + 原生 http 請求驗證。
 * 用 node:http 而非 fetch——undici fetch 會自動解壓回應，拿不到原始
 * 壓縮位元組，無法驗證「內容真的是壓縮格式」。
 */

import { describe, expect, it, afterAll } from "vitest";
import express from "express";
import { httpCompression } from "./compress";
import zlib from "node:zlib";
import http from "node:http";
import { Readable } from "node:stream";

const app = express();
app.use(httpCompression);

// 大 JSON（>860B）——tRPC / API 場景
const BIG = { items: Array.from({ length: 200 }, (_, i) => ({ id: i, text: `題目敘述-${i}-${"字".repeat(20)}` })) };
app.get("/big-json", (_req, res) => {
  res.json(BIG);
});
// 小回應——不壓
app.get("/small", (_req, res) => {
  res.type("application/json").send('{"ok":true}');
});
// 已是壓縮格式——透傳
app.get("/zip", (_req, res) => {
  res.type("application/zip").send(Buffer.alloc(2048, 1));
});
// ⭐ 真串流回應（模擬 /api/backup 的 archive.pipe(res)）
// 這條路徑的 header 在資料開始流動時**早就送出了**，
// 中介層若還去改 Content-Encoding 就會拋 ERR_HTTP_HEADERS_SENT 讓 process 崩。
// 一定要夠大才會真的把 header 寫出去——小串流會留在 socket 緩衝區裡，
// `res.headersSent` 仍是 false，於是**測不出來**（我第一版用 1 KB 就是假綠）。
// 512 KB 會確實觸發 flush，重現真實環境的崩潰。
const BIG_PIPE_BYTES = 512 * 1024;
app.get("/piped", (_req, res) => {
  res.type("application/octet-stream");
  let sent = 0;
  const stream = new Readable({
    read() {
      if (sent >= BIG_PIPE_BYTES) {
        this.push(null);
        return;
      }
      sent += 64 * 1024;
      this.push(Buffer.alloc(64 * 1024, 7));
    },
  });
  stream.pipe(res);
});
// SSE——排除
app.get("/stream", (_req, res) => {
  res.type("text/event-stream").send("data: hello\n\n");
});
// HTML
app.get("/page", (_req, res) => {
  res.type("html").send(`<!doctype html><html><body>${"<p>段落內容測試。</p>".repeat(100)}</body></html>`);
});
// 304
app.get("/not-modified", (_req, res) => {
  res.status(304).end();
});
// 上游已宣告 gzip（回真正 gzip 過的資料）——中間件不得二次壓縮
app.get("/pre-encoded", (_req, res) => {
  res
    .type("application/json")
    .set("Content-Encoding", "gzip")
    .send(zlib.gzipSync(JSON.stringify({ x: "y" })));
});

const server = app.listen(0);
const BASE = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
afterAll(() => server.close());

function rawGet(
  path: string,
  acceptEncoding: string,
  method: "GET" | "HEAD" = "GET",
): Promise<{ status: number; headers: http.IncomingHttpHeaders; buf: Buffer }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      BASE + path,
      { method, headers: { "accept-encoding": acceptEncoding } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            buf: Buffer.concat(chunks),
          }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}

describe("httpCompression", () => {
  it("支援 brotli 的大 JSON 回 br 編碼，且解壓後內容一致", async () => {
    const r = await rawGet("/big-json", "gzip, deflate, br, zstd");
    expect(r.headers["content-encoding"]).toBe("br");
    expect(r.headers["vary"]).toContain("Accept-Encoding");
    const text = zlib.brotliDecompressSync(r.buf).toString();
    expect(JSON.parse(text).items).toHaveLength(200);
  });

  it("只支援 gzip 的客戶端退回 gzip", async () => {
    const r = await rawGet("/big-json", "gzip, deflate");
    expect(r.headers["content-encoding"]).toBe("gzip");
    const text = zlib.gunzipSync(r.buf).toString();
    expect(JSON.parse(text).items).toHaveLength(200);
  });

  it("不支援壓縮的客戶端拿到原文與正確 Content-Length", async () => {
    const r = await rawGet("/big-json", "identity");
    expect(r.headers["content-encoding"]).toBeUndefined();
    expect(Number(r.headers["content-length"])).toBe(r.buf.length);
    expect(JSON.parse(r.buf.toString()).items).toHaveLength(200);
  });

  it("壓縮回應帶壓縮後的 Content-Length（進度條／快取正確性）", async () => {
    const r = await rawGet("/big-json", "gzip");
    expect(Number(r.headers["content-length"])).toBe(r.buf.length);
    expect(r.buf.length).toBeLessThan(Buffer.byteLength(JSON.stringify(BIG)) / 2);
  });

  it("小於 860B 的回應不壓縮", async () => {
    const r = await rawGet("/small", "br, gzip");
    expect(r.headers["content-encoding"]).toBeUndefined();
    expect(JSON.parse(r.buf.toString()).ok).toBe(true);
  });

  it("已是壓縮格式（zip）的回應直接透傳", async () => {
    const r = await rawGet("/zip", "br, gzip");
    expect(r.headers["content-encoding"]).toBeUndefined();
    expect(r.buf.length).toBe(2048);
  });

  it("SSE（text/event-stream）不壓縮、不緩衝", async () => {
    const r = await rawGet("/stream", "br, gzip");
    expect(r.headers["content-encoding"]).toBeUndefined();
    expect(r.buf.toString()).toContain("data: hello");
  });

  it("HTML 頁面壓縮後體積明顯小於原文", async () => {
    const raw = await rawGet("/page", "identity");
    const br = await rawGet("/page", "br");
    expect(br.headers["content-encoding"]).toBe("br");
    expect(br.buf.length).toBeLessThan(raw.buf.length / 2);
  });

  it("304 不加編碼頭也不破壞回應", async () => {
    const r = await rawGet("/not-modified", "br, gzip");
    expect(r.status).toBe(304);
    expect(r.headers["content-encoding"]).toBeUndefined();
  });

  it("回應已帶 Content-Encoding 時原樣透傳、不二次壓縮", async () => {
    const r = await rawGet("/pre-encoded", "br, gzip");
    expect(r.headers["content-encoding"]).toBe("gzip");
    expect(JSON.parse(zlib.gunzipSync(r.buf).toString()).x).toBe("y");
  });

  it("HEAD 請求不回主體，標頭還原乾淨（無誤導性編碼頭，CL 為原始大小）", async () => {
    const r = await rawGet("/big-json", "br", "HEAD");
    expect(r.status).toBe(200);
    expect(r.buf.length).toBe(0);
    // express 的 send 對 HEAD 只設頭不寫 body：中間件的空主體保護會還原
    // Content-Encoding 並保留原始 Content-Length（= GET 未壓縮大小），
    // 不會出現「宣稱 br 編碼卻配未壓縮長度」的矛盾標頭。
    expect(r.headers["content-encoding"]).toBeUndefined();
    expect(Number(r.headers["content-length"])).toBeGreaterThan(0);
  });
});

describe("⭐ 回歸：headers 送出後不得再動 header（2026-10-02）", () => {
  /**
   * 這個 bug 是從「伺服器起不來」抓到的：ERR_HTTP_HEADERS_SENT，整個 process 崩。
   * 根因：decide() 無條件呼叫 res.removeHeader/setHeader，但 pipe()／串流回應
   * 在第一個 chunk 之前**就已經把 header 送出去了**。
   *
   * ⚠️ 誠實說明覆蓋範圍：我試過用 512 KB 的整合測試重現，**抓不到**——
   * 崩潰發生在 server 端非同步寫入路徑，測試端感知不到，會變成
   * 「測試全綠但 bug 還在」的假綠（我第一版就是這樣，差點誤以為測好了）。
   * 所以改成模擬**真實時序**：中介層先跑（headersSent=false，Vary 設得掉），
   * 第一次 write 後 header 才送出，後續 write 再進 decide() 才會炸。
   */
  function makeRes() {
    const headers: Record<string, unknown> = { "Content-Type": "application/json" };
    const res = {
      statusCode: 200,
      headersSent: false,
      headers,
      removeHeader(k: string) {
        if (this.headersSent) throw new Error("ERR_HTTP_HEADERS_SENT");
        delete headers[k];
      },
      setHeader(k: string, v: unknown) {
        if (this.headersSent) throw new Error("ERR_HTTP_HEADERS_SENT");
        headers[k] = v;
      },
      getHeader: (k: string) => headers[k],
      write() {
        return true;
      },
      /** 模擬 archiver／pipe 在第一個資料 chunk 之前呼叫 writeHead() */
      writeHead() {
        this.headersSent = true;
        return this;
      },
      end() {
        return undefined;
      },
      on() {
        return undefined;
      },
      once() {
        return undefined;
      },
      emit() {
        return false;
      },
    };
    return res;
  }

  const req = { method: "GET", headers: { "accept-encoding": "gzip" } } as never;

  it("header 送出後再寫入 → 不得再動 header（這就是崩潰的根因）", () => {
    const res = makeRes();
    httpCompression(req, res as never, () => {});
    // 中介層剛跑完時 Vary 設得掉（headersSent 還是 false）
    expect(res.headers["Vary"]).toBe("Accept-Encoding");

    // 路由端（例如 /api/backup 的 archive）會在第一個 chunk 之前先 writeHead()，
    // header 於是已經送出——這才是崩潰的真正時序。
    res.writeHead();
    expect(res.headersSent).toBe(true);

    // 關鍵：此時 decide() 才被第一次呼叫，不得拋 ERR_HTTP_HEADERS_SENT
    expect(() => res.write(Buffer.alloc(4096, 4))).not.toThrow();
    expect(() => res.end()).not.toThrow();
  });

  it("對照：header 尚未送出時壓縮正常運作", () => {
    const res = makeRes();
    httpCompression(req, res as never, () => {});
    // 沒送出前 decide() 會設 Content-Encoding
    res.write(Buffer.alloc(64, 3));
    expect(res.headers["Content-Encoding"]).toBeDefined();
  });

  it("對照：express 的 res.json 路徑（不經 writeHead）壓縮照常", () => {
    const res = makeRes();
    httpCompression(req, res as never, () => {});
    res.write(Buffer.alloc(4096, 3));
    expect(res.headers["Content-Encoding"]).toBe("gzip");
  });
});

describe("⭐ 回歸：Uint8Array chunk 不能被字串化（2026-10-02）", () => {
  /**
   * 症狀：回應標頭說 `Content-Encoding: br`，瀏覽器解壓後拿到
   * `91,123,34,114,...` 這種**數字清單**，JSON.parse 報
   * 「Unexpected non-whitespace character after JSON at position 2」。
   *
   * 根因：`Buffer.isBuffer(new Uint8Array(...))` 回傳 **false**，
   * 于是 Uint8Array 掉到 `String(chunk)` 那一支，被字串化成位元組清單。
   *
   * 這個坑很隱蔽：curl 看到的是合法壓縮檔、brotli 也能解壓成功——
   * 只有「解壓後的內容」不對，所以前兩層檢查都會放行。
   *
   * ⚠️ 斷言必須檢查**實際送出的位元組**，只看 `Content-Encoding` 有沒有被設
   * 是抓不到這個 bug 的（我第一版就這樣，結果是假綠）。
   */
  function makeRes() {
    const headers: Record<string, unknown> = { "Content-Type": "application/json" };
    const sent: Buffer[] = [];
    return {
      statusCode: 200,
      headersSent: false,
      headers,
      sent,
      removeHeader(k: string) {
        if (this.headersSent) throw new Error("ERR_HTTP_HEADERS_SENT");
        delete headers[k];
      },
      setHeader(k: string, v: unknown) {
        if (this.headersSent) throw new Error("ERR_HTTP_HEADERS_SENT");
        headers[k] = v;
      },
      getHeader: (k: string) => headers[k],
      write(chunk: unknown) {
        if (chunk) sent.push(Buffer.from(chunk as never));
        return true;
      },
      end(chunk: unknown) {
        if (chunk) sent.push(Buffer.from(chunk as never));
        return undefined;
      },
      on() {
        return undefined;
      },
      once() {
        return undefined;
      },
      emit() {
        return false;
      },
    };
  }

  const req = { method: "GET", headers: { "accept-encoding": "gzip" } } as never;
  const json = '[{"result":{"data":{"json":{"ok":true}}}}]';

  /** 送出��位元組解壓後必須**逐位元組等於原始 json** */
  function expectRoundTrip(res: ReturnType<typeof makeRes>, label: string) {
    expect(res.headers["Content-Encoding"], `${label}: 應有 Content-Encoding`).toBe("gzip");
    const raw = Buffer.concat(res.sent);
    expect(raw.length, `${label}: 應有送出內容`).toBeGreaterThan(0);
    const decoded = zlib.gunzipSync(raw).toString("utf8");
    expect(decoded, `${label}: 解壓後必須等於原始 JSON`).toBe(json);
  }

  it("Uint8Array chunk 必須原樣保留（不能變成 91,123,34 數字清單）", async () => {
    const res = makeRes();
    httpCompression(req, res as never, () => {});
    res.end(new Uint8Array(Buffer.from(json, "utf8")));
    await new Promise((r) => setTimeout(r, 60)); // 等非同步壓縮
    expectRoundTrip(res, "Uint8Array");
  });

  it("DataView 與 ArrayBuffer 也要能處理", async () => {
    const bytes = new TextEncoder().encode(json);
    // DataView 要自己準備 ArrayBuffer 並**真的寫入內容**，
    // 否則裡面全是 null bytes（我第一版就是這樣，測的是空資料）
    const backing = new ArrayBuffer(bytes.length);
    new Uint8Array(backing).set(bytes);
    for (const [label, chunk] of [
      ["DataView", new DataView(backing)],
      ["ArrayBuffer", bytes.buffer.slice(0)],
    ] as const) {
      const res = makeRes();
      httpCompression(req, res as never, () => {});
      res.end(chunk as never);
      await new Promise((r) => setTimeout(r, 60));
      expectRoundTrip(res, label);
    }
  });

  it("對照：字串與 Buffer chunk 照常（既有行為不能壞）", async () => {
    for (const [label, chunk] of [
      ["string", json],
      ["Buffer", Buffer.from(json, "utf8")],
    ] as const) {
      const res = makeRes();
      httpCompression(req, res as never, () => {});
      res.end(chunk as never);
      await new Promise((r) => setTimeout(r, 60));
      expectRoundTrip(res, label);
    }
  });
});
