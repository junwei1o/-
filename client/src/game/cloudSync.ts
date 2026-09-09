import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";

/**
 * 雲端船籍同步層（免註冊，名字即身分）。
 * - 模式記在 localStorage `xue-cloud-mode-v1`：local（預設）或 cloud（含名字）。
 * - 雲端模式下：答題後 5 秒防抖上傳整包進度；試卷完成即時寫航行紀錄；
 *   頁面隱藏（切分頁/關閉）時補上傳，斷線失敗靜默、下次答題自動補。
 * - 載入時以「進度較高者勝出」合併（先比作答數，平手比金幣），避免誤蓋。
 */

const CLOUD_MODE_KEY = "xue-cloud-mode-v1";
const RPG_KEY = "xue-adventure-rpg-v1";
const BX_KEY = "bx_state_v1";
const SYNC_DEBOUNCE_MS = 5_000;

export interface CloudModeState {
  mode: "local" | "cloud";
  name?: string;
  linkedAt?: number;
}

export interface CloudPayload {
  v: 1;
  rpg: string | null;
  bx: string | null;
  savedAt: number;
}

export interface CloudMetrics {
  coins: number;
  totalAnswers: number;
  badges: number;
}

export interface CloudSaveSummary extends CloudMetrics {
  name: string;
  payload: CloudPayload;
  updatedAt: number;
}

export type CloudRegisterResult = { ok: true } | { ok: false; reason: "taken" | "invalid" | "error"; message?: string };
export type CloudLoadResult = { ok: true; save: CloudSaveSummary } | { ok: false; reason: "notFound" | "invalid" | "error"; message?: string };

/* ---------- tRPC 呼叫層（測試可整包 mock） ---------- */

let client: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;
function getClient() {
  if (!client) {
    client = createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
    });
  }
  return client;
}

export const cloudApi = {
  register: (input: { name: string; payload: CloudPayload; metrics: CloudMetrics }) => getClient().cloud.register.mutate(input),
  load: (input: { name: string }) => getClient().cloud.load.query(input),
  save: (input: { name: string; payload: CloudPayload; metrics: CloudMetrics }) => getClient().cloud.save.mutate(input),
  recordExam: (input: { name: string; subject: string; grade?: number; difficulty?: string; totalQuestions: number; correctCount: number; detail?: unknown }) =>
    getClient().cloud.recordExam.mutate(input),
  listExams: (input: { name: string; limit?: number }) => getClient().cloud.listExams.query(input),
};

/* ---------- 模式儲存 ---------- */

export function getCloudMode(storage: Pick<Storage, "getItem"> = localStorage): CloudModeState {
  try {
    const raw = storage.getItem(CLOUD_MODE_KEY);
    if (!raw) return { mode: "local" };
    const parsed = JSON.parse(raw) as Partial<CloudModeState>;
    if (parsed.mode === "cloud" && typeof parsed.name === "string" && parsed.name) {
      return { mode: "cloud", name: parsed.name, linkedAt: typeof parsed.linkedAt === "number" ? parsed.linkedAt : undefined };
    }
    return { mode: "local" };
  } catch {
    return { mode: "local" };
  }
}

function setCloudMode(state: CloudModeState, storage: Pick<Storage, "setItem"> = localStorage) {
  storage.setItem(CLOUD_MODE_KEY, JSON.stringify(state));
}

/** 是否已選過儲存方式（進站卡只問一次）。 */
export function hasChosenMode(storage: Pick<Storage, "getItem"> = localStorage): boolean {
  try {
    return storage.getItem(CLOUD_MODE_KEY) !== null;
  } catch {
    return true; // 讀不到就不打擾
  }
}

/** 選擇「存在這台裝置」：雲端船籍也會切回本機（本機資料保留）。 */
export function chooseLocalMode() {
  setCloudMode({ mode: "local" });
}

/* ---------- 名字驗證（與 server zod 規則一致） ---------- */

export function validateCloudName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "名字至少 2 個字";
  if (trimmed.length > 6) return "名字最多 6 個字";
  if (!/^[一-鿿A-Za-z0-9]+$/.test(trimmed)) return "名字請用中文字或英數字";
  return null;
}

/* ---------- 進度打包與合併 ---------- */

