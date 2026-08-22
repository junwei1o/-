import type { SubjectKey } from "@/game/expeditionContent";
import { getAccessibilityPrefs, getBattleVolume } from "@/utils/storage";

export type GuardianCeremonyPhase = "entrance" | "victory";

type GuardianSoundProfile = {
  waveform: OscillatorType;
  notes: number[];
  noteDuration: number;
  gap: number;
};

const GUARDIAN_SOUND_PROFILES: Record<SubjectKey, Record<GuardianCeremonyPhase, GuardianSoundProfile>> = {
  chinese: {
    entrance: { waveform: "sine", notes: [146, 196, 262], noteDuration: 0.22, gap: 0.13 },
    victory: { waveform: "triangle", notes: [262, 330, 392], noteDuration: 0.18, gap: 0.11 },
  },
  math: {
    entrance: { waveform: "triangle", notes: [220, 330, 440], noteDuration: 0.16, gap: 0.1 },
    victory: { waveform: "triangle", notes: [392, 523, 659, 784], noteDuration: 0.14, gap: 0.09 },
  },
  english: {
    entrance: { waveform: "sawtooth", notes: [196, 294, 440], noteDuration: 0.14, gap: 0.12 },
    victory: { waveform: "sine", notes: [330, 494, 659, 880], noteDuration: 0.16, gap: 0.1 },
  },
  science: {
    entrance: { waveform: "sine", notes: [174, 261, 392], noteDuration: 0.24, gap: 0.12 },
    victory: { waveform: "sine", notes: [294, 440, 587, 784], noteDuration: 0.19, gap: 0.1 },
  },
};

const GUARDIAN_NARRATION: Record<SubjectKey, Record<GuardianCeremonyPhase, string>> = {
  chinese: {
    entrance: "孔子之靈自古卷中甦醒。守護國文島的知識之門，準備迎接挑戰。",
    victory: "孔子之靈的封印已解除。國文島的知識之光，再次綻放。",
  },
  math: {
    entrance: "算盤龍王盤旋而至。數學城的邏輯試煉，現在開始。",
    victory: "算盤龍王的封印已解除。數學城的秩序之光，重新點亮。",
  },
  english: {
    entrance: "Atlas 詞源鷹展開雙翼。英文港的語言航線，等待你的解鎖。",
    victory: "Atlas 詞源鷹重獲自由。英文港的溝通之光，乘風啟航。",
  },
  science: {
    entrance: "玉山星穹巨人喚醒群峰。自然山的探索試煉，即將展開。",
    victory: "玉山星穹巨人的封印已解除。自然山的觀察之光，照亮前方。",
  },
};

let guardianAudioContext: AudioContext | null = null;
let lastGuardianSoundAt = 0;

function getGuardianAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  try {
    guardianAudioContext ??= new AudioContextCtor();
    if (guardianAudioContext.state === "suspended") void guardianAudioContext.resume();
    return guardianAudioContext;
  } catch {
    return null;
  }
}

function triggerGuardianHaptic(phase: GuardianCeremonyPhase) {
  if (typeof navigator === "undefined" || !getAccessibilityPrefs().vibrationEnabled) return;
  const device = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean };
  if (typeof device.vibrate !== "function") return;
  try {
    device.vibrate(phase === "victory" ? [18, 32, 40] : [16, 28, 22]);
  } catch {
    // 觸感回饋僅在支援的裝置上提供，不能阻礙守護者演出。
  }
}

export function guardianCeremonyNarration(subject: SubjectKey, phase: GuardianCeremonyPhase) {
  return GUARDIAN_NARRATION[subject][phase];
}

export function guardianCeremonySoundProfile(subject: SubjectKey, phase: GuardianCeremonyPhase) {
  return GUARDIAN_SOUND_PROFILES[subject][phase];
}

export function playGuardianCeremonySfx(subject: SubjectKey, phase: GuardianCeremonyPhase, enabled: boolean, volume = getBattleVolume()) {
  triggerGuardianHaptic(phase);
  if (!enabled || typeof window === "undefined" || volume <= 0) return false;
  const nowMs = Date.now();
  if (nowMs - lastGuardianSoundAt < 110) return false;
  lastGuardianSoundAt = nowMs;
  const context = getGuardianAudioContext();
  if (!context) return false;

  try {
    const profile = guardianCeremonySoundProfile(subject, phase);
    const now = context.currentTime;
    const amplitude = 0.055 * Math.min(1, Math.max(0, volume));
    profile.notes.forEach((note, index) => {
      const delay = index * (profile.noteDuration + profile.gap);
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = profile.waveform;
      oscillator.frequency.setValueAtTime(note, now + delay);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, note * 1.08), now + delay + profile.noteDuration);
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(amplitude, now + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + profile.noteDuration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + profile.noteDuration + 0.03);
    });
    return true;
  } catch {
    // 某些瀏覽器需明確使用者手勢才能播放；儀式與可讀提示仍可正常運作。
    return false;
  }
}
