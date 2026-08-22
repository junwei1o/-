import type { AnimeWorldviewProgress } from "./animeWorldviewProgress";

export type RegionKey = "north" | "central" | "east" | "south";
export type ArenaHabitatKey = "tidal-grove" | "cloud-shelf" | "star-current" | "coral-shallows";
export type RpgMode = "explore" | "encounter" | "battle" | "victory" | "defeat";
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
  bossVictories: number;
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

export type BattlePerformance = {
  questionId: string;
  correct: boolean;
  responseMs: number;
  accuracy: number;
  attackPower: number;
  defensePower: number;
  captureChance: number;
  /** Optional bonus unlocked by streak-based evolution passives. */
  ultimatePowerBonus?: number;
  /** Current correctly answered curriculum-question combo, added in battle engine stage two. */
  comboCount?: number;
  /** True when the combo reached the three-answer critical threshold. */
  criticalHit?: boolean;
  /** Optional equipment/talent critical chance, expressed as 0–1. */
  criticalRate?: number;
  /** Optional world-state multiplier applied to answer attack power. */
  attackMultiplier?: number;
};

export type BattleRageSkill = "precise" | "shield" | "heal";

export type BattlePendingAction =
  | { type: "skill"; cost: number; power: number; label: string }
  | { type: "ultimate"; cost: number; power: number; label: string }
  | { type: `rage-${BattleRageSkill}`; cost: number; power: number; label: string };

export type BattleState = {
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  energy: number;
  enemyName: string;
  turn: "player" | "enemy" | "ended";
  phase: "ready" | "question" | "action";
  questionId: string;
  pendingAction: BattlePendingAction | null;
  performance: BattlePerformance | null;
  ultimateUsed: boolean;
  /** Set only after an incorrect 防護壁壘 answer; consumed by the next enemy response. */
  strategyShieldActive: boolean;
  log: string[];
  result: "active" | "victory" | "defeat";
};

export type AdventureJournalSummary = {
  dayKey: string;
  summary: string;
  answered: number;
  correct: number;
  accuracy: number | null;
  subject: string | null;
};

export type PlayerExpansionProgress = {
  talentPoints: number;
  talents: Partial<Record<"precision" | "resilience" | "knowledge-drain" | "lucky-star", number>>;
  equippedGearIds: string[];
  fragments: Record<string, number>;
  journalSummaries: AdventureJournalSummary[];
  activeWorldEvents: Array<{ id: string; kind: "knowledge-storm" | "wandering-merchant" | "mystery-chest"; region: RegionKey; label: string; description: string; expiresAt: number; reward: { gold?: number; potion?: number; expMultiplier?: number } }>;
  worldEventDayKey: string;
  worldEventsTriggeredToday: number;
};

export type RpgState = {
  version: 1;
  coins: number;
  energy: number;
  explored: RegionKey[];
  companions: Companion[];
  activeCompanionId: string;
  mode: RpgMode;
  currentRegion: RegionKey;
  encounter: Encounter | null;
  battle: BattleState | null;
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
  academyGearIds?: string[];
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
  /** Victory-driven map links; optional so earlier local saves remain compatible. */
  mapVictoryProgress?: {
    unlockedRouteIds: string[];
    supplyMarkerIds: string[];
  };
  /** Mainline, growth, journal, and dynamic-world expansion state. */
  expansionProgress?: PlayerExpansionProgress;
};
