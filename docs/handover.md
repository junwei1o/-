# Hdmx（寶島探險家）專案開發交接報告

> **用途**：完整記錄專案從開發至今的成果、架構、流程、待辦與部署方式，讓新接手的開發者可以無縫繼續。
> **最後更新**：2026-09-16
> **報告涵蓋範圍**：P0 → P1 → P2 → 補缺修復 → AI Token 用量 → 聯盟賽賽季系統 → 卡牌系統 → 夥伴怪獸多樣化，以及後續 P3-4、P3-5 待辦。

---

## 0. 專案基礎資訊

| 項目 | 內容 |
|---|---|
| 專案名稱 | 寶島探險家 hdmx（台灣國小學習 RPG，全程繁體中文） |
| 程式碼根目錄 | `/home/user/Doubao/chats/38441428970787074/hdmx` |
| GitHub | 私有 repo `junwei1o/-`，主分支 `main` |
| 線上環境 | Render：`https://xue-gr3a.onrender.com`（push main 後約 2 分鐘自動部署） |
| 前端 | Vite + React + TypeScript + wouter（路由）+ tRPC client + Tailwind/自訂 CSS |
| 後端 | Node + Express + tRPC（`server/routers.ts`，全部 publicProcedure，**無登入系統**） |
| 資料庫 | **MySQL**（Drizzle ORM，`mysqlTable`；不是 PostgreSQL） |
| 使用者身份 | 無帳密登入，以「船名」（2–6 字）識別，存於 localStorage `xue-cloud-mode-v1`，雲端同步 |
| 題庫 | `data/taiwan_curriculum_500.json`（948 題，4 科：數學/自然/社會/國語；英語僅前端） |
| LLM 架構 | 前端不直連、不存 Key；走同域代理，Key 只放 Render 環境變數 |

### 重要目錄結構
```
hdmx/
├─ client/src/
│  ├─ pages/            頁面（*.tsx + 同名 *.css）
│  ├─ components/       元件（如 TrumpDuelBoard、CardArt）
│  ├─ game/             遊戲邏輯（純函數 + 測試，如 rpgBattle、trumpDuel、cardCollection）
│  ├─ lib/trpc.ts       tRPC client
│  └─ App.tsx           React.lazy 路由表
├─ server/
│  ├─ routers.ts        appRouter（所有 tRPC 端點）
│  ├─ db.ts             Drizzle 存取層（CREATE TABLE 陣列 + 老庫 ALTER + 業務函數）
│  ├─ companion.ts      AI 代理（OpenAI 相容 proxy、usage 解析）
│  └─ _core/            trpc/context/env/cookies 等基礎
├─ drizzle/schema.ts    所有 MySQL 表定義
└─ data/                題庫 JSON
```

---

## 1. 已完成工作（依時間順序）

### 階段 P0（最早，已上線）
- 產品審查與重構設計報告中 P0 級問題全數處理（設計稿：`/home/user/Doubao/chats/38440866650625794/design-docs/產品審查與重構設計總報告.txt/.html`）。

### 階段 P1（已上線，commit `794af22` 等）
- **英語島**：英語學習模組（英語題目僅在前端，後端題庫 enum 維持 4 科，勿改）。
- **家長 PIN 碼**：家長/教師入口的 PIN 保護。
- **戰鬥數值**：RPG 戰鬥平衡調整。

### 階段 P2（已上線，commit `91ac391`、`39268f2`）
- **教師端**（`/teacher`，TeacherDashboard）：班級碼機制（localStorage `xue-teacher-class-code-v1`）、`teacher` router。
- **聯盟賽全站週榜**：`league.weekly`，臺北時間每週一 00:00 重置，讀 `exam_records` 即時聚合作答數。
- **AI 每日配額**：每位船名每天最多 20 次深度反思（`ai_usage` 表）。
- **異步 PK**：`pk` router（create/get/join/submit），6 碼房間代碼，已實測打通。

### 三項補缺（已上線，commit `2bab643`）
1. 導航收斂為五個主入口。
2. 戰鬥四步教學引導。
3. 家長報告弱點 Top3 建議。

### FAB 觸控修復（commit `dc547cf`）
- 首頁快速行動懸浮按鈕（FAB）觸控熱區補足至 44×44px。

### AI Token 用量統計（已上線，commit `88554c9`、`56478fa`）
- `ai_usage` 表新增 `promptTokens` / `completionTokens` / `totalTokens` 三欄（`db.ts` 含老庫冪等 ALTER）。
- 深度反思（reflect）成功後記錄**供應商實際回傳**的 usage；未回傳記 0，**不估算、不猜測**。
- `companion.ts`：`ProxyCallResult.usage`，`callOpenAICompatibleProxy` 解析 `usage.prompt_tokens` 等。
- 新 API `aiTutor.tokenUsage`：回傳 today / last7Days / byDay。
- 教師端「AI 伴讀用量（全站）」卡（**放在班級碼條件分支外**，無班級也能看）。
- 學生「學習洞察」頁新增個人 AI 用量卡（需有船名且有真實作答才顯示）。
- 誠實現況：線上用量數值目前為 0（尚無真實深度反思呼叫）。

### 聯盟賽賽季系統 P3-1（已上線，commit `35a0691`）
> 原本只有全站週榜，無分組、升降級、賽季獎勵。

**資料表（drizzle/schema.ts + db.ts CREATE TABLE）**
- `league_seasons`：id、seasonNumber、startAt、endAt、isSettled。
- `league_groups`：seasonId、name（船名）、groupType（bronze/silver/gold/diamond），賽季分組快照。
- `league_rewards`：seasonId、name、rewardType（participate/rank）、rank，防重複領取。

**規則**
- 每 7 天一季（與週一 00:00 對齊）；**惰性結算**：造訪時若上季已結束未結算，自動升降級並建立下一季（`ensureLeagueSeason` / `settleLeagueSeason`）。
- 組別：青銅→白銀→黃金→鑽石；新玩家自動進青銅（`getOrCreateLeagueGroup`）。
- 升降級純函數 `computeLeaguePromotionDemotion`：每組前 30% 升、後 30% 降；青銅不降、鑽石不升。
- 排名獎純函數 `computeLeagueRankReward`：前 10% 500 金幣＋限定徽章、前 25% 300、前 50% 150、其餘 50。
- 參與獎：本季 ≥5 題領 100 金幣。
- 賽季積分＝賽季起訖內 `exam_records` 即時聚合作答數（不另建積分表）。

**tRPC 端點（league router）**
- `season`：當前賽季＋我的組別＋組內排名＋組別榜。
- `groupRanking`：指定組別榜。
- `myRewards`：已領取清單與狀態。
- `claimReward`：領獎（防重複、條件攔截，錯誤訊息繁中）。
- `settle`：手動結算（僅 `__teacher_` 開頭教師帳號）。

**前端 `LeagueArena.tsx` + 新增 `LeagueArena.css`**
- 賽季卡（第 N 賽季、剩餘時間倒數）、組別徽章（四組配色）、組內名次。
- 三分頁：我的組別榜 / 全站榜 / 賽季獎勵。
- 獎勵面板：參與獎、排名獎按鈕，未達條件顯示誠實提示（如「需要至少 5 題」）。
- 領到 top10 限定徽章時，對應聯盟限定卡自動加入卡牌收藏。

**驗收**：tsc 0 錯；全量 172 檔 999 測試全綠；線上 Playwright 12/12。

---

## 2. 卡牌系統 P3-2（已上線，commit `4731c13`，線上驗收 8/8）

> 原本已有：20 張卡、Trump 對決引擎、卡冊頁、酒館抽卡。缺口：無屬性相克、卡數不足。

本次改動（**已 commit、已 push、已部署、已驗收**）：
1. **卡牌 20 → 48 張**（`trumpCardData.ts`）：
   - 四學科各 11 張（國語/數學/社會/自然，各新增 6 張台灣課程/寶島主題卡）。
   - 另 4 張**聯盟限定卡**：`league-bronze/silver/gold/diamond`（青銅守護者/白銀艦隊/黃金探險家/鑽石王冠）。
2. **屬性相克**（`trumpDuel.ts`）：
   - 循環：自然剋社會 → 社會剋國語 → 國語剋數學 → 數學剋自然。
   - `themeAdvantage()` / `themeAdvantageLabel()`；結算時剋制方該屬性 **+2**（雙方一視同仁）。
   - 「聯盟」卡為**中立屬性**，不剋也不被剋。
3. **對決 UI**（`TrumpDuelBoard.tsx`）：揭曉階段顯示「⚔️ X剋Y——我方/對手 +2」提示。
4. **聯盟賽串卡**（`LeagueArena.tsx`）：領排名獎且 badge 為 top10 時，`addCardToCollection("league-組別")` 自動入收藏。
5. **卡冊頁**（`CardCollection.tsx`）：主題分組新增「聯盟」。
6. **測試**：
   - `trumpCardData.test.ts` 改為斷言 48 張、各學科 11 張、聯盟 4 張、id 唯一、聯盟卡 id 對應。
   - `trumpDuel.test.ts` 新增相克循環、中立、+2 逆轉/落敗/同主題平手共 6 案。
   - 修正 `cardCollection.test.ts` 硬編碼舊 5 張數學卡（改 11 張）。

**接手注意**：卡牌改動的最終全量測試需確認通過後，才 commit/push（見第 5 節流程）。預期全量約 1006 測試。

---

## 3. 尚未完成的工作（建議順序）

完成卡牌收尾後，依序 P3-3 → P3-4 → P3-5，每段獨立驗收上線。

