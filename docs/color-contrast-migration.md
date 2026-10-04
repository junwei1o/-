# 全站對比度違規遷移清單（color-contrast）

> 由 `scripts/axe-nightly` 的 40 條路由巡檢產生（2026-10-04，bundle `assets/index-Co4Us4kl.js`、axe 4.13.0）。
> 本檔是**診斷與提案**，尚未動任何 CSS。

## 1. 為什麼要單獨列這份

`scripts/contrast-check.mjs` 只驗 **design token 層**（§4.2 的配對組合），驗不到「實際渲染出來的組合」。
所以 `docs/color-tokens.md` §4.1 明明寫著「一般文字需 4.5:1、`*-500` 只給大字與圖形」，
但畫面上仍有一批**用 `*-500` 或原始 base token 當一般文字**的地方——閘門看不到，只有 axe 巡檢看得到。

## 2. ⚠️ 先扣掉 axe 的假陽性

巡檢共標出 329 個 color-contrast 節點。逐節點往上檢查祖先是否有 `background-image` 後：

| 分類 | 組合數 | 節點數 |
| --- | --- | --- |
| **疑似真違規**（背景為實色） | 41 | **286** |
| 疑似假陽性（祖先有漸層／背景圖） | 7 | 43 |

**axe 讀不出漸層**，會退回頁面底色（近白）來算，於是深色卡上的淺色字被誤判。
實例：`.principle-guide` 的背景是 `linear-gradient(135deg, rgba(12,41,59,.96), rgba(20,31,66,.96))`
配 `color:#edf8fb`——**設計正確**，卻被算成 1.06:1。

→ **不可以照著 axe 的數字無腦改**，那會把深色卡改壞。這 43 個節點要嘛略過，要嘛改用「真實底色」重測。

## 3. 真違規清單（依節點數排序）

`建議值` = 以**等比朝黑縮放**求出的**最小加深值**（保留色相、視覺變動最小），四捨五入到 8-bit。

