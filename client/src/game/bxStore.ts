/**
 * BX.Store — 寶島探險家 強化層統一資料層
 *
 * 由教學版 js/bx-store.js 忠實移植為 TypeScript ES 模組，保留：
 * - 獨立 localStorage 鍵 bx_state_v1（與既有 rpgStorage 的 xue-adventure-rpg-v1 互不影響）
 * - 防抖寫入（500ms）、關鍵操作 flush、卸載/背景時強制寫入
 * - 版本遷移（深合併補缺漏欄位，向前相容）
 * - 訂閱發布、自訂事件（bx:answer / bx:milestone / bx:storage-quota）
 * - logAnswer 答題記錄、derived 派生數據
 *
 * 此模組是隱私橫幅、新手導覽、空狀態、備份等強化模組的共同地基。
 */

export const BX_STORAGE_KEY = "bx_state_v1";
export const BX_SCHEMA_VERSION = 1;
/** 答題里程碑，觸發備份提醒 */
export const BX_ANSWER_MILESTONES = [50, 200, 500] as const;
/** 每日金幣防刷上限 */
export const BX_DAILY_COIN_CAP = 150;

export const BX_EVENTS = {
  answer: "bx:answer",
  milestone: "bx:milestone",
  storageQuota: "bx:storage-quota",
  checkin: "bx:checkin",
  tourIslandClick: "bx:tour:island-click",
} as const;

export type BxSubjectKey = "chinese" | "math" | "social" | "science";
export type BxRelicStatus = "sunken" | "repaired";
export type BxRelicTier = "gold" | "silver" | "bronze";

export interface BxRelic {
  id: string;
  subject: string;
  topic: string;
  wrongCount: number;
  firstWrongTs?: number;
  lastWrongTs?: number;
  hitStreak?: number;
  status: BxRelicStatus;
}

export interface BxSubjectStat {
  answers: number;
  correct: number;
  lastTs: number | null;
  bestTs: number | null;
}

export interface BxStats {
  total_answers: number;
  total_correct: number;
  streak_best: number;
  streak_current: number;
  best_day_count: number;
  first_light_done: boolean;
  first_light_ts: number | null;
  /** 單日答對計數，鍵為 day_YYYY-MM-DD */
  [dayKey: string]: number | boolean | null;
}

export interface BxPrivacy {
  accepted: boolean;
  dismissed_temp: boolean;
  ts: number | null;
}

export interface BxOnboardingState {
  step: number;
  completed: boolean;
  skipped: boolean;
}

export interface BxIslands {
  north: boolean;
  central: boolean;
  south: boolean;
  east: boolean;
}

export interface BxCheckin {
  dates: string[];
  streak: number;
  longest: number;
  repair_cards: number;
}

export interface BxPrefs {
  reduceMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
  sound: boolean;
  music: boolean;
  grade: number | null;
  difficulty: string;
}

export interface BxGuardian {
  pin: string | null;
  remember_until: number | null;
  wrong_count: number;
  lock_until: number | null;
}

export interface BxBackup {
  last_export_ts: number | null;
  weekly_reminder: boolean;
  notified_milestones: number[];
}

export interface BxState {
  schema_version: number;
  created_at: number;
  updated_at: number;
  privacy: BxPrivacy;
  onboarding: BxOnboardingState;
  stats: BxStats;
  subjects: Record<BxSubjectKey, BxSubjectStat>;
  islands: BxIslands;
  relics: BxRelic[];
  coins: number;
  daily_coin_log: Record<string, number>;
  shop_owned: string[];
  checkin: BxCheckin;
  badges: string[];
  prefs: BxPrefs;
  guardian: BxGuardian;
  backup: BxBackup;
}

export interface BxLogAnswerInput {
  subject?: string;
  topic?: string;
  correct?: boolean;
  coinReward?: number;
}

const SUBJECT_ISLAND_MAP: Record<string, keyof BxIslands> = {
  chinese: "north",
  math: "central",
  social: "south",
  science: "east",
};

