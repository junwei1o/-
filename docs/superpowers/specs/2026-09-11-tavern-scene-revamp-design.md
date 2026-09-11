# 場景式燈塔酒館改造設計

> 日期：2026-09-11
> 前身：`2026-09-10-tavern-game-hub-design.md`（酒館遊戲大廳初版）
> 目標：把酒館從「白底卡片清單」改造成有沉浸感的 CSS 場景，並補齊新手開局斷鏈、卡包商店、雙向連結。

## 1. 現況問題

1. **視覺割裂**：`Tavern.tsx` 僅用白底卡片，未使用全站色系（`--paper #F9F3E8`、`--tidal #0B6E8E`、`--coral #E8754A`、`--yellow #E8B84B`、`--moss #6C8460`），與其他頁面風格不一致。
2. **新手開局斷鏈（功能性 Bug）**：`TrumpDuelBoard.start()` 要求收藏 ≥3 張卡才能開戰，但新玩家收藏為 0，取得卡牌的唯一管道是「贏對戰掉落」——無法開戰就不可能贏，形成死路。
3. **卡包商店沒有 UI**：`cardCollection.openCardPack()` 邏輯已存在，但酒館沒有任何購買入口。
4. **缺少世界觀角色**：沒有老闆/NPC，酒館不像「酒館」。
5. **兩區連結弱**：除了首頁一張入口卡，學習區與酒館之間沒有相互引導。

## 2. 設計決策（已與使用者確認）

- **場景式酒館**：純 CSS＋Emoji 搭建室內場景（不使用 AI 生圖），熱點即功能入口。
- **吧檯老闆全套服務**：卡包商店、新手免費卡、動態問候對話、冒險任務引導。
- **雙向連結**：學習區 ↔ 酒館互相引流（見 §6）。

## 3. 場景布局（Tavern.tsx 重寫）

手機與桌面皆適用的垂直場景（max-width 720px 置中，沿用全站版面）：

```
┌──────────────────────────────────────┐
│  🏮                    🏮   💰 320     │  招牌「燈塔酒館」＋兩盞搖曳燈籠
│        燈 塔 酒 館                     │
├──────────────────────────────────────┤
│  🌙▟▙窗          木層架（酒瓶 emoji）   │
│                                      │
│   🃏        📜        🐾              │  三個場景熱點
│  牌桌      佈告欄     壁爐角           │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔥 壁爐          🧔 老闆吧檯 🍺 │  │  木質吧檯（可點）
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
   💬 老闆對話氣泡（固定在吧檯上方）
```

- **熱點**：牌桌 → `/tavern/cards`；佈告欄 → `/tavern/adventure`；壁爐角 → 捲動/展開夥伴區；吧檯老闆 → 開啟吧檯面板。
- **稱號牆**：保留為場景角落小熱點（牆上的「榮譽牌匾」🏅 → `/badges`），不佔主要位置。
- 全部以全站 CSS 變數上色；木頭用 `#5c3d26 / #7a4f2e / #9a6a3e` 棕色階（在 Tavern.css 內定義 local 變數 `--tavern-wood*`）。
- 動畫：燈籠輕擺（`transform: rotate` 3s 往復）、火光閃爍（`opacity` 濾鏡）。**強制遵守 `@media (prefers-reduced-motion: reduce)`** 關閉動畫（全站既有慣例）。

## 4. 吧檯老闆（新功能核心）

### 4.1 純邏輯層：新增 `client/src/game/tavernKeeper.ts`（可單測，不依賴 React/DOM）

```ts
export type KeeperContext = {
  hour: number;            // 0–23，注入便於測試
  totalAnswers: number;    // 來自 getPlayerData()
  streak: number;          // 來自 bxStore 連勝（取不到用 0）
  ownedCardCount: number;
  uncompletedChapters: number;
};

/** 動態問候：時段招呼 + 依狀態追加一句。 */
export function greetKeeper(ctx: KeeperContext): string;

/** 新手贈卡：首次啟用回傳 5 張普通卡 id；之後回傳 null。 */
export function grantStarterCards(rng: () => number): string[] | null;

export const CARD_PACK_GOLD_COST = 25;

/** 開包結果 3 張卡（複用 cardCollection 邏輯，價格檢查在 UI 層）。 */
```

- 問候範例：白天「早安啊，精神不錯！」；晚上「夜色深了，來一局放鬆吧」；連勝 ≥5「連勝中？好手氣！」；收藏 ≥15「你蒐集的卡越來越齊了」；有未解章節「佈告欄上還有新任務，去看看？」。
- **新手卡**：5 張從普通卡池中隨機取（`rarity === "common"`，共 10 張），保證 ≥3 張可立即開戰。贈送狀態記於 localStorage `xue-tavern-starter-v1`。

### 4.2 UI 層：新增 `client/src/components/TavernBar.tsx`

點擊吧檯後展開面板（頁內彈層，非跳頁），分三區：

