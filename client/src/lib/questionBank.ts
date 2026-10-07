import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
/**
 * 題庫為國小題庫（數學／自然／社會／國語 ＋ 英語 seed），國中／高中已於 2026-09-28 移除。
 *
 * ⚠️ 精確題數**以 `data/runtime_bank_elementary.json` 為準**（2026-10-07 實測 3175 題，
 *    加 `data/taiwan_english_seed.json` 24 題、兩者零重疊，合計 3199 題）。
 *    本註解不複寫精確數字——題庫會成長（948→1090→2895→3175），寫死只會再漂移一次。
 *    同一原則適用於 UI 文案：學生端一律用保守下界「3100+」，**與此處規模描述不矛盾**
 *    （註解面向開發者、要接近真實；UI 面向學生、要抗漂移），看到兩者不一致時請勿互改。
 *
 * 若繼續用靜態 import，會整包塞進 index 主包（從 1.6MB 爆到近 4MB），
 * 首屏在手機上會明顯變慢。改成動態 import：主包只留英語 seed（很小），
 * 國小題庫在掛載後背景載入，載入前照常使用後端題庫，不會卡住任何操作。
 *
 * 資料由 scripts/build-runtime-bank.mjs 從 data/taiwan_curriculum_500.json
 * 與 data/generated_bank.json 合併去重產生，勿手動編輯。
 */
// 英語文題目由前端本地題庫提供（後端 question_bank subject enum 尚未收錄英語，避免改動資料庫 schema）。
import englishSeed from "../../../data/taiwan_english_seed.json";
import { expandQuestions } from "./optionExpandScheduler";
import { shuffleQuestionOptions } from "./optionRandomizer";

/** shuffleQuestionOptions 快取（同一題只洗一次，展開完成後不再重洗）。 */
const shuffleCache = new WeakMap<object, typeof NO_SERVER_QUESTIONS[0]>();

/** 與後端 question_bank 資料列一致的題目欄位（去掉僅後端使用的時間戳）。 */
export type CurriculumQuestionRow = {
  id: string;
  grade: number;
  subject: "數學" | "自然" | "社會" | "國語" | "英語";
  questionType: "選擇題" | "是非題";
  difficulty: "基礎" | "標準" | "挑戰";
  curriculumDomain: "語文領域" | "數學領域" | "自然科學領域" | "社會領域";
  learningTopic: string;
  /** 課綱欄位只存在於完整題庫（後端／工具使用），前端精簡檔沒有，故為可選。 */
  learningPerformance?: string;
  learningContent?: string;
  competency?: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  knowledge: string[];
  area?: string | null;
  /**
   * 跨學科結合題的科目組合（三科或五科）；一般單科題沒有這一欄。
   * 前端用它顯示「數學．自然．社會」的提示晶片，讓學生知道這題要跨科思考。
   */
  subjectCombination?: string[];
};

function isValidQuestion(value: unknown): value is CurriculumQuestionRow {
  if (!value || typeof value !== "object") return false;
  const question = value as Record<string, unknown>;
  const questionType = question.questionType;
  const isTrueFalse = questionType === "是非題";
  const expectedOptionCount = isTrueFalse ? 2 : 4;
  return (
    typeof question.id === "string" &&
    Number.isInteger(question.grade) &&
    typeof question.subject === "string" &&
    (questionType === undefined || typeof questionType === "string") &&
    typeof question.difficulty === "string" &&
    typeof question.curriculumDomain === "string" &&
    typeof question.learningTopic === "string" &&
    typeof question.prompt === "string" &&
    typeof question.explanation === "string" &&
    Number.isInteger(question.answer) &&
    Array.isArray(question.options) &&
    question.options.length === expectedOptionCount &&
    question.options.every((option) => typeof option === "string") &&
    Array.isArray(question.knowledge) &&
    question.knowledge.length > 0
  );
}