### P3-2 卡牌系統收尾
- [ ] 最終全量測試通過 → commit（建議訊息 `feat(cards): 48張卡牌+屬性相克+聯盟限定卡`）→ push。
- [ ] 等 Render 部署，確認線上 bundle hash 與本地 `dist/public/assets/` 一致。
- [ ] Playwright 線上驗收：卡冊五主題分組、48 張、對決頁、相克提示、0 JS 錯誤。
- [ ]（可選）卡牌美術素材、開卡機率調校、卡牌詳情彈窗動畫。

### P3-3 夥伴怪獸多樣化（已上線，commit `d05f44f`，線上驗收 6/6）
> 原本已有：11 隻夥伴（4 棲息地各 2 隻捕捉怪＋4 主角）、進化/養成/捕捉/戰鬥系統。
本次改動：
- 新增傳說主角夥伴**「黑熊護衛」**（formosa-bear，region central，守護者，防禦型）＋3 階進化鏈（黑熊護衛→黑曜熊衛→玉山熊皇，`companionEvolution.ts` STAGES）。
- 捕捉怪 8→12：四個棲息地各補第 3 隻（夜潮螢/雲嶺水鹿/星谷鯨靈/瑩光水母），稀有度 common/rare/legendary 三檔齊全。
- **遭遇輪替**：`encounterForRegion(region, ownedIds?)` 依已捕捉進度先遇低階未捕捉怪，全捕捉後遇最高階；`RpgAdventure.explore` 傳入已擁有夥伴 id。
- 新成就 2 個：「圖鑑收藏家」（3 隻夥伴）、「進化先鋒」（首次進化）；`unlockGrowthAchievements` 加可選 `extra` 參數，`rpgStorage` 串接 companionCount/evolutionStage。
- 測試：`rpgData.test.ts`（5 主角/12 捕捉怪/四棲息地三檔齊全/輪替邏輯）＋companionGrowth 成就測試；全量 **173 檔 1011 測試全綠**。

### P3-4 文字冒險擴充（已上線，commit `e9cb41d`，線上驗收 12/12）
> 原本僅 2 章（燈塔的呼喚／失落的古籍），引擎（begin/advance/settle）與章節結構完好。
本次改動：
- `adventureChapters.ts`：ALL_CHAPTERS 2→**6**，新增 4 個寶島主題章節——
  - 鹽田的滋味 🧂（cost 40，自然+社會 check，good 結局「鹽田小達人」）
  - 鐵道上的數學 🚂（cost 45，數學 check ×2，good 結局「鐵道數學家」）
  - 夜市的祕密 🏮（cost 35，國語+數學 check，good 結局送卡＋「夜市尋寶王」）
  - 阿里山的密語 🌲（cost 50，自然+國語 check，good 結局送卡＋「山林解密者」）
- 每章節皆為多選擇分支＋≥1 跨科別 check＋多結局（good/neutral/bad），reward 金幣/卡/稱號。
- `Tavern.tsx`：CHAPTER_TITLES 註冊 6 個稱號（**新章節必須在此註冊**，否則酒館不顯示）。
- 測試：`adventureChapters.test.ts` 新增「6 章節結構」「good 結局稱號」斷言；相關 5 檔 35 案全綠。
- 驗收 key：玩家金幣 `xueAdventurerData`（PlayerData.gold）、稱號 `xue-adventure-limited-titles-v1`（陣列）、章節列表自動渲染（`/tavern/adventure`，ALL_CHAPTERS.map）。

### P3-5 夜間觀測深化（已上線，commit `ebf9c4b`，線上驗收 6/6）
> 原本夜間已有：worldStateForTime 夜間 18–6 時、battleAttackMultiplier 1.1、BattleScene「☾ 夜間觀測」chip、AstronomyQuiz 天文題庫、expeditionObservations 觀測系統。
本次改動：
- **`nightObservation.ts`（新）**：`isNightHour`（18–6 為夜）、`nightObservationBonus`（夜間金幣 +20%、稀有遭遇率 +5%、label「星光加成」）、`nightSkyCaption`（依時段回天文小語：獵戶座/銀河/北極星/金星）。
- **`academyExpansion.ts`**：WorldEventKind 新增 **`starlight-observation`（星語觀測）**，reward 金幣 35＋補給 1；新增 `worldEventAllowedAt`（星語觀測僅夜間可觸發）。
- **`rpgTypes.ts`**：activeWorldEvents 的 kind 型別同步加 `starlight-observation`（**改 WorldEventKind 時此處必同步**）。
- **`RpgAdventure.tsx`**：世界事件列新增「星語觀測」按鈕（夜間顯示「✦ 星語觀測」）；白天觸發 announce「星語觀測需要夜空」。
- **`BattleScene.tsx`**：夜間環境 chip 顯示「✦ 星光加成」。
- 測試：`nightObservation.test.ts` 3 案（時段邊界/加成/小語）＋`academyExpansion.test.ts` 星語觀測案。

### 題庫設計優化 P0（本機 commit `05615bf`，尚未 push）
> 目標：在不動 DB schema、不動後端 enum、不改 UI 外觀的前提下，改善手機端題庫載入與抽題重複問題。
- **載入效能**（`client/src/lib/questionBank.ts`）：離線後備庫（本地 948 題＋英語 seed）的「擴成 6 選項」是純確定性運算，改為模組載入時算一次（`EXPANDED_LOCAL_FALLBACK`），不再每次 `query.data` 變動重跑近千題；打亂選項仍保留每次執行（刻意讓正解位置每次不同）。
- **抽題多樣性**（`client/src/game/adaptiveLearning.ts`）：`selectAdaptiveQuestions` 新增可注入 `random` 參數；主分數相同時以隨機鍵打平（先逐題預取亂數，不在 sort comparator 內呼叫），解決「同分固定抽 array 順序、每次出同樣題」。既有測試因分數本就不同而不受影響。
- **題庫誠實報告**：重跑驗證，`data/taiwan_curriculum_500_quality_report.json` 從過期的 500 題更新為真實 **948 題全數有效、0 重複題幹**。真實分布：國語 210／數學 267／社會 235／自然 236；三年級 291／四年級 287／五年級 188／六年級 182；基礎 379／標準 307／挑戰 262；全部為 4 選一選擇題（無是非題）。
- **驗收**：tsc 0 錯；`adaptiveLearning.test.ts` 19 測試全綠（含新增同分打平案）；`vite build` 成功；全量 **1017/1018 通過**，唯一失敗 `server/token-usage.test.ts` 為日期硬編碼（預期 2026-09-16，已過日），與本次改動無關。
- **後續可選**：五、六年級題量偏薄（各約 185，低於三、四年級約 290）；若要擴題型（是非／配對）需一併改判題邏輯，另開工作。

### 題庫擴充＋題型豐富化（本機 commit `9b88ef3`、`590cbaf`，尚未 push）
> 接續上一段：補齊五、六年級題量、新增是非題型、修好日期飄移測試。
- **題量 948 → 1090**：新增 140 題（五、六年級四科），來源檔 `data/supplement_{math,science,social,chinese}.json`，由 `scripts/merge-supplement.mjs` 合併、`scripts/remap-topics.mjs` 對齊知識點後寫入主庫。五年級 188→259、六年級 182→253。
- **是非題型上線**：新增 19 道是非題（`questionType:"是非題"`、2 選項「正確/錯誤」）。前端 `isValidQuestion` 本就有 2 選項分支、判題元件全為 `options.map + index===answer` 通用邏輯，無需改 UI；`expandQuestionBankToSix` 對非 4 選題原樣保留。
- **知識點≥4 規則維持**：新題的 `learningTopic` 對齊舊庫既有組別（如「圓」拆進「周長計算/面積計算」、「比與比值」併入「比例」、「觀測月亮/太陽/星星」合為「天文觀測」4 題）；薄知識點組（<4 題）數量為 **0**。
- **limit 500 → 1200**（三處同步：`client/src/lib/questionBank.ts` 請求、`server/db.ts` cap、`server/routers.ts` z.schema），server 模式下也能取到全部 1090 題；後端 `ensureQuestionBankReady` 為增量同步，新題會自動補入 DB。
- **測試更新**：`server/question-bank.test.ts` 改為依題型驗證選項數（是非 2／選擇 4）；`server/token-usage.test.ts` 日期硬編碼改 `vi.useFakeTimers()` 固定系統時間，消除每日飄移。
- **驗收**：tsc 0 錯；`vite build` 成功；**全量 174 檔 1018 測試全綠**；品質報告：國語 243／數學 301／社會 272／自然 274；三 291／四 287／五 259／六 253；基礎 414／標準 390／挑戰 286。
- **線上部署**：等待推送後由 Render 自動增量同步新題至 `question_bank` 表（補缺的 id，不重建）。

### 獨立待辦：LINE 推播（需使用者本人操作，助理無權限）
- 程式碼已上線，但線上 webhook 回 501。
- 需在 **Render 後台**加兩個環境變數：`LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN`，再重新部署，並在 LINE 頻道設 Webhook URL `https://xue-gr3a.onrender.com/api/line/webhook`、勾選 Allow bot to send push messages。

---

## 4. 關鍵實作守則（避免踩雷）

