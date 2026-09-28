# 設計變數與共用樣式指南（Design Tokens）

> 單一事實來源：`client/src/index.css` 檔頭的「設計變數」區塊。
> 2026-09-28 全面複核：本文早期版本宣稱「品牌色字面值已全數收斂」，
> 經 `scripts/analyze-colors.mjs` 實測**該說法不成立**，已更正（見下方〈色碼收斂的實測結論〉）。

## 為什麼需要

統一前全站有 **1503 種寫死的色碼、114 種圓角、536 種陰影**（僅 CSS 檔）。
同樣的「白色」就有 `#fff / #ffffff / #fffdf8 / #fffdf6 / #fffdf7 / #fffdf5 / #fffaf2 / #fffaff` 八種寫法。
現在全部收斂到一組變數：改一處、全站生效。

## 色碼收斂的實測結論（2026-09-28 更正）

`scripts/analyze-colors.mjs` 對全站 1201 處 `rgba()` / 810 種 hex 做等值比對後，
**真正等於既有 brand token 的只有 6 處**。其餘 1200+ 處是各頁面刻意挑的色值。

關鍵發現：以 `#176579`（index.css 最多，31 處）為例，它與 `--tidal`(#0B6E8E)
的色相只差 2.5°（192.2° vs 194.7°），是**同一個「潮藍」的不同明度**，而非同一個值。
硬替成 `var(--tidal)` 會改變明度與對比，是視覺退步。

因此：

- ✅ **已收斂**：31 處精確等值（hex→token、rgba(brand)→color-mix(brand)），
  由 `scripts/normalize-colors.mjs` 執行。該腳本**會跳過所有 token 定義區**
  （`:root` 與 `:root[data-theme=...]`）——早期版本沒跳過，一度把
  `--tidal:#0B6E8E` 改成 `--tidal:var(--tidal)` 造成自我引用、主題失效，已修正並加驗證。
- ⏸ **待處理**：其餘 ~1200 處需要**新增語意色階 token**（如 `--tidal-700: #176579`）
  再逐頁遷移。這需要設計決策（哪些色階該進系統）＋逐頁目檢，不是機械替換。
- 實測 `scripts/theme-audit.mjs` 顯示：`body` 背景／文字在四個主題下都正確變化，
  但部分內部元素（樣本中的 `h1`/`p`/`button`/`card`）四主題完全不變——
  這些就是上面那批沒 token 化的色值。

## 品牌色

| Token | 值 | 用途 |
|---|---|---|
| `--paper` | `#F9F3E8` | 底紙（頁面背景） |
| `--paper-deep` | `#EFE6D7` | 深底紙／分區底 |
| `--white` | `#FFFDF8` | 卡面白（含一切白色：`#fff` 系全部併入） |
| `--ink` | `#1F3031` | 主文字墨 |
| `--muted` | `#5F6E6A` | 次要文字 |
| `--line` | `#D9D1C2` | 邊框線 |
| `--tidal` / `--tidal-deep` | `#0B6E8E` / `#07516A` | 潮藍（主品牌色／深） |
| `--coral` / `--coral-deep` | `#E8754A` / `#C25B36` | 珊瑚橘（行動色／深） |
| `--moss` | `#6C8460` | 苔綠（成功） |
| `--yellow` | `#E8B84B` | 芥黃（警示／點數） |

**半透明**一律用 `color-mix(in srgb, var(--tidal) 18%, transparent)` 這種寫法，
不要再寫 `rgba(11,110,142,.18)`（兩者等值，前者單一來源）。

子系統命名空間（`--cr-*` 教室、`--bx-*`、`--env-*` 生態、`--anime-*`、`--mg-*`）
保留，但值必須由品牌變數派生（如 `--sea: var(--tidal)`），不得自訂新色相。

## 字型

| Token | 堆疊 | 用途 |
|---|---|---|
| `--font-display` | Fraunces, Noto Serif TC, serif | 標題／展示數字 |
| `--font-serif` | Georgia, Noto Serif TC, serif | 長文襯線 |
| `--font-serif-tc` | Noto Serif TC, serif | 純中文襯線 |
| `--font-sans` | Noto Sans TC, PingFang TC, Microsoft JhengHei | 介面預設 |
| `--font-mono` | ui-monospace… | 代碼 |

## 尺度

- **圓角**：`--radius-sm` 8 / `--radius-md` 12 / `--radius-lg` 18 / `--radius-xl` 24 / `--radius-pill` 999px
- **陰影**：`--shadow-xs` → `--shadow-xl`（同一深墨綠色相家族）＋ `--shadow-inset`
- **間距**：`--space-1` 4 → `--space-10` 40（4px 基準）
- **z-index**：頁面內局部堆疊 1–9；`--z-nav` 80 / `--z-overlay` 120 / `--z-toast` 999
- **動效**：`--ease`、`--ease-out`、`--dur-fast` 160ms / `--dur-base` 220ms / `--dur-slow` 380ms

## 字級系統（2026-09-28 建立）

統一前全站 CSS 有 **1053 處 `font-size` 字面值、55 種不同 px 值**，
主堆疊壓在 10–15px，並夾雜 `12.5` / `13.5` / `14.5` / `15.5` / `16.5` 等
**沒有任何設計理由的半像素值**。受眾是國小高生，這種偏小的字級是可讀性問題。

### 語意尺度（`client/src/index.css` 的 `:root`）

| Token | 值 | 用途 |
|---|---|---|
| `--type-display` | `clamp(2rem, 3.8vw, 3.25rem)` | 大標／展示數字 |
| `--type-title` | `clamp(1.55rem, 2.4vw, 2.15rem)` | 頁面標題 |
| `--type-section` | `clamp(1.2rem, 1.8vw, 1.55rem)` | 區塊標題 |
| `--type-lead` | `1.125rem`（18px） | 卡片主標／引言 |
| `--type-body` | `0.9375rem`（15px） | 內文 |
| `--type-support` | `0.875rem`（14px） | 次要說明 |
| `--type-meta` | `0.8125rem`（13px） | 標籤／meta |
| `--type-micro` | `0.75rem`（12px） | 最小可讀 |
| `--type-eyebrow` | `0.6875rem`（11px） | 全大寫導言 |

### 遷移規則（重要）

遷移由 `scripts/normalize-type.mjs` 執行，共替換 **404 處**。原則：

1. **只放大、不縮小**。每個舊值都對到「不小於它」的最小桶
   （10/11/12 → 12px、13 → 13px、14 → 14px、15 → 15px、16/17/18 → 18px）。
   因此沒有任何文字變小，是純可讀性提升。
2. **刻意極小的排版元素不動**：`.hero-stamp`、`.note-stamp`、`.brand-lockup span`、
   `.astronomy-sun`、`.map-pin`、`.eyebrow` 等裝飾性戳記／浮水印維持原值。
3. **表單控制項不動**：`input` / `textarea` / `select` 的 `16px` 是 iOS Safari
   的下限保護（小於 16px 會觸發整頁自動放大），不能為了統一而改。
4. `clamp()` / `calc()` / `em` / `rem` 與已 token 化的值不動。

### 殘留（標題層，刻意保留）

649 處 px 字面值集中在 `18px` 以上——這些是各頁自行設計的標題層尺寸，
收斂需要逐頁目檢，留待下一輪。

## 斷點系統（2026-09-28 統一）

統一前全站有 **20 個不同的 `@media max-width` 值**（360/380/390/400/420/440/480/520/
560/600/620/640/650/680/700/720/760/900/960/980），而 Tailwind 預設只有
640 / 768 / 1024 / 1280 / 1536。TSX 裡的 `md:` 是 768px，但 CSS 裡存在 760px 的
切換點——**同一頁面不同區塊會在不同寬度突然換行**，這是最傷一致性的問題。

### 標準四檔

| 檔 | 斷點 | Tailwind 對應 | 裝置 |
|---|---|---|---|
| sm | 640px | `sm:` | 手機 |
| md | 768px | `md:` | 平板 |
| lg | 1024px | `lg:` | 小桌面 |
| xl | 1280px | `xl:` | 大桌面 |

由 `scripts/normalize-breakpoints.mjs` 執行，替換 **134 處 / 19 檔**。

- **映射一律向下取整**到最近標準檔，讓切換點只會提早、不會延後，
  避免原本在 700px 生效的規則變成 768px 後漏掉 700–768 的版面。
- **`min-width` 必須連動**。原本 `min-width:651px` 配 `max-width:650px`（差 1px）
  是一組互補條件；若只把 max 映射到 768 而 min 留在 651，651–768 區間兩個條件
  都不成立，該區間會「兩邊都失效」。腳本會自動把 `min-width:651/681px`
  一併調整為 `769px` 維持互補。

## 共用元件類別（.app-*）

新頁面直接取用，不要再複製按鈕／卡片樣式：

- `.app-btn` ＋ `--primary`（潮藍）/ `--accent`（珊瑚）/ `--secondary`（描邊）/ `--ghost`
- `.app-card`（白卡、line 邊、radius-lg、shadow-md）
- `.app-input`（44px 高、white 底、md 圓角）

## 規範

1. CSS 內不得出現品牌色字面值（`#0B6E8E` 等）——一律 `var()`。
2. 舊的 `var(--x, #HEX)` fallback 寫法已清理為 `var(--x)`；新代碼不需要 fallback。
3. 圓角請對號入座尺度；確實需要中間值時先在這裡提案新增 token，不要自創 13px、14px。
4. 字級一律用 `var(--type-*)`，不要寫 px 字面值，也不要寫半像素（12.5px 之類）。
5. 響應式斷點只有 640 / 768 / 1024 / 1280 四檔。新增 `@media` 前先確認真的需要第五檔；
   TSX 裡用 Tailwind 的 `sm:` / `md:` / `lg:` / `xl:` 保持一致。
6. 守門測試：`client/src/globalTheme.test.ts`（宣紙底、字型堆疊、pill 圓角）、
   `client/src/game/environmentTokens.test.ts`（生態系統命名空間與斷點）。

## 驗證工具

| 腳本 | 用途 |
|---|---|
| `scripts/analyze-colors.mjs` | 色碼等值分析：哪些 hex 真的等於既有 token |
| `scripts/theme-audit.mjs [SITE]` | 主題切換實測：量化哪些元素沒吃到 token |
| `scripts/normalize-breakpoints.mjs [--dry]` | 斷點收斂（支援 `--dry` 預覽） |
| `scripts/normalize-type.mjs [--dry]` | 字級收斂（排除裝飾與表單項） |
| `scripts/normalize-headings.mjs [--dry]` | h1/h2 收斂到 `--type-hero` / `--type-section` |
| `scripts/normalize-radius.mjs [--dry]` | 圓角等值收斂（排除刻意裝飾幾何） |
| `scripts/normalize-colors.mjs [--dry]` | 色碼**等值**收斂（自動跳過 token 定義區） |
| `scripts/ui-shots.mjs <tag> [SITE]` | CDP 截圖 + 版面度量，375/768/1280 三檔 |
| `scripts/ui-overflow.mjs <route> <width>` | 單頁水平溢出歸因（重複取樣排除動畫中間態） |

所有 `normalize-*` 腳本都支援 `--dry`，且**可重複執行**（已收斂的值會被跳過，輸出 0）。

> ⚠️ 改這些腳本時務必注意：`normalize-colors.mjs` 必須跳過 `:root` 與
> `:root[data-theme=...]` 區塊，否則會把 token 定義改成自我引用。
> 改完請用這兩條驗證：
> `node scripts/normalize-colors.mjs --dry`（應輸出 0）
> 以及搜尋自我引用（應無結果）：
> `grep -rE '\-\-[a-z-]+:\s*var\(\s*\1\s*\)' client/src --include='*.css'`

`ui-shots.mjs` 會自動注入 `xue-session-v1` session 繞過登入閘，
否則所有路由都只渲染登入卡。

## 已知的後續空間

- **色碼（最大宗，約 1200 處）**：需要先設計語意色階 token（如 `--tidal-700`）
  再逐頁遷移，不能機械替換。詳見〈色碼收斂的實測結論〉。
- 圓角已收斂 10 處等值；剩餘 2–14px 的字面值都是**刻意設計**（彩旗幾何、
  memphis 皮膚、focus ring、地圖圖釘、進度條），不建議再動。
- 字級的 `18px` 以上標題層已收斂 h1/h2 共 39 處到 `--type-hero` / `--type-section`；
  卡片標題 h3、stat 數字、裝飾字、遊戲 sprite 維持原值（刻意設計）。
- 大量一次性陰影（536 種中的長尾）維持原樣；新樣式請用 `--shadow-*`。
- TSX 內聯樣式與 canvas 遊戲代碼中的色碼不在本輪範圍。
- `.principle-guide` 存在新舊兩套設計（index.css 兩處定義，後者覆蓋前者），舊段疑似死碼，待確認後移除。
- `<img>` 6 個**全部已有 `alt`**（site-improvement-plan P1-4 的「缺 3 個 alt」說法已過時）；
  本輪補上 3 處 `loading="lazy"`。`RegionDetail.tsx` 刻意不加 lazy——
  它是 LCP 元素且已有 `fetchPriority="high"`。
- 下輪死碼清理目標：`TaiwanLandmarkMap`、`mapVictoryProgress`、
  `AnalyticsConsentPrompt` 皆已不存在（上輪已清）；
  `randomAdventureRouteReward`／`academyExpansion` 仍被 `PaperExam`／`Home` 引用，**不可刪**。
