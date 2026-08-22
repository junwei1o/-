export type SpeechPreferences = {
  volume: number;
  rate: number;
};

export const SPEECH_PREFERENCES_KEY = "xue-adventure-speech-preferences-v1";
export const DEFAULT_SPEECH_PREFERENCES: SpeechPreferences = { volume: 1, rate: 0.92 };
export const SPEECH_VOLUME_MIN = 0;
export const SPEECH_VOLUME_MAX = 1;
export const SPEECH_RATE_MIN = 0.6;
export const SPEECH_RATE_MAX = 1.4;

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, number));
}

export function normalizeSpeechPreferences(value: unknown): SpeechPreferences {
  const data = value && typeof value === "object" ? value as Partial<SpeechPreferences> : {};
  return {
    volume: clamp(data.volume, SPEECH_VOLUME_MIN, SPEECH_VOLUME_MAX, DEFAULT_SPEECH_PREFERENCES.volume),
    rate: clamp(data.rate, SPEECH_RATE_MIN, SPEECH_RATE_MAX, DEFAULT_SPEECH_PREFERENCES.rate),
  };
}

export function loadSpeechPreferences(storage: Pick<Storage, "getItem" | "removeItem"> = localStorage): SpeechPreferences {
  try {
    const raw = storage.getItem(SPEECH_PREFERENCES_KEY);
    if (!raw) return DEFAULT_SPEECH_PREFERENCES;
    return normalizeSpeechPreferences(JSON.parse(raw));
  } catch {
    try { storage.removeItem(SPEECH_PREFERENCES_KEY); } catch { /* private browsing can block storage */ }
    return DEFAULT_SPEECH_PREFERENCES;
  }
}

export function saveSpeechPreferences(preferences: SpeechPreferences, storage: Pick<Storage, "setItem"> = localStorage) {
  try {
    storage.setItem(SPEECH_PREFERENCES_KEY, JSON.stringify({ version: 1, ...normalizeSpeechPreferences(preferences) }));
  } catch { /* private browsing can block storage */ }
}

export function formatSpeechVolume(volume: number) {
  return `${Math.round(normalizeSpeechPreferences({ volume, rate: DEFAULT_SPEECH_PREFERENCES.rate }).volume * 100)}%`;
}

export function formatSpeechRate(rate: number) {
  return `${normalizeSpeechPreferences({ volume: DEFAULT_SPEECH_PREFERENCES.volume, rate }).rate.toFixed(2)} 倍`;
}
