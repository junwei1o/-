/**
 * 針對性練習：錯題重練時的「頂替題」挑選策略。
 *
 * 孩子答錯一題後，若下次又出同一題，他會記答案而不是學概念。這裡依序嘗試
 * 用不同來源頂替原題，優先順序代表「越前面越貼近原題的考點、且越安全」：
 *
 *   1. 備用題庫中「明確標記為該題變體」的題目（同題型換變數，離線已驗算）
 *   2. 備用題庫中同知識點的替補題
 *   3. 執行期可安全變體的題目（僅放行純減法與整除除法，產出前自我驗算）
 *   4. 主庫同知識點的其他題（輪替）
 *   5. 回 null → 由呼叫端保留原題
 *
 * 例外：學生自評「記不起來（memory）」時**刻意出原題**——記憶類的錯需要的是
 * 喚回同一條線索，換題反而幫不上忙。
 *
 * 備用題庫從後端按需載入並在記憶體快取；離線或載入失敗時自動退回第 3、4 層，
 * 因此作答流程永遠不會被網路狀態卡住。
 */
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";
import { buildVariant } from "@/game/questionVariant";
import { familySiblingIds, type VariantLike } from "./variantFamily";
import type { PaperQuestion } from "./paperExam";

/** 錯題重練的替換函數簽名：給定 source 錯題 + 已用 ID 集合，返回頂替題目（無則 null） */
export type WrongReviewReplacement = (ctx: {
  source: PaperQuestion;
  usedIds: ReadonlySet<string>;
}) => PaperQuestion | null;

export type TargetedPracticeItem = {
  id: string;
  subject: string;
  grade: number;
  difficulty: string;
  curriculumDomain?: string;
  learningTopic: string;
  learningPerformance?: string;
  learningContent?: string;
  competency?: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  knowledge?: string[];
  variantOf?: string | null;
};

const SUBJECTS = new Set(["數學", "自然", "社會", "國語"]);
const VARIANT_SEQUENCE_KEY = "xue-variant-seq-v1";

let client: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;
function getClient() {
  if (!client) {
    client = createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
    });
  }
  return client;
}

/** 後端資料一律再驗一次：壞資料寧可不用，也不能進到孩子的練習裡。 */
export function isTargetedItem(value: unknown): value is TargetedPracticeItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.subject === "string" &&
    SUBJECTS.has(item.subject) &&
    typeof item.learningTopic === "string" &&
    item.learningTopic.length > 0 &&
    typeof item.prompt === "string" &&
    item.prompt.length > 0 &&
    typeof item.explanation === "string" &&
    Number.isInteger(item.answer) &&
    Array.isArray(item.options) &&
    item.options.length === 4 &&
    item.options.every((option) => typeof option === "string" && option.length > 0) &&
    new Set(item.options as string[]).size === 4 &&
    (item.answer as number) >= 0 &&
    (item.answer as number) < 4 &&
    (item.variantOf === undefined || item.variantOf === null || typeof item.variantOf === "string")
  );
}

/* ---------- 載入與快取 ---------- */

let cachedItems: TargetedPracticeItem[] | null = null;
let inflight: Promise<void> | null = null;

/** 目前快取到的備用題（尚未載入時為空陣列，呼叫端據此退回輪替）。 */
export function getTargetedPracticeItems(): readonly TargetedPracticeItem[] {
  return cachedItems ?? [];
}

export function hasLoadedTargetedPractice(): boolean {
  return cachedItems !== null;
}

/** 測試用：直接注入題目，或傳 null 清空快取。 */
export function __setTargetedPracticeItemsForTest(items: readonly TargetedPracticeItem[] | null): void {
  cachedItems = items === null ? null : items.map((item) => ({ ...item }));
  inflight = null;
}

/**
 * 載入備用題庫（整個 session 只抓一次）。
 * `timeoutMs` 是等待上限：網路慢時不該讓孩子卡在練習入口，
 * 逾時就先用輪替出題，抓完後續的場次自然會用到備用題。
 */
export async function ensureTargetedPracticeLoaded(timeoutMs = 1500): Promise<void> {
  if (cachedItems) return;
  if (!inflight) {
    inflight = (async () => {
      try {
        const result = await getClient().targetedPractice.list.query({});
        const items = Array.isArray(result?.items) ? result.items : [];
        cachedItems = items.filter(isTargetedItem);
      } catch {
        // 失敗時保留 null，下次進練習頁可以再試一次。
        inflight = null;
      }
    })();
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    inflight,
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, timeoutMs);
    }),
  ]);
  if (timer) clearTimeout(timer);
}

/* ---------- 轉成作答頁的題目格式 ---------- */

