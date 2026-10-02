/**
 * 零依賴 HTTP 回應壓縮（gzip / brotli）
 *
 * 動機（2026-10-02 全站體檢）：生產 server 未啟用任何傳輸壓縮——建置後
 * index.css 約 572KB、入口 JS 約 460KB、題庫資源約 1.7MB、tRPC 大型 JSON
 * 全部裸傳；校園／家庭頻寬下傳輸量直接決定載入秒數。文字類資源壓縮率
 * 約 3-6 倍（CSS 實測 572KB→97KB），本中間件可把全站文字傳輸量降到約 1/3。
 *
 * 實作取捨（對齊本專案「不引外部依賴以免動 lockfile」慣例，安全標頭同款）：
 * - 用 Node 內建 zlib；brotli 優先（現代瀏覽器全支援、壓縮率更佳），退 gzip。
 * - 緩衝式：攔 res.write/end，end 時一次性「非同步」壓縮後送出（不阻塞
 *   事件迴圈）。API JSON 本就一次性回應；單請求最大約 1.7MB（題庫 chunk），
 *   緩衝可接受，換取實作簡單、不碰串流 backpressure 邊角。
 * - 只壓「值得壓」的：GET/HEAD、可壓 MIME（文字類）、≥860B（太小壓了可能
 *   更大）、回應尚未編碼、非 206/304/204、無 Content-Range（部分內容不動）。
 * - zip/png/woff2/mp4 等本身已是壓縮格式，MIME 白名單天然排除，直接透傳。
 * - 一律送 Vary: Accept-Encoding：中間代理才不會把壓縮版快取給不支援的客戶端。
 * - SSE（text/event-stream）排除，否則緩衝會破壞即時推送語義。
 * - brotli 品質 5：與 gzip -6 速度相當但壓縮率更好；更高品質對 CPU 成本
 *   增加遠大於收益，不適合每請求動態壓縮。
 */

import zlib from "node:zlib";
import type { Request, Response, NextFunction } from "express";

/** 低於此大小的回應不壓縮（壓縮標頭開銷可能讓傳輸不減反增） */
const MIN_BYTES = 860;

/** 可壓縮 MIME 白名單（排除 event-stream 以保護 SSE 即時性） */
const COMPRESSIBLE =
  /^(?:text\/(?!event-stream)|application\/(?:json|javascript|ecmascript|xml|manifest\+json|problem\+json)|image\/svg\+xml)/i;

const BROTLI_OPTIONS: zlib.BrotliOptions = {
  params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 },
};
const GZIP_OPTIONS: zlib.ZlibOptions = { level: 6 };

