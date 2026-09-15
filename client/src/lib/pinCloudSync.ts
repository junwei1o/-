/**
 * PIN 雲端同步：以 4 位數字 PIN 作為存取憑證，
 * 把探險進度（RPG 資料＋伴讀狀態）備份到雲端船籍，可在另一台裝置用同一 PIN 載回。
 *
 * 設計：PIN → FNV-1a hash → 穩定雲端船籍名（pin-<hash>，符合伺服器 2–6 字規則），
 * 不需要額外帳號；載入時比對本機與雲端進度，較新的一方勝出，避免孩子進度被舊檔覆蓋。
 */
import { cloudApi, decideMerge, extractMetrics, getCloudMode, type CloudLoadResult, type CloudSaveSummary } from "@/game/cloudSync";
import { hashParentPin, isValidParentPin } from "@/game/mainlineFeatures";

const RPG_KEY = "xue-adventure-rpg-v1";
const BX_KEY = "bx_state_v1";

export type PinSyncResult =
  | { ok: true; summary?: CloudSaveSummary; message?: string }
  | { ok: false; reason: "invalidPin" | "pinMismatch" | "notFound" | "network" | "error"; message?: string };

/** 由 PIN 導出穩定且符合伺服器規則（2–6 字、中英數字）的雲端船籍名。 */
export function pinCloudName(pin: string): string {
  const hash = hashParentPin(pin);
  // "p" + hash 前 5 碼 = 6 字元；hash 穩定，同 PIN 一定同名。
  return `p${hash.slice(0, 5)}`;
}

function safeWrite(key: string, value: string | null) {
  if (value === null) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // 隱私模式或儲存空間不足時不阻塞流程。
  }
}

/**
 * 用 PIN 把目前進度備份到雲端。若船籍不存在會自動建立（taken 視為已存在，直接覆寫）。
 */
export async function saveProgressWithPin(pin: string): Promise<PinSyncResult> {
  if (!isValidParentPin(pin)) return { ok: false, reason: "invalidPin", message: "請輸入 4 位數字 PIN 碼。" };

  const name = pinCloudName(pin);
  const payload = { v: 1 as const, rpg: localStorage.getItem(RPG_KEY), bx: localStorage.getItem(BX_KEY), savedAt: Date.now() };
  const metrics = extractMetrics();

  try {
    const register = (await cloudApi.register({ name, payload, metrics })) as { ok: true } | { ok: false; reason: "taken" | "invalid" | "error"; message?: string };
    if (!register.ok && register.reason !== "taken") {
      return { ok: false, reason: "error", message: register.message ?? "無法建立雲端船籍。" };
    }
    await cloudApi.save({ name, payload, metrics });
    const summary: CloudSaveSummary = { name, payload, coins: metrics.coins, totalAnswers: metrics.totalAnswers, badges: metrics.badges, updatedAt: Date.now() };
    return { ok: true, summary };
  } catch {
    return { ok: false, reason: "network", message: "網路連線失敗，請確認網路後再試。" };
  }
}

/**
 * 用 PIN 從雲端載回進度。本機已有進度時取較新的一方；雲端無資料回 notFound。
 */
export async function loadProgressWithPin(pin: string): Promise<PinSyncResult> {
  if (!isValidParentPin(pin)) return { ok: false, reason: "invalidPin", message: "請輸入 4 位數字 PIN 碼。" };

  const name = pinCloudName(pin);

  let result: CloudLoadResult;
  try {
    result = (await cloudApi.load({ name })) as CloudLoadResult;
  } catch {
    return { ok: false, reason: "network", message: "網路連線失敗，請確認網路後再試。" };
  }
  if (!result.ok) {
    if (result.reason === "notFound") return { ok: false, reason: "notFound", message: "這個 PIN 還沒有雲端備份，先「儲存到雲端」一次吧。" };
    return { ok: false, reason: "error", message: result.message ?? "載入失敗。" };
  }

  const remote = result.save;
  const localMetrics = extractMetrics();
  const local = { coins: localMetrics.coins, totalAnswers: localMetrics.totalAnswers, badges: localMetrics.badges };
  const remoteMetrics = { coins: remote.coins, totalAnswers: remote.totalAnswers, badges: remote.badges };
  const winner = decideMerge(local, remoteMetrics);

  if (winner === "remote" || getCloudMode().mode !== "cloud") {
    safeWrite(RPG_KEY, remote.payload.rpg);
    safeWrite(BX_KEY, remote.payload.bx);
    return { ok: true, summary: remote };
  }
  // 本機較新：保留本機資料，不覆蓋孩子的新進度。
  return { ok: true, summary: remote, message: "本機進度較新，已保留本機資料；雲端備份維持原樣。" };
}
