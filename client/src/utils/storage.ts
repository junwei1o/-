import { loadAdaptiveProfile, recordAdaptiveAttempt, saveAdaptiveProfile, type AdaptiveAttempt, type AdaptiveDifficulty, type AdaptiveErrorType } from "@/game/adaptiveLearning";
import { loadRpgState, saveRpgState } from "@/game/rpgStorage";
import { subjectIdForDomain, type SubjectId } from "@/data/subjects";

export const PLAYER_DATA_KEY = "xueAdventurerData";
export const LEARNING_RECORD_KEY = "xueLearningRecord";
export const STORAGE_ERROR_LOG_KEY = "errorLogs";
export const BATTLE_STATE_KEY = "xueBattleState";
export const BATTLE_VOLUME_KEY = "xueBattleVolume";
export const SELF_CHALLENGE_BEST_KEY = "xueSelfChallengeBest";
export const KNOWLEDGE_DUEL_RECORDS_KEY = "xueKnowledgeDuelRecords";
export const DAILY_SIGN_IN_KEY = "xueSignIn";
export const DEFAULT_BATTLE_VOLUME = 0.65;

export function getBattleVolume(storage: StorageLike | null = browserStorage()): number {
  const raw = safeGet(storage, BATTLE_VOLUME_KEY, "讀取戰鬥音量");
  if (raw === null) return DEFAULT_BATTLE_VOLUME;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : DEFAULT_BATTLE_VOLUME;
}

export function saveBattleVolume(volume: number, storage: StorageLike | null = browserStorage()): number {
  const normalized = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : DEFAULT_BATTLE_VOLUME;
  safeSet(storage, BATTLE_VOLUME_KEY, String(normalized), "保存戰鬥音量");
  return normalized;
}

export type BattleSnapshot = {
  playerHP: number;
  enemyHP: number;
  maxHP: number;
  currentCombo: number;
  enemyId: string;
  questionId: string;
  questionIndex: number;
  isActive: boolean;
  updatedAt: number;
};

export type PlayerData = {
  name: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  gold: number;
  totalAnswers: number;
  badges: string[];
  unlockedSubjects: SubjectId[];
};

export type LearningRecord = {
  questionId: string;
  subject: string;
  isCorrect: boolean;
  errorType?: AdaptiveErrorType;
  timestamp: number;
  flagged: boolean;
};

export type SelfChallengeBest = {
  completed: number;
  correct: number;
  updatedAt: number;
};

export type KnowledgeDuelRecord = {
  id: string;
  timestamp: number;
  winner: "player" | "ai" | "draw";
  playerWins: number;
  aiWins: number;
  weakSubjects: string[];
  usedCards: string[];
};

export type DailySignIn = {
  lastDay: string | null;
  streak: number;
};

export type DailySignInClaim = {
  signIn: DailySignIn;
  claimed: boolean;
  unlockedWeeklyTitle: boolean;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem"> & Partial<Pick<Storage, "key" | "length">>;
export type StorageErrorLog = { context: string; message: string; timestamp: number };
export type StorageNotice = { kind: "quota" | "error"; message: string };
export type StorageUsageSummary = {
  available: boolean;
  usedBytes: number | null;
  keyCount: number | null;
};

let memoryPlayerData: PlayerData | null = null;
let memoryLearningRecords: LearningRecord[] | null = null;
let lastStorageNotice: StorageNotice | null = null;
let memoryBattleState: BattleSnapshot | null = null;

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch (error) {
    logError(error, "取得 localStorage");
    return null;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isQuotaExceededError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "QuotaExceededError" || error.code === 22 || error.code === 1014
    : Boolean(error && typeof error === "object" && "name" in error && (error as { name?: string }).name === "QuotaExceededError");
}

function notifyStorageIssue(notice: StorageNotice) {
  lastStorageNotice = notice;
}

function isBattleSnapshot(value: unknown): value is BattleSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<BattleSnapshot>;
  const numericValues = [snapshot.playerHP, snapshot.enemyHP, snapshot.maxHP, snapshot.currentCombo, snapshot.questionIndex, snapshot.updatedAt];
  return numericValues.every((item) => typeof item === "number" && Number.isFinite(item))
    && typeof snapshot.enemyId === "string"
    && typeof snapshot.questionId === "string"
    && typeof snapshot.isActive === "boolean"
    && typeof snapshot.maxHP === "number" && snapshot.maxHP > 0
    && typeof snapshot.playerHP === "number" && snapshot.playerHP >= 0
    && typeof snapshot.enemyHP === "number" && snapshot.enemyHP >= 0;
}

export function getBattleState(storage: StorageLike | null = browserStorage()): BattleSnapshot | null {
  if (!storage) return memoryBattleState;
  const raw = safeGet(storage, BATTLE_STATE_KEY, "讀取戰鬥快照");
  if (!raw) return memoryBattleState;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isBattleSnapshot(parsed)) throw new Error("戰鬥快照欄位不完整");
    memoryBattleState = parsed;
    return parsed;
  } catch (error) {
    logError(error, "戰鬥快照格式驗證", storage);
    safeRemove(storage, BATTLE_STATE_KEY, "清除損壞戰鬥快照");
    memoryBattleState = null;
    return null;
  }
}

export function saveBattleState(snapshot: BattleSnapshot, storage: StorageLike | null = browserStorage()): BattleSnapshot {
  const next: BattleSnapshot = {
    ...snapshot,
    playerHP: Math.max(0, snapshot.playerHP),
    enemyHP: Math.max(0, snapshot.enemyHP),
    maxHP: Math.max(1, snapshot.maxHP),
    currentCombo: Math.max(0, Math.floor(snapshot.currentCombo)),
    questionIndex: Math.max(0, Math.floor(snapshot.questionIndex)),
    updatedAt: Date.now(),
  };
  memoryBattleState = next;
  if (!writeStoredJson(BATTLE_STATE_KEY, next, storage)) memoryBattleState = next;
  return next;
}

export function clearBattleState(storage: StorageLike | null = browserStorage()): boolean {
  memoryBattleState = null;
  return safeRemove(storage, BATTLE_STATE_KEY, "清除戰鬥快照");
}

