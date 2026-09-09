import { bxStore } from "./bxStore";

/**
 * 船長室（調試模式）密語閘門。
 * - 解鎖後記在 localStorage（此裝置免重複輸入），可在面板內「重新上鎖」。
 * - 密語接受 4 位數驗證碼或中文指令；連續錯 5 次鎖定 10 分鐘（記在 bxStore.guardian）。
 * - 這是避免孩子誤觸的介面閘門，不是安全邊界（調試資料本來就只做遮蔽摘要）。
 */

export const DEBUG_GATE_STORAGE_KEY = "xue-debug-unlocked-v1";
export const DEBUG_GATE_ANSWERS: readonly string[] = ["2676", "船長室"];
export const DEBUG_GATE_MAX_WRONG = 5;
export const DEBUG_GATE_LOCK_MS = 10 * 60 * 1000;

export function isDebugUnlocked(storage: Pick<Storage, "getItem"> = localStorage): boolean {
  try {
    return storage.getItem(DEBUG_GATE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export type DebugGateResult =
  | { ok: true }
  | { ok: false; reason: "wrong"; remaining: number }
  | { ok: false; reason: "locked"; retryAfterMin: number };

function normalizeInput(input: string): string {
  return input.replace(/\s+/g, "");
}

const GUARDIAN_FALLBACK = { pin: null, remember_until: null, wrong_count: 0, lock_until: null };

/** 嘗試解鎖。輸入會去掉所有空白後比對（密語不區分全半形空格）。 */
export function tryUnlockDebug(input: string): DebugGateResult {
  const guardian = bxStore.get("guardian", GUARDIAN_FALLBACK) ?? GUARDIAN_FALLBACK;
  const now = Date.now();
  const lockUntil = guardian.lock_until ?? 0;
  if (lockUntil > now) {
    return { ok: false, reason: "locked", retryAfterMin: Math.ceil((lockUntil - now) / 60_000) };
  }

  const answer = normalizeInput(input);
  const matched = DEBUG_GATE_ANSWERS.some((code) => answer === code);
  if (matched) {
    bxStore.update((s) => {
      s.guardian.wrong_count = 0;
      s.guardian.lock_until = null;
    });
    try {
      localStorage.setItem(DEBUG_GATE_STORAGE_KEY, "1");
    } catch {
      // 私密模式下仍允許本次使用，只是不記住。
    }
    return { ok: true };
  }

  const wrong = (guardian.wrong_count ?? 0) + 1;
  if (wrong >= DEBUG_GATE_MAX_WRONG) {
    bxStore.update((s) => {
      s.guardian.wrong_count = 0;
      s.guardian.lock_until = now + DEBUG_GATE_LOCK_MS;
    });
    return { ok: false, reason: "locked", retryAfterMin: Math.ceil(DEBUG_GATE_LOCK_MS / 60_000) };
  }
  bxStore.update((s) => {
    s.guardian.wrong_count = wrong;
  });
  return { ok: false, reason: "wrong", remaining: DEBUG_GATE_MAX_WRONG - wrong };
}

/** 重新上鎖（此裝置下次進入需再輸入密語）。 */
export function lockDebug() {
  try {
    localStorage.removeItem(DEBUG_GATE_STORAGE_KEY);
  } catch {
    // 靜默
  }
}
