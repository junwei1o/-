import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildQuestionSpeechText, createSpeechController } from "./speechSynthesis";

class MockUtterance {
  text: string;
  lang = "";
  rate = 0;
  volume = 0;
  pitch = 0;
  voice?: SpeechSynthesisVoice;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onboundary: ((event: { charIndex: number; charLength: number }) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe("speech synthesis controller", () => {
  beforeEach(() => {
    vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
  });

  it("builds a readable question with labelled options", () => {
    expect(buildQuestionSpeechText("海水為什麼是鹹的？", ["因為鹽分", "因為砂糖"])).toBe(
      "題目：海水為什麼是鹹的？ 選項：A、因為鹽分；B、因為砂糖",
    );
  });

  it("selects a zh-TW voice and prevents immediate duplicate playback", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const controller = createSpeechController({
      speak,
      cancel,
      getVoices: () => [{ lang: "zh-TW" } as SpeechSynthesisVoice],
    });
    const first = controller.speak("題目內容");
    const second = controller.speak("題目內容");

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
    const utterance = speak.mock.calls[0]?.[0] as MockUtterance;
    expect(utterance.lang).toBe("zh-TW");
    expect(utterance.voice?.lang).toBe("zh-TW");
  });

  it("applies updated volume and rate preferences to the next utterance", () => {
    const speak = vi.fn();
    const controller = createSpeechController({ speak, cancel: vi.fn(), getVoices: () => [] });
    controller.setPreferences({ volume: 0.35, rate: 1.25 });
    controller.speak("偏好測試");
    const utterance = speak.mock.calls[0]?.[0] as MockUtterance;
    expect(utterance.volume).toBe(0.35);
    expect(utterance.rate).toBe(1.25);
  });

  it("cancels the active utterance before a new question and on stop", () => {
    const cancel = vi.fn();
    const controller = createSpeechController({
      speak: vi.fn(),
      cancel,
      getVoices: () => [],
    });

    controller.speak("第一題");
    controller.speak("第二題");
    controller.stop();

    expect(cancel).toHaveBeenCalledTimes(3);
  });

  it("pauses and resumes an active utterance when the platform exposes those controls", () => {
    const pause = vi.fn();
    const resume = vi.fn();
    const onStatus = vi.fn();
    const controller = createSpeechController({
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: () => [],
      pause,
      resume,
    });

    controller.speak("跨平台朗讀", onStatus);
    expect(controller.pause(onStatus)).toBe(true);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenLastCalledWith("paused");
    expect(controller.resume(onStatus)).toBe(true);
    expect(resume).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenLastCalledWith("speaking");
  });

  it("keeps reading available when pause controls are absent on a browser", () => {
    const controller = createSpeechController({ speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] });
    controller.speak("相容模式", vi.fn());

    expect(controller.pause()).toBe(false);
    expect(controller.resume()).toBe(false);
  });

  it("reports unsupported when no speech engine is available", () => {
    const onStatus = vi.fn();
    const controller = createSpeechController(null);

    expect(controller.isSupported).toBe(false);
    expect(controller.speak("題目", onStatus)).toBe(false);
    expect(onStatus).toHaveBeenCalledWith("unsupported");
  });

  it("reports boundary progress and clears it when the utterance completes", () => {
    const speak = vi.fn();
    const onProgress = vi.fn();
    const controller = createSpeechController({ speak, cancel: vi.fn(), getVoices: () => [] });

    controller.speak("第一句。第二句。", undefined, onProgress);
    const utterance = speak.mock.calls[0]?.[0] as MockUtterance;
    utterance.onboundary?.({ charIndex: 4, charLength: 1 });
    expect(onProgress).toHaveBeenLastCalledWith({ charIndex: 4, charLength: 1 });

    utterance.onend?.();
    expect(onProgress).toHaveBeenLastCalledWith(null);
  });
});

  it("reports speaking immediately and returns to idle when stopped", () => {
    const onStatus = vi.fn();
    const controller = createSpeechController({
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: () => [],
    });

    controller.speak("需要朗讀的題目", onStatus);
    expect(onStatus).toHaveBeenLastCalledWith("speaking");

    controller.stop(onStatus);
    expect(onStatus).toHaveBeenLastCalledWith("idle");
  });
