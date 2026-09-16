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

### P3-4 文字冒險擴充
- 支線劇情、選擇分支、多結局；冒險獎勵；中斷存檔續玩。
- 現有可複用：`adventureChapters.ts`、`adventureEngine.ts`、`expeditionContent.ts`、`tavernKeeper.ts`。

### P3-5 夜間觀測深化
- 夜間專屬場景、限定事件、夜間主題（整合現有主題系統）、夜間任務獎勵。
- 現有可複用：`expeditionObservations.ts`、`environmentTokens.ts`、AstronomyQuiz 元件。

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
| `35a0691` | feat(league)：聯盟賽賽季分組/升降級/賽季獎勵（已上線） |
| `56478fa` | fix(ui)：AI 用量卡移至條件外，無班級也能看全站用量 |
| `88554c9` | feat(ai)：深度反思 token 用量統計與查詢儀表板 |
| `dc547cf` | fix(ui)：首頁 FAB 觸控熱區補足 44px |
| `2bab643` | P1/P3 補缺：導航收斂、戰鬥教學、家長弱點 Top3 |
| 更早 | `5116007`、`794af22`(P1)、`91ac391`(P2)、`39268f2`(PK)、`0be5314`(插圖) |

---

## 8. 交接總結

- **已上線且驗收**：P0、P1（英語島/PIN/戰鬥數值）、P2（教師端/全站週榜/AI 每日配額/異步 PK）、三項補缺、FAB 修復、AI Token 用量統計、聯盟賽完整賽季系統（分組/升降級/獎勵）。
- **本次待推送**：卡牌系統 48 張＋屬性相克＋聯盟限定卡（程式碼與測試就緒，待最終全量測試確認）。
- **後續路線**：P3-3 夥伴怪獸 → P3-4 文字冒險 → P3-5 夜間觀測。
- **需使用者操作**：LINE 兩個 Render 環境變數。
- 新接手者只要依第 4～6 節的守則與流程，即可直接繼續迭代。
