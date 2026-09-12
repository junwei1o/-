import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";

/**
 * 遠端朗讀取音（Edge TTS）。
 * 只在主程式啟動時被注入語音控制器（見 main.tsx 的 setRemoteSpeechFetcher），
 * 所以測試與離線場景都不會真的發請求。
 * 任何失敗一律回 null，由語音控制器退回瀏覽器內建語音。
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