1. **身份用船名，不是 userId**：所有新端點用 `publicProcedure` + `cloudNameSchema`（2–6 字，regex `/^[一-鿿A-Za-z0-9]+$/`），**沒有** protectedProcedure / 登入 / session。
2. **資料庫是 MySQL**：schema 用 `mysqlTable`、`mysqlEnum`（enum 欄位值用 `"0"/"1"` 這類字串）、`int().autoincrement().primaryKey()`；勿寫 pgTable。
3. **新表要兩處同步**：`drizzle/schema.ts` 定義 + `server/db.ts` 的 `DB_TABLES` CREATE TABLE 陣列；老庫加欄位放 `ENSURE_COLUMN_STATEMENTS`（冪等 ALTER）。
4. **DB 連線是 lazy**：`getDb()` 僅在有 `DATABASE_URL` 時連線，純函數邏輯可被測試直接 import（無副作用）。
5. **積分/統計優先即時聚合** `exam_records`，避免另建易過期的積分表。
6. **AI 用量只記供應商真實回傳**，回傳缺失記 0，禁止估算。
7. **隱私紅線**：送往第三方 LLM 的內容不得含姓名、學校、班級。
8. **UI 必須沿用現有視覺風格**（米黃/暖橙/海藍、手繪 webp 素材於 `client/public/assets/illustration/`），觸控目標 ≥44px，繁體中文。
9. **後端題庫 enum 只有 4 科**（數學/自然/社會/國語），英語只在前端，勿動 enum。
10. 戰鬥規格見 `rpgBattle.ts`（基礎攻擊免答題、技能耗能答對+3、怒氣、連擊 1.5 倍；戰鬥內無消耗品 UI）。

---

## 5. 標準開發／測試／部署流程（每個功能都照做）

```bash
# 0. 每次 shell 會重置到主專案目錄，先進專案
cd /home/user/Doubao/chats/38441428970787074/hdmx

# 1. 型別檢查（必須 0 錯）
npx tsc --noEmit

# 2. 全量測試（約 20 分鐘；不加這兩個參數會 EXIT=124）
npx vitest run --maxWorkers=4 --pool=forks
# 單一檔案快速跑：
npx vitest run server/league.test.ts --maxWorkers=2 --pool=forks

# 3. 前端建置（chunk 大小警告可忽略）
npx vite build

# 4. commit
git add -A
git commit -m "feat(模組): 描述"

# 5. 推送（使用 GitHub PAT 作為 remote 認證；切勿把 PAT 寫進任何檔案或 commit，用後建議輪換）
git push 'https://x-access-token:<你的PAT>@github.com/junwei1o/-.git' HEAD:main

# 6. 等 Render 部署（約 2 分鐘），比對 bundle hash
LOCAL=$(ls dist/public/assets/ | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1)
curl -s https://xue-gr3a.onrender.com/ | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
# 兩者相同 = 部署完成

# 7. Playwright 線上驗收（見第 6 節）
```

**門檻**：tsc 0 錯 → 全量測試全綠 → build 成功 → push → 線上 bundle 一致 → Playwright 線上回歸通過，才可對使用者宣告完成。

---

## 6. Playwright 線上驗收方式

- MCP live tools 在本環境不可用，實際用 **Python Playwright**：
  - Python：`/opt/python3.12/bin/python`
  - 瀏覽器：`executable_path="/usr/local/bin/chromium", headless=True, args=["--no-sandbox"]`
- **進站彈窗要多輪掃除**（依序嘗試點擊）：
  `.bx-privacy` 的「好的，開始航行」/「略過，先體驗看看」→「存在這台裝置」→「跳過導覽」/`.bx-tour__skip` → `.daily-signin-close` → `button[aria-label="關閉"]` →「知道了」。
- **注入身份**：`context.add_init_script` 設 localStorage：
  `localStorage.setItem('xue-cloud-mode-v1', JSON.stringify({mode:'cloud',name:'船名'}))`
- **學習洞察類頁面需先注入真實題庫題目**（如 `q001`，國語/事件順序）的作答紀錄 `xue-adventure-adaptive-v1`，否則停在空狀態、boundary 卡不渲染。
- 卡牌收藏注入鍵：`xue-card-collection-v1`（JSON 陣列的卡 id）。
- 驗收腳本慣例放 `/tmp`（**注意：/tmp 會被環境清空**，重要日誌改放 `hdmx/.testlogs/`）；截圖放
  `/home/user/Doubao/chats/38440866650625794/線上驗收截圖/`。
- 既有驗收腳本（可能需重寫）：pw_smoke.py、pw_accept_v2.py、pw_usage.py、pw_league.py、pw_card.py。

---

## 7. Git 提交歷史（最近）

| Commit | 內容 |
|---|---|
| `ebf9c4b` | feat(night)：夜間觀測深化（星語觀測夜間限定＋星光加成＋天文小語，已上線） |
| `e9cb41d` | feat(adventure)：文字冒險 2→6 章（鹽田/鐵道/夜市/阿里山）＋酒館稱號（已上線） |
| `a8ec4f3` | docs：handover 更新 P3-3 已上線 |
| `d05f44f` | feat(rpg)：夥伴怪獸多樣化（黑熊護衛/12 捕捉怪/遭遇輪替/2 成就，已上線） |
| `e416db1` | docs：建立 handover.md 交接報告 |
| `4731c13` | feat(cards)：卡牌 48 張＋屬性相克＋聯盟限定卡（已上線） |
| `35a0691` | feat(league)：聯盟賽賽季分組/升降級/賽季獎勵（已上線） |
| `56478fa` | fix(ui)：AI 用量卡移至條件外，無班級也能看全站用量 |
| `88554c9` | feat(ai)：深度反思 token 用量統計與查詢儀表板 |
| `dc547cf` | fix(ui)：首頁 FAB 觸控熱區補足 44px |
| `2bab643` | P1/P3 補缺：導航收斂、戰鬥教學、家長弱點 Top3 |
| 更早 | `5116007`、`794af22`(P1)、`91ac391`(P2)、`39268f2`(PK)、`0be5314`(插圖) |

---

## 8. 交接總結

- **已上線且驗收**：P0、P1（英語島/PIN/戰鬥數值）、P2（教師端/全站週榜/AI 每日配額/異步 PK）、三項補缺、FAB 修復、AI Token 用量統計、聯盟賽完整賽季系統、卡牌系統 48 張、夥伴怪獸多樣化、文字冒險 6 章、夜間觀測深化（星語觀測/星光加成）。
- **待辦**：LINE 兩個 Render 環境變數（需使用者操作）。
- **後續路線**：無未完成開發項；五大長期項目（聯盟賽/卡牌/夥伴/文字冒險/夜間觀測）已全部完成上線。
- **需使用者操作**：LINE 兩個 Render 環境變數。
- 新接手者只要依第 4～6 節的守則與流程，即可直接繼續迭代。

## 2026-09-17 配對變體 A＋H 上線（510c059）
- MatchingRush 元件：單對速配（每題 30 秒、3 選一、答錯自動顯示解答）＋30 秒搶分（答對 +10、連對每連 +5、時間到結算得分/最高連對）。
- /matching 頁加玩法切換（連連看／單對速配／30 秒搶分）；搶分最高分存 `xue-matching-rush-best-v1`，選關卡顯示「· 搶分 N」。
- 題庫層：`buildRushQuestions(set)`（每對一題，正確值＋2 干擾，迷你盤自動降級）。
- 測試：matchingBank +2、MatchingRush +7（含 fake timers 倒數與結算）；tsc 0 error；受影響 6 檔 58 tests 全綠；build hash `index-L0wAPRld.js`。
- 線上 Playwright：三種模式切換、速配/搶分作答回饋、31 秒搶分結算全通過（唯一 console 400 為題庫端點既有 fallback 噪音）。

## 2026-09-17 G 圖片配對上線（236dbc6）
- 圖片題庫 data/image_bank.json：縣市地標（6 對→縣市）、世界地標（6 對→國家）、台灣動物（6 對，看圖認名）；每組 2 干擾，共 3 組併入 MATCHING_SETS（33 組）；IMAGE_MATCHING_SETS 匯出。
- MatchingPair 加 img 欄位；MatchingGame 左欄 img 渲染（.mg-item-imgwrap 直排圖卡，badge 浮左上）；MatchingRush 支援圖片題（只顯示圖、不顯文字，避免動物組 l==r 洩題）。
- /matching 四種玩法：連連看／圖片配對／單對速配／30 秒搶分；圖片配對模式只在圖片組內循環。
- 試卷配對保持純文字：mixPaperMatching 排除圖片組。
- 素材：image_search 18 張（地標/動物）下載→PIL 壓縮→client/public/matching-img/（25–77KB）；contact sheet 核驗無水印。
- 測試：matchingBank +4（圖片組/速配 img）、MatchingGame +2（img 渲染/完整配對）；全量 178 檔 1051 tests 綠、tsc 0 error；build hash index-DYxaK-U2.js。
- 線上 Playwright 9/9：四 chip、圖卡盤、配對綠線、速配圖片題、33 關選單、無 pageerror。

## 2026-09-17 寶可夢船 favicon＋燈塔指航中心改名（841f510、6c6bba0）
- favicon：image_gen 生成寶可夢畫風可愛小船（圓潤木船/白帆指南針符號/船頭燈，無角色，避版權）→ client/public/：favicon.ico、favicon-16/32/48.png、apple-touch-icon.png(180)、icon-192/512.png、site.webmanifest；index.html 補 icon links＋manifest（原本全站無 favicon）。
- 改名：使用者可見「燈塔酒館」全面改「燈塔指航中心」（首頁模式卡、功能目錄、全站搜尋、Tavern h1、藏寶 Hub、簽到彈窗、卡冊 CTA、冒險章節 lighthouse-call/lost-classic 文案）；「老闆吧檯」→「領航櫃台」、「老闆的話」→「領航員的話」、吧檯→櫃台；啤酒杯 Beer icon→Compass；場景酒瓶陳列🍶🍷🍺🥃→🧭🗺️📜⚓、老闆🍺/🧔→🧭/🗺️。
- 不變：路由 /tavern*、元件/檔名/CSS class、localStorage key、CHAPTER_TITLES 常數、鹽田/小吃攤老闆等無關角色。
- 驗證：tsc 0 error、全量 178 檔 1051 tests 綠；線上 Playwright 17/17（靜態圖標 200、manifest、首頁/Tavern 改名、彈層、無 pageerror）；bundle hash index-I8Yedzoa.js。

