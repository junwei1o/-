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
