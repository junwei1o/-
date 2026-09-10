# 燈塔酒館（遊戲大廳）設計稿

> 將網站拆分為「學習區」與「酒館遊戲區」兩部分：學習答題是主線（酒館外），所有遊戲娛樂集中進酒館（學完去玩）。
> 日期：2026-09-10 ｜ 狀態：待實作（本稿主體為第一版 MVP）

## 0. 核心定位

**學習為主、遊戲為獎勵。** 平常在酒館外答題學習；時間充裕才進酒館玩遊戲放鬆。酒館不是取代學習，而是把分散的遊戲性功能收進一個有世界觀的「遊戲大廳」，讓網站主體專注答題，遊戲集中管理。

**已確認的方向**：把遊戲的部分全部放進酒館；網站主要負責學生答題；分離成兩部分。

## 1. 整站架構：兩大區

```
學習區（酒館外，網站主體）                酒館（遊戲大廳）
─────────────────────────              ─────────────────────────
・課綱練習 / 試卷 / 錯題複習              ・卡牌對戰（Top Trumps）
・學習洞察 / 學習報告                     ・夥伴（寵物）互動與養成
・主航海圖 / 答題戰鬥 / 守護者遠征   →    ・文字冒險（酒館敘事章節）〔階段二〕
・知識探索館（安全/天文/智慧/原理/影視）   ・說書（智慧故事）〔階段二〕
・每日營地 / 徽章牆 / 探險日誌            ・商店（卡包/道具）＋稱號牆
─────────────────────────              ─────────────────────────
              學習答題賺金幣 ──────────────→ 進酒館消費/玩遊戲
              酒館遊戲 ──────────────────→ 給稱號/獎勵回饋
```

**邊界劃分（已確認）**

| 功能 | 歸屬 | 理由 |
|------|:---:|------|
| 答題練習 / 試卷 / 錯題 | 學習區 | 純學習 |
| 答題戰鬥 BattleScene | 學習區 | 本質是答題，戰鬥是包裝 |
| 守護者遠征 GuardianExpedition | 學習區 | 本質是答題 + 收集 |
| 主航海圖 / 知識探索館 / 每日營地 / 徽章牆 | 學習區 | 學習導向 |
| 知識決鬥 KnowledgeDuel | 酒館 | 收進酒館、由新卡牌對戰取代 |
| 夥伴養成 | 酒館 | 寵物互動偏遊戲（答題數值仍由學習區累積） |

## 2. 兩區連結：金幣經濟

- **賺**：在學習區答題、遠征、每日營地賺取金幣（沿用現有 `getPlayerData`/`updatePlayerData`）
- **花**：進酒館買卡包、養夥伴、解鎖冒險章節
- **回饋**：酒館遊戲給限定稱號、徽章，回學習區展示
- 金幣為單一貨幣雙向流通，不另建貨幣

## 3. 分階段交付

| 階段 | 內容 | 狀態 |
|------|------|------|
| **階段一（MVP，本稿主體）** | 酒館大廳 hub + 卡牌對戰（Top Trumps）+ 知識決鬥收編 + 夥伴進駐展示 | 本稿詳述 |
| 階段二 | 文字冒險章節（答題檢定）+ 說書整合（智慧故事入酒館） | 路線圖 |
| 階段三 | 更多酒館遊戲、商店擴充、賽季活動 | 路線圖 |

> 以下 §4–§8 為階段一 MVP 的詳細設計；階段二、三僅列方向，屆時各自獨立設計。

## 4. 酒館大廳（階段一 hub）

溫馨的燈塔酒館場景作為遊戲入口，列出本版可玩內容：
- **卡牌對戰**：進入 Top Trumps 對戰（§5）
- **夥伴小屋**：檢視已收集的夥伴、親密度、養成數值（唯讀展示，養成操作仍在答題流程）
- **稱號牆**：展示酒館相關稱號（複用現有稱號系統）
- 視覺以 emoji + 現有卡片風格呈現；點陣圖場景列為後續可選

## 5. 卡牌對戰：Top Trumps（階段一核心遊戲）

採「比數值、贏走對方的卡」玩法，與學習區的 HP 答題戰鬥錯開。

### 5.1 卡牌資料
```ts
import type { Rarity } from "./rpgTypes";

export type CardTheme = "國語" | "數學" | "社會" | "自然";
export type CardStat = "power" | "wisdom" | "speed" | "charm";
export const STAT_LABELS: Record<CardStat, string> = {
  power: "威力", wisdom: "知識", speed: "速度", charm: "稀有",
};

export type CardDef = {
  id: string;                 // 如 "math-01"
  name: string;               // 主題名，如「黑面琵鷺」「圓周率」
  theme: CardTheme;           // 收集系列，也決定答題科目
  rarity: Rarity;
  stats: Record<CardStat, number>; // 四屬性各 1–10
  emoji: string;
  flavor: string;
};
```

