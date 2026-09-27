import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, type TRPCLink } from "@trpc/client";
import type { AppRouter } from "../../../server/trpc";

export const trpc = createTRPCReact<AppRouter>();

/**
 * 後端 API 是否可用。
 *
 * 線上（xue-gr3a.onrender.com）是純靜態部署：/api/trpc 與 /trpc/* 都被
 * SPA fallback 回 index.html，後端並不存在。實測每次查詢都要等一次往返
 * （4G 約 2 秒）才拿到無法解析的 HTML 再拋錯。
 *
 * 因此沒有設定 VITE_TRPC_URL 時，所有 tRPC 請求直接以「Failed to fetch」失敗——
 * 語意等同網路不可達，且元件本來就有本地兜底。設定 VITE_TRPC_URL 後恢復正常請求。
 * 這個開關集中在此，讓主 client 與 cloudSync 等自建 client 共用同一套判斷。
 */
export const API_ENABLED = Boolean(
  (import.meta.env as unknown as Record<string, string | undefined>).VITE_TRPC_URL?.trim(),
);

export const API_URL =
  (import.meta.env as unknown as Record<string, string | undefined>).VITE_TRPC_URL?.trim() || "/api/trpc";

/**
 * 統一的 fetch：純靜態部署時不發請求，直接拋出預期性離線錯誤。
 * 讓所有 tRPC client（不只 main.tsx 那個）都省下無謂的網路往返。
 */
export function guardedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (!API_ENABLED) return Promise.reject(new TypeError("Failed to fetch"));
  return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
}

/** 給自建 tRPC client 用的 link（cloudSync 等需要直接呼叫的場景）。 */
export function staticSafeLink(transformer: unknown): TRPCLink<AppRouter> {
  return httpBatchLink({ url: API_URL, transformer: transformer as never, fetch: guardedFetch });
}
