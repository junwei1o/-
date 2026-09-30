# 題型分類（全站設計依據）

> **給所有 AGENT：設計任何與題目相關的功能前，先讀這份。**
> 建立：2026-09-30｜維護：任何新增／修改題型者必須同步更新本檔與 `client/src/lib/questionTypes.ts`
> 程式側註冊表：`client/src/lib/questionTypes.ts`（可程式化引用，勿只讀本文件）

## 0. 為什麼要有這份文件

站上所有功能——出題、組卷、批改、錯題整理、推薦、排行榜、UI 呈現——**都以題型為前提**。
題型不同，可自動評分的程度、資料欄位、UI 互動、公平性風險全都不同。

**規則：先確定題型，再設計功能。** 不要用「選擇題」的假設去套所有題目。

---

## 1. 分類總表

| id | 題型 | 現況 | 可自動評分 | 主要模組 |
|---|---|---|---|---|
| `single-choice` | 選擇題（單選） | ✅ **已實作**（3249 題） | 是 | `lib/questionBank.ts` |
| `true-false` | 是非題 | ✅ **已實作**（517 題） | 是 | `lib/questionBank.ts` |
| `matching` | 配對題 | ✅ **已實作**（獨立模組） | 是 | `lib/matchingBank.ts` |
| `fill-blank` | 填空題 | ❌ 未實作 | 是（需正規化） | — |
| `short-answer` | 簡答題 | ❌ 未實作 | 部分（關鍵詞／需人工） | — |
| `open-ended` | 申論・開放題 | ❌ 未實作 | 否（需人工／AI 輔助） | — |
| `passage-group` | 題組題（共用素材） | ⚠️ 部分（試卷容器已有） | 依子題型 | `lib/paperExam.ts` |
| `variant` | 變體題（同題幹不同問法） | ❌ 未實作 | 是 | 待建 |

**素材型態（正交維度，可與任何題型組合）**：文字 / 圖表 / 聽力（TTS 已接入，聽力題技術上已可行）。

---

## 2. 各題型規格

### A. `single-choice` 選擇題（單選）— 已實作

| 項目 | 內容 |
|---|---|
| 資料欄位 | `id, grade, subject, questionType:"選擇題", difficulty, curriculumDomain, learningTopic, prompt, options:string[], answer:number, explanation, knowledge:string[], area?, subjectCombination?` |
| 正解形式 | `answer` 為 `options` 的索引（0-based） |
| 評分 | 精確比對索引，自動 |
| UI | 4 個選項（是非題為 2）；選項**每次重做重新洗牌**（`lib/optionRandomizer.ts` 的 `shuffleQuestionOptionsDistinct`） |
| 設計準則 | ① 選項數固定 4（資料層已驗證）② 干擾項必須是「合理的錯」而非隨機字串 ③ 正解位置不得固定、不得與上次相同、不得與題庫原序相同 ④ 題幹不得洩漏答案 |
| 相關檔案 | `lib/questionBank.ts`、`lib/optionRandomizer.ts`、`lib/optionExpandScheduler.ts` |

### B. `true-false` 是非題 — 已實作

| 項目 | 內容 |
|---|---|
| 資料欄位 | 同選擇題，但 `questionType:"是非題"`、`options` 長度 2 |
| 正解形式 | `answer` 0/1 |
| 評分 | 自動 |
| 設計準則 | ① **不得使用「絕對化」措辭**製造陷阱（如「一定」「永遠」）② 是非題**不做選項洗牌**（`isTrueFalseQuestion()` 早退，避免空轉）③ 陳述必須獨立可判真假，不依賴上下文 |
| 已知修正 | `ffabc18`：是非題不再空轉 12 次重擲（BUG-5） |

### C. `matching` 配對題 — 已實作（獨立模組）

| 項目 | 內容 |
|---|---|
| 現況 | 左項↔右項配對，獨立題庫 `lib/matchingBank.ts`（46 KB） |
| 評分 | 自動（配對正確數／總數） |
| UI | 拖曳或點選配對；需支援觸控（≥44px） |
| 設計準則 | ① 左右項數量一致且**不得有一對一以外的歧義解** ② 配對關係必須唯一 ③ 打亂右項順序 |
| 注意 | 與選擇題共用「洗牌」概念但**不共用資料 schema**——設計時不要假設 `options/answer` 存在 |

### D. `fill-blank` 填空題 — 未實作

| 項目 | 內容 |
|---|---|
| 建議 schema | `blanks: Array<{ id, answer: string, acceptAlternatives?: string[] }>`；`prompt` 以佔位符標記空格 |
| 評分 | 自動，但**必須先正規化**：全形／半形、大小寫、前後空白、標點 |
| 設計準則 | ① 一個空格只考一個知識點 ② 提供 `acceptAlternatives` 容錯（同義詞／異體字）③ **避免需要主觀判斷的答案**（那屬於簡答題） |
| 風險 | 中文輸入法誤差、異體字（臺／台）→ 需正規化表，且要有「答對卻被判錯」的回報管道 |

### E. `short-answer` 簡答題 — 未實作

| 項目 | 內容 |
|---|---|
| 建議 schema | `answerKeywords: string[]`、`minKeywords`、`referenceAnswer` |
| 評分 | 關鍵詞命中（自動，但不精確）＋可選人工／AI 覆核 |
| 設計準則 | ① 明確告知學生「要寫出哪些關鍵詞」② 不懲罰錯字以外的表達差異 ③ 分數應為區間而非精確值 |
| 風險 | 自動評分公平性——**必須在 UI 標示這是輔助評分** |

