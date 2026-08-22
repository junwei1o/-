// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { PAPER_STRATEGY_CUE_ENABLED_KEY, loadPaperStrategyCueEnabled, playPaperStrategyCue, savePaperStrategyCueEnabled } from "./paperExamStrategyCue";

const originalAudioContext = window.AudioContext;

describe("paper exam strategy cue", () => {
  afterEach(() => {
    window.localStorage.removeItem(PAPER_STRATEGY_CUE_ENABLED_KEY);
    Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
  });

  it("defaults to enabled and persists a learner-controlled audio preference", () => {
    expect(loadPaperStrategyCueEnabled()).toBe(true);
    savePaperStrategyCueEnabled(false);
    expect(loadPaperStrategyCueEnabled()).toBe(false);
    savePaperStrategyCueEnabled(true);
    expect(loadPaperStrategyCueEnabled()).toBe(true);
  });

  it("creates a short low-volume browser cue only when the preference is enabled", () => {
    const close = vi.fn();
    const oscillator = {
      type: "sine" as OscillatorType,
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: (_event: string, listener: () => void) => listener(),
    };
    const gain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
    const AudioContextMock = vi.fn(() => ({ currentTime: 0, createOscillator: () => oscillator, createGain: () => gain, destination: {}, close }));
    Object.defineProperty(window, "AudioContext", { configurable: true, value: AudioContextMock });

    playPaperStrategyCue(false);
    expect(AudioContextMock).not.toHaveBeenCalled();

    playPaperStrategyCue(true);
    expect(AudioContextMock).toHaveBeenCalledOnce();
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(392, 0);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.035, 0.035);
    expect(close).toHaveBeenCalledOnce();
  });

  it("safely preserves visual guidance when browser audio is unavailable", () => {
    expect(() => playPaperStrategyCue(true)).not.toThrow();
  });
});