function rowsFrom(seed: unknown): CurriculumQuestionRow[] {
  const source = seed as { questions?: unknown };
  const questions = Array.isArray(source?.questions) ? source.questions.filter(isValidQuestion) : [];
  return questions.map((q) => ({ ...q, questionType: q.questionType ?? "選擇題" as const }));
}

/** 動態載入國小＋國中精簡題庫；同一份結果全程共用，只載一次。 */
let localCache: CurriculumQuestionRow[] | null = null;
let localPending: Promise<CurriculumQuestionRow[]> | null = null;

/**
 * 內建題庫的「活陣列」。
 * 題庫精簡檔約 1.9MB（2026-10-07 實測 1,940,661 bytes），靜態 import 會整包塞進主 bundle，首屏在手機上會卡。
 * 改成動態 import 之後，這裡先用空陣列占位，載入完成後「就地填入同一個陣列」：
 * 所有拿到這個參考的人都看得到題目（classroomBank 等同步消費端才不會開天窗）。
 */
export const LOCAL_QUESTION_BANK: CurriculumQuestionRow[] = [];

/**
 * 題庫延遲載入的排程。
 *
 * 為什麼要延遲：兩份精簡檔解壓後共 3.0MB（國小 1.66MB ＋ 國中 1.28MB），
 * Brotli 壓縮後 486KB，4G 實測仍要佔 1.3～1.7 秒，而且會佔用行動網路有限頻寬，
 * 拖慢首屏的 JS／CSS。
 *
 * 誰真的需要它：答題頁（/practice）、錯題本、學習歷程等要拿題目出題的畫面，
 * 以及首頁的「隨機冒險」與小測試（點下去才需要）。純看首屏的學生不需要。
 *
 * 為什麼不能只用 requestIdleCallback：實測它在首屏繪製完、主執行緒一空閒
 * 就立刻觸發（headless 實測請求時間 7848ms，與首屏同時），等於沒有延後。
 * 因此這裡在 requestIdleCallback 之外再加一道「載入事件」閘門：
 * 學生碰到任何會出題的入口時，才真的開始下載。
 */
let idleScheduled = false;

