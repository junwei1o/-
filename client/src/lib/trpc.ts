import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, type TRPCLink } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();

/**
 * 後端 API 位置。未設定時用同源的 /api/trpc（Express 掛載點）。
 */
const configuredUrl = (
  import.meta.env as unknown as Record<string, string | undefined>
).VITE_TRPC_URL?.trim();

export const API_URL = configuredUrl || "/api/trpc";

/**
 * 後端 API 是否可用 —— 執行期自動偵測，不依賴「有沒有記得設定環境變數」。
 *
 * 背景：這個站點的部署方式可能因時間而改變。
 *   - 帶後端（Express + 真實 tRPC router）：/api/trpc 會回 application/json，
 *     即使路徑不存在的 procedure 也是 JSON 錯誤（實測 404 + JSON body）。
 *   - 純靜態（只有 dist/public）：/api/trpc 被 SPA fallback 回 index.html，
 *     回 text/html。
 * 因此「/api/trpc 回應是不是 JSON」就是區分兩者的可靠訊號。
 *
 * 早期版本這裡是用 VITE_TRPC_URL 來開關，結果因為部署實際上有後端、
 * 卻沒設那個變數，把後端整個關掉了，學生拿不到後端題庫。
 * 現在改成第一次需要時實際打一次探針：
 *   - 回 JSON → 視為有後端，正常走網路請求，結果記進 sessionStorage。
 *   - 回 HTML／失敗 → 視為純靜態，直接以預期性離線錯誤失敗，不佔用網路時間。
 * 快取只存在該分頁工作階段，換環境或重新開分頁會自然重新偵測。
 */

const PROBE_KEY = "xue-api-probe-v1";

/** 尚未完成探針前為 null（意圖不明）；完成後為布林值。 */
let probed: boolean | null = null;
let probePromise: Promise<boolean> | null = null;

function readCachedProbe(): boolean | null {
  try {
    const raw = globalThis.sessionStorage?.getItem(PROBE_KEY);
    if (raw === "1") return true;
    if (raw === "0") return false;
    return null;
  } catch {
    // 隱私模式／停用 storage：當作沒快取，重新探測。
    return null;
  }
}

function cacheProbe(result: boolean): void {
  try {
    globalThis.sessionStorage?.setItem(PROBE_KEY, result ? "1" : "0");
  } catch {
    /* 無法寫入 sessionStorage 不影響功能，只是每次都要重新探測 */
  }
}

/**
 * 打一次探針，確認 /api/trpc 背後是否真的有 tRPC router。
 *
 * 刻意用 GET + 不帶 body：tRPC 的 GET 會走「query」路徑，路徑為空時回
 * JSON 錯誤 —— 這正是我們要的訊號（代表有 router 在處理）。
 * 靜態站則會把這個請求 fallback 成 index.html（text/html）。
 */
function probeOnce(): Promise<boolean> {
  if (probePromise) return probePromise;
  probePromise = (async () => {
    const cached = readCachedProbe();
    if (cached !== null) {
      probed = cached;
      return cached;
    }
    // 環境變數明確指定了就直接信任，不浪費一次往返。
    if (configuredUrl) {
      probed = true;
      cacheProbe(true);
      return true;
    }
    let available = false;
    try {
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      // 探針不該讓學生等太久：後端在 free plan 冷啟動時可能要數秒。
      const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;
      const response = await fetch(API_URL, {
        method: "GET",
        credentials: "include",
        signal: controller?.signal,
      });
      if (timer) clearTimeout(timer);
      // tRPC router 一定回 JSON；SPA fallback 一定回 text/html。
      const contentType = response.headers.get("content-type") ?? "";
      available = contentType.includes("json");
    } catch {
      available = false;
    }
    probed = available;
    cacheProbe(available);
    return available;
  })();
  return probePromise;
}

/** 後端可用性（同步讀取已完成的探針結果；未完成時為 null）。 */
export function getApiAvailability(): boolean | null {
  if (probed !== null) return probed;
  const cached = readCachedProbe();
  return cached;
}

/** 確保探針已執行完畢。 */
export function ensureApiProbe(): Promise<boolean> {
  return probeOnce();
}

/**
 * 統一的 fetch：先確保探針完成，再決定是否真的發請求。
 *
 * - 有後端 → 正常請求。
 * - 純靜態 → 不發請求，直接以「Failed to fetch」失敗。語意等同網路不可達，
 *   元件本來就有本地兜底，且 isExpectedOfflineError 已涵蓋這個錯誤訊息，
 *   不會在 console 留下紅字。
 */
export async function guardedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const available = await probeOnce();
  if (!available) throw new TypeError("Failed to fetch");
  return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
}

/** 給自建 tRPC client 用的 link（cloudSync 等需要直接呼叫的場景）。 */
export function staticSafeLink(transformer: unknown): TRPCLink<AppRouter> {
  return httpBatchLink({ url: API_URL, transformer: transformer as never, fetch: guardedFetch });
}
