import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchRemoteSpeech,
  isRemoteSpeechDisabled,
  resetRemoteSpeechBreaker,
} from "./speechRemote";

/** 以假 tRPC client 驗證分頁級熔斷：連續拿不到音檔 → 停用遠端 → 零請求。 */
const queryMock = vi.fn();
vi.mock("@trpc/client", () => ({
  createTRPCClient: () => ({ tts: { synthesize: { query: queryMock } } }),
  httpBatchLink: () => ({}) as never,
}));

function audioB64(): string {
  return Buffer.from([0x49, 0x44, 0x33]).toString("base64"); // 無意義但合法的 mp3 前導
}

beforeEach(() => {
  resetRemoteSpeechBreaker();
  queryMock.mockReset();
});

describe("speechRemote：遠端朗讀取音的分頁級熔斷", () => {
  it("拿到音檔 → 回傳 Blob，且不觸發熔斷", async () => {
    queryMock.mockResolvedValue({ audio: audioB64(), mime: "audio/mpeg" });
    const blob = await fetchRemoteSpeech("你好", 1);
    expect(blob).toBeTruthy();
    expect(isRemoteSpeechDisabled()).toBe(false);
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("伺服器回 audio:null 連續 2 次 → 熔斷，之後零網路請求", async () => {
    queryMock.mockResolvedValue({ audio: null });
    expect(await fetchRemoteSpeech("第一句", 1)).toBeNull();
    expect(await fetchRemoteSpeech("第二句", 1)).toBeNull();
    expect(isRemoteSpeechDisabled()).toBe(true);
    expect(queryMock).toHaveBeenCalledTimes(2);

    // 已熔斷：立即回 null，且完全不再呼叫 query
    expect(await fetchRemoteSpeech("第三句", 1)).toBeNull();
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("中途成功會復歸計數（不會累進到熔斷）", async () => {
    queryMock
      .mockResolvedValueOnce({ audio: null })
      .mockResolvedValueOnce({ audio: audioB64(), mime: "audio/mpeg" })
      .mockResolvedValueOnce({ audio: null });
    expect(await fetchRemoteSpeech("一", 1)).toBeNull();
    expect(await fetchRemoteSpeech("二", 1)).toBeTruthy();
    expect(isRemoteSpeechDisabled()).toBe(false);
    // 再失敗一次仍小於上限 2
    expect(await fetchRemoteSpeech("三", 1)).toBeNull();
    expect(isRemoteSpeechDisabled()).toBe(false);
  });

  it("網路例外同樣計入熔斷", async () => {
    queryMock.mockRejectedValueOnce(new Error("network down"));
    expect(await fetchRemoteSpeech("離線", 1)).toBeNull();
    expect(isRemoteSpeechDisabled()).toBe(false); // 第 1 次尚不熔斷
    queryMock.mockResolvedValue({ audio: null });
    expect(await fetchRemoteSpeech("再試", 1)).toBeNull();
    expect(isRemoteSpeechDisabled()).toBe(true);
  });
});
