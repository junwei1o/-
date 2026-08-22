import React, { useMemo, useState } from "react";
import { BarChart3, Download, FileText, LockKeyhole, Sparkles, Timer, TrendingUp } from "lucide-react";
import { getAnalyticsSummary, getLearningRecord, getParentPinHash, saveParentPinHash } from "@/utils/storage";
import { hashParentPin, isValidParentPin } from "@/game/mainlineFeatures";
import { buildPrintableTeacherReportHtml, buildTeacherReportCsv } from "@/utils/learningReportExport";

const SUBJECTS = [
  { key: "chinese", label: "國文", color: "#d9784b" },
  { key: "math", label: "數學", color: "#3b8f82" },
  { key: "english", label: "英文", color: "#6f6ab8" },
  { key: "science", label: "自然", color: "#bf9b3f" },
] as const;

type RecordLike = { subject?: string; isCorrect?: boolean; correct?: boolean; question?: string; errorTag?: string; errorType?: string; questionId?: string; timestamp?: number; flagged?: boolean };

function subjectKey(subject: string | undefined) {
  const value = (subject ?? "").toLowerCase();
  if (value.includes("數") || value.includes("math")) return "math";
  if (value.includes("英") || value.includes("english")) return "english";
  if (value.includes("自") || value.includes("science")) return "science";
  return "chinese";
}

