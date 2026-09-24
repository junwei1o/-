# 冷啟動問題：解法評估

> 對象：寶島探險家（xue-gr3a.onrender.com）
> 前提：已有真實的小學生每天在使用 → 首次開啟的等待不是「效能優化」，是可用性故障。

## 一、現狀（實測）

| 指標 | 數值 |
| --- | --- |
| 熱機狀態 TTFB | 約 0.10 秒 |
| 休眠後首次請求 TTFB | 見本文末尾「冷啟動實測」 |
| Render 免費層休眠條件 | 15 分鐘無任何 inbound 流量即 spin down（官方文件） |
| 首屏傳輸量（gzip） | 約 385 KB |
| 靜態資源快取 | `max-age=0`（已修，見 commit「效能：為建置產物加上內容雜湊對應的快取策略」） |

熱機時網站反應很快，問題完全集中在「服務睡著了」這件事上。

## 二、問題的本質

目前 HTML 本身是由 Express 提供的（`server/_core/vite.ts` 的 `serveStatic`）。
服務休眠時，孩子點開連結的第一個請求就要等 Node 行程重新啟動、載入 bundle、連上資料庫——
這段時間裡畫面上只有骨架屏的小帆船。

有兩個細節讓情況更清楚：

1. **首頁核心答題流程不依賴後端**。`Home.tsx` 本身沒有 `useAuth`，題庫走動態 `import()` 於閒置時預載，
   作答、錯題、間隔重複全部落在 localStorage。`targetedPractice.ts` 的註解也明寫了
   「離線或載入失敗時自動退回」，也就是說答題這條主線本來就可以完全離線運作。
2. **首頁仍有兩個後端查詢**（`HomeContactCard` 的 `cloud.getTeacherProfile`、`teacher.listAnnouncements`），
   但它們走 React Query 的 loading 狀態，不阻塞渲染。

換句話說：**現在的架構為了不到首頁 10% 的雲端功能，讓 100% 的使用者一起承擔冷啟動。**

## 三、三個方案

### 方案 A：保活 ping（今天就能生效，零成本）

用外部定時服務每 5 分鐘打一次首頁，讓服務永遠不進入休眠。

- **成本**：0 元
- **見效時間**：設定完立刻生效
- **優點**：不動任何程式碼，不需要重新部署
- **缺點**：
  - 依賴第三方服務；對方故障＝網站又開始冷啟動
  - 每次部署後的第一次訪問仍會冷啟動
  - 只是把問題藏起來，沒有真正解決

**具體做法（三選一）**

1. **UptimeRobot**（最省事）：免費方案支援 50 個監控、最小 5 分鐘間隔，監控 `https://xue-gr3a.onrender.com/`。
2. **Cloudflare Workers Cron**（站點已在 Cloudflare 後面，無新增依賴）：

```js
// 每 5 分鐘喚醒一次，避免 Render 免費層休眠
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(fetch("https://xue-gr3a.onrender.com/", { method: "GET" }));
  },
};
```

   搭配 `wrangler.toml`：

```toml
name = "xue-keepalive"
main = "src/index.js"
compatibility_date = "2026-09-24"

[triggers]
crons = ["*/5 * * * *"]
```

3. **GitHub Actions 定時**：免費，但 GitHub 對 cron 有延遲與偶發不執行的情況，穩定度較差。

### 方案 B：升級 Render 付費運算（最省心）

Render 的 Web Service 從 Free 升到最便宜的付費層 **$7/月（512 MB RAM / 0.5 CPU）**，服務不再休眠。

- **成本**：$7/月（約等於一個月一杯咖啡）
- **見效時間**：升級後立刻
- **優點**：官方機制、最穩定、零程式碼改動、順帶解除免費層的種種限制
- **缺點**：要花錢；仍受限於單一區域（不像 CDN 有邊緣節點）

### 方案 C：前端靜態化，後端獨立（治本，零成本但需改造）

Render 的 **Static Sites 是永久免費**的，自帶 CDN、自動部署、自訂網域與 TLS，且完全沒有冷啟動。
把前端搬到 Static Site，後端 tRPC 保留成另一個 Web Service（允許它休眠——因為只有教師頁、AI 家教等次要功能會用到）。

- **成本**：0 元
- **效果**：首屏由 CDN 邊緣節點提供，全球加速，永不冷啟動；而且我剛修的 `immutable` 快取頭在 CDN 上效益更大
- **需要做的改造**：
  1. `client/src/main.tsx` 的 `httpBatchLink({ url: "/api/trpc" })` 改為絕對 URL，
     用 `import.meta.env.VITE_API_URL` 注入，本機開發時退回同源
  2. `client/src/lib/targetedPractice.ts` 有第二個 tRPC client，同樣要改
  3. 後端 Express 開啟 CORS，允許靜態站網域
  4. Render 上拆成兩個服務：Static Site（前端）+ Web Service（API）
- **風險**：
  - 教師儀表板、每週測驗、AI 家教等功能首次呼叫時仍會等後端喚醒（但這些不是孩子的主線）
  - OAuth callback、LINE webhook 的網址要改指向新的 API 服務
  - 需要一次完整的回歸驗證（專案有 114 個測試檔／約 509 項）

## 四、建議路徑

既然已經有孩子在每天用，建議**兩步走**：

1. **立刻**：先做方案 A（保活）。今天就能讓孩子不再等到轉圈圈，零成本、零風險。
2. **接著**：排時間做方案 C。它是唯一同時解決「冷啟動」與「全球延遲」的做法，
   而且把架構調回它本來該有的樣子——主線離線可用，雲端功能當增強。

方案 B 作為備選：如果評估後覺得改造風險太高、或希望能立刻一勞永逸，$7/月買到的穩定其實很划算。

## 五、冷啟動實測

未執行。原計畫讓服務靜置約 17 分鐘後量測首次請求的 TTFB，但評估途中已確認改用保活機制，
本文件保留「15 分鐘無流量即休眠」的官方條款與熱機 TTFB 約 0.10 秒作為決策依據即可。
若要補測，指令如下（服務需先靜置超過 15 分鐘）：

```bash
curl -s -o /dev/null -w "首字节TTFB=%{time_starttransfer}s 总计=%{time_total}s\n" \
  https://xue-gr3a.onrender.com/
```