export function consumeStorageNotice(): StorageNotice | null {
  const notice = lastStorageNotice;
  lastStorageNotice = null;
  return notice;
}

export function logError(error: unknown, context: string, storage: StorageLike | null = browserStorage()) {
  const entry: StorageErrorLog = { context, message: errorMessage(error), timestamp: Date.now() };
  console.error(`[storage] ${context}`, error);
  try {
    const existing = storage?.getItem(STORAGE_ERROR_LOG_KEY);
    const logs = existing ? JSON.parse(existing) : [];
    const next = Array.isArray(logs) ? [...logs, entry].slice(-100) : [entry];
    storage?.setItem(STORAGE_ERROR_LOG_KEY, JSON.stringify(next));
  } catch (logFailure) {
    // A full or unavailable storage must never make learning unavailable.
    console.error("[storage] 無法保存錯誤日誌", logFailure);
  }
}

function safeGet(storage: StorageLike | null, key: string, context: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (error) {
    logError(error, context, storage);
    notifyStorageIssue({ kind: "error", message: "儲存空間無法讀取，已暫時使用目前頁面的資料。" });
    return null;
  }
}

function safeSet(storage: StorageLike | null, key: string, value: string, context: string): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    logError(error, context, storage);
    notifyStorageIssue({ kind: isQuotaExceededError(error) ? "quota" : "error", message: "儲存空間不足，部分資料可能無法保存" });
    return false;
  }
}

function safeRemove(storage: StorageLike | null, key: string, context: string): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    logError(error, context, storage);
    return false;
  }
}

/** 給非核心遊戲服務使用的安全字串讀取入口；所有例外都會進入統一錯誤與 notice 流程。 */
export function readStoredValue(key: string, fallback: string | null = null, storage: StorageLike | null = browserStorage()): string | null {
  const value = safeGet(storage, key, `讀取 ${key}`);
  return value ?? fallback;
}

/** 給非核心遊戲服務使用的安全字串寫入入口；失敗時保留本次頁面的記憶體降級值。 */
export function writeStoredValue(key: string, value: string, storage: StorageLike | null = browserStorage()): boolean {
  return safeSet(storage, key, value, `保存 ${key}`);
}

/** 給非核心遊戲服務使用的安全刪除入口。 */
export function deleteStoredValue(key: string, storage: StorageLike | null = browserStorage()): boolean {
  return safeRemove(storage, key, `刪除 ${key}`);
}

function isStorageErrorLog(value: unknown): value is StorageErrorLog {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<StorageErrorLog>;
  return typeof entry.context === "string"
    && typeof entry.message === "string"
    && typeof entry.timestamp === "number"
    && Number.isFinite(entry.timestamp);
}

/** 設定頁使用的錯誤日誌查詢入口；損壞或無法讀取時安全回傳空陣列。 */
export function getStorageErrorLogs(storage: StorageLike | null = browserStorage()): StorageErrorLog[] {
  const logs = readStoredJson<unknown>(STORAGE_ERROR_LOG_KEY, [], storage);
  if (!Array.isArray(logs)) return [];
  return logs.filter(isStorageErrorLog).slice(-100).reverse();
}

/** 清除設定頁顯示的儲存錯誤日誌。 */
export function clearStorageErrorLogs(storage: StorageLike | null = browserStorage()): boolean {
  return deleteStoredValue(STORAGE_ERROR_LOG_KEY, storage);
}

/**
 * 供安全診斷畫面顯示的 localStorage 使用量。只回傳位元組與鍵數，絕不回傳鍵名或內容。
 * 若瀏覽器不支援列舉鍵名，仍保留可用狀態並以 null 表示無法估算。
 */
export function getStorageUsageSummary(storage: StorageLike | null = browserStorage()): StorageUsageSummary {
  if (!storage) return { available: false, usedBytes: null, keyCount: null };
  if (typeof storage.length !== "number" || typeof storage.key !== "function") {
    return { available: true, usedBytes: null, keyCount: null };
  }

  try {
    let usedBytes = 0;
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key === null) continue;
      const value = safeGet(storage, key, "估算 localStorage 使用量") ?? "";
      usedBytes += new Blob([key]).size + new Blob([value]).size;
    }
    return { available: true, usedBytes, keyCount: storage.length };
  } catch (error) {
    logError(error, "估算 localStorage 使用量", storage);
    return { available: true, usedBytes: null, keyCount: null };
  }
}

/** 受保護的 JSON 讀取；格式錯誤時回傳 fallback 並保留統一錯誤記錄。 */
export function readStoredJson<T>(key: string, fallback: T, storage: StorageLike | null = browserStorage()): T {
  const raw = safeGet(storage, key, `讀取 ${key}`);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("資料格式錯誤，已重置", error);
    logError(error, `${key} JSON 格式驗證`, storage);
    notifyStorageIssue({ kind: "error", message: "資料格式錯誤，已重置為預設值" });
    return fallback;
  }
}

/** 受保護的 JSON 寫入，統一序列化與配額錯誤處理。 */
export function writeStoredJson<T>(key: string, value: T, storage: StorageLike | null = browserStorage()): boolean {
  try {
    return safeSet(storage, key, JSON.stringify(value), `保存 ${key}`);
  } catch (error) {
    logError(error, `${key} JSON 序列化`, storage);
    notifyStorageIssue({ kind: "error", message: "資料格式無法保存，已暫存於目前頁面。" });
    return false;
  }
}

function derivePlayerData(storage: StorageLike | null = browserStorage()): PlayerData {
  const rpg = storage ? loadRpgState(storage) : { coins: 100, correctAnswerCount: 0, achievements: [], academyOnboarding: { completed: false } };
  const profile = storage ? loadAdaptiveProfile(storage) : null;
  const correctAnswers = Math.max(0, rpg.correctAnswerCount ?? 0);
  const totalAnswers = profile?.attempts.length ?? memoryLearningRecords?.length ?? 0;
  const hasCanonicalRpg = Boolean(safeGet(storage, "xue-adventure-rpg-v1", "讀取 RPG 資料存在狀態"));
  const level = Math.floor(correctAnswers / 10) + 1;
  const expToNextLevel = 100;
  return {
    name: "島嶼探險家",
    level,
    exp: (correctAnswers * 10) % expToNextLevel,
    expToNextLevel,
    gold: hasCanonicalRpg ? Math.max(0, rpg.coins) : 100,
    totalAnswers,
    badges: (rpg.achievements ?? []).map((item) => item.id),
    unlockedSubjects: ["chinese", ...(rpg.academyOnboarding?.completed ? ["math", "english", "science"] as SubjectId[] : [])],
  };
}

