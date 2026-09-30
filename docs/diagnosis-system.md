# 學生診斷系統規格（診斷 × 科目適配）

> **給所有 AGENT：設計任何與批改、錯題、診斷、推薦相關的功能前，先讀這份。**
> 建立：2026-09-30｜維護：修改診斷維度或科目設定者必須同步更新本檔與程式側
> 程式側：`client/src/lib/studentDiagnosis.ts`、`client/src/lib/subjectConfig.ts`
>
> **⚠️ 本檔與 `docs/question-types.md` 的分工（不要重複、不要漂移）**
> - **題型規格**（題型清單／各題型 schema／支援矩陣／降級規則）→ 見 **`docs/question-types.md`**，本檔不重複
> - **診斷與科目**（信心演算法／統計層級／洞察／科目適配／整合流程）→ 本檔
> - 兩份文件共用同一組程式註冊表：`questionTypes.ts`（題型與四態）＋ `subjectConfig.ts`（科目）
> - 過去曾因「同一件事寫兩遍」造成文件與程式漂移，**請以交叉引用取代複製**

---

## 1. 診斷系統

### 1.1 核心立場

**「完全歸類量化」做不到，但「高覆蓋率 + 可量化 + 可追蹤」做得到。**
差距來自題型限制與樣本量，不是演算法。三步：

1. **標準化 `knowledge` 標籤**（地基，見 §5 風險 #1）
2. **補上作答行為記錄**（用時／重做／改答）
3. **用信心分數取代單純正確率**（區分「真懂」與「猜對」）

### 1.2 信心分數演算法（已實作）

```
confidence = raw × sampleFactor + 0.5 × (1 − sampleFactor)
raw = adj×0.5 + adj×timeFactor×0.2 + adj×retryFactor×0.15 + adj×changeFactor×0.15
adj = max(0, (accuracy − guessRate) / (1 − guessRate))      ← 猜對率修正
sampleFactor = min(樣本數 / 10, 1)                          ← 小樣本向 0.5 回歸
```

**各項的意義與界線**：

| 項 | 作用 | 關鍵界線 |
|---|---|---|
| `guessRate` | 修正「猜對」 | 4 選 1 = 0.25、是非 = 0.5、配對 = 0.1、填空 = 0.05、申論 = 0 |
| `timeFactor` | 修正「用時」 | < 3 秒視為過快（0.6）；> 60 秒過慢（0.8）；**0／未知 → 中性 1**（見下） |
| `retryFactor` | 重做越多越不確定 | `1 / (1 + 平均重做 × 0.5)` |
| `changeFactor` | 改答表示猶豫 | `1 − 改答率 × 0.3` |
| `sampleFactor` | 樣本 < 10 向 0.5 收斂 | 樣本 < 3 不納入知識點統計 |

**兩個已踩過的坑（勿重犯）**：

1. **未知用時不可當成「答太快」**：`LearningRecord` 沒有 `timeSpentMs`，若以 0 代入而
   公式回傳 0.6，**每個知識點的信心都會被系統性壓低**。故 `timeSpentMs <= 0` → 中性 1。
2. **全對時信心恆為 1.0，與 `guessRate` 無關**：`adj = (1−g)/(1−g) = 1`。
   這是刻意的（完美就是完美）；`guessRate` 只在**非滿分**時拉開差距
   （例：10 題對 8 題 → 是非題 adj 0.6、填空題 adj 0.79）。**寫測試時勿假設全對會被懲罰**。

### 1.3 四層統計

| 層級 | 產出 | 用途 |
|---|---|---|
| 知識點 `knowledgeStats` | 信心、狀態、趨勢、最近 5 次 | 主要診斷單位 |
| 課綱領域 `domainStats` | 正確率、`weakKnowledge` | 科目內的大方向 |
| 難度 `difficultyStats` | 各難度正確率 | 偵測「難度斷層」 |
| 題型 `questionTypeStats` | 各題型正確率 | 偵測「題型落差」 |

狀態分類（`classifyStatus`）：`mastered ≥0.75`｜`stable ≥0.55`｜`unstable ≥0.35`｜`blindspot <0.35`。
趨勢（`detectTrend`）：把紀錄按時間切**前後兩半**比較正確率，差距 > 0.15 判為 improving／declining；
樣本 < 4 回 `insufficient-data`。

### 1.4 洞察（`generateInsights`）

