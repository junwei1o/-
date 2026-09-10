# 燈塔酒館遊戲大廳 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增「燈塔酒館」遊戲大廳，將遊戲娛樂（Top Trumps 卡牌對戰、文字冒險章節、夥伴展示）集中管理，與學習區分離；以金幣經濟串接兩區。

**Architecture:** 純前端單人遊戲。核心邏輯（卡牌對戰狀態機、冒險節點引擎）為獨立純函式檔案，便於單元測試；UI 元件依賴 `useQuestionBank` 取得題目；進度與金幣複用 `storage.ts` 的 `updatePlayerData`/`unlockLimitedTitle` 與 localStorage 慣例。所有邏輯與展示分離，元件只做渲染與互動。

**Tech Stack:** React + wouter + vitest + testing-library + lucide-react + sonner（沿用專案既有）

**執行環境注意：** 本機無系統 node，使用 `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/<pkg>/...`。tsc 用 `node_modules/typescript/bin/tsc`，vitest 用 `node_modules/vitest/vitest.mjs`，vite 用 `node_modules/vite/bin/vite.js`。

---

## 檔案結構總覽

| 檔案 | 責任 |
|------|------|
| `client/src/game/trumpCardData.ts` | 卡牌目錄（四學科、稀有度、四屬性、emoji） |
| `client/src/game/trumpDuel.ts` | 卡牌對戰狀態機 + AI + 比數值結算（純函式） |
| `client/src/game/cardCollection.ts` | 卡牌收藏進度存取（localStorage） |
| `client/src/game/adventureChapters.ts` | 冒險章節資料（節點圖） |
| `client/src/game/adventureEngine.ts` | 冒險狀態機 + 結局結算（純函式） |
| `client/src/components/TrumpDuelBoard.tsx` | 卡牌對戰面板 |
| `client/src/components/AdventureViewer.tsx` | 文字冒險閱讀與選擇面板 |
| `client/src/components/TavernCompanion.tsx` | 夥伴小屋展示 |
| `client/src/pages/Tavern.tsx` + `.css` | 酒館大廳 hub |
| `client/src/game/titleCatalog.ts` | 新增卡牌/冒險稱號 |
| `client/src/App.tsx` | 新增 `/tavern`、`/tavern/cards`、`/tavern/adventure` 路由 |
| `client/src/pages/Home.tsx` | 新增酒館入口、移除知識決鬥卡 |
| `client/src/lib/featureSearch.ts` | 新增酒館搜尋項目 |

---

### Task 1: 卡牌目錄 trumpCardData

**Files:**
- Create: `client/src/game/trumpCardData.ts`
- Test: `client/src/game/trumpCardData.test.ts`

- [ ] **Step 1: 撰寫失敗測試**

```ts
import { describe, expect, it } from "vitest";
import { ALL_CARDS, getCardById, getCardsByTheme, type CardStat, type CardTheme } from "./trumpCardData";

describe("trump card data", () => {
  it("每張卡都有唯一 id、完整四屬性 1–10、稀有度與主題", () => {
    const ids = ALL_CARDS.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
    ALL_CARDS.forEach((card) => {
      expect(card.name.trim()).not.toBe("");
      expect(card.emoji.length).toBeGreaterThan(0);
      expect(card.flavor.trim()).not.toBe("");
      (["common", "rare", "legendary"] as const).forEach((r) => { /* noop */ });
      expect(["common", "rare", "legendary"]).toContain(card.rarity);
      expect(["國語", "數學", "社會", "自然"]).toContain(card.theme);
      (["power", "wisdom", "speed", "charm"] as CardStat[]).forEach((stat) => {
        expect(card.stats[stat]).toBeGreaterThanOrEqual(1);
        expect(card.stats[stat]).toBeLessThanOrEqual(10);
      });
    });
  });

  it("四個學科主題各有至少 4 張卡", () => {
    (["國語", "數學", "社會", "自然"] as CardTheme[]).forEach((theme) => {
      expect(getCardsByTheme(theme).length).toBeGreaterThanOrEqual(4);
    });
  });

  it("稀有度分布合理：普通最多、傳說最少", () => {
    const byRarity = ALL_CARDS.reduce((acc, card) => {
      acc[card.rarity] = (acc[card.rarity] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    expect((byRarity.common ?? 0)).toBeGreaterThan(byRarity.rare ?? 0);
    expect((byRarity.rare ?? 0)).toBeGreaterThanOrEqual(byRarity.legendary ?? 0);
  });

  it("getCardById 可查詢且找不到回傳 null", () => {
    expect(getCardById(ALL_CARDS[0].id)).toEqual(ALL_CARDS[0]);
    expect(getCardById("not-exist")).toBeNull();
  });
});
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/game/trumpCardData.test.ts`
Expected: FAIL（模組不存在）

- [ ] **Step 3: 實作卡牌目錄**

```ts
import type { Rarity } from "./rpgTypes";

export type CardTheme = "國語" | "數學" | "社會" | "自然";
export type CardStat = "power" | "wisdom" | "speed" | "charm";

export const STAT_LABELS: Record<CardStat, string> = {
  power: "威力",
  wisdom: "知識",
  speed: "速度",
  charm: "稀有",
};

export type CardDef = {
  id: string;
  name: string;
  theme: CardTheme;
  rarity: Rarity;
  stats: Record<CardStat, number>;
  emoji: string;
  flavor: string;
};

export const ALL_CARDS: readonly CardDef[] = [
  // 國語
  { id: "ch-01", name: "詩仙李白", theme: "國語", rarity: "legendary", stats: { power: 7, wisdom: 10, speed: 6, charm: 9 }, emoji: "🖋️", flavor: "斗酒詩百篇，長安市上酒家眠。" },
  { id: "ch-02", name: "客家山歌", theme: "國語", rarity: "common", stats: { power: 3, wisdom: 5, speed: 7, charm: 4 }, emoji: "🎵", flavor: "山謠傳唱，承載先民生活記憶。" },
  { id: "ch-03", name: "諺語智慧", theme: "國語", rarity: "common", stats: { power: 4, wisdom: 7, speed: 3, charm: 5 }, emoji: "💬", flavor: "一句老話，藏著一代經驗。" },
  { id: "ch-04", name: "現代詩", theme: "國語", rarity: "rare", stats: { power: 5, wisdom: 8, speed: 6, charm: 7 }, emoji: "📜", flavor: "以日常事物映照心靈風景。" },
  { id: "ch-05", name: "古典小說", theme: "國語", rarity: "rare", stats: { power: 8, wisdom: 6, speed: 4, charm: 8 }, emoji: "📚", flavor: "英雄豪傑，盡在章回之間。" },
  // 數學
  { id: "math-01", name: "圓周率", theme: "數學", rarity: "legendary", stats: { power: 6, wisdom: 10, speed: 5, charm: 9 }, emoji: "π", flavor: "無盡不循環的神秘數字。" },
  { id: "math-02", name: "三角形", theme: "數學", rarity: "common", stats: { power: 5, wisdom: 6, speed: 7, charm: 3 }, emoji: "🔺", flavor: "最穩定的圖形結構。" },
  { id: "math-03", name: "分數", theme: "數學", rarity: "common", stats: { power: 4, wisdom: 7, speed: 4, charm: 5 }, emoji: "➗", flavor: "把整體公平切開的方法。" },
  { id: "math-04", name: "幾何變換", theme: "數學", rarity: "rare", stats: { power: 7, wisdom: 7, speed: 8, charm: 6 }, emoji: "🔄", flavor: "平移、旋轉、對稱，形狀的魔術。" },
  { id: "math-05", name: "黃金比例", theme: "數學", rarity: "rare", stats: { power: 6, wisdom: 8, speed: 5, charm: 9 }, emoji: "✨", flavor: "自然界最美的比例。" },
  // 社會
  { id: "soc-01", name: "鄭成功艦隊", theme: "社會", rarity: "legendary", stats: { power: 9, wisdom: 7, speed: 6, charm: 8 }, emoji: "⛵", flavor: "驅逐荷蘭，開墾寶島。" },
  { id: "soc-02", name: "濁水溪", theme: "社會", rarity: "common", stats: { power: 5, wisdom: 4, speed: 6, charm: 4 }, emoji: "🏞️", flavor: "台灣最長河川，孕育肥沃平原。" },
  { id: "soc-03", name: "阿美族豐年祭", theme: "社會", rarity: "rare", stats: { power: 4, wisdom: 6, speed: 5, charm: 9 }, emoji: "🌾", flavor: "歌聲與舞蹈，感謝大地賜予。" },
  { id: "soc-04", name: "民主選舉", theme: "社會", rarity: "rare", stats: { power: 5, wisdom: 9, speed: 4, charm: 7 }, emoji: "🗳️", flavor: "一人一票，決定家園方向。" },
  { id: "soc-05", name: "高鐵", theme: "社會", rarity: "common", stats: { power: 6, wisdom: 5, speed: 10, charm: 4 }, emoji: "🚄", flavor: "一日生活圈，串連南北。" },
  // 自然
  { id: "nat-01", name: "黑面琵鷺", theme: "自然", rarity: "legendary", stats: { power: 4, wisdom: 6, speed: 7, charm: 10 }, emoji: "🦤", flavor: "過境台灣的稀有嬌客。" },
  { id: "nat-02", name: "櫻花鉤吻鮭", theme: "自然", rarity: "rare", stats: { power: 3, wisdom: 5, speed: 8, charm: 8 }, emoji: "🐟", flavor: "冰河時期遺留的國寶魚。" },
  { id: "nat-03", name: "大屯火山", theme: "自然", rarity: "common", stats: { power: 8, wisdom: 5, speed: 3, charm: 6 }, emoji: "🌋", flavor: "地熱與溫泉的源頭。" },
  { id: "nat-04", name: "光合作用", theme: "自然", rarity: "common", stats: { power: 5, wisdom: 9, speed: 4, charm: 5 }, emoji: "🌱", flavor: "陽光、水與空氣，變成生命。" },
  { id: "nat-05", name: "颱風", theme: "自然", rarity: "rare", stats: { power: 10, wisdom: 6, speed: 9, charm: 4 }, emoji: "🌀", flavor: "夏秋季節的強力天氣系統。" },
];

export function getCardById(id: string): CardDef | null {
  return ALL_CARDS.find((card) => card.id === id) ?? null;
}

export function getCardsByTheme(theme: CardTheme): readonly CardDef[] {
  return ALL_CARDS.filter((card) => card.theme === theme);
}

export function getRandomUnownedCard(ownedIds: readonly string[], random: () => number = Math.random): CardDef | null {
  const unowned = ALL_CARDS.filter((card) => !ownedIds.includes(card.id));
  if (unowned.length === 0) return null;
  const pick = unowned[Math.floor(random() * unowned.length)] ?? null;
  return pick;
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/game/trumpCardData.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/game/trumpCardData.ts client/src/game/trumpCardData.test.ts
git commit -m "feat(tavern): 新增卡牌目錄（四學科 20 張，四屬性）"
```