1. **老闆的話**：顯示 `greetKeeper()` 問候句。
2. **卡包商店**：顯示價格（25 金幣）、擁有金幣；「買一包」按鈕：
   - 金幣不足 → `toast.warning`；
   - 足夠 → 扣金幣（`updatePlayerData`）、呼叫 `openCardPack()`、展示開包結果（3 張卡翻面顯示名稱/屬性/稀有度色框），按「收下」關閉。
3. **冒險引導**：列出 2 個章節的完成狀態（完成狀態以是否擁有結局稱號判斷：`燈塔嚮導`、`古籍尋跡者`），未解者顯示「前往」連結。

### 4.3 進入酒館時自動贈送新手卡

`Tavern.tsx` 首次掛載時：若 `xue-tavern-starter-v1` 不存在，呼叫 `grantStarterCards()`，逐張 `addCardToCollection()`，寫入標記，並以老闆氣泡 + toast 呈現「初次見面，送你幾張卡牌試試手氣！」。

## 5. 壁爐角夥伴呈現

`TavernCompanion.tsx` 資料邏輯不變（`loadRpgState`＋`affectionLevel`），僅改呈現：

- 標題改為「🔥 壁爐角的夥伴」；卡片用暖色壁爐質感（`--paper-deep` 底、圓角、火光色左邊框）。
- 無夥伴時空狀態文案改為酒館語境：「壁爐邊還有空位……去答題戰鬥招募第一位夥伴吧！」＋連結按鈕前往 `/battle`。

## 6. 雙向連結（學習區 ↔ 酒館）

為避免侵入大型檔案 `PaperExam.tsx`，本版採用低風險的固定掛載點：

- **學習 → 酒館**：首頁「燈塔酒館」模式卡（`Home.tsx` 既有 `is-tavern` 卡）暖色化——加暖黃漸層底、酒館 emoji，CSS 放 `HomeDashboard.css`，沿用既有 `.home-mode-card` 結構，不動邏輯。
- **酒館 → 學習**：
  - `TrumpDuelBoard` 結束畫面（victory/defeat/draw）在「再戰一局」旁新增「回去答題」連結 → `/practice`。
  - `AdventureViewer` 章節列表頂部新增「返回學習區」文字連結 → `/practice`。
  - 酒館場景底部固定一行「📚 今天學夠了嗎？回去答題賺金幣」→ `/practice`。

> 明確不做：不在 `PaperExam.tsx` 結果頁或答題流程中插入酒館彈窗（避免干擾學習主流程與其大量測試）。

## 7. 檔案變更

| 檔案 | 變更 |
|------|------|
| `client/src/game/tavernKeeper.ts` | 新增：問候邏輯、新手贈卡、卡包常數（純函式） |
| `client/src/game/tavernKeeper.test.ts` | 新增：時段問候、狀態句、新手卡數量/一次性、卡池皆普通 |
| `client/src/components/TavernBar.tsx` | 新增：吧檯面板（問候/商店/冒險引導/開包展示） |
| `client/src/pages/Tavern.tsx` | 重寫：場景熱點布局、首次贈卡、掛載 TavernBar |
| `client/src/pages/Tavern.css` | 重寫：場景、燈籠/火光動畫、熱點、木質吧檯 |
| `client/src/pages/Tavern.test.tsx` | 更新：斷言場景熱點（牌桌/佈告欄/壁爐/吧檯）與新手贈送行為 |
| `client/src/components/TavernCompanion.tsx` | 壁爐角暖色呈現、空狀態加戰鬥連結 |
| `client/src/components/TrumpDuelBoard.tsx` | 結束畫面加「回去答題」連結 |
| `client/src/components/AdventureViewer.tsx` | 章節列表加「返回學習區」連結 |
| `client/src/pages/HomeDashboard.css` | `is-tavern` 模式卡暖色化 |
| `Home.modeHub.test.ts` | 若有 class 斷言一併更新（預期無邏輯變動） |

## 8. 測試策略

- **tavernKeeper（重點純邏輯）**：
  - 問候：注入不同 hour 回傳早/午/晚招呼；連勝、收藏數、未解章節觸發對應追加句。
  - 新手卡：首次回傳恰好 5 張、全部 `common`、id 存在；（一次性標記的部分在整合層以 localStorage 測試）。
- **Tavern 頁（jsdom）**：四個場景熱點文字存在；首次進入後 localStorage 有 `xue-tavern-starter-v1` 標記且收藏 ≥5 張。
- **TavernBar（jsdom）**：金幣不足時不扣款；購買成功扣 25 金幣、收藏 +3、出現開包結果。
- 既有 665 測試全數維持綠燈；tsc、build 通過後部署。

## 9. 範圍界線（YAGNI）

**本版包含**：CSS 場景重製、燈籠/火光動畫（含 reduced-motion）、吧檯老闆（問候/商店/新手卡/冒險引導）、壁爐角暖色化、三處返回學習連結、首頁入口暖色化。

**本版不做**：AI 生圖、酒館背景音樂、多 NPC 角色、老闆對話樹/支線劇情、卡包稀有度機率差異化（沿用 `openCardPack` 均勻抽取）、PaperExam 流程內彈窗、卡牌交易/分解。
