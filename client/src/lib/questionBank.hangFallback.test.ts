// @vitest-environment jsdom
/**
 * 本地題庫「卡住（hang）」時的逾時退路（2026-09-29 覆核第③項殘餘風險）。
 *
 * 背景：useQuestionBank 把伺服器抓取改成「本地載入失敗才啟用」的 fallback。
 * reject 路徑（動態 import 失敗）已有 catch 處理；但若請求「懸住」（既不
 * resolve 也不 reject），catch 永遠不觸發、fallback 永不啟用、學生無限等待。
 * 本檔用永遠 pending 的 JSON mock 凍住本地載入，驗證 12 秒逾時會放行伺服器。
 *
 * 注意：本檔的 vi.mock 依 test-file 隔離，不會影響 questionBank.test.ts
 * 對真實內建題庫的驗證。
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** 記錄每次 useQuery 收到的 options，供斷言 enabled 閘的開關時序。 */
const queryCalls: Array<{ enabled?: boolean }> = [];

vi.mock("@/lib/trpc", () => ({
  trpc: {
    questionBank: {
      list: {
        useQuery: (_input: unknown, opts: unknown) => {
          queryCalls.push((opts ?? {}) as { enabled?: boolean });
          return { data: undefined, isError: false, refetch: vi.fn() };
        },
      },
    },
  },
}));

// 本地題庫的動態 import 永遠 pending → 模擬 chunk 卡住（hang，非 reject）。
vi.mock("../../../data/runtime_bank_elementary.json", () => new Promise(() => {}));

import { useQuestionBank } from "./questionBank";

describe("本地題庫 hang 時的逾時退路", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    queryCalls.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("12 秒內維持 loading：伺服器 fallback 不啟用（正常路徑不重複下載）", () => {
    renderHook(() => useQuestionBank({ eager: true }));
    expect(queryCalls.length).toBeGreaterThan(0);
    expect(queryCalls[queryCalls.length - 1].enabled).toBe(false);

    act(() => {
      vi.advanceTimersByTime(11_000);
    });
    expect(queryCalls[queryCalls.length - 1].enabled).toBe(false);
  });

  it("12 秒逾時後標記 failed → 伺服器 fallback 啟用（hang 路徑的退路）", () => {
    renderHook(() => useQuestionBank({ eager: true }));
    expect(queryCalls[queryCalls.length - 1].enabled).toBe(false);

    act(() => {
      vi.advanceTimersByTime(12_000);
    });
    // 逾時計時器把 localState 從 loading 翻成 failed → enabled 開啟
    expect(queryCalls[queryCalls.length - 1].enabled).toBe(true);
  });

  it("逾時前卸載：計時器被清除，不會在卸載後觸發狀態更新", () => {
    const { unmount } = renderHook(() => useQuestionBank({ eager: true }));
    unmount();

    // 若清理失效，這段 advance 會對已卸載的 hook 呼叫 setState（React 會警告）。
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(queryCalls[queryCalls.length - 1].enabled).toBe(false);
  });
});