/** 已確認要下載題庫（首屏的主要 JS／CSS 都回應完之後才放行）。 */
function whenFirstPaintSettled(): Promise<void> {
  // 沒有 window（SSR／測試）→ 直接視為可以載入。
  if (typeof window === "undefined") return Promise.resolve();
  if (typeof requestIdleCallback !== "function") {
    return new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  return new Promise<void>((resolve) => {
    // 雙重保險：主執行緒空閒（首屏畫面已畫出）且 load 事件已觸發（關鍵資源到位）。
    const maybeStart = () => {
      if (idleScheduled) return;
      if (document.readyState === "complete") {
        idleScheduled = true;
        resolve();
      }
    };
    window.addEventListener("load", maybeStart, { once: true });
    // load 若因故沒來（例如慢速資源），逾時後仍放行，別讓學生永遠等不到題目。
    requestIdleCallback(maybeStart, { timeout: 4000 });
  });
}

/**
 * eager=false 的頁面用：等首屏完全結束後才下載題庫。
 * 學生一進站不會立刻搶頻寬；一旦真的要答題，loadLocalBank() 會立即同步啟動。
 */
function waitForIdleThenLoad(): Promise<CurriculumQuestionRow[]> {
  if (localCache) return Promise.resolve(localCache);
  return whenFirstPaintSettled().then(() => loadLocalBank());
}

/** 請瀏覽器在首屏結束後預先載入題庫（供 App 主動呼叫的預熱入口）。 */
export function preloadLocalBankWhenIdle(): void {
  if (localCache || idleScheduled) return;
  void waitForIdleThenLoad();
}

/**
 * 學生正要答題時呼叫：立刻開始下載題庫，不等延遲排程。
 * 回傳同一個 Promise，因此重複呼叫（例如連點兩次）只會下載一次。
 */
export function ensureLocalBank(): Promise<CurriculumQuestionRow[]> {
  return loadLocalBank();
}

export function loadLocalBank(): Promise<CurriculumQuestionRow[]> {
  if (localCache) return Promise.resolve(localCache);
  if (!localPending) {
    localPending = (async () => {
      const elementary = await import("../../../data/runtime_bank_elementary.json");
      const rows = [
        ...rowsFrom((elementary as { default?: unknown }).default ?? elementary),
      ];
      localCache = rows;
      LOCAL_QUESTION_BANK.length = 0;
      LOCAL_QUESTION_BANK.push(...rows);
      return rows;
    })();
  }
  return localPending;
}

/** 英語文題庫（本地 seed，與 data/taiwan_english_seed.json 同步）。 */
export const LOCAL_ENGLISH_BANK: CurriculumQuestionRow[] = (() => {
  const seed = englishSeed as { questions?: unknown };
  const questions = Array.isArray(seed.questions) ? seed.questions.filter(isValidQuestion) : [];
  return questions.map((q) => ({ ...q, questionType: q.questionType ?? "選擇題" as const }));
})();

/**
 * 合併結果也要共用：useQuestionBank 每個元件各叫一次，若各自合併就會各自拿到
 * 不同的陣列，進而各自重跑一次 5000 題的展開。
 * 這裡用「後端陣列 → 本地陣列 → 合併結果」兩層快取，全站只合併一次。
 */
const mergedCache = new WeakMap<
  readonly CurriculumQuestionRow[],
  WeakMap<readonly CurriculumQuestionRow[], CurriculumQuestionRow[]>
>();

/**
 * 題幹正規化：用來把「同一題同時存在於後端與本地」的重疊去掉。
 * 沒有題幹的資料列（例如只帶 id 的測試假資料）改用 id 判斷，
 * 否則會被當成同一題刪到只剩一題。
 *
 * ⚠ 這個鍵只能比對「不同來源」，不能在同一來源內使用：
 * 本地題庫有大量共用模板題幹的題目（「下列四句英語的敘述中，有一句觀念錯誤」
 * 就有 44 題，選項與答案各不相同），同源內去重會把它們一次刪光。
 */
function dedupeKey(question: CurriculumQuestionRow): string {
  const prompt = String(question.prompt ?? "").replace(/\s+/g, "");
  return prompt ? `${question.subject}|${prompt}` : `id:${question.id}`;
}

function mergedBank(
  serverQuestions: readonly CurriculumQuestionRow[],
  localRows: readonly CurriculumQuestionRow[],
): CurriculumQuestionRow[] {
  let inner = mergedCache.get(serverQuestions);
  if (!inner) {
    inner = new WeakMap();
    mergedCache.set(serverQuestions, inner);
  }
  const hit = inner.get(localRows);
  if (hit) return hit;
  const merged = mergeAcrossSources([serverQuestions, localRows, LOCAL_ENGLISH_BANK]);
  inner.set(localRows, merged);
  return merged;
}

/**
 * 依序合併多個題庫來源，只在「跨來源」去重。
 *
 * 比對的是「前面所有來源」的題幹，同一個來源內部不互相比對 ——
 * 因此同一份檔案裡共用模板題幹、但選項與答案不同的題目會全部保留。
 * 實測：改用這個邏輯後，可用題庫從 3906 題恢復到 4991 題（+1085），
 * 其中英語模板題（「下列四句英語的敘述中，有一句觀念錯誤」共 44 題）從 1 題回到 44 題。
 *
 * 匯出是為了讓單元測試直接覆蓋這段邏輯（mergedBank 本身有快取、難以重複呼叫）。
 */
export function mergeAcrossSources(
  sources: ReadonlyArray<readonly CurriculumQuestionRow[]>,
): CurriculumQuestionRow[] {
  const merged: CurriculumQuestionRow[] = [];
  const seenInEarlierSources = new Set<string>();

  for (const rows of sources) {
    const keysOfThisSource = new Set<string>();
    for (const question of rows) {
      const key = dedupeKey(question);
      keysOfThisSource.add(key);
      if (seenInEarlierSources.has(key)) continue;
      merged.push(question);
    }
    keysOfThisSource.forEach((key) => seenInEarlierSources.add(key));
  }

  return merged;
}

export type QuestionBankSource = "server" | "local";

/**
 * 「後端沒有回傳任何題目」時的共用空陣列。
 *
 * 為什麼不能用 `query.data?.questions ?? []`：那個字面量每次 render 都是全新參考，
 * 而下方 mergedBank／expanded 的 WeakMap 正是以「陣列參考」當 key。線上部署是純靜態
 * （沒有後端 API），query.data 永遠是 undefined，於是每次 re-render 都拿到新參考 →
 * 快取永遠 miss → 重新展開 5000 題（實測每次約 2 秒主執行緒阻塞，手機上更久）。
 *
 * 改成模組層級的單一常數，參考永久穩定，WeakMap 只會 miss 一次，
 * 全站所有呼叫 useQuestionBank 的頁面都只會展開一次。
 */
const NO_SERVER_QUESTIONS: readonly CurriculumQuestionRow[] = [];

/**
 * 取得正式題庫。**本地內建題庫為主**（規模見檔首註解，權威來源 `data/runtime_bank_elementary.json`）；僅當本地載入失敗／為空時
 * 才回頭抓伺服器 questionBank.list 當 fallback（見 useQuestionBank 的
 * localState 閘）。因此 isLoading 永遠不會卡住操作、error 永遠為 null。
 *
 * 為什麼改為「伺服器 fallback-only」：本部署**有**後端（Express + tRPC），
 * 但伺服器題庫與本地 runtime_bank chunk 是同一批資料，同時抓等於每次
 * 答題頁重複下載 ~595KB（伺服器 279KB gzip ＋ 本地 315KB gzip），
 * 合併去重後內容完全相同——白白吃掉行動頻寬（2026-09-29 覆核第③項）。
 * 註：早年註解寫「線上是純靜態部署、後端 API 並不存在」是舊專案狀態，
 * 已不適用本部署，特此更正。
 *
 * 選項展開（5000 題約 2 秒）已移到 Web Worker 執行：Worker 結果回來前，
 * 這裡回傳的是「未展開但已可作答」的 4 選題，學生可以馬上開始答；
 * 展開完成後才換成 6 選題版。因此回傳的題目數在載入完成後會增加，
 * 呼叫端不可假設題數固定（各頁面原本就以過濾／抽題方式使用，不是直接索引題庫）。
 *
 * 打亂選項順序每次作答都會重新執行（刻意讓正解位置每題不同），只花數毫秒。
 *
 * options.eager：預設 true＝一進頁面就下載題庫（答題頁需要立刻能出題）。
 * 傳 false＝等首屏完全結束才下載（首頁這類「要看畫面、不急著出題」的頁面用），
 * 省下首屏的 3MB 網路用量。學生若在等待期間就點了要出題的入口，
 * 呼叫 ensureLocalBank() 會立刻下載，不必等排程。
 */
export function useQuestionBank(options?: { eager?: boolean }) {
  const eager = options?.eager ?? true;
  const [localRows, setLocalRows] = useState<CurriculumQuestionRow[]>([]);
  /** 本地題庫載入進度：loading（下載中）→ ready（有題）／failed（失敗或空）。 */
  const [localState, setLocalState] = useState<"loading" | "ready" | "failed">("loading");
  /** Worker 展開完成的題目；未完成前為 null，畫面先用未展開的 4 選題。 */
  const [expandedRows, setExpandedRows] = useState<CurriculumQuestionRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    // eager=false 的頁面（純看首屏、不出題）等首屏結束再下載 3MB 題庫。
    const start = eager ? loadLocalBank() : waitForIdleThenLoad();
    // 逾時退路（覆核第③項殘餘風險）：本地 chunk 若「卡住」（hang，非 reject），
    // 下面的 catch 永遠不觸發、fallback 永不啟用、學生無限等待。
    // 12 秒仍未 settled 就先放行伺服器接手；本地若遲到仍會合併
    //（mergedBank 按題幹去重），只是此罕見路徑多一次下載。
    const hangTimer = window.setTimeout(() => {
      if (alive) setLocalState((s) => (s === "loading" ? "failed" : s));
    }, 12_000);
    start
      .then((rows) => {
        if (!alive) return;
        setLocalRows(rows);
        setLocalState(rows.length > 0 ? "ready" : "failed");
      })
      .catch(() => {
        // 本地 chunk 下載失敗（動態 import reject）→ 標記失敗，讓下方伺服器 fallback 接手。
        if (alive) setLocalState("failed");
      })
      .finally(() => window.clearTimeout(hangTimer));
    return () => {
      alive = false;
      window.clearTimeout(hangTimer);
    };
  }, [eager]);

  // 伺服器題庫只在「本地題庫載入失敗／為空」時才抓（fallback 語意）。
  // 正常路徑下兩者是同一批資料：伺服器 limit=1200 實測 1.16MB 原始／279KB
  // gzip ＋ 本地 runtime_bank chunk 315KB gzip，合併去重後等於每次答題頁
  // 白下載 ~595KB 重複內容（2026-09-29 覆核第③項）。
  const query = trpc.questionBank.list.useQuery(
    { limit: 1200 },
    { retry: false, enabled: localState === "failed" }
  );

  const serverQuestions = (query.data?.questions ?? NO_SERVER_QUESTIONS) as CurriculumQuestionRow[];
  // 還沒有任何題目來源前不要排展開作業（否則會對空陣列排一次無意義的 Promise）。
  // 注意：後端有題目時也要能展開，不能只等本地題庫。
  const hasBank = localRows.length > 0 || serverQuestions.length > 0;
  const merged = useMemo(() => {
    if (!hasBank) return NO_SERVER_QUESTIONS;
    // 正常：本地內建題庫為主（英語 seed 由 mergeAcrossSources 附加）；
    // fallback：本地載入失敗時由伺服器題庫接手。兩者以題幹去重避免重複。
    // ⚠️ 去重鍵只能跨來源比對，同源內不可用——見 dedupeKey 的警告。
    return mergedBank(serverQuestions, localRows);
  }, [serverQuestions, localRows, hasBank]);

  useEffect(() => {
    if (!hasBank) return;
    let alive = true;
    setExpandedRows(null);
    expandQuestions(merged).then((rows) => {
      if (alive) setExpandedRows(rows as CurriculumQuestionRow[]);
    });
    return () => {
      alive = false;
    };
  }, [merged, hasBank]);

  // 展開完成前先用原始 4 選題（學生可立即作答），完成後切換到 6 選題版。
  const answerable = expandedRows ?? merged;
  const questions = useMemo(() => {
    // 只在題庫（合併或展開）換掉時才重新洗牌，避免每個 render 都重跑。
    // 使用 WeakMap 快取：同一題只洗一次，展開完成後不再重洗。
    return answerable.map((question) => {
      const cached = shuffleCache.get(question);
      if (cached) return cached;
      const shuffled = shuffleQuestionOptions(question);
      shuffleCache.set(question, shuffled);
      return shuffled;
    });
  }, [answerable]);

  const usingLocal = (query.data?.questions ?? NO_SERVER_QUESTIONS).length === 0 && localRows.length === 0;
  const source = (usingLocal ? "local" : "server") as QuestionBankSource;
  return {
    questions,
    total: questions.length,
    /** 內建題庫永遠可用，載入中不會封鎖任何操作。 */
    isLoading: false as const,
    error: null as null,
    refetch: query.refetch,
    source,
    /** 選項展開是否仍在 Web Worker 中進行（true 表示現在是 4 選題，完成後自動升級為 6 選題）。 */
    isExpanding: expandedRows === null,
    isFallback: usingLocal && query.isError,
  };
}