---

### Task 2: 卡牌對戰狀態機 trumpDuel

**Files:**
- Create: `client/src/game/trumpDuel.ts`
- Test: `client/src/game/trumpDuel.test.ts`

- [ ] **Step 1: 撰寫失敗測試**

```ts
import { describe, expect, it } from "vitest";
import { applyTrumpAnswer, beginTrumpDuel, chooseTrumpStat, settleTrumpRound, type CardDef, type TrumpState } from "./trumpDuel";
import { getCardById } from "./trumpCardData";

const D = (id: string): CardDef => getCardById(id)!;
const deck = (ids: string[]): CardDef[] => ids.map(D);

function freshState(): TrumpState {
  return beginTrumpDuel(deck(["math-01", "ch-01", "soc-01", "nat-01", "nat-02", "soc-02", "ch-02", "math-02"]), deck(["nat-03", "soc-03", "ch-03", "math-03", "nat-04", "soc-04", "ch-04", "math-04"]));
}

describe("trump duel engine", () => {
  it("初始雙方各 8 張、第一回合主動方隨機、階段為 choose-stat", () => {
    const state = freshState();
    expect(state.playerDeck).toHaveLength(8);
    expect(state.aiDeck).toHaveLength(8);
    expect(state.pot).toHaveLength(0);
    expect(state.round).toBe(1);
    expect(state.phase).toBe("choose-stat");
    expect(state.result).toBe("active");
    expect(["player", "ai"]).toContain(state.turnLeader);
  });

  it("choose-stat 後進入 answer 並記錄 pendingStat", () => {
    const state = freshState();
    const next = chooseTrumpStat(state, "power");
    expect(next.pendingStat).toBe("power");
    expect(next.phase).toBe("answer");
  });

  it("答對強化 +2 並進入 reveal，答錯維持原值進入 reveal", () => {
    let state = freshState();
    state = chooseTrumpStat(state, "power");
    const correct = applyTrumpAnswer(state, true, "boost");
    expect(correct.phase).toBe("reveal");
    expect(correct.peekRevealed).toBe(false);
    const wrong = applyTrumpAnswer(state, false, "boost");
    expect(wrong.phase).toBe("reveal");
  });

  it("答對情報會標記 peekRevealed", () => {
    let state = freshState();
    state = chooseTrumpStat(state, "power");
    const peek = applyTrumpAnswer(state, true, "peek");
    expect(peek.peekRevealed).toBe(true);
    expect(peek.phase).toBe("reveal");
  });

  it("比大小：高者贏走對方頂牌放到自己牌堆底，並續當主動方", () => {
    // 建構一個玩家必勝的局面
    const strong = { id: "x-1", name: "強", theme: "數學", rarity: "common", stats: { power: 10, wisdom: 1, speed: 1, charm: 1 }, emoji: "💪", flavor: "" };
    const weak = { id: "x-2", name: "弱", theme: "數學", rarity: "common", stats: { power: 1, wisdom: 1, speed: 1, charm: 1 }, emoji: "🐌", flavor: "" };
    let state = beginTrumpDuel([strong], [weak]);
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, false, "boost");
    const settled = settleTrumpRound(state);
    expect(settled.playerDeck).toHaveLength(2); // 贏走對方的牌
    expect(settled.aiDeck).toHaveLength(0);
    expect(settled.turnLeader).toBe("player");
    expect(settled.result).toBe("victory");
  });

  it("平手：兩張牌進 pot，主動方不變", () => {
    const a = { id: "a", name: "A", theme: "數學", rarity: "common", stats: { power: 5, wisdom: 1, speed: 1, charm: 1 }, emoji: "🅰️", flavor: "" };
    const b = { id: "b", name: "B", theme: "數學", rarity: "common", stats: { power: 5, wisdom: 1, speed: 1, charm: 1 }, emoji: "🅱️", flavor: "" };
    let state = beginTrumpDuel([a], [b]);
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, false, "boost");
    const settled = settleTrumpRound(state);
    expect(settled.pot).toHaveLength(2);
    expect(settled.playerDeck).toHaveLength(0);
    expect(settled.aiDeck).toHaveLength(0);
    expect(settled.turnLeader).toBe(state.turnLeader);
  });

  it("平手後再戰，贏家全拿 pot + 當回合兩張", () => {
    const a = { id: "a", name: "A", theme: "數學", rarity: "common", stats: { power: 5, wisdom: 1, speed: 1, charm: 1 }, emoji: "🅰️", flavor: "" };
    const a2 = { id: "a2", name: "A2", theme: "數學", rarity: "common", stats: { power: 9, wisdom: 1, speed: 1, charm: 1 }, emoji: "🅰️", flavor: "" };
    const b = { id: "b", name: "B", theme: "數學", rarity: "common", stats: { power: 5, wisdom: 1, speed: 1, charm: 1 }, emoji: "🅱️", flavor: "" };
    const b2 = { id: "b2", name: "B2", theme: "數學", rarity: "common", stats: { power: 1, wisdom: 1, speed: 1, charm: 1 }, emoji: "🅱️", flavor: "" };
    let state = beginTrumpDuel([a, a2], [b, b2]);
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, false, "boost");
    state = settleTrumpRound(state); // 平手，pot 有 2 張
    state = chooseTrumpStat(state, "power");
    state = applyTrumpAnswer(state, false, "boost");
    const settled = settleTrumpRound(state);
    expect(settled.playerDeck).toHaveLength(4); // 2 pot + 2 本回合
    expect(settled.aiDeck).toHaveLength(0);
    expect(settled.result).toBe("victory");
  });

  it("達 40 回合上限時比牌堆剩餘牌數，相同為 draw", () => {
    const state = freshState();
    state.round = 40;
    const settled = settleTrumpRound(state);
    expect(settled.result).toBe("draw");
  });
});
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/game/trumpDuel.test.ts`
Expected: FAIL

