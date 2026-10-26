import type { CurriculumQuestionRow } from "@/lib/questionBank";
import { familySiblingIds } from "@/lib/variantFamily";

/**
 * 自適應難度調度器（方案 ④，2026-10-25 實作）。
 *
 * ⚠️ 狀態：**已實作、30 例測試全綠，但尚未接上任何生產出題流程**。
 * 實地查證（2026-10-25）：本站所有出題入口都是「進頁時一次排好固定卷、
 * 依 index 往後翻」——`buildPaperDeck`（/practice）、`buildReviewDeck`
 * （/review-hub）、`OnionBankTheater`（Onion 學院）。本模組是**逐題串接**
 * 語意（答完一題才決定下一題），要生效必須改動上述任一流程的 deck
 * 生命週期，風險與範圍都更大，屬另一件事——刻意留在「未被呼叫」狀態，
 * 並在下方「若要啟用」列明候選接入點，避免被當成沉默失效的半成品。
 *
 * 真正已接入生產的是 `targetedPractice.createWrongReviewReplacement`
 * 的層 0（錯題備用題優先同家族變體），它用的是本模組委託的
 * `lib/variantFamily` 同一份解析（單一真相）。
 *
 * 若要啟用，最小侵入的候選接入點（尚未實作）：
 *   A. PaperExam 總結後的「再來一輪」——新流程，不動既有 12 題卷
 *   B. 隨機冒險（Home → /practice）改成串接出題
 *
 * 設計前提（全部經實測驗證，不是假設）：
 * - 前端題庫 `runtime_bank_elementary.json` 現已帶 `variantOf`
 *   （由 `scripts/build-runtime-bank.mjs` 白名單放行＋引用清洗）：
 *   526 題帶家族標記（65 anchor / 461 variant），3175 題 100% 帶 `knowledge`。
 * - 作答履歷沿用既有 `adaptiveLearning.ts`（attempts 含 questionId／
 *   difficulty／correct／knowledge；MAX_ATTEMPTS=1000 已上限量測過的容量）。
 *   本模組是**純函式調度器**：不寫入、不落盤、不打後端——
 *   呼叫端餵入「剛答完的題＋訊號＋題庫＋已出清單」，拿到「下一題＋決策理由」。
 * - 後端 API 零改動：推薦全在前端算（題目資料已在本地 chunk，無需查庫）。
 *   server fallback 題庫沒有 variantOf 欄位 → 自動降級走 knowledge 路徑，
 *   該降級路徑由 `adaptiveScheduler.test.ts`「無 variantOf 的降級路徑」鎖住。
 *
 * 與既有機制的接線（啟用時）：
 * - 錯題本（`getActiveWrongQuestionIds`）優先級最高——到期錯題**先於**任何推薦；
 *   調度器把 `wrongBookIds` 放進候選過濾的最前面，其餘規則才輪流。
 * - `updateLatestAdaptiveAttempt`（flagged 標記）保留：答錯同一家族 ≥2 變體
 *   仍標記為「不會」，作為錯題本來源。
 */

export const DIFFICULTY_ORDER = ["基礎", "標準", "挑戰"] as const;
export type Difficulty = (typeof DIFFICULTY_ORDER)[number];

/** 難度 → 序數（未知難度回退中間值，不拋錯——調度永不阻斷學習流程）。 */
export function difficultyRank(difficulty: string): number {
  const index = DIFFICULTY_ORDER.indexOf(difficulty as Difficulty);
  return index < 0 ? 1 : index;
}

export type AdaptiveSignal = {
  /** 剛答完這題的結果；呼叫前已 record 進 attempts 也無妨（函式不讀 attempts） */
  correct: boolean;
  /**
   * 同一知識點**連續答對**次數（不含本題）。呼叫端由 attempts 尾部數出。
   * 實測單次答對不升級——必須 streak >= STREAK_TO_LEVEL_UP。
   */
  knowledgeStreak?: number;
  /**
   * 同一知識點**連續答錯**次數（不含本題）。>= STREAK_TO_LEVEL_DOWN 時降級，
   * 避免學生在同一處反覆挫敗（教育研究上「可糾錯的難」比「猜不透的難」留存率高）。
   */
  knowledgeWrongStreak?: number;
};

export type SchedulePolicy =
  /** 錯題本到期優先 */
  | "wrong-book"
  /** 答錯且家族還有沒出過的變體 → 同概念換外皮重練 */
  | "variant-retry"
  /** 答錯、無家族可用 → 同知識點、同難度的新題 */
  | "same-knowledge-new"
  /** 答錯且同知識點同難度出盡 → 同知識點降一級（先保住成就感） */
  | "same-knowledge-down"
  /** 答錯且該知識點全出盡 → 同科目同難度換知識點 */
  | "cross-topic-same-difficulty"
  /** 連對達標 → 同知識點升一級 */
  | "level-up"
  /** 連對達標且該知識點已最高難度 → 換同級新知識點 */
  | "explore-new-topic"
  /** 兜底：全年級同科目隨機（保證永不卡死） */
  | "random-fallback";

