import type { BattleState, Companion } from "./rpgTypes";
import { combatStyleForCompanion, type CompanionCombatArchetype } from "./companionCombatStyles";
import { getAccessibilityPrefs, getBattleVolume } from "@/utils/storage";

export type CombatFeedbackEvent =
  | "answer-correct"
  | "answer-fast"
  | "critical"
  | "answer-wrong"
  | "attack"
  | "ultimate"
  | "defense"
  | "capture-success"
  | "capture-fail"
  | "victory"
  | "defeat";

export type CombatFeedback = {
  event: CombatFeedbackEvent;
  label: string;
  detail: string;
  archetype?: CompanionCombatArchetype;
  styleClass?: string;
};

function latestLog(state: BattleState | null | undefined) {
  return state?.log[state.log.length - 1] ?? "";
}

export function getCombatFeedback(previous: BattleState | null, next: BattleState | null, companion?: Pick<Companion, "id" | "name" | "skillName"> | null): CombatFeedback | null {
  if (!next || !previous || next.log.length <= previous.log.length) return null;
  const log = latestLog(next);
  const newLogs = next.log.slice(previous.log.length).join(" ");
  const style = combatStyleForCompanion(companion);
  if (next.result === "victory" && /願意加入|暫時失去戰鬥力/.test(newLogs)) {
    return newLogs.includes("願意加入")
      ? { event: "capture-success", label: "捕捉成功！", detail: "新的夥伴願意加入島嶼圖鑑。" }
      : next.ultimateUsed && !previous.ultimateUsed
        ? { event: "victory", label: `${style.ultimateName}完成！`, detail: `${style.ultimateDetail} ${style.label}夥伴取得勝利。`, archetype: style.archetype, styleClass: `${style.ultimateClass} ${style.victoryClass}` }
        : { event: "victory", label: `${style.label}勝利！`, detail: "答題能量擊退了遭遇目標。", archetype: style.archetype, styleClass: style.victoryClass };
  }
  if (next.ultimateUsed && !previous.ultimateUsed) return { event: "ultimate", label: style.ultimateName, detail: style.ultimateDetail, archetype: style.archetype, styleClass: style.ultimateClass };
  if (next.result === "defeat") return { event: "defeat", label: "先穩住節奏", detail: "休息後再整理線索，繼續學習。" };
  if (next.phase === "action" && next.performance && previous.phase === "question") {
    if (!next.performance.correct) return { event: "answer-wrong", label: "再觀察一次", detail: "答錯不會扣分，下一回合還能重新挑戰。", archetype: style.archetype, styleClass: "companion-answer-wrong" };
    return next.performance.responseMs <= 8_000
      ? { event: "answer-fast", label: `${style.attackName}（快速答對）`, detail: style.attackDetail, archetype: style.archetype, styleClass: style.attackClass }
      : { event: "answer-correct", label: "答題成功！", detail: "答題能量已轉成戰鬥行動力。", archetype: style.archetype, styleClass: "companion-answer-correct" };
  }
  if (previous.enemyHp > next.enemyHp) return { event: "attack", label: style.attackName, detail: `${style.attackDetail} 造成 ${previous.enemyHp - next.enemyHp} 點傷害。`, archetype: style.archetype, styleClass: style.attackClass };
  if (previous.playerHp > next.playerHp) return { event: "defense", label: "防禦回應", detail: `承受 ${previous.playerHp - next.playerHp} 點反擊傷害。`, archetype: style.archetype, styleClass: style.impactClass };
  if (newLogs.includes("躲開了捕捉")) return { event: "capture-fail", label: "捕捉未成功", detail: "再完成學習觀察累積更穩定的捕捉機率。" };
  return null;
}

const AUDIO_PROFILES: Record<CombatFeedbackEvent, { start: number; end: number; duration: number; type: OscillatorType }> = {
  "answer-correct": { start: 520, end: 760, duration: 0.16, type: "sine" },
  "answer-fast": { start: 680, end: 1080, duration: 0.2, type: "triangle" },
  critical: { start: 420, end: 1320, duration: 0.46, type: "sine" },
  "answer-wrong": { start: 210, end: 150, duration: 0.18, type: "sawtooth" },
  attack: { start: 180, end: 720, duration: 0.24, type: "square" },
  ultimate: { start: 260, end: 1180, duration: 0.58, type: "sine" },
  defense: { start: 420, end: 260, duration: 0.22, type: "triangle" },
  "capture-success": { start: 440, end: 980, duration: 0.42, type: "sine" },
  "capture-fail": { start: 300, end: 180, duration: 0.2, type: "sine" },
  victory: { start: 560, end: 1120, duration: 0.5, type: "triangle" },
  defeat: { start: 240, end: 110, duration: 0.42, type: "sawtooth" },
};

let combatAudioContext: AudioContext | null = null;
let lastCombatSoundAt = 0;

function getCombatAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  try {
    combatAudioContext ??= new AudioContextCtor();
    if (combatAudioContext.state === "suspended") void combatAudioContext.resume();
    return combatAudioContext;
  } catch {
    return null;
  }
}

function triggerCombatHaptic(event: CombatFeedbackEvent) {
  if (typeof navigator === "undefined" || !getAccessibilityPrefs().vibrationEnabled) return;
  const device = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean };
  if (typeof device.vibrate !== "function") return;
  const pattern = event === "critical" || event === "ultimate" || event === "victory" ? [18, 34, 32] : event === "answer-wrong" || event === "defeat" ? 28 : 12;
  try {
    device.vibrate(pattern);
  } catch {
    // 觸感回饋僅在支援的裝置上提供，不能影響答題流程。
  }
}

export function playCombatSfx(event: CombatFeedbackEvent, enabled: boolean, companion?: Pick<Companion, "id" | "name" | "skillName"> | null, volume = getBattleVolume()) {
  triggerCombatHaptic(event);
  if (!enabled || typeof window === "undefined" || volume <= 0) return;
  const nowMs = performance.now();
  if (nowMs - lastCombatSoundAt < 55) return;
  lastCombatSoundAt = nowMs;
  const context = getCombatAudioContext();
  if (!context) return;
  try {
    const profile = AUDIO_PROFILES[event];
    const style = combatStyleForCompanion(companion);
    const companionProfile = companion && (event === "ultimate" ? style.ultimateAudio : event === "victory" ? style.victoryAudio : event === "attack" || event === "answer-fast" || event === "answer-correct" ? style.audio : null);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = companionProfile?.type ?? profile.type;
    oscillator.frequency.setValueAtTime(companionProfile?.start ?? profile.start, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, companionProfile?.end ?? profile.end), now + (companionProfile?.duration ?? profile.duration));
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.08 * Math.min(1, Math.max(0, volume))), now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (companionProfile?.duration ?? profile.duration));
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + (companionProfile?.duration ?? profile.duration) + 0.03);
    oscillator.addEventListener("ended", () => undefined);
  } catch {
    // Some browsers reject AudioContext until a user gesture; visual feedback still works.
  }
}
