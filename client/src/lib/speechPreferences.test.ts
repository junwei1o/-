import { describe, expect, it } from "vitest";
import {
  DEFAULT_SPEECH_PREFERENCES,
  SPEECH_PREFERENCES_KEY,
  loadSpeechPreferences,
  normalizeSpeechPreferences,
  saveSpeechPreferences,
} from "./speechPreferences";

function createStorage(seed?: string) {
  let value = seed ?? null;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => { value = next; },
    removeItem: () => { value = null; },
    read: () => value,
  };
}

describe("speech preferences", () => {
  it("normalizes volume and rate to safe ranges", () => {
    expect(normalizeSpeechPreferences({ volume: 8, rate: 0.1 })).toEqual({ volume: 1, rate: 0.6 });
    expect(normalizeSpeechPreferences({ volume: -2, rate: 3 })).toEqual({ volume: 0, rate: 1.4 });
  });

  it("saves and restores versioned local preferences", () => {
    const storage = createStorage();
    saveSpeechPreferences({ volume: 0.45, rate: 1.15 }, storage);
    const saved = JSON.parse(storage.read() ?? "{}");
    expect(saved).toMatchObject({ version: 1, volume: 0.45, rate: 1.15 });
    expect(SPEECH_PREFERENCES_KEY).toContain("speech-preferences");
    expect(loadSpeechPreferences(storage)).toEqual({ volume: 0.45, rate: 1.15 });
  });

  it("falls back to defaults and clears malformed data", () => {
    const storage = createStorage("not-json");
    expect(loadSpeechPreferences(storage)).toEqual(DEFAULT_SPEECH_PREFERENCES);
    expect(storage.read()).toBeNull();
  });
});