export type ScheduleResult = {
  question: CurriculumQuestionRow | null;
  policy: SchedulePolicy | "no-bank";
  /** 除錯用：該規則實際命中幾題可選（0 = 退到下一條規則） */
  candidates: number;
};

export type ScheduleInput = {
  justAnswered: CurriculumQuestionRow;
  signal: AdaptiveSignal;
  /** 本局已出過的 id（含 justAnswered 本身——呼叫端負責放進去） */
  servedIds: ReadonlySet<string>;
  /**
   * 錯題本到期 id 集合（`getActiveWrongQuestionIds` 的結果）。
   * 非空時優先從中挑**本局未出過**的題；挑不到才繼續走推薦規則。
   */
  wrongBookIds?: ReadonlySet<string>;
  /** 注入式亂數（測試用固定種子；預設 Math.random） */
  rng?: () => number;
};

/** 升級門檻：同知識點連對 3 題。3 是「穩定而非僥倖」的最小樣本（ guess 率 25% 時連中 3 次機率 <2%）。*/
export const STREAK_TO_LEVEL_UP = 3;
/** 降級門檻：同知識點連錯 2 題。1 次可能失手，2 次才像真的卡住。 */
export const STREAK_TO_LEVEL_DOWN = 2;

/**
 * 家族 id 解析委託給 `lib/variantFamily`（單一真相）。
 * 調度器與錯題備用題層 0 共用同一份解析，避免改一處漏一處（型 4 教訓）。
 */

