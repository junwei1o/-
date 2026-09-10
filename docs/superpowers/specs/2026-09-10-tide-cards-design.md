# 潮汐牌局（Tide Cards）— 頂級王牌版設計稿

> 單人卡牌對戰（vs AI），採 Top Trumps「比數值、贏走對方的卡」玩法，結合答題加成與現有金幣/稱號/商店系統。
> 日期：2026-09-10 ｜ 狀態：待實作

## 0. 定位：與現有系統的差異

網站已有三種對戰體驗，本遊戲刻意錯開，避免自我重複：

| 現有系統 | 玩法 | 與本作的關係 |
|----------|------|--------------|
| `BattleScene` | RPG 答題戰鬥（HP/技能/怒氣/連擊） | 不同：本作無 HP、靠卡牌數值 |
| `knowledgeDuel` 知識決鬥 | HP 制 + 角色職業 + 策略卡 | 不同：本作是**收集 + 比數值**，非 HP 對戰 |
| `GuardianExpedition` | 遠征怪物答題 | 不同：本作是可收集卡牌 |

本作的獨特價值：**卡牌本身承載學科知識**（每張卡多屬性）、**收集驅動**（贏走對方的卡）、**規則極簡**（選屬性比大小，國小孩童秒懂）。全部在前端完成（單人 vs AI），不需要後端或即時同步。

**設計決策（已與使用者確認）**

| 面向 | 定案 | 說明 |
|------|------|------|
| 玩法核心 | Top Trumps 比數值 | 選屬性比大小，贏走對方的卡 |
| 卡牌維度 | 多屬性 + 稀有度 | 四個屬性承載學科知識 |
| 收集系列 | 四大學科 | 國語 / 數學 / 社會 / 自然 |
| 答題加成 | 情報 或 屬性加成 | 答對二選一（見 §4.2） |
| 收集循環 | 雙軌並行 | 初始牌組 + 贏對戰得卡 + 金幣買卡包 + 稱號串聯 |

## 1. 核心規則（Top Trumps 標準玩法）

1. 雙方各持一疊牌（牌堆），從各自收藏中各抽 **8 張**作為本局牌堆，頂牌朝上
2. 每回合由**主動方**（首回合隨機）看自己的頂牌，**選擇一個屬性**
3. 雙方比較頂牌的該屬性數值，**高者贏走對方的頂牌**，兩張牌放到自己牌堆底部，並**繼續當主動方**
4. **平手**：兩張頂牌進入「公共池」，同一主動方再選屬性比下一張，贏家**全拿公共池 + 本回合兩張**
5. 一方**牌堆清空** → 對方獲勝

**防拖長**：最多 40 回合；達上限時比雙方牌堆剩餘牌數，多者獲勝，相同則為 draw（公共池中的牌不計入）。

## 2. 卡牌資料結構

```ts
import type { Rarity } from "./rpgTypes"; // common | rare | legendary

export type CardTheme = "國語" | "數學" | "社會" | "自然";

export type CardStat = "power" | "wisdom" | "speed" | "charm";
export const STAT_LABELS: Record<CardStat, string> = {
  power: "威力", wisdom: "知識", speed: "速度", charm: "稀有",
};

export type CardDef = {
  id: string;                 // 唯一 id，如 "math-01"
  name: string;               // 主題名，如「黑面琵鷺」「圓周率」「鄭成功艦隊」
  theme: CardTheme;           // 收集系列；也決定答題科目
  rarity: Rarity;
  stats: Record<CardStat, number>; // 四屬性各 1–10
  emoji: string;              // MVP 視覺以 emoji + 稀有度配色呈現
  flavor: string;             // 一句知識/故事
};
```
- 稀有度影響屬性總量：普通總和較低且偏重單一強項、傳說四維均衡且高
- MVP 用 emoji + 稀有度邊框配色；點陣圖卡面（text_to_image API）列為後續可選，不在首版

## 3. 對局狀態機（純邏輯）

```ts
export type TrumpPhase = "choose-stat" | "answer" | "reveal" | "finished";
export type TrumpResult = "active" | "victory" | "defeat" | "draw";

export type TrumpState = {
  playerDeck: CardDef[];   // 牌堆；頂牌為索引 0
  aiDeck: CardDef[];
  pot: CardDef[];          // 平手公共池
  turnLeader: "player" | "ai"; // 本回合主動方
  round: number;
  phase: TrumpPhase;
  pendingStat: CardStat | null; // 主動方本回合選的屬性
  peekRevealed: boolean;   // 玩家是否用了「偷看」
  result: TrumpResult;
};
```
- 頂牌：`deck[0]`；贏牌 → 雙方頂牌移到贏家牌堆底；平手 → 雙方頂牌入 pot
- 所有數值操作為純函數，便於單元測試

