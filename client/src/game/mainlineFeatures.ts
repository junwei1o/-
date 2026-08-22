import type { SubjectKey } from "@/game/expeditionContent";

export type GuardianReward = {
  legendaryTitle: string;
  outfitId: string;
  outfitLabel: string;
  gold: number;
  exp: number;
};

export type AreaGuardian = {
  id: string;
  subject: SubjectKey;
  areaLabel: string;
  name: string;
  emoji: string;
  lore: string;
  requiredRegularDefeats: number;
  reward: GuardianReward;
};

export const AREA_GUARDIANS: readonly AreaGuardian[] = [
  {
    id: "guardian-chinese-confucius-spirit",
    subject: "chinese",
    areaLabel: "國文島",
    name: "孔子之靈",
    emoji: "📜",
    lore: "守護字詞與文脈的古老靈魂，只有完成島上的基礎試煉才能聽見他的教誨。",
    requiredRegularDefeats: 3,
    reward: { legendaryTitle: "傳說級稱號：文脈傳承者", outfitId: "outfit-ink-sage", outfitLabel: "墨韻賢者造型", gold: 120, exp: 180 },
  },
  {
    id: "guardian-math-abacus-dragon",
    subject: "math",
    areaLabel: "數學城",
    name: "算盤龍王",
    emoji: "🐉",
    lore: "以規律吐息排列星軌，考驗探險家是否能把複雜問題拆成清楚步驟。",
    requiredRegularDefeats: 3,
    reward: { legendaryTitle: "傳說級稱號：算式破陣者", outfitId: "outfit-star-abacus", outfitLabel: "星算龍甲造型", gold: 120, exp: 180 },
  },
  {
    id: "guardian-english-atlas-owl",
    subject: "english",
    areaLabel: "英文港",
    name: "Atlas 詞源鷹",
    emoji: "🦉",
    lore: "盤旋在單字與句型的風暴上方，引導探險家從語境找到最精準的表達。",
    requiredRegularDefeats: 3,
    reward: { legendaryTitle: "傳說級稱號：語境領航員", outfitId: "outfit-atlas-wing", outfitLabel: "Atlas 翼語造型", gold: 120, exp: 180 },
  },
  {
    id: "guardian-science-taiwan-titan",
    subject: "science",
    areaLabel: "自然原野",
    name: "玉山星穹巨人",
    emoji: "⛰️",
    lore: "從山脈與星空誕生的守護者，要求探險家用觀察、證據與推理回答世界。",
    requiredRegularDefeats: 3,
    reward: { legendaryTitle: "傳說級稱號：星穹觀察家", outfitId: "outfit-celestial-yushan", outfitLabel: "玉山星穹造型", gold: 120, exp: 180 },
  },
] as const;

export function getAreaGuardian(subject: SubjectKey): AreaGuardian {
  return AREA_GUARDIANS.find((guardian) => guardian.subject === subject) ?? AREA_GUARDIANS[0];
}

export function canChallengeGuardian(guardian: AreaGuardian, regularDefeats: number): boolean {
  return Number.isFinite(regularDefeats) && regularDefeats >= guardian.requiredRegularDefeats;
}

export function guardianCompletionRatio(guardian: AreaGuardian, regularDefeats: number): number {
  if (guardian.requiredRegularDefeats <= 0) return 1;
  return Math.min(1, Math.max(0, regularDefeats / guardian.requiredRegularDefeats));
}

export function getWeekKey(timestamp = Date.now()): string {
  const date = new Date(timestamp);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

export type WeeklyQuestKind = "defeat-regular" | "correct-streak" | "answer-subject";
export type WeeklyQuest = {
  id: string;
  weekKey: string;
  kind: WeeklyQuestKind;
  title: string;
  description: string;
  subject?: SubjectKey;
  target: number;
  reward: { gold: number; exp: number };
};

export const WEEKLY_QUEST_TEMPLATES: readonly Omit<WeeklyQuest, "weekKey">[] = [
  { id: "weekly-chinese-hunt", kind: "defeat-regular", title: "古文巡航", description: "擊敗 5 隻國文島普通怪物", subject: "chinese", target: 5, reward: { gold: 80, exp: 120 } },
  { id: "weekly-streak", kind: "correct-streak", title: "連勝航線", description: "連續答對 15 題", target: 15, reward: { gold: 100, exp: 160 } },
  { id: "weekly-science-answer", kind: "answer-subject", title: "星穹觀測", description: "完成 10 題自然題目", subject: "science", target: 10, reward: { gold: 70, exp: 110 } },
];

export function createWeeklyQuests(timestamp = Date.now()): WeeklyQuest[] {
  const weekKey = getWeekKey(timestamp);
  return WEEKLY_QUEST_TEMPLATES.map((quest) => ({ ...quest, weekKey }));
}

export type WeeklyQuestProgress = {
  defeatedRegularBySubject: Partial<Record<SubjectKey, number>>;
  correctStreak: number;
  answersBySubject: Partial<Record<SubjectKey, number>>;
};

export function getWeeklyQuestProgress(quest: WeeklyQuest, progress: WeeklyQuestProgress): number {
  if (quest.kind === "defeat-regular") return progress.defeatedRegularBySubject[quest.subject ?? "chinese"] ?? 0;
  if (quest.kind === "answer-subject") return progress.answersBySubject[quest.subject ?? "science"] ?? 0;
  return progress.correctStreak;
}

export function isWeeklyQuestComplete(quest: WeeklyQuest, progress: WeeklyQuestProgress): boolean {
  return getWeeklyQuestProgress(quest, progress) >= quest.target;
}

export function clampQuestProgress(value: number, target: number): number {
  return Math.min(Math.max(0, Number.isFinite(value) ? value : 0), Math.max(0, target));
}

export const PARENT_VIEW_PIN_LENGTH = 4;
export function isValidParentPin(pin: string): boolean {
  return new RegExp(`^\\d{${PARENT_VIEW_PIN_LENGTH}}$`).test(pin);
}

export function hashParentPin(pin: string): string {
  let hash = 2166136261;
  for (const char of pin) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