function shufflePick<T>(pool: readonly T[], rng: () => number): T | null {
  if (pool.length === 0) return null;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

/**
 * 一次調度：依優先序嘗試各規則，第一條有可用候選就出題。
 *
 * 優先序（錯題本 > 錯題變體 > 錯題降級 > 連對升級 > 平級新題 > 兜底）背後的
 * 教育邏輯：先止血（重練剛錯的概念），再保成就感（卡住就降），最後才加壓。
 */
export function pickNextQuestion(
  bank: readonly CurriculumQuestionRow[],
  input: ScheduleInput,
): ScheduleResult {
  if (bank.length === 0) return { question: null, policy: "no-bank", candidates: 0 };

  const rng = input.rng ?? Math.random;
  const { justAnswered, signal, servedIds } = input;
  const byId = new Map(bank.map((q) => [q.id, q]));
  const unseen = (q: CurriculumQuestionRow) => !servedIds.has(q.id);
  const sameGrade = (q: CurriculumQuestionRow) => q.grade === justAnswered.grade;
  const rank = difficultyRank(justAnswered.difficulty);
  const topics = justAnswered.knowledge ?? [];

  // ── 規則 0：錯題本到期（最高優先）──
  if (input.wrongBookIds && input.wrongBookIds.size > 0) {
    const due = bank.filter((q) => input.wrongBookIds!.has(q.id) && unseen(q));
    const picked = shufflePick(due, rng);
    if (picked) return { question: picked, policy: "wrong-book", candidates: due.length };
  }

  // ── 答錯分支（含連錯降級）──
  if (!signal.correct) {
    // 1a. 同家族換外皮：概念不變、題幹不同，防止「背答案式重練」
    const members = familySiblingIds(justAnswered, byId);
    if (members.length > 0) {
      const retryPool = bank.filter((q) => members.includes(q.id) && unseen(q));
      const picked = shufflePick(retryPool, rng);
      if (picked) return { question: picked, policy: "variant-retry", candidates: retryPool.length };
    }
    // 1b. 同知識點、同難度的新題（錯題本之外的即時補練）
    const samePool = bank.filter(
      (q) => unseen(q) && sameGrade(q) && difficultyRank(q.difficulty) === rank &&
        (q.knowledge ?? []).some((k) => topics.includes(k)),
    );
    const samePick = shufflePick(samePool, rng);
    if (samePick) return { question: samePick, policy: "same-knowledge-new", candidates: samePool.length };
    // 1c. 連錯達標 或 同知識點出盡 → 降一級（仍同知識點優先，沒有再跨點）
    if (signal.knowledgeWrongStreak && signal.knowledgeWrongStreak + 1 >= STREAK_TO_LEVEL_DOWN) {
      const lower = bank.filter(
        (q) => unseen(q) && sameGrade(q) && difficultyRank(q.difficulty) < rank &&
          (q.knowledge ?? []).some((k) => topics.includes(k)),
      );
      const lowerPick = shufflePick(lower, rng);
      if (lowerPick) return { question: lowerPick, policy: "same-knowledge-down", candidates: lower.length };
      // 該知識點已無更低難度：跨知識點、同科目同級降一檔，避免原地打轉
      const crossLower = bank.filter(
        (q) => unseen(q) && sameGrade(q) && q.subject === justAnswered.subject &&
          difficultyRank(q.difficulty) < rank,
      );
      const crossPick = shufflePick(crossLower, rng);
      if (crossPick) return { question: crossPick, policy: "cross-topic-same-difficulty", candidates: crossLower.length };
    }
    // 1d. 未達降級門檻但同點出盡 → 同難度跨知識點
    const cross = bank.filter(
      (q) => unseen(q) && sameGrade(q) && q.subject === justAnswered.subject &&
        difficultyRank(q.difficulty) === rank &&
        !(q.knowledge ?? []).some((k) => topics.includes(k)),
    );
    const crossPick = shufflePick(cross, rng);
    if (crossPick) return { question: crossPick, policy: "cross-topic-same-difficulty", candidates: cross.length };
  }

  // ── 答對分支 ──
  if (signal.correct) {
    const streak = (signal.knowledgeStreak ?? 0) + 1; // 加上本題
    if (streak >= STREAK_TO_LEVEL_UP && rank < DIFFICULTY_ORDER.length - 1) {
      // 2a. 同知識點升一級
      const up = bank.filter(
        (q) => unseen(q) && sameGrade(q) && difficultyRank(q.difficulty) === rank + 1 &&
          (q.knowledge ?? []).some((k) => topics.includes(k)),
      );
      const upPick = shufflePick(up, rng);
      if (upPick) return { question: upPick, policy: "level-up", candidates: up.length };
    }
    if (streak >= STREAK_TO_LEVEL_UP) {
      // 2b. 已達最高難度（或升無可升）→ 換新知識點，維持挑戰性但不原地刷滿
      const explore = bank.filter(
        (q) => unseen(q) && sameGrade(q) && q.subject === justAnswered.subject &&
          !(q.knowledge ?? []).some((k) => topics.includes(k)),
      );
      const explorePick = shufflePick(explore, rng);
      if (explorePick) return { question: explorePick, policy: "explore-new-topic", candidates: explore.length };
    }
    // 2c. 平級推進：同知識點優先（概念連續性），再同點同難度
    const keep = bank.filter(
      (q) => unseen(q) && sameGrade(q) &&
        (q.knowledge ?? []).some((k) => topics.includes(k)),
    );
    const keepPick = shufflePick(keep, rng);
    if (keepPick) return { question: keepPick, policy: "same-knowledge-new", candidates: keep.length };
  }

  // ── 規則 9：兜底——同級同科目任何未出過的題；再不行全年級；永不出 null 前窮盡 ──
  const anySubject = bank.filter((q) => unseen(q) && sameGrade(q) && q.subject === justAnswered.subject);
  const anyGrade = bank.filter((q) => unseen(q) && sameGrade(q));
  const anyAtAll = bank.filter(unseen);
  const picked = shufflePick(anySubject.length ? anySubject : anyGrade.length ? anyGrade : anyAtAll, rng);
  return { question: picked, policy: "random-fallback", candidates: picked ? 1 : 0 };
}

/**
 * 呼叫端輔助：從既有 attempts 數出本模組要的兩個 streak。
 *
 * ⚠️ 只跳過**最後一筆**（若它是本題），不能用 filter 全刪同 id：
 * 錯題重練場景下同一題可能出現在多個時間點，全刪會讓回溯跨越「本題上一輪
 * 嘗試」的邊界，把更舊的紀錄誤併進本輪連擊（實測：[b✓, a✓, a✗] 對 current=a，
 * filter 版誤得 1、pop 版正確 0）。語意是「連擊不得跨越本題的歷史」。
 * 反向掃描遇到同題的**更早**紀錄即停止。
 */
export function deriveStreaks(
  attempts: readonly { questionId: string; correct: boolean; knowledge?: readonly string[] }[],
  currentQuestionId: string,
  currentKnowledge: readonly string[],
): Pick<AdaptiveSignal, "knowledgeStreak" | "knowledgeWrongStreak"> {
  const tail = [...attempts];
  if (tail.length > 0 && tail[tail.length - 1]!.questionId === currentQuestionId) tail.pop();

  let right = 0;
  let wrong = 0;
  for (let index = tail.length - 1; index >= 0; index -= 1) {
    const attempt = tail[index]!;
    if (attempt.questionId === currentQuestionId) break;
    if (!(attempt.knowledge ?? []).some((k) => currentKnowledge.includes(k))) break;
    if (attempt.correct) {
      if (wrong > 0) break;
      right += 1;
    } else {
      if (right > 0) break;
      wrong += 1;
    }
  }
  return { knowledgeStreak: right, knowledgeWrongStreak: wrong };
}
