// 船長室（調試模式）：家長密語閘門、系統與學習摘要、雲端航行紀錄、
// 遮蔽錯誤日誌、重新整理／匯出（JSON/純文字）／複製／清除。
// 自包含診斷狀態，避免主設定頁承擔除錯邏輯。
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Clipboard,
  Download,
  Lock,
  LockOpen,
  RefreshCw,
  Ship,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { clearStorageErrorLogs, getStorageErrorLogs, type StorageErrorLog } from "@/utils/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { cloudApi, getCloudMode } from "@/game/cloudSync";
import { isDebugUnlocked, lockDebug, tryUnlockDebug } from "@/game/debugGate";
import { bxStore } from "@/game/bxStore";
import {
  CATEGORY_LABELS,
  MAX_VISIBLE_DIAGNOSTIC_LOGS,
  SEVERITY_LABELS,
  STORAGE_ESTIMATE_BYTES,
  buildDiagnosticSummary,
  classifyDiagnosticLogs,
  copyText,
  diagnosticReport,
  formatBytes,
  formatTimestamp,
  getDiagnosticSnapshot,
} from "./settingsLogic";

interface CloudExamRecord {
  id: number;
  subject: string;
  difficulty: string | null;
  totalQuestions: number;
  correctCount: number;
  createdAt: number;
}