- [ ] **Step 3: 實作狀態機**

```ts
import type { CardDef, CardStat } from "./trumpCardData";

export type TrumpPhase = "choose-stat" | "answer" | "reveal" | "finished";
export type TrumpResult = "active" | "victory" | "defeat" | "draw";
export type AnswerChoice = "boost" | "peek";
export const MAX_ROUNDS = 40;

export type TrumpState = {
  playerDeck: CardDef[];
  aiDeck: CardDef[];
  pot: CardDef[];
  turnLeader: "player" | "ai";
  round: number;
  phase: TrumpPhase;
  pendingStat: CardStat | null;
  peekRevealed: boolean;
  pendingBoost: boolean;
  result: TrumpResult;
};

export function beginTrumpDuel(playerDeck: CardDef[], aiDeck: CardDef[], startLeader: "player" | "ai" | null = null): TrumpState {
  const turnLeader: "player" | "ai" = startLeader ?? (Math.random() < 0.5 ? "player" : "ai");
  return {
    playerDeck: [...playerDeck],
    aiDeck: [...aiDeck],
    pot: [],
    turnLeader,
    round: 1,
    phase: "choose-stat",
    pendingStat: null,
    peekRevealed: false,
    pendingBoost: false,
    result: "active",
  };
}

export function chooseTrumpStat(state: TrumpState, stat: CardStat): TrumpState {
  if (state.phase !== "choose-stat") throw new Error("非 choose-stat 階段");
  return { ...state, pendingStat: stat, phase: "answer" };
}

export function applyTrumpAnswer(state: TrumpState, correct: boolean, choice: AnswerChoice): TrumpState {
  if (state.phase !== "answer") throw new Error("非 answer 階段");
  return {
    ...state,
    phase: "reveal",
    peekRevealed: correct && choice === "peek",
    pendingBoost: correct && choice === "boost",
  };
}

function compareStat(player: CardDef, ai: CardDef, stat: CardStat, playerBoost: boolean): "player" | "ai" | "draw" {
  const playerVal = player.stats[stat] + (playerBoost ? 2 : 0);
  const aiVal = ai.stats[stat];
  if (playerVal > aiVal) return "player";
  if (aiVal > playerVal) return "ai";
  return "draw";
}

export function settleTrumpRound(state: TrumpState): TrumpState {
  if (state.phase !== "reveal") throw new Error("非 reveal 階段");
  if (state.result !== "active") return state;
  const playerTop = state.playerDeck[0];
  const aiTop = state.aiDeck[0];
  if (!playerTop || !aiTop) {
    return concludeByDeckSize(state);
  }
  const stat = state.pendingStat;
  if (!stat) throw new Error("缺少 pendingStat");
  const winner = compareStat(playerTop, aiTop, stat, state.pendingBoost);
  let playerDeck = state.playerDeck.slice(1);
  let aiDeck = state.aiDeck.slice(1);
  let pot = [...state.pot];
  let turnLeader = state.turnLeader;
  if (winner === "player") {
    playerDeck = [...playerDeck, aiTop, playerTop, ...pot];
    pot = [];
    turnLeader = "player";
  } else if (winner === "ai") {
    aiDeck = [...aiDeck, playerTop, aiTop, ...pot];
    pot = [];
    turnLeader = "ai";
  } else {
    pot = [...pot, playerTop, aiTop];
  }
  const next: TrumpState = {
    ...state,
    playerDeck,
    aiDeck,
    pot,
    turnLeader,
    round: state.round + 1,
    phase: "choose-stat",
    pendingStat: null,
    peekRevealed: false,
    pendingBoost: false,
  };
  if (playerDeck.length === 0 || aiDeck.length === 0) {
    return concludeByDeckSize(next);
  }
  if (next.round > MAX_ROUNDS) {
    return concludeByDeckSize(next);
  }
  return next;
}

function concludeByDeckSize(state: TrumpState): TrumpState {
  if (state.playerDeck.length === 0 && state.aiDeck.length === 0) return { ...state, result: "draw", phase: "finished" };
  if (state.aiDeck.length === 0) return { ...state, result: "victory", phase: "finished" };
  if (state.playerDeck.length === 0) return { ...state, result: "defeat", phase: "finished" };
  return state.playerDeck.length > state.aiDeck.length
    ? { ...state, result: "victory", phase: "finished" }
    : state.playerDeck.length < state.aiDeck.length
      ? { ...state, result: "defeat", phase: "finished" }
      : { ...state, result: "draw", phase: "finished" };
}

/** AI 主動時選最強屬性；加少量隨機。 */
export function aiChooseStat(deck: CardDef[], random: () => number = Math.random): CardStat {
  const top = deck[0];
  if (!top) return "power";
  const stats: CardStat[] = ["power", "wisdom", "speed", "charm"];
  const best = stats.reduce((acc, stat) => (top.stats[stat] > top.stats[acc] ? stat : acc), "power" as CardStat);
  return random() < 0.3 ? stats[Math.floor(random() * stats.length)] ?? best : best;
}

/** AI 答題：依難度固定機率答對。difficulty 1/2/3 對應 4/3/2 的閾值（0–4 隨機）。 */
export function aiAnswerCorrect(difficulty: number, seed: number): boolean {
  const threshold = difficulty <= 1 ? 4 : difficulty === 2 ? 3 : 2;
  return seed % 5 < threshold;
}

/** 從收藏中抽 n 張不重複的卡作為牌堆。 */
export function buildDeckFromCollection(ownedIds: readonly string[], allCards: readonly CardDef[], count: number, random: () => number = Math.random): CardDef[] {
  const pool = allCards.filter((card) => ownedIds.includes(card.id));
  const deck: CardDef[] = [];
  const candidates = [...pool];
  while (deck.length < count && candidates.length > 0) {
    const index = Math.floor(random() * candidates.length);
    deck.push(candidates[index]);
    candidates.splice(index, 1);
  }
  return deck;
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/game/trumpDuel.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/game/trumpDuel.ts client/src/game/trumpDuel.test.ts
git commit -m "feat(tavern): 卡牌對戰狀態機（比數值/平手公共池/40回合上限）"
```

---

### Task 3: 卡牌收藏進度 cardCollection

> 沿用 `dailyCamp.ts` 慣例：函式不接受 storage 參數，直接使用預設 `browserStorage()`（`localStorage`）。測試在 `beforeEach` 中 `localStorage.clear()` 隔離。

**Files:**
- Create: `client/src/game/cardCollection.ts`
- Test: `client/src/game/cardCollection.test.ts`

- [ ] **Step 1: 撰寫失敗測試**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { addCardToCollection, getCardCollection, hasAllThemeCards, maybeDropUnownedCard, openCardPack, recordCardDuelResult } from "./cardCollection";

beforeEach(() => localStorage.clear());

