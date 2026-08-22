import type { BattleRageSkill } from "@/game/rpgTypes";

export const BATTLE_RAGE_SKILL_TUTORIAL_STORAGE_KEY = "xue-battle-rage-skill-tutorial-v1";

export type BattleRageSkillTutorialState = {
  version: 1;
  seen: boolean;
};

export const RAGE_SKILL_COOLDOWN_TURNS = 2;
export const BATTLE_RAGE_SKILL_CAST_HIGHLIGHT_MS = 520;

export type BattleRageSkillCooldowns = Record<BattleRageSkill, number>;

export const RAGE_SKILL_TUTORIAL_COPY: Record<BattleRageSkill, string> = {
  precise: "答對時造成 2.5 倍傷害。",
  shield: "答錯時抵銷一次守門者反擊。",
  heal: "立即回復 20 HP，仍要回答本回合題目。",
};

const DEFAULT_STATE: BattleRageSkillTutorialState = { version: 1, seen: false };

type TutorialStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

function browserStorage(): TutorialStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidState(value: unknown): value is BattleRageSkillTutorialState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BattleRageSkillTutorialState>;
  return candidate.version === 1 && typeof candidate.seen === "boolean";
}

export function createBattleRageSkillCooldowns(): BattleRageSkillCooldowns {
  return { precise: 0, shield: 0, heal: 0 };
}

export function startBattleRageSkillCooldown(current: BattleRageSkillCooldowns, skill: BattleRageSkill): BattleRageSkillCooldowns {
  return { ...current, [skill]: RAGE_SKILL_COOLDOWN_TURNS };
}

export function advanceBattleRageSkillCooldowns(current: BattleRageSkillCooldowns): BattleRageSkillCooldowns {
  const next = { ...current };
  (Object.keys(next) as BattleRageSkill[]).forEach((skill) => {
    next[skill] = Math.max(0, next[skill] - 1);
  });
  return next;
}

export function getBattleRageSkillCooldownProgress(remainingTurns: number, totalTurns = RAGE_SKILL_COOLDOWN_TURNS): number {
  if (totalTurns <= 0) return 0;
  return Math.max(0, Math.min(100, (remainingTurns / totalTurns) * 100));
}

export function isBattleRageSkillHighlighted(skill: BattleRageSkill, highlightedSkill: BattleRageSkill | null): boolean {
  return highlightedSkill === skill;
}

export function loadBattleRageSkillTutorial(storage: TutorialStorage | null = browserStorage()): BattleRageSkillTutorialState {
  if (!storage) return { ...DEFAULT_STATE };

  try {
    const raw = storage.getItem(BATTLE_RAGE_SKILL_TUTORIAL_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidState(parsed)) throw new Error("Unsupported battle rage tutorial state");
    return parsed;
  } catch {
    try { storage.removeItem(BATTLE_RAGE_SKILL_TUTORIAL_STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
    return { ...DEFAULT_STATE };
  }
}

export function markBattleRageSkillTutorialSeen(storage: TutorialStorage | null = browserStorage()): BattleRageSkillTutorialState {
  const next: BattleRageSkillTutorialState = { ...loadBattleRageSkillTutorial(storage), seen: true };
  if (!storage) return next;

  try {
    storage.setItem(BATTLE_RAGE_SKILL_TUTORIAL_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing or unavailable storage must not interrupt learning.
  }
  return next;
}
