import type { Companion } from "./rpgTypes";

export type CompanionCombatArchetype = "cosmic" | "armor" | "bubble";

export type CompanionCombatStyle = {
  archetype: CompanionCombatArchetype;
  label: string;
  attackClass: string;
  impactClass: string;
  accent: string;
  glow: string;
  attackName: string;
  attackDetail: string;
  ultimateName: string;
  ultimateDetail: string;
  ultimateClass: string;
  victoryClass: string;
  ultimateAudio: { start: number; end: number; duration: number; type: OscillatorType; harmonic: number };
  victoryAudio: { start: number; end: number; duration: number; type: OscillatorType; harmonic: number };
  audio: { start: number; end: number; duration: number; type: OscillatorType; harmonic: number };
};

export const COMPANION_COMBAT_STYLES: Record<CompanionCombatArchetype, CompanionCombatStyle> = {
  cosmic: {
    archetype: "cosmic",
    label: "星環光束",
    attackClass: "companion-attack-cosmic",
    impactClass: "companion-impact-cosmic",
    accent: "#8cc9ff",
    glow: "rgba(103, 211, 255, 0.62)",
    attackName: "星環光束發射！",
    attackDetail: "宇宙光能沿著答題線索聚焦，穿透遭遇目標的弱點。",
    ultimateName: "星海終極脈衝",
    ultimateDetail: "星環展開成學習星圖，將整回合的答題能量凝聚成一道守護脈衝。",
    ultimateClass: "companion-ultimate-cosmic",
    victoryClass: "companion-victory-cosmic",
    ultimateAudio: { start: 330, end: 1480, duration: 0.62, type: "sine", harmonic: 880 },
    victoryAudio: { start: 660, end: 1320, duration: 0.72, type: "triangle", harmonic: 990 },
    audio: { start: 440, end: 1320, duration: 0.34, type: "sine", harmonic: 660 },
  },
  armor: {
    archetype: "armor",
    label: "脈衝裝甲斬",
    attackClass: "companion-attack-armor",
    impactClass: "companion-impact-armor",
    accent: "#ffb35f",
    glow: "rgba(255, 145, 66, 0.58)",
    attackName: "脈衝裝甲斬！",
    attackDetail: "裝甲夥伴把答題能量壓縮成穩定的一擊，正面突破防線。",
    ultimateName: "熾核裝甲終結",
    ultimateDetail: "裝甲核心鎖定學習弱點，完成一次沉穩而強力的能量斬擊。",
    ultimateClass: "companion-ultimate-armor",
    victoryClass: "companion-victory-armor",
    ultimateAudio: { start: 120, end: 620, duration: 0.5, type: "square", harmonic: 240 },
    victoryAudio: { start: 220, end: 880, duration: 0.62, type: "sawtooth", harmonic: 440 },
    audio: { start: 180, end: 760, duration: 0.22, type: "square", harmonic: 380 },
  },
  bubble: {
    archetype: "bubble",
    label: "泡泡旋風",
    attackClass: "companion-attack-bubble",
    impactClass: "companion-impact-bubble",
    accent: "#ffb4d1",
    glow: "rgba(255, 180, 218, 0.62)",
    attackName: "泡泡旋風出發！",
    attackDetail: "輕盈的泡泡旋風把答對能量變成連續的小驚喜。",
    ultimateName: "彩虹泡泡大遊行",
    ultimateDetail: "泡泡夥伴把答題能量變成繽紛彈跳，讓遭遇目標在歡樂節奏中失去戰意。",
    ultimateClass: "companion-ultimate-bubble",
    victoryClass: "companion-victory-bubble",
    ultimateAudio: { start: 260, end: 1240, duration: 0.58, type: "triangle", harmonic: 620 },
    victoryAudio: { start: 392, end: 1176, duration: 0.8, type: "sine", harmonic: 784 },
    audio: { start: 330, end: 990, duration: 0.3, type: "triangle", harmonic: 495 },
  },
};

export function companionArchetype(companion: Pick<Companion, "id" | "name" | "skillName"> | null | undefined): CompanionCombatArchetype {
  if (!companion) return "cosmic";
  if (companion.id === "milk-dragonling" || /奶|泡泡|龍/.test(`${companion.id}${companion.name}${companion.skillName}`)) return "bubble";
  if (companion.id === "ember-guard" || /甲|裝甲|火種/.test(`${companion.id}${companion.name}${companion.skillName}`)) return "armor";
  return "cosmic";
}

export function combatStyleForCompanion(companion: Pick<Companion, "id" | "name" | "skillName"> | null | undefined) {
  return COMPANION_COMBAT_STYLES[companionArchetype(companion)];
}
