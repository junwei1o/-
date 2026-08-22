# 寶島探險家資料模型字典

> 本文件依目前 `client/src` 的資料模型與 `client/src/utils/storage.ts` 安全封裝整理。所有瀏覽器端資料都應優先透過 storage wrapper 讀寫，不應在頁面元件直接操作 `localStorage`。

## 1. 儲存層共通規則

`storage.ts` 提供 `safeGet`、`safeSet`、格式驗證、記憶體 fallback、錯誤日誌與配額處理。讀取失敗時回傳安全預設值；寫入失敗時保留記憶體中的最新值，並記錄錯誤。任何含使用者資料的結構都應在讀取後驗證型別與範圍。

| 儲存鍵／來源 | 主要結構 | 用途 | 生命週期 |
|---|---|---|---|
| `xueAdventurerData` | `PlayerData` | 相容玩家摘要：名稱、等級、經驗、金幣、徽章與作答總數 | 持續保存 |
| `xueLearningRecord` | `LearningRecord[]` | 相容答題紀錄，供首頁、報告與錯題流程使用 | 持續保存，配額不足時清理最舊資料 |
| canonical RPG／學習狀態鍵 | `RpgState`、`AdaptiveProfile` | 正式 RPG 數值、科目進度、自適應學習資料 | 持續保存 |
| battle snapshot key | `BattleStateSnapshot` | 未完成戰鬥恢復：HP、怪物、Combo、題目進度 | 戰鬥完成／放棄時清除 |
| inventory key | `InventoryState` | 特產與補血藥水數量 | 持續保存 |
| `xue-adventure-weekly-learning-goal-v1` | `WeeklyLearningGoal` | 每週科目正確率目標 | 週期性更新 |
| `xue-adventure-onboarding-complete-v1` | `boolean` | 是否完成首次新手導覽 | 持續保存 |
| `xue-adventure-battle-tutorial-complete-v1` | `boolean` | 是否看過首次戰鬥規則教學 | 持續保存 |
| 音效偏好鍵 | `boolean`／`number` | sound 開關與戰鬥音量 | 持續保存 |
| error log key | `ErrorLog[]` | 儲存、解析與降級錯誤診斷 | 持續保存，可由設定頁清理 |

## 2. 玩家與學習資料

### `PlayerData`

| 欄位 | 型別 | 說明 |
|---|---|---|
| `name` | `string` | 玩家顯示名稱 |
| `level` | `number` | RPG 等級，至少為 1 |
| `exp` | `number` | 目前經驗值 |
| `gold` | `number` | 寶島幣／戰鬥獎勵貨幣 |
| `badges` | `string[]` | 成就或徽章識別碼 |
| `totalAnswers` | `number` | 累計答題次數 |

### `LearningRecord`

| 欄位 | 型別 | 說明 |
|---|---|---|
| `questionId` | `string` | 題目識別碼 |
| `subject` | `string` | `chinese`、`math`、`english` 或 `science` |
| `isCorrect` | `boolean` | 是否答對 |
| `errorType` | `string \| undefined` | `concept`、`careless`、`memory` 等錯誤分類 |
| `timestamp` | `number` | UTC milliseconds 時間戳 |
| `flagged` | `boolean` | 是否標記疑惑 |
| `nextReviewDate` | `number \| undefined` | 間隔複習時間 |
| `chapter`／`topic` | `string \| undefined` | 題目章節與知識點 metadata |

分析頁以 `LearningRecord[]` 聚合每日答題量、科目正確率與錯誤類型分布；空資料時應顯示空狀態而非虛構數值。

## 3. 戰鬥資料

### `BattleStateSnapshot`

| 欄位 | 型別 | 說明 |
|---|---|---|
| `active` | `boolean` | 是否存在可恢復的未完成戰鬥 |
| `playerHP` | `number` | 玩家目前 HP，限制在 `0..maxHP` |
| `enemyHP` | `number` | 怪物目前 HP，限制在 `0..maxHP` |
| `maxHP` | `number` | 戰鬥最大 HP 或玩家最大 HP，依現有 snapshot schema 使用 |
| `currentCombo` | `number` | 連續答對數 |
| `enemyId` | `string` | 怪物識別碼，供恢復相同遭遇 |
| `subject` | `string` | 戰鬥所屬科目 |
| `questionIndex` | `number` | 題目進度索引 |
| `questionId` | `string \| undefined` | 當前題目識別碼 |
| `updatedAt` | `number` | 最近一次 HP、Combo 或題目進度保存時間 |

BattleState 本身是以 `dispatch(action)` 驅動的有限狀態機；snapshot 只保存可恢復資料，不應取代狀態機轉移規則。答題、HP、Combo 與題目進度變動後應即時更新 snapshot；勝利、失敗或放棄後清除。

### `MonsterDefinition`

怪物內容位於 expedition content 模型，至少包含：`id`、`subject`、`name`、`emoji`、`maxHP`、`attackPower` 與主題描述。每個科目目前配置三種怪物，戰鬥開始時抽取其中一種，並以 `enemyId` 持久化。

## 4. 題庫模型

### `Question`

題目至少包含：`id`、`subject`、`difficulty`、`question`、`options`、`correct`、`explanation`、`hint`、`errorTag`，並可附加 `chapter`、`topic` 與課綱 metadata。四科正式內容各至少 30 題；每日挑戰從正式題庫抽取 10 題，不應使用虛構答題紀錄。

## 5. 道具與背包

### `InventoryState`

背包以既有 inventory service 管理特產與戰鬥道具。補血藥水至少包含物品識別碼、顯示名稱、數量與恢復量。答對達到五題後依機率掉落；使用時應原子地減少數量、增加玩家 HP 並限制不超過最大 HP。掉落與消耗都必須經由安全 inventory API。

## 6. 學習目標與導覽

### `WeeklyLearningGoal`

| 欄位 | 型別 | 說明 |
|---|---|---|
| `subject` | `string` | 目標科目 |
| `targetAccuracy` | `number` | 目標正確率，保存時鉗制在 0–100 |
| `weekKey` | `string` | 目標所屬週次 |
| `createdAt` | `number` | 建立時間戳 |

`onboardingComplete` 與 `battleTutorialComplete` 是獨立 boolean，分別控制全站導覽與第一次正式戰鬥規則說明。教學戰鬥以 `demo=1` 標記，不應寫入正式 RPG 進度或正式學習紀錄。

## 7. 錯誤與分享資料

### `ErrorLog`

錯誤日誌包含時間、情境與遮蔽後訊息，供設定頁檢視、清理與複製診斷摘要。診斷摘要不得包含 token、密鑰、完整個資或未遮蔽的敏感內容。

戰績分享卡片是由勝利時的展示資料即時產生，常用欄位為 `enemyName`、`combo`、`rewards` 與 `createdAt`。下載與剪貼簿分享都必須提供瀏覽器 API 不可用時的非阻塞降級回饋，不應把分享卡片當作正式學習資料保存。

## 8. 維護規則

新增欄位時，先更新本文件與對應型別，再於 `storage.ts` 加入驗證、預設值與錯誤處理，最後補上資料層測試。不得在元件中直接呼叫 `localStorage.setItem` 或 `localStorage.getItem`，不得以測試資料冒充真實好友、排名、評論或學習成果。