## 2026-09-18 C 分類歸位變體上線（999870f、a135d16）
- 分類題庫 data/sort_bank.json：量詞搭配（國語）、單位家族（數學）、縣市與直轄市（社會，2 籃）、動物住哪裡（自然）、單字分類（英語），共 5 組；SortSet 含 categories（每籃 items 多對一）。
- SortGame 元件：上方散落項目卡（點選高亮）→ 下方分類籃（點籃歸位）；成功「歸位成功！」＋ok 音、失敗抖動＋「這個放錯籃子了，再想想看！」＋no 音；30 秒倒數（is-urgent）；完成結算 sortStars（0 失誤 3 星／≤2 2 星／其餘 1 星）結果卡沿用 mg-* 樣式；成績存 xue-matching-best-v1（與配對同構）。
- 入口整合：/matching 第五顆玩法 chip「分類歸位」、選關清單新增「分類歸位」組、「查看全部 38 關」（33 配對＋5 分類）。
- 驗證：sortBank +3、SortGame +3（正確歸位 3 星／錯籃 1 失誤 2 星／時間到 1 星）；受影響 6 檔 31 tests 綠、tsc 0 error、全量回歸綠；build index-DEDEdXIc.js。
- 修 UX bug：390×844 下分類籃底部被固定底部導覽遮擋點不到 → .matching-page padding-bottom 32→108px、項目區 3 欄改 4 欄（12 項 4 行→3 行）更緊湊。
- 線上 Playwright 9/9：五 chip、盤面 12 項/4 籃、倒數、歸位成功回饋（sorted≥1）、籃內顯示放入項目、錯籃錯誤提示、38 關選單、選關後 2 籃盤、無 pageerror。

## 2026-09-18 選擇題八變體上線＋答題室改造「我的教室」
- 題庫（data/，Vite 直接打包、local-first）：fill_bank.json 24 題填空選字（五科，prompt 含 ____、4 字卡）、order_bank.json 16 題排序（3–5 項，items 為正確順序）、trap_bank.json 30 題陷阱選擇題（十類各 3 題，帶 category/trapNote，收錄往年經典易錯題型）。
- 邏輯層 client/src/lib/classroomBank.ts：FILL/ORDER/TRAP_QUESTIONS 載入校驗、fillToPaper/orderToPaper（排序題 answer=0、options=[]、orderItems 帶正確順序，答對寫 answers[id]=0、答錯/timeout 寫 -1）、buildChoiceDeck/buildTrueFalseDeck（內建 BONUS_TRUE_FALSE 12 題補充）、buildImageQuiz（復用 18 張配對圖，干擾先同組後跨組）、buildRelayRounds（選擇題＋4 對 1 干擾純文字配對同科）、accuracyStars/trapStars、最佳紀錄 `xue-classroom-best-v1`（load/saveClassroomBest）。
- paperExam.ts：PaperQuestion.questionType 聯集加填空題/排序題、加 orderItems?；新增 mixPaperVariants（12 題卷於整體第 5/10/15 題插入填空/配對/排序，缺題以同科配對遞補；短文卷不混），PaperExam.tsx 兩處建卷改用之（舊 mixPaperMatching 保留，測試仍覆蓋）。
- 我的教室（原答題室，路由 /quiz-room 不變、頁面 QuizRoom.tsx 改裝）：mc-* 裝潢風（彩帶、海報風 hero、貼紙、斜卡），特別標題「我的教室，隨你玩」＋釋放自我文案；第一區 6 張自由玩法卡（翻牌問答/看圖選答/是非閃電/限時接力/選擇配對接力/陷阱題挑戰）顯示最佳紀錄，第二區保留原 8 個經典模式；頂部/底部導航 label 改「我的教室」、activePrefixes 加 /classroom；Badges hint、週測註釋同步改名。
- 新頁 /classroom/:gameId（ClassroomPlay.tsx）：flip/image/trap→QuizRunner（每題 30 秒、翻牌模式翻開才起算、答錯 2.3s 顯示解析後換題、accuracyStars）；bolt/rush→RushRunner（總 30 秒循環連答、答對 +10、二連對起每連 +5、答錯斷連顯示正解）；relay→RelayMatch（3 關，先 choice 後 MatchingGame 迷你盤，答錯不阻斷、顯示正解，配對星等合計）。
- 元件 client/src/components/classroom/：useClassroomSound（ok/no/win/flip/tick WebAudio，muted 可控）、classroom.css（mc- hub＋cr- 遊戲全套，按鈕 ≥44px、520px 手機斷點）、QuizRunner/RushRunner/RelayMatch/FillBlank/OrderSteps；每個互動皆有成功/失敗雙回饋＋音效，所有題目 30 秒倒數。
- 試卷內嵌：FillBlank（字卡四選一，沿用 answerQuestion 計分）、OrderSteps（打亂項目→依序點選、可撤回、確認後正誤雙回饋並並列正確順序；外部 timeout 自動顯示解答）；排序題在錯題本/AI 複習 payload/總結頁改以 orderItems 箭頭序列呈現。
- 測試：classroomBank.test.ts（24/16/30 數量、結構校驗、deck 構造、計分、localStorage）、paperExam.test.ts +mixPaperVariants 5 例、ClassroomComponents.test.tsx 9 例（填空/排序/翻牌/看圖/rush/tf）、QuizRoom.test.tsx 改 6 自由玩法＋8 經典模式、TopNavigation 斷言改「我的教室」、PaperExamMixing 整合測試改第 5 填空/10 配對/15 排序（valuemax 14、統計 /14）、兩個 PaperExam 頁測試的 questionBank mock 補 LOCAL_QUESTION_BANK/LOCAL_ENGLISH_BANK 空陣列。

## 2026-09-18 我的教室第七種玩法「因數探險」上線
- 數學五上「倍數與因數」單元多選玩法（gameId=factor，路由 /classroom/factor），hub 第 7 張卡（Hash icon、#d5699e 桃粉、mc-tilt-l），標題改「自由玩法（7 種新玩法）」。
- 邏輯層 classroomBank.ts：listFactors（列舉因數）、factorPairs（由 1..√n 生成兩兩成對，a===b 為平方自己成對）、分層池 FACTOR_EASY（12 個合成數）/FACTOR_MEDIUM（6）/FACTOR_SQUARE（16,25）/FACTOR_PRIME（9 個質數）；buildFactorRounds(count=5) 五關固定 easy/easy/medium/square/prime、同輪不重複 N；makeFactorRound 9 泡泡（全部因數＋非因數干擾，干擾從 2..n-1 非整除數洗牌）；FactorRound={id,n,factors,pairs,choices,distractors,kind:normal|square|prime}；factorStars（0 失誤 3 星／≤3 二星／其餘 1 星）。
- FactorGame.tsx：start/play/result 三階段；3×3 數字泡泡多選，確認後選中因數轉綠✓、誤選轉紅✕抖動、漏選因數金色虛框、其餘變暗，接著揭曉因數兩兩成對 chips（a × b = n，平方中間因數標「自己成對」），平方關/質數關教學註記；每關獨立 30 秒倒數（最後 5 秒 tick）、timeout 自動對答案；結果頁星等/完美過關 X/5/總失誤/新紀錄，回我的教室/再探險一次（begin 重建題目）；最佳紀錄存 xue-classroom-best-v1（factor: {stars,correct,total}）。
- 樣式 classroom.css：fc-* 全套（fc-n 海藍漸層方圓章、fc-bubble 立體泡泡四態、fc-pairs 米黃虛線盒、fc-shake keyframes、prefers-reduced-motion 關抖動、520px 手機微調）。
- 測試：classroomBank.test.ts +5（listFactors/factorPairs 攤平等於因數/五關不變量/第4平方第5質數/factorStars）、ClassroomComponents.test.tsx +4（開始頁 disabled、五關全對 3 星 onBest、誤選漏選雙回饋、timeout 自動揭曉）、QuizRoom.test.tsx 改 7 張卡；受影響 3 檔 33 tests 綠、tsc 0 error、vite build OK。
- 踩坑：tsconfig target 不支援 Set 展開（TS2802），用 Array.from(set)；getByRole 無 exact 選項（那是 getByText 的）。

- 踩坑：測試選隕石要限定「已出場」的前兩顆（腳本 delay 未到的不在 DOM）；能源歸零測試改成 500ms 步進＋點掉全部干擾＋目標全漏接（−9−14 > 15）才穩定觸發。