function isLearningRecord(value: unknown): value is LearningRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<LearningRecord>;
  return typeof record.questionId === "string"
    && typeof record.subject === "string"
    && typeof record.isCorrect === "boolean"
    && typeof record.timestamp === "number"
    && Number.isFinite(record.timestamp)
    && typeof record.flagged === "boolean";
}

function isPlayerDataSnapshot(value: unknown): value is Pick<PlayerData, "level" | "exp" | "gold" | "totalAnswers" | "badges"> {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<PlayerData>;
  return typeof data.level === "number"
    && Number.isFinite(data.level)
    && typeof data.exp === "number"
    && Number.isFinite(data.exp)
    && typeof data.gold === "number"
    && Number.isFinite(data.gold)
    && typeof data.totalAnswers === "number"
    && Number.isFinite(data.totalAnswers)
    && Array.isArray(data.badges);
}

function persistPlayerSnapshot(storage: StorageLike | null, data: PlayerData): boolean {
  const saved = safeSet(storage, PLAYER_DATA_KEY, JSON.stringify(data), "保存玩家資料");
  if (!saved) memoryPlayerData = data;
  return saved;
}

function pruneOldestRecords(records: LearningRecord[]): LearningRecord[] {
  return [...records].sort((a, b) => a.timestamp - b.timestamp).slice(100);
}

function persistLearningSnapshot(storage: StorageLike | null, records: LearningRecord[]): boolean {
  if (safeSet(storage, LEARNING_RECORD_KEY, JSON.stringify(records), "保存學習紀錄")) {
    memoryLearningRecords = records;
    return true;
  }
  const notice = lastStorageNotice;
  if (notice?.kind === "quota" && records.length > 100) {
    const pruned = pruneOldestRecords(records);
    if (safeSet(storage, LEARNING_RECORD_KEY, JSON.stringify(pruned), "保存清理後的學習紀錄")) {
      memoryLearningRecords = pruned;
      notifyStorageIssue({ kind: "quota", message: "已自動清理部分舊資料以釋放空間" });
      return true;
    }
  }
  memoryLearningRecords = records;
  return false;
}

function persistCompatibilitySnapshot(storage: StorageLike) {
  const profile = loadAdaptiveProfile(storage);
  const records = profile.attempts.map(toLearningRecord);
  persistPlayerSnapshot(storage, derivePlayerData(storage));
  persistLearningSnapshot(storage, records);
}

function toLearningRecord(attempt: AdaptiveAttempt): LearningRecord {
  return {
    questionId: attempt.questionId,
    subject: attempt.curriculumDomain,
    isCorrect: attempt.correct,
    ...(attempt.errorType ? { errorType: attempt.errorType } : {}),
    timestamp: attempt.timestamp,
    flagged: attempt.flagged === true,
  };
}

export function getPlayerName(storage: StorageLike | null = browserStorage()): string {
  const parseName = (key: string) => {
    const raw = safeGet(storage, key, `讀取 ${key} 名稱`);
    if (!raw) return "";
    try {
      const value = JSON.parse(raw) as { displayName?: unknown; name?: unknown; username?: unknown };
      return [value.displayName, value.name, value.username].find((name): name is string => typeof name === "string" && Boolean(name.trim()))?.trim() ?? "";
    } catch (error) {
      logError(error, `${key} 名稱格式驗證`, storage);
      return "";
    }
  };
  return parseName("playerData") || parseName(PLAYER_DATA_KEY) || "小小航海士";
}

export function getPlayerData(storage: StorageLike | null = browserStorage()): PlayerData {
  if (!storage) return memoryPlayerData ?? derivePlayerData(null);
  const raw = safeGet(storage, PLAYER_DATA_KEY, "讀取玩家資料");
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isPlayerDataSnapshot(parsed)) {
        const derived = derivePlayerData(storage);
        return {
          ...derived,
          ...parsed,
          totalAnswers: Math.max(0, Math.floor(parsed.totalAnswers)),
          badges: parsed.badges.filter((item): item is string => typeof item === "string"),
        };
      }
      throw new Error("玩家資料欄位不完整");
    } catch (error) {
      console.error("資料格式錯誤，已重置", error);
      logError(error, "玩家資料格式驗證", storage);
    }
  }
  const next = raw ? derivePlayerData(storage) : memoryPlayerData ?? derivePlayerData(storage);
  persistPlayerSnapshot(storage, next);
  return next;
}

export function initPlayerData(storage: StorageLike | null = browserStorage()): PlayerData {
  return getPlayerData(storage);
}

export function savePlayerData(data: PlayerData, storage: StorageLike | null = browserStorage()): PlayerData {
  const next: PlayerData = {
    ...data,
    level: Math.max(1, Math.floor(data.level)),
    exp: Math.max(0, data.exp),
    gold: Math.max(0, data.gold),
    totalAnswers: Math.max(0, Math.floor(data.totalAnswers)),
    badges: Array.isArray(data.badges) ? data.badges.filter((item): item is string => typeof item === "string") : [],
  };
  memoryPlayerData = next;
  persistPlayerSnapshot(storage, next);
  return next;
}

export function updatePlayerData(updates: Partial<PlayerData>, storage: StorageLike | null = browserStorage()): PlayerData {
  const current = getPlayerData(storage);
  return savePlayerData({
    ...current,
    ...updates,
    level: Math.max(1, Math.floor(updates.level ?? current.level)),
    exp: Math.max(0, updates.exp ?? current.exp),
    gold: Math.max(0, updates.gold ?? current.gold),
    totalAnswers: Math.max(0, Math.floor(updates.totalAnswers ?? current.totalAnswers)),
    badges: updates.badges ?? current.badges,
  }, storage);
}

