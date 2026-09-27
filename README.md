# 🏝️ 島嶼探險家（Island Explorer）

國小 3–6 年級的互動學習航線：四座島嶼分別對應 **國語、數學、自然、社會**，
每座島有 4 條年級航線、每條航線 6 個關卡，共 **96 關**、**2,337 道題目**。

- 線上網址：<https://xue-gr3a.onrender.com/>
- GitHub：<https://github.com/junwei1o/->

## 玩法

1. 首頁「島嶼地圖」選一座島。
2. 選年級（3–6 年級）進入航線，每條航線 6 關：
   - 關卡 1–2：**基礎**（淺灘）
   - 關卡 3–4：**標準**（礁岩）
   - 關卡 5–6：**挑戰**（深海）
3. 每關 10 題，答錯會立刻顯示解析。
4. 成績換算星星：≥60% 一顆、≥75% 兩顆、≥90% 三顆。
5. 「學習紀錄」會統計各島通關數、正確率與最近挑戰。

進度存在瀏覽器 `localStorage`（鍵名 `island-explorer.progress.v1`），不需註冊、不寫伺服器。

## 技術架構

| 層 | 技術 |
| --- | --- |
| 前端 | React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + wouter |
| API | tRPC 11（superjson）+ Express 4 |
| 資料 | `data/bank.json`（2,337 題，載入後常駐記憶體） |
| 部署 | Render（`pnpm install --frozen-lockfile && pnpm build` → `pnpm start`） |

### API

`/trpc` 上有三個 query：

- `health` — 服務狀態與題庫規模
- `meta` — 各島、各年級的題目數
- `quiz({ subject, grade, stage })` — 回傳該關的 10 題。
  以 `subject|grade|stage` 當種子決定抽題與選項順序，**同一關每次拿到的題目都相同**；
  選項順序會重排並同步更新答案索引，避免背答案。

## 本機開發

```bash
pnpm install
pnpm build        # 產出 dist/（前端）+ dist/index.js（伺服器）
pnpm start        # http://localhost:3001
```

開發模式（前後端分離，Vite 會把 /trpc 轉到 3001）：

```bash
pnpm dev:server   # 終端機 A：Express + tRPC
pnpm dev          # 終端機 B：Vite dev server（5173）
```

其他指令：

```bash
pnpm check        # tsc --noEmit
```

## 部署

`render.yaml` 定義了 Render 服務（服務名稱 `xue-adventure` 與 Dashboard 一致，
改名會被 Render 誤判成新服務，請勿更動）。

推上 GitHub `main` 分支即會自動觸發部署：

```bash
git add -A
git commit -m "feat: ..."
git push origin main
```

## 目錄結構

```
client/          前端原始碼（Vite root）
  index.html
  public/        favicon 等靜態檔
  src/
    pages/       Home / IslandPage / StagesPage / QuizPage / RecordsPage
    components/  Layout（頁首頁尾）
    lib/         trpc 用戶端、localStorage 進度
server/          Express + tRPC
  index.ts       靜態檔 + SPA fallback + /trpc
  trpc.ts        路由與抽題邏輯
  bank.ts        題庫載入與隨機工具
shared/islands.ts  四島設定、關卡規則（前後端共用）
data/bank.json   題庫（2,337 題）
```

## 資料來源

題庫整理自既有專案的 `data/runtime_bank_elementary.json`
（依課綱產生的國小國語・數學・自然・社會題目）。