### F. `open-ended` 申論・開放題 — 未實作

| 項目 | 內容 |
|---|---|
| 評分 | **不可自動評分**；僅能人工或 AI 輔助產生回饋 |
| 設計準則 | ① 不出現在排行榜／限時挑戰等需要即時計分的場景 ② 不得計入「正確率」等自動化指標（會污染數據）③ 若接 AI 導讀，題目內容可送 AI 但**不得含姓名／學校／班級**（見隱私框架） |
| 現況關聯 | 站上「深度反思」已有 AI 服務商導讀機制，可作為載體 |

### G. `passage-group` 題組題 — 部分（容器已有）

| 項目 | 內容 |
|---|---|
| 現況 | `lib/paperExam.ts` 提供試卷組卷與容器；**共用素材（文章／圖表）的題組結構尚未建立** |
| 建議 schema | `{ passage: { id, kind:"text"|"image"|"audio", content }, subQuestions: Question[] }` |
| 評分 | 依子題型 |
| 設計準則 | ① 子題必須**可獨立作答**（不依賴前一子題的答案）② 素材不得包含子題答案 ③ 組卷時題組**不可拆散**（同組子題須同卷同區） |

### H. `variant` 變體題（變態題）— 未實作

| 項目 | 內容 |
|---|---|
| 定義 | 同一知識點／題幹骨架，以不同問法、不同干擾項、不同情境產生多個變體 |
| 建議 schema | `{ variantOf: questionId, variantKind: "wording"|"numbers"|"context"|"inverse" }` |
| 設計準則 | ① 變體必須改變**考察角度**，不是換句話說 ② **防污染**：變體不可與原題同時出現在同一份試卷 ③ 反向題（問「何者錯誤」）需明確標記，避免與正向題混淆 |
| 用途 | 擴充題庫而不重複、測「真懂 vs. 記答案」 |

---

## 3. 跨題型的共同規則（所有題型都適用）

1. **年級適配**：`grade` 必填；內容等級上限六年級（站服務國小）。未設年級時系統以最高難度出題（見首頁閘門決議）。
2. **難度分級**：`difficulty ∈ {基礎, 標準, 挑戰}`；不得只靠題幹長度判難度。
3. **選項／配對洗牌**：可自動評分的題型，正解位置必須隨機化，且**不得與上次相同**（`shuffleQuestionOptionsDistinct` 的 `forbidden` 機制）。
4. **防污染**：同一份試卷內不得出現重複題、同一題幹的變體、或題組與其拆散子題。
5. **可重現性**：組卷需帶 `seed`（如三軸試卷的 `TriAxisProgress.seed`），恢復時同 seed 重組出同樣題序。
6. **公平性**：不得出現需要課外知識、時事、或特定家庭背景才能作答的題目。
7. **無障礙**：題目 UI 需符合既有規範——可點區 ≥44×44、色值走 token、標題層級不跳級、動畫納入 `prefers-reduced-motion`。
8. **資料驗證**：新增題目必須通過 `scripts/qc-question-bank.mts`（`pnpm qc:bank`）與 `check-traditional.mjs`（繁體用字）。
9. **指標一致性**：只有「可自動評分且正解唯一」的題型，才能計入正確率、排行榜、錯題魔王等自動化指標。

---

## 4. 給 AGENT 的設計前檢查清單

設計任何功能前，逐項回答：

- [ ] 這個功能**支援哪些題型**？其餘題型如何降級或排除？（不要默默假設全是選擇題）
- [ ] 該題型**可否自動評分**？若不可，這個功能是否還成立？
- [ ] 需要哪些**欄位**？現有 schema 有嗎？沒有的話誰負責補（題庫產生器／資料遷移）？
- [ ] **洗牌**需求？正解位置是否會被固定？與「上次排列」的比較是否正確（勿用 id 當快取鍵）？
- [ ] **防污染**：會不會把同題變體／題組子題拆到不同卷？
- [ ] **指標影響**：這個題型會不會污染正確率／難度分佈／排行榜？
- [ ] **無障礙**：觸控區、對比度、reduced-motion、標題層級都符合嗎？
- [ ] 若新增題型：**同步更新** `docs/question-types.md` 與 `client/src/lib/questionTypes.ts`

---

## 5. 新增題型的流程

1. 在本檔第 2 節新增規格（schema／評分／UI／準則）
2. 在 `client/src/lib/questionTypes.ts` 的 `QUESTION_TYPES` 加一筆（`implemented: false` → 實作後改 true）
3. 在 `lib/questionBank.ts` 的 `isValidQuestion()` 補驗證規則（若有新欄位）
4. 補題庫產生器與 `pnpm qc:bank` 檢查
5. 更新 `docs/DATA_MODEL.md` 的資料模型段落

---

## 6. 已知風險與未決問題

| # | 議題 | 說明 |
|---|---|---|
| 1 | 是非題的陷阱措辭 | 目前無自動檢查「絕對化措辭」的規則，靠人工審 |
| 2 | 簡答／申論的評分公平性 | 尚無設計；若要上線需先定義「輔助評分」的 UI 揭露方式 |
| 3 | 聽力題 | TTS 已接入（`server/lineNotify.ts` 無關；見 speech 相關 commit），但尚無聽力題 schema 與播放控制規範 |
| 4 | 變體題的防污染 | 需在組卷層加入「同 variantOf 只取一題」的規則，尚未實作 |
| 5 | 題組素材的版權 | 圖表／文章素材來源需記錄（見 `docs/astronomy_sources.md` 的做法） |
