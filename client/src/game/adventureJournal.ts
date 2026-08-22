export const ADVENTURE_JOURNAL_STORAGE_KEY = "xue-adventure-adventure-journal-v1";
export const ADVENTURE_JOURNAL_CAPACITY = 30;

export type JournalSessionType = "battle" | "exam";

export type RandomAdventureJournalData = {
  questionId: string;
  knowledgePoint: string | null;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
};

export type JournalEntry = {
  id: string;
  date: number;
  subject: string;
  topicCount: number;
  correctCount: number;
  sessionType: JournalSessionType;
  islandId: string | null;
  summary: string;
  randomAdventure?: RandomAdventureJournalData;
};

type JournalState = { version: 1; entries: JournalEntry[] };
type JournalStorage = Pick<Storage, "getItem" | "setItem">;

function journalStorage(storage?: JournalStorage): JournalStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isJournalEntry(value: unknown): value is JournalEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<JournalEntry>;
  return typeof entry.id === "string"
    && typeof entry.date === "number"
    && typeof entry.subject === "string"
    && typeof entry.topicCount === "number"
    && typeof entry.correctCount === "number"
    && (entry.sessionType === "battle" || entry.sessionType === "exam")
    && (typeof entry.islandId === "string" || entry.islandId === null)
    && typeof entry.summary === "string"
    && (!entry.randomAdventure || (
      typeof entry.randomAdventure === "object"
      && typeof entry.randomAdventure.questionId === "string"
      && (typeof entry.randomAdventure.knowledgePoint === "string" || entry.randomAdventure.knowledgePoint === null)
      && Number.isFinite(entry.randomAdventure.baseCoins)
      && Number.isFinite(entry.randomAdventure.bonusCoins)
      && Number.isFinite(entry.randomAdventure.totalCoins)
      && entry.randomAdventure.baseCoins >= 0
      && entry.randomAdventure.bonusCoins >= 0
      && entry.randomAdventure.totalCoins >= 0
    ));
}

function normalizeJournalState(value: unknown): JournalState {
  if (!value || typeof value !== "object") return { version: 1, entries: [] };
  const state = value as Partial<JournalState>;
  if (state.version !== 1 || !Array.isArray(state.entries)) return { version: 1, entries: [] };
  return {
    version: 1,
    entries: state.entries
      .filter(isJournalEntry)
      .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.id === entry.id) === index)
      .sort((left, right) => right.date - left.date)
      .slice(0, ADVENTURE_JOURNAL_CAPACITY),
  };
}

export function formatJournalSummary(entry: Pick<JournalEntry, "subject" | "topicCount" | "correctCount" | "sessionType"> & Pick<JournalEntry, "randomAdventure">): string {
  const solvedCount = Math.max(0, Math.floor(entry.correctCount));
  const topicCount = Math.max(0, Math.floor(entry.topicCount));
  const topicPhrase = topicCount > 0 ? `${topicCount} 個知識主題` : "這段學習航線";
  const resultPhrase = solvedCount > 0 ? `完成了 ${solvedCount} 道${entry.subject}題` : `完成了${entry.subject}練習`;
  const baseSummary = entry.sessionType === "battle"
    ? `在${topicPhrase}的對戰中${resultPhrase}，守住了一段學習航線。`
    : `整理了${topicPhrase}，${resultPhrase}。`;
  if (!entry.randomAdventure) return baseSummary;
  const knowledgePoint = entry.randomAdventure.knowledgePoint?.trim() || "知識點資料待確認";
  const totalCoins = Math.max(0, Math.floor(entry.randomAdventure.totalCoins));
  const bonusCoins = Math.max(0, Math.floor(entry.randomAdventure.bonusCoins));
  const bonusPhrase = bonusCoins > 0 ? `，其中包含隨機冒險加碼 ${bonusCoins} 枚` : "";
  return `${baseSummary} 學到了「${knowledgePoint}」，獲得 ${totalCoins} 枚航海金幣${bonusPhrase}。`;
}

export function getJournalEntries(storage?: JournalStorage): JournalEntry[] {
  const target = journalStorage(storage);
  if (!target) return [];
  try {
    const raw = target.getItem(ADVENTURE_JOURNAL_STORAGE_KEY);
    return raw ? normalizeJournalState(JSON.parse(raw)).entries : [];
  } catch {
    return [];
  }
}

export function saveJournalEntry(entry: JournalEntry, storage?: JournalStorage): JournalEntry[] {
  const target = journalStorage(storage);
  if (!target || !isJournalEntry(entry)) return getJournalEntries(storage);
  try {
    const raw = target.getItem(ADVENTURE_JOURNAL_STORAGE_KEY);
    const current = raw ? normalizeJournalState(JSON.parse(raw)) : { version: 1, entries: [] };
    const next: JournalState = {
      version: 1,
      entries: [entry, ...current.entries.filter((candidate) => candidate.id !== entry.id)]
        .sort((left, right) => right.date - left.date)
        .slice(0, ADVENTURE_JOURNAL_CAPACITY),
    };
    target.setItem(ADVENTURE_JOURNAL_STORAGE_KEY, JSON.stringify(next));
    return next.entries;
  } catch {
    return getJournalEntries(storage);
  }
}
