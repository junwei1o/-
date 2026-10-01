/**
 * 「全站資源監控」卡片的顯示邏輯（純函式，可獨立測試）。
 *
 * 對應伺服器端 `dbUsage.status` 的回傳。**這個數字是推估值**——
 * 真實 RU 需 TiDB Cloud API 憑證，本站尚未配置；因此所有文案都必須
 * 明確標示來源，不能讓使用者誤以為是帳單數字。
 */

export type DbUsageWarningLevel = "ok" | "watch" | "high" | "unknown";

/** 與 server/dbUsage.ts 的 DbUsageStatus 對應（只取前端需要的欄位）。 */
export type DbUsageStatusView = {
  source: "estimate";
  sourceNote: string;
  quota: { ruPerMonth: number; label: string };
  uptimeMs: number;
  statements: number;
  failedStatements: number;
  rowsTouched: number;
  estimatedRu: number;
  percentOfQuota: number;
  ruPerHour: number | null;
  projectedMonthlyRu: number | null;
  sustainableRuPerHour: number;
  level: DbUsageWarningLevel;
};

/** 給使用者看的額度說明（依需求原文，說明何時該擔心）。 */
export const RU_QUOTA_EXPLANATION =
  "此額度對一般小型網站或個人專案通常足夠；但資料庫操作密集的情境（例如高頻 API 呼叫、大量寫入）會明顯加快 RU 消耗，需特別關注消耗速度。";

/**
 * 把數字縮成好讀的中文單位。
 * 5000 萬 = 50,000,000；避免用「M／B」等英文縮寫（目標使用者是繁體中文讀者）。
 */
export function formatRu(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${trimZero(value / 100_000_000)} 億`;
  if (abs >= 10_000) return `${trimZero(value / 10_000)} 萬`;
  if (abs >= 1_000) return value.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
  return String(Math.round(value * 10) / 10);
}

function trimZero(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** 百分比：小於 1% 也至少顯示「<1%」，不要顯示成 0% 而讓人以為沒用到。 */
export function formatPercent(percent: number | null | undefined): string {
  if (percent === null || percent === undefined || !Number.isFinite(percent)) return "—";
  if (percent <= 0) return "0%";
  if (percent < 1) return "<1%";
  if (percent < 10) return `${Math.round(percent * 10) / 10}%`;
  return `${Math.round(percent)}%`;
}

/** 存活時長（面板要標明統計期間是「本次實例啟動以來」）。 */
export function formatUptime(uptimeMs: number): string {
  if (!Number.isFinite(uptimeMs) || uptimeMs <= 0) return "剛啟動";
  const minutes = Math.floor(uptimeMs / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)} 分鐘`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時 ${minutes % 60} 分`;
  return `${Math.floor(hours / 24)} 天 ${hours % 24} 小時`;
}

export type WarningPresentation = {
  /** 供 CSS 使用的語意色調。 */
  tone: "neutral" | "ok" | "watch" | "high";
  /** 卡片上的短標籤。 */
  badge: string;
  /** 一句話結論。 */
  headline: string;
  /** 具體建議（只有 watch／high 會給）。 */
  advice: string | null;
};

/**
 * 依消耗速度分級給出「明確提示」。
 * 分級本身由伺服器用「目前速度 vs 可持續速度」判定（見 server/dbUsage.ts），
 * 這裡只負責轉成使用者看得懂的文案。
 */
export function warningPresentation(level: DbUsageWarningLevel, sustainableRuPerHour: number): WarningPresentation {
  const budget = formatRu(sustainableRuPerHour);
  switch (level) {
    case "high":
      return {
        tone: "high",
        badge: "消耗偏高",
        headline: "目前的 RU 消耗速度已超過可持續範圍，照這個速度會用完本月額度。",
        advice: `建議檢查是否出現非預期的重複查詢或大量寫入，並暫緩批次性操作；可持續速度約為每小時 ${budget} RU。`,
      };
    case "watch":
      return {
        tone: "watch",
        badge: "留意速度",
        headline: "RU 消耗速度偏高，但目前仍在可持續範圍內。",
        advice: `持續觀察即可；若再上升一倍就會超出可持續速度（約每小時 ${budget} RU）。`,
      };
    case "ok":
      return {
        tone: "ok",
        badge: "正常",
        headline: "RU 消耗速度在可持續範圍內。",
        advice: null,
      };
    default:
      return {
        tone: "neutral",
        badge: "資料累積中",
        headline: "尚未累積足夠資料判斷消耗速度。",
        advice: "站點啟動滿 5 分鐘後即會開始顯示速度與外推用量。",
      };
  }
}

/** 外推月用量佔額度的百分比（用於 meter 的第二條參考線）。 */
export function projectedPercent(projectedMonthlyRu: number | null, quotaPerMonth: number): number | null {
  if (projectedMonthlyRu === null || !Number.isFinite(projectedMonthlyRu) || quotaPerMonth <= 0) return null;
  return (projectedMonthlyRu / quotaPerMonth) * 100;
}
