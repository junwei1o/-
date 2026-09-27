import { staticSafeLink, trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { initReadingScale } from "@/game/readingScale";
import { initTheme } from "@/lib/useTheme";
import "./index.css";

// 在 React 掛載前套用儲存的閱讀字號，避免大字級使用者看到字級閃爍。
// 注意：只切換 <html> 的 data-reading-scale 屬性，不動 root font-size。
initReadingScale();
// 同樣在掛載前套用儲存的外觀主題（data-theme），避免首屏色調閃爍。
initTheme();

// 僅在正式配置 umami 網站分析端點（VITE_ANALYTICS_ENDPOINT 為完整 http(s) 網址、
// 並提供 VITE_ANALYTICS_WEBSITE_ID）時才動態載入分析腳本；未配置的本機／local-first
// 環境完全不發請求，避免對未替換的佔位網址產生 404。
function initAnalytics(): void {
  try {
    const env = import.meta.env as unknown as Record<string, string | undefined>;
    const endpoint = env.VITE_ANALYTICS_ENDPOINT?.trim();
    const websiteId = env.VITE_ANALYTICS_WEBSITE_ID?.trim();
    if (!endpoint || !websiteId) return;
    if (!/^https?:\/\//i.test(endpoint)) return;
    if (endpoint.includes("%") || websiteId.includes("%")) return;
    if (document.querySelector('script[data-website-id]')) return;
    const script = document.createElement("script");
    script.defer = true;
    script.src = `${endpoint.replace(/\/$/, "")}/umami`;
    script.setAttribute("data-website-id", websiteId);
    document.head.appendChild(script);
  } catch {
    /* 分析腳本載入與否都不應影響主程式 */
  }
}
initAnalytics();

// local-first、未接後端時，部分查詢會被 SPA fallback 回 index.html 或直接網路失敗，
// 屬於預期性降級（元件皆有本地兜底），不該印成紅字污染 console；只記錄非預期的真實錯誤。
function isExpectedOfflineError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /Unexpected token|Failed to fetch|fetch failed|Network ?Error|not valid JSON|Load failed/i.test(msg);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 預期性離線錯誤（純靜態部署、飛航模式）重試沒有意義，只會讓學生多等幾秒。
      // 預設 3 次重試的指數退避在 4G 上就是好幾秒白畫面。
      retry(failureCount, error) {
        if (isExpectedOfflineError(error)) return false;
        return failureCount < 2;
      },
      // 重新連線時自動恢復（學生從飛航模式切回來的常見情境）。
      refetchOnWindowFocus: false,
    },
  },
});

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const err = event.query.state.error;
    if (!isExpectedOfflineError(err)) {
      console.error("[API Query Error]", err);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    console.error("[API Mutation Error]", event.mutation.state.error);
  }
});

// local-first 靜態部署時，後端 API 根本不存在（/api/trpc 與 /trpc/* 都被
// SPA fallback 回 index.html）。若照常發請求，每次查詢都要等一次往返才拿到
// 無法解析的 HTML 再拋錯——4G 實測單次就 2 秒，首頁多個查詢會疊成好幾秒白畫面。
//
// 開關與 fetch 守衛集中在 lib/trpc，cloudSync 等自建 client 也共用同一套判斷。
const trpcClient = trpc.createClient({
  links: [staticSafeLink(superjson)],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
