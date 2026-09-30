/**
 * 航線推薦邏輯（新首頁 B1/B2 的決策核心）
 *
 * 設計來源：homepage-redesign-proposal.md（2026-09-30 決議版）
 * - 首頁只回答一件事：「現在要出發去哪」
 * - 門檻為**硬切值、無緩衝帶**（決議 4）
 * - 未選年級時：閘門不可跳過；若狀態缺失，退回全站最高難度（決議 5）
 */
import { getDailySignIn, getLearningRecord, hasSignedInToday } from "@/utils/storage";
import {
  getMemoryAlarmCount,
  loadAdaptiveProfile,
  MAX_GRADE,
  type UserGradeLevel,
} from "@/game/adaptiveLearning";
import { loadTriAxisProgress } from "@/lib/triAxisProgress";
import {
  buildKnowledgeIslandSnapshots,
  type KnowledgeIslandSubject,
} from "@/lib/studentKnowledgeIslands";

/** 推薦門檻：錯題數 100、本週答題數 300。硬門檻，不做遲滯緩衝帶。 */
export const ROUTE_RULES = {
  WRONG_ANSWER_TRIGGER: 100,
  WEEKLY_ANSWER_TRIGGER: 300,
  /** 連續答錯幾題後，提示是否調降內容等級（決議 5 的安全閥） */
  LOWER_GRADE_HINT_STREAK: 3,
} as const;

export type RouteId = "wrong" | "timed" | "triAxis" | "practice" | "observatory" | "weekly";

export type RouteDef = {
  id: RouteId;
  name: string;
  purpose: string;
  path: string;
  estMinutes: number;
  tag: string;
  /** Render 免費層會休眠，標示哪些航線不依賴雲端也能走 */
  offlineOk: boolean;
};

/** 首頁航線清單：6 條（決議 2——簽到已下放 B7、今日遠征留在我的教室） */
export const ROUTES: RouteDef[] = [
  { id: "wrong", name: "錯題魔王", purpose: "從真實錯題整理弱點", path: "/wrong-answers", estMinutes: 10, tag: "清暗礁", offlineOk: true },
  { id: "timed", name: "限時挑戰", purpose: "十題自我挑戰 · 個人紀錄", path: "/community?mode=timed", estMinutes: 8, tag: "測航速", offlineOk: true },
  { id: "triAxis", name: "三軸混編試卷", purpose: "過去錯題 · 現在鞏固 · 未來挑戰", path: "/tri-axis-paper", estMinutes: 15, tag: "混合航段", offlineOk: true },
  { id: "practice", name: "自由練習", purpose: "依科目與進度開始答題", path: "/practice", estMinutes: 10, tag: "自由航行", offlineOk: true },
  { id: "observatory", name: "專題觀測", purpose: "天文／科學／生活安全，一次一主題", path: "/observatory", estMinutes: 12, tag: "靠岸觀察", offlineOk: true },
  { id: "weekly", name: "本週週測", purpose: "每週五自動出 10 題回顧本週", path: "/weekly-quiz", estMinutes: 10, tag: "週五例行", offlineOk: false },
];

