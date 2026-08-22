import { readStoredValue, writeStoredValue } from "@/utils/storage";

export const PAPER_STRATEGY_CUE_ENABLED_KEY = "xue.paperExam.strategyCue.enabled";

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext ?? (window as typeof window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext ?? null;
}

export function loadPaperStrategyCueEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return readStoredValue(PAPER_STRATEGY_CUE_ENABLED_KEY, "true") !== "false";
}

export function savePaperStrategyCueEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  writeStoredValue(PAPER_STRATEGY_CUE_ENABLED_KEY, String(enabled));
}

/** Plays a brief, low-volume cue during a direct learner action; browsers may safely decline it. */
export function playPaperStrategyCue(enabled: boolean) {
  if (!enabled) return;
  const AudioContextCtor = getAudioContextConstructor();
  if (!AudioContextCtor) return;

  try {
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const duration = 0.24;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(392, now);
    oscillator.frequency.exponentialRampToValueAtTime(494, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    // Visual and textual cues remain available when browser audio is unavailable or muted.
  }
}
