import type { SubjectKey } from "./expeditionContent";
import type { RegionKey } from "./rpgTypes";
import type { JournalEntry } from "./adventureJournal";

export type GuardianBehaviorMode = "berserk" | "heal" | "dodge" | "curse";

export type GuardianBattleProfile = {
  guardianId: string;
  baseHp: number;
  maxHp: number;
  attack: number;
  turn: number;
  mode: GuardianBehaviorMode;
};

export const GUARDIAN_BEHAVIOR_LABELS: Record<GuardianBehaviorMode, string> = {
  berserk: "狂暴：本回合攻擊力提升",
  heal: "治癒：守護者回復少量生命",
  dodge: "閃避：下一次答對傷害降低",
  curse: "詛咒：答錯時額外承受學習壓力",
};

export function guardianMaxHp(regularHp: number): number {
  return Math.max(30, Math.round(Math.max(1, regularHp) * 3));
}

export function guardianBehaviorForTurn(turn: number): GuardianBehaviorMode {
  const modes: GuardianBehaviorMode[] = ["berserk", "heal", "dodge", "curse"];
  const normalized = Number.isFinite(turn) ? Math.max(1, Math.floor(turn)) : 1;
  return modes[(normalized - 1) % modes.length];
}

export function createGuardianBattleProfile(input: { guardianId: string; regularHp: number; attack: number; turn?: number }): GuardianBattleProfile {
  const turn = Math.max(1, Math.floor(input.turn ?? 1));
  return {
    guardianId: input.guardianId,
    baseHp: Math.max(1, Math.round(input.regularHp)),
    maxHp: guardianMaxHp(input.regularHp),
    attack: Math.max(1, Math.round(input.attack)),
    turn,
    mode: guardianBehaviorForTurn(turn),
  };
}

export function advanceGuardianTurn(profile: GuardianBattleProfile): GuardianBattleProfile {
  const turn = profile.turn + 1;
  return { ...profile, turn, mode: guardianBehaviorForTurn(turn) };
}

export function guardianDamage(input: { baseDamage: number; mode: GuardianBehaviorMode; correct: boolean }): number {
  const damage = Math.max(0, input.baseDamage);
  if (!input.correct) return input.mode === "curse" ? Math.round(damage * 1.25) : damage;
  if (input.mode === "dodge") return Math.max(1, Math.round(damage * 0.45));
  return damage;
}

export function guardianHeal(input: { currentHp: number; maxHp: number; mode: GuardianBehaviorMode }): number {
  if (input.mode !== "heal") return Math.max(0, Math.min(input.maxHp, input.currentHp));
  return Math.min(input.maxHp, Math.max(0, input.currentHp) + Math.max(2, Math.round(input.maxHp * 0.06)));
}

export type DailyAdventureSummaryInput = {
  date: number;
  entries: JournalEntry[];
  previousDayKey?: string;
};

export type DailyAdventureSummary = {
  dayKey: string;
  summary: string;
  answered: number;
  correct: number;
  accuracy: number | null;
  subject: string | null;
};

function dayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function generateDailyAdventureSummary(input: DailyAdventureSummaryInput): DailyAdventureSummary {
  const targetKey = input.previousDayKey ?? dayKey(input.date - 86_400_000);
  const entries = input.entries.filter((entry) => dayKey(entry.date) === targetKey);
  const answered = entries.reduce((sum, entry) => sum + Math.max(0, Math.floor(entry.topicCount)), 0);
  const correct = entries.reduce((sum, entry) => sum + Math.max(0, Math.floor(entry.correctCount)), 0);
  const accuracy = answered > 0 ? correct / answered : null;
  const subjectCounts = new Map<string, number>();
  for (const entry of entries) subjectCounts.set(entry.subject, (subjectCounts.get(entry.subject) ?? 0) + entry.correctCount);
  const subject = Array.from(subjectCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const summary = entries.length === 0
    ? "昨夜的航海日誌還沒有新的足跡，今天就從一小段學習航線開始吧。"
    : accuracy !== null && accuracy >= 0.8
      ? `昨日你完成 ${answered} 題練習，${subject ?? "學習航線"}表現特別亮眼；知識之光正穩定點亮。`
      : accuracy !== null && accuracy < 0.5
        ? `昨日你在 ${subject ?? "部分知識航線"} 遇到幾個暗礁，別急著返航，今天用一組補強題重新觀察線索吧。`
        : `昨日你完成 ${answered} 題練習並答對 ${correct} 題，持續航行就能讓${subject ?? "各科"}的知識島更明亮。`;
  return { dayKey: targetKey, summary, answered, correct, accuracy, subject };
}

export type TalentId = "precision" | "resilience" | "knowledge-drain" | "lucky-star";
export type TalentLevels = Partial<Record<TalentId, number>>;

export type PlayerGrowth = {
  talentPoints: number;
  talents: TalentLevels;
  equippedGearIds: string[];
  fragments: Record<string, number>;
};

export const TALENT_CATALOG: readonly { id: TalentId; label: string; description: string; maxLevel: number }[] = [
  { id: "precision", label: "精準", description: "每級提高暴擊率 2%。", maxLevel: 5 },
  { id: "resilience", label: "韌性", description: "每級降低答錯傷害 2 點。", maxLevel: 5 },
  { id: "knowledge-drain", label: "知識汲取", description: "每級答對額外獲得 2 經驗。", maxLevel: 5 },
  { id: "lucky-star", label: "幸運星", description: "每級提高藥水掉落率 2%。", maxLevel: 5 },
] as const;

export type GearDefinition = { id: string; label: string; fragmentLabel: string; description: string; attack: number; defense: number; criticalRate: number; rareEncounterRate: number };
export const GEAR_CATALOG: readonly GearDefinition[] = [
  { id: "gear-confucius-charm", label: "孔廟護符", fragmentLabel: "孔廟護符碎片", description: "古老字音凝成的護符。", attack: 3, defense: 0, criticalRate: 0, rareEncounterRate: 0 },
  { id: "gear-math-compass", label: "數學羅盤", fragmentLabel: "數學羅盤碎片", description: "指向正確推理路徑。", attack: 0, defense: 0, criticalRate: 0.05, rareEncounterRate: 0 },
  { id: "gear-sailor-scope", label: "航海望遠鏡", fragmentLabel: "航海望遠鏡碎片", description: "看見隱藏在霧中的稀有航線。", attack: 0, defense: 0, criticalRate: 0, rareEncounterRate: 0.1 },
  { id: "gear-mountain-cloak", label: "山林披風", fragmentLabel: "山林披風碎片", description: "以山風抵禦錯答的衝擊。", attack: 0, defense: 2, criticalRate: 0, rareEncounterRate: 0 },
] as const;

export function baseAttributes(level: number): { attack: number; defense: number; luck: number } {
  const safeLevel = Math.max(1, Math.floor(level));
  return { attack: 10 + safeLevel - 1, defense: Math.floor((safeLevel - 1) / 5), luck: Math.floor((safeLevel - 1) / 10) * 0.01 };
}

export function spendTalentPoint(growth: PlayerGrowth, id: TalentId): PlayerGrowth {
  const definition = TALENT_CATALOG.find((talent) => talent.id === id);
  const current = growth.talents[id] ?? 0;
  if (!definition || growth.talentPoints <= 0 || current >= definition.maxLevel) return growth;
  return { ...growth, talentPoints: growth.talentPoints - 1, talents: { ...growth.talents, [id]: current + 1 } };
}

export function addGearFragment(growth: PlayerGrowth, gearId: string, amount = 1): PlayerGrowth {
  if (!GEAR_CATALOG.some((gear) => gear.id === gearId) || amount <= 0) return growth;
  return { ...growth, fragments: { ...growth.fragments, [gearId]: Math.max(0, (growth.fragments[gearId] ?? 0) + Math.floor(amount)) } };
}

export function craftGear(growth: PlayerGrowth, gearId: string): PlayerGrowth {
  const count = growth.fragments[gearId] ?? 0;
  if (count < 5 || !GEAR_CATALOG.some((gear) => gear.id === gearId)) return growth;
  return { ...growth, fragments: { ...growth.fragments, [gearId]: count - 5 }, equippedGearIds: growth.equippedGearIds.includes(gearId) ? growth.equippedGearIds : [...growth.equippedGearIds, gearId] };
}

export function equipmentBonuses(growth: PlayerGrowth): { attack: number; defense: number; criticalRate: number; rareEncounterRate: number } {
  return growth.equippedGearIds.reduce((total, id) => {
    const gear = GEAR_CATALOG.find((item) => item.id === id);
    return gear ? { attack: total.attack + gear.attack, defense: total.defense + gear.defense, criticalRate: total.criticalRate + gear.criticalRate, rareEncounterRate: total.rareEncounterRate + gear.rareEncounterRate } : total;
  }, { attack: 0, defense: 0, criticalRate: 0, rareEncounterRate: 0 });
}

export type WorldEventKind = "knowledge-storm" | "wandering-merchant" | "mystery-chest";
export type WorldEvent = { id: string; kind: WorldEventKind; region: RegionKey; label: string; description: string; expiresAt: number; reward: { gold?: number; potion?: number; expMultiplier?: number } };

export function canTriggerWorldEvent(triggeredToday: number, maxPerDay = 3): boolean { return triggeredToday < maxPerDay; }

export function createWorldEvent(input: { kind: WorldEventKind; region: RegionKey; now?: number; random?: number }): WorldEvent {
  const now = input.now ?? Date.now();
  const copy: Record<WorldEventKind, Omit<WorldEvent, "id" | "expiresAt" | "region">> = {
    "knowledge-storm": { kind: "knowledge-storm", label: "知識風暴", description: "這片區域的題目能量翻倍，持續 30 分鐘。", reward: { expMultiplier: 2 } },
    "wandering-merchant": { kind: "wandering-merchant", label: "流浪商人", description: "用折扣金幣交換補給或裝備碎片。", reward: { gold: -20 } },
    "mystery-chest": { kind: "mystery-chest", label: "神秘寶箱", description: "打開寶箱，可能獲得金幣與補給，也要留意陷阱。", reward: { gold: 30, potion: 1 } },
  };
  const event = copy[input.kind];
  return { ...event, region: input.region, id: `world-event-${input.kind}-${input.region}-${now}`, expiresAt: now + (input.kind === "knowledge-storm" ? 30 * 60_000 : 24 * 60 * 60_000) };
}

export function eventIsActive(event: WorldEvent, now = Date.now()): boolean { return event.expiresAt > now; }

export function worldStateForTime(timestamp = Date.now(), rainRoll = 0): { period: "day" | "night"; rainy: boolean; festival: string | null; battleAttackMultiplier: number; potionDropBonus: number } {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const period = hour >= 6 && hour < 18 ? "day" : "night";
  const rainy = rainRoll >= 0 && rainRoll < 0.3;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const festival = month === 1 && day <= 3 ? "新春慶典" : month === 9 && day >= 10 && day <= 20 ? "月光慶典" : null;
  return { period, rainy, festival, battleAttackMultiplier: period === "night" ? 1.1 : 1, potionDropBonus: rainy ? 0.15 : 0 };
}

export function subjectToRegion(subject: SubjectKey): RegionKey {
  return subject === "chinese" ? "north" : subject === "math" ? "central" : subject === "english" ? "south" : "east";
}