describe("card collection", () => {
  it("初始收藏為空、勝負計數為零", () => {
    const col = getCardCollection();
    expect(col.ownedCardIds).toEqual([]);
    expect(col.wins).toBe(0);
    expect(col.losses).toBe(0);
    expect(col.packsOpened).toBe(0);
  });

  it("addCardToCollection 新增卡片且不重複", () => {
    addCardToCollection("math-01");
    addCardToCollection("math-01");
    addCardToCollection("ch-01");
    expect(getCardCollection().ownedCardIds).toEqual(["math-01", "ch-01"]);
  });

  it("recordCardDuelResult 累計勝負與總回合", () => {
    recordCardDuelResult("victory");
    recordCardDuelResult("defeat");
    recordCardDuelResult("draw");
    const col = getCardCollection();
    expect(col.wins).toBe(1);
    expect(col.losses).toBe(1);
    expect(col.draws).toBe(1);
    expect(col.totalRounds).toBe(3);
  });

  it("openCardPack 回傳 3 張不重複卡並累加 packsOpened", () => {
    const cards = openCardPack(() => 0);
    expect(cards).toHaveLength(3);
    expect(new Set(cards.map((c) => c.id)).size).toBe(3);
    expect(getCardCollection().packsOpened).toBe(1);
  });

  it("maybeDropUnownedCard 只掉未擁有的卡", () => {
    addCardToCollection("math-01");
    const dropped = maybeDropUnownedCard(() => 0.99);
    expect(dropped).not.toBeNull();
    expect(dropped?.id).not.toBe("math-01");
  });

  it("hasAllThemeCards 判斷是否集滿單一學科", () => {
    ["math-01", "math-02", "math-03", "math-04", "math-05"].forEach(addCardToCollection);
    expect(hasAllThemeCards("數學")).toBe(true);
    expect(hasAllThemeCards("國語")).toBe(false);
  });
});
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/game/cardCollection.test.ts`
Expected: FAIL

- [ ] **Step 3: 實作收藏進度**

```ts
import { readStoredJson, writeStoredJson } from "@/utils/storage";
import { ALL_CARDS, getRandomUnownedCard, type CardDef, type CardTheme } from "./trumpCardData";

export type CardCollection = {
  ownedCardIds: string[];
  wins: number;
  losses: number;
  draws: number;
  packsOpened: number;
  totalRounds: number;
};

export const CARD_COLLECTION_KEY = "xue-card-collection-v1";

const EMPTY_COLLECTION: CardCollection = {
  ownedCardIds: [],
  wins: 0,
  losses: 0,
  draws: 0,
  packsOpened: 0,
  totalRounds: 0,
};

export function getCardCollection(): CardCollection {
  const raw = readStoredJson<Partial<CardCollection> | null>(CARD_COLLECTION_KEY, null);
  return { ...EMPTY_COLLECTION, ...(raw ?? {}) };
}

function saveCollection(collection: CardCollection): void {
  writeStoredJson(CARD_COLLECTION_KEY, collection);
}

export function addCardToCollection(cardId: string): CardCollection {
  const current = getCardCollection();
  if (current.ownedCardIds.includes(cardId)) return current;
  const next = { ...current, ownedCardIds: [...current.ownedCardIds, cardId] };
  saveCollection(next);
  return next;
}

export function recordCardDuelResult(result: "victory" | "defeat" | "draw"): CardCollection {
  const current = getCardCollection();
  const next = {
    ...current,
    wins: current.wins + (result === "victory" ? 1 : 0),
    losses: current.losses + (result === "defeat" ? 1 : 0),
    draws: current.draws + (result === "draw" ? 1 : 0),
    totalRounds: current.totalRounds + 1,
  };
  saveCollection(next);
  return next;
}

export function openCardPack(random: () => number = Math.random): CardDef[] {
  const cards: CardDef[] = [];
  const used = new Set<string>();
  while (cards.length < 3) {
    const pool = ALL_CARDS.filter((card) => !used.has(card.id));
    if (pool.length === 0) break;
    const pick = pool[Math.floor(random() * pool.length)];
    if (pick) {
      cards.push(pick);
      used.add(pick.id);
    }
  }
  cards.forEach((card) => addCardToCollection(card.id));
  const current = getCardCollection();
  saveCollection({ ...current, packsOpened: current.packsOpened + 1 });
  return cards;
}

export function hasAllThemeCards(theme: CardTheme): boolean {
  const owned = new Set(getCardCollection().ownedCardIds);
  return ALL_CARDS.filter((card) => card.theme === theme).every((card) => owned.has(card.id));
}

