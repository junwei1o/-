import type { AnimeWorldviewProgress } from "./animeWorldviewProgress";
import type { SafetyAcademyProgress } from "./safetyAcademyProgress";

export type RegionKey = "north" | "central" | "east" | "south";
export type ArenaHabitatKey = "tidal-grove" | "cloud-shelf" | "star-current" | "coral-shallows";
export type Rarity = "common" | "rare" | "legendary";

export type Companion = {
  id: string;
  name: string;
  epithet: string;
  region: RegionKey;
  rarity: Rarity;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  energyPower: number;
  defense: number;
  dialogue: string[];
  skillName: string;
  skillCost: number;
  accent: string;
  /** Optional fields keep pre-evolution localStorage saves backward compatible. */
  evolutionStage?: number;
  passiveSkillIds?: string[];
  appearanceClass?: string;
  /** Answer-earned progression fields; optional for legacy save compatibility. */
  affection?: number;
  trainingPoints?: number;
  personality?: "觀察家" | "守護者" | "探索者" | "鼓舞者";
  equippedSkillIds?: string[];
  achievementIds?: string[];
  trainingLog?: string[];
};

export type RpgAchievement = {
  id: string;
  title: string;
  description: string;
  domain: string;
  requiredAnswers: number;
  rewardAffection: number;
  rewardTrainingPoints: number;
};

export type AcademyRouteProgress = {
  correctAnswers: number;
  /** Legacy field kept optional so pre-cleanup local saves remain valid. */
  bossVictories?: number;
};

export type AcademyDailyProgress = {
  dayKey: string;
  correctAnswers: number;
  rewarded: boolean;
};

/** Per-habitat daily learning steps; the day key safely resets local progress. */
export type HabitatDailyProgress = {
  dayKey: string;
  correctByHabitat: Partial<Record<ArenaHabitatKey, number>>;
  completedHabitatIds: ArenaHabitatKey[];
};

/** Four-subject, answer-earned orientation keeps a new learner's first route transparent. */
export type AcademySubject = "數學" | "自然" | "社會" | "國語";

export type AcademyOnboarding = {
  subjectChecks: Partial<Record<AcademySubject, boolean>>;
  completed: boolean;
};

export type Encounter = {
  id: string;
  name: string;
  region: RegionKey;
  level: number;
  hp: number;
  maxHp: number;
  defense: number;
  captureCost: number;
  description: string;
  accent: string;
  habitatId?: ArenaHabitatKey;
  rarity?: Rarity;
};

export type AdventureJournalSummary = {
  dayKey: string;
  summary: string;
  answered: number;
  correct: number;
  accuracy: number | null;
  subject: string | null;
};

export type RpgState = {
  version: 1;
  coins: number;
  energy: number;
  explored: RegionKey[];
  companions: Companion[];
  activeCompanionId: string;
  currentRegion: RegionKey;
  answeredEventIds: string[];
  notice: string;
  /** Versioned answer-driven growth milestones. */
  growthVersion?: number;
  achievements?: RpgAchievement[];
  correctAnswerCount?: number;
  domainAnswerCounts?: Record<string, number>;
  challengeCorrectCount?: number;
  /** Original academy expedition progress; optional keeps earlier local saves usable. */
  academyProgress?: Partial<Record<RegionKey, AcademyRouteProgress>>;
  /** Local-day quest progress; regenerated from real answer events on a new day. */
  academyDaily?: AcademyDailyProgress;
  /** Optional daily habitat steps keep earlier local saves compatible. */
  habitatDailyProgress?: HabitatDailyProgress;
  /** Original four-subject orientation; optional so earlier local saves remain usable. */
  academyOnboarding?: AcademyOnboarding;
  /** Answer-driven regional mission progress; optional for legacy saves. */
  regionMissionProgress?: Record<string, { correct: number; completed: boolean; claimed: boolean }>;
  /** Original academy story, side quest, and regional event progress. */
  storyProgress?: {
    version: 1;
    correctByQuest: Record<string, number>;
    completedQuestIds: string[];
    claimedQuestIds: string[];
    eventFlags: string[];
  };
  /** Last user-selected arena habitat; optional keeps prior local saves usable. */
  arenaHabitatId?: ArenaHabitatKey;
  /** Best scores from completed original worldview quizzes; optional for legacy saves. */
  animeWorldviewProgress?: AnimeWorldviewProgress;
  /** Life-safety academy card completion; optional so earlier local saves remain usable. */
  safetyAcademyProgress?: SafetyAcademyProgress;
};
