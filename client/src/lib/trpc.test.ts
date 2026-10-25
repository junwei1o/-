// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 後端探針的行為驗證。
 *
 * 這個模組用「/api/trpc 的回應是不是 JSON」區分「有後端」與「純靜態」：
 *   - Express + tRPC router → application/json（即使 procedure 不存在也是 JSON 錯誤）
 *   - 只有 dist/public      → SPA fallback 回 index.html（text/html）
 *
 * 歷史教訓：這裡曾經用 VITE_TRPC_URL 當開關，而線上部署其實有後端卻沒設
 * 該變數，結果把後端整個關掉，學生拿不到後端題庫。因此開關必須自我判斷。
 */

/** 每個測試都要全新的模組狀態（探針結果是模組層級的）。 */
async function freshModule() {
  vi.resetModules();
  return await import("./trpc");
}

function mockFetch(response: { contentType: string | null; body?: string }) {
  const fn = vi.fn(async () => ({
    headers: { get: (k: string) => (k.toLowerCase() === "content-type" ? response.contentType : null) },
    text: async () => response.body ?? "",
  }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("後端探針", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("回應是 JSON → 判定有後端，正常發出請求", async () => {
    const fetchMock = mockFetch({ contentType: "application/json", body: "{}" });
    const { guardedFetch } = await freshModule();

    await guardedFetch("/api/trpc/auth.me");

    // 探針 1 次 + 實際請求 1 次
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // 探針打既有 publicProcedure（system.health）：有後端回 200 JSON、
    // 舊後端回 404 JSON，兩者都是 JSON 都算「有後端」；純靜態回 HTML 才算無。
    // 這樣比打空路徑更乾淨（空路徑會 404，每個新分頁在 console 留紅字）。
    expect(fetchMock.mock.calls[0][0]).toMatch(/^\/api\/trpc\/system\.health\?/);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/trpc/auth.me");
  });

  it("回應是 HTML（純靜態 SPA fallback）→ 判定無後端，不發出實際請求", async () => {
    const fetchMock = mockFetch({ contentType: "text/html; charset=UTF-8", body: "<!doctype html>" });
    const { guardedFetch } = await freshModule();

    await expect(guardedFetch("/api/trpc/auth.me")).rejects.toThrow("Failed to fetch");

    // 只有探針那 1 次，實際請求完全沒有送出
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("探針回 404 但內容是 JSON → 仍判定有後端（舊後端版本落差不可誤判）", async () => {
    // tRPC 對「不存在的程序」回 404 + JSON。若探針改打的端點在舊後端
    // 尚不存在，絕不能因此判定成靜態站 —— 那樣學生會拿不到後端題庫。
    const fetchMock = mockFetch({ contentType: "application/json", body: '{"error":{}}' });
    const { guardedFetch } = await freshModule();

    await guardedFetch("/api/trpc/auth.me");

    // 判定有後端 → 實際請求照常發出
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/trpc/auth.me");
  });

  it("探針只打一次，後續請求共用結果", async () => {
    const fetchMock = mockFetch({ contentType: "application/json" });
    const { guardedFetch } = await freshModule();

    await guardedFetch("/api/trpc/a");
    await guardedFetch("/api/trpc/b");
    await guardedFetch("/api/trpc/c");

    // 1 次探針 + 3 次實際請求
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("並行請求共用同一個探針（不重複打）", async () => {
    const fetchMock = mockFetch({ contentType: "application/json" });
    const { guardedFetch } = await freshModule();

    await Promise.all([guardedFetch("/api/trpc/a"), guardedFetch("/api/trpc/b")]);

    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 探針 + 2 請求
  });

  it("探針結果記在 sessionStorage，重新載入不再探測", async () => {
    sessionStorage.setItem("xue-api-probe-v1", "1");
    const fetchMock = mockFetch({ contentType: "application/json" });
    const { guardedFetch } = await freshModule();

    await guardedFetch("/api/trpc/auth.me");

    // 直接發請求，沒有探針那一次
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/trpc/auth.me");
  });

  it("sessionStorage 記為「無後端」時直接擋掉，不發請求", async () => {
    sessionStorage.setItem("xue-api-probe-v1", "0");
    const fetchMock = mockFetch({ contentType: "application/json" });
    const { guardedFetch } = await freshModule();

    await expect(guardedFetch("/api/trpc/auth.me")).rejects.toThrow("Failed to fetch");
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it("探針網路失敗 → 判定無後端，學生走本地題庫", async () => {
    const fn = vi.fn(async () => { throw new TypeError("Failed to fetch"); });
    vi.stubGlobal("fetch", fn);
    const { guardedFetch } = await freshModule();

    await expect(guardedFetch("/api/trpc/auth.me")).rejects.toThrow("Failed to fetch");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("getApiAvailability 在探針完成後回傳結果", async () => {
    mockFetch({ contentType: "application/json" });
    const mod = await freshModule();

    await mod.ensureApiProbe();
    expect(mod.getApiAvailability()).toBe(true);
  });
});
