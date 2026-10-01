import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";

/**
 * 遠端朗讀取音（Edge TTS）。
 *
 * 接線狀態（2026-09-30 全接入輪）：已由 main.tsx 注入語音控制器，
 * 全站朗讀入口（PaperExam／TriAxis／教室遊戲／週測…）一律先走本路徑，
 * 失敗自動退回瀏覽器內建語音。
 *
 * 供應鏈狀態：線上 tts 目前回 audio:null（Render 未裝 edge-tts）——
 * 部署後以 tts.health 端點診斷各 python 候選。若供應鏈未就緒，
 * 本模組的**分頁級熔斷**保證代價有界：連續 FAILURE_LIMIT 次拿不到音檔
 * 即停用遠端（後續呼叫立即回 null、不發請求），每分頁最多失敗來回
 * FAILURE_LIMIT 次——這讓「先注入、供應鏈後補」成為安全順序。
 *
 * 測試與離線場景不會真的發請求；任何失敗一律回 null，
 * 由語音控制器退回瀏覽器內建語音。
 */

/**
 * 伺服器端合成耗時模型（2026-10-01 線上實測，Render 免費層、edge-tts 已裝）：
 *   `耗時 ≈ 3.1 秒固定成本 ＋ 每字約 28 毫秒`
 *   8 字 → 3.36 s｜34 字 → 4.22 s｜103 字 → 6.04 s
 * 固定成本來自 spawn python ＋ 載入 edge_tts 模組 ＋ 連微軟 TTS 服務，
 * 與文字長度無關；因此**短文也要 3 秒起跳**。
 *
 * 逾時值必須涵蓋「我們願意送出去的最長文字」，否則會出現
 * 「伺服器其實會成功、前端卻先逾時」的靜默降級（原本 5 秒就踩到這個坑：
 * 逾時 5 s 只能容納約 68 字，而題目＋選項＋解析常超過）。
 * 8 秒可涵蓋約 175 字；搭配下方 MAX_REMOTE_CHARS 留出安全邊界。
 */
const REMOTE_TIMEOUT_MS = 8_000;
/**
 * 超過此字數直接走瀏覽器內建語音，**不送遠端**（2026-10-01 新增）。
 * 理由：長文本的合成時間必然逼近／超過逾時，送出去只是白等一趟來回
 * （學生仍要等，最後還是退回本機語音）。以實測模型估算，120 字約需
 * 3.1 + 0.028×120 ≈ 6.5 秒，仍在 8 秒逾時內、且留約 1.5 秒餘裕。
 */
const MAX_REMOTE_CHARS = 120;
/** 分頁級熔斷：連續拿不到音檔的次數上限（含 audio:null 與例外）。 */
const FAILURE_LIMIT = 2;

let consecutiveNulls = 0;
let disabledForSession = false;

/** 診斷/測試用：當前分頁的遠端是否已熔斷。 */
export function isRemoteSpeechDisabled(): boolean {
  return disabledForSession;
}

/** 測試用：重置分頁級熔斷狀態。 */
export function resetRemoteSpeechBreaker(): void {
  consecutiveNulls = 0;
  disabledForSession = false;
}

let client: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;
function getClient() {
  if (!client) {
    client = createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
    });
  }
  return client;
}

function base64ToBlob(base64: string): Blob | null {
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: "audio/mpeg" });
  } catch {
    return null;
  }
}

export async function fetchRemoteSpeech(text: string, rate: number): Promise<Blob | null> {
  // 已熔斷：立即退位，不再花費任何網路時間。
  if (disabledForSession) return null;
  // 過長文字：不送遠端（合成必然逼近逾時，只是白等一趟來回）→ 立刻交回本機語音。
  if (text.trim().length > MAX_REMOTE_CHARS) return null;
  try {
    const result = await getClient().tts.synthesize.query(
      { text, rate },
      { signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS) },
    );
    const blob = result?.audio ? base64ToBlob(result.audio) : null;
    if (blob) {
      consecutiveNulls = 0; // 成功即復歸
      return blob;
    }
    // 伺服器回 audio:null（edge-tts 未裝／供應端熔斷中）
    consecutiveNulls += 1;
    if (consecutiveNulls >= FAILURE_LIMIT) disabledForSession = true;
    return null;
  } catch {
    // 離線／逾時／伺服器未啟動 → 交回本機語音；連續失敗同樣觸發分頁級熔斷
    consecutiveNulls += 1;
    if (consecutiveNulls >= FAILURE_LIMIT) disabledForSession = true;
    return null;
  }
}
