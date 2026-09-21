# 設計變數與共用樣式指南（Design Tokens）

> 單一事實來源：`client/src/index.css` 檔頭的「設計變數」區塊。
> 2026-09 全站 UI 統一時建立；各頁面 CSS 的品牌色字面值已全數收斂為變數引用。

## 為什麼需要

統一前全站有 **1503 種寫死的色碼、114 種圓角、536 種陰影**（僅 CSS 檔）。
同樣的「白色」就有 `#fff / #ffffff / #fffdf8 / #fffdf6 / #fffdf7 / #fffdf5 / #fffaf2 / #fffaff` 八種寫法。
現在全部收斂到一組變數：改一處、全站生效。

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

## 共用元件類別（.app-*）

新頁面直接取用，不要再複製按鈕／卡片樣式：

- `.app-btn` ＋ `--primary`（潮藍）/ `--accent`（珊瑚）/ `--secondary`（描邊）/ `--ghost`
- `.app-card`（白卡、line 邊、radius-lg、shadow-md）
- `.app-input`（44px 高、white 底、md 圓角）

## 規範

1. CSS 內不得出現品牌色字面值（`#0B6E8E` 等）——一律 `var()`。
2. 舊的 `var(--x, #HEX)` fallback 寫法已清理為 `var(--x)`；新代碼不需要 fallback。
3. 圓角請對號入座尺度；確實需要中間值時先在這裡提案新增 token，不要自創 13px、14px。
4. 守門測試：`client/src/globalTheme.test.ts`（宣紙底、字型堆疊、pill 圓角）、
   `client/src/game/environmentTokens.test.ts`（生態系統命名空間）。

## 已知的後續空間（本輪未動，避免視覺變動）

- 圓角仍有 10/13/14/16/20/22px 等過渡值（約 250 處），收斂會微調外觀，需逐頁目檢。
- 大量一次性陰影（536 種中的長尾）維持原樣；新樣式請用 `--shadow-*`。
- TSX 內聯樣式與 canvas 遊戲代碼中的色碼不在本輪範圍。
- `.principle-guide` 存在新舊兩套設計（index.css 兩處定義，後者覆蓋前者），舊段疑似死碼，待確認後移除。
- `components/AnalyticsConsentPrompt.tsx` 已被 PrivacyBanner 取代且無人渲染，可連同測試一併移除。