export function initLearningRecord(storage: StorageLike | null = browserStorage()): LearningRecord[] {
  return getLearningRecord(storage);
}

export function getLearningRecord(storage: StorageLike | null = browserStorage()): LearningRecord[] {
  if (!storage) return memoryLearningRecords ?? [];
  const raw = safeGet(storage, LEARNING_RECORD_KEY, "讀取學習紀錄");
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(isLearningRecord)) {
        memoryLearningRecords = parsed;
        return parsed;
      }
      throw new Error("學習紀錄欄位不完整");
    } catch (error) {
      console.error("資料格式錯誤，已重置", error);
      logError(error, "學習紀錄格式驗證", storage);
    }
  }
  const profile = loadAdaptiveProfile(storage);
  const records = profile.attempts.map(toLearningRecord);
  memoryLearningRecords = records;
  persistLearningSnapshot(storage, records);
  return records;
}

function difficultyFor(value: unknown): AdaptiveDifficulty {
  return value === "標準" || value === "挑戰" ? value : "基礎";
}

export function addRecord(record: LearningRecord & { knowledge?: string[]; difficulty?: AdaptiveDifficulty; responseMs?: number; timeLimitMs?: number }, storage: StorageLike | null = browserStorage()): LearningRecord[] {
  lastStorageNotice = null;
  if (!storage) {
    memoryLearningRecords = [...(memoryLearningRecords ?? []), record];
    notifyStorageIssue({ kind: "error", message: "目前無法使用儲存空間，資料暫存於本頁面。" });
    return memoryLearningRecords;
  }
  const profile = loadAdaptiveProfile(storage);
  const nextProfile = recordAdaptiveAttempt(profile, {
    questionId: record.questionId,
    curriculumDomain: record.subject,
    knowledge: (record.knowledge ?? []).filter((item): item is string => typeof item === "string"),
    difficulty: difficultyFor(record.difficulty),
    correct: record.isCorrect,
    responseMs: Math.max(0, record.responseMs ?? 25_000),
    timeLimitMs: Math.max(1_000, record.timeLimitMs ?? 25_000),
    flagged: record.flagged === true,
    ...(record.errorType ? { errorType: record.errorType } : {}),
    timestamp: record.timestamp,
  });
  saveAdaptiveProfile(nextProfile, storage);
  const rpg = loadRpgState(storage);
  saveRpgState(rpg, storage);
  persistCompatibilitySnapshot(storage);
  const records = nextProfile.attempts.map(toLearningRecord);
  memoryLearningRecords = records;
  return records;
}

export function addLearningRecord(record: LearningRecord & { knowledge?: string[]; difficulty?: AdaptiveDifficulty; responseMs?: number; timeLimitMs?: number }, storage: StorageLike | null = browserStorage()): LearningRecord[] {
  return addRecord(record, storage);
}

export function initGameData(storage: StorageLike | null = browserStorage()): { playerData: PlayerData; learningRecord: LearningRecord[] } {
  if (!storage) return { playerData: initPlayerData(null), learningRecord: [] };
  loadAdaptiveProfile(storage);
  loadRpgState(storage);
  return { playerData: initPlayerData(storage), learningRecord: initLearningRecord(storage) };
}

export function subjectForRecord(record: LearningRecord): SubjectId | null {
  return subjectIdForDomain(record.subject);
}

export function clearStorageNotice() {
  lastStorageNotice = null;
}

export function removeStoredValue(key: string, storage: StorageLike | null = browserStorage()): boolean {
  return safeRemove(storage, key, `刪除 ${key}`);
}


export type WeeklyLearningGoal = {
  subject: string;
  targetAccuracy: number;
  weekKey: string;
  createdAt: number;
};

const WEEKLY_GOAL_KEY = "xue-adventure-weekly-learning-goal-v1";

export function getWeeklyLearningGoal(storage: StorageLike | null = browserStorage()): WeeklyLearningGoal | null {
  const raw = safeGet(storage, WEEKLY_GOAL_KEY, "讀取每週學習目標");
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const value = parsed as Partial<WeeklyLearningGoal>;
    if (typeof value.subject !== "string" || typeof value.targetAccuracy !== "number" || typeof value.weekKey !== "string" || typeof value.createdAt !== "number") return null;
    return { subject: value.subject, targetAccuracy: Math.max(0, Math.min(100, value.targetAccuracy)), weekKey: value.weekKey, createdAt: value.createdAt };
  } catch (error) {
    logError(error, "每週學習目標格式驗證", storage);
    return null;
  }
}

export function saveWeeklyLearningGoal(goal: WeeklyLearningGoal, storage: StorageLike | null = browserStorage()): WeeklyLearningGoal {
  const normalized = { ...goal, targetAccuracy: Math.max(0, Math.min(100, goal.targetAccuracy)) };
  safeSet(storage, WEEKLY_GOAL_KEY, JSON.stringify(normalized), "保存每週學習目標");
  return normalized;
}

export type MainlineProgress = {
  regularDefeatsBySubject: Partial<Record<"chinese" | "math" | "english" | "science", number>>;
  defeatedGuardians: string[];
  liberatedSubjects: string[];
  unlockedOutfits: string[];
};

const MAINLINE_PROGRESS_KEY = "xue-adventure-mainline-progress-v1";
const WEEKLY_QUESTS_KEY = "xue-adventure-weekly-quests-v1";
const PARENT_PIN_KEY = "xue-adventure-parent-pin-v1";

const defaultMainlineProgress = (): MainlineProgress => ({ regularDefeatsBySubject: {}, defeatedGuardians: [], liberatedSubjects: [], unlockedOutfits: [] });

