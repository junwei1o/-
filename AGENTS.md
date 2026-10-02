# AGENTS.md

給任何在這個 repo 工作的 agent（包含未來的自己）與人類維護者。

## 先讀這裡，不要先讀程式碼

這個專案已經有 **396 個 commit、三種角色、35 個伺服器模組**。
任何「我記得好像有個函式處理這件事」的假設都可能過期。

**動手前必讀（依序）：**

1. [`docs/knowledge-base/05-踩坑與陷阱.md`](docs/knowledge-base/05-踩坑與陷阱.md)
   —— 症狀 → 根因 → 解法。**先看這份，它寫的是「你會撞到的東西」而不是「專案在做什麼」。**
2. [`docs/knowledge-base/03-本機工作台.md`](docs/knowledge-base/03-本機工作台.md)
   —— 這台機器的 node、指令、驗證序列、環境變數。
3. [`docs/knowledge-base/02-架構與關鍵決策.md`](docs/knowledge-base/02-架構與關鍵決策.md)
   —— 為什麼這樣做（程式碼只記錄了「是什麼」）。

站長也能在網站上讀到同一份內容：`/admin` → **知識與文件**。

## 這個專案的地雷

三個最容易讓人卡住、而且**從程式碼看不出來**的：

1. **SPA fallback**：`app.use("*")` 對未知路徑一律回 200 + HTML。
   判斷 API／資源是否真的存在，**必須看 content-type 或 body，不能只看狀態碼**。
2. **`--frozen-lockfile`**：`render.yaml` 用它，所以 `package.json` 與
   `pnpm-lock.yaml` 不同步會**直接讓部署失敗**。要無頭瀏覽器請用隔離的
   Playwright／`agent-browser`，**不要 `pnpm add` 進專案**。
3. **每個 `.tsx` 都要 `import React`**：`tsconfig` 是 `jsx: preserve`，
   走經典 JSX 轉換。漏了會 runtime 爆，但 tsc 不會報。

## 驗證序列（改完照這個順序跑）

```bash
export PATH="/Users/g/.workbuddy/binaries/node/versions/22.22.2-3/bin:$PATH"
node node_modules/typescript/bin/tsc --noEmit     # 型別
node node_modules/vitest/vitest.mjs run           # 測試
# 六道品質閘門（指令見 docs/knowledge-base/03-本機工作台.md）
node node_modules/vite/bin/vite.js build          # 前端建置
```

碰登入／權限的改動**要做本機端對端**（啟動指令見 03），不要只靠單元測試。
上線後要**線上實測**，不要只看部署成功。

## 幾個路線檢查

- **測試失敗時先問「是測試錯還是設計錯」**。至少有一次是設計問題（命名撞車），
  那時修的是設計，不是測試。
- **不要加假數字**。拿不到資料就顯示「無法取得」＋原因。
  站長後台每個數字都標明來源與快取時間。
- **新增了角色／權限，就順手把該收的端點收掉**。只搬 UI 不改端點，
  等於「有後台」只是門面。

## 更新知識庫

| 想記錄 | 寫到哪 |
| --- | --- |
| 新的坑 | `docs/knowledge-base/05-踩坑與陷阱.md`（用「症狀 → 根因 → 解法」） |
| 完成一輪工作 | `docs/knowledge-base/04-工作執行紀錄.md`（附 commit hash） |
| 新的設計決策 | `docs/knowledge-base/02-架構與關鍵決策.md`（寫**為什麼**） |
| 未完成的事 | `docs/knowledge-base/06-待辦與交接.md` |

**新增文件只要放一個 `.md` 進 `docs/knowledge-base/`**，
站長後台會在執行期讀檔自動收進清單——不需要改程式、不需要重新部署前端。
