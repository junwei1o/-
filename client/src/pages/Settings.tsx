import React, { useCallback, useEffect, useRef, useState } from "react";
import { Accessibility, AlertTriangle, BarChart3, BookMarked, Clipboard, Crown, Download, Palette, RefreshCw, Settings as SettingsIcon, Sparkles, Trash2, UserRound, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  clearStorageErrorLogs,
  getAccessibilityPrefs,
  getAnalyticsConsent,
  getAnalyticsSummary,
  saveAnalyticsConsent,
  getBattleVolume,
  getLimitedTitles,
  getRareMonsterDefeats,
  getSelectedTitle,
  getPlayerProfile,
  getPlayerData,
  getLearningRecord,
  getStorageUsageSummary,
  PLAYER_AVATARS,
  PLAYER_THEME_COLORS,
  getStorageErrorLogs,
  saveAccessibilityPrefs,
  savePlayerProfile,
  saveSelectedTitle,
  saveBattleVolume,
  type AccessibilityPrefs,
  type StorageErrorLog,
} from "@/utils/storage";
import { getRareMonsters } from "@/game/expeditionContent";
import { getJournalEntries } from "@/game/adventureJournal";
import ParentLearningView from "@/components/ParentLearningView";
import "./SettingsDiagnostics.css";

const RARE_CODEX = (["chinese", "math", "english", "science"] as const).flatMap((subject) => getRareMonsters(subject));