export function getMainlineProgress(storage: StorageLike | null = browserStorage()): MainlineProgress {
  const value = readStoredJson<unknown>(MAINLINE_PROGRESS_KEY, null, storage);
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultMainlineProgress();
  const item = value as Partial<MainlineProgress>;
  const regularDefeatsBySubject = item.regularDefeatsBySubject && typeof item.regularDefeatsBySubject === "object" ? Object.fromEntries(Object.entries(item.regularDefeatsBySubject).filter(([, count]) => typeof count === "number" && Number.isFinite(count)).map(([subject, count]) => [subject, Math.max(0, Math.floor(count as number))])) : {};
  return {
    regularDefeatsBySubject,
    defeatedGuardians: Array.isArray(item.defeatedGuardians) ? item.defeatedGuardians.filter((id): id is string => typeof id === "string") : [],
    liberatedSubjects: Array.isArray(item.liberatedSubjects) ? item.liberatedSubjects.filter((subject): subject is string => typeof subject === "string") : [],
    unlockedOutfits: Array.isArray(item.unlockedOutfits) ? item.unlockedOutfits.filter((id): id is string => typeof id === "string") : [],
  };
}

export function recordRegularMonsterDefeat(subject: "chinese" | "math" | "english" | "science", storage: StorageLike | null = browserStorage()): MainlineProgress {
  const current = getMainlineProgress(storage);
  const next = { ...current, regularDefeatsBySubject: { ...current.regularDefeatsBySubject, [subject]: (current.regularDefeatsBySubject[subject] ?? 0) + 1 } };
  writeStoredJson(MAINLINE_PROGRESS_KEY, next, storage);
  return next;
}

export function recordGuardianDefeat(guardianId: string, subject: "chinese" | "math" | "english" | "science", outfitId: string, storage: StorageLike | null = browserStorage()): MainlineProgress {
  const current = getMainlineProgress(storage);
  const next: MainlineProgress = { ...current, defeatedGuardians: Array.from(new Set([...current.defeatedGuardians, guardianId])), liberatedSubjects: Array.from(new Set([...current.liberatedSubjects, subject])), unlockedOutfits: Array.from(new Set([...current.unlockedOutfits, outfitId])) };
  writeStoredJson(MAINLINE_PROGRESS_KEY, next, storage);
  return next;
}

export type StoredWeeklyQuest = { id: string; weekKey: string; progress: number; claimed: boolean };
export function getStoredWeeklyQuests(storage: StorageLike | null = browserStorage()): StoredWeeklyQuest[] {
  const value = readStoredJson<unknown>(WEEKLY_QUESTS_KEY, [], storage);
  return Array.isArray(value) ? value.filter((item): item is StoredWeeklyQuest => Boolean(item && typeof item === "object" && typeof (item as StoredWeeklyQuest).id === "string" && typeof (item as StoredWeeklyQuest).weekKey === "string")).map((item) => ({ id: item.id, weekKey: item.weekKey, progress: Math.max(0, Number(item.progress) || 0), claimed: item.claimed === true })) : [];
}

export function saveStoredWeeklyQuests(quests: StoredWeeklyQuest[], storage: StorageLike | null = browserStorage()): StoredWeeklyQuest[] {
  const normalized = quests.slice(0, 20).map((quest) => ({ ...quest, progress: Math.max(0, Number(quest.progress) || 0), claimed: quest.claimed === true }));
  writeStoredJson(WEEKLY_QUESTS_KEY, normalized, storage);
  return normalized;
}

export function getParentPinHash(storage: StorageLike | null = browserStorage()): string | null {
  const value = safeGet(storage, PARENT_PIN_KEY, "讀取家長視角 PIN");
  return value && /^[0-9a-f]{8}$/.test(value) ? value : null;
}

export function saveParentPinHash(hash: string, storage: StorageLike | null = browserStorage()): boolean {
  return /^[0-9a-f]{8}$/.test(hash) && safeSet(storage, PARENT_PIN_KEY, hash, "保存家長視角 PIN");
}


const ONBOARDING_KEY = "xue-adventure-onboarding-complete-v1";
export function getOnboardingComplete(storage: StorageLike | null = browserStorage()): boolean {
  return safeGet(storage, ONBOARDING_KEY, "讀取新手導覽狀態") === "true";
}
export function saveOnboardingComplete(complete = true, storage: StorageLike | null = browserStorage()): boolean {
  return safeSet(storage, ONBOARDING_KEY, complete ? "true" : "false", "保存新手導覽狀態");
}


const BATTLE_TUTORIAL_KEY = "xue-adventure-battle-tutorial-complete-v1";
export function getBattleTutorialComplete(storage: StorageLike | null = browserStorage()): boolean {
  return safeGet(storage, BATTLE_TUTORIAL_KEY, "讀取戰鬥教學狀態") === "true";
}
export function saveBattleTutorialComplete(complete = true, storage: StorageLike | null = browserStorage()): boolean {
  return safeSet(storage, BATTLE_TUTORIAL_KEY, complete ? "true" : "false", "保存戰鬥教學狀態");
}


export const LIMITED_TITLES_KEY = "xue-adventure-limited-titles-v1";
export const SELECTED_TITLE_KEY = "xue-adventure-selected-title-v1";
export const RARE_MONSTER_DEFEATS_KEY = "xue-adventure-rare-monster-defeats-v1";
export const BATTLE_RECAPS_KEY = "xue-adventure-battle-recaps-v1";
export const ANALYTICS_KEY = "xue-adventure-analytics-v1";
export const ANALYTICS_CONSENT_KEY = "xue-adventure-analytics-consent-v1";
export const PLAYER_PROFILE_KEY = "xue-adventure-player-profile-v1";
export const ACCESSIBILITY_PREFS_KEY = "xue-adventure-accessibility-prefs-v1";

export const PLAYER_AVATARS = [
  { id: "tide-scout", label: "潮汐航海員", emoji: "🧭" },
  { id: "ember-guard", label: "火光守衛", emoji: "🦊" },
  { id: "star-runner", label: "星河跑者", emoji: "⭐" },
  { id: "moss-mote", label: "苔原精靈", emoji: "🌿" },
  { id: "cloud-shell", label: "雲朵旅龜", emoji: "🐢" },
] as const;
export const PLAYER_THEME_COLORS = ["ocean", "sunset", "forest"] as const;
export type PlayerAvatarId = typeof PLAYER_AVATARS[number]["id"];
export type PlayerThemeColor = typeof PLAYER_THEME_COLORS[number];
export type PlayerProfile = { avatar: PlayerAvatarId; themeColor: PlayerThemeColor };
export const EFFECT_INTENSITIES = ["low", "medium", "high"] as const;
export type EffectIntensity = typeof EFFECT_INTENSITIES[number];
export type AccessibilityPrefs = { effectIntensity: EffectIntensity; vibrationEnabled: boolean; reducedAnimation: boolean };

