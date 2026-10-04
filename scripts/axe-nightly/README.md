# axe-nightly 全站 a11y 夜間巡檢

對 10 條主要路由（含登入流程）注入 axe-core 做無障礙回歸比對。
口徑：1440×900、axe 4.10.2、登入「稽查夜巡」、跳過隱私/導覽彈窗。

## 比對政策
- **新違規類型**（該路由 baseline 沒有的 id）→ ❌ 失敗
- **已知類型數量惡化**（如 color-contrast 49→51）→ ❌ 失敗
- **改善** → 僅提示；建議跑 `--update-baseline` 收緊基線並在提交訊息寫明原因

## 為什麼這樣設計（兩輪人工巡檢的教訓）
1. 違規數**隨渲染內容浮動**——報告與 baseline 都強制記錄量測時點 + 線上 bundle hash，
   凡引用數字必須帶上這兩項，否則兩個 agent 會量出兩個數。
2. strict 比對才抓得住「一行改動引入全站回歸」這類事故
   （實例：aria-prohibited-attr 全站 10 頁，由單一 div 觸發）。
3. 工具鏈放在本資料夾自己的 package.json，**刻意不動主專案 lockfile**（平行 agent 衝突隔離）。

## 本機執行
```bash
npm i                                    # 首次（跳過瀏覽器下載：PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1）
npx playwright install chromium          # CI 同款；本機也可 AXE_BROWSER=chrome 用系統 Chrome
node sweep.mjs                           # 巡檢 + 比對
node sweep.mjs --update-baseline         # 簽核後更新基線
AXE_BASE_URL=http://localhost:3000 node sweep.mjs   # 打本機 dev
```

## ⚠️ 驗證部署時必須用「空快取」

線上靜態資源是 `immutable, max-age=31536000`——**同一瀏覽器 session 會一直吃舊 CSS/JS**。
2026-09-30 首頁修復複驗時被騙過一次：改完 `--bx-mute` 重跑 axe，違規數字完全沒變，
一度以為修復無效；換成全新 session（空快取）後才看到 3 → 1。

做法：用新的 session 名或關閉快取，**不要沿用舊 session**。
另：比對線上色值要用 `grep -i`——minifier 會把大寫 hex 轉小寫。

## CI
`.github/workflows/axe-nightly.yml`：每日 GMT+8 05:30 自動跑（Render 免費層喚醒內建重試），
報告存 artifact。**排程需本 workflow 已在 origin/main 才生效。**

⚠️ **現況（2026-10-04）**：本 workflow **尚未生效**——暫存在
`scripts/axe-nightly/axe-nightly.workflow.yml`。原因是推送 `.github/workflows/` 下的檔案
需要 PAT 具備 `workflow` scope，而目前 token 沒有（push 會被 GitHub 拒絕）。
補上 scope 後兩步啟用：

```bash
git mv scripts/axe-nightly/axe-nightly.workflow.yml .github/workflows/axe-nightly.yml
git commit -m "ci(a11y): 啟用 axe 夜間巡檢排程" && git push
```
