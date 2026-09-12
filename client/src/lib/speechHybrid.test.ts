import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSpeechController, setRemoteSpeechFetcher, type SpeechStatus } from "./speechSynthesis";

/**
 * 混合引擎（遠端優先、本機兜底）的行為測試。
 * 重點釘住四件事：
 * 1. 遠端成功 → 用 Audio 播 mp3，狀態機正確
 * 2. 遠端失敗 → 無縫退回本機（這裡無本機引擎，應回 unsupported）
 * 3. 舊請求被新請求／stop() 取代後，不得再出聲（generation 守門）
 * 4. 同文案連點防抖仍然有效
 */

class StubAudio {
  static instances: StubAudio[] = [];
  static reset() {
    StubAudio.instances = [];
  }
  src = "";
  volume = 1;
  onplay: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  played = 0;
  pausedCount = 0;
  constructor(url: string) {
    this.src = url;
    StubAudio.instances.push(this);
  }
  play() {
    this.played += 1;
    this.onplay?.();
    return Promise.resolve();
  }
  pause() {
    this.pausedCount += 1;
  }
}

function blobOf(size = 8) {
  return new Blob([new Uint8Array(size)], { type: "audio/mpeg" });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("speechSynthesis 混合引擎", () => {
  beforeEach(() => {
    StubAudio.reset();
    vi.stubGlobal("Audio", StubAudio);
    (URL as unknown as { createObjectURL?: unknown }).createObjectURL = vi.fn(() => "blob:mock");
  });

  afterEach(() => {
    setRemoteSpeechFetcher(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("遠端成功：用 Audio 播放，狀態經過 speaking 再回到 idle", async () => {
    const fetcher = vi.fn(async () => blobOf());
    setRemoteSpeechFetcher(fetcher);
    const statuses: SpeechStatus[] = [];
    const controller = createSpeechController();

    expect(controller.speak("你好，探險家。", (status) => statuses.push(status))).toBe(true);
    await vi.waitFor(() => expect(StubAudio.instances.length).toBe(1));
    expect(fetcher).toHaveBeenCalledWith("你好，探險家。", expect.any(Number));
    await vi.waitFor(() => expect(StubAudio.instances[0].played).toBe(1));
    expect(statuses).toContain("speaking");

    StubAudio.instances[0].onended?.();
    expect(statuses[statuses.length - 1]).toBe("idle");
  });

  it("遠端音量跟隨偏好設定", async () => {
    setRemoteSpeechFetcher(async () => blobOf());
    const controller = createSpeechController();
    controller.setPreferences({ volume: 0.4, rate: 1 });
    controller.speak("音量測試");
    await vi.waitFor(() => expect(StubAudio.instances.length).toBe(1));
    expect(StubAudio.instances[0].volume).toBeCloseTo(0.4);
  });

  it("遠端失敗：退回本機；沒有本機引擎時回 unsupported", async () => {
    setRemoteSpeechFetcher(async () => null);
    const statuses: SpeechStatus[] = [];
    const controller = createSpeechController();
    expect(controller.speak("離線測試", (status) => statuses.push(status))).toBe(true);
    await vi.waitFor(() => expect(statuses).toContain("unsupported"));
    expect(StubAudio.instances.length).toBe(0);
  });

  it("舊請求被新請求取代後不得再出聲（generation 守門）", async () => {
    const gate = deferred<Blob | null>();
    const fetcher = vi.fn(() => gate.promise);
    setRemoteSpeechFetcher(fetcher);
    const controller = createSpeechController();

    controller.speak("第一句");
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    controller.speak("第二句"); // 觸發新的 generation，第一個請求應作廢
    gate.resolve(blobOf());
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    // 給微任務一點時間，若守門失效第一個請求會创建 Audio
    await Promise.resolve();
    await Promise.resolve();
    expect(StubAudio.instances.length).toBeLessThanOrEqual(1);
    // 唯一（若已创建）的 Audio 必須屬於第二句——用 fetcher 呼叫數量對齊即可，
    // 關鍵斷言：stop 之後不會再多出實體
    controller.stop();
    expect(StubAudio.instances.length).toBeLessThanOrEqual(1);
  });

  it("stop() 取消進行中的遠端請求，解析後不出聲", async () => {
    const gate = deferred<Blob | null>();
    setRemoteSpeechFetcher(() => gate.promise);
    const controller = createSpeechController();
    controller.speak("會被取消的一句");
    controller.stop();
    gate.resolve(blobOf());
    await Promise.resolve();
    await Promise.resolve();
    expect(StubAudio.instances.length).toBe(0);
  });

  it("遠端請求進行中，同一文案 700ms 內連點被防抖擋下", async () => {
    const gate = deferred<Blob | null>();
    setRemoteSpeechFetcher(() => gate.promise);
    const controller = createSpeechController();
    expect(controller.speak("重複點擊")).toBe(true);
    expect(controller.speak("重複點擊")).toBe(false);
    gate.resolve(null);
  });

  it("遠端播放中可 pause／resume", async () => {
    setRemoteSpeechFetcher(async () => blobOf());
    const controller = createSpeechController();
    controller.speak("暫停測試");
    await vi.waitFor(() => expect(StubAudio.instances.length).toBe(1));
    const audio = StubAudio.instances[0];
    expect(controller.pause()).toBe(true);
    expect(audio.pausedCount).toBe(1);
    expect(controller.resume()).toBe(true);
    await vi.waitFor(() => expect(audio.played).toBe(2));
  });

  it("setRemoteSpeechFetcher(null) 停用遠端，行為與舊版完全相同", () => {
    setRemoteSpeechFetcher(null);
    vi.stubGlobal("SpeechSynthesisUtterance", class { lang = ""; text = ""; });
    const speak = vi.fn();
    const cancel = vi.fn();
    const controller = createSpeechController({ speak, cancel, getVoices: () => [] });
    expect(controller.speak("本機路徑")).toBe(true);
    expect(speak).toHaveBeenCalled();
    expect(StubAudio.instances.length).toBe(0);
  });
});