const defaultPlayerProfile = (): PlayerProfile => ({ avatar: "tide-scout", themeColor: "ocean" });
export function getPlayerProfile(storage: StorageLike | null = browserStorage()): PlayerProfile {
  const value = readStoredJson<unknown>(PLAYER_PROFILE_KEY, null, storage);
  if (!value || typeof value !== "object") return defaultPlayerProfile();
  const item = value as Partial<PlayerProfile>;
  return {
    avatar: PLAYER_AVATARS.some((avatar) => avatar.id === item.avatar) ? item.avatar as PlayerAvatarId : "tide-scout",
    themeColor: PLAYER_THEME_COLORS.includes(item.themeColor as PlayerThemeColor) ? item.themeColor as PlayerThemeColor : "ocean",
  };
}
export function savePlayerProfile(update: Partial<PlayerProfile>, storage: StorageLike | null = browserStorage()): PlayerProfile {
  const current = getPlayerProfile(storage);
  const next = getPlayerProfile({
    getItem: () => JSON.stringify({ ...current, ...update }),
    setItem: () => undefined,
    removeItem: () => undefined,
  });
  writeStoredJson(PLAYER_PROFILE_KEY, next, storage);
  return next;
}

export const defaultAccessibilityPrefs = (): AccessibilityPrefs => ({ effectIntensity: "high", vibrationEnabled: true, reducedAnimation: false });

function normalizeAccessibilityPrefs(value: unknown): AccessibilityPrefs {
  if (!value || typeof value !== "object") return defaultAccessibilityPrefs();
  const item = value as Partial<AccessibilityPrefs>;
  return {
    effectIntensity: EFFECT_INTENSITIES.includes(item.effectIntensity as EffectIntensity) ? item.effectIntensity as EffectIntensity : "high",
    vibrationEnabled: typeof item.vibrationEnabled === "boolean" ? item.vibrationEnabled : true,
    reducedAnimation: typeof item.reducedAnimation === "boolean" ? item.reducedAnimation : false,
  };
}

export function applyAccessibilityPrefs(prefs: AccessibilityPrefs): AccessibilityPrefs {
  if (typeof document === "undefined") return prefs;
  document.documentElement.dataset.effectIntensity = prefs.effectIntensity;
  document.documentElement.dataset.vibrationEnabled = String(prefs.vibrationEnabled);
  document.documentElement.dataset.animationSimplified = String(prefs.reducedAnimation);
  return prefs;
}

export function getAccessibilityPrefs(storage: StorageLike | null = browserStorage()): AccessibilityPrefs {
  return normalizeAccessibilityPrefs(readStoredJson<unknown>(ACCESSIBILITY_PREFS_KEY, null, storage));
}

export function saveAccessibilityPrefs(update: Partial<AccessibilityPrefs>, storage: StorageLike | null = browserStorage()): AccessibilityPrefs {
  const current = getAccessibilityPrefs(storage);
  const next = normalizeAccessibilityPrefs({ ...current, ...update });
  writeStoredJson(ACCESSIBILITY_PREFS_KEY, next, storage);
  applyAccessibilityPrefs(next);
  return next;
}

export type AnalyticsConsent = "accepted" | "declined";
export type AnalyticsSubjectStats = {
  attempts: number;
  wrong: number;
  totalResponseMs: number;
  questionErrors: Record<string, number>;
};
export type AnalyticsPotionUse = {
  timestamp: number;
  hpRatio: number;
};
export type AnalyticsData = {
  version: 1;
  activeDays: string[];
  sessionCount: number;
  totalPlayMs: number;
  sessions: Array<{ startedAt: number; endedAt?: number }>;
  subjectStats: Partial<Record<SubjectId, AnalyticsSubjectStats>>;
  potionUses: AnalyticsPotionUse[];
};

export type BattleRecap = {
  id: string;
  timestamp: number;
  enemyId: string;
  enemyName: string;
  rare: boolean;
  maxCombo: number;
  strategyUses: number;
  partBreakTriggered: boolean;
};

const defaultAnalytics = (): AnalyticsData => ({
  version: 1,
  activeDays: [],
  sessionCount: 0,
  totalPlayMs: 0,
  sessions: [],
  subjectStats: {},
  potionUses: [],
});

export function getAnalyticsConsent(storage: StorageLike | null = browserStorage()): AnalyticsConsent | null {
  const value = safeGet(storage, ANALYTICS_CONSENT_KEY, "讀取匿名數據分享同意");
  return value === "accepted" || value === "declined" ? value : null;
}

export function saveAnalyticsConsent(consent: AnalyticsConsent, storage: StorageLike | null = browserStorage()): boolean {
  return safeSet(storage, ANALYTICS_CONSENT_KEY, consent, "保存匿名數據分享同意");
}

