/**
 * 選項展開 Web Worker：把 expandQuestionBankToSix（5000 題約 2 秒）移出主執行緒。
 *
 * 為什麼需要：題庫展開是純計算，卻原本同步跑在主執行緒，
 * 學生每進一��答題頁就白畫面 2 秒（4G 手機上實測 5.6 秒），
 * 期間連捲動與點擊都沒有反應。
 *
 * 為什麼不用「建置期預展開」：borrowingCandidates 依賴 Math.random()，
 * 實測每次展開有 27% 的題目選項內容不同（跨題借用階段隨機掃描起點），
 * 所以預展開結果無法在建置後原封不動沿用，仍需執行期重算。
 * 把它搬到 Worker 就能既保留每次隨機、又不阻塞 UI。
 *
 * 降級：環境不支援 module worker（例如某些舊 Safari、jsdom 測試）時，
 * 由 expandInWorker 的呼叫端改走主執行緒同步計算，行為一致。
 */
import { expandQuestionBankToSix, type ExpandableQuestion } from "./optionRandomizer";

type Expandable = ExpandableQuestion;

self.onmessage = (event: MessageEvent<{ questions: Expandable[] }>) => {
  const { questions } = event.data;
  const expanded = expandQuestionBankToSix(questions);
  (self as unknown as Worker).postMessage(expanded);
};