export type RouteInput = {
  /** 待複習／錯題數（memory alarm） */
  wrongCount: number;
  /** 本週（近 7 天）已答題數 */
  weeklyCount: number;
  /** 累計答題數，用來判斷是否新用戶 */
  totalCount: number;
  signedInToday: boolean;
  /** 本週週測是否已完成（目前無可靠來源，先以「週五且本週有作答」保守推定未完成） */
  weeklyQuizDone: boolean;
  isFriday: boolean;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** 從既有本機資料蒐集推薦輸入——不新增任何儲存欄位，也不打 API。 */
export function collectRouteInput(now: number = Date.now()): RouteInput {
  const records = getLearningRecord();
  const weeklyCount = records.filter((r) => now - r.timestamp <= WEEK_MS).length;
  const wrongCount = getMemoryAlarmCount(loadAdaptiveProfile());
  return {
    wrongCount,
    weeklyCount,
    totalCount: records.length,
    signedInToday: hasSignedInToday(getDailySignIn(), now),
    weeklyQuizDone: false,
    isFriday: new Date(now).getDay() === 5,
  };
}

/** 連續答錯次數（取學習紀錄尾端），供「是否提示調降等級」判斷 */
export function consecutiveWrongStreak(limit = 12): number {
  const records = getLearningRecord();
  let streak = 0;
  for (let i = records.length - 1; i >= 0 && streak < limit; i -= 1) {
    if (records[i].isCorrect) break;
    streak += 1;
  }
  return streak;
}

export function shouldSuggestLowerGrade(streak: number): boolean {
  return streak >= ROUTE_RULES.LOWER_GRADE_HINT_STREAK;
}

/**
 * 建議航線（優先規則見提案第二節）。回傳 id 與「為什麼推薦」的根據文案。
 * 說明：推薦根據必須能被看見，否則用戶無法判斷要不要換。
 */
export function recommendRoute(input: RouteInput): { id: RouteId; reason: string } {
  if (input.totalCount === 0) {
    return { id: "practice", reason: "第一次出航，先熟悉海象——從自由練習開始。" };
  }
  if (input.wrongCount >= ROUTE_RULES.WRONG_ANSWER_TRIGGER) {
    return {
      id: "wrong",
      reason: `你有 ${input.wrongCount} 題待複習，先清掉暗礁再出發。`,
    };
  }
  if (input.isFriday && !input.weeklyQuizDone) {
    return { id: "weekly", reason: "今天是週五，本週週測已經備好 10 題。" };
  }
  if (input.weeklyCount < ROUTE_RULES.WEEKLY_ANSWER_TRIGGER) {
    return {
      id: "triAxis",
      reason: `本週已答 ${input.weeklyCount} 題，混編試卷把過去錯題與新題一起鞏固。`,
    };
  }
  return { id: "timed", reason: "本週航行量已足夠，來測一次航速留個紀錄。" };
}

export function routeById(id: RouteId): RouteDef {
  return ROUTES.find((r) => r.id === id) ?? ROUTES[3];
}

/** 年級閘門用：已選則回傳，未選則退回全站最高難度（決議 5） */
export function resolveGradeOrDefault(current: UserGradeLevel | null): UserGradeLevel {
  return current ?? MAX_GRADE;
}

/* ── A3：第二屏的條件區塊資料 ───────────────────────────────── */

/** 本週燈塔目標（點亮的題數）。調這個常數即可改目標。 */
export const WEEKLY_LIGHT_GOAL = 5;

export type ResumeInfo = {
  routeName: string;
  routePath: string;
  /** 1-based 目前題號 */
  current: number;
  total: number;
};

/**
 * 繼續上一趟（B3）：讀三軸混編試卷的既有草稿。
 * 沒有草稿、或已寫到最後一題（＝已完成）時回傳 null，區塊就不渲染。
 */
export function loadResume(): ResumeInfo | null {
  const progress = loadTriAxisProgress();
  if (!progress) return null;
  const total = progress.deckIds.length;
  if (total === 0) return null;
  const answered = Object.keys(progress.answers).length;
  if (answered === 0 || answered >= total) return null;
  return {
    routeName: "三軸混編試卷",
    routePath: "/tri-axis-paper",
    current: Math.min(progress.index + 1, total),
    total,
  };
}

/** 今日燈塔（B4）：本週已答對題數＝已點亮的燈。 */
export function weeklyLights(now: number = Date.now()): { lit: number; goal: number } {
  const lit = getLearningRecord().filter(
    (r) => r.isCorrect && now - r.timestamp <= WEEK_MS,
  ).length;
  return { lit, goal: WEEKLY_LIGHT_GOAL };
}

export type WeakSpot = {
  subject: KnowledgeIslandSubject;
  shortTitle: string;
  accuracy: number | null;
  attemptCount: number;
};

/** 弱點海圖（B5）：只顯示真的有作答紀錄的科目，accuracy 低者排前。 */
export function weakestIslands(limit = 3): WeakSpot[] {
  const snapshots = buildKnowledgeIslandSnapshots(loadAdaptiveProfile());
  return snapshots
    .filter((s) => s.attemptCount > 0)
    .sort((a, b) => (a.accuracy ?? 2) - (b.accuracy ?? 2))
    .slice(0, limit)
    .map((s) => ({
      subject: s.subject,
      shortTitle: s.shortTitle,
      accuracy: s.accuracy,
      attemptCount: s.attemptCount,
    }));
}

/* ── A4：第三屏 ─────────────────────────────────────────── */

export type VoyageDay = {
  /** 本地日鍵（YYYY-MM-DD） */
  day: string;
  answered: number;
  correct: number;
  /** 0–1；無作答時為 0 */
  accuracy: number;
};

/** 航海日誌（B6）：把既有學習紀錄按「本地日」聚合，取最近 limit 天。 */
export function recentVoyages(limit = 3, now: number = Date.now()): VoyageDay[] {
  const byDay = new Map<string, { answered: number; correct: number }>();
  for (const r of getLearningRecord()) {
    const d = new Date(r.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const cur = byDay.get(key) ?? { answered: 0, correct: 0 };
    cur.answered += 1;
    if (r.isCorrect) cur.correct += 1;
    byDay.set(key, cur);
  }
  return Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, limit)
    .map(([day, v]) => ({
      day,
      answered: v.answered,
      correct: v.correct,
      accuracy: v.answered > 0 ? v.correct / v.answered : 0,
    }));
}

/** 港口補給（B7）：沿用既有簽到資料，不新增儲存。 */
export function signInInfo(): { streak: number; signedInToday: boolean } {
  const signIn = getDailySignIn();
  return { streak: signIn.streak, signedInToday: hasSignedInToday(signIn) };
}

export type Weather = { icon: string; text: string };

/**
 * 今日天候（B8）：把既有資料轉成一句不施壓的引導。
 * 依序判斷——暗礁（錯題）優先於航行量。
 */
export function todayWeather(input: RouteInput): Weather {
  if (input.totalCount === 0) {
    return { icon: "🌊", text: "海面還很平靜——答對第一題，航海圖就會亮起第一盞燈。" };
  }
  if (input.wrongCount >= ROUTE_RULES.WRONG_ANSWER_TRIGGER) {
    return { icon: "🪨", text: `暗礁變多了（${input.wrongCount} 題待複習）——先清暗礁再長航。` };
  }
  if (input.weeklyCount === 0) {
    return { icon: "⛅", text: "本週還沒出航——今天風向不錯，適合短程。" };
  }
  if (input.weeklyCount < ROUTE_RULES.WEEKLY_ANSWER_TRIGGER) {
    return { icon: "🌤️", text: `本週已答 ${input.weeklyCount} 題——穩定航行中。` };
  }
  return { icon: "☀️", text: "航行量充足——來測一次航速，留個紀錄。" };
}