## 2026-09-18 我的教室皮膚切換器（極簡紫／孟菲斯／經典海報）
- QuizRoom.tsx：data-skin（concise｜memphis｜classic）掛在 .mc-page，切換器 .mc-skin-switch（三顆 segmented 按鈕帶色點、aria-pressed、group label），偏好存 localStorage `xue-classroom-skin-v1`，首次造訪預設 concise；經典皮彩帶、孟菲斯幾何 .mm-decor 改條件渲染；新增 .mc-skin-bg fixed 滿版背景層（z-index 0，其餘直接子層 z-index 1）。
- 極簡紫 concise：紫漸層 hero（#6454d6→#9a89f0）白字、扁平白膠囊守則、領航員懸浮窗（.cs-helper 圓形脈動頭像＋可點擊換句的悄悄話氣泡，5 句 HELPER_TIPS）、探索進度條（.cs-progress，依 8 玩法已有 stars/score 紀錄比例）、鼓勵彈幕跑馬燈（.cs-bullets，6 句重複兩次 CSS translateX -50% 循環 30s）；卡片白地淡紫邊柔陰影、去傾斜。
- 孟菲斯 memphis：奶黃底 #fbf4e2、fixed 幾何裝飾（圓點/圓環/三角/十字/鋸齒，高飽和 #ff5d8f/#2ec4b6/#ffd84d/#845ef7＋黑邊）；hero 黃底黑邊 8px 硬陰影、FREE PLAY 旋轉徽章、波浪粉底線；貼紙黑邊硬陰影四色輪替；玩法卡三色輪替底（青/粉/黃）＋6px 黑硬陰影 hover 位移；模式卡黑邊硬陰影青 icon。
- 經典海報 classic：沿用原 mc-* 暖木彩帶風（data-skin 預設外觀保留）。
- 無障礙/手機：prefers-reduced-motion 關跑馬燈與脈動；520px 下領航員改 static 全寬、徽章縮小、幾何 scale .8、切換鈕縮小。
- 測試：QuizRoom.test.tsx 加 4 例（預設極簡＋進度/彈幕/氣泡換句、切孟菲斯寫 localStorage、切經典出彩帶、重入沿用本機皮）共 7 例綠；tsc 0 error、vite build OK。
- rebase 注記：本節與倍數防衛戰（29a8bed）并行開發，rebase 後合併第 8 張卡、進度條 playRecords 補 best.meteor、標題 8 種。
## 2026-09-18 倍數防衛戰隨機波次變體（3／9 的倍數）
- METEOR_WAVE_CONFIG 擴到 5 種：2、5、3、9、同時是 2 和 5（=10）；3/9 的 hint 教「各位數字和是 3/9 的倍數」（42→4+2=6、63→6+3=9）。
- buildMeteorWaves 改隨機組合：首波固定抽 2 或 5（個位數特徵暖身），第 2、3 波從 3/9/10 抽，波波不重複；每輪順序都不同，重玩性提升。
- 開始頁小技巧與結果頁口訣更新（2 看個位、5 看個位、3/9 看數字和、2 和 5 共同個位必 0）。
- 測試：classroomBank.test.ts 改隨機組合斷言（首波∈{2,5}、不重複、多輪組合數>1、10 波陷阱干擾條件式、3/9 數字和不變量）+2；ClassroomComponents 誤觸提示改動態倍數正則。全量 1103 tests 綠、tsc 0 error、build OK。

## 2026-09-18 倍數防衛戰切水果化：滑動切割＋分裂＋炸彈＋連斬
- 互動改為手指滑動切割（pointerdown/move/up 軌跡＋document.elementFromPoint 命中 .md-meteor[data-mid]），保留 onClick 點按兜底（無障礙＋jsdom 測試可測）；md-field 加 touch-action:none 防滑動捲動。
- 視覺：md-trail SVG 雙 polyline 光刀（暖橙粗線＋白細線，viewBox 用場地 rect px）；切中後 md-frag 左右兩半（半圓 clip、--dx/--dy/--rot CSS 變數、md-fly keyframes 0.68s 飛散墜落，700ms 後清）。
- 炸彈：每波 1–2 顆（40% 機率 2 顆），只替換第 4 顆以後的干擾隕石（目標數恆 7、前三顆絕無炸彈），aria-label「炸彈」、黑色圓石💣；切到立即 finish(true) 遊戲結束。
- 連斬：同一刀（pointerdown→up）chainCountRef 計數，切中第 n 顆加 (n−1)×5 分（10/15/20…）；meteorChainBonus(n)=10n+5(n−1) 匯出供測試。聚集生成：22% 隕石與前一顆同 delayMs、x±12% 緊鄰落下，製造一刀多斬機會。
- 文案：卡片 desc、開始頁規則（💣 切到就結束／一刀連斬有加成）、基地條、漏接/誤切「能量」全改「能源」、波末「個位數特徵小筆記」→「特徵小筆記」。
- 測試：classroomBank +2（炸彈不變量 8 輪 seed 掃描：1–2 顆、前 3 絕無、目標數恆 7；chainBonus 10/25/40）、ClassroomComponents +2（切炸彈立即結束、切割產生左右兩半）＋文案斷言更新。全量 182 檔 1111 tests 綠、tsc 0 error、build OK。
- 踩坑：重寫 MeteorGame 時 flash 浮條漏渲染（slice 邏輯對但 UI 沒元素），用 dbg 測試掃 body.innerHTML 才抓到——改互動元件時先盤點「所有會出現/消失的 UI 元素」再動筆。

## 2026-09-19 倍數防衛戰四模式版：點擊／劃切／拖拽／混合＋新手教學
- buildMeteorWaves 改為每輪從 4 種模式隨機抽 3 波（不重複，關關換模式）：tap／slash（漂浮隕石 16 顆 7 目標）、drag（純托盤：9 泡泡＝3 目標＋2 炸彈＋4 干擾）、mixed（空中 12 顆 4 目標＋托盤 3 顆＝2 目標＋1 炸彈）；倍數主題（2/5/3/9/10）也隨機組合。
- 拖拽：pointer 按住泡泡拖動（md-traywrap 托盤＋md-slot 基地回收槽）；放進槽判定 dropTray——目標 +10 分回 1 能、干擾「爆炸」−1 能＋失誤、炸彈「大爆炸」−3 能＋失誤（拖拽炸彈不即死，與漂浮炸彈切到即死區別）；沒拖動直接點泡泡＝點選（is-selected 高亮），再點回收槽放下（無障礙／低年級 fallback）。波次結束未拖進的托盤目標每顆漏接 −2 能。
- 混合波同場：漂浮隕石（點／切皆可）＋底部托盤與回收槽；slash 的 pointermove 在拖拽時自動讓位（dragRef 判定）。
- 新手教學（phase="tutorial"）：5 步——總覽卡（三操作＋炸彈警告）→ 點擊練習（點 12）→ 劃切練習（滑過 14，點按也可過）→ 拖拽練習（拖 20 進槽或點選＋點槽）→ 完成卡；完成寫 localStorage xue-meteor-tutorial-v1，開始頁首次顯示「第一次玩？」提示，教學按鈕常駐可重看。
- 測試：findSeedForFirstWaveMode(mode, extra?) 以亂數常數掃描控制第 1 波模式與組成；bank +模式結構/拖拽炸彈不變量；components +拖拽三態（對/錯/炸彈）、教學五步 E2E、三波混合全對 3 星；全量 182 檔 1113 tests 綠、tsc 0 error、build OK。
- 踩坑：getByText(/爆炸/) 會撞到拖拽模式的說明文案（md-modehint），改驗 .md-flash 內容；波內兩顆炸彈同時在場要用 getAllByRole。

## 2026-09-19 長方形拼拼樂：拖曳拼長方形＝找因數對（第 9 種玩法）
- 借鑒 NCTM Factorize／Polypad Rectangle Game：每關給 n 個方格，在 15×7 格線上拖曳（pointerdown/move/up＋elementFromPoint）或點兩下（錨點制，pointer/click 用 suppressClickRef 互斥防錨點被切）拼出長方形；長×寬＝n 才成立，錯誤面積算失誤＋抖動，重複排法只提示不重計。
- 數學設計：1×N 一排長條「送分」自動過關（手機排不下 1×60），玩家找的是 a≥2 的「真長方形」——排長方形＝找因數對；題庫限定真長方形最長邊 ≤15 行、最短邊 ≤7 列（28 的 2×14 可以、36 的 2×18 不行）。
- 題庫 buildRectRounds：5 關分層 [12/15/16/18/20]→[20/21/22/24]→[24/25/27/28/30]→[33/35/45]→完全平方數彩蛋 [16/25/49]（正方形 5×5、7×7）；不重複抽題；rectStars 同 factorStars（零失誤 3 星、≤3 二星）。
- 檔案：classroomBank.ts（RECT_* 常數、RectRound、buildRectRounds、rectStars）、components/classroom/RectGame.tsx（phase start/play/result，60 秒/關，逾時揭曉）、classroom.css rg-* 樣式（格線 touch-action:none、預覽暖橙/已拼出海藍/rg-flash 浮條/抖動）、ClassroomPlay.tsx case "rect"、QuizRoom.tsx 第 9 張卡（LayoutGrid #7a9e5f）、標題「9 種新玩法」、playRecords 補 best.rect。
- 測試：classroomBank.test.ts +4（格線內不變量、平方數彩蛋、重玩性、星等）；ClassroomComponents +2（錯誤面積失誤＋重複排法不重計、五關全對 3 星）；QuizRoom.test 8→9 張卡。全量 182 檔 1119 tests 綠、tsc 0 error、build OK。
- 踩坑：同一檔案多個 Edit 併發送出會有部分未落盤（ClassroomPlay import、QuizRoom 卡片曾丟失），同一檔的多次編輯應逐一確認或序列執行；Set 展開要 Array.from（TS2802）。
- 部署修正（9db6748）：128703f 線上 404（GAME_META 漏 rect，同檔併發編輯未落盤）→ b1231c4 補；再修互動——Chromium 的 click 在 pointerup 後的獨立 task 派發，setTimeout(0) 清抑制旗標會早於 click 執行導致錨點被 click 切掉，改為「pointerdown 重置 pointerHandledRef、commit 時設立」無計時器方案，且 commit 內改用 applyAnchor(null) 同步清 anchoredRef（原 setAnchored(null) 漏清 ref 造成錨點殘留）。線上回歸：rect 9/9、hub 9 卡／meteor／factor 全過、無 pageerror。