export function maybeDropUnownedCard(random: () => number = Math.random): CardDef | null {
  const owned = getCardCollection().ownedCardIds;
  const card = getRandomUnownedCard(owned, random);
  if (card) addCardToCollection(card.id);
  return card;
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/game/cardCollection.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/game/cardCollection.ts client/src/game/cardCollection.test.ts
git commit -m "feat(tavern): 卡牌收藏進度存取與卡包抽取"
```

---

### Task 4: 冒險章節資料 adventureChapters

**Files:**
- Create: `client/src/game/adventureChapters.ts`
- Test: `client/src/game/adventureChapters.test.ts`

- [ ] **Step 1: 撰寫失敗測試**

```ts
import { describe, expect, it } from "vitest";
import { ALL_CHAPTERS, getChapterById, validateChapter } from "./adventureChapters";

describe("adventure chapters", () => {
  it("每章節的所有 nextNodeId 都指向存在的節點", () => {
    ALL_CHAPTERS.forEach((chapter) => validateChapter(chapter));
  });

  it("check 節點必須有 subject 與正確/錯誤分支", () => {
    ALL_CHAPTERS.forEach((chapter) => {
      Object.values(chapter.nodes).forEach((node) => {
        if (node.type === "check") {
          expect(node.check?.subject).toBeTruthy();
          expect(chapter.nodes[node.check!.nextCorrectId]).toBeTruthy();
          expect(chapter.nodes[node.check!.nextWrongId]).toBeTruthy();
        }
      });
    });
  });

  it("ending 節點必須有 ending 型態", () => {
    ALL_CHAPTERS.forEach((chapter) => {
      Object.values(chapter.nodes).forEach((node) => {
        if (node.type === "ending") {
          expect(["good", "bad", "neutral"]).toContain(node.ending);
        }
      });
    });
  });

  it("第一章免費、第二章付費", () => {
    expect(getChapterById("lighthouse-call")?.cost).toBe(0);
    expect(getChapterById("lost-classic")?.cost).toBe(30);
  });
});
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/game/adventureChapters.test.ts`
Expected: FAIL

- [ ] **Step 3: 實作章節資料（兩章）**

```ts
import type { CardTheme } from "./trumpCardData";

export type AdventureNodeType = "narrative" | "choice" | "check" | "ending";
export type AdventureEnding = "good" | "bad" | "neutral";

export type AdventureChoice = { label: string; nextNodeId: string };

export type AdventureNode = {
  id: string;
  text: string;
  type: AdventureNodeType;
  choices?: AdventureChoice[];
  check?: { subject: CardTheme; nextCorrectId: string; nextWrongId: string };
  reward?: { gold?: number; card?: boolean; title?: string };
  ending?: AdventureEnding;
};

export type AdventureChapter = {
  id: string;
  title: string;
  summary: string;
  icon: string;
  cost: number;
  startNodeId: string;
  nodes: Record<string, AdventureNode>;
};

export const ALL_CHAPTERS: readonly AdventureChapter[] = [
  {
    id: "lighthouse-call",
    title: "燈塔的呼喚",
    summary: "酒館老闆託你送補給到燈塔，途中認識潮汐、方位與海岸生態。",
    icon: "🗼",
    cost: 0,
    startNodeId: "start",
    nodes: {
      start: { id: "start", text: "傍晚的酒館，老闆遞來一個包袱：「拜託把這批補給送到海邊的燈塔，守塔人等著用。」", type: "choice", choices: [
        { label: "收下包袱，沿著海岸出發", nextNodeId: "coast" },
        { label: "先問問路線危險嗎", nextNodeId: "ask" },
      ]},
      ask: { id: "ask", text: "老闆笑了：「漲潮時礁石會淹沒，記得看潮水。去吧，孩子。」", type: "narrative", choices: [{ label: "出發", nextNodeId: "coast" }]},
      coast: { id: "coast", text: "來到海岸，遠方燈塔閃著光。前方一片礁石，潮水正在上漲。", type: "check", check: { subject: "自然", nextCorrectId: "safe", nextWrongId: "wet" }},
      safe: { id: "safe", text: "你記得漲潮知識，繞過高處岩徑，順利抵達燈塔。守塔人熱情接待，講述星象導航的故事。", type: "check", check: { subject: "社會", nextCorrectId: "tower-good", nextWrongId: "tower-mid" }},
      wet: { id: "wet", text: "沒注意潮水，鞋襪全濕了，狼狽抵達燈塔。守塔人讓你烤火取暖。", type: "narrative", choices: [{ label: "聽守塔人說故事", nextNodeId: "tower-mid" }]},
      "tower-good": { id: "tower-good", text: "你用方位知識協助校正了燈塔的記錄，守塔人大為感動，贈予一枚燈塔徽章。", type: "ending", ending: "good", reward: { gold: 20, title: "燈塔嚮導" }},
      "tower-mid": { id: "tower-mid", text: "平安完成送貨任務，守塔人致謝並給了些小費。", type: "ending", ending: "neutral", reward: { gold: 10 }},
    },
  },
  {
    id: "lost-classic",
    title: "失落的古籍",
    summary: "傳聞山中有一本失傳的古籍，你踏上尋找之旅，途中考驗語文與數理。",
    icon: "📖",
    cost: 30,
    startNodeId: "start",
    nodes: {
      start: { id: "start", text: "酒館傳來消息：山林深處的古廟裡，藏著一本失傳已久的古籍。你決定前去一探究竟。", type: "choice", choices: [
        { label: "帶著地圖與口糧出發", nextNodeId: "forest" },
        { label: "先找老學者請教", nextNodeId: "scholar" },
      ]},
      scholar: { id: "scholar", text: "老學者捻鬚：「古籍藏在廟中，須解文字之謎方能取。」他贈你一卷字訣。", type: "narrative", choices: [{ label: "前往山林", nextNodeId: "forest" }]},
      forest: { id: "forest", text: "山林茂密，岔路紛呈。一塊石碑刻著古文，似是指引方向。", type: "check", check: { subject: "國語", nextCorrectId: "temple", nextWrongId: "lost" }},
      lost: { id: "lost", text: "辨錯文字，在林中繞了許久，最後憑記憶摸回小徑。", type: "narrative", choices: [{ label: "繼續找古廟", nextNodeId: "temple" }]},
      temple: { id: "temple", text: "古廟出現眼前，廟前石階刻著幾何圖形，似是機關。", type: "check", check: { subject: "數學", nextCorrectId: "inner", nextWrongId: "blocked" }},
      inner: { id: "inner", text: "解開幾何機關，廟門應聲而開。古籍靜靜躺在供桌上。", type: "ending", ending: "good", reward: { gold: 40, card: true, title: "古籍尋跡者" }},
      blocked: { id: "blocked", text: "機關未解，廟門緊閉。你只能遺憾折返，但這趟旅程已讓你成長。", type: "ending", ending: "bad", reward: { gold: 15 }},
    },
  },
];

export function getChapterById(id: string): AdventureChapter | null {
  return ALL_CHAPTERS.find((chapter) => chapter.id === id) ?? null;
}

/** 驗證章節節點圖完整性：所有 nextNodeId 皆存在。 */
export function validateChapter(chapter: AdventureChapter): void {
  const nodeIds = Object.keys(chapter.nodes);
  nodeIds.forEach((nodeId) => {
    const node = chapter.nodes[nodeId];
    expect(node).toBeTruthy();
    node.choices?.forEach((choice) => {
      if (!chapter.nodes[choice.nextNodeId]) {
        throw new Error(`章節 ${chapter.id} 節點 ${nodeId} 指向不存在的 ${choice.nextNodeId}`);
      }
    });
    if (node.type === "check" && node.check) {
      if (!chapter.nodes[node.check.nextCorrectId] || !chapter.nodes[node.check.nextWrongId]) {
        throw new Error(`章節 ${chapter.id} check 節點 ${nodeId} 分支無效`);
      }
    }
  });
  if (!chapter.nodes[chapter.startNodeId]) {
    throw new Error(`章節 ${chapter.id} 起始節點 ${chapter.startNodeId} 不存在`);
  }
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/game/adventureChapters.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/game/adventureChapters.ts client/src/game/adventureChapters.test.ts
git commit -m "feat(tavern): 冒險章節資料（2 章、節點圖、答題檢定、結局獎勵）"
```

---

### Task 5: 冒險引擎 adventureEngine

**Files:**
- Create: `client/src/game/adventureEngine.ts`
- Test: `client/src/game/adventureEngine.test.ts`

- [ ] **Step 1: 撰寫失敗測試**

```ts
import { describe, expect, it } from "vitest";
import { advanceAdventure, beginAdventure, settleAdventureEnding, type AdventureEndingReward } from "./adventureEngine";
import { getChapterById } from "./adventureChapters";

describe("adventure engine", () => {
  it("beginAdventure 從 start 節點開始、history 含起始節點", () => {
    const chapter = getChapterById("lighthouse-call")!;
    const state = beginAdventure(chapter);
    expect(state.currentNodeId).toBe("start");
    expect(state.history).toEqual(["start"]);
    expect(state.ended).toBe(false);
  });

  it("choice 節點可依選項前進", () => {
    const chapter = getChapterById("lighthouse-call")!;
    let state = beginAdventure(chapter);
    state = advanceAdventure(state, chapter, { kind: "choice", choiceIndex: 0 });
    expect(state.currentNodeId).toBe("coast");
    expect(state.history).toEqual(["start", "coast"]);
  });

  it("check 節點答對走正確分支、答錯走錯誤分支", () => {
    const chapter = getChapterById("lighthouse-call")!;
    let state = beginAdventure(chapter);
    state = advanceAdventure(state, chapter, { kind: "choice", choiceIndex: 0 }); // coast (check)
    state = advanceAdventure(state, chapter, { kind: "answer", correct: true });
    expect(state.currentNodeId).toBe("safe");
    state = advanceAdventure(state, chapter, { kind: "answer", correct: false });
    expect(state.currentNodeId).toBe("tower-mid");
  });

  it("ending 節點 settleAdventureEnding 回傳獎勵並標記結束", () => {
    const chapter = getChapterById("lighthouse-call")!;
    let state = beginAdventure(chapter);
    state = advanceAdventure(state, chapter, { kind: "choice", choiceIndex: 0 });
    state = advanceAdventure(state, chapter, { kind: "answer", correct: true });
    state = advanceAdventure(state, chapter, { kind: "answer", correct: true }); // tower-good ending
    expect(state.ended).toBe(true);
    const reward = settleAdventureEnding(state, chapter);
    expect(reward.gold).toBe(20);
    expect(reward.title).toBe("燈塔嚮導");
  });
});
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/game/adventureEngine.test.ts`
Expected: FAIL

- [ ] **Step 3: 實作冒險引擎**

```ts
import type { AdventureChapter, AdventureNode } from "./adventureChapters";

export type AdventureInput =
  | { kind: "choice"; choiceIndex: number }
  | { kind: "answer"; correct: boolean }
  | { kind: "continue" };

export type AdventureEndingReward = { gold: number; card: boolean; title: string | null };

export type AdventureState = {
  chapterId: string;
  currentNodeId: string;
  history: string[];
  answered: Record<string, boolean>;
  ended: boolean;
};

export function beginAdventure(chapter: AdventureChapter): AdventureState {
  return {
    chapterId: chapter.id,
    currentNodeId: chapter.startNodeId,
    history: [chapter.startNodeId],
    answered: {},
    ended: chapter.nodes[chapter.startNodeId]?.type === "ending",
  };
}

export function currentNode(state: AdventureState, chapter: AdventureChapter): AdventureNode {
  const node = chapter.nodes[state.currentNodeId];
  if (!node) throw new Error(`節點 ${state.currentNodeId} 不存在`);
  return node;
}

export function advanceAdventure(state: AdventureState, chapter: AdventureChapter, input: AdventureInput): AdventureState {
  if (state.ended) return state;
  const node = currentNode(state, chapter);
  let nextId: string | null = null;
  const answered = { ...state.answered };

  if (node.type === "choice" || node.type === "narrative") {
    if (input.kind === "choice" && node.choices?.[input.choiceIndex]) {
      nextId = node.choices[input.choiceIndex].nextNodeId;
    } else if (input.kind === "continue" && node.choices?.[0]) {
      nextId = node.choices[0].nextNodeId;
    }
  } else if (node.type === "check" && node.check && input.kind === "answer") {
    answered[node.id] = input.correct;
    nextId = input.correct ? node.check.nextCorrectId : node.check.nextWrongId;
  }

  if (!nextId) throw new Error("無法根據當前輸入推進冒險");
  const nextNode = chapter.nodes[nextId];
  if (!nextNode) throw new Error(`目標節點 ${nextId} 不存在`);
  return {
    ...state,
    currentNodeId: nextId,
    history: [...state.history, nextId],
    answered,
    ended: nextNode.type === "ending",
  };
}

export function settleAdventureEnding(state: AdventureState, chapter: AdventureChapter): AdventureEndingReward {
  const node = currentNode(state, chapter);
  if (node.type !== "ending") throw new Error("當前節點非結局");
  return {
    gold: node.reward?.gold ?? 0,
    card: node.reward?.card ?? false,
    title: node.reward?.title ?? null,
  };
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/game/adventureEngine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/game/adventureEngine.ts client/src/game/adventureEngine.test.ts
git commit -m "feat(tavern): 冒險狀態機（節點推進/答題分支/結局獎勵）"
```

---

### Task 6: 酒館大廳頁面 Tavern.tsx

**Files:**
- Create: `client/src/pages/Tavern.tsx`
- Create: `client/src/pages/Tavern.css`
- Create: `client/src/components/TavernCompanion.tsx`

- [ ] **Step 1: 實作夥伴小屋元件**

```tsx
import { useMemo } from "react";
import { loadRpgState } from "@/game/rpgStorage";
import { affectionLevel } from "@/game/companionGrowth";

export function TavernCompanion() {
  const state = useMemo(() => loadRpgState(), []);
  const companions = state.companions ?? [];
  if (companions.length === 0) {
    return <div className="tavern-empty">還沒有夥伴，去答題戰鬥招募第一位冒險夥伴吧！</div>;
  }
  return (
    <div className="tavern-companion-list">
      {companions.map((c) => (
        <div key={c.id} className="tavern-companion-card">
          <div className="tavern-companion-avatar">{c.emoji ?? "🐾"}</div>
          <strong>{c.name}</strong>
          <small>{c.epithet}</small>
          <span>親密度 Lv.{affectionLevel(c.affection ?? 0)}</span>
          <span>性格：{c.personality ?? "觀察家"}</span>
        </div>
      ))}
    </div>
  );
}
```

> 注意：`Companion` 型別無 `emoji` 欄位，用 `c.name` 第一字或預設 emoji。請確認 `rpgTypes.ts` 的 Companion 是否有 emoji；若無，改為 `c.name` 或對應外觀欄位。

- [ ] **Step 2: 實作酒館大廳頁面**

```tsx
import { BookHeart, Cards, ScrollText, Medal, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { getPlayerData } from "@/utils/storage";
import { TavernCompanion } from "@/components/TavernCompanion";
import "./Tavern.css";

type TavernEntry = { id: string; label: string; description: string; href: string; icon: LucideIcon };

const TAVERN_ENTRIES: TavernEntry[] = [
  { id: "cards", label: "潮汐牌局", description: "Top Trumps 比數值卡牌對戰", href: "/tavern/cards", icon: Cards },
  { id: "adventure", label: "文字冒險", description: "從酒館出發，闖蕩敘事章節", href: "/tavern/adventure", icon: ScrollText },
  { id: "companions", label: "夥伴小屋", description: "檢視你的冒險夥伴", href: "#companions", icon: BookHeart },
  { id: "titles", label: "稱號牆", description: "酒館收集的限定稱號", href: "/badges", icon: Medal },
];

export default function Tavern() {
  const [, setLocation] = useLocation();
  const player = getPlayerData();
  return (
    <main className="tavern-page">
      <header className="tavern-hero">
        <h1>🏮 燈塔酒館</h1>
        <p>學完了就進來歇腳，玩玩卡牌、聽聽故事、看看老夥伴。</p>
        <p className="tavern-gold">💰 金幣：{player.gold}</p>
      </header>
      <section className="tavern-entries">
        {TAVERN_ENTRIES.map((entry) => {
          const Icon = entry.icon;
          return (
            <button key={entry.id} className="tavern-entry" onClick={() => setLocation(entry.href)}>
              <Icon size={28} />
              <strong>{entry.label}</strong>
              <span>{entry.description}</span>
            </button>
          );
        })}
      </section>
      <section id="companions" className="tavern-companions">
        <h2>🐾 夥伴小屋</h2>
        <TavernCompanion />
      </section>
    </main>
  );
}
```

- [ ] **Step 3: 撰寫 Tavern 最小測試（入口存在）**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "wouter/memory-location";
import Tavern from "./Tavern";

describe("Tavern page", () => {
  it("顯示酒館標題與主要入口", () => {
    render(<MemoryRouter><Tavern /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /燈塔酒館/ })).toBeTruthy();
    expect(screen.getByText(/潮汐牌局/)).toBeTruthy();
    expect(screen.getByText(/文字冒險/)).toBeTruthy();
  });
});
```

> 若 `wouter/memory-location` 不可用，改用現有測試的 router 寫法（參考 `Home.tsx` 或 `Badges.tsx` 的測試）。

- [ ] **Step 4: 撰寫 Tavern.css 最小樣式**

```css
.tavern-page { max-width: 720px; margin: 0 auto; padding: 24px 16px; }
.tavern-hero h1 { font-family: Fraunces, serif; font-size: clamp(26px, 4vw, 36px); }
.tavern-gold { font-weight: 700; }
.tavern-entries { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; }
.tavern-entry { display: flex; flex-direction: column; gap: 6px; padding: 16px; border-radius: 14px; border: 1px solid rgba(0,0,0,.08); background: #fff; text-align: left; cursor: pointer; }
.tavern-entry:hover { transform: translateY(-2px); transition: transform .15s; }
.tavern-companion-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.tavern-companion-card { display: flex; flex-direction: column; gap: 4px; padding: 12px; border-radius: 12px; background: #f7f9fb; }
.tavern-companion-avatar { font-size: 36px; }
.tavern-empty { color: var(--muted, #666); padding: 24px; text-align: center; }
```

- [ ] **Step 5: 執行頁面測試**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/pages/Tavern.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Tavern.tsx client/src/pages/Tavern.css client/src/pages/Tavern.test.tsx client/src/components/TavernCompanion.tsx
git commit -m "feat(tavern): 酒館大廳 hub 與夥伴小屋展示"
```

---

### Task 7: 卡牌對戰面板 TrumpDuelBoard

**Files:**
- Create: `client/src/components/TrumpDuelBoard.tsx`

- [ ] **Step 1: 實作對戰面板**

> 此元件整合 `trumpDuel` 狀態機與 `useQuestionBank`。流程：開始 → 玩家選屬性（或 AI 選）→ 抽題作答 → 結算 → 顯示結果 → 繼續或結束。

```tsx
import { useMemo, useState } from "react";
import { useQuestionBank } from "@/lib/questionBank";
import { ALL_CARDS, getCardById, STAT_LABELS, type CardStat } from "@/game/trumpCardData";
import { aiAnswerCorrect, aiChooseStat, applyTrumpAnswer, beginTrumpDuel, buildDeckFromCollection, chooseTrumpStat, settleTrumpRound, type AnswerChoice, type TrumpState } from "@/game/trumpDuel";
import { getCardCollection, maybeDropUnownedCard, recordCardDuelResult } from "@/game/cardCollection";
import { getPlayerData, updatePlayerData } from "@/utils/storage";
import { toast } from "sonner";

const HAND_SIZE = 8;

export default function TrumpDuelBoard() {
  const { questions } = useQuestionBank();
  const [state, setState] = useState<TrumpState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{ prompt: string; options: string[]; answer: number; subject: string } | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  function start() {
    const owned = getCardCollection().ownedCardIds;
    const playerDeck = buildDeckFromCollection(owned, ALL_CARDS, HAND_SIZE);
    const aiDeck = buildDeckFromCollection(ALL_CARDS.map((c) => c.id), ALL_CARDS, HAND_SIZE);
    if (playerDeck.length < 3) {
      toast.warning("收藏的卡牌不足，先去卡包抽幾張吧！");
      return;
    }
    setState(beginTrumpDuel(playerDeck, aiDeck));
    setLastResult(null);
  }

  function chooseStat(stat: CardStat) {
    if (!state) return;
    setState(chooseTrumpStat(state, stat));
    const subject = state.turnLeader === "player" ? state.playerDeck[0]?.theme : state.aiDeck[0]?.theme;
    const pool = questions.filter((q) => q.subject === subject);
    const q = pool[Math.floor(Math.random() * pool.length)];
    if (q) setCurrentQuestion({ prompt: q.prompt, options: q.options, answer: q.answer, subject: q.subject });
  }

  function answer(correct: boolean, choice: AnswerChoice) {
    if (!state) return;
    setState(applyTrumpAnswer(state, correct, choice));
  }

  function reveal() {
    if (!state) return;
    const next = settleTrumpRound(state);
    setState(next);
    setCurrentQuestion(null);
    if (next.result !== "active") {
      recordCardDuelResult(next.result);
      if (next.result === "victory") {
        updatePlayerData({ gold: getPlayerData().gold + 15 });
        const dropped = maybeDropUnownedCard();
        toast.success(dropped ? `獲勝！獲得 15 金幣與新卡「${dropped.name}」` : "獲勝！獲得 15 金幣");
      } else if (next.result === "draw") {
        toast.message("平手，不分軒輊。");
      } else {
        toast.message("落敗了，再試一次！");
      }
    }
  }

  function aiAutoPlay(next: TrumpState): TrumpState {
    // 若輪到 AI 主動，自動選屬性（這裡簡化：玩家點「繼續」觸發）
    return next;
  }

  if (!state) {
    return (
      <div className="trump-start">
        <h2>潮汐牌局</h2>
        <p>選屬性比大小，答對獲得情報或強化。贏走對方的卡！</p>
        <button onClick={start}>開始對戰</button>
      </div>
    );
  }

  const top = state.turnLeader === "player" ? state.playerDeck[0] : state.aiDeck[0];
  const playerTop = state.playerDeck[0];
  const aiTop = state.aiDeck[0];

  return (
    <div className="trump-board">
      <div className="trump-hud">
        <span>回合 {state.round} / 40</span>
        <span>我方 {state.playerDeck.length} 張 | 對手 {state.aiDeck.length} 張</span>
        {state.pot.length > 0 && <span>公共池 {state.pot.length} 張</span>}
        <span>主動：{state.turnLeader === "player" ? "你" : "對手"}</span>
      </div>

      {state.phase === "choose-stat" && top && (
        <div className="trump-choose">
          <p>{state.turnLeader === "player" ? "你來選屬性" : "對手選屬性中…"}</p>
          {playerTop && (
            <div className="trump-card-preview">
              <strong>{playerTop.name}</strong>
              {(Object.keys(STAT_LABELS) as CardStat[]).map((stat) => (
                <button key={stat} onClick={() => chooseStat(stat)} disabled={state.turnLeader !== "player"}>
                  {STAT_LABELS[stat]}：{playerTop.stats[stat]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {state.phase === "answer" && currentQuestion && (
        <div className="trump-answer">
          <p>{currentQuestion.prompt}</p>
          <div className="trump-options">
            {currentQuestion.options.map((opt, i) => (
              <button key={i} onClick={() => answer(i === currentQuestion.answer, "boost")}>{opt}</button>
            ))}
          </div>
          <div className="trump-answer-choices">
            <button onClick={() => answer(true, "peek")}>答對：偷看對手牌</button>
            <button onClick={() => answer(true, "boost")}>答對：屬性 +2</button>
          </div>
        </div>
      )}

      {state.phase === "reveal" && (
        <div className="trump-reveal">
          <p>我方：{playerTop?.name}（{state.pendingStat ? playerTop?.stats[state.pendingStat] : "?"}{state.pendingBoost ? " +2" : ""}）</p>
          <p>對手：{aiTop?.name}（{state.pendingStat ? aiTop?.stats[state.pendingStat] : "?"}）</p>
          <button onClick={reveal}>揭曉</button>
        </div>
      )}

      {state.phase === "finished" && (
        <div className="trump-finished">
          <h3>{state.result === "victory" ? "🏆 勝利！" : state.result === "defeat" ? "💔 落敗" : "🤝 平手"}</h3>
          <button onClick={start}>再戰一局</button>
        </div>
      )}

      {lastResult && <p className="trump-last">{lastResult}</p>}
    </div>
  );
}
```

> 注意：AI 主動回合的自動選牌與抽題，請在元件中以 `useEffect` 處理（當 `turnLeader === "ai"` 且 `phase === "choose-stat"` 時，呼叫 `aiChooseStat` 並自動推進）。上述程式碼為骨架，實作時補上 AI 自動流程，確保輪到 AI 時不需玩家操作。

- [ ] **Step 2: 撰寫最小渲染測試**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import TrumpDuelBoard from "./TrumpDuelBoard";

describe("TrumpDuelBoard", () => {
  it("顯示開始對戰按鈕", () => {
    render(<TrumpDuelBoard />);
    expect(screen.getByRole("button", { name: /開始對戰/ })).toBeTruthy();
  });
});
```

- [ ] **Step 3: 執行測試**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/components/TrumpDuelBoard.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add client/src/components/TrumpDuelBoard.tsx client/src/components/TrumpDuelBoard.test.tsx
git commit -m "feat(tavern): 卡牌對戰面板（選屬性/答題/結算/獎勵）"
```

---

### Task 8: 文字冒險面板 AdventureViewer

**Files:**
- Create: `client/src/components/AdventureViewer.tsx`

- [ ] **Step 1: 實作冒險面板**

```tsx
import { useMemo, useState } from "react";
import { useQuestionBank } from "@/lib/questionBank";
import { ALL_CHAPTERS, getChapterById, type AdventureChapter } from "@/game/adventureChapters";
import { advanceAdventure, beginAdventure, currentNode, settleAdventureEnding, type AdventureState } from "@/game/adventureEngine";
import { getPlayerData, unlockLimitedTitle, updatePlayerData } from "@/utils/storage";
import { addCardToCollection } from "@/game/cardCollection";
import { getRandomUnownedCard } from "@/game/trumpCardData";
import { toast } from "sonner";

export default function AdventureViewer() {
  const { questions } = useQuestionBank();
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [state, setState] = useState<AdventureState | null>(null);
  const [checkQuestion, setCheckQuestion] = useState<{ prompt: string; options: string[]; answer: number } | null>(null);

  const chapter = useMemo(() => (chapterId ? getChapterById(chapterId) : null), [chapterId]);

  function startChapter(ch: AdventureChapter) {
    if (ch.cost > 0) {
      const player = getPlayerData();
      if (player.gold < ch.cost) { toast.warning("金幣不足"); return; }
      updatePlayerData({ gold: player.gold - ch.cost });
    }
    setChapterId(ch.id);
    setState(beginAdventure(ch));
    setCheckQuestion(null);
  }

  function handleChoice(index: number) {
    if (!state || !chapter) return;
    setState(advanceAdventure(state, chapter, { kind: "choice", choiceIndex: index }));
  }

  function handleAnswer(correct: boolean) {
    if (!state || !chapter) return;
    setState(advanceAdventure(state, chapter, { kind: "answer", correct }));
    setCheckQuestion(null);
  }

  function handleCheck() {
    if (!state || !chapter) return;
    const node = currentNode(state, chapter);
    if (node.type !== "check" || !node.check) return;
    const pool = questions.filter((q) => q.subject === node.check!.subject);
    const q = pool[Math.floor(Math.random() * pool.length)];
    if (q) setCheckQuestion({ prompt: q.prompt, options: q.options, answer: q.answer });
  }

  function handleEnding() {
    if (!state || !chapter) return;
    const reward = settleAdventureEnding(state, chapter);
    if (reward.gold > 0) updatePlayerData({ gold: getPlayerData().gold + reward.gold });
    if (reward.card) {
      const dropped = getRandomUnownedCard(getCardCollection().ownedCardIds);
      if (dropped) addCardToCollection(dropped.id);
    }
    if (reward.title) unlockLimitedTitle(reward.title);
    toast.success(reward.title ? `冒險結束！獲得 ${reward.gold} 金幣與稱號「${reward.title}」` : `冒險結束！獲得 ${reward.gold} 金幣`);
    setState(null);
    setChapterId(null);
  }

  if (!chapter || !state) {
    return (
      <div className="adventure-chapters">
        <h2>文字冒險</h2>
        <div className="adventure-chapter-list">
          {ALL_CHAPTERS.map((ch) => (
            <button key={ch.id} className="adventure-chapter" onClick={() => startChapter(ch)}>
              <span className="adventure-icon">{ch.icon}</span>
              <strong>{ch.title}</strong>
              <small>{ch.summary}</small>
              <span>{ch.cost === 0 ? "免費" : `${ch.cost} 金幣`}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const node = currentNode(state, chapter);

  return (
    <div className="adventure-viewer">
      <h3>{chapter.title}</h3>
      <div className="adventure-text">{node.text}</div>

      {node.type === "check" && !checkQuestion && (
        <button onClick={handleCheck}>接受考驗</button>
      )}
      {node.type === "check" && checkQuestion && (
        <div className="adventure-check">
          <p>{checkQuestion.prompt}</p>
          {checkQuestion.options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(i === checkQuestion.answer)}>{opt}</button>
          ))}
        </div>
      )}

      {(node.type === "narrative" || node.type === "choice") && node.choices?.map((choice, i) => (
        <button key={i} onClick={() => handleChoice(i)}>{choice.label}</button>
      ))}

      {node.type === "ending" && (
        <div className="adventure-ending">
          <p>結局：{node.ending === "good" ? "美滿" : node.ending === "bad" ? "遺憾" : "平淡"}</p>
          <button onClick={handleEnding}>領取獎勵</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 撰寫最小測試**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AdventureViewer from "./AdventureViewer";

describe("AdventureViewer", () => {
  it("顯示冒險章節列表", () => {
    render(<AdventureViewer />);
    expect(screen.getByText(/燈塔的呼喚/)).toBeTruthy();
    expect(screen.getByText(/失落的古籍/)).toBeTruthy();
  });
});
```

- [ ] **Step 3: 執行測試**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/components/AdventureViewer.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AdventureViewer.tsx client/src/components/AdventureViewer.test.tsx
git commit -m "feat(tavern): 文字冒險面板（章節選擇/答題檢定/結局獎勵）"
```

---

### Task 9: 路由、首頁入口、搜尋整合

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/pages/Home.tsx`
- Modify: `client/src/lib/featureSearch.ts`

- [ ] **Step 1: App.tsx 新增路由**

在 lazy import 區塊加入：
```ts
const Tavern = React.lazy(() => import("@/pages/Tavern"));
const TrumpDuelBoard = React.lazy(() => import("@/components/TrumpDuelBoard"));
const AdventureViewer = React.lazy(() => import("@/components/AdventureViewer"));
```
在 `<Switch>` 內加入（置於 `/404` 之前）：
```tsx
<Route path={"/tavern"} component={Tavern} />
<Route path={"/tavern/cards"} component={() => <TrumpDuelBoard />} />
<Route path={"/tavern/adventure"} component={() => <AdventureViewer />} />
```

- [ ] **Step 2: Home.tsx 新增酒館入口、移除知識決鬥卡**

在 `HOME_FEATURE_GROUPS` 的「探險與對戰」組：
- 移除 `{ id: "knowledge-duel", ... }` 那行
- 新增酒館入口（使用現有 icon，如 `Beer` 或 `Home`）：
```ts
{ id: "tavern", label: "燈塔酒館", description: "學完進來玩：卡牌、冒險、夥伴", href: "/tavern", icon: Home },
```
> 若 `Home` icon 與頁面組件衝突，改用 `Beer`（需確認 lucide 有匯出）或 `Tent`。

- [ ] **Step 3: featureSearch.ts 新增酒館項目、移除知識決鬥**

找到知識決鬥項目，改為：
```ts
{ id: "tavern", label: "燈塔酒館／卡牌／冒險", href: "/tavern", keywords: ["酒館", "卡牌", "潮汐牌局", "文字冒險", "夥伴", "Top Trumps"] },
```

- [ ] **Step 4: 更新 App.routes.test.ts**

`App.routes.test.ts` 目前斷言 `/knowledge-duel` 存在。改為斷言 `/tavern` 存在：
```ts
expect(appSource).toContain('path={"/tavern"}');
```
（保留 `/knowledge-duel` 相容路由可繼續存在，但測試改為驗證酒館路由）

- [ ] **Step 5: Commit**

```bash
git add client/src/App.tsx client/src/pages/Home.tsx client/src/lib/featureSearch.ts client/src/App.routes.test.ts
git commit -m "feat(tavern): 新增酒館路由、首頁入口與搜尋，收編知識決鬥"
```

---

### Task 10: 稱號目錄新增

**Files:**
- Modify: `client/src/game/titleCatalog.ts`

- [ ] **Step 1: 新增卡牌與冒險稱號**

在 `TITLE_CATALOG` 陣列中加入以下稱號（category 用「簽到成長」或新增；維持現有三個 category，卡牌/冒險稱號歸類到「稀有遠征」不合適，請觀察 `TitleCategory` 型別）。

> 現有 `TitleCategory = "簽到成長" | "連擊挑戰" | "稀有遠征"`。卡牌與冒險稱號應新增 category。請先修改型別：

```ts
export type TitleCategory = "簽到成長" | "連擊挑戰" | "稀有遠征" | "潮汐牌局" | "文字冒險";
```

然後加入稱號：
```ts
{
  id: "牌局好手",
  displayTitle: "牌局好手",
  category: "潮汐牌局",
  condition: "在潮汐牌局累計獲勝 10 場",
  hint: { label: "去潮汐牌局", href: "/tavern/cards" },
},
{
  id: "潮汐牌王",
  displayTitle: "潮汐牌王",
  category: "潮汐牌局",
  condition: "在潮汐牌局累計獲勝 50 場",
  hint: { label: "去潮汐牌局", href: "/tavern/cards" },
},
{
  id: "燈塔嚮導",
  displayTitle: "燈塔嚮導",
  category: "文字冒險",
  condition: "完成冒險《燈塔的呼喚》的美滿結局",
  hint: { label: "去文字冒險", href: "/tavern/adventure" },
},
{
  id: "古籍尋跡者",
  displayTitle: "古籍尋跡者",
  category: "文字冒險",
  condition: "完成冒險《失落的古籍》的美滿結局",
  hint: { label: "去文字冒險", href: "/tavern/adventure" },
},
```

- [ ] **Step 2: 更新 titleCatalog.test.ts 的數量斷言**

測試中 `expect(TITLE_CATALOG.length).toBe(17)` 改為 `21`，並確認 `稀有遠征` 仍為 15。

- [ ] **Step 3: 執行 titleCatalog 測試**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run client/src/game/titleCatalog.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add client/src/game/titleCatalog.ts client/src/game/titleCatalog.test.ts
git commit -m "feat(tavern): 新增卡牌與冒險限定稱號"
```

---

### Task 11: 全量驗證與部署

**Files:** 無新增，執行驗證

- [ ] **Step 1: tsc 型別檢查**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/typescript/bin/tsc --noEmit`
Expected: 無錯誤輸出

- [ ] **Step 2: 全測試**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vitest/vitest.mjs run`
Expected: 全部通過

- [ ] **Step 3: build**

Run: `ELECTRON_RUN_AS_NODE=1 "/Users/g/.cache/trae-node/Trae CN.app/Contents/MacOS/Electron" node_modules/vite/bin/vite.js build`
Expected: build 成功，產出 dist

- [ ] **Step 4: 提交並推送部署**

```bash
git push origin main
```

- [ ] **Step 5: 線上驗證**

等待 Render 部署後，curl 確認 `/tavern` 頁面 bundle 含卡牌與冒險關鍵字（如「潮汐牌局」「文字冒險」）。

---

## 注意事項

1. **同一檔案不可平行 Edit**：每個 Task 內若需多次修改同檔案，必須循序執行。
2. **AI 自動回合**：TrumpDuelBoard 中輪到 AI 主動時，需用 `useEffect` 自動推進（選屬性→抽題→AI 答題→結算），避免玩家卡住。
3. **題目不足**：若某學科題庫為空，`check` 階段需有 fallback（跳過檢定直接走正確分支或顯示提示）。
4. **金幣安全**：所有金幣加減都透過 `updatePlayerData`，勿直接改 localStorage。
5. **相容路由**：`/knowledge-duel` 與 `/duel` 路由可保留指向 KnowledgeDuel，但從 Home 與搜尋移除入口。