`blindspot`／`unstable`／`difficulty-gap`／`type-gap`／`improving`／`mastered`／`subject-specific`，
依 `severity`（high → medium → low → positive）排序，讓學生先看到最該處理的事。

### 1.5 診斷有效性過濾（四態的實際應用）

```
isDiagnosticallyValid(questionType) = supportsFeature(id, "學生診斷") !== "no"
```

- 只排除**明確的 `no`**（如申論題）
- `conditional` **要納入**：是非題是 conditional（猜對率 50%），規格要求「納入但信心保守」
  ——**若只收 `yes`，517 道是非題會全部被丟掉**
- 未知題型保留，不靜默丟棄

### 1.6 與既有資料的落差（實作前必讀）

現有 `LearningRecord = { questionId, subject, isCorrect, errorType?, timestamp, flagged }`
**缺** `knowledge / difficulty / questionType / timeSpentMs / retryCount / changedAnswer / sessionId`。

橋接層 `answerRecordsFromLearningRecords(records, questionMetaMap, sessionId)` 會 join 題庫補齊
知識點／難度／題型；缺漏的互動訊號以 **unknown** 表示（`timeSpentMs = 0`）。

> **這意味著：在作答流程補上這些訊號之前，信心分數會退化為「猜對率修正後的正確率」。**

### 1.7 儲存介面

`DiagnosisStorage`（`loadRecords`／`appendRecord`／可選 `loadDiagnosis`／`saveDiagnosis`）
**僅為介面，尚無實作**；`getDiagnosis()` 內建 5 分鐘快取。

---

## 2. 科目適配層

### 2.1 一句話：每科要回答「這科的『不會』長什麼樣子」

| 科目 | 「不會」的樣貌 | 診斷重點 | 可自動評分比例 |
|:---|:---|:---|:---:|
| 數學 | 技能缺口 | 細分步驟、錯誤類型 | 90%+ |
| 自然 | 概念誤解 | 知識點標籤（已有基礎） | 80%+ |
| 英語 | 技能落差 | 認讀 vs 拼寫 vs 應用 | 85%+ |
| 社會 | 記憶 vs 理解 | 區分事實型與概念型 | 60–70% |
| 國語 | 理解層次 | 字面 vs 推論 vs 批判 | 30–50% |

### 2.2 科目設定的三個硬約束（皆為踩過的坑）

1. **科目字串必須與題庫一致**：`數學／自然／社會／國語／英語`
   （**「國語文」不是有效值**——查不到會靜默落到保守預設，診斷結果悄悄錯）
2. **可自動評分題型由 `questionTypes.ts` 推導**（`autoGradable && implemented`），
   不在 `subjectConfig.ts` 維護第二份清單；`fill-blank` 實作後自動納入
3. **不得放假的 extractor**：需要題目標籤的維度標 `status: "needs-question-tags"` 並寫明
   `requiredTags`。**回傳 0 的佔位實作比沒有更糟**（看起來有維度、實際全是 0）

### 2.3 維度狀態與所需標籤

| 科目 | 維度 | 狀態 | 所需題目標籤 |
|:---|:---|:---|:---|
| 數學 | 運算步驟 | `needs-question-tags` | `errorType` |
| 自然 | 因果推理 | `needs-question-tags` | `reasoningLevel` |
| 社會 | 知識類型 | `needs-question-tags` | `knowledgeKind` |
| 國語 | 理解層次 | `needs-question-tags` | `comprehensionLevel` |
| 英語 | 語言技能 | **`available`** | 無（由題型推導：單選→認讀、填空→拼寫、簡答→應用） |

> 只有英語的維度**現在就能算**——其餘四個都卡在題庫標籤，屬**內容工作**，非程式工作。
> 程式端已備好介面（`requiredTags`），等標籤到位即可啟用。

---

## 3. 整合流程（決策鏈）

```
使用者作答
   ↓
AnswerRecord（含 subject / questionType / knowledge）
   ↓
supportsFeature(type, "學生診斷") === "no" ？ ──是──→ 不納入診斷，僅記錄
   ↓否
指定科目？ ──是──→ 過濾該科 + subjectConfig.autoGradableTypes
   ↓
averageGuessRate(records) → calculateConfidence(records, guessRate)
   ↓
（若維度 available）萃取 extraDimensions
   ↓
KnowledgeStat → generateInsights() → StudentDiagnosis
```

