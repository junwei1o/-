# 潮汐牌局（Tide Cards）設計稿

> 單人卡牌對戰（vs AI），結合答題加成與現有金幣/稱號/商店系統。
> 日期：2026-09-10 ｜ 狀態：待實作

## 1. 目標與定位

為網站新增一個輕策略的單人卡牌對戰遊戲。核心精神是「玩卡牌也在學習」：每回合出牌後接一道學科題，答對給該回合戰力加成。全部在前端完成（單人 vs AI），不需要後端或即時同步。

**設計決策（已與使用者確認）**

| 面向 | 定案 | 說明 |
|------|------|------|
| 玩法核心 | 答題定勝負加成 | 每回合比大小，答對給加成 |
| 回合結構 | 固定 5 回合 | 贏較多回合者勝，節奏快 |
| 卡牌維度 | 戰力值 + 稀有度 | 輕策略，主題美術撐收集感 |
| 收集循環 | 雙軌並行 | 初始牌組 + 贏對戰得卡 + 金幣買卡包 + 稱號串聯 |
| 答對加成 | 戰力 ×1.5 | UI 顯示「+50%」；答錯無加成（不扣分） |
| 收集系列 | 四大學科 | 國語 / 數學 / 社會 / 自然 |

## 2. 核心循環

1. 進入 `/cards` 主頁，檢視收藏、組牌、選 AI 對手
2. 帶著牌組進場，進行固定 5 回合比大小
3. 每回合：選牌 → 答題（科目由出牌主題決定）→ AI 出牌 → 比戰力定勝負
4. 5 回合結束結算，贏家領獎勵（金幣 + 機率掉新卡）
5. 用金幣買卡包擴充收藏；集滿系列或達勝場里程碑解鎖限定稱號

## 3. 資料結構

### 3.1 卡牌目錄（靜態資料）
```ts
import type { Rarity } from "./rpgTypes"; // common | rare | legendary

export type CardTheme = "國語" | "數學" | "社會" | "自然";

export type CardDef = {
  id: string;            // 唯一 id，如 "math-01"
  name: string;          // 主題名，如「黑面琵鷺」「圓周率」「鄭成功艦隊」
  power: number;         // 戰力 1–10
  rarity: Rarity;
  theme: CardTheme;      // 決定該卡收集系列，也決定出牌時答題科目
  flavor: string;        // 一句知識/故事
  emoji: string;         // MVP 以 emoji + 稀有度配色呈現，不生成點陣圖
};
```
- 主題採四大學科，與題庫科目一致，便於「出牌科目 → 答題科目」連動
- 稀有度分布：普通為主、稀有次之、傳說少量；戰力普通 1–6、稀有 5–8、傳說 7–10
- MVP 視覺用 emoji + 稀有度邊框；點陣圖生成（text_to_image API）列為後續可選，不在首版範圍

### 3.2 對局狀態機（純邏輯）
```ts
export type DuelPhase = "pick" | "answer" | "reveal" | "finished";
export type DuelResult = "active" | "victory" | "defeat" | "draw";

export type RoundOutcome = {
  round: number;
  playerCard: CardDef;
  aiCard: CardDef;
  answeredCorrectly: boolean;
  playerPower: number;   // 含加成
  aiPower: number;
  winner: "player" | "ai" | "draw";
};

export type DuelState = {
  round: number;          // 1–5
  playerWins: number;
  aiWins: number;
  draws: number;
  playerHand: CardDef[];  // 本局可用手牌
  aiDeck: CardDef[];      // AI 出牌佇列
  phase: DuelPhase;
  history: RoundOutcome[];
  result: DuelResult;
};
```

### 3.3 收藏進度（localStorage）
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
- 遵循現有 localStorage 存取慣例（`readStoredJson`/`writeStoredJson` 風格）

## 4. 對戰規則

### 4.1 單回合流程
1. **pick**：玩家從手牌選一張牌
2. **answer**：依該卡 `theme` 抽一道對應學科題（複用 `useQuestionBank`）
   - 答對 → 該回合玩家戰力 = `round(power × 1.5)`，UI 標示「+50%」
   - 答錯 → 戰力維持 `power`，無加成也不扣分
3. AI 依策略出牌
4. **reveal**：比較雙方戰力，高者贏該回合（平手各記一次 draw）
5. 進入下一回合，重複至第 5 回合

### 4.2 勝負判定
- 5 回合結束，`playerWins > aiWins` → victory；反之 defeat
- 回合勝場相同 → 比 5 回合總戰力（含加成），高者勝；再平手 → draw

### 4.3 AI 策略（MVP 普通難度）
- 貪心 + 隨機：前半場出中低牌保留強牌，落後時提高出強牌機率
- 預留 `difficulty: "easy" | "normal" | "hard"` 參數，首版僅實作 `normal`，其餘列入後續

## 5. 獎勵與系統串接（全部複用現有機制）

| 觸發 | 動作 | 複用 |
|------|------|------|
| 贏一場對戰 | +金幣（建議 15）＋ 40% 機率掉一張未擁有卡（稀有度加權） | `updatePlayerData` |
| 購買卡包 | 商店新增「知識卡包」商品，金幣購買隨機抽 3 張 | `dailyCamp` 商店模式 |
| 集滿單一學科全系列 | 解鎖限定稱號（四科各一） | `unlockLimitedTitle` |
| 勝場里程碑（10 / 50 勝） | 解鎖稱號「牌局好手」「潮汐牌王」 | `unlockLimitedTitle` |

## 6. 檔案結構

```
client/src/game/cardData.ts         卡牌目錄（主題/稀有度/戰力/emoji）
client/src/game/cardDuel.ts         對局狀態機 + AI + 計分（純函數，重點單測）
client/src/game/cardCollection.ts   收藏進度存取（localStorage）
client/src/pages/CardArena.tsx      主頁：收藏 / 組牌 / 開戰 / 卡包
client/src/pages/CardArena.css      主頁樣式
client/src/components/CardDuelBoard.tsx  對戰面板（5 回合流程 + 答題）
```
- `App.tsx` 新增路由 `/cards`
- 導航入口加入主選單（依現有 TopNavigation/featureSearch 慣例）

## 7. 測試策略

- `cardDuel.test.ts`（核心）：回合勝負、×1.5 加成計算（含四捨五入）、AI 選牌行為、5 回合勝負與總戰力平手判定、draw 情境
- `cardCollection.test.ts`：進度存取、勝場累計、卡包開啟計數
- `cardData.test.ts`：稀有度分布、戰力範圍、四主題皆有足量卡牌、id 唯一
- 頁面層以 testing-library 驗證關鍵流程（選牌→答題→揭曉）

## 8. 範圍界線（YAGNI）

**首版包含**：5 回合比大小對戰、答題 ×1.5 加成、單一 AI 難度、金幣/卡包/稱號串接、emoji 卡牌視覺。

**首版不做**（列為後續）：多人連線、easy/hard AI 難度、卡牌特殊技能、點陣圖卡面生成、卡牌交易/分解。