function titleLabel(title: string) {
  return title.replace(/^擊敗後獲得限定稱號：/, "");
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskMessage(message: string) {
  const masked = message
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [已遮蔽]")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[電子郵件已遮蔽]")
    .replace(/https?:\/\/[^\s]+/gi, "[網址已遮蔽]")
    .replace(/\b[A-Fa-f0-9]{24,}\b/g, "[識別碼已遮蔽]")
    .replace(/\b(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{32,}\b/g, "[長令牌已遮蔽]");
  return masked.length > 180 ? `${masked.slice(0, 180)}…` : masked;
}

const MAX_VISIBLE_DIAGNOSTIC_LOGS = 10;
const STORAGE_ESTIMATE_BYTES = 5 * 1024 * 1024;

type DiagnosticSeverity = "critical" | "warning" | "info";
type DiagnosticCategory = "storage" | "network" | "render" | "other";
type ClassifiedDiagnosticLog = StorageErrorLog & {
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  count: number;
  maskedMessage: string;
};

const SEVERITY_LABELS: Record<DiagnosticSeverity, string> = {
  critical: "🔴 嚴重",
  warning: "🟡 警告",
  info: "🔵 資訊",
};

const CATEGORY_LABELS: Record<DiagnosticCategory, string> = {
  storage: "儲存",
  network: "網路",
  render: "渲染",
  other: "其他",
};

function classifyDiagnosticLog(log: StorageErrorLog, allLogs: StorageErrorLog[]): ClassifiedDiagnosticLog {
  const maskedMessage = maskMessage(log.message);
  const normalized = `${log.context} ${log.message}`.toLowerCase();
  const category: DiagnosticCategory = /storage|儲存|quota|localstorage|讀取|保存|清除/.test(normalized)
    ? "storage"
    : /network|網路|offline|fetch|連線|timeout|timeout/.test(normalized)
      ? "network"
      : /render|渲染|react|component|畫面|vite/.test(normalized)
        ? "render"
        : "other";
  const severity: DiagnosticSeverity = /quota|崩潰|fatal|exception|失敗|無法|不可用|不足/.test(normalized)
    ? "critical"
    : /warning|warn|提醒|格式|損壞|重試/.test(normalized)
      ? "warning"
      : "info";
  const signature = `${log.context}|${maskedMessage}`;
  const count = allLogs.filter((candidate) => `${candidate.context}|${maskMessage(candidate.message)}` === signature).length;
  return { ...log, severity, category, count, maskedMessage };
}

function classifyDiagnosticLogs(logs: StorageErrorLog[]) {
  return logs.map((log) => classifyDiagnosticLog(log, logs));
}

function diagnosticReport(snapshot: DiagnosticSnapshot, logs: StorageErrorLog[]) {
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

function formatBytes(bytes: number | null) {
  if (bytes === null) return "無法估算";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
}

function getBrowserLabel() {
  if (typeof navigator === "undefined") return "無法偵測";
  const userAgent = navigator.userAgent;
  if (/Edg\//.test(userAgent)) return "Microsoft Edge";
  if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) return "Google Chrome";
  if (/Firefox\//.test(userAgent)) return "Mozilla Firefox";
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari";
  return "其他瀏覽器";
}

function getDiagnosticSnapshot() {
  const player = getPlayerData();
  return {
    browser: getBrowserLabel(),
    storage: getStorageUsageSummary(),
    learningRecordCount: getLearningRecord().length,
    player: { level: player.level, gold: player.gold, exp: player.exp },
  };
}

type DiagnosticSnapshot = ReturnType<typeof getDiagnosticSnapshot>;

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
    "=== 錯誤日誌（已遮蔽） ===",
    `錯誤筆數：${logs.length}（摘要含最近 ${visibleLogs.length} 筆）`,
    entries,
  ].join("\n");
}

async function copyText(text: string) {
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

export default function Settings() {
  const [, setLocation] = useLocation();
  const [logs, setLogs] = useState<StorageErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const [battleVolume, setBattleVolume] = useState(() => getBattleVolume());
  const [accessibilityPrefs, setAccessibilityPrefs] = useState(() => getAccessibilityPrefs());
  const [analyticsConsent, setAnalyticsConsent] = useState(() => getAnalyticsConsent());
  const [analyticsSummary, setAnalyticsSummary] = useState(() => getAnalyticsSummary());
  const [rareDefeats, setRareDefeats] = useState(() => getRareMonsterDefeats());
  const [limitedTitles, setLimitedTitles] = useState(() => getLimitedTitles());
  const [selectedTitle, setSelectedTitle] = useState(() => getSelectedTitle());
  const [playerProfile, setPlayerProfile] = useState(() => getPlayerProfile());
  const [journalEntries] = useState(() => getJournalEntries().filter((entry) => entry.date >= Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [diagnosticSnapshot, setDiagnosticSnapshot] = useState(() => getDiagnosticSnapshot());
  const [lastRefreshAt, setLastRefreshAt] = useState(() => Date.now());
  const clearTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmClearRef = useRef<HTMLButtonElement>(null);

  const refreshAnalytics = useCallback(() => {
    setAnalyticsConsent(getAnalyticsConsent());
    setAnalyticsSummary(getAnalyticsSummary());
  }, []);

  const refreshLogs = useCallback(() => {
    setIsLoading(true);
    setLogs(getStorageErrorLogs());
    setDiagnosticSnapshot(getDiagnosticSnapshot());
    setLastRefreshAt(Date.now());
    setIsLoading(false);
    setCopyStatus("idle");
  }, []);

  const refreshShowcase = useCallback(() => {
    setRareDefeats(getRareMonsterDefeats());
    setLimitedTitles(getLimitedTitles());
    setSelectedTitle(getSelectedTitle());
  }, []);

  useEffect(() => {
    refreshLogs();
    refreshAnalytics();
    refreshShowcase();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "errorLogs" || event.key === "xueAdventurerData" || event.key === "xueLearningRecord" || event.key === null) refreshLogs();
      if (event.key === "xue-adventure-analytics-v1" || event.key === "xue-adventure-analytics-consent-v1" || event.key === null) refreshAnalytics();
      if (event.key === "xue-adventure-rare-monster-defeats-v1" || event.key === "xue-adventure-limited-titles-v1" || event.key === "xue-adventure-selected-title-v1" || event.key === null) refreshShowcase();
      if (event.key === "xue-adventure-accessibility-prefs-v1" || event.key === null) setAccessibilityPrefs(getAccessibilityPrefs());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshLogs, refreshAnalytics, refreshShowcase]);

  const handleTitleSelection = (title: string | null) => {
    const saved = saveSelectedTitle(title);
    setSelectedTitle(saved);
    toast.success(saved ? `已展示「${titleLabel(saved)}」稱號` : "已改回預設航海階級");
  };

  const handleProfileUpdate = (update: Partial<typeof playerProfile>) => {
    const saved = savePlayerProfile(update);
    setPlayerProfile(saved);
    document.documentElement.dataset.playerTheme = saved.themeColor;
    toast.success("個人化外觀已更新");
  };

  const handleAccessibilityUpdate = (update: Partial<AccessibilityPrefs>) => {
    setAccessibilityPrefs(saveAccessibilityPrefs(update));
  };

  const handleExportDiagnosticReport = (format: "json" | "txt" = "json") => {
    try {
      const report = diagnosticReport(diagnosticSnapshot, logs);
      const isJson = format === "json";
      const content = isJson ? JSON.stringify(report, null, 2) : buildDiagnosticSummary(logs, diagnosticSnapshot);
      const blob = new Blob([content], { type: isJson ? "application/json;charset=utf-8" : "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `academy-expedition-diagnostic-${new Date().toISOString().replace(/[:.]/g, "-")}.${isJson ? "json" : "txt"}`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`診斷報告已匯出為 ${isJson ? "JSON" : "純文字"}`);
    } catch (error) {
      console.error("[settings] 無法匯出診斷報告", error);
      toast.error("無法匯出診斷報告，請稍後再試");
    }
  };

  const handleCopyDiagnosticSummary = async () => {
    try {
      await copyText(buildDiagnosticSummary(logs, diagnosticSnapshot));
      setCopyStatus("success");
      toast.success("診斷摘要已複製，可提供給開發者");
    } catch (error) {
      console.error("[settings] 無法複製診斷摘要", error);
      setCopyStatus("error");
      toast.error("無法自動複製，請改用手動選取錯誤資訊");
    }
  };

  const closeClearConfirmation = () => {
    setIsConfirmingClear(false);
    window.setTimeout(() => clearTriggerRef.current?.focus(), 0);
  };

  const openClearConfirmation = () => {
    setIsConfirmingClear(true);
    window.setTimeout(() => confirmClearRef.current?.focus(), 0);
  };

  const handleClear = () => {
    const cleared = clearStorageErrorLogs();
    if (cleared) {
      setLogs([]);
      setIsConfirmingClear(false);
      setCopyStatus("idle");
      setDiagnosticSnapshot(getDiagnosticSnapshot());
      toast.success("錯誤日誌已清除");
    } else {
      toast.error("目前無法清除錯誤日誌，請稍後再試");
    }
  };

  return (
    <main className="settings-page" aria-labelledby="settings-title">
      <div className="settings-page-inner">
        <button type="button" className="settings-back-button" onClick={() => setLocation("/")}>
          ← 返回航海儀表板
        </button>

        <header className="settings-page-header">
          <div className="settings-page-heading">
            <span className="settings-page-icon" aria-hidden="true"><SettingsIcon size={22} /></span>
            <div>
              <p className="settings-eyebrow">資料與安全</p>
              <h1 id="settings-title">設定</h1>
            </div>
          </div>
          <p>查看本機儲存遇到的問題。這些紀錄只保存在目前裝置，不會上傳到伺服器。</p>
        </header>

        <section className="settings-audio-card" aria-labelledby="battle-audio-title">
          <div className="settings-audio-heading">
            <span className="settings-page-icon" aria-hidden="true"><Volume2 size={20} /></span>
            <div>
              <p className="settings-eyebrow">戰鬥回饋</p>
              <h2 id="battle-audio-title">戰鬥音量</h2>
            </div>
          </div>
          <p className="settings-log-description">調整攻擊命中、連擊暴擊與勝利歡呼的音量。瀏覽器若暫時阻擋音效，畫面動畫仍會正常播放。</p>
          <label className="settings-volume-control" htmlFor="battle-volume">
            <span>音量</span>
            <output htmlFor="battle-volume" aria-live="polite">{Math.round(battleVolume * 100)}%</output>
          </label>
          <input id="battle-volume" aria-label="音量" className="settings-volume-slider" type="range" min="0" max="1" step="0.05" value={battleVolume} onChange={(event) => setBattleVolume(saveBattleVolume(Number(event.target.value)))} aria-describedby="battle-volume-help" />
          <p id="battle-volume-help" className="settings-log-description">設為 0% 可靜音；可使用鍵盤方向鍵微調音量。</p>
        </section>

        <section className="settings-audio-card settings-accessibility-card" aria-labelledby="accessibility-settings-title">
          <div className="settings-audio-heading"><span className="settings-page-icon" aria-hidden="true"><Accessibility size={20} /></span><div><p className="settings-eyebrow">舒適遊玩</p><h2 id="accessibility-settings-title">無障礙設定</h2></div></div>
          <p className="settings-log-description">設定會立即套用並保存在這台裝置。若畫面效果讓你感到不適，可降低特效或開啟動畫簡化。</p>
          <label className="settings-volume-control" htmlFor="effect-intensity"><span>特效強度</span><output htmlFor="effect-intensity" aria-live="polite">{{ low: "低", medium: "中", high: "高" }[accessibilityPrefs.effectIntensity]}</output></label>
          <input id="effect-intensity" aria-label="特效強度" className="settings-volume-slider" type="range" min="1" max="3" step="1" value={{ low: 1, medium: 2, high: 3 }[accessibilityPrefs.effectIntensity]} onChange={(event) => handleAccessibilityUpdate({ effectIntensity: (["low", "medium", "high"] as const)[Number(event.target.value) - 1] })} aria-valuetext={{ low: "低", medium: "中", high: "高" }[accessibilityPrefs.effectIntensity]} />
          <label className="settings-analytics-toggle"><span><strong>震動回饋</strong><small>{accessibilityPrefs.vibrationEnabled ? "已啟用操作與戰鬥觸感回饋" : "已關閉所有觸感回饋"}</small></span><input type="checkbox" role="switch" checked={accessibilityPrefs.vibrationEnabled} onChange={(event) => handleAccessibilityUpdate({ vibrationEnabled: event.target.checked })} /></label>
          <label className="settings-analytics-toggle"><span><strong>動畫簡化</strong><small>{accessibilityPrefs.reducedAnimation ? "特效將以短暫淡入淡出呈現" : "保留一般移動、旋轉與粒子效果"}</small></span><input type="checkbox" role="switch" checked={accessibilityPrefs.reducedAnimation} onChange={(event) => handleAccessibilityUpdate({ reducedAnimation: event.target.checked })} /></label>
          <p className="settings-log-description" role="status">目前採用{{ low: "低", medium: "中", high: "高" }[accessibilityPrefs.effectIntensity]}強度特效；{accessibilityPrefs.reducedAnimation ? "動畫已簡化。" : "一般動畫已啟用。"}</p>
        </section>

        <section className="settings-audio-card settings-analytics-card" aria-labelledby="analytics-sharing-title">
          <div className="settings-audio-heading"><span className="settings-page-icon" aria-hidden="true"><BarChart3 size={20} /></span><div><p className="settings-eyebrow">隱私選擇</p><h2 id="analytics-sharing-title">匿名數據分享</h2></div></div>
          <p className="settings-log-description">資料只保存在目前裝置，用於顯示每日活躍天數、平均遊玩時長、各科卡關題目與補血藥水使用時機；不會記錄姓名、答案內容，也不會上傳至伺服器。</p>
          <label className="settings-analytics-toggle"><span><strong>允許匿名記錄</strong><small>{analyticsConsent === "accepted" ? "目前已開啟本機記錄" : analyticsConsent === "declined" ? "目前已關閉本機記錄" : "尚未選擇"}</small></span><input type="checkbox" role="switch" checked={analyticsConsent === "accepted"} onChange={(event) => { const next = event.target.checked ? "accepted" : "declined"; saveAnalyticsConsent(next); setAnalyticsConsent(next); setAnalyticsSummary(getAnalyticsSummary()); }} /></label>
          <div className="settings-analytics-summary" aria-label="匿名學習數據摘要"><span>活躍天數 <strong>{analyticsSummary.activeDays}</strong></span><span>平均遊玩 <strong>{Math.round(analyticsSummary.averagePlayMs / 60000)} 分鐘</strong></span><span>低血量用藥 <strong>{analyticsSummary.lowHpPotionUseRate}%</strong></span></div>
        </section>

        <section className="settings-audio-card settings-report-link-card" aria-labelledby="learning-report-link-title">
          <div className="settings-audio-heading"><span className="settings-page-icon" aria-hidden="true"><BarChart3 size={20} /></span><div><p className="settings-eyebrow">學習成效</p><h2 id="learning-report-link-title">學習分析報告</h2></div></div>
          <p className="settings-log-description">查看各科正確率、弱項標籤、每日答題量，設定本週目標並列印學習報告。</p>
          <button type="button" className="settings-primary-button" onClick={() => setLocation("/learning-report")}>開啟學習報告</button>
        </section>

        <ParentLearningView />

        <section className="settings-audio-card settings-showcase-card" aria-labelledby="profile-customization-title">
          <div className="settings-audio-heading"><span className="settings-page-icon" aria-hidden="true"><UserRound size={20} /></span><div><p className="settings-eyebrow">我的探險檔案</p><h2 id="profile-customization-title">頭像與主題色</h2></div></div>
          <p className="settings-log-description">外觀只儲存在這台裝置，可隨時調整成最符合自己的探險風格。</p>
          <div className="settings-title-choices" role="radiogroup" aria-label="選擇學生頭像">
            {PLAYER_AVATARS.map((avatar) => <button type="button" key={avatar.id} role="radio" aria-checked={playerProfile.avatar === avatar.id} className={`settings-title-choice${playerProfile.avatar === avatar.id ? " is-selected" : ""}`} onClick={() => handleProfileUpdate({ avatar: avatar.id })}>{avatar.emoji} {avatar.label}</button>)}
          </div>
          <div className="settings-title-choices" role="radiogroup" aria-label="選擇主題色">
            {PLAYER_THEME_COLORS.map((theme) => <button type="button" key={theme} role="radio" aria-checked={playerProfile.themeColor === theme} className={`settings-title-choice theme-choice-${theme}${playerProfile.themeColor === theme ? " is-selected" : ""}`} onClick={() => handleProfileUpdate({ themeColor: theme })}><Palette size={14} aria-hidden="true" />{{ ocean: "海洋藍", sunset: "夕陽橘", forest: "森林綠" }[theme]}</button>)}
          </div>
        </section>

        <section className="settings-audio-card settings-showcase-card" aria-labelledby="growth-journal-title">
          <div className="settings-audio-heading"><span className="settings-page-icon" aria-hidden="true"><BookMarked size={20} /></span><div><p className="settings-eyebrow">我的成長</p><h2 id="growth-journal-title">三十天探險日誌牆</h2></div></div>
          {journalEntries.length ? <ol className="settings-log-list" aria-label="最近三十天的探險日誌">{journalEntries.slice(0, 30).map((entry) => <li className="settings-log-item" key={entry.id}><span className="settings-log-item-icon" aria-hidden="true">📜</span><div className="settings-log-item-content"><strong>{entry.subject}・{entry.sessionType === "battle" ? "對戰航線" : "練習航線"}</strong><time>{formatTimestamp(entry.date)}</time><p>{entry.summary}</p></div></li>)}</ol> : <p className="settings-showcase-empty" role="status">最近三十天尚無探險日誌；完成答題後，這裡會記錄你的真實成長足跡。</p>}
        </section>

        <section className="settings-audio-card settings-showcase-card" aria-labelledby="codex-title">
          <div className="settings-audio-heading"><span className="settings-page-icon" aria-hidden="true"><BookMarked size={20} /></span><div><p className="settings-eyebrow">稀有遭遇</p><h2 id="codex-title">探險家圖鑑</h2></div></div>
          <p className="settings-log-description">稀有守門者會在連續答對至少 10 題後才有機會出現。擊敗後可收藏限定稱號；圖鑑僅顯示本機戰鬥紀錄。</p>
          <ul className="settings-codex-grid" aria-label="十二種稀有怪物圖鑑">
            {RARE_CODEX.map((monster) => {
              const defeats = rareDefeats[monster.id] ?? 0;
              const unlocked = defeats > 0;
              return <li key={monster.id} className={`settings-codex-entry${unlocked ? " is-unlocked" : ""}`}>
                <span className="settings-codex-emoji" aria-hidden="true">{monster.emoji}</span>
                <div><strong>{monster.name}</strong><p>{monster.description}</p><small>限定稱號：{titleLabel(monster.title ?? monster.name)}</small></div>
                <b aria-label={`${monster.name} 擊敗 ${defeats} 次`}>{unlocked ? `擊敗 ${defeats}` : "尚未發現"}</b>
              </li>;
            })}
          </ul>
        </section>

        <section className="settings-audio-card settings-showcase-card" aria-labelledby="title-showcase-title">
          <div className="settings-audio-heading"><span className="settings-page-icon" aria-hidden="true"><Crown size={20} /></span><div><p className="settings-eyebrow">個人展示</p><h2 id="title-showcase-title">稱號展示櫃</h2></div></div>
          <p className="settings-log-description">選擇已解鎖的限定稱號，它會顯示在首頁的探險狀態列。</p>
          <div className="settings-title-choices" role="radiogroup" aria-label="選擇首頁展示稱號">
            <button type="button" role="radio" aria-checked={selectedTitle === null} className={`settings-title-choice${selectedTitle === null ? " is-selected" : ""}`} onClick={() => handleTitleSelection(null)}>預設航海階級</button>
            {limitedTitles.map((title) => <button type="button" key={title} role="radio" aria-checked={selectedTitle === title} className={`settings-title-choice${selectedTitle === title ? " is-selected" : ""}`} onClick={() => handleTitleSelection(title)}>{titleLabel(title)}</button>)}
          </div>
          {limitedTitles.length === 0 ? <p className="settings-showcase-empty" role="status">尚未解鎖限定稱號。保持連續答對，尋找稀有守門者吧。</p> : null}
        </section>

        <section id="diagnostics" className="settings-log-card" aria-labelledby="storage-log-title">
          <div className="settings-log-card-header">
            <div>
              <p className="settings-eyebrow">除錯工具</p>
              <h2 id="storage-log-title">儲存錯誤日誌</h2>
            </div>
            <span className="settings-log-count" aria-label={`目前有 ${logs.length} 筆錯誤日誌`}>{logs.length} 筆</span>
          </div>
          <p className="settings-log-description">日誌只會記錄儲存讀寫、資料格式或配額問題的摘要，不會顯示題目答案、個人資料或帳號密碼。</p>

          <section className="settings-diagnostic-status" aria-labelledby="diagnostic-summary-title">
            <div className="settings-diagnostic-status-heading">
              <div>
                <p className="settings-eyebrow">僅顯示聚合資訊</p>
                <h3 id="diagnostic-summary-title">系統與學習摘要</h3>
              </div>
            </div>
            <dl className="diag-status-grid">
              <div className="diag-stat-card"><dt>瀏覽器</dt><dd>{diagnosticSnapshot.browser}</dd><small>僅辨識產品名稱，不收集完整裝置資訊。</small></div>
              <div className="diag-stat-card"><dt>localStorage</dt><dd>{diagnosticSnapshot.storage.available ? formatBytes(diagnosticSnapshot.storage.usedBytes) : "目前無法使用"}</dd><small>{diagnosticSnapshot.storage.keyCount === null ? "無法估算資料項目數" : `${diagnosticSnapshot.storage.keyCount} 個資料項目；容量以 5 MB 估算。`}</small>{diagnosticSnapshot.storage.available && diagnosticSnapshot.storage.usedBytes !== null ? <meter className="diag-storage-meter" min="0" max={STORAGE_ESTIMATE_BYTES} value={Math.min(diagnosticSnapshot.storage.usedBytes, STORAGE_ESTIMATE_BYTES)} aria-label={`localStorage 使用量 ${formatBytes(diagnosticSnapshot.storage.usedBytes)}`} /> : null}</div>
              <div className="diag-stat-card"><dt>學習紀錄</dt><dd>{diagnosticSnapshot.learningRecordCount}</dd><small>只顯示筆數，不顯示題目或作答內容。</small></div>
              <div className="diag-stat-card"><dt>金幣</dt><dd>{diagnosticSnapshot.player.gold}</dd><small>本機遊戲成長數值。</small></div>
              <div className="diag-stat-card"><dt>經驗值</dt><dd>{diagnosticSnapshot.player.exp}</dd><small>目前等級中的經驗值。</small></div>
              <div className="diag-stat-card"><dt>等級</dt><dd>Lv. {diagnosticSnapshot.player.level}</dd><small>依已答對題數計算。</small></div>
            </dl>
          </section>

          {isLoading ? (
            <p className="settings-log-empty" role="status">正在讀取本機日誌…</p>
          ) : logs.length === 0 ? (
            <div className="settings-log-empty" role="status">
              <Sparkles size={22} aria-hidden="true" />
              <strong>目前沒有儲存錯誤</strong>
              <span>資料保存狀態正常，之後若發生問題會顯示在這裡。</span>
            </div>
          ) : (
            <>
              <p className="settings-log-description">顯示最近 {Math.min(logs.length, MAX_VISIBLE_DIAGNOSTIC_LOGS)} 筆（共 {logs.length} 筆）遮蔽錯誤日誌。</p>
              <ol className="settings-log-list diag-log-list" aria-label="最近十筆分類並遮蔽的錯誤日誌">
              {classifyDiagnosticLogs(logs).slice(0, MAX_VISIBLE_DIAGNOSTIC_LOGS).map((log, index) => (
                <li className={`settings-log-item diag-log-item diag-severity-${log.severity}`} key={`${log.timestamp}-${log.context}-${index}`} aria-label={`錯誤日誌 ${index + 1}：${SEVERITY_LABELS[log.severity]}、${CATEGORY_LABELS[log.category]}、${log.context}`}>
                  <span className="settings-log-item-icon" aria-hidden="true"><AlertTriangle size={17} /></span>
                  <div className="settings-log-item-content">
                    <div className="diag-log-meta"><strong>{log.context}</strong><span className={`diag-severity-badge diag-severity-badge-${log.severity}`}>{SEVERITY_LABELS[log.severity]}</span><span className="diag-category-badge">類型：{CATEGORY_LABELS[log.category]}</span></div>
                    <time dateTime={new Date(log.timestamp).toISOString()}>{formatTimestamp(log.timestamp)}</time>
                    <p>{log.maskedMessage}</p>
                    <small>發生次數：{log.count}</small>
                  </div>
                </li>
              ))}
              </ol>
            </>
          )}

          <div className="settings-log-actions">
            <button type="button" className="settings-secondary-button" onClick={refreshLogs} disabled={isLoading} aria-label="重新整理調試資料">
              <RefreshCw size={16} aria-hidden="true" className={isLoading ? "diag-refresh-spinning" : undefined} /> 重新整理
            </button>
            <button type="button" className="settings-secondary-button" onClick={() => handleExportDiagnosticReport("json")} aria-label="匯出 JSON 診斷報告">
              <Download size={16} aria-hidden="true" /> 匯出報告
            </button>
            <button
              type="button"
              className="settings-secondary-button"
              onClick={handleCopyDiagnosticSummary}
              aria-describedby="diagnostic-copy-help"
            >
              <Clipboard size={16} aria-hidden="true" /> 複製診斷摘要
            </button>
            {logs.length > 0 && !isConfirmingClear && (
              <button ref={clearTriggerRef} type="button" className="settings-danger-button" onClick={openClearConfirmation}>
                <Trash2 size={16} aria-hidden="true" /> 清除日誌
              </button>
            )}
          </div>
          <p id="diagnostic-copy-help" className="settings-log-description">摘要會遮蔽網址、電子郵件、令牌與識別碼，只複製必要的除錯資訊。上次更新：{formatTimestamp(lastRefreshAt)}</p>
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {copyStatus === "success" ? "診斷摘要已複製" : copyStatus === "error" ? "診斷摘要複製失敗" : ""}
          </p>

          {isConfirmingClear && (
            <div className="settings-clear-confirm" role="alertdialog" aria-modal="true" aria-labelledby="clear-log-title" aria-describedby="clear-log-description" onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); closeClearConfirmation(); } }}>
              <strong id="clear-log-title">確定清除所有錯誤日誌？</strong>
              <p id="clear-log-description">清除後無法在本機復原，但不會影響玩家進度、題目紀錄或獎勵。</p>
              <div className="settings-confirm-actions">
                <button type="button" className="settings-secondary-button" onClick={closeClearConfirmation}>取消</button>
                <button ref={confirmClearRef} type="button" className="settings-danger-button" onClick={handleClear} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleClear(); } }}>確認清除</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
