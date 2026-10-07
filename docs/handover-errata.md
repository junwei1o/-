# handover 勘誤表（handover-errata.md）

> `docs/handover.md` 內文為**歷史紀錄，已凍結**——數字記載的是當時真實值，不應改寫（改了會使紀錄失真）。
> **本表是活文件**：凡判斷「現在是什麼」，以本表為準。
>
> 本表條目背後的方法論教訓見 1zz 歸檔：`~/1zz/數字與註解漂移_方法論_20261007.md`
> （掃描維度漏洞、註解數字三分類、commit message 同句兩數、單一記錄點紀律等）。
>
> **本表最後更新：2026-10-07**；所有條目驗證於該日期。此日期之後的變動未反映於本表。

---

## 使用方式

- **發現新的過時項**：分配下一個 `E-NN`（**編號一經分配，永不複用**——即使條目已關閉或誤報撤回），加一行。
- **「原述」欄逐字引原文，不改寫**。對照表的價值就在「原文 vs 現況」的差異；若原述被改寫，差異即失真。
- **「權威來源」欄寫檔案路徑 ＋ 可執行指令**（能手跑就跑一次，別憑記憶填）。
- **「現況」欄若也是會變的值，附量測日期**。會變的值（題數、測試數）不寫死，改寫下界或指向來源。
- **狀態用固定詞彙**：`待修`／`已修未上線`／`已上線`／`已凍結`／`誤報撤回`／`已關閉`／`已勘誤`。
- **「現況」欄寫權威真值，非 UI 文案副本。** 若該條目涉及用戶可見文案，於現況中另註
  「UI 文案為 X（保守下界／格式化值）」，使真值與產品決策並存、互不矛盾。
  ⚠️ 這條是「防止 errata 變成第二個 handover」的機制——否則「現況」欄會被 UI 值填滿，
  然後跟著 UI 一起漂移。真值與 UI 文案**本來就不該一致**：真值給想知道真相的人，
  UI 文案是產品決策（抗漂移），兩者受眾與職能不同。

---

## 對照表

> **本表由 `handover.md` 頂部勘誤節遷入**（2026-10-07，commit `5a8c1a0`）：
> E-01～E-07 ＝ 原勘誤表 7 列；E-08～E-12 ＝ 原「現行待辦」5 項。
>
> ⚠️ 遷入時**刻意不逐字搬運原「現況」欄**——原勘誤節的現況寫於 2026-09-29，
> 至遷入時已逾一週，逐字搬運等於把舊現況當新現況（正是本表要治的病）。
> 故 `原述` 欄逐字保留、`現況` 欄留「待重驗」，已於後續 commit 全部重查填入。