export function toPaperQuestion(item: TargetedPracticeItem): PaperQuestion {
  return {
    id: item.id,
    grade: item.grade,
    subject: item.subject as PaperQuestion["subject"],
    difficulty: item.difficulty,
    learningTopic: item.learningTopic,
    prompt: item.prompt,
    options: [...item.options],
    answer: item.answer,
    explanation: item.explanation,
  };
}

/* ---------- 執行期變體的序號 ---------- */

/**
 * 同一題每次重練都要換一組數字，所以記一個遞增序號。
 * 序號同時決定變體的內容（同序號必然同數字），因此出過的題可重現、可測試。
 */
export function nextVariantIndex(questionId: string): number {
  try {
    const raw = window.localStorage.getItem(VARIANT_SEQUENCE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const table = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    const current = Number(table[questionId]);
    const next = Number.isFinite(current) && current >= 0 ? Math.floor(current) + 1 : 0;
    table[questionId] = next;
    window.localStorage.setItem(VARIANT_SEQUENCE_KEY, JSON.stringify(table));
    return next;
  } catch {
    // localStorage 不可用時仍要能出題，用 0 當固定序號。
    return 0;
  }
}

/* ---------- 學生自評的錯誤原因（跨場次可用的可信來源） ---------- */

const SELF_REPORTED_REASON_KEY = "xue-error-reasons-v1";

/**
 * 記下學生**真的點過**的錯誤原因。
 *
 * 為什麼不能直接讀自適應存檔：引擎在答錯當下會先塞一個預設值 `memory`，
 * 照讀會把「沒自評」全算成「記不起來」，於是「該換題」的孩子永遠拿到原題。
 * 這裡另外存一份只有真實點擊才寫入的紀錄，供跨場次的錯題重練判斷。
 */
export function rememberSelfReportedReason(questionId: string, reason: string): void {
  try {
    const raw = window.localStorage.getItem(SELF_REPORTED_REASON_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const table = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    table[questionId] = reason;
    window.localStorage.setItem(SELF_REPORTED_REASON_KEY, JSON.stringify(table));
  } catch {
    // 無痕模式或容量不足時靜默略過；下次重練就退回「一律換題」。
  }
}

export function readSelfReportedReason(questionId: string): string | undefined {
  try {
    const raw = window.localStorage.getItem(SELF_REPORTED_REASON_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const value = parsed?.[questionId];
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

/* ---------- 挑題策略 ---------- */

function topicKeyOf(question: { subject: string; learningTopic?: string }): string {
  return `${question.subject}/${question.learningTopic ?? ""}`;
}

/**
 * 建立「錯題重練的頂替策略」。回傳的函式只依賴已載入的快取與本機紀錄，
 * 所以可以直接在測試裡餵題目驗證每個層級的優先順序。
 *
 * 層級（由優先到低）：
 *   層 0  主庫 variantOf 家族（2026-10-25 新增）——同概念換外皮的**正統變體題**
 *   層 1  後端備用庫明確標記為該題變體者（variantOf === source.id）
 *   層 2  後端備用庫同 learningTopic 替補
 *   層 3  執行期可安全變體（buildVariant，僅純減法／整除）
 *   層 4  主庫同學習主題輪替
 *   層 5  維持原題（回傳 null）
 *
 * 層 0 為甚麼要排最前面：`variantOf` 家族是 S5 用 qc:variant-regression
 * 鎖過的「同知識點、不同題幹」標記，題幹與解析都是人工級品質；
 * 層 1–3 是演算法生成／後端補庫的近似品。有正統變體可用時不該先吃替代品。
 * 主庫沒有 `variantOf` 的題（約 83%，含 server fallback 題庫全部）自動跳到
 * 層 1——優雅降級，路徑與改動前完全一致。
 */
export function createWrongReviewReplacement(
  questions: readonly PaperQuestion[],
): WrongReviewReplacement {
  const byTopic = new Map<string, PaperQuestion[]>();
  for (const question of questions) {
    const key = topicKeyOf(question);
    const list = byTopic.get(key);
    if (list) list.push(question);
    else byTopic.set(key, [question]);
  }

  /**
   * 層 0 的家族查詢＝**直接解析 ＋ 反向索引**聯集（惰性建一次；
   * 多數題庫沒有 variantOf 時完全不花錢）。
   *
   * 兩者缺一不可：
   * - 直接解析 `familySiblingIds(source)`：source 自己宣告的家族
   *   （anchor→members、variant→anchor+兄弟）。
   * - 反向索引：別的題把 source 當家族成員，但 source 自己沒標記
   *   （資料只寫了一半的情境）。
   * 只寫反向索引會漏掉「anchor 被 members 單方面指向、無人回指」的題——
   * 這是測試抓到的實作缺陷，不是測試寫錯。
   */
  const byIdMap = new Map<string, VariantLike>();
  const bankById = new Map<string, PaperQuestion>();
  for (const question of questions) {
    byIdMap.set(question.id, question as VariantLike);
    bankById.set(question.id, question);
  }
  let familyIndex: Map<string, string[]> | null = null;
  const familyOf = (source: PaperQuestion): PaperQuestion[] => {
    const directIds = familySiblingIds(source as VariantLike, byIdMap);
    if (!familyIndex) {
      familyIndex = new Map();
      for (const candidate of questions) {
        for (const siblingId of familySiblingIds(candidate as VariantLike, byIdMap)) {
          const list = familyIndex.get(siblingId);
          if (list) {
            if (!list.includes(candidate.id)) list.push(candidate.id);
          } else familyIndex.set(siblingId, [candidate.id]);
        }
      }
    }
    const merged = [...directIds];
    for (const id of familyIndex.get(source.id) ?? []) if (!merged.includes(id)) merged.push(id);
    return merged
      .filter((id) => id !== source.id)
      .map((id) => bankById.get(id))
      .filter((candidate): candidate is PaperQuestion => Boolean(candidate));
  };

  return ({ source, usedIds }) => {
    // 記憶類錯誤刻意出原題：需要的是同一條記憶線索，換題幫不上忙。
    if (readSelfReportedReason(source.id) === "memory") return null;

    // ── 層 0：主庫 variantOf 家族 ──
    // 科目相符是防呆：本頁的主庫混入填空／排序題，萬一源頭標記跨了科目，
    // 寧可降到層 1 也不要把「國語的變體」當成「數學錯題的解答」。
    // 同年級優先（與層 2 同理由）；跨年級變體仍優於無關的題，放最後。
    const family = familyOf(source);
    if (family.length > 0) {
      const available = family.filter(
        (candidate) =>
          candidate.id !== source.id &&
          candidate.subject === source.subject &&
          !usedIds.has(candidate.id),
      );
      const sameGrade = available.find((candidate) => candidate.grade === source.grade);
      if (sameGrade) return sameGrade;
      if (available.length > 0) return available[0];
    }

    const items = getTargetedPracticeItems();

    if (items.length > 0) {
      // 第 1 層：明確標記為這題變體的備用題。
      const exact = items.find(
        (item) =>
          item.variantOf === source.id &&
          item.subject === source.subject &&
          !usedIds.has(item.id),
      );
      if (exact) return toPaperQuestion(exact);

      // 第 2 層：同知識點的替補題（同年級優先，避免給到超出範圍的難度）。
      const sameTopic = items.filter(
        (item) =>
          item.subject === source.subject &&
          item.learningTopic === source.learningTopic &&
          !usedIds.has(item.id),
      );
      const sameGrade = sameTopic.find((item) => item.grade === source.grade);
      if (sameGrade) return toPaperQuestion(sameGrade);
      if (sameTopic.length > 0) return toPaperQuestion(sameTopic[0]);
    }

    // 第 3 層：執行期可安全變體（僅純減法與整除除法，產出前已自我驗算）。
    const variant = buildVariant(
      {
        id: source.id,
        subject: source.subject,
        grade: source.grade,
        learningTopic: source.learningTopic,
        prompt: source.prompt,
        options: source.options,
        answer: source.answer,
        explanation: source.explanation,
      },
      nextVariantIndex(source.id),
    );
    if (variant && !usedIds.has(variant.question.id)) {
      // 執行期變體沿用原題的難度（變體只換數字與情境，不該改變難度定位）。
      return {
        id: variant.question.id,
        grade: variant.question.grade,
        subject: variant.question.subject as PaperQuestion["subject"],
        difficulty: source.difficulty,
        learningTopic: variant.question.learningTopic,
        prompt: variant.question.prompt,
        options: [...variant.question.options],
        answer: variant.question.answer,
        explanation: variant.question.explanation,
      };
    }

    // 第 4 層：主庫同知識點的其他題輪替。
    const siblings = (byTopic.get(topicKeyOf(source)) ?? []).filter(
      (candidate) => candidate.id !== source.id && !usedIds.has(candidate.id),
    );
    const sameGradeSibling = siblings.find((candidate) => candidate.grade === source.grade);
    if (sameGradeSibling) return sameGradeSibling;
    if (siblings.length > 0) return siblings[0];

    // 第 5 層：沒有更好的選擇就維持原題。
    return null;
  };
}