| 節點 | 選擇器 | 現值 | 現對比 | 建議值 | 修正後 |
| ---: | --- | --- | ---: | --- | ---: |
| 34 | `tr:nth-child(2) > td:nth-child(6) > .rate-low.answer-board-rate \| tr:nth-child(3) > td:nth-child(6) > .rate-low.answer-board-rate` | #C25B36 on #FFFEFB | 4.30 | **#BD5935** | 4.50 |
| 27 | `.principle-amber.principle-card:nth-child(1) > .principle-link \| .principle-coral.principle-card:nth-child(2) > .principle-link` | #D36E4D on #FCFEFE | 3.40 | **#B45E42** | 4.50 |
| 24 | `.settings-codex-entry:nth-child(1) > div > p \| b[aria-label="古籍星君 擊敗 0 次"]` | #84969D on #D9DFE2 | 2.28 | **#586569** | 4.50 |
| 23 | `tr:nth-child(5) > td:nth-child(6) > .rate-high.answer-board-rate \| tr:nth-child(12) > td:nth-child(6) > .rate-high.answer-board-rate` | #5E8577 on #FFFEFB | 4.08 | **#597E70** | 4.50 |
| 15 | `div[aria-label="各科正確率摘要"] > .learning-report-line[role="listitem"]:nth-child(1) > small \| div[aria-label="各科正確率摘要"] > .learning-report-line[role="listitem"]:nth-child(2) > small` | #78847D on #F8FBFB | 3.74 | **#6C7770** | 4.50 |
| 14 | `tr:nth-child(1) > td:nth-child(6) > .rate-mid.answer-board-rate \| tr:nth-child(4) > td:nth-child(6) > .rate-mid.answer-board-rate` | #E3B54C on #FFFEFB | 1.90 | **#8F7230** | 4.50 |
| 13 | `.principle-amber.principle-card:nth-child(1) > .principle-number \| .principle-coral.principle-card:nth-child(2) > .principle-number` | #9AA59D on #FCFEFE | 2.52 | **#707872** | 4.50 |
| 13 | `.principle-amber.principle-card:nth-child(1) > .principle-english \| .principle-coral.principle-card:nth-child(2) > .principle-english` | #8A938C on #FCFEFE | 3.13 | **#707872** | 4.50 |
| 12 | `.settings-codex-entry:nth-child(1) > div > strong \| .settings-codex-entry:nth-child(2) > div > strong` | #54676F on #D9DFE2 | 4.40 | **#53656D** | 4.50 |
| 12 | `.settings-codex-entry:nth-child(1) > div > small \| .settings-codex-entry:nth-child(2) > div > small` | #4C94AC on #D9DFE2 | 2.54 | **#36697A** | 4.50 |
| 11 | `.bx-tour__body > strong \| strong` | #F5A623 on #FCFEFE | 2.00 | **#9F6C17** | 4.50 |
| 10 | `.weekly-quiz-question:nth-child(1) > .weekly-quiz-q-head > small \| .weekly-quiz-question:nth-child(2) > .weekly-quiz-q-head > small` | #888888 on #DCE7E9 | 2.81 | **#676767** | 4.50 |
| 10 | `.palette-yellow:nth-child(1) > .observatory-card-body > .observatory-learning > span \| .palette-coral:nth-child(2) > .observatory-card-body > .observatory-learning > span` | #5E8577 on #FCFEFE | 4.07 | **#597D70** | 4.50 |
| 10 | `.astronomy-blue > .astronomy-card-number \| .astronomy-amber > .astronomy-card-number` | #A7AEA7 on #FCFEFE | 2.24 | **#727772** | 4.50 |
| 7 | `.observation-card.region-detail-card:nth-child(1) > .observation-list > div:nth-child(1) > b \| .observation-card.region-detail-card:nth-child(1) > .observation-list > div:nth-child(2) > b` | #E8754A on #FCFEFE | 2.93 | **#B75C3A** | 4.50 |
| 6 | `tr:nth-child(30) > .answer-board-name > .answer-board-guest-tag \| tr:nth-child(31) > .answer-board-name > .answer-board-guest-tag` | #587079 on #DCE7E9 | 4.15 | **#546A73** | 4.50 |
| 5 | `button[aria-label="生病發燒怎麼辦"] > .safety-tag-medical.safety-card-tag \| button[aria-label="什麼時候請大人撥打 119"] > .safety-tag-medical.safety-card-tag` | #C14A42 on #F7EAE9 | 4.14 | **#B7463F** | 4.50 |
| 5 | `button[aria-label="火場逃生：低姿勢與濕毛巾"] > .safety-tag-fire.safety-card-tag \| button[aria-label="避難路線與消防演習"] > .safety-tag-fire.safety-card-tag` | #B85E10 on #F7EBDE | 3.85 | **#A7560F** | 4.50 |
| 4 | `.wormhole-copy > .accent.eyebrow \| .media-detail-hero > div:nth-child(1) > .accent.eyebrow` | #E8754A on #EAF1F2 | 2.60 | **#AA5636** | 4.50 |
| 4 | `.safety-tab:nth-child(2) > .safety-tab-count \| .safety-tab:nth-child(3) > .safety-tab-count` | #81949A on #FCFEFE | 3.13 | **#69797D** | 4.50 |
| 3 | `.settings-eyebrow \| div > p:nth-child(3)` | #61736B on #EAF1F2 | 4.40 | **#60716A** | 4.50 |
| 2 | `.principles-code` | #7B8278 on #EAF1F2 | 3.46 | **#696F67** | 4.50 |
| 2 | `.wormhole-copy > p:nth-child(3) \| .detail-lede` | #667572 on #EAF1F2 | 4.22 | **#62706E** | 4.50 |
| 2 | `.principles-footer-note > p \| .principles-footnote` | #6D7B77 on #EAF1F2 | 3.87 | **#63706D** | 4.50 |
| 2 | `.astronomy-field-note > p \| .region-question-card > div > p:nth-child(3)` | #6B726B on #E9E0CF | 3.78 | **#606660** | 4.50 |
| 1 | `.mc-lesson-badge` | #C25B36 on #F9EBE5 | 3.73 | **#AD5130** | 4.50 |
| 1 | `.hub-core-tag` | #C25B36 on #F9ECE7 | 3.75 | **#AE5230** | 4.50 |
| 1 | `.answer-board-named-tag` | #5E8577 on #E4ECEA | 3.43 | **#507165** | 4.50 |
| 1 | `.adventure-journal-kicker` | #6D7C5A on #FAF7EA | 4.18 | **#687756** | 4.50 |
| 1 | `.observatory-note > div > strong` | #5E8577 on #EEF2E9 | 3.63 | **#537569** | 4.50 |
| 1 | `.wisdom-entry-link > span > small` | #6C7E79 on #F4F9F9 | 4.04 | **#657671** | 4.50 |
| 1 | `.principles-code` | #7B8278 on #FAFCFD | 3.85 | **#70776D** | 4.50 |
| 1 | `.is-active.safety-tab > .safety-tab-count` | #C0DAE2 on #0B6E8E | 3.95 | **#000000** | 3.64 |
| 1 | `.region-question-card > div > .accent.eyebrow` | #E8754A on #E9E0CF | 2.27 | **#9C4F32** | 4.50 |
| 1 | `.media-detail-signal` | #5E8577 on #EAF1F2 | 3.60 | **#527468** | 4.50 |
| 1 | `.media-detail-question > strong` | #E8754A on #F0EEE6 | 2.56 | **#A85536** | 4.50 |
| 1 | `strong[aria-current="page"]` | #7C8780 on #EAF1F2 | 3.26 | **#67706A** | 4.50 |
| 1 | `.detail-english` | #B06A4B on #EAF1F2 | 3.67 | **#9C5E42** | 4.50 |
| 1 | `aside > .detail-card-label` | #D36E4D on #E7EEEC | 2.92 | **#A4563C** | 4.50 |
| 1 | `aside > p` | #5E706B on #E7EEEC | 4.45 | **#5D6F6A** | 4.50 |
| 1 | `.thinking-prompt > span` | #8A938C on #F1F6F5 | 2.90 | **#6B726D** | 4.50 |

