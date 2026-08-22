import { DEFAULT_SPEECH_PREFERENCES, normalizeSpeechPreferences, type SpeechPreferences } from "@/lib/speechPreferences";

export type SpeechStatus = "idle" | "speaking" | "paused" | "unsupported" | "error";

export type SpeechProgress = {
  charIndex: number;
  charLength: number;
};

export type SpeechProgressCallback = (progress: SpeechProgress | null) => void;

type SpeechEngine = Pick<SpeechSynthesis, "speak" | "cancel" | "getVoices"> & {
  speaking?: boolean;
  paused?: boolean;
  pause?: () => void;
  resume?: () => void;
};

export type SpeechController = {
  speak: (text: string, onStatus?: (status: SpeechStatus) => void, onProgress?: SpeechProgressCallback) => boolean;
  pause: (onStatus?: (status: SpeechStatus) => void) => boolean;
  resume: (onStatus?: (status: SpeechStatus) => void) => boolean;
  stop: (onStatus?: (status: SpeechStatus) => void) => void;
  setPreferences: (preferences: SpeechPreferences) => void;
  isSupported: boolean;
};

function chooseTraditionalChineseVoice(voices: SpeechSynthesisVoice[]) {
  return voices.find((voice) => voice.lang.toLowerCase() === "zh-tw")
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("zh-tw"))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("zh"));
}

export function createSpeechController(engine?: SpeechEngine | null): SpeechController {
  const speechEngine = engine ?? (typeof window !== "undefined" ? window.speechSynthesis : null);
  const isSupported = Boolean(speechEngine && typeof SpeechSynthesisUtterance !== "undefined");
  let activeUtterance: SpeechSynthesisUtterance | null = null;
  let activeProgressCallback: SpeechProgressCallback | undefined;
  let lastText = "";
  let lastStartedAt = 0;
  let preferences = DEFAULT_SPEECH_PREFERENCES;

  const stop = (onStatus?: (status: SpeechStatus) => void) => {
    if (speechEngine) speechEngine.cancel();
    activeUtterance = null;
    activeProgressCallback?.(null);
    activeProgressCallback = undefined;
    onStatus?.(isSupported ? "idle" : "unsupported");
  };

  const pause = (onStatus?: (status: SpeechStatus) => void) => {
    if (!isSupported || !speechEngine || !activeUtterance || typeof speechEngine.pause !== "function") return false;
    speechEngine.pause();
    onStatus?.("paused");
    return true;
  };

  const resume = (onStatus?: (status: SpeechStatus) => void) => {
    if (!isSupported || !speechEngine || !activeUtterance || typeof speechEngine.resume !== "function") return false;
    speechEngine.resume();
    onStatus?.("speaking");
    return true;
  };

  const speak = (text: string, onStatus?: (status: SpeechStatus) => void, onProgress?: SpeechProgressCallback) => {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!isSupported || !speechEngine) {
      onStatus?.("unsupported");
      return false;
    }
    if (!normalized) return false;

    const now = Date.now();
    if (activeUtterance && lastText === normalized && now - lastStartedAt < 700) return false;

    speechEngine.cancel();
    activeProgressCallback?.(null);
    activeProgressCallback = onProgress;
    const utterance = new SpeechSynthesisUtterance(normalized);
    utterance.lang = "zh-TW";
    utterance.volume = preferences.volume;
    utterance.rate = preferences.rate;
    utterance.pitch = 1;
    const voice = chooseTraditionalChineseVoice(speechEngine.getVoices());
    if (voice) utterance.voice = voice;

    activeUtterance = utterance;
    lastText = normalized;
    lastStartedAt = now;
    utterance.onstart = () => onStatus?.("speaking");
    utterance.onend = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
        activeProgressCallback?.(null);
        activeProgressCallback = undefined;
        onStatus?.("idle");
      }
    };
    utterance.onerror = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
        activeProgressCallback?.(null);
        activeProgressCallback = undefined;
        onStatus?.("error");
      }
    };
    utterance.onboundary = (event) => {
      if (activeUtterance !== utterance) return;
      onProgress?.({
        charIndex: Number.isFinite(event.charIndex) ? event.charIndex : 0,
        charLength: Number.isFinite(event.charLength) ? event.charLength : 0,
      });
    };
    onStatus?.("speaking");
    speechEngine.speak(utterance);
    return true;
  };

  const setPreferences = (nextPreferences: SpeechPreferences) => {
    preferences = normalizeSpeechPreferences(nextPreferences);
  };

  return { speak, pause, resume, stop, setPreferences, isSupported };
}

export function buildQuestionSpeechText(prompt: string, options: string[]) {
  const choices = options.map((option, index) => `${String.fromCharCode(65 + index)}、${option}`).join("；");
  return `題目：${prompt} 選項：${choices}`;
}
