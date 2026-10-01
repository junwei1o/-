import type { ReactNode } from "react";

/**
 * 站長後台的模組擴充契約（2026-10-01）。
 *
 * 設計目標：**新增一個後台模組＝新增一個檔案 ＋ 在註冊表加一行**，
 * 外殼（AdminShell）與版面完全不需要改動。因為站長後台的內容預期會
 * 持續擴充且型態多元，所以這裡刻意把所有「變化點」都收斂成型別欄位：
 *
 * - 想歸到新分類 → 只要在 `ADMIN_GROUPS` 加一筆（未知分類也會自動附加，不會消失）
 * - 想調順序   → `order`（同組內由小到大）
 * - 想要整列或半寬 → `span`
 * - 想依環境決定是否出現 → `isAvailable`
 * - 內容型態不限（指標、表格、表單、日誌…）→ `render` 直接回傳任意 ReactNode
 */

/** 分組識別碼。刻意用 `string` 而非 union：新增分組不該需要改型別。 */
export type AdminGroupId = string;

export type AdminModule = {
  /** 唯一識別碼（用於 React key 與除錯）。 */
  id: string;
  /** 卡片標題。 */
  title: string;
  /** 所屬分組；填一個尚未登記的分組也會被自動附加到最後，不會被丟掉。 */
  group: AdminGroupId;
  /** 一句話說明這個模組在管什麼（顯示在標題下方，幫站長快速掃描）。 */
  summary?: string;
  /** 同組內的排序權重（小→大）；未給則視為 0。 */
  order?: number;
  /** 版面寬度：`full` 佔整列、`half` 佔一半（窄螢幕一律整列）。預設 `half`。 */
  span?: "full" | "half";
  /** 是否應出現（例如依環境變數或功能旗標）。預設一律顯示。 */
  isAvailable?: () => boolean;
  /** 模組內容。型態不限——這正是「全能通用」的關鍵。 */
  render: () => ReactNode;
};

export type AdminGroup = {
  id: AdminGroupId;
  /** 分組標題（例如「營運與資源」）。 */
  label: string;
  /** 分組說明。 */
  description?: string;
  /** 分組排序權重（小→大）。 */
  order: number;
};