function normalizeAnalytics(value: unknown): AnalyticsData {
  if (!value || typeof value !== "object") return defaultAnalytics();
  const item = value as Partial<AnalyticsData>;
  const subjectStats: AnalyticsData["subjectStats"] = {};
  if (item.subjectStats && typeof item.subjectStats === "object") {
    for (const subject of ["chinese", "math", "english", "science"] as SubjectId[]) {
      const raw = item.subjectStats[subject];
      if (!raw || typeof raw !== "object") continue;
      const stats = raw as Partial<AnalyticsSubjectStats>;
      const questionErrors = stats.questionErrors && typeof stats.questionErrors === "object" ? Object.fromEntries(Object.entries(stats.questionErrors).filter(([, count]) => typeof count === "number" && Number.isFinite(count)).map(([id, count]) => [id, Math.max(0, Math.floor(count as number))])) : {};
      subjectStats[subject] = { attempts: Math.max(0, Math.floor(Number(stats.attempts) || 0)), wrong: Math.max(0, Math.floor(Number(stats.wrong) || 0)), totalResponseMs: Math.max(0, Number(stats.totalResponseMs) || 0), questionErrors };
    }
  }
  return {
    version: 1,
    activeDays: Array.isArray(item.activeDays) ? item.activeDays.filter((day): day is string => typeof day === "string").slice(-366) : [],
    sessionCount: Math.max(0, Math.floor(Number(item.sessionCount) || 0)),
    totalPlayMs: Math.max(0, Number(item.totalPlayMs) || 0),
    sessions: Array.isArray(item.sessions) ? item.sessions.filter((session): session is { startedAt: number; endedAt?: number } => Boolean(session && typeof session === "object" && typeof (session as { startedAt?: unknown }).startedAt === "number")).slice(-50) : [],
    subjectStats,
    potionUses: Array.isArray(item.potionUses) ? item.potionUses.filter((use): use is AnalyticsPotionUse => Boolean(use && typeof use === "object" && typeof (use as { timestamp?: unknown }).timestamp === "number" && typeof (use as { hpRatio?: unknown }).hpRatio === "number")).slice(-200) : [],
  };
}

export function getAnalytics(storage: StorageLike | null = browserStorage()): AnalyticsData {
  const raw = readStoredJson<unknown>(ANALYTICS_KEY, null, storage);
  return normalizeAnalytics(raw);
}

export function recordAnalyticsEvent(event: { type: "session-start"; timestamp?: number } | { type: "session-end"; timestamp?: number } | { type: "answer"; subject: string; questionId: string; correct: boolean; responseMs?: number; timestamp?: number } | { type: "potion-use"; hpRatio: number; timestamp?: number }, storage: StorageLike | null = browserStorage()): AnalyticsData {
  if (getAnalyticsConsent(storage) !== "accepted") return getAnalytics(storage);
  const data = getAnalytics(storage);
  const timestamp = event.timestamp ?? Date.now();
  const day = new Date(timestamp).toISOString().slice(0, 10);
  if (!data.activeDays.includes(day)) data.activeDays = [...data.activeDays, day].slice(-366);
  if (event.type === "session-start") {
    data.sessionCount += 1;
    data.sessions = [...data.sessions, { startedAt: timestamp }].slice(-50);
  } else if (event.type === "session-end") {
    const current = [...data.sessions].reverse().find((session) => !session.endedAt);
    if (current) {
      current.endedAt = timestamp;
      data.totalPlayMs += Math.max(0, timestamp - current.startedAt);
    }
  } else if (event.type === "answer") {
    const subject = subjectIdForDomain(event.subject);
    if (subject) {
      const current = data.subjectStats[subject] ?? { attempts: 0, wrong: 0, totalResponseMs: 0, questionErrors: {} };
      current.attempts += 1;
      current.totalResponseMs += Math.max(0, event.responseMs ?? 0);
      if (!event.correct) {
        current.wrong += 1;
        current.questionErrors[event.questionId] = (current.questionErrors[event.questionId] ?? 0) + 1;
      }
      data.subjectStats[subject] = current;
    }
  } else if (event.type === "potion-use") {
    data.potionUses = [...data.potionUses, { timestamp, hpRatio: Math.max(0, Math.min(1, event.hpRatio)) }].slice(-200);
  }
  writeStoredJson(ANALYTICS_KEY, data, storage);
  return data;
}

export function getLimitedTitles(storage: StorageLike | null = browserStorage()): string[] {
  const value = readStoredJson<unknown>(LIMITED_TITLES_KEY, [], storage);
  return Array.isArray(value) ? value.filter((title): title is string => typeof title === "string").slice(0, 100) : [];
}

export function unlockLimitedTitle(title: string, storage: StorageLike | null = browserStorage()): string[] {
  const next = Array.from(new Set([...getLimitedTitles(storage), title])).slice(0, 100);
  writeStoredJson(LIMITED_TITLES_KEY, next, storage);
  return next;
}

export function getAnalyticsSummary(storage: StorageLike | null = browserStorage()) {
  const data = getAnalytics(storage);
  const subjectSummary = Object.entries(data.subjectStats).map(([subject, stats]) => ({ subject, attempts: stats?.attempts ?? 0, wrong: stats?.wrong ?? 0, accuracy: stats?.attempts ? Math.round(((stats.attempts - (stats.wrong ?? 0)) / stats.attempts) * 100) : 0, averageResponseMs: stats?.attempts ? Math.round((stats.totalResponseMs ?? 0) / stats.attempts) : 0, stuckRate: stats?.attempts ? Math.round(((stats.wrong ?? 0) / stats.attempts) * 100) : 0, hardestQuestionId: stats?.questionErrors ? Object.entries(stats.questionErrors).sort(([, left], [, right]) => right - left)[0]?.[0] ?? null : null }));
  return { activeDays: data.activeDays.length, averagePlayMs: data.sessionCount ? Math.round(data.totalPlayMs / data.sessionCount) : 0, subjectSummary, potionUseCount: data.potionUses.length, lowHpPotionUseRate: data.potionUses.length ? Math.round((data.potionUses.filter((use) => use.hpRatio < 0.5).length / data.potionUses.length) * 100) : 0 };
}

export function getSelectedTitle(storage: StorageLike | null = browserStorage()): string | null {
  const value = safeGet(storage, SELECTED_TITLE_KEY, "讀取目前稱號");
  return typeof value === "string" && getLimitedTitles(storage).includes(value) ? value : null;
}

export function saveSelectedTitle(title: string | null, storage: StorageLike | null = browserStorage()): string | null {
  if (!title) {
    safeRemove(storage, SELECTED_TITLE_KEY, "清除目前稱號");
    return null;
  }
  if (!getLimitedTitles(storage).includes(title)) return getSelectedTitle(storage);
  safeSet(storage, SELECTED_TITLE_KEY, title, "保存目前稱號");
  return title;
}

export function getRareMonsterDefeats(storage: StorageLike | null = browserStorage()): Record<string, number> {
  const value = readStoredJson<unknown>(RARE_MONSTER_DEFEATS_KEY, {}, storage);
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, count]) => typeof count === "number" && Number.isFinite(count)).map(([id, count]) => [id, Math.max(0, Math.floor(count as number))]));
}

