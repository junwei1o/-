# 寶島探險家 全站內容改善方案（2026-09-20）

> 範圍：動畫微課以外的**全部站內內容**（題庫、教室玩法、首頁、無障礙、效能、測試、休眠程式）。
> 方法：先做可量化盤點（不是憑感覺），再分級排程。所有數字皆為本次實測。

---

## 1. 盤點數據（實測）

| 項目 | 數值 | 狀態 |
|---|---|---|
| 頁面（pages/*.tsx） | 42 | — |
| 元件 | 125 | — |
| 路由 | 34 | — |
| 題庫題數 | 1090（數學 301／自然 274／社會 272／國語 243） | ✅ 無重複題幹、無缺解析 |
| 題庫年級 | 3–6 年級（291/287/259/253） | ⚠️ **完全沒有國中題庫** |
| 知識點標籤 | 1045 組／1090 題（1044 組只有 1 題） | ⚠️ 粒度過細，無法做弱點聚合 |
| 正確答案選項索引 | index 0＝**733（67%）**、1＝267、2＝77、3＝13 | 🔴 嚴重偏斜 |
| 選項隨機化覆蓋 | `shuffleQuestionOptions` 僅用於 paperExam / questionBank / CommunityHub / BattleScene | 🔴 教室 6 玩法、PKArena、ReviewHub 等未套用 |
| 測試 | 166 檔、1026 個 `it()` | ⚠️ 全量 `vitest run` 會 hang，只能分檔跑 |
| 簡體字混入（程式＋題庫） | 19 處（其中 4 處在題庫、學生看得到） | ✅ **本次已全數修正** |
| SVG 無障礙 | 23 個 `<svg>`，僅 13 個有 `aria-label` | ⚠️ |
| reduced-motion | 19 個 CSS 檔有降級區 | ✅ 覆蓋不錯 |
| 首屏主包 | `index` 1.5 MB（gzip ≈474 KB）、`charts-vendor` 384 KB、`index.css` 540 KB | ⚠️ 偏大 |
| 下架殘留休眠程式 | `TaiwanLandmarkMap`×1、`mapVictoryProgress`×3、`randomAdventureRouteReward`×1、`academyExpansion`×2 | ⚠️ 待清理 |

### 本次已即刻修正（commit 隨本文件）
簡體字 19 處 → 繁體，含學生可見內容：
- `data/taiwan_curriculum_500.json`：兩處誤用簡體寫法（時段、產業級別）已改為繁體
- `data/targeted_practice.json`：同上誤用簡體寫法 2 處已改為繁體
- 程式註解：`HomeContactCard.tsx`、`useComposition.ts`、`targetedPractice.ts`、`announcements.test.ts`
- 內部調研文件 `docs/game-directions-2026-09-12.md` 仍有 89 處簡體（**僅內部文件、學生看不到**，建議後續批次轉換或標註為「簡體原件」）

---

## 2. P0：立刻該做（影響學習正確性）

### P0-1 出題選項沒有隨機化 → 學生可「選第一個」作弊 🔴
- **證據**：1090 題中 67% 正確答案落在 index 0；`shuffleQuestionOptions`（`client/src/lib/optionRandomizer.ts`）只被 4 處使用。
- **未套用熱點**：`components/classroom/QuizRunner.tsx`、`RushRunner.tsx`、`RelayMatch.tsx`、`OnionAcademyGame.tsx`、`OnionLesson.tsx`、`pages/PKArena.tsx`、`ReviewHub.tsx`
- **做法**：在上述出題點統一於「取出題目後、render 前」呼叫 `shuffleQuestionOptions(q)`（它會同步修正 `answer` 與 `strongDistractor` 索引）；錯題本/回顧頁若需穩定顯示則**不**洗牌（保持一致，避免同一題每次位置不同造成混淆）。
- **風險**：既有元件測試可能斷言選項順序 → 需同步更新（預估 5–8 檔）。
- **驗收**：新增測試「教室玩法連續取 200 題，正確答案索引分布各選項 25%±8%」。

### P0-2 題庫只有國小 3–6 年級，與國中動畫微課斷層
- **證據**：年級分布 3/4/5/6；國中（七～九）0 題。但動畫微課已上線 4 堂國中課（負數、一元一次、細胞、光合作用），學生看完動畫卻沒有對應練習。
- **做法**：
  1. 先補「微課配套題」：每堂國中動畫課配 10 題（共 40 題），用 `data/supplement_*.json` 既有擴充機制；
  2. 再補七年級核心章節（有理數、一元一次、基礎幾何、細胞／生物）各 30 題；
  3. 最後視需求往八、九年級擴（理化：電路、浮力）。
- **風險**：出題品質（台灣課綱用語）需劉老師審題；建議先做 40 題配套、小步驗證。

### P0-3 學習流程缺少「拋問題→思考→小結」（詳見 `docs/onion-academy-hot-lessons-design.md`）
- 與 P0-2 同源：內容有了，但流程仍是「播完→考」。建議：互動提問幀、知識小結頁、三級提示、音效。

### P0-4 LINE 推播尚未啟用（待老師操作）
- 程式已上線，webhook 回 501；需在 Render 後台補 `LINE_CHANNEL_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN` 後重新部署（助理無權限）。

---

## 3. P1：兩週內（品質與維運）

| # | 項目 | 做法 | 位置 |
|---|---|---|---|
| P1-1 | 建立「繁體用字」CI 檢查 | 新增 `scripts/check-traditional.mjs`（或 python），掃 `client/src`＋`data/*.json`，命中簡體字即 exit 1；接到 pre-commit 或在 push 前手動跑 | 新增檔案 |
| P1-2 | 修復全量 `vitest run` hang | 用 `--testTimeout=5000 --reporter=verbose` 逐目錄二分定位（已知定時器類測試嫌疑最大），修掉後恢復單指令全量 | `vitest.config.ts` 或該測試 |
| P1-3 | 清理下架殘留休眠程式 | `TaiwanLandmarkMap.tsx`、`mapVictoryProgress`、`randomAdventureRouteReward`、`academyExpansion` guardian 行為（注意 `BattleScene` 仍引用同檔，勿整檔刪） | 多檔 |
| P1-4 | SVG 無障礙補齊 | 23 個 `<svg>` 補 `role="img"`＋`aria-label`（或 `aria-hidden` 若純裝飾）；10 個 `<img>` 檢查 `alt` | 多檔 |
| P1-5 | 知識點標籤中階化 | 目前 1045 組／1090 題（一題一組）無法聚合弱點；建議加第二層 `topicTag`（如「分數加減」「水循環」），每 tag ≥8 題，弱點分析才有意義 | `data/*.json`＋`lib/` |
| P1-6 | 首頁「聯絡老師」元件 | 承接既有需求：LINE QR＋電話＋班級公告（已有 `HomeContactCard.tsx`，確認是否承接完整需求） | `HomeContactCard.tsx` |

---

## 4. P2：體驗與效能（有空再做）

| # | 項目 | 說明 |
|---|---|---|
| P2-1 | 首包瘦身 | `index` 1.5MB：把 `charts-vendor`(384KB) 改為路由懶載入（僅報表頁需要）；`index.css` 540KB 建議按頁面拆 CSS chunk |
| P2-2 | 首頁內容更新 | 首頁目前僅顯示「昨天沒有留下航行紀錄」等靜態文案；可放「本週學習重點／老師公告／推薦微課」 |
| P2-3 | 錯題回顧體驗 | `ReviewHub` 若洗牌則同題位置每次不同；建議保留原順序＋標註「當初你選了哪個」 |
| P2-4 | 文件整理 | `docs/game-directions-2026-09-12.md` 89 處簡體；`todo.md`/`todo-cffgluef.md`/`ideas.md` 等歷史檔建議封存到 `notes/` |
| P2-5 | 決策：是否發展國中路線 | 若題庫與微課都往國中走，建議首頁/選課頁加入「國小／國中」分流，否則國中生進站會找不到內容 |

---

## 5. 四週路線圖

| 週 | 目標 | 產出驗收 |
|---|---|---|
| W1 | P0-1 選項隨機化全面套用 ＋ P1-1 繁體檢查腳本 | 教室玩法答案分布測試通過；`node scripts/check-traditional.mjs` 零命中 |
| W2 | P0-2 國中微課配套 40 題 ＋ 知識點中階標籤試點 | 4 堂國中課各有 10 題可練；弱點分析可用 |
| W3 | P0-3 學習流程改造（互動提問＋小結＋三級提示＋音效） | 洋蔥微課可中途回答、看完有小結 |
| W4 | P1-2/P1-3/P1-4（測試修復、休眠清理、SVG 無障礙） | 全量 vitest 可跑完；休眠檔清除；axe 掃描零重大缺失 |

---

## 6. 每次改動的標準動作（DoD）

1. 改動後：`tsc -p tsconfig.json --noEmit` 零錯誤
2. 分檔跑 vitest（全量仍會 hang，見 P1-2）
3. `vite build` 通過且無 CSS 警告
4. push 後比對線上 bundle hash，確認新程式與新 CSS 皆已部署
5. `docs/handover.md` 追加一小節（做了什麼、風險、已知限制）
6. 若動到題庫：重跑「答案索引分布／重複題／缺解析」三項檢查

---

## 7. 本方案**不做**的事

- 不做真人教師影片、不做外部平台跳轉（維持 local-first 離線可用）
- 不引入付費／版權內容（洋蔥學園課程僅作為方法論參考，題目與動畫全部自製）
- 不為了覆蓋率而一次重寫整包題庫；採「配套題先行、小步驗證」