| # | 位置 | 原述（逐字引原文） | 現況 | 權威來源（檔案／指令） | 狀態 |
|---|---|---|---|---|---|
| E-01 | §0 表格「GitHub」 | 「**私有** repo `junwei1o/-`」 | **公開** repo（`private: false`，匿名 API 即可讀） | `curl -s https://api.github.com/repos/junwei1o/- \| jq .private` | 已勘誤 |
| E-02 | §0 表格「程式碼根目錄」 | `/home/user/Doubao/chats/…/hdmx` | 現行工作副本為 `~/.zcode/workspace/default/xue-adventure`（`/Users/g/Documents/trae_projects/hdmx` 為更早的舊值，亦已過期） | `pwd`（於工作副本內執行） | 已勘誤 |
| E-03 | §0 表格「後端」 | 「**全部 publicProcedure，無登入系統**」 | **已不成立**：`teacherProcedure` 存在（`server/routers.ts` 7 處）；教師以 `TEACHER_PASSPHRASE` 通關語登入；3 個硬刪除端點已移除；API 速率限制 300/min | `grep -c teacherProcedure server/routers.ts`；`grep -n 'limit: 300' server/_core/index.ts` | 已勘誤 |
| E-04 | §0 表格「題庫」 | 「`taiwan_curriculum_500.json`（948 題，4 科：數學/自然/社會/國語；英語僅前端）⚠️ 已過期：現為 `runtime_bank_elementary` 2895 題／國小單一學段」 | 真值 **3199**（`runtime_bank_elementary` 3175 ＋ `taiwan_english_seed` 24，兩者零重疊）。原述「948」為 2026-09 前歷史值（凍結，不改）；**行內勘誤「2895」為當時值，現已過期——此格為行內勘誤漂移之實例**：行內勘誤無法獨立更新，故必漂移，此即外部 errata 存在的理由。UI 文案採「3100+」保守下界（`5a1c770`），非精確值。 | `node -e "const b=require('./data/runtime_bank_elementary.json').questions,s=require('./data/taiwan_english_seed.json').questions;console.log(b.length,s.length,b.length+s.length)"` → `3175 24 3199` | 已勘誤 |
| E-05 | §8 交接總結「後續路線」 | 「**無未完成開發項**；五大長期項目已全部完成上線」 | **已不成立**——尚有未完成項，見 E-10／E-11／E-12 | 交叉引用本表 E-10～E-12 | 已勘誤 |
| E-06 | §8「待辦／需使用者操作」 | 「LINE 兩個 Render 環境變數（需使用者操作）」 | **已完成**：LINE webhook 線上實測回 **400**（＝簽章驗證生效，secret 已設），推播已可用 | `curl -s -o /dev/null -w '%{http_code}' -X POST https://xue-gr3a.onrender.com/api/line/webhook` → `400` | 已勘誤 |
| E-07 | §5 相關 | （未記載） | **已移出主表**——本列性質為「增補新資訊」而非「勘誤」（無原述可對）。其 3 項資訊各自歸宿如下：技術棧版本見 `handover.md` §0；測試規模不記（跑 `npx vitest run` 即得）；CSS 447 處修復移入下方「凍結項」。編號依「永不复用」規則保留於此，供舊 commit 對照。 | 見下方「凍結項」 | 已關閉 |
| E-08 | 頂部「現行待辦」#1 | 「**【P0 安全】撤銷 GitHub PAT 並清理 `.git/config`** —— 本機兩個 clone 的 remote URL 仍內嵌明文 `ghp_…`（本文件 §6 自己就寫著「切勿把 PAT 寫進任何檔案」）。」 | **已完成**：細粒度 PAT 已輪換並存入 macOS Keychain（username `x-access-token`）；舊 token 已撤銷（API 回 401）。附帶：新 token 含 `workflow` scope（推送 `.github/workflows/` 所需，缺它 GitHub 會拒絕） | `git credential-osxkeychain get <<< $'protocol=https\nhost=github.com\n'`（僅驗證存在，勿輸出內容） | 已上線 |
| E-09 | 頂部「現行待辦」#2 | 「~~補最小 CI（`.github/workflows/`）——本 repo 目前**完全沒有 CI**。~~ ✅ **已完成**（commit `95d19af`：tsc → vitest → 六道品質閘門 → build，push/PR 觸發）。**殘餘缺口（2026-10-05 實測）**：第七道「孤兒 CSS」`qc:orphan` 未在 CI 閘門名單（本機實跑全綠、腳本可用）；bundle 體積閾值未建。」 | **殘餘缺口已完成**：`qc:orphan` 與 `qc:bundle` 均已入 CI（`0c39dd3`；`qc:bundle` 因需 build 產物，由 `d5277ab` 移到 Build 之後）。CI 現為**八道閘門**，首跑全綠 | `grep -c 'qc:orphan\|qc:bundle' .github/workflows/ci.yml` → `3`；`gh run list` 或 GitHub Actions 頁 | 已上線 |
| E-10 | 頂部「現行待辦」#3 | 「冷啟動（Render 免費層 15 分鐘休眠）——需先定義可接受閾值。」 | ⏳ **仍待做**——尚未定義可接受閾值 | — | 待修 |
| E-11 | 頂部「現行待辦」#4 | 「清理生產 DB 的測試班 `TNUC8E`（刪除端點已下線，需手動操作 DB）。」 | ⏳ **仍待做**——需手動操作生產 DB（刪除端點已下線，站上無法代勞） | — | 待修 |
| E-12 | 頂部「現行待辦」#5 | 「元件層色值（`--bx-*`／`--rc-*`／`--mg-*`／`--cr-*`）收斂回 design token（解 axe 對比度違規）。」 | ⏳ **仍待做**——設計 token 層對比度已全數通過（`contrast-check` 78 項），但元件層色值尚未收斂 | `node scripts/contrast-check.mjs` → `全數通過`（僅證明 token 層） | 待修 |
| E-14 | §3:231 | 「### 題庫設計優化 P0（本機 commit `05615bf`，**尚未 push**）」 | **已上線**——`05615bf` 已在 `main` | `git merge-base --is-ancestor 05615bf HEAD && echo yes` | 已勘誤 |
| E-15 | §3:239 | 「### 題庫擴充＋題型豐富化（本機 commit `9b88ef3`、`590cbaf`，**尚未 push**）」 | **已上線**——兩 commit 均已在 `main` | `git merge-base --is-ancestor 9b88ef3 HEAD && git merge-base --is-ancestor 590cbaf HEAD` | 已勘誤 |
| E-16 | §3:189 | 「## 3. 尚未完成的工作（建議順序）」 | **章名已過時**——本章 7 小節現況如下（讀者一次取得整章地圖）：<br>・**P3-2 卡牌系統收尾**：已完成（checkbox 狀態見 E-17）<br>・**P3-3 夥伴怪獸多樣化**：已上線（`d05f44f`，驗收 6/6）<br>・**P3-4 文字冒險擴充**：已上線（`e9cb41d`，驗收 12/12）<br>・**P3-5 夜間觀測深化**：已上線（`ebf9c4b`，驗收 6/6）<br>・**題庫設計優化 P0**：已上線（`05615bf`，見 E-14）<br>・**題庫擴充＋題型豐富化**：已上線（`9b88ef3`、`590cbaf`，見 E-15）<br>・**獨立待辦：LINE 推播**：已完成（見 E-06）<br>⚠️ 章名**不改**——只改章名會製造「章名說已完成、小節標題說尚未 push」的新矛盾；連小節標題一起改則超出本表範圍。 | 各 commit：`git merge-base --is-ancestor <sha> HEAD`（7 個全數在 main） | 已勘誤 |
| E-17 | §2:194-197 | 「- [ ] 最終全量測試通過 → commit…→ push。」／「- [x] 等 Render 部署…」／「- [ ] Playwright 線上驗收…」／「- [ ]（可選）卡牌美術素材…」 | **checkbox 已失效**——逐項現況：<br>・194「最終全量測試 → commit → push」：**已完成**（`4731c13` 已在 main，§2 標題自載「已上線，線上驗收 8/8」）<br>・195「等 Render 部署」：**已勾**（4 項中唯二打勾者）<br>・196「Playwright 線上驗收」：**已完成**（同上，8/8）<br>・197「（可選）卡牌美術素材、開卡機率調校、卡牌詳情彈窗動畫」：**未做**——⚠️ 此為**可選項**，非「已完成」亦非「遺漏」；untouched 不影響 P3-2 上線（此三項在前端無實作痕跡：`grep -rn '卡牌美術\|CardDetail\|packOdds' client/src` 為空）。<br>⚠️ 勿將 197 概括為「已完成」——「可選」與「已完成」是兩種狀態，errata 如實記錄。<br>⚠️ checkbox **不改**；已於 `handover.md` §2 該區塊前加一行行內指標（見下方「正文指標」）。 | `git merge-base --is-ancestor 4731c13 HEAD`；197 現況：`grep -rn '卡牌美術\|CardDetail\|packOdds' client/src`（空=未實作） | 已勘誤 |
| E-18 | §5:293-295 | 「`npx vitest run --maxWorkers=4 --pool=forks`」／「`npx vitest run server/league.test.ts --maxWorkers=2 --pool=forks`」 | **指令已失效**——`--maxWorkers` 在本機會報 tinypool 衝突（EXIT=124）。正確用法：`npx vitest run --pool=forks --poolOptions.forks.maxForks=4 --poolOptions.forks.minForks=1` | 直接執行 `npx vitest run --maxWorkers=4` → 失敗；改用上列參數 → 全綠 | 待修 |
| E-19 | §5:304 | 「推送（使用 GitHub PAT 作為 remote 認證；切勿把 PAT 寫進任何檔案或 commit，**用後建議輪換**）」 | **已完成輪換**——細粒度 token 已入 macOS Keychain；舊 token 已撤銷（401）。⚠️ 現行 token **含 `workflow` scope**（推送 `.github/workflows/` 所需；缺它 GitHub 會拒絕，本輪曾因此 push 失敗一次） | 見 E-08 | 已上線 |

