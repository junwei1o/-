import React, { useMemo, useState } from "react";
import { BarChart3, BookOpen, ChevronLeft, Headphones, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { calculateErrorTypeAnalytics, ERROR_TYPE_COLORS, ERROR_TYPE_LABELS, getErrorTypeLearningMessage } from "@/game/errorAnalytics";
import { loadAdaptiveProfile } from "@/game/adaptiveLearning";

type QuestionIdentity = { id: string };

export default function ErrorTypeStatistics() {
  const [, setLocation] = useLocation();
  const { data, isLoading, error } = trpc.questionBank.list.useQuery({ limit: 500 });
  const [profile] = useState(() => loadAdaptiveProfile());
  const questionIds = useMemo(() => new Set(((data?.questions ?? []) as QuestionIdentity[]).map((question) => question.id)), [data]);
  const analytics = useMemo(() => calculateErrorTypeAnalytics(profile, questionIds.size ? questionIds : undefined), [profile, questionIds]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${getErrorTypeLearningMessage(analytics)} ${analytics.distributions.map((item) => `${item.label} ${item.count} 次，占 ${item.percentage}%`).join("；")}`);
    utterance.lang = "zh-TW";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <main className="error-statistics-page">
      <header className="error-statistics-hero">
        <div>
          <p className="eyebrow">LEARNING SIGNALS / LOCAL-FIRST</p>
          <h1>錯誤線索圖譜</h1>
          <p>把錯誤看成下一個學習入口：觀念整理、細節檢查與記憶提取，全部只依你實際完成的題目整理。</p>
        </div>
        <div className="learning-insights-privacy"><ShieldCheck size={18} aria-hidden="true" /><span>資料只留在此裝置</span></div>
      </header>

      {isLoading ? (
        <section className="learning-insights-empty"><BarChart3 size={26} aria-hidden="true" /><p>正在整理你的錯誤線索……</p></section>
      ) : error ? (
        <section className="learning-insights-empty"><p>題庫暫時無法載入；本機紀錄仍保留。請稍後重新開啟此頁。</p></section>
      ) : analytics.attempts === 0 ? (
        <section className="learning-insights-empty"><BookOpen size={26} aria-hidden="true" /><h2>先完成幾個觀測點</h2><p>完成題目並在需要時分類錯誤後，這裡會顯示你的弱點分佈與變化。</p><button className="learning-insights-action" onClick={() => setLocation("/practice")}>前往今日挑戰</button></section>
      ) : (
        <>
          <section className="learning-insights-kpis" aria-label="錯誤類型統計摘要">
            <article><small>分析作答</small><strong>{analytics.attempts}</strong><span>符合題庫範圍的真實紀錄</span></article>
            <article><small>已分類錯答</small><strong>{analytics.classifiedErrors}</strong><span>未分類舊紀錄不會被猜測</span></article>
            <article><small>主要線索</small><strong>{analytics.strongestType ? ERROR_TYPE_LABELS[analytics.strongestType] : "累積中"}</strong><span>依目前分類數量推導</span></article>
            <article><small>觀察週期</small><strong>{analytics.trend.length}</strong><span>有作答的七日區間</span></article>
          </section>

          <section className="error-statistics-grid" aria-label="錯誤類型圖表">
            <article className="learning-insights-card error-distribution-card">
              <div className="learning-insights-card-head"><div><p className="eyebrow">ERROR DISTRIBUTION</p><h2>弱點分佈</h2></div><BarChart3 size={20} aria-hidden="true" /></div>
              <p className="trend-description">比例只描述目前已分類的錯答線索，不是能力評分。</p>
              {analytics.classifiedErrors > 0 ? <div className="error-distribution-list" role="img" aria-label={`錯誤類型分佈：${analytics.distributions.map((item) => `${item.label}${item.count}次，占${item.percentage}%`).join("、")}`}>
                {analytics.distributions.map((item) => <div className="error-distribution-row" key={item.type}><div className="error-distribution-label"><span className="error-type-dot" style={{ backgroundColor: ERROR_TYPE_COLORS[item.type] }} aria-hidden="true" /><strong>{item.label}</strong><small>{item.count} 次</small></div><div className="error-bar-track" aria-hidden="true"><span style={{ width: `${item.percentage}%`, backgroundColor: ERROR_TYPE_COLORS[item.type] }} /></div><b>{item.percentage}%</b></div>)}
              </div> : <p className="trend-empty">目前還沒有可分類的錯答線索。</p>}
              <p className="learning-insights-caption"><ShieldCheck size={14} /> 未分類紀錄會保留，但不會被系統猜測成任何錯誤類型。</p>
            </article>

            <article className="learning-insights-card error-guide-card">
              <div className="learning-insights-card-head"><div><p className="eyebrow">NEXT LEARNING MOVE</p><h2>下一個小步驟</h2></div><Target size={20} aria-hidden="true" /></div>
              <p className="error-guide-message"><Sparkles size={18} aria-hidden="true" />{getErrorTypeLearningMessage(analytics)}</p>
              <div className="error-guide-list"><div><strong>觀念整理</strong><span>把題目拆成已知、關係與要找的線索。</span></div><div><strong>細節檢查</strong><span>送出前重新看單位、符號與題目關鍵字。</span></div><div><strong>記憶提取</strong><span>先用自己的話回想，再查看提示或解析。</span></div></div>
              <button className="learning-insights-action" onClick={() => setLocation("/practice")}>回到一題練習</button>
            </article>
          </section>

          <section className="learning-insights-card error-trend-card" aria-labelledby="error-trend-title">
            <div className="learning-insights-card-head"><div><p className="eyebrow">SEVEN-DAY WINDOWS</p><h2 id="error-trend-title">進步趨勢</h2></div><BarChart3 size={20} aria-hidden="true" /></div>
            <p className="trend-description">每一列代表有實際作答的七日區間；錯答數下降或正確率上升，都可以作為下一步觀察線索。</p>
            {analytics.trend.length ? <div className="error-trend-table-wrap"><table className="error-trend-table"><caption className="sr-only">每七日錯誤類型與正確率趨勢</caption><thead><tr><th scope="col">區間</th><th scope="col">觀念</th><th scope="col">粗心</th><th scope="col">記憶</th><th scope="col">正確率</th></tr></thead><tbody>{analytics.trend.map((point) => <tr key={point.timestamp}><th scope="row">{point.label}</th><td>{point.concept}</td><td>{point.careless}</td><td>{point.memory}</td><td><strong>{point.accuracy}%</strong><span className="trend-mini-bar" aria-hidden="true"><i style={{ width: `${point.accuracy}%` }} /></span></td></tr>)}</tbody></table></div> : <p className="trend-empty">持續完成題目後，這裡會出現七日變化。</p>}
          </section>

          <section className="learning-insights-card error-statistics-summary" aria-label="錯誤統計朗讀與資料說明">
            <p><Sparkles size={16} aria-hidden="true" />{getErrorTypeLearningMessage(analytics)}</p>
            <button className="learning-insights-speak" type="button" onClick={speak} disabled={isSpeaking}><Headphones size={15} /> {isSpeaking ? "正在朗讀……" : "朗讀統計摘要"}</button>
          </section>
        </>
      )}
      <button className="learning-insights-back" onClick={() => setLocation("/")}><ChevronLeft size={16} /> 回到航海儀表板</button>
    </main>
  );
}
