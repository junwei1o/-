// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { bxStore } from "./bxStore";
import {
  DEBUG_GATE_LOCK_MS,
  DEBUG_GATE_MAX_WRONG,
  DEBUG_GATE_STORAGE_KEY,
  isDebugUnlocked,
  lockDebug,
  tryUnlockDebug,
} from "./debugGate";

describe("debugGate 船長室密語閘門", () => {
  beforeEach(() => {
    localStorage.clear();
    bxStore.reset();
  });

  it("預設為上鎖狀態", () => {
    expect(isDebugUnlocked()).toBe(false);
  });

  it("輸入正確的數字驗證碼可解鎖並記住此裝置", () => {
    const result = tryUnlockDebug("2676");
    expect(result).toEqual({ ok: true });
    expect(isDebugUnlocked()).toBe(true);
    expect(localStorage.getItem(DEBUG_GATE_STORAGE_KEY)).toBe("1");
  });

  it("輸入正確的中文指令也可解鎖", () => {
    expect(tryUnlockDebug("船長室")).toEqual({ ok: true });
    expect(isDebugUnlocked()).toBe(true);
  });

  it("密語前後的空白不影響比對", () => {
    expect(tryUnlockDebug("  2676  ")).toEqual({ ok: true });
  });

  it("密語錯誤時回報剩餘次數並累計錯誤", () => {
    const first = tryUnlockDebug("0000");
    expect(first).toEqual({ ok: false, reason: "wrong", remaining: DEBUG_GATE_MAX_WRONG - 1 });
    const second = tryUnlockDebug("1111");
    expect(second).toEqual({ ok: false, reason: "wrong", remaining: DEBUG_GATE_MAX_WRONG - 2 });
    expect(isDebugUnlocked()).toBe(false);
  });

  it(`連續錯 ${DEBUG_GATE_MAX_WRONG} 次後鎖定，鎖定期間連正確密語也無法進入`, () => {
    for (let i = 0; i < DEBUG_GATE_MAX_WRONG - 1; i += 1) {
      tryUnlockDebug("wrong");
    }
    const fifth = tryUnlockDebug("wrong");
    expect(fifth.ok).toBe(false);
    if (!fifth.ok && fifth.reason === "locked") {
      expect(fifth.retryAfterMin).toBe(Math.ceil(DEBUG_GATE_LOCK_MS / 60_000));
    }

    // 鎖定期間輸入正確密語仍被拒絕
    const duringLock = tryUnlockDebug("2676");
    expect(duringLock.ok).toBe(false);
    if (!duringLock.ok) expect(duringLock.reason).toBe("locked");
    expect(isDebugUnlocked()).toBe(false);
  });

  it("鎖定時間到期後可再次嘗試", () => {
    bxStore.update((s) => {
      s.guardian.lock_until = Date.now() - 1000;
      s.guardian.wrong_count = 0;
    });
    expect(tryUnlockDebug("2676")).toEqual({ ok: true });
  });

  it("解鎖成功會重置錯誤計數", () => {
    tryUnlockDebug("wrong");
    tryUnlockDebug("wrong");
    tryUnlockDebug("2676");
    expect(bxStore.get<number>("guardian.wrong_count", -1)).toBe(0);
    expect(bxStore.get<number | null>("guardian.lock_until", -1)).toBeNull();
  });

  it("lockDebug 重新上鎖，下次需再輸入密語", () => {
    tryUnlockDebug("2676");
    expect(isDebugUnlocked()).toBe(true);
    lockDebug();
    expect(isDebugUnlocked()).toBe(false);
    expect(localStorage.getItem(DEBUG_GATE_STORAGE_KEY)).toBeNull();
  });
});
