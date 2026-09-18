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

## 2026-09-18 我的教室第八種玩法「倍數防衛戰」上線
- 數學五上「倍數與因數」隕石攔截玩法（gameId=meteor，路由 /classroom/meteor），hub 第 8 張卡（Shield icon、#3e7cb1 海藍、mc-tilt-r），標題改「自由玩法（8 種新玩法）」。參考新北市五上數學 2-1「倍數防禦基地」玩法改造為點擊版（免拖曳、觸控友善）。
- 邏輯層 classroomBank.ts：buildMeteorWaves(count=3) 三波固定考 2 的倍數→5 的倍數→同時是 2 和 5 的倍數（=10 的倍數）；每波 16 顆隕石（7 目標＋9 干擾，值域 10–99，delay 間隔 2.2s、落地 3.8–5.2s、落點 12–88%）；第三波干擾全是「僅 2 的倍數或僅 5 的倍數」陷阱；METEOR_WAVE_TIME=42s；meteorStars（0 失誤 3 星／≤4 二星／其餘 1 星）。
- MeteorGame.tsx：start/play/waveEnd/result 四階段；200ms 主迴圈推進（腳本出隕石、進度定位 top 6→84%、漏接判定）；攔截 +10 分＋回 1 能源（上限 15）、誤觸 −1、漏接目標 −2，能源歸零提前結束（lost 結果頁 1 星）；波次結束揭曉「個位數特徵」教學註記（2：個位 0/2/4/6/8；5：個位 0/5；同時是 2 和 5：個位必 0）；md-flash 雙回饋浮條＋ok/no/win 音效；結果頁星等/攔截數/分數/新紀錄，最佳紀錄存 xue-classroom-best-v1（meteor: {stars,score,correct,total}）。
- 樣式 classroom.css：md-* 全套（md-field 天空漸層沙地、md-meteor 立體圓石 top transition、md-energybar 能源條低量轉紅、md-base 基地條、md-pop keyframes、520px 手機微調、prefers-reduced-motion）。
- 測試：classroomBank.test.ts +3（三波結構/第三波陷阱干擾/meteorStars）、ClassroomComponents.test.tsx +4（攔截加分回能＋誤觸扣能/漏接扣 2 能/三波全攔截 3 星 onBest 21/21/能源歸零提前結束）、QuizRoom.test.tsx 改 8 張卡；全量 182 檔 1101 tests 綠、tsc 0 error、vite build OK。
- 踩坑：測試選隕石要限定「已出場」的前兩顆（腳本 delay 未到的不在 DOM）；能源歸零測試改成 500ms 步進＋點掉全部干擾＋目標全漏接（−9−14 > 15）才穩定觸發。