export default function ParentLearningView() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [hasPin, setHasPin] = useState(() => Boolean(getParentPinHash()));
  const summary = getAnalyticsSummary();
  const records = getLearningRecord() as RecordLike[];

  const insights = useMemo(() => {
    return SUBJECTS.map((subject) => {
      const rows = records.filter((record) => subjectKey(record.subject) === subject.key);
      const correct = rows.filter((record) => record.isCorrect === true || record.correct === true).length;
      const accuracy = rows.length ? Math.round((correct / rows.length) * 100) : 0;
      return { ...subject, total: rows.length, accuracy };
    });
  }, [records]);

  const stuckQuestions = useMemo(() => {
    const misses = records.filter((record) => !(record.isCorrect === true || record.correct === true));
    const grouped = new Map<string, { label: string; count: number; subject: string }>();
    misses.forEach((record, index) => {
      const label = record.question?.trim() || `${record.errorTag || "概念"}補強題目 ${index + 1}`;
      const key = `${subjectKey(record.subject)}:${label}`;
      const current = grouped.get(key);
      grouped.set(key, { label, count: (current?.count ?? 0) + 1, subject: SUBJECTS.find((item) => item.key === subjectKey(record.subject))?.label ?? "國文" });
    });
    return Array.from(grouped.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [records]);

  const weeklyTrend = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const dayRecords = records.filter((record) => typeof record.timestamp === "number" && record.timestamp >= date.getTime() && record.timestamp < next.getTime());
    const correct = dayRecords.filter((record) => record.isCorrect === true || record.correct === true).length;
    return { label: `${date.getMonth() + 1}/${date.getDate()}`, attempts: dayRecords.length, accuracy: dayRecords.length ? Math.round((correct / dayRecords.length) * 100) : 0 };
  }), [records]);

  const weakTags = useMemo(() => {
    const labels: Record<string, string> = { concept: "觀念", careless: "粗心", memory: "記憶" };
    const counts = new Map<string, number>();
    records.filter((record) => !(record.isCorrect === true || record.correct === true)).forEach((record) => {
      const label = record.errorTag || labels[record.errorType ?? ""] || "待釐清概念";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([label, count]) => ({ label, count })).sort((left, right) => right.count - left.count).slice(0, 4);
  }, [records]);

  const teacherSummary = useMemo(() => ({
    generatedAt: Date.now(),
    totalAttempts: records.length,
    totalCorrect: records.filter((record) => record.isCorrect === true || record.correct === true).length,
    activeDays: summary.activeDays,
    averagePlayMs: summary.averagePlayMs,
    subjectRows: insights.map((item) => ({ subject: item.label, attempts: item.total, accuracy: item.accuracy, averageResponseMs: summary.subjectSummary.find((entry) => entry.subject === item.key)?.averageResponseMs })),
    weakTags,
    recommendations: insights.filter((item) => item.total && item.accuracy < 70).map((item) => `優先複習${item.label}：目前正確率 ${item.accuracy}%。`).concat(stuckQuestions.slice(0, 3).map((item) => `回顧${item.subject}的「${item.label}」。`)),
  }), [insights, records, stuckQuestions, summary, weakTags]);

  const handleCsvExport = () => {
    try {
      const blob = new Blob([buildTeacherReportCsv(teacherSummary, records.map((record, index) => ({ questionId: record.questionId ?? `local-${index}`, subject: record.subject ?? "未分類", isCorrect: record.isCorrect === true || record.correct === true, errorType: record.errorType as never, timestamp: record.timestamp ?? 0, flagged: record.flagged === true })))], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `寶島探險家-學習報告-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setMessage("CSV 報告已下載。\n");
    } catch (error) {
      console.error("[teacher-view] CSV 匯出失敗", error);
      setMessage("CSV 匯出失敗，請稍後再試。");
    }
  };

  const handlePdfExport = () => {
    try {
      const printWindow = window.open("", "_blank", "noopener,noreferrer");
      if (!printWindow) throw new Error("popup blocked");
      printWindow.document.open();
      printWindow.document.write(buildPrintableTeacherReportHtml(teacherSummary));
      printWindow.document.close();
      printWindow.focus();
      window.setTimeout(() => printWindow.print(), 160);
      setMessage("已開啟列印視窗，可選擇「另存為 PDF」。");
    } catch (error) {
      console.error("[teacher-view] PDF 匯出失敗", error);
      setMessage("無法開啟列印視窗，請確認瀏覽器允許彈出視窗後再試。");
    }
  };

  const handleUnlock = () => {
    if (!isValidParentPin(pin)) {
      setMessage("請輸入 4 位數字 PIN 碼。");
      return;
    }
    const hash = hashParentPin(pin);
    const stored = getParentPinHash();
    if (!stored) {
      if (!saveParentPinHash(hash)) {
        setMessage("PIN 無法保存，請稍後再試。");
        return;
      }
      setHasPin(true);
      setUnlocked(true);
      setMessage("已建立家長／教師視角 PIN。");
      return;
    }
    if (stored !== hash) {
      setMessage("PIN 不正確，請重新輸入。");
      return;
    }
    setUnlocked(true);
    setMessage("已解鎖學習成效摘要。");
  };

  return (
    <section className="settings-audio-card parent-learning-card" aria-labelledby="parent-learning-title">
      <div className="settings-audio-heading">
        <span className="settings-page-icon" aria-hidden="true"><BarChart3 size={20} /></span>
        <div><p className="settings-eyebrow">家庭陪讀</p><h2 id="parent-learning-title">家長／教師視角</h2></div>
      </div>
      <p className="settings-log-description">資料只在目前裝置處理。首次設定會建立 4 位數 PIN，之後才能查看學習摘要。</p>
      {!unlocked ? (
        <div className="parent-pin-form">
          <label htmlFor="parent-pin"><LockKeyhole size={16} aria-hidden="true" />{hasPin ? "輸入家長／教師 PIN" : "建立家長／教師 PIN"}</label>
          <div className="parent-pin-row">
            <input id="parent-pin" inputMode="numeric" autoComplete="off" maxLength={4} pattern="[0-9]{4}" value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, "").slice(0, 4)); setMessage(""); }} placeholder="4 位數字" />
            <button type="button" className="settings-primary-button" onClick={handleUnlock}>解鎖摘要</button>
          </div>
          <p className="parent-pin-message" role="status" aria-live="polite">{message}</p>
        </div>
      ) : (
        <div className="parent-learning-dashboard" aria-label="家長教師學習成效摘要">
          <div className="parent-insight-grid">
            {insights.map((item) => <div className="parent-insight-item" key={item.key}><span>{item.label}</span><strong>{item.total ? `${item.accuracy}%` : "待累積"}</strong><div className="parent-meter"><i style={{ width: `${item.accuracy}%`, background: item.color }} /></div><small>{item.total ? `${item.total} 題紀錄` : "尚無題目紀錄"}</small></div>)}
          </div>
          <div className="parent-teacher-metrics" aria-label="教師摘要統計">
            <span><Timer size={15} aria-hidden="true" /> 累積學習 <strong>{Math.round(summary.averagePlayMs / 60_000)} 分鐘</strong></span>
            <span><TrendingUp size={15} aria-hidden="true" /> 活躍 <strong>{summary.activeDays} 天</strong></span>
            <span>總作答 <strong>{records.length} 題</strong></span>
          </div>
          <div className="parent-teacher-visuals">
            <div className="parent-trend-card"><h3><TrendingUp size={16} aria-hidden="true" /> 近七日作答趨勢</h3><div className="parent-trend-bars" role="img" aria-label={weeklyTrend.map((item) => `${item.label} ${item.attempts} 題、正確率 ${item.accuracy}%`).join("；")}>
              {weeklyTrend.map((item) => <div key={item.label}><i style={{ height: `${Math.max(8, item.attempts * 18)}px` }} /><small>{item.label}</small><b>{item.attempts || "—"}</b></div>)}
            </div></div>
            <div className="parent-tag-card"><h3>弱項標籤分布</h3>{weakTags.length ? <ul>{weakTags.map((item) => <li key={item.label}><span>{item.label}</span><i style={{ width: `${Math.min(100, item.count * 24)}%` }} /><b>{item.count}</b></li>)}</ul> : <p>尚無錯題標籤；持續練習後會自動整理。</p>}</div>
          </div>
          <div className="parent-learning-columns">
            <div><h3><Sparkles size={16} aria-hidden="true" /> 個人化建議</h3><p>{summary.activeDays ? `目前累積 ${summary.activeDays} 個活躍日，建議優先複習正確率低於 70% 的科目。` : "完成幾題後，這裡會生成個人化補強建議。"}</p><ul>{insights.filter((item) => item.total && item.accuracy < 70).map((item) => <li key={item.key}>加強{item.label}的概念辨識與錯題回顧</li>)}</ul></div>
            <div><h3>卡關題補強練習包</h3>{stuckQuestions.length ? <ol>{stuckQuestions.map((item) => <li key={`${item.subject}-${item.label}`}><span>{item.subject}</span>{item.label}<b>錯 {item.count} 次</b></li>)}</ol> : <p>目前沒有足夠錯題資料，持續答題後會自動整理相似概念。</p>}</div>
          </div>
          <div className="parent-report-actions" aria-label="匯出教師報告">
            <button type="button" className="settings-secondary-button" onClick={handleCsvExport}><Download size={16} aria-hidden="true" /> 匯出 CSV</button>
            <button type="button" className="settings-primary-button" onClick={handlePdfExport}><FileText size={16} aria-hidden="true" /> 匯出 PDF</button>
          </div>
          <p className="parent-pin-message" role="status" aria-live="polite">{message}</p>
          <button type="button" className="settings-secondary-button" onClick={() => { setUnlocked(false); setPin(""); setMessage("已鎖定家長／教師視角。"); }}>鎖定摘要</button>
        </div>
      )}
    </section>
  );
}
