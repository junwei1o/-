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

/**
 * 緩衝上限（2026-10-02 審查加入）。
 *
 * 這個中介層是**緩衝式**的——整份回應先收進記憶體、end 時才壓縮。
 * 目前最大的單一回應是題庫 chunk 約 1.7 MB，遠低於此上限，所以正常情況
 * 這個護欄不會啟動。
 *
 * 但它沒有上限就代表：**日後有人加一個會回傳大 JSON 的 GET 端點，
 * 記憶體用量會跟著回應大小線性成長**，而且是在沒有任何預警的情況下。
 * 免費層只有 512 MB，幾個併發就可能把實例壓垮。
 *
 * 超過上限就**放棄壓縮、把已緩衝的內容原樣寫出**——傳輸量多一點，
 * 換來記憶體有上限。這個取捨是刻意的。
 */
const MAX_BUFFERED_BYTES = 8 * 1024 * 1024;

/** 可壓縮 MIME 白名單（排除 event-stream 以保護 SSE 即時性） */
const COMPRESSIBLE =
  /^(?:text\/(?!event-stream)|application\/(?:json|javascript|ecmascript|xml|manifest\+json|problem\+json)|image\/svg\+xml)/i;

const BROTLI_OPTIONS: zlib.BrotliOptions = {
  params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 },
};
const GZIP_OPTIONS: zlib.ZlibOptions = { level: 6 };

/**
 * 確保 `Vary` 標頭**包含** `Accept-Encoding`，且**不覆蓋**其他值。
 *
 * ⭐ 這裡原本是 `res.setHeader("Vary", "Accept-Encoding")`——2026-10-02 審查抓到一個
 * 真實的正確性問題（實測可重現）：
 *
 *   curl（不帶 trpc-accept） → `Vary: Accept-Encoding`
 *   瀏覽器（帶 trpc-accept） → `Vary: trpc-accept, accept`   ← **Accept-Encoding 不見了**
 *
 * 原因是 **後設的 `setHeader` 會整個覆蓋先前的值**，不是追加。
 * tRPC 在自己的中介層裡設了 `Vary: trpc-accept, accept`，於是把我們的
 * `Accept-Encoding` 蓋掉。
 *
 * 後果不是理論問題：中間快取（Render CDN、校園／家用代理）看到一個
 * `Vary` 沒有 `Accept-Encoding` 的回應，就**可能把 brotli 壓縮過的內容
 * 發給不支援 br 的客戶端**，對方拿到的是亂碼。
 *
 * `Vary` 的語意本來就是「所有會影響回應的請求標頭」＝**聯集**，
 * 所以正確做法是追加而不是賦值。
 */
function ensureVaryAcceptEncoding(res: Response): void {
  const current = res.getHeader("Vary");
  const parts = (
    Array.isArray(current) ? current.join(",") : String(current ?? "")
  )
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.some((part) => part.toLowerCase() === "accept-encoding")) return;
  parts.push("Accept-Encoding");
  res.setHeader("Vary", parts.join(", "));
}

export function httpCompression(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // 無論最終是否壓縮都聲明 Vary：回應是否壓縮隨 Accept-Encoding 而異
  ensureVaryAcceptEncoding(res);

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

  /**
   * 已緩衝的位元組數（計算時不重複相加太多次，用變數追蹤）。
   */
  let bufferedBytes = 0;

  /** 超過上限就放棄壓縮。 */
  function bufferedTooLarge(next: Buffer): boolean {
    return bufferedBytes + next.length > MAX_BUFFERED_BYTES;
  }

  /**
   * 放棄壓縮：把已緩衝的內容全部原樣寫出，之後的寫入也走原路徑。
   *
   * 這時 header 可能還沒送出（因為我們一直在緩衝、沒真正寫過），
   * 所以要把 Content-Encoding 拿掉、Content-Length 換回原始長度——
   * 否則會出現「宣稱壓縮但其實是明文」的矛盾標頭。
   *
   * 回傳型別用 `any`：這個 helper 會被 `write`（要 boolean）與
   * `end`（要 Response）兩種簽章呼叫，而它實際上兩種都會回。
   * 在兩個呼叫點各寫一次轉型比在這裡硬選一個更誠實。
   */
  function flushAndPassthrough(
    next: Buffer,
    encoding?: BufferEncoding,
    cb?: (err?: Error) => void,
    isEnd = false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    passthrough = true;
    if (!res.headersSent) {
      res.removeHeader("Content-Encoding");
      res.setHeader("Content-Length", String(bufferedBytes + next.length));
    }
    for (const buffered of chunks) origWrite(buffered);
    chunks.length = 0;
    bufferedBytes = 0;
    return isEnd ? origEnd(next, encoding, cb) : origWrite(next, encoding, cb);
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
      // 即使不壓縮也要保證 Vary 含 Accept-Encoding——
      // 因為 decide() 是在**路由處理器之後**才跑的，這時 tRPC 等中介層
      // 可能已經用 setHeader 覆蓋過 Vary。只在開頭設一次是不夠的。
      ensureVaryAcceptEncoding(res);
      return false;
    }
    // 同理：要壓縮時也再保證一次（覆蓋可能發生在任何時候）
    ensureVaryAcceptEncoding(res);
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
      if (bufferedTooLarge(buf)) return flushAndPassthrough(buf, encoding, cb);
      chunks.push(buf);
      bufferedBytes += buf.length;
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
        if (bufferedTooLarge(buf)) return flushAndPassthrough(buf, encoding, cb, true);
        chunks.push(buf);
        bufferedBytes += buf.length;
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
