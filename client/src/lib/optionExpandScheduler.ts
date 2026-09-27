/**
 * 題庫選項展開的排程層。
 *
 * 現行瓶頸：expandQuestionBankToSix(5000 題) 約需 2 秒，且原本同步跑在主執行緒，
 * 造成學生每次進答題頁都白畫面數秒（實測桌機 1.3s／4x 降速 5.6s）。
 *
 * 作法：
 * 1. 以模組層級 WeakMap 快取展開結果（key = 題目陣列參考，參考穩定後只算一次）。
 * 2. 展開改丟進 Web Worker 執行，主執行緒只等結果，不阻塞。
 * 3. 不支援 module worker 的環境（舊 Safari、jsdom）自動降級為同步計算，
 *    結果與 Worker 路徑完全一致，學生不會看到空題庫。
 *
 * 展開結果刻意不做跨次重算：shuffleQuestionOptions 仍每次出題時執行
 * （那是刻意要讓正解位置每題不同），而展開階段的跨題借用本來就帶隨機性。
 */
import { expandQuestionBankToSix, type ExpandableQuestion } from "./optionRandomizer";

type Expandable = ExpandableQuestion;

/** 展開結果快取：題目陣列參考 → 展開後陣列。參考穩定時只會算一次。 */
const expandedCache = new WeakMap<readonly Expandable[], Expandable[]>();

/** 進行中的展開：同一份題目被多個頁面同時請求時共用同一個 Promise。 */
const pending = new WeakMap<readonly Expandable[], Promise<Expandable[]>>();

/** module worker 建立的 Promise；建立失敗（不支援）就永遠維持 null。 */
let workerPromise: Promise<Worker | null> | null = null;
let workerBroken = false;

function getWorker(): Promise<Worker | null> {
  if (workerBroken) return Promise.resolve(null);
  if (workerPromise) return workerPromise;
  workerPromise = (async () => {
    if (typeof Worker === "undefined") {
      workerBroken = true;
      return null;
    }
    try {
      const worker = new Worker(new URL("./optionExpandWorker.ts", import.meta.url), {
        type: "module",
      });
      return worker;
    } catch {
      workerBroken = true;
      return null;
    }
  })();
  return workerPromise;
}

function expandViaWorker(questions: readonly Expandable[]): Promise<Expandable[] | null> {
  return getWorker().then((worker) => {
    if (!worker) return null;
    return new Promise<Expandable[] | null>((resolve) => {
      // Worker 卡住或崩潰時要有退路，不能讓學生永遠等在空白題庫上。
      const timer = setTimeout(() => {
        worker.terminate();
        workerBroken = true;
        workerPromise = null;
        resolve(null);
      }, 30_000);
      worker.onmessage = (event: MessageEvent<Expandable[]>) => {
        clearTimeout(timer);
        resolve(event.data);
      };
      worker.onerror = () => {
        clearTimeout(timer);
        worker.terminate();
        workerBroken = true;
        workerPromise = null;
        resolve(null);
      };
      // 傳結構化複製副本，worker 端展開不會污染主執行緒的原始題目物件。
      worker.postMessage({ questions: questions.slice() as Expandable[] });
    });
  });
}

/**
 * 取得展開成 6 選項的題庫。
 * 結果依題目陣列參考快取，全站共用同一份；同參考的並行請求共用同一個 Worker 作業。
 */
export function expandQuestions(questions: readonly Expandable[]): Promise<Expandable[]> {
  const cached = expandedCache.get(questions);
  if (cached) return Promise.resolve(cached);
  const running = pending.get(questions);
  if (running) return running;

  const job = expandViaWorker(questions).then((fromWorker) => {
    pending.delete(questions);
    // Worker 不可用或失敗 → 退回主執行緒同步計算（會短暫卡頓，但功能正常）。
    const result = fromWorker ?? expandQuestionBankToSix(questions as Expandable[]);
    expandedCache.set(questions, result);
    return result;
  });
  pending.set(questions, job);
  return job;
}

/** 同步取得展開結果；僅供 Worker 不可用且呼叫端願意等待時使用（測試、除錯）。 */
export function expandQuestionsSync(questions: readonly Expandable[]): Expandable[] {
  const cached = expandedCache.get(questions);
  if (cached) return cached;
  const result = expandQuestionBankToSix(questions as Expandable[]);
  expandedCache.set(questions, result);
  return result;
}