## 2026-09-19 長方形拼拼樂美化
- 視覺：格線改方格紙質感（米黃底＋淡藍格線＋紙張外框陰影）；已拼出的磚改六色積木（RECT_BRICK_COLORS：海藍/暖橙/綠/紫/磚紅/青，每種排法一色、立體漸層斜面＋白邊圓角，同格被多排法覆蓋顯示最新色）；chips 加同色色點（rg-dot）與 Pop 入場。
- 動效：預覽呼吸動畫、錨點脈動（等第二下）、磚塊彈跳入場（rg-brick-in）、flash 滑入、過關面板 rg-pop、正方形彩蛋 chip 搖擺；@media (prefers-reduced-motion: reduce) 全部關閉。
- 新增即時尺寸提示條 rg-status：拖曳中顯示「目前選取 a × b ＝ x 格，還差/可以放手了」，面積等於 n 轉綠（aria-live polite）。
- 驗證：tsc 0 錯、1119 tests 全綠、bundle index-DRwDnMq0.js 線上一致；線上回歸 10/10（含磚色格數、chip 色點＝磚 class、即時提示、滑動手勢）。踩坑：漸層磚色在 background-image，computed backgroundColor 是透明，比對色要用 class。

## 2026-09-19 全站風格統一
- 問題：全站兩套色——index.css 品牌 tokens（--tidal #0B6E8E／--coral #E8754A／--moss／--yellow）vs 教室子系統 fallback（--sea #2f7d8f／--orange #e8843a）；且教室 hub 預設皮「極簡紫」整組紫色漸層與全站調性脫鉤。
- 色板橋接：index.css :root 新增 --card/--sea/--sea-d/--orange/--orange-d/--green/--red/--gold 對映品牌色（--sea=#0B6E8E、--orange=#E8754A、--green=--moss、--gold=--yellow、--orange-d=#C25B36）；classroom.css 的 --cr-* 本就 var() 掛載，自動繼承，改色只動 index.css 一行。
- 硬編碼清掃：classroom.css 19 處舊 rgba（232,132,58／62,124,177／47,125,143）全換 coral/tidal rgba；MeteorGame 光刀 stroke 同步；QuizRoom 玩法卡強調色對齊（flip #0B6E8E、image #6C8460、bolt #E8B84B、rush #E8754A、meteor #1B7082、rect #64866D，紫/粉/磚紅保留做區別）。
- 極簡紫→極簡海：concise 皮全組紫色（#6d5bd0/#5b4bc4/#6454d6 漸層/#a78bfa/#d6cff7/#e8e3f8/#f1edfd…）重著色為品牌海藍家族，label 改「極簡海」、色點 #0B6E8E；skin id 不變（concise），既有使用者本機偏好自動沿用新配色，測試僅改名。
- 驗證：tsc 0 錯、1119 tests 綠、bundle index-s6OndpMm.js 一致；線上回歸 rect 10/10＋10 頁截圖審計（home/quiz-room/practice/battle/review-hub/weekly-quiz/factor/rect/expedition/gallery）全部呈現同一套米黃＋海藍＋暖橙。battle 為刻意的夜戰深色主題、quiz-room 另兩張皮（孟菲斯／經典海報）為可切換的佈置主題，非不一致。

## 2026-09-19 教室融合玩法（任天堂式合併）＋台灣地圖 2.0
- 9 種自由玩法整併為 6 張卡（卡面 9→6，舊路由 /classroom/flip、/image、/bolt、/rush、/factor、/rect 全部保留相容，GAME_META 未刪）：
  1. 因數雙重奏（/classroom/duo，新元件 FactorDuoGame）：factor＋rect 接續——同一個目標數先點因數（30s）→看因數成對揭曉→再用同數拼長方形（60s），4 關；星等＝兩段總失誤（duoStars）。bank 新增 buildDuoRounds/DuoRound（數字池沿用 RECT_TIERS，格線放得下）。
  2. 閃電接力（/classroom/flashrush）：bolt＋rush 混合——RushRunner 新增 variant "mixed"，逐題判斷（選項兩個=對錯大鍵，否則四選一），牌堆 = 12 是非＋12 選擇。
  3. 翻牌圖鑑（/classroom/flipdex）：flip＋image 混牌堆——QuizRunner 新增 variant "flipdex"（先翻牌再作答，帶 img 的題翻開後圖片＋題目一起出現），牌堆 = 9 圖卡＋9 文字題。
  4. 保留卡：陷阱題挑戰（trap）、選擇配對接力（relay）、倍數防衛戰（meteor）。
- 台灣地圖 2.0（TaiwanMainNavigationMap）：
  - 放大：canvas width 60rem→68rem、aspect-ratio 16/9→1000/620（消除 letterbox，座標線性映射）、land path 以 x'=1.2x-100、y'=1.2y-62 放大重繪（M561 5 起）；ISLAND_POSITIONS/Routes 端點同步重算。
  - 真實地標：ISLAND_LANDMARKS 每區 3 個地標章（北：故宮/101/九份；中：高美/清境/日月潭；南：赤崁樓/高雄港/墾丁；東：清水斷崖/太魯閣/三仙台；西：鹿港/北港朝天宮/澎湖雙心石滬）直接釘在地圖上（.taiwan-map-landmark，translate(-50%,-50%)，≤640px 只顯示 emoji），面板新增「真實地標」清單（奇幻島嶼名＋真實地標＋一句注解）。
  - 關卡碼頭：面板新增 ISLAND_DOCKS（島嶼→2 款融合玩法），顯示本機最佳星等/分數，新 prop onOpenGame（Home.tsx/StudentMap.tsx 傳 setLocation(`/classroom/${id}`)；未傳時唯讀，測試不需 Router）。
- QuizRoom hub：cards 9→6（flipdex/flashrush/relay/trap/meteor/duo）、playRecords 同步、「自由玩法（6 種融合玩法）」；測試改 6 卡。
- 驗證：tsc 0 錯、1119 tests 全綠、build 成功。
- 踩坑：Edit 工具批次多檔編輯會「部分静默丟失」（本輪 6 處），每個 Edit 後必 grep 驗證；span 地標章不能放進 <svg> 內，要放 canvas div 層。
- 補記（同日）：面板「真實地標＋關卡碼頭」與 QuizRunner flipdex 三處（初始 revealed／begin 重置／翻牌渲染）曾因 Edit 靜默丟失，已於 80ec616／482c2e4 補上；最終 bundle index-DnVZPJ5H.js 線上一致，線上 Playwright 回歸 25/25（地標章 15、面板地標 3、碼頭 2 並可導航 /classroom/duo、雙重奏兩段流程、閃電接力 mixed、翻牌圖鑑翻牌、舊路由 6 條相容、Hub 六卡、無 pageerror）。

## 2026-09-19 全站現代學生風格裝潢
- 審計：Playwright 截圖 14 個主頁面（home/practice/battle/review-hub/weekly-quiz/gallery/expedition/camp/badges/treasure/learning/community/tavern/features），battle 為刻意夜戰主題、tavern 為木質主題保留，其餘做加法升級。
- 全域（index.css 附加區「現代學生風格裝潢」）：暖橘 ::selection、細緻海藍捲軸（webkit+Firefox）、全站 :focus-visible 海藍光圈、答題選項 hover 右移光條＋選中投影、community 卡片圓角陰影＋漸層進度條、badges-wall 金色暈染底。
- Hub 頁（HubPages.css 附加區）：.hub-title 品牌漸層文字（emoji 彩色字形不受 text-fill 影響）、.hub-card 20px 圓角＋加深 hover 浮起、.hub-card-icon 由單一淡灰藍改為五色品牌漸層輪替（nth-child 5n 週期：海藍/暖橙/苔綠/金黃/紫）＋hover 縮放微旋轉、hub-tab hover/on 品牌化。
- 插圖：BxEmptyState 加入琵琵桌寵（/pipi/idle/frame-01.webp 探頭在插圖右下，bx-empty__art-row + bx-empty__pipi，drop-shadow＋浮動動畫，prefers-reduced-motion 關閉）——全站空狀態（地圖面板、徽章牆、背包等）一處改全站生效。
- 驗證：tsc 0 錯、1119 tests 綠、bundle index-DWCQIRro.js / index-DQZq46C7.css 線上一致；線上截圖複查 expedition/community/badges 漸層晶片、圓角卡片、琵琵入鏡全部生效。
- 踩坑：本機 bash 與 host 檔案視圖有同步延遲，grep 空結果可能是延遲而非編輯丟失——以 build 產物與 Grep 工具雙重驗證。

