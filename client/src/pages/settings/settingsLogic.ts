// 設定頁純邏輯：診斷分類、報告/摘要產生、格式化與快照（無 React、無 DOM 寫入）。
// 從 pages/Settings.tsx 抽出，便於單測與複用；所有遮蔽規則須與隱私設計一致。
import {
  getStorageUsageSummary,
  getPlayerData,
  getLearningRecord,
  type StorageErrorLog,
} from "@/utils/storage";
import { getCloudMode, getLastSyncAt } from "@/game/cloudSync";
import { bxStore } from "@/game/bxStore";

/* ───────────────────────── 通用格式化 ───────────────────────── */

export function titleLabel(title: string) {
  return title.replace(/^擊敗後獲得限定稱號：/, "");
}

export function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number | null) {
  if (bytes === null) return "無法估算";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
}

export function getBrowserLabel() {
  if (typeof navigator === "undefined") return "無法偵測";
  const userAgent = navigator.userAgent;
  if (/Edg\//.test(userAgent)) return "Microsoft Edge";
  if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) return "Google Chrome";
  if (/Firefox\//.test(userAgent)) return "Mozilla Firefox";
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari";
  return "其他瀏覽器";
}

/** 複製文字：優先 Clipboard API，否則退回隱藏 textarea（HTTP 或舊瀏覽器）。 */
export async function copyText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") throw new Error("Clipboard unavailable");
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard copy failed");
}

/* ───────────────────────── 診斷分類 ───────────────────────── */

export const MAX_VISIBLE_DIAGNOSTIC_LOGS = 10;
export const STORAGE_ESTIMATE_BYTES = 5 * 1024 * 1024;

export type DiagnosticSeverity = "critical" | "warning" | "info";
export type DiagnosticCategory = "storage" | "network" | "render" | "other";

export type ClassifiedDiagnosticLog = StorageErrorLog & {
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  count: number;
  maskedMessage: string;
};

// 保留 emoji 於文字內（既有口語識別，亦為測試鎖定文案）；顏色另由語意 class 補充，不作為唯一訊號。
export const SEVERITY_LABELS: Record<DiagnosticSeverity, string> = {
  critical: "🔴 嚴重",
  warning: "🟡 警告",
  info: "🔵 資訊",
};

export const CATEGORY_LABELS: Record<DiagnosticCategory, string> = {
  storage: "儲存",
  network: "網路",
  render: "渲染",
  other: "其他",
};

export function maskMessage(message: string) {
  const masked = message
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [已遮蔽]")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[電子郵件已遮蔽]")
    .replace(/https?:\/\/[^\s]+/gi, "[網址已遮蔽]")
    .replace(/\b[A-Fa-f0-9]{24,}\b/g, "[識別碼已遮蔽]")
    .replace(/\b(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{32,}\b/g, "[長令牌已遮蔽]");
  return masked.length > 180 ? `${masked.slice(0, 180)}…` : masked;
}

const STORAGE_RE = /storage|儲存|保存|讀取|清除|quota|localstorage|配額/i;
const NETWORK_RE = /network|網路|連線|離線|offline|fetch|timeout|timed?\s?out|同步|sync|雲端|云端|api|http|bearer/i;
const RENDER_RE = /render|渲染|react|component|畫面|vite/i;
const CRITICAL_RE = /quota|崩潰|fatal|exception|失敗|無法|不可用|不足|逾時|timeout/i;
const WARNING_RE = /warning|warn|提醒|格式|損壞|重試/i;

function classifyOne(normalized: string): { severity: DiagnosticSeverity; category: DiagnosticCategory } {
  const category: DiagnosticCategory = STORAGE_RE.test(normalized)
    ? "storage"
    : NETWORK_RE.test(normalized)
      ? "network"
      : RENDER_RE.test(normalized)
        ? "render"
        : "other";
  const severity: DiagnosticSeverity = CRITICAL_RE.test(normalized)
    ? "critical"
    : WARNING_RE.test(normalized)
      ? "warning"
      : "info";
  return { severity, category };
}

/**
 * 分類並標注重複次數。先以單趟建立 signature→count 對照（O(n)），
 * 避免在每筆記錄內對全部記錄 filter（原 O(n²)）。
 */
export function classifyDiagnosticLogs(logs: StorageErrorLog[]): ClassifiedDiagnosticLog[] {
  const signatureOf = (log: StorageErrorLog) => `${log.context}|${maskMessage(log.message)}`;
  const counts = new Map<string, number>();
  for (const log of logs) {
    const signature = signatureOf(log);
    counts.set(signature, (counts.get(signature) ?? 0) + 1);
  }
  return logs.map((log) => {
    const maskedMessage = maskMessage(log.message);
    const { severity, category } = classifyOne(`${log.context} ${log.message}`.toLowerCase());
    return { ...log, severity, category, count: counts.get(signatureOf(log)) ?? 1, maskedMessage };
  });
}

