import React, { useMemo, useState } from "react";
import { BarChart3, Download, Target, TrendingUp } from "lucide-react";
import "@/styles/learningReportInsights.css";
import { useLocation } from "wouter";
import { getAnalytics, getAnalyticsSummary, getLearningRecord, getWeeklyLearningGoal, saveWeeklyLearningGoal, type WeeklyLearningGoal } from "@/utils/storage";
import { ALL_CURRICULUM_QUESTIONS } from "@/game/expeditionContent";

const SUBJECTS = ["國文", "數學", "英文", "自然"];
const ANALYTICS_SUBJECT_LABELS: Record<string, string> = { chinese: "國文", math: "數學", english: "英文", science: "自然" };
const SUBJECT_ANALYTICS_KEYS: Record<string, string> = { 國文: "chinese", 數學: "math", 英文: "english", 自然: "science" };
const WEEK_KEY = `${new Date().getFullYear()}-W${Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) / 7)}`;

export default function LearningReport() {
  const [, setLocation] = useLocation();
  const records = getLearningRecord();
  const [goal, setGoal] = useState<WeeklyLearningGoal>(() => getWeeklyLearningGoal() ?? { subject: "數學", targetAccuracy: 80, weekKey: WEEK_KEY, createdAt: Date.now() });
  const stats = useMemo(() => SUBJECTS.map((subject) => {
    const rows = records.filter((record) => record.subject === subject);
    const correct = rows.filter((record) => record.isCorrect).length;
    return { subject, total: rows.length, correct, accuracy: rows.length ? Math.round(correct / rows.length * 100) : 0 };
  }), [records]);
  const errorStats = useMemo(() => ["觀念", "粗心", "記憶"].map((label) => {
    const labels: Record<string, string> = { concept: "觀念", careless: "粗心", memory: "記憶" };
    return { label, value: records.filter((record) => labels[record.errorType ?? ""] === label).length };
  }), [records]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); const key = date.toLocaleDateString("zh-TW"); return { label: `${date.getMonth() + 1}/${date.getDate()}`, value: records.filter((record) => new Date(record.timestamp).toLocaleDateString("zh-TW") === key).length }; }), [records]);
  const goalStat = stats.find((item) => item.subject === goal.subject) ?? stats[0];
  const goalReached = goalStat.accuracy >= goal.targetAccuracy && goalStat.total > 0;
  const analytics = useMemo(() => getAnalytics(), [records]);
  const analyticsSummary = useMemo(() => getAnalyticsSummary(), [records]);
  const overallAccuracy = records.length ? Math.round((records.filter((record) => record.isCorrect).length / records.length) * 100) : 0;
  const questionLookup = useMemo(() => new Map(ALL_CURRICULUM_QUESTIONS.map((question) => [question.id, question.prompt])), []);
  const stuckRanking = useMemo(() => Object.entries(analytics.subjectStats)
    .flatMap(([subject, stat]) => Object.entries(stat?.questionErrors ?? {}).map(([questionId, wrong]) => ({ subject: ANALYTICS_SUBJECT_LABELS[subject] ?? subject, questionId, wrong: Number(wrong), label: questionLookup.get(questionId) ?? questionId })))
    .sort((left, right) => right.wrong - left.wrong)
    .slice(0, 5), [analytics, questionLookup]);
  const responseTimes = useMemo(() => SUBJECTS.map((subject) => {
    const stat = analyticsSummary.subjectSummary.find((item) => item.subject === SUBJECT_ANALYTICS_KEYS[subject]);
    return { subject, seconds: stat ? Math.round((stat.averageResponseMs / 1000) * 10) / 10 : 0, attempts: stat?.attempts ?? 0 };
  }), [analyticsSummary]);
  const difficultySuggestions = useMemo(() => stats.filter((item) => item.total > 0).map((item) => ({ ...item, suggestion: item.accuracy < 45 ? "偏難：建議降低題目難度係數或補強前置概念。" : item.accuracy > 85 ? "偏易：建議提高題目難度係數或加入延伸挑戰。" : "難度合宜：維持目前題型與難度分布。" })), [stats]);

  function saveGoal(event: React.FormEvent) { event.preventDefault(); setGoal(saveWeeklyLearningGoal({ ...goal, weekKey: WEEK_KEY, createdAt: Date.now() })); }

  return <main className="learning-report-page" aria-labelledby="learning-report-title">
    <div className="learning-report-inner">
      <button type="button" className="settings-back-button" onClick={() => setLocation("/settings")}>← 返回設定</button>
      <header className="learning-report-header"><div><p className="settings-eyebrow">家長與老師視角</p><h1 id="learning-report-title">學習分析儀表板</h1><p>所有統計都來自本機真實答題紀錄，不會以範例資料填充。</p></div><button type="button" className="settings-secondary-button" onClick={() => window.print()}><Download size={16} aria-hidden="true" /> 匯出學習報告 PDF</button></header>
      <section className="learning-report-card" aria-labelledby="accuracy-title"><div className="learning-report-card-title"><TrendingUp size={19} aria-hidden="true" /><h2 id="accuracy-title">各科正確率趨勢</h2></div><div className="learning-report-lines" role="list" aria-label="各科正確率摘要">{stats.map((item) => <div key={item.subject} className="learning-report-line" role="listitem"><span>{item.subject}</span><div className="learning-report-bar"><i style={{ width: `${item.accuracy}%` }} /></div><strong>{item.accuracy}%</strong><small>{item.total} 題</small></div>)}</div></section>
      <section className="learning-report-card" aria-labelledby="calibration-title"><div className="learning-report-card-title"><TrendingUp size={19} aria-hidden="true" /><h2 id="calibration-title">難度校準建議</h2></div><p className="settings-log-description">目前整體正確率：<strong>{overallAccuracy}%</strong>。系統僅依你已同意保存的本機匿名紀錄判讀，不會以預設樣本補值。</p><div className="learning-insight-list" role="list">{difficultySuggestions.length ? difficultySuggestions.map((item) => <div key={item.subject} role="listitem"><strong>{item.subject} {item.accuracy}%</strong><span>{item.suggestion}</span></div>) : <p className="settings-log-description">累積作答後，這裡會提供各科難度建議。</p>}</div></section>
      <div className="learning-report-grid"><section className="learning-report-card" aria-labelledby="errors-title"><div className="learning-report-card-title"><BarChart3 size={19} aria-hidden="true" /><h2 id="errors-title">弱項標籤分布</h2></div><div className="learning-report-donut" role="img" aria-label={errorStats.map((item) => `${item.label} ${item.value} 題`).join("、")}><span>{records.filter((record) => !record.isCorrect).length}<small>錯題</small></span></div><ul className="learning-report-legend">{errorStats.map((item) => <li key={item.label}><span>{item.label}</span><strong>{item.value} 題</strong></li>)}</ul></section><section className="learning-report-card" aria-labelledby="daily-title"><div className="learning-report-card-title"><BarChart3 size={19} aria-hidden="true" /><h2 id="daily-title">每日答題量</h2></div><div className="learning-report-daily" role="img" aria-label={days.map((day) => `${day.label} ${day.value} 題`).join("、")}>{days.map((day) => <div key={day.label}><i style={{ height: `${Math.max(8, day.value * 18)}px` }} title={`${day.label}：${day.value} 題`} /><small>{day.label}</small></div>)}</div></section></div>
      <div className="learning-report-grid"><section className="learning-report-card" aria-labelledby="stuck-title"><div className="learning-report-card-title"><BarChart3 size={19} aria-hidden="true" /><h2 id="stuck-title">卡關題目排行</h2></div><ol className="learning-ranking-list">{stuckRanking.length ? stuckRanking.map((item, index) => <li key={`${item.subject}-${item.questionId}`}><span>{index + 1}. {item.subject}</span><strong>{item.wrong} 次錯誤</strong><small>{item.label}</small></li>) : <li className="settings-log-description">尚無匿名錯題事件；完成答題後會顯示排行。</li>}</ol></section><section className="learning-report-card" aria-labelledby="time-title"><div className="learning-report-card-title"><BarChart3 size={19} aria-hidden="true" /><h2 id="time-title">各科平均答題秒數</h2></div><div className="learning-report-lines" role="list">{responseTimes.map((item) => <div key={item.subject} className="learning-report-line" role="listitem"><span>{item.subject}</span><div className="learning-report-bar"><i style={{ width: `${Math.min(100, item.seconds * 8)}%` }} /></div><strong>{item.attempts ? `${item.seconds} 秒` : "—"}</strong><small>{item.attempts} 題</small></div>)}</div></section></div>
      <section className="learning-report-card learning-goal-card" aria-labelledby="goal-title"><div className="learning-report-card-title"><Target size={19} aria-hidden="true" /><h2 id="goal-title">本週學習目標</h2></div><form onSubmit={saveGoal} className="learning-goal-form"><label>科目<select value={goal.subject} onChange={(event) => setGoal({ ...goal, subject: event.target.value })}>{SUBJECTS.map((subject) => <option key={subject}>{subject}</option>)}</select></label><label>目標正確率<input type="number" min={1} max={100} value={goal.targetAccuracy} onChange={(event) => setGoal({ ...goal, targetAccuracy: Number(event.target.value) })} />%</label><button type="submit" className="settings-primary-button">保存目標</button></form><p className={goalReached ? "learning-goal-success" : "settings-log-description"} role="status" aria-live="polite">{goalReached ? "🎉 目標達成！繼續保持這份探險節奏。" : `目前 ${goal.subject} 正確率 ${goalStat.accuracy}%，目標為 ${goal.targetAccuracy}%。`}</p></section>
    </div>
  </main>;
}