## 4. 落地方式（三選一，需決策）

**A. 實作語義色階**（`docs/color-tokens.md` 的本意）
目前整個 CSS **只有 `--color-neutral-700` 一個 `--color-*` token 真的存在**——
§3 那幾張表多半還是文件狀態。要照規範走，就得先把 `--color-{danger,warning,success,accent,neutral}-{50..900}` 補齊（4 個主題各一套），再把違規處換過去。
**改動最大，但一次解決，且 `contrast-check.mjs` 之後就能真的守住。**

**B. 只加「文字用」深色變體**
例如新增 `--coral-ink`／`--moss-ink`／`--yellow-ink`，值取上表的建議值，違規處改用它。
改動小、語意清楚；缺點是色階會多出一組沒有規範的 token。

**C. 就地改值**
直接把違規處的 hex 換成建議值。最快，但散落各檔、沒有語意，日後容易再走鐘。

> 我的建議：**A**。這批違規的根因就是「色階沒落地」，補 B 或 C 只是把症狀搬走。

## 5. 為什麼需要人工確認

上表的建議值是「**剛好過 4.5:1**」的數學解，不是設計解。實際落地前要有人看過畫面——
尤其 `/answer-board` 的 `.rate-*`（71 節點）與各館舍的卡片文字，改完會明顯變深。

另外 **4 個主題各有一套 token 值**（`client/src/index.css` 的 `[data-theme]` 區塊），
本清單只涵蓋**預設主題**的實測；其餘主題要用同一支巡檢逐一套用後複驗。