## 4. 對戰流程與答題加成

### 4.1 單回合流程
1. **choose-stat**：主動方看頂牌並選一個屬性
2. **answer**：抽一道題（科目 = 主動方頂牌的 `theme`），答題後進入結算
3. **reveal**：依所選屬性比較雙方頂牌（含加成），判定贏家、移動卡牌、更新 pot 與主動方
4. 回到 choose-stat，直到一方牌堆清空或達回合上限

### 4.2 答題加成（玩家主動時）
主動方選完屬性後，可選擇作答一道題換取優勢：
- **答對 → 二選一**：
  - (a) **情報**：偷看對方頂牌的四個屬性（下回合選屬性更有把握）
  - (b) **強化**：本回合所選屬性 **+2**
- **答錯**：無加成（不扣分）
- 玩家也可選擇「不作答」直接比大小

### 4.3 AI 行為
- **主動選屬性**：取自己頂牌最強屬性（貪心），並加少量隨機避免死板
- **AI 答題**：依題目難度的固定機率答對（複用 `knowledgeDuel` 的 `aiWillAnswerCorrect` 概念），透明可預測
- 首版單一普通難度；預留 `difficulty` 參數，easy/hard 列入後續

## 5. 收藏進度與獎勵串接

### 5.1 收藏進度（localStorage）
```ts
export type CardCollection = {
  ownedCardIds: string[];
  wins: number;
  losses: number;
  draws: number;
  packsOpened: number;
  totalRounds: number;
};
```
- 儲存 key：`xue-card-collection-v1`
- 遵循現有 `readStoredJson`/`writeStoredJson` 存取慣例

### 5.2 獎勵與系統串接（全部複用現有機制）

| 觸發 | 動作 | 複用 |
|------|------|------|
| 贏一場對戰 | +金幣（建議 15）＋ 40% 機率掉一張未擁有卡（稀有度加權） | `updatePlayerData` |
| 購買卡包 | 商店新增「知識卡包」商品，金幣購買隨機抽 3 張 | `dailyCamp` 商店模式 |
| 集滿單一學科全系列 | 解鎖限定稱號（四科各一） | `unlockLimitedTitle` |
| 勝場里程碑（10 / 50 勝） | 解鎖稱號「牌局好手」「潮汐牌王」 | `unlockLimitedTitle` |

## 6. 檔案結構

```
client/src/game/trumpCardData.ts      卡牌目錄（四學科 / 稀有度 / 四屬性 / emoji）
client/src/game/trumpDuel.ts          對局狀態機 + AI + 比數值結算（純函數，重點單測）
client/src/game/cardCollection.ts     收藏進度存取（localStorage）
client/src/pages/CardArena.tsx        主頁：收藏 / 組牌 / 開戰 / 卡包
client/src/pages/CardArena.css        主頁樣式
client/src/components/TrumpDuelBoard.tsx  對戰面板（選屬性 → 答題 → 揭曉）
```
- `App.tsx` 新增路由 `/cards`
- 導航入口加入主選單（依現有 TopNavigation/featureSearch 慣例）

## 7. 測試策略

- `trumpDuel.test.ts`（核心）：比數值勝負、平手公共池累積與全拿、贏家續當主動方、牌堆清空勝負、40 回合上限與牌數判定、答對「情報/強化」二選一效果
- `cardCollection.test.ts`：進度存取、勝場累計、卡包開啟計數
- `trumpCardData.test.ts`：四主題皆有足量卡牌、id 唯一、屬性值落於 1–10、稀有度分布合理
- 頁面層以 testing-library 驗證關鍵流程（選屬性 → 答題 → 揭曉 → 贏牌）

## 8. 範圍界線（YAGNI）

**首版包含**：Top Trumps 比數值對戰（8 張牌堆、40 回合上限）、答題「情報/強化」加成、單一 AI 難度、金幣/卡包/稱號串接、emoji 卡牌視覺。

**首版不做**（列為後續）：多人連線、easy/hard AI 難度、卡牌特殊技能、點陣圖卡面生成、卡牌交易/分解。