function defaults(): BxState {
  const now = Date.now();
  return {
    schema_version: BX_SCHEMA_VERSION,
    created_at: now,
    updated_at: now,

    privacy: { accepted: false, dismissed_temp: false, ts: null },
    onboarding: { step: 0, completed: false, skipped: false },

    stats: {
      total_answers: 0,
      total_correct: 0,
      streak_best: 0,
      streak_current: 0,
      best_day_count: 0,
      first_light_done: false,
      first_light_ts: null,
    },

    subjects: {
      chinese: { answers: 0, correct: 0, lastTs: null, bestTs: null },
      math: { answers: 0, correct: 0, lastTs: null, bestTs: null },
      social: { answers: 0, correct: 0, lastTs: null, bestTs: null },
      science: { answers: 0, correct: 0, lastTs: null, bestTs: null },
    },

    islands: { north: false, central: false, south: false, east: false },

    relics: [],

    coins: 0,
    daily_coin_log: {},
    shop_owned: [],

    checkin: { dates: [], streak: 0, longest: 0, repair_cards: 2 },

    badges: [],

    prefs: {
      reduceMotion: false,
      largeText: false,
      highContrast: false,
      sound: true,
      music: false,
      grade: null,
      difficulty: "balanced",
    },

    guardian: { pin: null, remember_until: null, wrong_count: 0, lock_until: null },

    backup: { last_export_ts: null, weekly_reminder: true, notified_milestones: [] },
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 深合併：保留既有值、補上缺漏欄位（向前相容）。
 * 物件與物件遞迴合併；其餘型別（含陣列、原始值）一律以 src 為準。
 */
function deepMerge(target: unknown, src: unknown): unknown {
  if (isPlainObject(target) && isPlainObject(src)) {
    const out: Record<string, unknown> = { ...target };
    for (const key of Object.keys(src)) {
      const value = src[key];
      if (value === undefined) continue;
      out[key] =
        isPlainObject(value) && isPlainObject(target[key])
          ? deepMerge(target[key], value)
          : value;
    }
    return out;
  }
  return src === undefined ? target : src;
}

function migrate(data: unknown): BxState {
  const base = defaults();
  if (!isPlainObject(data)) return base;
  const merged = deepMerge(base, data) as BxState;
  merged.schema_version = BX_SCHEMA_VERSION;
  return merged;
}

function todayKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

function dispatchEvent(name: string, detail?: unknown) {
  if (!isBrowser) return;
  try {
    document.dispatchEvent(new CustomEvent(name, detail ? { detail } : undefined));
  } catch {
    // 事件派發失敗不應影響資料寫入。
  }
}

// ---------- 單例狀態 ----------
let cache: BxState | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;
let revision = 0;
const listeners = new Set<(state: BxState) => void>();

function all(): BxState {
  if (cache) return cache;
  const raw = isBrowser ? localStorage.getItem(BX_STORAGE_KEY) : null;
  cache = migrate(safeParse(raw));
  return cache;
}

function scheduleWrite() {
  if (!isBrowser) return;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => flush(), 500);
}

function notify() {
  revision += 1;
  const snapshot = all();
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (error) {
      console.error("[BX] store listener error", error);
    }
  });
}

function flush() {
  if (!isBrowser) return;
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  try {
    localStorage.setItem(BX_STORAGE_KEY, JSON.stringify(cache ?? all()));
  } catch (error) {
    console.warn("[BX] localStorage 寫入失敗（可能已達容量上限）", error);
    dispatchEvent(BX_EVENTS.storageQuota);
  }
}

function get<T = unknown>(path: string, fallback?: T): T | undefined {
  const value = path.split(".").reduce<unknown>((obj, key) => {
    if (obj == null || typeof obj !== "object") return undefined;
    return (obj as Record<string, unknown>)[key];
  }, all());
  return (value === undefined ? fallback : (value as T));
}

function update(fn: (draft: BxState) => void): BxState {
  const state = all();
  fn(state);
  state.updated_at = Date.now();
  scheduleWrite();
  notify();
  return state;
}