> **E-08～E-12 說明**：這 5 項原為 `handover.md` 的「現行待辦」。
> 遷入本表而非留在 handover，理由是**單一記錄點**——待辦留在 handover、狀態記在本表，
> 等於一項完成要改兩處（雙記錄點必然不同步，此為本輪反覆修掉的結構）。
> 「該做什麼」與「做到哪」同屬狀態性內容，集中一處。

---

## 凍結項

> 這些內容**刻意保留原值，不勘誤、不更新**——它們是歷史量測記錄，改寫會使紀錄失真。
>
> **判準**：原述是否**帶時間／commit 標記**、且讀起來就是歷史？
> 是 → 凍結；否、讀起來像現況（如 §0 表格）→ 進對照表勘誤。
>
> ### 為何用「規則」而非「逐條列」
>
> 初版試圖逐條列出所有凍結項，結果只列了 5 條——**而全檔同類宣稱有 25+ 處**。
> 這不是執行失誤，是方法缺陷：**逐條列的工作量隨內容線性增長，人的掃描會在注意力容量處飽和**；
> 列到第 5 條就停，不是因為只有 5 條。
>
> 規則法是唯一能完整的做法——它不是「列出所有條目」，而是**定義一個維度，讓所有條目自動屬於它**。
> 新增章節亦自動適用，不需回頭補列。