function safeParse(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function buildPayload(storage: Pick<Storage, "getItem"> = localStorage): CloudPayload {
  return { v: 1, rpg: storage.getItem(RPG_KEY), bx: storage.getItem(BX_KEY), savedAt: Date.now() };
}

export function extractMetrics(storage: Pick<Storage, "getItem"> = localStorage): CloudMetrics {
  const rpg = safeParse(storage.getItem(RPG_KEY));
  const bx = safeParse(storage.getItem(BX_KEY));
  const coins = typeof rpg?.coins === "number" && rpg.coins >= 0 ? Math.floor(rpg.coins) : 0;
  const answered = Array.isArray(rpg?.answeredEventIds) ? rpg.answeredEventIds.length : 0;
  const bxStats = (bx?.stats ?? null) as { totalAnswers?: unknown } | null;
  const bxTotal = typeof bxStats?.totalAnswers === "number" ? bxStats.totalAnswers : 0;
  const badges = Array.isArray(bx?.badges) ? bx.badges.length : 0;
  return { coins, totalAnswers: Math.max(answered, bxTotal), badges };
}

/** 進度較高者勝出：先比作答數，平手比金幣，再平手保留本機（避免孩子進度被舊檔蓋掉）。 */
export function decideMerge(local: CloudMetrics, remote: CloudMetrics): "local" | "remote" {
  if (remote.totalAnswers !== local.totalAnswers) return remote.totalAnswers > local.totalAnswers ? "remote" : "local";
  if (remote.coins !== local.coins) return remote.coins > local.coins ? "remote" : "local";
  return "local";
}

/* ---------- 同步引擎 ---------- */

let syncTimer: number | null = null;
let syncListenerBound = false;
let lastSyncAt: number | null = null;

export function getLastSyncAt() {
  return lastSyncAt;
}

/** 雲端模式下立即上傳一次整包進度；失敗靜默（下次答題會再觸發）。 */
export async function pushSaveNow(): Promise<boolean> {
  const mode = getCloudMode();
  if (mode.mode !== "cloud" || !mode.name) return false;
  try {
    await cloudApi.save({ name: mode.name, payload: buildPayload(), metrics: extractMetrics() });
    lastSyncAt = Date.now();
    return true;
  } catch {
    return false;
  }
}

/** 標記有進度變更；雲端模式下 5 秒防抖上傳。 */
export function markDirty() {
  const mode = getCloudMode();
  if (mode.mode !== "cloud" || !mode.name) return;
  if (typeof window === "undefined") return;
  if (syncTimer !== null) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    syncTimer = null;
    void pushSaveNow();
  }, SYNC_DEBOUNCE_MS);
  if (!syncListenerBound) {
    syncListenerBound = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && syncTimer !== null) {
        window.clearTimeout(syncTimer);
        syncTimer = null;
        void pushSaveNow();
      }
    });
  }
}

/* ---------- 開船／回航／認船 ---------- */

/** 開船：以本機現有進度建立新船籍。名字被佔用時回傳 taken。 */
export async function registerCloud(rawName: string): Promise<CloudRegisterResult> {
  const name = rawName.trim();
  const invalid = validateCloudName(name);
  if (invalid) return { ok: false, reason: "invalid", message: invalid };
  try {
    const result = await cloudApi.register({ name, payload: buildPayload(), metrics: extractMetrics() });
    if (!result.ok) return { ok: false, reason: result.reason };
    setCloudMode({ mode: "cloud", name, linkedAt: Date.now() });
    lastSyncAt = Date.now();
    return { ok: true };
  } catch {
    return { ok: false, reason: "error", message: "雲端連線不穩，請稍後再試" };
  }
}

/** 回航第一步：讀取船籍摘要供「認船」確認。 */
export async function loadCloud(rawName: string): Promise<CloudLoadResult> {
  const name = rawName.trim();
  const invalid = validateCloudName(name);
  if (invalid) return { ok: false, reason: "invalid", message: invalid };
  try {
    const result = await cloudApi.load({ name });
    if (!result.ok) return { ok: false, reason: result.reason };
    return { ok: true, save: result.save as CloudSaveSummary };
  } catch {
    return { ok: false, reason: "error", message: "雲端連線不穩，請稍後再試" };
  }
}

/**
 * 認船確認後套用：進度較高者勝出。
 * 雲端勝 → 寫入本機並回傳 "remote"（呼叫端負責重新整理讓各 store 重讀）；
 * 本機勝 → 以本機覆寫雲端，回傳 "local"。
 */
export async function applyCloudSave(save: CloudSaveSummary): Promise<"local" | "remote"> {
  const decision = decideMerge(extractMetrics(), save);
  setCloudMode({ mode: "cloud", name: save.name, linkedAt: Date.now() });
  if (decision === "remote") {
    if (save.payload.rpg !== null) localStorage.setItem(RPG_KEY, save.payload.rpg);
    if (save.payload.bx !== null) localStorage.setItem(BX_KEY, save.payload.bx);
    return "remote";
  }
  await pushSaveNow();
  return "local";
}

/* ---------- 試卷航行紀錄 ---------- */

export interface CloudExamInput {
  subject: string;
  grade?: number;
  difficulty?: string;
  totalQuestions: number;
  correctCount: number;
  detail?: unknown;
}

/** 試卷完成即時記錄一筆（fire-and-forget，失敗不影響作答流程），並觸發整包進度同步。 */
export function recordExamCloud(input: CloudExamInput) {
  const mode = getCloudMode();
  if (mode.mode !== "cloud" || !mode.name) return;
  markDirty();
  void cloudApi
    .recordExam({ name: mode.name, ...input })
    .catch(() => {
      // 斷線靜默：整包進度仍會由 markDirty 補上傳。
    });
}