## 2026-09-19 小寶 v5 夥伴系統（派任務＋飾品衣櫥＋板塊事件匯流）
- 背景：遠端已把桌寵從琵琵（黑面琵鷺 sprite）整個換成「小寶」貓耳人形（5 套職業套裝 /pipi/outfits/*.webp、路線自動換裝、每日簽到、加油打氣、擊掌、專注模式、手機長按選單）；本輪在其上疊加 WorkBuddy 貓派任務式系統，rebase 時 PipiPet.tsx 以遠端小寶版為基底手動合併（保留全部小寶功能）。
- 新模組 client/src/game/pipiCompanion.ts（純邏輯＋10 個單元測試）：
  - 每日任務：PIPI_QUEST_POOL 7 種（答題 5/10 題、教室遊戲 1/2 場、地標 1/3 個、週測 1 次），selectDailyQuests 依日期種子 LCG 確定性選 3 個（同一天同一組），跨日自動重置；storage key pipi-quests-v1。
  - 事件匯流：recordPipiEvent(type) 由各板塊呼叫 → 推進進度 → window CustomEvent「pipi-quest」廣播；claimPipiQuest 領獎（不重複領）；claimableQuests 查可領。
  - 飾品衣櫥：6 件飾品（學士帽🎓/小魚項鍊🐟/墨鏡🕶️/望遠鏡🔭/慶祝帽🎉/圍巾🧣），解鎖條件＝好感度 50/120/250、互動 40 次、任務 3/7 個；飾品以 emoji 疊層（.pipi-costume-<slot> hat/face/neck/back，em 隨寵物縮放）疊在套裝 webp 上，可多件同戴；存 pipi-worn。
  - 獎勵入帳：claimQuest 金幣寫回 RPG 狀態（loadRpgState/saveRpgState coins）＋好感度。
- 板塊接入點（5 處）：ClassroomPlay.updateBest → game-complete；BattleScene 主戰答題與捕捉答題 → answer-correct（correct 時）；QuizModal 島嶼答題 → answer-correct；WeeklyQuizCard 提交成功 → weekly-quiz；TaiwanMainNavigationMap 島嶼按鈕 → map-visit。
- PipiPet.tsx（v5）：選單新增任務看板（可領數提示）／飾品衣櫥（x/6）／跳舞🎵轉圈🌀跳跳🦘（CSS anim-dance/spin/hop 疊加）；任務看板與衣櫥面板（進度條、🪙💖獎勵、領取按鈕金光 ready 態、已領灰化）；互動表情 emote（點擊😍/雙擊🥰/答對🤩/答錯😯/丟擲😵）；進站 9 秒與跨頁時可領獎勵提醒；pipi-quest 事件到達時慶祝泡泡。
- 修 bug：右鍵/長按/☰開選單時收起其他面板避免遮擋；選單項目 19 個超過視窗高度 → .pipi-menu max-height min(70vh,560px) 可捲動。
- 驗證：tsc 0 錯、1129 tests 全綠（+10 pipiCompanion）、build 成功；本機 Playwright 冒煙 11/11（寵物/選單/看板 3 列/衣櫥 6 卡/跳舞 anim/注入進度後領取→已領取/無 pageerror）。
- 踩坑：並行 session 同時 push（12c1f72→a4e4dac→83d3c8d），push 兩次被拒需 rebase；bash 與 host 檔案視圖延遲持續存在，驗證一律以 Grep 工具＋build 產物為準。

## 2026-09-19 小寶 v6 生動感升級
- 對標 WorkBuddy 貓的活潑度，補齊 idle 微行為（86d3902）：
  1. 隨機眨眼：每 3.2–7.4s img scaleY(0.9) 壓扁一下（.pipi-pet.blink）。
  2. 隨機微動作：每 9–18s（idle 且無泡泡時）隨機歪頭 micro-tilt／扭一扭 micro-wiggle／原地小跳 micro-hop，各約 0.95s。
  3. 走路搖擺：roaming 移動時 img 左右 rotate ±5°（waddle），不再純滑行。
  4. 滿級光環：好感度 Lv3「寶島守護者」時 .pipi-pet.lv-3::before 金色呼吸光環（z-index:-1 墊在精靈下）。
  5. 連點彩蛋：1.5s 內連點 3 下 → 😤「喵嗚～戳癢了啦！」（tapTimesRef 滑動窗口）。
  6. 說夢話：睡覺時每 8–15s 冒 💭＋夢話泡泡。
- 驗證：tsc 0 錯、1129 tests 綠、本機 Playwright 7/7（lv-3 class、pipi-aura、blink、😤、micro- 均觀察到，無 pageerror）、線上 bundle index-B7x7Bisi.js hash 一致、線上同套 7/7 通過。
- 備註：待機呼吸（pipi-breathe）與點擊 bounce 為遠端小寶版既有，v6 只做加法。

## 2026-09-19 首頁航海圖 v7 淨空版（太閤／大航海風）
- 需求：首頁台灣地圖去雜物、純展示用；船實際航行到所選島；點島在外側展開「系統對話框」；回饋對話直接顯示在地圖上。commit：4d66867 + e15e8d5（rebase 到並行 6ad35aa 之後，Home 改回互動式 v7 地圖；TaiwanLandmarkMap.tsx 保留為備用元件但 Home 不再使用）。
- TaiwanMainNavigationMap.tsx：
  - 新增 HOME_PORT {x:248,y:365} 與 ISLAND_PORTS（language 402/52、math 336/292、social 330/540、science 706/384、english 148/300，viewBox 0 0 1000 620）。
  - 船以 SVG transform translate＋1.9s cubic-bezier 過渡真正「航行」到被點島的港口；關閉對話框時航回 HOME_PORT；首次渲染不播動畫。
  - 移除全部 15 個 .taiwan-map-landmark 釘選、「我的船標」標籤、島嶼的區域/星級/景觀小字（只留圖示＋名稱＋sr-only＋旗子＋補給星章）。
  - 背包＋海風傳聞移出畫布進 header .taiwan-map-tools；加強/隨機冒險獎勵改為跟船的 .taiwan-map-speech 泡泡（含尾巴、taiwan-speech-pop 動畫、操作按鈕）。
  - 關鍵：移除 onStartIslandQuiz prop，島嶼 onClick 一律 toggleIsland(id)（舊版會繞過對話框直接跳答題）。
  - 版型：新 .taiwan-map-layout grid（地圖 minmax(0,1fr) ＋ 對話框 minmax(19rem,23rem)）；.taiwan-island-panel 為 sticky 雙邊框羊皮紙「太閤」風對話框，≤900px 退回單欄。
- 驗證：tsc 0 錯、1129 tests 綠、build 成功；本機 Playwright（map-v7.mjs）：landmark=0、船標=0、畫布內背包/傳聞=0、tools 在 header、點 math 船 248/365→336/292、對話框在地圖右側、關閉回港、無 pageerror。測試前須關閉 .daily-signin-modal（Escape）。
- 線上：bundle index-BCdIDk2G.js 與本機 dist hash 一致。

## 2026-09-19 首頁地圖 v8 格狀模塊版（PaGamO 式）
- 需求：地圖太空、要有 PaGamO 的格狀模塊感、方便日後加地標/活動；船移除跳動。commit 2b4de92（rebase 到遠端小寶表情更新 a49f12c 之上）。
- TaiwanMainNavigationMap.tsx：整塊台灣本島 SVG path 改為 16×10 格線（MAP_TERRAIN 字串遮罩，X=陸地模塊）；新增 exported：MAP_GRID_COLS/ROWS、MAP_TERRAIN、mapCellCenter/mapCellPercent、MapCellFeature 型別、MAP_CELL_FEATURES 登記處（現有 5 地標＋1 活動預備格 demo；日後加地標/活動只要在這裡加 col/row 一筆）。島嶼改為格線上的板塊模塊群（ISLAND_CELLS：main 主格放按鈕、cells 同色領土格、port 海面停靠格）；ISLAND_ROUTE_PATHS 改為沿海外海航道折線；HOME_PORT=(2,6)、各島港口皆海域格。地區標籤重新定位（北部移到 700,78）。
- CSS：新增 .taiwan-map-cell-sea（虛線淡藍海格）/.taiwan-map-cell-land（米黃陸模塊）/island-cell-<id>（五科領土色）/.taiwan-map-feature（地標章，activity 虛線框）；島嶼按鈕縮成格內尺寸（6.6%×10.6%、flex column、字級 clamp）；移除 taiwan-boat-bob/rock 全部跳動動畫（船平穩航行）。
- 驗證：tsc 0 錯、1129 tests 綠、build 成功；本機 Playwright map-v8.mjs 14/14（格線 160、陸模塊 47、島按鈕在格線座標、6 個地標章、船母港 (170,400)→數學港 (350,160)→關閉回港、glyph animationName=none、對話框在地圖右側、無 pageerror）。「回到航海圖」真實點擊可關閉（先前自動化失敗是 fresh-profile 每日簽到 backdrop 反覆重現攔截指標，非產品 bug；預 seed localStorage xueSignIn 可避開）。
- 線上：bundle index-DgekqrsA.js 與本機 dist hash 一致。

## 2026-09-19 首頁地圖 v9 六角格放大版（PaGamO 式）
- 需求：地圖擴大十倍以上、格子改六角形（更像 PaGamO）、貼圖要有海／綠地／樹／地形區分。commit 3f95d64。
- TaiwanMainNavigationMap.tsx：
  - 格線 16×10 方格 → 40×26 pointy-top 六角格（1040 格＝6.5 倍；陸地模塊 47→188）。HEX_SIZE=13.5、HEX_WIDTH=√3·s、奇數行右移半格；mapCellCenter/mapCellPercent 改六角座標。
  - MAP_TERRAIN 為 20×13 遮罩的字元加倍放大（26 行×40 字，land=188 已驗證）；改地形只改這裡。
  - 地形貼圖（buildMapHexes，模組載入時建一次）：海分 deepsea/shallow（鄰陸為淺水）＋確定性 hash 浪花；陸地海岸帶沙岸（adjacentLand<6）、內陸 hash 分草原（含灌木/樹）/森林（2 樹）/山地（峰＋雪頂）。hexTree() 畫小樹。
  - 島嶼板塊群 ISLAND_CELLS、港口、ROUTE_WAYPOINTS（海域格座標→載入時轉折線）、MAP_CELL_FEATURES（5 地標＋1 活動預備格）全部重定位到新格線。
- CSS：.taiwan-map-hex-* 地形色（海 #9fcde3/#c3e4f2、草 #a9d489、森 #8cc774、山 #cbc4ad、沙 #ecdca6、五科領土色）；島嶼據點按鈕 7.6%×12.4%；layout 對話欄縮為 minmax(15.5rem,18rem)。
- 首頁放大：HomeDashboard.css 讓 .taiwan-map-layout height:100%（畫布鋪滿背景層，畫布底色改海藍漸層融入海洋）、島嶼對話框改 absolute 浮右上（min(21rem,…)）。
- 驗證：tsc 0 錯、1129 tests 綠、本機＋線上 Playwright map-v9.mjs 各 14/14（1040 hex、land 188、地形多樣性 deep770/shallow82/forest44/mt18/sand53、浪花 166、島在六角座標、船母港 (131.2,298.5)→數學港 (400.1,197.3)→回港、glyph 無動畫、對話框浮右上 panel.x=1250、無 pageerror）。
- 線上：bundle index-U7IMpLP-.js 與 HEAD 精確重建一致（注意：本機 working tree 有並行 session 的 PipiPet WIP，比 hash 前要先 stash 再 build）。
- 附帶：commit 3f95d64 因 stash pop 順序意外把並行 session 的 PipiPet.css/.tsx/Tavern.tsx WIP 一併提交（tsc/1129 測試/build 全綠，無破壞；該 session 後續注意 pull）。

## 2026-09-19 倍數防衛戰修復（新手教學＋玩法）
- 需求：測試保衛戰有 bug、特別是新手教學、全面檢測。commit f46c500（只含 MeteorGame.tsx＋classroom.css；working tree 另有並行 session 的 PipiPet＋地圖波光 WIP 未提交，勿混入）。
- 修了 5 個 bug：
  1. 教學步驟 3（拖拽）氣泡不可拖 → 完整 pointer-capture 拖拽（tutDrag/tutDragActiveRef/tutMovedRef；移動 >8px 視為拖、up 時在槽 bounds 內→finishTutorial，沒移動→onClick 當點選）。
  2. 教學步驟 2（劃切）hover 就過關 → 改 field 層 onPointerDown（tutStep===2 記 tutSlashRef）＋onPointerMove elementFromPoint 命中 .md-meteor 才 advanceTut(3)，須真的按住滑過。
  3. 拖拽/混合波托盤清空後要等滿 42 秒才過波 → 主迴圈加提前 endWave 條件（allSpawned＋場上清空＋trayCleared＋elapsed>2500ms），實測 2.5s 過波。
  4. 教學回收槽點選後無高亮 → md-tut-slot 加 is-active 條件 class。
  5. .md-tut-slot 流式排版撞到教學氣泡 → position:absolute; bottom:14px；教學氣泡從 md-static 改新 class md-tut-bubble（absolute＋translate(-50%,-50%)，避開 md-static 的 left/top auto !important 覆寫）。
- 驗證：tsc 0 錯、1129 tests 綠、build 成功。本機 Playwright（vite preview :4173）：meteor-v2.mjs 教學 16/16（步驟 1–5 真實手勢、拖拽＋點選兩條路徑、錯位拖拽被拒、開局、無 pageerror）；meteor-v2b.mjs 深度玩法 6/6（拖拽波 2.5s 提前過波＋能源存活、點擊波實點得分 score=45、無炸彈誤觸）。
- 陷阱：meteor-v2b 舊版「tap 模式 score=0」是測試腳本 parseInt(banner) 對「第 1 波：2 的倍數」回傳 NaN 所致，不是遊戲 bug；解析要 regex /(\d+)\s*的倍數/（同時是→10）。freshPage 偶發定位逾時，加重試＋reload 容錯。

## 2026-09-19 移除首頁台灣地圖與航海玩法（整套下架）
- 需求：刪除首頁地圖與相關玩法，與整體預期不符合。commit 54dd7a0（淨刪 3561 行）。
- 移除範圍：
  - Home.tsx：home-dashboard-map-layer 整層移除（TaiwanMainNavigationMap、journal/randomAdventureRouteReward/weeklySuggestion 相關 state 一起清）。
  - /map 頁（StudentMap.tsx）：只拆台灣地圖區塊，學習關係圖/觀測站進度/今日推薦/學習指南全保留。
  - 刪除檔案：TaiwanMainNavigationMap.tsx/.css/.test.tsx/.css.test.ts、HomeDashboard.css.test.ts（斷言全是地圖版面）。
  - HomeDashboard.css：map-layer 全部規則、home-dashboard-island-in keyframes、taiwan-map-reinforcement-suggestion 清掉。
  - 契約測試改寫：mobileEditionAssets.test.ts、HomeLobby.contract.test.ts 改為斷言「不再有地圖」；HomeDashboard.test.tsx 移除 mock 改查 not.toBeInTheDocument。
- 刻意保留（休眠，無 UI 引用）：mapVictoryProgress（rpgStorage/rpgTypes，BattleScene 仍會寫入）、mapReinforcementReward（TeacherParentSummary 仍讀）、randomAdventureRouteReward（PaperExam 仍會發）、TaiwanLandmarkMap.tsx（本來就無人引用）。之後要徹底清這些再開一個 task。
- 驗證：tsc 0 錯、1102 tests 綠（183→180 檔，少的正是刪掉的地圖測試）、build 成功；本機 Playwright map-removal.mjs 9/9（首頁無 map-layer/hex、狀態與模式樞紐正常、/map 頁保留關係圖、無 pageerror）。

## 2026-09-19 下架燈塔指航中心（卡牌遊戲整體刪除）
- 需求：把卡牌遊戲整體刪除。commit 44ee897（33 檔，淨刪 2710 行）。保留 /battle（答題戰鬥）。
- 刪除檔案（21）：pages Tavern.tsx/.css/.test、CardCollection.tsx/.css/.test；components TavernBar、TavernCompanion、TrumpDuelBoard.tsx/.css/.test、AdventureViewer.tsx/.test、CardArt.tsx/.test；game tavernKeeper、cardCollection、trumpDuel（各含 test）。
- 入口清理：App.tsx 四條 /tavern* 路由＋lazy import；首頁模式樞紐燈塔卡（剩 3 卡）；homeFeatureDirectory、featureSearch（含 id union 型別）、TreasureHub 卡牌入口＋文案、TopNavigation treasure activePrefixes 的 /tavern；titleCatalog 移除 4 個稱號（牌局好手/潮汐牌王/燈塔嚮導/古籍尋跡者，目錄 21→17，歷史存檔已取得稱號仍正常顯示）；LeagueArena 排名獎不再 addCardToCollection。
- 刻意保留：/battle（BattleScene＋battle* 模組）、trumpCardData（adventureChapters 只 import type CardTheme；守護者遠征 RpgAdventure/adventureEngine 依賴）、adventureChapters、歷史玩家的卡牌收藏與稱號存檔（無 UI 顯示，休眠）。
- 測試同步：App.routes.test（tavern 路由改斷言不存在）、titleCatalog.test（21→17＋新增下架斷言）、TreasureHub.test（卡牌入口改 not.toBeInTheDocument）、Home.modeHub.test（四入口→三入口）。
- 驗證：tsc 0 錯、1042 tests 綠、build 成功；本機 Playwright tavern-removal.mjs 10/10（首頁無燈塔卡、四條 /tavern* 無 UI、藏寶圖無卡牌入口、/battle 正常、無 pageerror）。

## 2026-09-19 下架守護者遠征
- 需求：守護者遠征刪除。commit be37872（25 檔，淨刪 1469 行）。/battle、/expedition 保留。
- 刪除（15 檔）：pages/GuardianExpedition.tsx；components RpgAdventure.tsx/.test、MainlineGuardianPanel.tsx；game adventureChapters、adventureEngine、adaptiveBoss（含 .guardian.test）、guardianCeremonyFeedback、trumpCardData（各含 test）。trumpCardData 因唯一使用者 adventureChapters 一併刪。
- 入口清理：App.tsx /guardian＋/guardian-expedition 路由＋lazy import；homeFeatureDirectory、featureSearch（含 id union）；遠征頁「今日任務」卡改指向 /battle；Badges boss-1/boss-4 hint 改 BATTLE_HINT、rare-titles-5 改 EXPEDITION_HINT（/expedition）；titleCatalog 稀有遠征稱號 hint 改 /expedition（稱號本身由 /expedition 稀有怪物授予，保留）。
- 刻意保留：mainlineFeatures（ParentLearningView/WeeklyQuestPanel/pinCloudSync 仍用）、rpgBattle/battle* 模組（BattleScene 用）、expeditionContent/expeditionUnlocks（Expedition 頁用）、academyExpansion 的 guardian 行為函式（BattleScene 引用的 worldStateForTime 同檔，暫不拆）。debugGate 的 guardian 只是教師解鎖閘命名，無關。
- 測試同步：App.routes.test、featureSearch.test、Expedition.test 改斷言守護者不存在／今日任務指向 /battle。
- 驗證：tsc 0 錯、1014 tests 綠、build 成功；本機 Playwright guardian-removal.mjs 6/6（/guardian 無 UI、遠征頁無守護者卡、今日任務→/battle、無 pageerror）。

## 2026-09-19 我的教室桌寵品質寵物「燈寶」（燈台指航中心小燈靈）
- ClassroomPet.tsx（新）：純 SVG 手繪燈寶掛「我的教室」右下角浮窗（fixed 右 12 底 84）。對標桌寵：待機呼吸（1.5% 縱伸+橫向補償，底錨不漂移）+ 眨眼（3.2–6s 隨機，眼睛 ry 收細成線）；互動三式——摸頭（開心回彈 380ms 壓縮—超調—復位＋ok 音＋好感 +1）、餵星星糖（⭐ 飄入＋win 琶音＋好感 +2）、戳戳點燈（燈芯火焰＋sparkles 閃光＋flip 音＋好感 +1）；每互動皆有角色化說話氣泡（7 句隨機台詞，2.4s 消退）。
- 好感度系統：localStorage `xue-pet-bond-v1`（bond/pats/feeds/lights），每 5 點升一級最高 Lv.10；面板顯示等級進度條與三互動計數，可展開/收合；尺寸四檔迷你/小/標準/大（0.65/0.8/1/1.2）循環切換。
- 三皮適配：memphis 黃底黑邊硬陰影、concise 白底紫字、classic 暖木；reduced-motion 全關動畫；520px 手機縮 0.9、避開底部導覽。
- 測試：QuizRoom.test.tsx 加 2 例（燈寶出現＋摸頭寫入 bond=1/pats=1＋氣泡；餵糖+2、點燈+1 合計 bond=3）共 8 例綠；tsc 0 error、vite build OK（index-Bj-A9BJe.js）。