### 凍結維度（規則式）

**凍結基線：`194e696`**（本規則生效之 commit）。驗證一律以此基線做 diff，**不掃全歷史**。

| 維度 | 範圍 | 理由 | 驗證（相對基線 `194e696`） |
|---|---|---|---|
| 全量測試數（檔數／測試數） | `handover.md` 內文全部（§1～§8 及日期章節） | 當時驗收記錄，帶 commit 語境即為歷史 | `git diff 194e696 -- docs/handover.md \| grep -E '^[-+].*[0-9]{3,4} (測試\|tests)'` → 應為空 |
| bundle hash（`index-*.js`） | 內文全部 | 構建產物，**跨環境不可比**（§108 已警告） | `git diff 194e696 -- docs/handover.md \| grep -E '^[-+].*index-[A-Za-z0-9_-]+\.js'` → 應為空 |
| 題數（948／1090／2895 等） | 內文全部 | 題庫演進史，改寫會失真 | `git diff 194e696 -- docs/handover.md \| grep -E '^[-+].*(948\|1090\|2895)'` → 應為空（**§0 表格除外**，該處已列 E-04 勘誤） |

> **驗證欄的用途**：規則式凍結的風險是「規則存在但無人執行」。
> 未來任何 PR 若改了這些行，reviewer 可依此拒絕——否則規則只是宣告。
>
> ⚠️ **為何用「基線 diff」而非「全歷史 grep」**：初版寫法是 `git log -p | grep '^\+…'`，
> 實測**命中 28 筆且永遠非空**——它抓到的是「歷史上新增這些行的 commit」，不是「違規修改」。
> 一道永遠紅的檢查等於沒有檢查。正確做法是相對**凍結生效的那個 commit** 做 diff：
> 基線之前怎麼寫是歷史，基線之後才叫違規。
>
> ⚠️ **grep 方言**：上列指令用 `grep -E`（ERE）。ERE 中 `|` 直接寫、**不要寫 `\|`**
> （`\|` 在 ERE 是**字面管道符**，會讓整個 pattern 零命中——初版即犯此錯，
> 且因與 `{3,4}` 的疑問混在一起而未被察覺；`{3,4}` 在 ERE 下本身有效）。

### 逐條凍結項（規則未覆蓋者）

