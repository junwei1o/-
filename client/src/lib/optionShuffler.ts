// 選項順序隨機打亂工具。
//
// 目標：學生看完解析後重新挑戰時，選項位置必定改變，
// 逼學生記「答案內容」而不是「答案位置」。
//
// 種子由「科目|年級|關卡|第幾次挑戰」決定（attempt 從進度紀錄讀取）：
// - 同一關重玩（含看完解析後）attempt +1 → 每題選項順序重新洗牌
// - 洗牌結果與上次完全相同時，強制交換前兩個位置，保證順序必變
// - 題庫線上沒有 VITE_TRPC_URL 時（純靜態部署），沒有 attempt 紀錄，
//   改用 Math.random() 逐次打亂：重新整理頁面順序就會變

/** Fisher–Yates 洗牌（原地，回傳同一陣列），與 server/bank.ts 同演算法。 */
export function shuffleInPlace<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 把字串變成 32 位元種子（FNV-1a），與 server/bank.ts 同演算法。 */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 以種子決定的亂數（mulberry32），與 server/bank.ts 同演算法。 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 為第 index 題的選項算出顯示順序（選項索引陣列）。
 *
 * attempt 是「第幾次挑戰同一關」：
 * - 有紀錄（0, 1, 2…）：用種子洗牌，順序確定且每次都不同
 * - 離線首玩（null）：Math.random() 洗牌，每次進頁面順序都變
 *
 * 若洗牌結果與上次的順序完全相同，交換前兩個位置（選項至少有 2 個），
 * 保證「重新作答時順序必定和上次不同」。
 */
export function optionOrderFor(
  optionCount: number,
  questionIndex: number,
  seedKey: string,
  attempt: number | null,
  previousOrder: number[] | null,
): number[] {
  const indices = Array.from({ length: optionCount }, (_, i) => i);

  if (attempt === null) {
    // 離線首玩：無紀錄可追蹤，純隨機打亂（每次進頁面都不同）
    return shuffleInPlace(indices, Math.random);
  }

  return optionOrderForAttempt(optionCount, questionIndex, seedKey, attempt, previousOrder);
}

/**
 * 算出「本次挑戰」的選項順序（attempt 從 1 開始），保證與上次不同。
 *
 * previousOrder 必須是「上次實際顯示的順序」，因此遞迴呼叫本身
 * （而不是直接算上次的原始洗牌）——上次可能已觸發交換修正，
 * 若這裡改用未套修正的原始洗牌，鏈條會中斷，2 選項題目就會偶發相同。
 */
export function nextOptionOrder(
  optionCount: number,
  questionIndex: number,
  seedKey: string,
  attempt: number,
): number[] {
  const previousOrder =
    attempt > 1 ? nextOptionOrder(optionCount, questionIndex, seedKey, attempt - 1) : null;
  return optionOrderForAttempt(optionCount, questionIndex, seedKey, attempt, previousOrder);
}

/**
 * 內部：依 attempt 算順序（previousOrder 為上次的順序，null 表示第一次）。
 */
function optionOrderForAttempt(
  optionCount: number,
  questionIndex: number,
  seedKey: string,
  attempt: number,
  previousOrder: number[] | null,
): number[] {
  const indices = Array.from({ length: optionCount }, (_, i) => i);
  const rand = seededRandom(hashSeed(`${seedKey}|q${questionIndex}|a${attempt}|v2`));
  const order = shuffleInPlace(indices, rand);

  // 與上次完全相同 → 強制交換前兩題，順序必定改變
  if (previousOrder && previousOrder.length === optionCount && order.every((v, i) => v === previousOrder[i])) {
    [order[0], order[1]] = [order[1], order[0]];
  }

  return order;
}