function subscribe(fn: (state: BxState) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function reset() {
  cache = defaults();
  revision += 1;
  flush();
  notify();
}

/**
 * 捨棄記憶體快取，從 localStorage 重新讀取並遷移。
 * 供「匯入備份」等直接改寫儲存內容後的刷新使用。
 */
function reload(): BxState {
  cache = null;
  revision += 1;
  return all();
}

/** React 整合用：每次 update/reset 後遞增，供 useSyncExternalStore 作為快照版本。 */
function getRevision(): number {
  return revision;
}

// ---------- 業務方法：答題 ----------
function logAnswer(opt: BxLogAnswerInput = {}): { coinEarned: number } {
  const { subject, topic, correct = false, coinReward = 0 } = opt;
  const state = all();
  const today = todayKey();
  const dailyCap = BX_DAILY_COIN_CAP;
  const earnedToday = state.daily_coin_log[today] ?? 0;
  const actualCoin = Math.max(0, Math.min(coinReward, dailyCap - earnedToday));
  const wasFirstLight = !state.stats.first_light_done;

  update((st) => {
    st.stats.total_answers += 1;
    if (correct) {
      st.stats.streak_current += 1;
      st.stats.total_correct += 1;
      st.stats.streak_best = Math.max(st.stats.streak_best, st.stats.streak_current);

      const dayKey = `day_${today}`;
      st.stats[dayKey] = Number(st.stats[dayKey] ?? 0) + 1;
      st.stats.best_day_count = Math.max(st.stats.best_day_count, Number(st.stats[dayKey] ?? 0));
    } else {
      st.stats.streak_current = 0;
    }

    if (subject && isBxSubjectKey(subject)) {
      const sub = st.subjects[subject];
      sub.answers += 1;
      if (correct) sub.correct += 1;
      sub.lastTs = Date.now();
    }

    if (actualCoin > 0) {
      st.coins += actualCoin;
      st.daily_coin_log[today] = earnedToday + actualCoin;
    }

    // 海難遺物：答錯沉入海底；答對則累計修復進度，連兩次命中修復。
    if (!correct && subject && topic) {
      const key = `${subject}::${topic}`;
      let relic = st.relics.find((x) => x.id === key);
      if (!relic) {
        relic = {
          id: key,
          subject,
          topic,
          wrongCount: 0,
          firstWrongTs: Date.now(),
          status: "sunken",
        };
        st.relics.push(relic);
      }
      relic.wrongCount += 1;
      relic.lastWrongTs = Date.now();
      relic.hitStreak = 0;
    } else if (correct && subject && topic) {
      const key = `${subject}::${topic}`;
      const relic = st.relics.find((x) => x.id === key);
      if (relic) {
        relic.hitStreak = (relic.hitStreak ?? 0) + 1;
        if ((relic.hitStreak ?? 0) >= 2) relic.status = "repaired";
      }
    }

    // 第一盞燈：首次答題即點亮、給幣、授徽章，並依科目點亮對應島嶼。
    if (!st.stats.first_light_done) {
      st.stats.first_light_done = true;
      st.stats.first_light_ts = Date.now();
      if (subject && SUBJECT_ISLAND_MAP[subject]) {
        st.islands[SUBJECT_ISLAND_MAP[subject]] = true;
      }
      st.coins += 20;
      if (!st.badges.includes("qihang")) st.badges.push("qihang");
    }
  });

  dispatchEvent(BX_EVENTS.answer, { correct, actualCoin, firstLight: wasFirstLight });

  const total = get<number>("stats.total_answers", 0) ?? 0;
  const notified = get<number[]>("backup.notified_milestones", []) ?? [];
  const hit = [...BX_ANSWER_MILESTONES].find((m) => total === m && !notified.includes(m));
  if (hit) {
    update((st) => {
      st.backup.notified_milestones.push(hit);
    });
    dispatchEvent(BX_EVENTS.milestone, { count: hit });
  }

  return { coinEarned: actualCoin };
}

function isBxSubjectKey(value: string): value is BxSubjectKey {
  return value === "chinese" || value === "math" || value === "social" || value === "science";
}

/**
 * 每日簽到：首日/連續給幣，連 3 天 +15、連 7 天再 +50 並授「七日航行」徽章。
 * 今天已簽到則回報 already，不再給獎勵。
 */
function checkIn(): { already: boolean; streak?: number; coins: number } {
  const today = todayKey();
  const dates = get<string[]>("checkin.dates", []) ?? [];
  if (dates.includes(today)) return { already: true, coins: 0 };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  let streak = 1;
  let bonus = 0;
  update((s) => {
    streak = s.checkin.dates.includes(yKey) ? s.checkin.streak + 1 : 1;
    s.checkin.dates.push(today);
    s.checkin.streak = streak;
    s.checkin.longest = Math.max(s.checkin.longest, streak);
    s.coins += 10;
    bonus = 10;
    if (streak === 3) {
      s.coins += 15;
      bonus += 15;
    }
    if (streak === 7) {
      s.coins += 50;
      bonus += 50;
      if (!s.badges.includes("7day")) s.badges.push("7day");
    }
  });

  dispatchEvent(BX_EVENTS.checkin, { streak, coins: bonus });
  return { already: false, streak, coins: bonus };
}

// ---------- 派生數據 ----------
const derived = {
  accuracy(subject?: string): number {
    if (subject && isBxSubjectKey(subject)) {
      const sub = get<BxSubjectStat>(`subjects.${subject}`);
      if (!sub || !sub.answers) return 0;
      return Math.round((sub.correct / sub.answers) * 100);
    }
    const answers = get<number>("stats.total_answers", 0) ?? 0;
    const correct = get<number>("stats.total_correct", 0) ?? 0;
    return answers ? Math.round((correct / answers) * 100) : 0;
  },
  activeDays(): number {
    return (get<string[]>("checkin.dates", []) ?? []).length;
  },
  sunkRelics(): BxRelic[] {
    return (get<BxRelic[]>("relics", []) ?? []).filter((r) => r.status === "sunken");
  },
  relicTier(relic: BxRelic): BxRelicTier {
    return relic.wrongCount >= 3 ? "gold" : relic.wrongCount === 2 ? "silver" : "bronze";
  },
  relicValue(relic: BxRelic): number {
    const tier = derived.relicTier(relic);
    return { gold: 25, silver: 12, bronze: 5 }[tier];
  },
  litIslands(): number {
    const islands = get<BxIslands>("islands");
    if (!islands) return 0;
    return Object.values(islands).filter(Boolean).length;
  },
  hasAnyData(): boolean {
    return (get<number>("stats.total_answers", 0) ?? 0) > 0;
  },
  todayCount(): number {
    return get<number>(`stats.day_${todayKey()}`, 0) ?? 0;
  },
};

// 頁面卸載 / 切到背景前強制寫入，避免防抖延遲漏存。
if (isBrowser) {
  window.addEventListener("beforeunload", () => flush());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

/**
 * BX 強化層資料層單例。React 元件請以 ES import 使用，勿掛 window。
 */
export const bxStore = {
  all,
  get,
  update,
  flush,
  subscribe,
  reset,
  reload,
  today: todayKey,
  logAnswer,
  checkIn,
  derived,
  getRevision,
};

export type BxStore = typeof bxStore;
