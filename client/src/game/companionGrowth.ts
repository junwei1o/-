import type { Companion, RpgAchievement } from "./rpgTypes";

export const GROWTH_VERSION = 1;

export type GrowthAnswer = {
  correct: boolean;
  curriculumDomain?: string;
  learningTopic?: string;
  responseMs?: number;
  streak?: number;
};

export type GrowthAction = "feed" | "train-focus" | "train-guard" | "train-capture";

export const GROWTH_ACHIEVEMENTS: RpgAchievement[] = [
  { id: "first-light", title: "第一道光", description: "完成第一道課綱題目，讓夥伴認識學習旅程。", domain: "綜合", requiredAnswers: 1, rewardAffection: 2, rewardTrainingPoints: 1 },
  { id: "steady-mind", title: "穩定思考者", description: "累積 5 次正確作答，解鎖專注訓練。", domain: "綜合", requiredAnswers: 5, rewardAffection: 5, rewardTrainingPoints: 2 },
  { id: "domain-tracker", title: "領域觀測家", description: "在同一課綱領域完成 3 次正確作答。", domain: "課綱領域", requiredAnswers: 3, rewardAffection: 4, rewardTrainingPoints: 2 },
  { id: "brave-challenger", title: "勇敢挑戰者", description: "以挑戰題完成一次正確作答。", domain: "挑戰", requiredAnswers: 1, rewardAffection: 6, rewardTrainingPoints: 3 },
];

export const PERSONALITY_LABELS = {
  "觀察家": "答題速度越穩定，捕捉判讀越精準",
  "守護者": "需要提示時，防禦韌性更可靠",
  "探索者": "探索新領域時，訓練點取得更活躍",
  "鼓舞者": "連勝時，親密度成長更快",
} as const;

export function normalizeCompanionGrowth(companion: Companion): Companion {
  const personality = companion.personality ?? personalityFor(companion.id);
  return {
    ...companion,
    affection: Math.max(0, Math.min(100, companion.affection ?? 0)),
    trainingPoints: Math.max(0, companion.trainingPoints ?? 0),
    personality,
    equippedSkillIds: companion.equippedSkillIds?.length ? companion.equippedSkillIds : (companion.passiveSkillIds ?? []).slice(0, 2),
    achievementIds: companion.achievementIds ?? [],
    trainingLog: companion.trainingLog ?? [],
  };
}

function personalityFor(id: string): Companion["personality"] {
  if (id === "ember-guard") return "守護者";
  if (id === "star-runner") return "探索者";
  if (id === "milk-dragonling") return "鼓舞者";
  return "觀察家";
}

export function affectionLevel(affection = 0): number {
  return Math.min(5, Math.floor(Math.max(0, affection) / 20) + 1);
}

export function affectionProgress(affection = 0): number {
  return Math.max(0, Math.min(100, affection % 20 === 0 && affection > 0 ? 100 : affection % 20 * 5));
}

export function growthForAnswer(companion: Companion, answer: GrowthAnswer): Companion {
  const normalized = normalizeCompanionGrowth(companion);
  const affectionGain = answer.correct ? (normalized.personality === "鼓舞者" && (answer.streak ?? 0) >= 2 ? 3 : 2) : 0;
  const trainingGain = answer.correct ? (normalized.personality === "探索者" && answer.curriculumDomain ? 2 : 1) : 0;
  return {
    ...normalized,
    affection: Math.min(100, (normalized.affection ?? 0) + affectionGain),
    trainingPoints: (normalized.trainingPoints ?? 0) + trainingGain,
  };
}

export function trainCompanion(companion: Companion, action: GrowthAction): Companion | null {
  const normalized = normalizeCompanionGrowth(companion);
  if ((normalized.trainingPoints ?? 0) < 2 || action === "feed") return null;
  const bonus = action === "train-focus" ? { energyPower: normalized.energyPower + 1 } : action === "train-guard" ? { defense: normalized.defense + 1, maxHp: normalized.maxHp + 2, hp: Math.min(normalized.maxHp + 2, normalized.hp + 2) } : { skillCost: -1 };
  const logLabel = action === "train-focus" ? "專注訓練" : action === "train-guard" ? "守護訓練" : "捕捉訓練";
  return {
    ...normalized,
    ...bonus,
    skillCost: Math.max(1, normalized.skillCost + (bonus.skillCost ?? 0)),
    trainingPoints: (normalized.trainingPoints ?? 0) - 2,
    trainingLog: [logLabel, ...(normalized.trainingLog ?? [])].slice(0, 6),
  };
}

export function unlockGrowthAchievements(companion: Companion, totalCorrect: number, domainCorrect: number, hasChallengeCorrect: boolean): { companion: Companion; unlocked: RpgAchievement[] } {
  const normalized = normalizeCompanionGrowth(companion);
  const checks: Record<string, boolean> = {
    "first-light": totalCorrect >= 1,
    "steady-mind": totalCorrect >= 5,
    "domain-tracker": domainCorrect >= 3,
    "brave-challenger": hasChallengeCorrect,
  };
  const unlocked = GROWTH_ACHIEVEMENTS.filter((item) => checks[item.id] && !normalized.achievementIds?.includes(item.id));
  return {
    unlocked,
    companion: unlocked.reduce((current, item) => ({ ...current, affection: Math.min(100, (current.affection ?? 0) + item.rewardAffection), trainingPoints: (current.trainingPoints ?? 0) + item.rewardTrainingPoints, achievementIds: [...(current.achievementIds ?? []), item.id] }), normalized),
  };
}

export function equippedSkillLabels(companion: Companion): string[] {
  const labels: Record<string, string> = { "study-focus": "專注脈衝", "shield-memory": "記憶護盾", "capture-instinct": "觀察捕捉", "streak-surge": "連勝共鳴" };
  return (normalizeCompanionGrowth(companion).equippedSkillIds ?? []).map((id) => labels[id] ?? id);
}
