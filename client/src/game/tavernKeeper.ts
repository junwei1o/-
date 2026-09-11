/**
 * 燈塔酒館老闆（吧檯）— 純邏輯層
 *
 * 動態問候、新手免費贈卡、卡包價格常數。不依賴 React/DOM，
 * 可直接單測；localStorage 互動僅用於新手卡一次性標記。
 */
import { ALL_CARDS } from "./trumpCardData";

export const CARD_PACK_GOLD_COST = 25;
export const STARTER_KEY = "xue-tavern-starter-v1";

export type KeeperContext = {
  /** 0–23，注入便於測試 */
  hour: number;
  /** 來自 getPlayerData() */
  totalAnswers: number;
  /** 來自 bxStore 連勝（取不到用 0） */
  streak: number;
  ownedCardCount: number;
  uncompletedChapters: number;
};

const HOUR_GREETINGS: ReadonlyArray<{ range: [number, number]; text: string }> = [
  { range: [5, 10], text: "早安啊，精神不錯！" },
  { range: [11, 16], text: "午後時光，來一局暖暖身吧。" },
  { range: [17, 22], text: "夜色深了，來一局放鬆吧。" },
  { range: [23, 24], text: "夜深了，酒館還為你留一盞燈。" },
  { range: [0, 4], text: "夜深了，酒館還為你留一盞燈。" },
];

function timeGreeting(hour: number): string {
  const found = HOUR_GREETINGS.find((g) => hour >= g.range[0] && hour <= g.range[1]);
  return found?.text ?? "歡迎來到燈塔酒館。";
}

/**
 * 動態問候：時段招呼 + 依狀態追加一句（追加順序固定以便測試）。
 */
export function greetKeeper(ctx: KeeperContext): string {
  let message = timeGreeting(ctx.hour);
  if (ctx.streak >= 5) {
    message += " 連勝中？好手氣！";
  }
  if (ctx.ownedCardCount >= 15) {
    message += " 你蒐集的卡越來越齊了。";
  }
  if (ctx.uncompletedChapters > 0) {
    message += " 佈告欄上還有新任務，去看看？";
  }
  return message;
}

/**
 * 新手贈卡：首次啟用回傳 5 張普通卡 id 並寫入一次性標記；之後回傳 null。
 * 從普通卡池（rarity === "common"）隨機不重複取 5 張，保證 ≥3 張可立即開戰。
 * 採 Fisher–Yates 洗牌後取前 5 張，避免恆定 rng 造成死循環。
 */
export function grantStarterCards(rng: () => number = Math.random): string[] | null {
  if (typeof localStorage !== "undefined" && localStorage.getItem(STARTER_KEY)) {
    return null;
  }
  const pool = ALL_CARDS.filter((card) => card.rarity === "common").map((card) => card.id);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picks = pool.slice(0, 5);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STARTER_KEY, "1");
  }
  return picks;
}

/** 酒館「下一步」提示所需的狀態（全部由呼叫端注入，便於單測） */
export type TavernGoalContext = {
  gold: number;
  signedInToday: boolean;
  /** 今日簽到可領金幣（未簽到時顯示用） */
  signInReward: number;
  uncompletedChapters: number;
};

export type TavernGoal = {
  key: "signin" | "pack" | "adventure" | "study";
  text: string;
};

/**
 * 酒館下一步目標：依優先序挑一件最該做的事，避免玩家進酒館後無所適從。
 * 優先序：今日未簽到 → 金幣夠開卡包 → 有未解章節 → 都好（提示賺金幣）。
 */
export function nextTavernGoal(ctx: TavernGoalContext): TavernGoal {
  if (!ctx.signedInToday) {
    return { key: "signin", text: `💰 今天還沒簽到——去吧檯領 ${ctx.signInReward} 金幣` };
  }
  if (ctx.gold >= CARD_PACK_GOLD_COST) {
    return { key: "pack", text: `📦 金幣夠了！去吧檯開一包卡（${CARD_PACK_GOLD_COST} 金幣）` };
  }
  const short = Math.max(0, CARD_PACK_GOLD_COST - ctx.gold);
  if (ctx.uncompletedChapters > 0) {
    return {
      key: "adventure",
      text: `📜 佈告欄還有 ${ctx.uncompletedChapters} 個任務——或答題賺金幣（離卡包還差 ${short} 枚）`,
    };
  }
  return { key: "study", text: `🃏 離下一包卡還差 ${short} 金幣——答題或牌局都能賺` };
}
