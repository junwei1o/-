# LINE 通知設定（老師）

學生每次完成試卷（自由練習／錯題魔王／限時挑戰／週測／今日複習中心）後，
寶島探險家會自動推一條 LINE 訊息給老師，內容是督學台數據的精簡版：
學生、卷種、分數、最多 3 個薄弱知識點，附督學台深連結。

> LINE Notify 已於 2025/3/31 全面停用，本功能改用 **LINE Messaging API**（官方帳號）。

## 事前準備（約 5-10 分鐘，只需做一次）

### 1. 建立 LINE 機器人頻道
1. 用你的 LINE 帳號登入 [LINE Developers](https://developers.line.biz/console/)。
2. 建立 **Provider**（隨便取名，例如「寶島探險家」）。
3. 在 Provider 下建立 **Messaging API** 頻道：
   - 頻道名稱：寶島探險家
   - 類別：選「商業」或「教育」
   - 填公司／店家名稱與 Email
4. 建立後進頻道設定頁，記下兩樣東西：
   - **Channel Secret**（在 Basic settings）
   - **Channel Access Token**（在 Messaging API 頁籤 → Issue）
   - 兩者都可重新發行；Access Token 形如 `xxxxxxxx`（一串字元，只顯示一次請立刻複製）

### 2. 把金鑰放進 Render
Render 的 Service → **Environment** → 新增兩個變數後重新部署：

| 變數 | 值 |
|---|---|
| `LINE_CHANNEL_SECRET` | 步驟 1 的 Channel Secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | 步驟 1 的 Channel Access Token |

> 未設定這兩個變數時，LINE 功能完全休眠，不影響作答與督學台其他功能。

### 3. 設定 Webhook
同一個頻道設定頁 → **Messaging API 頁籤**：
1. **Webhook URL** 填：
   ```
   https://xue-gr3a.onrender.com/api/line/webhook
   ```
2. 點 **Verify**，顯示 Success 即可。
3. 勾選 **Allow bot to send push messages**（あて先へのメッセージ送信を許可）。
4. 建議關閉 **Webhook 的 Auto-reply／加入好友歡迎訊息**（避免學生加好友時機器人回話）。

### 4. 綁定接收處（支援群組或個人）
打開 app 的 **督學台**（設定 → 督學台），LINE 通知區會顯示目前狀態：

- **想收個人通知**：用你的 LINE 掃頻道頁的 QR code 把機器人加為好友，再傳任一訊息（例如「hi」）。
- **想收群組通知**：建立一個 LINE 群組，把機器人加進群組，在群組裡傳任一訊息。
- 最後一次傳訊息的聊天室就是接收處。想切換，在目標聊天室再傳一次訊息即可。

綁定完成後，督學台會顯示「通知將送到：LINE 群組／個人對話」，按
**傳送測試訊息** 可以驗證整條通道。

## 常見問題

- **訊息沒收到？**
  1. 確認 Render 已設定兩個 `LINE_CHANNEL_*` 變數並重新部署。
  2. 確認督學台顯示「已啟用」且綁定了聊天室。
  3. 按「傳送測試訊息」；若失敗，檢查 Access Token 是否已重新發行過（舊 token 會失效）。
- **通知送到別人了？**
  有人對機器人傳了訊息導致綁定被切換。在你要接收的聊天室再傳一次訊息即可切回。
- **一個月可以發幾則？**
  LINE Messaging API 免費版每月 500 則（以好友數計算），兩個孩子一天做 5 份卷約 150-300 則，綽綽有餘；超過會收到 LINE 通知並可升級方案。
- **學生會收到通知嗎？**
  不會。通知只發給綁定的聊天室；學生端沒有任何 LINE 互動。

## 技術備註

- 端點：`server/_core/lineWebhook.ts`（簽章驗證＋綁定）／`server/lineNotify.ts`（訊息組裝＋發送＋去重）。
- 通知去重：同一份試卷（sessionKey）5 分鐘內只推一次，學生補標錯誤原因不會造成重複推播。
- 推播失敗只記 log，絕不影響作答流程與督學台資料。
