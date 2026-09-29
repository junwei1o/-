import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";

/**
 * 遠端朗讀取音（Edge TTS）。
 *
 * ⚠️ 現狀（2026-09-30 朗讀巡檢核實）：**本模組尚未在生產接線**。
 * 全站沒有任何非測試程式呼叫 setRemoteSpeechFetcher（main.tsx 並未注入），
 * 語音控制器的 remoteFetcher 恆為 null → 朗讀一律走瀏覽器內建語音，
 * 本檔的請求路徑實際是「備而未用」（舊註解稱「主程式啟動時注入」已不符事實）。
 * 另經實測：線上 tts.synthesize 目前回 audio:null（Render 未設
 * EDGE_TTS_PYTHON、系統 python 亦無 edge-tts 模組）。
 *
 * 啟用路線（兩步缺一不可，屬決策項、尚未執行）：
 *   1. Render 設 EDGE_TTS_PYTHON，確保該直譯器可載入 edge-tts 模組；
 *   2. main.tsx 啟動時注入 setRemoteSpeechFetcher(fetchRemoteSpeech)。
 * ⚠️ 切勿只做第 2 步：伺服器無法供音時，每句朗讀會先等一次失敗往返再
 * 退位，等於白白拖慢所有朗讀——先讓 1 通過再接 2。
 *
 * 測試與離線場景都不會真的發請求；任何失敗一律回 null，
 * 由語音控制器退回瀏覽器內建語音。
 */

const REMOTE_TIMEOUT_MS = 5_000;

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
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: "audio/mpeg" });
  } catch {
    return null;
  }
}

export async function fetchRemoteSpeech(text: string, rate: number): Promise<Blob | null> {
  try {
    const result = await getClient().tts.synthesize.query(
      { text, rate },
      { signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS) },
    );
    return result?.audio ? base64ToBlob(result.audio) : null;
  } catch {
    return null; // 離線／逾時／伺服器未啟動 → 交回本機語音
  }
}
