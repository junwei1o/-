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

/** 遠端 TTS 取流函式：輸入文字與 generation id，回傳音檔 Blob；失敗時回 null（會退回本機）。 */
export type RemoteSpeechFetcher = (text: string, generation: number) => Promise<Blob | null>;

/**
 * 模組級「遠端 speech fetcher」設定。
 * - 有 fetcher：controller.speak 走遠端（Edge TTS / server tts）路徑。
 * - 設為 null：停用遠端，走原本的 window.speechSynthesis 本機路徑。
 *
 * 為什麼是模組級而不是 per-controller：學伴桌多處共用同一個遠端端點；模組級可避免每個
 * component mount 都重新掛一次 fetcher；測試時 afterEach 用 `setRemoteSpeechFetcher(null)`
 * 一鍵還原。
 */
let remoteFetcher: RemoteSpeechFetcher | null = null;

export function setRemoteSpeechFetcher(fetcher: RemoteSpeechFetcher | null): void {
  remoteFetcher = fetcher;
}

/** 模組級 generation 計數器：每次 speak remote 路線會 +1；舊的 pending fetch 解析時若已過期則丟棄。 */
let remoteGenerationCounter = 0;

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

/** Audio 抽象：測試用 vi.stubGlobal("Audio", StubAudio) 注入假物件。 */
type SpeechAudio = {
  src: string;
  volume: number;
  pausedCount: number;
  play: () => Promise<void>;
  pause: () => void;
};

export function createSpeechController(engine?: SpeechEngine | null): SpeechController {
  const speechEngine = engine ?? (typeof window !== "undefined" ? window.speechSynthesis : null);
  const localSupported = Boolean(speechEngine && typeof SpeechSynthesisUtterance !== "undefined");

  // 本地路徑狀態
  let activeUtterance: SpeechSynthesisUtterance | null = null;
  let activeProgressCallback: SpeechProgressCallback | undefined;

  // 遠端路徑狀態
  let activeAudio: SpeechAudio | null = null;
  let activeRemoteGeneration = -1; // 「最新一句」的 generation id

  // 防抖（本地 / 遠端共用）
  let lastText = "";
  let lastStartedAt = 0;
  let preferences = DEFAULT_SPEECH_PREFERENCES;

  const speakLocal = (
    normalized: string,
    onStatus?: (status: SpeechStatus) => void,
    onProgress?: SpeechProgressCallback,
  ) => {
    if (!localSupported || !speechEngine) {
      onStatus?.("unsupported");
      return;
    }
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
  };

  const stop = (onStatus?: (status: SpeechStatus) => void) => {
    // bump generation：任何 pending fetch 解析後都不該再產 Audio
    activeRemoteGeneration = ++remoteGenerationCounter;
    activeAudio = null;
    if (speechEngine) speechEngine.cancel();
    activeUtterance = null;
    activeProgressCallback?.(null);
    activeProgressCallback = undefined;
    onStatus?.(localSupported ? "idle" : "unsupported");
  };

  const pause = (onStatus?: (status: SpeechStatus) => void) => {
    // 遠端音檔優先（如果有正在播的 Audio）
    if (activeAudio && typeof activeAudio.pause === "function") {
      activeAudio.pause();
      onStatus?.("paused");
      return true;
    }
    // 否則退回本機 utterance（瀏覽器若沒實作 pause/resume 也會失敗，呼叫端拿到 false）
    if (!localSupported || !speechEngine || !activeUtterance || typeof speechEngine.pause !== "function") return false;
    speechEngine.pause();
    onStatus?.("paused");
    return true;
  };

  const resume = (onStatus?: (status: SpeechStatus) => void) => {
    if (activeAudio && typeof activeAudio.play === "function") {
      void activeAudio.play();
      onStatus?.("speaking");
      return true;
    }
    if (!localSupported || !speechEngine || !activeUtterance || typeof speechEngine.resume !== "function") return false;
    speechEngine.resume();
    onStatus?.("speaking");
    return true;
  };

  const speak = (
    text: string,
    onStatus?: (status: SpeechStatus) => void,
    onProgress?: SpeechProgressCallback,
  ) => {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) return false;

    const now = Date.now();
    if (lastText === normalized && now - lastStartedAt < 700) return false;

    lastText = normalized;
    lastStartedAt = now;

    // 遠端路徑（優先）
    if (remoteFetcher) {
      const myGeneration = ++remoteGenerationCounter;
      activeRemoteGeneration = myGeneration;
      remoteFetcher(normalized, myGeneration)
        .then(async (blob) => {
          // 被新請求或 stop 取代了 → 默默丟棄
          if (myGeneration !== activeRemoteGeneration) return;
          if (!blob) {
            // 遠端沒給 → 退回本機（若本機也不支援則 "unsupported"）
            if (localSupported && speechEngine) {
              speakLocal(normalized, onStatus, onProgress);
            } else {
              onStatus?.("unsupported");
            }
            return;
          }
          const url = URL.createObjectURL(blob);
          // 建 Audio 物件（測試把全域 Audio stub 成 StubAudio）。
          // 取 AudioCtor 順序：globalThis → window（瀏覽器環境）
          const AudioCtor = (
            (globalThis as unknown as { Audio?: new (src: string) => HTMLAudioElement }).Audio
            ?? (typeof window !== "undefined"
              ? (window as unknown as { Audio?: new (src: string) => HTMLAudioElement }).Audio
              : undefined)
          );
          const audioEl = AudioCtor ? new AudioCtor(url) : null;
          if (!audioEl) {
            onStatus?.("unsupported");
            return;
          }
          const audio = audioEl as unknown as SpeechAudio;
          audio.volume = preferences.volume;
          audio.pausedCount = 0;
          audio.onplay = () => {
            if (myGeneration !== activeRemoteGeneration) return;
            onStatus?.("speaking");
          };
          audio.onended = () => {
            if (myGeneration !== activeRemoteGeneration) return;
            activeAudio = null;
            onStatus?.("idle");
          };
          audio.onerror = () => {
            if (myGeneration !== activeRemoteGeneration) return;
            activeAudio = null;
            onStatus?.("error");
          };
          activeAudio = audio;
          await audio.play();
        })
        .catch(() => {
          if (myGeneration !== activeRemoteGeneration) return;
          // 例外也算失敗 → 退回本機；本機不支援則 "unsupported"
          if (localSupported && speechEngine) {
            speakLocal(normalized, onStatus, onProgress);
          } else {
            onStatus?.("unsupported");
          }
        });
      return true;
    }

    // 純本機路徑
    if (!localSupported || !speechEngine) {
      onStatus?.("unsupported");
      return false;
    }
    speakLocal(normalized, onStatus, onProgress);
    return true;
  };

  const setPreferences = (nextPreferences: SpeechPreferences) => {
    preferences = normalizeSpeechPreferences(nextPreferences);
  };

  return { speak, pause, resume, stop, setPreferences, isSupported: localSupported };
}

export function buildQuestionSpeechText(prompt: string, options: string[]) {
  const choices = options.map((option, index) => `${String.fromCharCode(65 + index)}、${option}`).join("；");
  return `題目：${prompt} 選項：${choices}`;
}