---

## 4. 給 AGENT 的檢查清單（診斷相關）

- [ ] 這個功能**支援哪些題型**？（**查 `docs/question-types.md` §3 矩陣**）
- [ ] 該題型的**猜對率**是多少？是否影響診斷可信度？（`guessRateOf()`）
- [ ] 該題型是否可計入診斷？（`isDiagnosticallyValid()`；只有 `no` 要排除）
- [ ] 這個功能**支援哪些科目**？該科目的「不會」定義是什麼？（§2.1）
- [ ] 需要的診斷維度是 `available` 還是 `needs-question-tags`？
      **後者不要先寫 UI**——資料還沒來源
- [ ] 樣本量：< 3 不納入統計、< 10 向 0.5 回歸，UI 是否正確標示「資料不足」？
- [ ] 是否污染指標：不可自動評分的題型**不得**計入正確率／排行榜／診斷
- [ ] 若新增科目／維度：**同步更新**本檔與 `subjectConfig.ts`

---

## 5. 已知風險（依優先級）

| # | 議題 | 優先級 | 說明 | 緩解 |
|:---:|:---|:---:|:---|:---|
| 1 | **知識點標籤一致性** | **極高** | `knowledge` 標籤不統一，整個診斷系統失效（「凝固點」與「冰點」被當兩個知識點） | 建 `docs/knowledge-taxonomy.md`；`pnpm qc:bank` 加檢查：孤立標籤、拼寫變體、未定義標籤 |
| 2 | 作答訊號缺漏 | 高 | 沒有用時／重做／改答，信心分數退化為修正後正確率 | 作答流程埋點（見 §6） |
| 3 | 簡答／申論評分公平性 | 高 | 尚無設計 | UI 揭露「輔助評分」；明確排除於排行榜與診斷 |
| 4 | 單題多知識點歸因 | 中 | 一題考 3 個知識點，答錯不知哪個不會 | 加 `primaryKnowledge` 標註 |
| 5 | 樣本量不足 | 中 | 單次做題無法下結論 | 跨次滾動計算；< 3 不納入並在 UI 標示 |
| 6 | 是非題猜對率 50% | 中 | 診斷可信度低 | 已由 `guessRate` 修正；不可單獨作為診斷依據 |
| 7 | 跨科診斷整合 | 低 | 目前為單科診斷 | 未來可加 `buildCrossSubjectDiagnosis()` |

---

## 6. 推薦實作順序

### 6.1 診斷系統

| 順序 | 任務 | 狀態 |
|:---:|:---|:---|
| 1 | **標準化 `knowledge` 標籤** | ❌ 未開始（**最高優先，且是內容工作**） |
| 2 | 補作答行為記錄（用時／重做／改答） | ❌ 未開始 |
| 3 | `calculateConfidence()`（含猜對率修正） | ✅ 已實作並測試 |
| 4 | `buildDiagnosis()` 四層統計＋洞察 | ✅ 已實作並測試 |
| 5 | `DiagnosisStorage` 最簡實作 | ❌ 僅介面 |
| 6 | 「我的進度」頁診斷報告 UI | ❌ 未開始 |
| 7 | 「答對卻被判錯」回報管道 | ❌ 未開始（填空題上線前的必要配套） |

### 6.2 科目適配

| 順序 | 科目 | 理由 |
|:---:|:---|:---|
| 1 | 自然 | 已有基礎，直接沿用 |
| 2 | 數學 | 最適合此系統，但需錯誤類型記錄 |
| 3 | 英語 | 需技能維度（**唯一現在就能算的維度**） |
| 4 | 社會 | 需開放題降級 |
| 5 | 國語 | 最複雜，需拆分知識與能力 |

### 6.3 目前狀態（誠實版）

**引擎已完成，但還沒接上車**：`studentDiagnosis.ts` 與 `subjectConfig.ts` 已實作並有
**45+ 條測試**鎖住行為，但**沒有任何呼叫點**——沒有 UI、作答流程未埋點、儲存層未實作。

**真正的瓶頸有兩個，都不是程式**：
1. **題庫標籤**（`errorType`／`reasoningLevel`／`knowledgeKind`／`comprehensionLevel`）
   ——2895 題需要有人標註，且判斷「推論理解 vs 批判理解」需要懂課綱的人
2. **知識點字典**（風險 #1）——不做這個，診斷的準確度上限就被鎖死