### 5.2 規則
1. 雙方各從收藏抽 **8 張**作為牌堆，頂牌朝上
2. 每回合**主動方**（首回合隨機）看頂牌、**選一個屬性**
3. 比較雙方頂牌該屬性，**高者贏走對方頂牌**放到自己牌堆底，並**續當主動方**
4. **平手**：兩張頂牌進「公共池」，同一主動方再比下一張，贏家**全拿公共池**
5. 一方**牌堆清空**→ 對方獲勝；**最多 40 回合**，達上限比牌堆剩餘牌數，相同則 draw

### 5.3 答題加成（玩家主動時）
選完屬性後可選答一道題（科目 = 頂牌 `theme`）：
- **答對 → 二選一**：(a) 情報：偷看對方頂牌四屬性；(b) 強化：本回合所選屬性 **+2**
- **答錯**：無加成；也可選「不作答」直接比大小

### 5.4 AI
- 主動選屬性：取頂牌最強屬性 + 少量隨機
- 答題：依難度固定機率答對（複用 `knowledgeDuel` 的 `aiWillAnswerCorrect` 概念）
- 首版單一普通難度；預留 `difficulty` 參數

### 5.5 對局狀態機
```ts
export type TrumpPhase = "choose-stat" | "answer" | "reveal" | "finished";
export type TrumpResult = "active" | "victory" | "defeat" | "draw";
export type TrumpState = {
  playerDeck: CardDef[];   // 頂牌為索引 0
  aiDeck: CardDef[];
  pot: CardDef[];
  turnLeader: "player" | "ai";
  round: number;
  phase: TrumpPhase;
  pendingStat: CardStat | null;
  peekRevealed: boolean;
  result: TrumpResult;
};
```

## 6. 知識決鬥收編（階段一）

- 新卡牌對戰取代知識決鬥成為酒館的卡牌遊戲
- 路由：新增 `/tavern`（酒館）與 `/tavern/cards`（卡牌對戰）
- 現有 `/knowledge-duel`、`/duel` 保留一段時間作為相容，首版**從 Home 學習區入口移除**知識決鬥卡片，改在酒館進入新卡牌
- 歷史戰績（`KNOWLEDGE_DUEL_RECORDS_KEY`）保留不刪，避免破壞既有資料

## 7. 夥伴進駐酒館（階段一）

- 酒館「夥伴小屋」唯讀展示 `rpgState.companions`：名稱、親密度、性格、養成數值、外觀
- 養成操作（餵養/訓練）與數值累積仍在學習區答題流程，首版不在酒館新增養成操作
- 不做寵物新系統，僅做展示與世界觀整合

## 8. 收藏進度與獎勵

```ts
export type CardCollection = {
  ownedCardIds: string[];
  wins: number; losses: number; draws: number;
  packsOpened: number; totalRounds: number;
};
```
- 儲存 key：`xue-card-collection-v1`，遵循 `readStoredJson`/`writeStoredJson` 慣例

| 觸發 | 動作 | 複用 |
|------|------|------|
| 贏一場卡牌對戰 | +金幣（建議 15）＋ 40% 掉一張未擁有卡 | `updatePlayerData` |
| 購買卡包 | 商店新增「知識卡包」，金幣買隨機 3 張 | `dailyCamp` 商店模式 |
| 集滿單一學科全系列 | 解鎖限定稱號（四科各一） | `unlockLimitedTitle` |
| 勝場里程碑（10/50 勝） | 稱號「牌局好手」「潮汐牌王」 | `unlockLimitedTitle` |

## 9. 檔案結構（階段一）

```
client/src/pages/Tavern.tsx              酒館大廳 hub
client/src/pages/Tavern.css
client/src/game/trumpCardData.ts         卡牌目錄（四學科/稀有度/四屬性）
client/src/game/trumpDuel.ts             對局狀態機 + AI + 比數值結算（純函數）
client/src/game/cardCollection.ts        卡牌收藏進度（localStorage）
client/src/components/TrumpDuelBoard.tsx 對戰面板（選屬性→答題→揭曉）
client/src/components/TavernCompanion.tsx 夥伴小屋展示
```
- `App.tsx` 新增路由 `/tavern`、`/tavern/cards`
- Home 學習區新增「燈塔酒館」入口（放「探險與對戰」或獨立遊戲組），並移除該處的知識決鬥卡

## 10. 測試策略

- `trumpDuel.test.ts`（核心）：比數值勝負、平手公共池累積與全拿、贏家續攻、牌堆清空勝負、40 回合上限判定、答對「情報/強化」效果
- `cardCollection.test.ts`：進度存取、勝場累計、卡包計數
- `trumpCardData.test.ts`：四主題足量卡牌、id 唯一、屬性 1–10、稀有度分布
- `Tavern` 頁面層：testing-library 驗證大廳入口與夥伴展示

## 11. 範圍界線（YAGNI）

**階段一包含**：酒館大廳 hub、Top Trumps 卡牌對戰（8 張牌堆、40 回合上限）、答題「情報/強化」加成、單一 AI 難度、夥伴唯讀展示、金幣/卡包/稱號串接、知識決鬥收編。

**階段一不做**：文字冒險章節、說書整合（皆階段二）；多人連線、easy/hard AI、卡牌特殊技能、點陣圖卡面、寵物新養成系統、搬動學習區既有功能。
