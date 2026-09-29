// @vitest-environment jsdom
/**
 * 全域音效（SFX）總開關：預設值、持久化、函數式更新、訂閱即時性、跨分頁同步。
 * 模組狀態是檔案作用域——每個測試前後都重置，避免次序耦合。
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  SOUND_ENABLED_KEY,
  isSoundEnabled,
  setSoundEnabled,
  useSoundEnabled,
} from "./soundPreference";

beforeEach(() => {
  localStorage.clear();
  setSoundEnabled(true);
});

afterEach(() => {
  localStorage.clear();
  setSoundEnabled(true);
});

describe("全域音效開關（soundPreference）", () => {
  it("預設為開啟", () => {
    expect(isSoundEnabled()).toBe(true);
  });

  it("關閉後寫入 localStorage 並持久化", () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(localStorage.getItem(SOUND_ENABLED_KEY)).toBe("false");
    setSoundEnabled(true);
    expect(localStorage.getItem(SOUND_ENABLED_KEY)).toBe("true");
  });

  it("支援函數式更新（與 useState setter 同介面，MatchingPage 原按鈕零改動）", () => {
    setSoundEnabled((prev) => !prev);
    expect(isSoundEnabled()).toBe(false);
    setSoundEnabled((prev) => !prev);
    expect(isSoundEnabled()).toBe(true);
  });

  it("useSoundEnabled：切換後 hook 即時重渲染", () => {
    const { result } = renderHook(() => useSoundEnabled());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    expect(isSoundEnabled()).toBe(false);
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
  });

  it("其他分頁的 storage 事件會同步本分頁（跨分頁靜音）", () => {
    const { result } = renderHook(() => useSoundEnabled());
    act(() => {
      localStorage.setItem(SOUND_ENABLED_KEY, "false");
      window.dispatchEvent(
        new StorageEvent("storage", { key: SOUND_ENABLED_KEY, newValue: "false" }),
      );
    });
    expect(result.current[0]).toBe(false);
    expect(isSoundEnabled()).toBe(false);
  });

  it("相同值重複設定為 no-op（不觸發多餘重渲染）", () => {
    const { result, rerender } = renderHook(() => useSoundEnabled());
    const before = result.current[0];
    act(() => result.current[1](before));
    rerender();
    expect(result.current[0]).toBe(before);
  });
});