export function httpCompression(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // 無論最終是否壓縮都聲明 Vary：回應是否壓縮隨 Accept-Encoding 而異
  res.setHeader("Vary", "Accept-Encoding");

  const accept = String(req.headers["accept-encoding"] ?? "");
  const preferBr = /\bbr\b/.test(accept);
  const preferGzip = /\bgzip\b/.test(accept);
  if (
    (req.method !== "GET" && req.method !== "HEAD") ||
    (!preferBr && !preferGzip)
  ) {
    next();
    return;
  }

  const chunks: Buffer[] = [];
  let decided = false;
  let passthrough = false;
  /** decide 可能移除 Content-Length；HEAD/空主體時需還原 */
  let savedContentLength: string | undefined;

  const origWrite = res.write.bind(res) as (
    chunk: unknown,
    encoding?: BufferEncoding,
    cb?: (err?: Error) => void,
  ) => boolean;
  const origEnd = res.end.bind(res) as (
    chunk?: unknown,
    encoding?: BufferEncoding,
    cb?: (err?: Error) => void,
  ) => Response;

    /** 第一次 write/end 時判定：回傳 true 代表「收進緩衝、之後壓縮」 */
    function decide(): boolean {
      if (decided) return !passthrough;
      decided = true;
      const status = res.statusCode;
      if (status === 204 || status === 304 || status < 200 || status === 206) {
        passthrough = true;
        return false;
      }
      // ⚠️ 串流回應的 header **早就送出去了**（例如 /api/backup 用 archive.pipe(res)、
      // 靜態檔用 stream）。此時呼叫 removeHeader/setHeader 會直接拋
      // ERR_HTTP_HEADERS_SENT，讓**整個 process 崩潰**。
      // 已經送出就沒辦法改 Content-Encoding，只能直通不壓縮。
      if (res.headersSent) {
        passthrough = true;
        return false;
      }
      const type = String(res.getHeader("Content-Type") ?? "");
    const alreadyEncoded = String(res.getHeader("Content-Encoding") ?? "") !== "";
    const hasRange = res.getHeader("Content-Range") !== undefined;
    const rawLen = res.getHeader("Content-Length");
    savedContentLength = rawLen === undefined ? undefined : String(rawLen);
    const len = Number(savedContentLength ?? 0);
    if (
      !COMPRESSIBLE.test(type) ||
      alreadyEncoded ||
      hasRange ||
      (len > 0 && len < MIN_BYTES)
    ) {
      passthrough = true;
      return false;
    }
    res.removeHeader("Content-Length");
    res.setHeader("Content-Encoding", preferBr ? "br" : "gzip");
    return true;
  }

    /**
     * 把各種形態的 chunk 轉成 Buffer。
     *
     * ⚠️ 這裡踩過一個很隱蔽的坑（2026-10-02 實測）：
     * **`Buffer.isBuffer(new Uint8Array(...))` 回傳 false**。
     * 所以只判斷 isBuffer 的话，Uint8Array 會掉到 `String(chunk)` 那一支，
     * 而 `String(new Uint8Array([91,123,34]))` 會變成字串 `"91,123,34"`——
     * 也就是把位元組**列印成文字**送出去。症狀是回應標頭說 br、內容卻是
     * `91,123,34,114,...` 這種數字清單，瀏覽器解壓後 JSON.parse 直接爆
     * 「Unexpected non-whitespace character after JSON at position 2」。
     *
     * 所以必須用 `ArrayBuffer.isView` 涵蓋所有 TypedArray／DataView，
     * 並另外處理純 ArrayBuffer。
     */
    function toBuffer(chunk: unknown, encoding?: unknown): Buffer {
      if (Buffer.isBuffer(chunk)) return chunk;
      // Buffer 之外的 TypedArray／DataView（Uint8Array、Uint16Array…）
      if (ArrayBuffer.isView(chunk)) {
        const view = chunk as ArrayBufferView;
        return Buffer.from(view.buffer, view.byteOffset, view.byteLength);
      }
      if (chunk instanceof ArrayBuffer) return Buffer.from(chunk);
      const enc =
        typeof encoding === "string" ? (encoding as BufferEncoding) : "utf8";
      return Buffer.from(String(chunk), enc);
    }

  res.write = function overriddenWrite(
    chunk?: unknown,
    encoding?: BufferEncoding,
    cb?: (err?: Error) => void,
  ): boolean {
    if (chunk == null) return origWrite(chunk, encoding, cb);
    const buf = toBuffer(chunk, encoding);
    if (!decide()) return origWrite(buf, encoding, cb);
    chunks.push(buf);
    return true;
  } as typeof res.write;

  res.end = function overriddenEnd(
    chunk?: unknown,
    encoding?: BufferEncoding,
    cb?: (err?: Error) => void,
  ): Response {
    if (chunk != null) {
      const buf = toBuffer(chunk, encoding);
      if (!decide()) return origEnd(buf, encoding, cb);
      chunks.push(buf);
    } else if (!decide()) {
      return origEnd(cb);
    }

    const body = Buffer.concat(chunks);
    if (body.length === 0) {
      // HEAD／空主體：還原判定前的標頭，原樣結束
      res.removeHeader("Content-Encoding");
      if (savedContentLength !== undefined) {
        res.setHeader("Content-Length", savedContentLength);
      }
      return origEnd(cb);
    }

    const finish = (compressed: Buffer) => {
      res.setHeader("Content-Length", String(compressed.length));
      origEnd(compressed);
    };
    const fallback = () => {
      // 壓縮失敗（極罕見）：改回 identity 原樣送出，寧多勿錯
      res.setHeader("Content-Encoding", "identity");
      finish(body);
    };
    if (preferBr) {
      zlib.brotliCompress(body, BROTLI_OPTIONS, (err, out) =>
        err ? fallback() : finish(out),
      );
    } else {
      zlib.gzip(body, GZIP_OPTIONS, (err, out) =>
        err ? fallback() : finish(out),
      );
    }
    return res;
  } as typeof res.end;

  next();
}