/* ───────────────────────── 系統快照 ───────────────────────── */

export function getDiagnosticSnapshot() {
  const player = getPlayerData();
  const cloud = getCloudMode();
  const bxStats = bxStore.get<{ total_answers?: unknown; streak_current?: unknown }>("stats", {}) ?? {};
  const bxCheckin = bxStore.get<{ dates?: unknown }>("checkin", { dates: [] }) ?? { dates: [] };
  return {
    browser: getBrowserLabel(),
    network: typeof navigator !== "undefined" && navigator.onLine === false ? "離線" : "連線中",
    screenWidth: typeof window !== "undefined" ? window.innerWidth : null,
    storage: getStorageUsageSummary(),
    learningRecordCount: getLearningRecord().length,
    player: { level: player.level, gold: player.gold, exp: player.exp },
    cloud: {
      mode: cloud.mode,
      name: cloud.mode === "cloud" ? cloud.name ?? null : null,
      lastSyncAt: getLastSyncAt(),
    },
    bx: {
      totalAnswers: typeof bxStats.total_answers === "number" ? bxStats.total_answers : 0,
      streakCurrent: typeof bxStats.streak_current === "number" ? bxStats.streak_current : 0,
      checkinDays: Array.isArray(bxCheckin.dates) ? bxCheckin.dates.length : 0,
    },
  };
}

export type DiagnosticSnapshot = ReturnType<typeof getDiagnosticSnapshot>;

export function diagnosticReport(snapshot: DiagnosticSnapshot, logs: StorageErrorLog[]) {
  const generatedAt = new Date().toISOString();
  return {
    report: "Academy Expedition diagnostic report",
    generatedAt,
    systemStatus: {
      browser: snapshot.browser,
      localStorage: snapshot.storage,
    },
    learningData: {
      learningRecordCount: snapshot.learningRecordCount,
      gold: snapshot.player.gold,
      experience: snapshot.player.exp,
      level: snapshot.player.level,
    },
    errorLogs: classifyDiagnosticLogs(logs).map(({ context, timestamp, severity, category, count, maskedMessage }) => ({
      context,
      timestamp: new Date(timestamp).toISOString(),
      severity,
      category,
      count,
      message: maskedMessage,
    })),
  };
}

export function buildDiagnosticSummary(logs: StorageErrorLog[], snapshot: DiagnosticSnapshot = getDiagnosticSnapshot()) {
  const generatedAt = new Date().toISOString();
  const visibleLogs = classifyDiagnosticLogs(logs).slice(0, MAX_VISIBLE_DIAGNOSTIC_LOGS);
  const entries = visibleLogs.length === 0
    ? "（目前沒有儲存錯誤日誌）"
    : visibleLogs.map((log, index) => [
        `[${index + 1}] ${SEVERITY_LABELS[log.severity]}｜${CATEGORY_LABELS[log.category]}｜${log.context}`,
        `時間：${new Date(log.timestamp).toISOString()}`,
        `發生次數：${log.count}`,
        `訊息：${log.maskedMessage}`,
      ].join("\n")).join("\n\n");

  return [
    "Academy Expedition 儲存診斷摘要",
    `生成時間戳：${generatedAt}`,
    "",
    "=== 系統狀態 ===",
    `瀏覽器：${snapshot.browser}`,
    `localStorage：${snapshot.storage.available ? `${formatBytes(snapshot.storage.usedBytes)}${snapshot.storage.keyCount === null ? "" : `／${snapshot.storage.keyCount} 個資料項目`}` : "目前無法使用"}`,
    "",
    "=== 學習數據（僅數值） ===",
    `學習紀錄筆數：${snapshot.learningRecordCount}`,
    `金幣：${snapshot.player.gold}`,
    `經驗值：${snapshot.player.exp}`,
    `等級：${snapshot.player.level}`,
    "",
    "=== 雲端船籍 ===",
    `模式：${snapshot.cloud.mode === "cloud" ? `雲端（船籍 ${snapshot.cloud.name ?? "未知"}）` : "本機"}`,
    `本次工作階段上次同步：${snapshot.cloud.lastSyncAt ? new Date(snapshot.cloud.lastSyncAt).toISOString() : "尚未同步"}`,
    `網路：${snapshot.network}`,
    "",
    "=== 錯誤日誌（已遮蔽） ===",
    `錯誤筆數：${logs.length}（摘要含最近 ${visibleLogs.length} 筆）`,
    entries,
  ].join("\n");
}