| # | 位置 | 凍結內容 | 凍結理由 |
|---|---|---|---|
| E-07 | （原 §5 相關列，已移出主表） | 「另有 **447 處 CSS 選擇器損壞已修復**」（2026-09-29 實測） | 歷史量測記錄，改寫會失真；此數字為當時一次性修復成果，之後未重新量測 |
| E-13 | （規則式凍結，見上表） | 原 E-13～E-17 逐條列**已作廢**，改用上方「凍結維度」規則覆蓋。編號依「永不复用」規則保留此處，供舊 commit 對照。 | 逐條列不完整（僅 5 條 vs 實際 25+ 處），改以維度規則覆蓋 |

---

## 正文指標（已加於 `handover.md` 者）

> 「正文凍結」指**不改寫內容**；但當某處**在不讀 errata 時會被誤讀**，於該處加**指標**（非內容）。
> 指標不含資訊，只是指路——與「雙記錄點」不同。

| 位置 | 指標內容 | 所屬條目 |
|---|---|---|
| `handover.md` 頂部「現況勘誤」節 | 指向本表；並註明原 7 列與 5 待辦已遷入 | —（commit `5a8c1a0`） |
| `handover.md` §2「P3-2 卡牌系統收尾」checkbox 區塊前 | 「⚠️ 以下 checkbox 為歷史行動清單…實際均已完成／已驗收…見 E-17」 | E-17 |
| `handover.md` §0「前端」欄 | 補實際版本（正文補全，非勘誤） | E-07 歸宿 |

> **未加指標者及其理由**：§3 章名（E-16）——只改章名會製造「章名說已完成、小節標題說尚未 push」的新矛盾；
> 連小節標題一起改則超出本表範圍。故僅於本表記錄，不加指標。

---

## 未解風險（非勘誤，為待觀察項）

| # | 風險 | 現況 | 診斷步驟 |
|---|---|---|---|
| R-01 | **push 間歇失敗**（2026-10-07） | 連續 6 次 `git push` 失敗，git 報 `Internal Server Error`。後續同一 token 推送成功（`fd23598`）。**真因未知**——三次假說（GitHub 端故障／token 失效／殭屍憑證取用）**均已由實驗推翻**，不再編新理論。<br>⚠️ **防誤判（本條最有價值處）**：**git 認證流程本身包含 401**——無憑證試探 → 401、帶憑證 → 可能 401 → 200。<br>**看到 401 不等於故障，必須看最終是否 200。** 本事件前三次誤判（GitHub 故障／token 失效／殭屍憑證）**均源於把正常握手當成異常**。 | **先看最終結果，再看中間過程**：<br>`GIT_CURL_VERBOSE=1 git push origin main 2>&1 \| grep -oE "Recv header: HTTP/2 [0-9]+\|Server auth using Basic with user '[^']+'"`<br>→ 序列結尾若為 `200` 即正常（中間的 401 是握手）。<br>→ 若結尾非 200，才需查實際使用的 acct。<br>⚠️ 別信 git 的錯誤文案（它會把 401 報成 Internal Server Error）。<br>⚠️ 上列 pattern 不要寫 `^< HTTP`——trace 行首有時間戳，該 pattern **零命中**（初版即犯此錯）。 |
| R-02 | Keychain 失效憑證殘留 | `junwei1o`（指紋 `e48296425b0c`）已失效：**GitHub 側已無此 token**（token 頁面僅列 `xue-adventure-push` 一顆），但本地 Keychain 仍在——撤銷不會同步清除本地快取。<br>**實際危害（實測）**：remote URL **不含 username** 的 clone（如 `~/Documents/trae_projects/hdmx`）以 host-only 查詢時**取到這顆**（`/user` → 401）→ 該 clone 任何需認證的操作都會失敗。<br>⚠️ 與 push 失敗**無關**（push URL 為 `x-access-token@…`，精確匹配，取不到這顆）——R-01 的殭屍假說已推翻。 | 清除指令（明確指定 acct）：<br>`security delete-internet-password -s github.com -a junwei1o`<br>清除前先跑：`printf 'protocol=https\nhost=github.com\n\n' \| git credential fill \| grep '^username='` → 確認 host-only 查詢不再回 `junwei1o`。 |
