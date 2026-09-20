# LINE 推播設定步驟（寶島探險家）

學生每次完成試卷（自由練習／錯題／限時／週測／複習中心），伺服器會自動推一條 LINE 給老師。
未設定時功能完全休眠（webhook 回 501、不影響其他服務），設定後才啟動。

**需要的兩個環境變數**

| 變數 | 來源 |
|---|---|
| `LINE_CHANNEL_SECRET` | LINE Developers → Channel → Basic settings |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Developers → Channel → Messaging API 頁籤 → Channel access token |

> 注意：本站用的是 **LINE Messaging API**（不是 LINE Notify，後者已於 2025/3 停用）。

---

## 步驟 1：到 LINE Developers 建立頻道，取得兩把金鑰

1. 用老師自己的 LINE 帳號登入 https://developers.line.biz/console/
2. 第一次使用要先建立 **Provider**（提供者）：按「Create a new provider」，名稱自填，例如 `寶島探險家`
3. 在同一個 Provider 下按「Create a new channel」→ 選 **Messaging API**
4. 依畫面填寫：
   - Channel name：例如 `寶島探險家通知`（學生不會看到，日後可改）
   - Channel description、Category、Sub-category：隨意選
   - Region / Language：Taiwan / Chinese (Traditional)
5. 建立完成後進入該 Channel：
   - **Basic settings** 頁籤 → 複製 **Channel secret**
   - **Messaging API** 頁籤 → 捲到最下方 **Channel access token** → 按 **Issue**（發行）
     - 選 **long-lived**（長期）渠道存取權杖
     - ⚠️ 這串只會完整顯示一次，請立刻複製存好；關掉就只能重新 Issue

## 步驟 2：到 Render 設定環境變數

1. 登入 https://dashboard.render.com/ ，找到站台的 Web Service（`xue-gr3a`）
2. 左側選單點 **Environment**
3. 在 **Environment Variables** 區塊按 **Add Environment Variable**，新增兩筆（一次一筆）：

   | Key | Value |
   |---|---|
   | `LINE_CHANNEL_SECRET` | 步驟 1 複製的 Channel secret |
   | `LINE_CHANNEL_ACCESS_TOKEN` | 步驟 1 發行的 Channel access token |

4. 按 **Save Changes**
5. Render 會自動重新部署（約 2–5 分鐘），等狀態變回 **Live**
   - 沒有自動觸發的話，到服務頁右上按 **Manual Deploy → Deploy latest commit**

## 步驟 3：回到 LINE 後台設定 Webhook

1. LINE Developers → 該 Channel → **Messaging API** 頁籤
2. 找到 **Webhook settings**：
   - **Webhook URL** 填：`https://xue-gr3a.onrender.com/api/line/webhook`
   - 按 **Update**，再按 **Verify** 驗證（顯示 Success 即可）
   - 把 **Use webhook** 開關打開（ON）
3. 同一頁把 **Auto-reply messages** / **Greeting messages** 關掉（可選）
   - 否則機器人會自動回話，混在推播裡會干擾
4. 到 **LINE Official Account Manager**（同一頻道的官方帳號後台）確認已允許「推播訊息」

## 步驟 4：綁定「通知要送到哪裡」

兩種方式，擇一（或先用個人、之後再切群組）：

- **個人**：Basic settings 頁籤有 Bot 的 QR code / Bot basic ID → 老師用手機 LINE 加入好友
- **群組**：開一個群組把機器人加進去 → 在群組裡傳**任何**一個訊息

綁定規則（程式內建）：

- 加好友（follow 事件）→ 綁定個人
- 在群組發言（message 事件帶 groupId）→ 綁定群組
- **在別的聊天室再傳一次訊息，接收處就切換過去**（最後一次發言的地方就是接收處）

## 步驟 5：驗證

**在站內看**（最簡單）：

- 進「設定 → 督學台」（`/teacher`）→ 最上方 **LINE 通知** 區塊
- 金鑰就緒時狀態徽章會從「待設定」變成「**已啟用**」
- 綁定後會顯示「通知將送到：個人對話 / LINE 群組」
- 按 **傳送測試訊息** → 老師的 LINE 應該立刻收到「🧭 寶島探險家 LINE 通知已連通！…」

**用指令查**（設定前的基準值，設定後應改變）：

```bash
# 設定前：envReady=false、binding=null
curl https://xue-gr3a.onrender.com/api/trpc/line.getBinding

# 設定前：501（功能休眠）；設定後未帶正確簽章應回 400
curl -o /dev/null -w "%{http_code}\n" -X POST \
  https://xue-gr3a.onrender.com/api/line/webhook \
  -H "Content-Type: application/json" -d '{"events":[]}'
```

---

## 常見狀況

| 現象 | 原因 / 處理 |
|---|---|
| 站內一直顯示「待設定」 | Render 的 env 沒存到或還沒部署完 → 回 Environment 確認、手動 Deploy 一次 |
| 顯示「已啟用」但沒有綁定對象 | 還沒加好友／沒在群組發言 → 做步驟 4 |
| Webhook Verify 失敗 | env 尚未生效（Render 還在部署）或 URL 打錯 → 確認是 `/api/line/webhook` |
| 測試訊息送不出去 | token 過期或被重新 Issue 過 → 回 Render 更新 `LINE_CHANNEL_ACCESS_TOKEN` |
| 偶爾漏推 | Render 免費方案會冷啟動，第一次請求可能較慢；LINE 會自動重試 |

## 想暫時關掉 / 換人收

- 督學台的 LINE 區塊按 **解除綁定** → 清空接收對象（推播會靜默跳過，不影響作答）
- 換人收：新的聊天室再傳一次訊息給機器人即可
- 整組功能關掉：把 Render 的兩個環境變數刪除，webhook 會回到 501