export function DiagnosticsSection() {
  // 同步讀取本機資料做 lazy 初始值，首屏即正確、不閃「讀取中」。
  const [logs, setLogs] = useState<StorageErrorLog[]>(() => getStorageErrorLogs());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const [snapshot, setSnapshot] = useState(() => getDiagnosticSnapshot());
  const [lastRefreshAt, setLastRefreshAt] = useState(() => Date.now());
  const [diagUnlocked, setDiagUnlocked] = useState(() => isDebugUnlocked());
  const [gateInput, setGateInput] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [cloudExams, setCloudExams] = useState<CloudExamRecord[]>([]);
  const [cloudExamsLoading, setCloudExamsLoading] = useState(false);
  const clearTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmClearRef = useRef<HTMLButtonElement>(null);

  const cloudMode = getCloudMode();

  const refreshLogs = useCallback(() => {
    setIsRefreshing(true);
    setLogs(getStorageErrorLogs());
    setSnapshot(getDiagnosticSnapshot());
    setLastRefreshAt(Date.now());
    setIsRefreshing(false);
    setCopyStatus("idle");
  }, []);

  // 跨分頁／分頁籤的 storage 變更即時同步。
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "errorLogs" || event.key === "xueAdventurerData" || event.key === "xueLearningRecord" || event.key === null) {
        refreshLogs();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshLogs]);

  // 解鎖且為雲端模式時，拉取最近 5 筆航行紀錄供家長核對。
  useEffect(() => {
    if (!diagUnlocked) return;
    if (cloudMode.mode !== "cloud" || !cloudMode.name) {
      setCloudExams([]);
      return;
    }
    let cancelled = false;
    setCloudExamsLoading(true);
    cloudApi.listExams({ name: cloudMode.name, limit: 5 })
      .then((result) => { if (!cancelled) setCloudExams(result.records as CloudExamRecord[]); })
      .catch(() => { /* 離線時靜默 */ })
      .finally(() => { if (!cancelled) setCloudExamsLoading(false); });
    return () => { cancelled = true; };
  }, [diagUnlocked, cloudMode.mode, cloudMode.name]);

  // 確認清除開啟時鎖定背景捲動。
  useEffect(() => {
    if (!isConfirmingClear) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isConfirmingClear]);

  const classifiedLogs = useMemo(() => classifyDiagnosticLogs(logs), [logs]);
  const visibleLogs = useMemo(
    () => classifiedLogs.slice(0, MAX_VISIBLE_DIAGNOSTIC_LOGS),
    [classifiedLogs],
  );

  const handleGateSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = tryUnlockDebug(gateInput);
    if (result.ok) {
      setDiagUnlocked(true);
      setGateInput("");
      setGateError(null);
      return;
    }
    setGateError(result.reason === "locked"
      ? `嘗試太多次，船長室暫時鎖上了，請約 ${result.retryAfterMin} 分鐘後再試。`
      : `密語不對，再試一次（還有 ${result.remaining} 次機會）。`);
  };

  const handleRelock = () => {
    lockDebug();
    setDiagUnlocked(false);
    setGateInput("");
    setGateError(null);
  };

  const handleExportDiagnosticReport = (format: "json" | "txt" = "json") => {
    try {
      const report = diagnosticReport(snapshot, logs);
      const isJson = format === "json";
      const content = isJson ? JSON.stringify(report, null, 2) : buildDiagnosticSummary(logs, snapshot);
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
      await copyText(buildDiagnosticSummary(logs, snapshot));
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
      setSnapshot(getDiagnosticSnapshot());
      toast.success("錯誤日誌已清除");
    } else {
      toast.error("目前無法清除錯誤日誌，請稍後再試");
    }
  };

  // 在兩顆確認鈕間循環焦點，避免 Tab 離開對話框。
  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
    if (buttons.length === 0) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const lockUntil = bxStore.get<number | null>("guardian.lock_until", null) ?? 0;
  const gateLocked = lockUntil > Date.now();
  const lockedMin = Math.ceil((lockUntil - Date.now()) / 60_000);

  return (
    <section id="diagnostics" className="settings-log-card" aria-labelledby="storage-log-title">
      <div className="settings-log-card-header">
        <div>
          <p className="settings-eyebrow">除錯工具</p>
          <h2 id="storage-log-title">船長室（調試模式）</h2>
        </div>
        {diagUnlocked ? <span className="settings-log-count" aria-label={`目前有 ${logs.length} 筆錯誤日誌`}>{logs.length} 筆</span> : null}
      </div>

      {!diagUnlocked ? (
        <div className="diag-gate">
          <span className="diag-gate-icon" aria-hidden="true"><Lock size={26} /></span>
          <p className="diag-gate-copy"><strong>這裡是給家長／老師使用的船長室。</strong>裡面有系統狀態與航行紀錄等除錯資訊，需要輸入家長密語（驗證碼或指令）才能進入。</p>
          {gateLocked ? (
            <p className="diag-gate-error" role="alert">嘗試太多次，船長室暫時鎖上了，請約 {lockedMin} 分鐘後再試。</p>
          ) : (
            <form className="diag-gate-form" onSubmit={handleGateSubmit}>
              <label className="sr-only" htmlFor="debug-gate-input">家長密語</label>
              <input
                id="debug-gate-input"
                className="diag-gate-input"
                value={gateInput}
                onChange={(event) => { setGateInput(event.target.value); setGateError(null); }}
                placeholder="輸入驗證碼或指令"
                autoComplete="off"
              />
              <button type="submit" className="settings-primary-button diag-gate-submit"><LockOpen size={16} aria-hidden="true" /> 進入船長室</button>
            </form>
          )}
          {gateError && !gateLocked ? <p className="diag-gate-error" role="alert">{gateError}</p> : null}
        </div>
      ) : (
        <>
          <p className="settings-log-description">日誌只會記錄儲存讀寫、資料格式或配額問題的摘要，不會顯示題目答案、個人資料或帳號密碼。</p>

          <section className="settings-diagnostic-status" aria-labelledby="diagnostic-summary-title">
            <div className="settings-diagnostic-status-heading">
              <div>
                <p className="settings-eyebrow">僅顯示聚合資訊</p>
                <h3 id="diagnostic-summary-title">系統與學習摘要</h3>
              </div>
            </div>
            <dl className="diag-status-grid">
              <div className="diag-stat-card"><dt>瀏覽器</dt><dd>{snapshot.browser}</dd><small>僅辨識產品名稱，不收集完整裝置資訊。</small></div>
              <div className="diag-stat-card"><dt>網路狀態</dt><dd>{snapshot.network}</dd><small>{snapshot.screenWidth === null ? "" : `目前視窗寬度 ${snapshot.screenWidth}px。`}</small></div>
              <div className="diag-stat-card"><dt>localStorage</dt><dd>{snapshot.storage.available ? formatBytes(snapshot.storage.usedBytes) : "目前無法使用"}</dd><small>{snapshot.storage.keyCount === null ? "無法估算資料項目數" : `${snapshot.storage.keyCount} 個資料項目；容量以 5 MB 估算。`}</small>{snapshot.storage.available && snapshot.storage.usedBytes !== null ? <meter className="diag-storage-meter" min="0" max={STORAGE_ESTIMATE_BYTES} value={Math.min(snapshot.storage.usedBytes, STORAGE_ESTIMATE_BYTES)} aria-label={`localStorage 使用量 ${formatBytes(snapshot.storage.usedBytes)}`} /> : null}</div>
              <div className="diag-stat-card"><dt>學習紀錄</dt><dd>{snapshot.learningRecordCount}</dd><small>只顯示筆數，不顯示題目或作答內容。</small></div>
              <div className="diag-stat-card"><dt>金幣</dt><dd>{snapshot.player.gold}</dd><small>本機遊戲成長數值。</small></div>
              <div className="diag-stat-card"><dt>經驗值</dt><dd>{snapshot.player.exp}</dd><small>目前等級中的經驗值。</small></div>
              <div className="diag-stat-card"><dt>等級</dt><dd>Lv. {snapshot.player.level}</dd><small>依已答對題數計算。</small></div>
              <div className="diag-stat-card"><dt>累計作答</dt><dd>{snapshot.bx.totalAnswers}</dd><small>全部裝置模式下的作答總數。</small></div>
              <div className="diag-stat-card"><dt>連勝紀錄</dt><dd>{snapshot.bx.streakCurrent}</dd><small>目前連續答對題數。</small></div>
              <div className="diag-stat-card"><dt>簽到天數</dt><dd>{snapshot.bx.checkinDays}</dd><small>累計每日簽到天數。</small></div>
              <div className="diag-stat-card"><dt>雲端船籍</dt><dd>{snapshot.cloud.mode === "cloud" ? snapshot.cloud.name ?? "雲端" : "本機模式"}</dd><small>{snapshot.cloud.mode === "cloud" ? `上次同步：${snapshot.cloud.lastSyncAt ? formatTimestamp(snapshot.cloud.lastSyncAt) : "本次工作階段尚未同步"}` : "未開啟雲端同步。"}</small></div>
            </dl>
          </section>

          {/* 全站資源監控已於 2026-10-01 移至站長後台（/admin）。
              理由：那是「營運」資訊，屬站長職責；且該端點已改為站長專屬，
              放在學生也進得來的設定頁並不合理。這裡保留一個指路提示。 */}
          <section className="settings-diagnostic-status" aria-labelledby="site-resource-moved-title">
            <div className="settings-diagnostic-status-heading">
              <div>
                <p className="settings-eyebrow">已搬遷</p>
                <h3 id="site-resource-moved-title">全站資源監控已移至站長後台</h3>
              </div>
            </div>
            <p className="settings-log-description">
              資源用量、RU 額度與消耗速度屬於站點營運資訊，現在集中在站長後台（<code>/admin</code>），
              需要站長通關語才能檢視。
            </p>
          </section>

          {snapshot.cloud.mode === "cloud" && (
            <section className="settings-diagnostic-status" aria-labelledby="cloud-exam-records-title">
              <div className="settings-diagnostic-status-heading">
                <div>
                  <p className="settings-eyebrow">雲端航行紀錄</p>
                  <h3 id="cloud-exam-records-title">最近試卷紀錄</h3>
                </div>
              </div>
              {cloudExamsLoading ? (
                <ol className="diag-exam-list" aria-label="最近五筆雲端試卷紀錄載入中" aria-busy="true">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="diag-exam-item diag-exam-skel">
                      <Skeleton className="diag-exam-skel-icon" />
                      <Skeleton className="diag-exam-skel-subject" />
                      <Skeleton className="diag-exam-skel-score" />
                      <Skeleton className="diag-exam-skel-time" />
                    </li>
                  ))}
                </ol>
              ) : cloudExams.length === 0 ? (
                <p className="settings-log-description">雲端尚無試卷紀錄（或目前離線）。完成一份試卷後會自動記在這裡。</p>
              ) : (
                <ol className="diag-exam-list" aria-label="最近五筆雲端試卷紀錄">
                  {cloudExams.map((record) => (
                    <li key={record.id} className="diag-exam-item">
                      <Ship size={15} aria-hidden="true" />
                      <span className="diag-exam-subject">{record.subject}</span>
                      <span className="diag-exam-score">{record.correctCount} / {record.totalQuestions} 題</span>
                      {record.difficulty ? <span className="diag-exam-difficulty">{record.difficulty}</span> : null}
                      <time dateTime={new Date(record.createdAt).toISOString()}>{formatTimestamp(record.createdAt)}</time>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}

          {logs.length === 0 ? (
            <div className="settings-log-empty" role="status">
              <Sparkles size={22} aria-hidden="true" />
              <strong>目前沒有儲存錯誤</strong>
              <span>資料保存狀態正常，之後若發生問題會顯示在這裡。</span>
            </div>
          ) : (
            <>
              <p className="settings-log-description">顯示最近 {Math.min(logs.length, MAX_VISIBLE_DIAGNOSTIC_LOGS)} 筆（共 {logs.length} 筆）遮蔽錯誤日誌。</p>
              <ol className="settings-log-list diag-log-list" aria-label="最近十筆分類並遮蔽的錯誤日誌">
                {visibleLogs.map((log, index) => (
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
            <button type="button" className="settings-secondary-button" onClick={refreshLogs} disabled={isRefreshing} aria-label="重新整理調試資料">
              <RefreshCw size={16} aria-hidden="true" className={isRefreshing ? "diag-refresh-spinning" : undefined} /> 重新整理
            </button>
            <button type="button" className="settings-secondary-button" onClick={() => handleExportDiagnosticReport("json")} aria-label="匯出 JSON 診斷報告">
              <Download size={16} aria-hidden="true" /> 匯出報告
            </button>
            <button type="button" className="settings-secondary-button" onClick={() => handleExportDiagnosticReport("txt")} aria-label="匯出純文字診斷報告">
              <Download size={16} aria-hidden="true" /> 純文字
            </button>
            <button
              type="button"
              className="settings-secondary-button"
              onClick={() => void handleCopyDiagnosticSummary()}
              aria-describedby="diagnostic-copy-help"
            >
              <Clipboard size={16} aria-hidden="true" /> 複製診斷摘要
            </button>
            {logs.length > 0 && !isConfirmingClear && (
              <button ref={clearTriggerRef} type="button" className="settings-danger-button" onClick={openClearConfirmation}>
                <Trash2 size={16} aria-hidden="true" /> 清除日誌
              </button>
            )}
            <button type="button" className="settings-secondary-button" onClick={handleRelock} aria-label="離開船長室並重新上鎖">
              <Lock size={16} aria-hidden="true" /> 重新上鎖
            </button>
          </div>
          <p id="diagnostic-copy-help" className="settings-log-description">摘要會遮蔽網址、電子郵件、令牌與識別碼，只複製必要的除錯資訊。上次更新：{formatTimestamp(lastRefreshAt)}</p>
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {copyStatus === "success" ? "診斷摘要已複製" : copyStatus === "error" ? "診斷摘要複製失敗" : ""}
          </p>

          {isConfirmingClear && (
            <>
              <div className="settings-modal-backdrop" onClick={closeClearConfirmation} aria-hidden="true" />
              <div
                className="settings-clear-confirm"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="clear-log-title"
                aria-describedby="clear-log-description"
                onKeyDown={(event) => {
                  if (event.key === "Escape") { event.preventDefault(); closeClearConfirmation(); return; }
                  trapFocus(event);
                }}
              >
                <strong id="clear-log-title">確定清除所有錯誤日誌？</strong>
                <p id="clear-log-description">清除後無法在本機復原，但不會影響玩家進度、題目紀錄或獎勵。</p>
                <div className="settings-confirm-actions">
                  <button type="button" className="settings-secondary-button" onClick={closeClearConfirmation}>取消</button>
                  <button
                    ref={confirmClearRef}
                    type="button"
                    className="settings-danger-button"
                    onClick={handleClear}
                    onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleClear(); } }}
                  >
                    確認清除
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