export function recordRareMonsterDefeat(monsterId: string, storage: StorageLike | null = browserStorage()): Record<string, number> {
  const next = { ...getRareMonsterDefeats(storage), [monsterId]: (getRareMonsterDefeats(storage)[monsterId] ?? 0) + 1 };
  writeStoredJson(RARE_MONSTER_DEFEATS_KEY, next, storage);
  return next;
}

export function getBattleRecaps(storage: StorageLike | null = browserStorage()): BattleRecap[] {
  const value = readStoredJson<unknown>(BATTLE_RECAPS_KEY, [], storage);
  return Array.isArray(value) ? value.filter((item): item is BattleRecap => Boolean(item && typeof item === "object" && typeof (item as BattleRecap).id === "string" && typeof (item as BattleRecap).timestamp === "number")).slice(-30) : [];
}

export function saveBattleRecap(recap: BattleRecap, storage: StorageLike | null = browserStorage()): BattleRecap[] {
  const next = [...getBattleRecaps(storage).filter((item) => item.id !== recap.id), recap].slice(-30);
  writeStoredJson(BATTLE_RECAPS_KEY, next, storage);
  return next;
}

export function getSelfChallengeBest(storage: StorageLike | null = browserStorage()): SelfChallengeBest {
  const value = readStoredJson<unknown>(SELF_CHALLENGE_BEST_KEY, { completed: 0, correct: 0, updatedAt: 0 }, storage);
  if (!value || typeof value !== "object" || Array.isArray(value)) return { completed: 0, correct: 0, updatedAt: 0 };
  const candidate = value as Partial<SelfChallengeBest>;
  return {
    completed: Math.max(0, Math.floor(Number(candidate.completed) || 0)),
    correct: Math.max(0, Math.floor(Number(candidate.correct) || 0)),
    updatedAt: Math.max(0, Math.floor(Number(candidate.updatedAt) || 0)),
  };
}

export function saveSelfChallengeBest(result: Omit<SelfChallengeBest, "updatedAt">, storage: StorageLike | null = browserStorage()): SelfChallengeBest {
  const current = getSelfChallengeBest(storage);
  const completed = Math.max(0, Math.floor(result.completed));
  const correct = Math.max(0, Math.floor(result.correct));
  const shouldReplace = correct > current.correct || (correct === current.correct && completed > current.completed);
  const next = shouldReplace ? { completed, correct, updatedAt: Date.now() } : current;
  writeStoredJson(SELF_CHALLENGE_BEST_KEY, next, storage);
  return next;
}

function localDayKey(now: number): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localDayDistance(firstDay: string, secondDay: string): number | null {
  const first = /^(\d{4})-(\d{2})-(\d{2})$/.exec(firstDay);
  const second = /^(\d{4})-(\d{2})-(\d{2})$/.exec(secondDay);
  if (!first || !second) return null;
  const firstUtc = Date.UTC(Number(first[1]), Number(first[2]) - 1, Number(first[3]));
  const secondUtc = Date.UTC(Number(second[1]), Number(second[2]) - 1, Number(second[3]));
  return Math.round((secondUtc - firstUtc) / 86_400_000);
}

export function getDailySignIn(storage: StorageLike | null = browserStorage()): DailySignIn {
  const value = readStoredJson<unknown>(DAILY_SIGN_IN_KEY, { lastDay: null, streak: 0 }, storage);
  if (!value || typeof value !== "object" || Array.isArray(value)) return { lastDay: null, streak: 0 };
  const candidate = value as Partial<DailySignIn>;
  const lastDay = typeof candidate.lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate.lastDay) ? candidate.lastDay : null;
  return { lastDay, streak: Math.min(9_999, Math.max(0, Math.floor(Number(candidate.streak) || 0))) };
}

export function hasSignedInToday(signIn: DailySignIn, now = Date.now()): boolean {
  return signIn.lastDay === localDayKey(now);
}

export function claimDailySignIn(now = Date.now(), storage: StorageLike | null = browserStorage()): DailySignInClaim {
  const current = getDailySignIn(storage);
  const today = localDayKey(now);
  if (current.lastDay === today) return { signIn: current, claimed: false, unlockedWeeklyTitle: false };

  const streak = current.lastDay && localDayDistance(current.lastDay, today) === 1
    ? Math.min(9_999, current.streak + 1)
    : 1;
  const signIn = { lastDay: today, streak };
  writeStoredJson(DAILY_SIGN_IN_KEY, signIn, storage);

  const weeklyTitle = "一週探險家";
  const unlockedWeeklyTitle = streak >= 7 && !getLimitedTitles(storage).includes(weeklyTitle);
  if (unlockedWeeklyTitle) unlockLimitedTitle(weeklyTitle, storage);
  return { signIn, claimed: true, unlockedWeeklyTitle };
}

export function getKnowledgeDuelRecords(storage: StorageLike | null = browserStorage()): KnowledgeDuelRecord[] {
  const value = readStoredJson<unknown>(KNOWLEDGE_DUEL_RECORDS_KEY, [], storage);
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is KnowledgeDuelRecord => Boolean(
    item && typeof item === "object" && typeof (item as KnowledgeDuelRecord).id === "string"
      && typeof (item as KnowledgeDuelRecord).timestamp === "number"
      && ["player", "ai", "draw"].includes((item as KnowledgeDuelRecord).winner)
      && typeof (item as KnowledgeDuelRecord).playerWins === "number"
      && typeof (item as KnowledgeDuelRecord).aiWins === "number"
      && Array.isArray((item as KnowledgeDuelRecord).weakSubjects)
      && Array.isArray((item as KnowledgeDuelRecord).usedCards),
  )).slice(-30);
}

export function saveKnowledgeDuelRecord(record: KnowledgeDuelRecord, storage: StorageLike | null = browserStorage()): KnowledgeDuelRecord[] {
  const next = [...getKnowledgeDuelRecords(storage).filter((item) => item.id !== record.id), record].slice(-30);
  writeStoredJson(KNOWLEDGE_DUEL_RECORDS_KEY, next, storage);
  return next;
}
