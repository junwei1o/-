import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, BrainCircuit, ChevronLeft, Compass, Headphones, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { calculateAdaptiveReport, calculateKnowledgeHeatmap, calculateLearningTrendReport, loadAdaptiveProfile } from "@/game/adaptiveLearning";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
type QuestionIdentity = { id: string };
type ProgressSummary = { help: string; mastery: string; nextStep: string };
type SummaryTrendPayload = {
  helpTrend: { label: string; hintRate: number; attempts: number }[];
  masteryTrend: { label: string; topics: { tag: string; mastery: number; attempts: number }[] }[];
};

type SummaryTopic = { tag: string; attempts: number };

function reviewTopicHref(topic: string) {
  return `/practice?reviewTopic=${encodeURIComponent(topic)}`;
}

function renderLinkedSummary(text: string, topics: readonly SummaryTopic[]) {
  const orderedTopics = [...topics].sort((left, right) => right.tag.length - left.tag.length);
  if (!orderedTopics.length) return text;
  const pattern = new RegExp(`(${orderedTopics.map(({ tag }) => tag.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")).join("|")})`, "g");
  return text.split(pattern).map((part, index) => {
    const topic = orderedTopics.find(({ tag }) => tag === part);
    return topic ? <a key={`${topic.tag}-${index}`} className="progress-summary-topic-link" href={reviewTopicHref(topic.tag)} aria-label={`前往複習：${topic.tag}`}>{part}</a> : part;
  });
}

const FALLBACK_SUMMARY: ProgressSummary = {
  help: "提示使用紀錄會獨立呈現；目前仍在累積足夠的觀測點，請把求助當成整理思路的工具。",
  mastery: "知識掌握度會依實際答題逐步更新；再完成幾次練習，就能看見更清楚的長期變化。",
  nextStep: "一步一步練習，讓下一個觀測點說話。",
};

function createDeterministicSummary(payload: SummaryTrendPayload): ProgressSummary {
  if (payload.helpTrend.length < 2 || payload.masteryTrend.length < 2) return FALLBACK_SUMMARY;
  const firstHelp = payload.helpTrend[0];
  const lastHelp = payload.helpTrend[payload.helpTrend.length - 1];
  const helpDelta = lastHelp.hintRate - firstHelp.hintRate;
  const help = helpDelta < 0
    ? `最近的提示使用率由 ${firstHelp.hintRate}% 變為 ${lastHelp.hintRate}%；你正在逐步找到自己的解題節奏。提示不是扣分，而是能主動使用的學習工具。`
    : helpDelta > 0
      ? `最近的提示使用率由 ${firstHelp.hintRate}% 變為 ${lastHelp.hintRate}%；你願意在需要時尋求引導，這是照顧學習節奏的好選擇。提示不是扣分。`
      : `最近的提示使用率維持在 ${lastHelp.hintRate}% 左右；你正穩定觀察什麼時候需要引導，提示不是扣分。`;
  const topicPoints = payload.masteryTrend.flatMap((period) => period.topics);
  const firstMastery = topicPoints[0]?.mastery ?? 0;
  const lastMastery = topicPoints[topicPoints.length - 1]?.mastery ?? firstMastery;
  const masteryDelta = lastMastery - firstMastery;
  const mastery = masteryDelta > 0
    ? `知識點掌握度從 ${firstMastery}% 走到 ${lastMastery}%，最近的練習留下了可觀察的累積。`
    : masteryDelta < 0
      ? `知識點掌握度目前在 ${lastMastery}% 附近波動；這是重新練習與整理概念的自然階段，不代表能力被定型。`
      : `知識點掌握度目前約為 ${lastMastery}%；持續累積觀測，就能更準確看見自己的變化。`;
  return { help, mastery, nextStep: "選一個熟悉的重點，再完成一小題。" };
}

function buildSummaryPayload(trends: ReturnType<typeof calculateLearningTrendReport>): SummaryTrendPayload {
  const periods = new Map<number, { label: string; topics: { tag: string; mastery: number; attempts: number }[] }>();
  trends.knowledgeMastery.forEach((series) => series.points.forEach((point) => {
    const period = periods.get(point.timestamp) ?? { label: point.label, topics: [] };
    period.topics.push({ tag: series.tag, mastery: point.mastery, attempts: point.attempts });
    periods.set(point.timestamp, period);
  }));
  return {
    helpTrend: trends.helpHabit.map(({ label, hintRate, attempts }) => ({ label, hintRate, attempts })),
    masteryTrend: Array.from(periods.entries()).sort(([a], [b]) => a - b).map(([, period]) => period),
  };
}

const STATUS_LABEL = {
  review: "需要複習",
  developing: "練習中",
  mastered: "已精通",
} as const;

export default function LearningInsights() {
  const [, setLocation] = useLocation();
  const { data, isLoading, error } = trpc.questionBank.list.useQuery({ limit: 500 });
  const progressSummaryMutation = trpc.aiTutor.progressSummary.useMutation();
  const [profile] = useState(() => loadAdaptiveProfile());
  const questionIds = useMemo(() => new Set(((data?.questions ?? []) as QuestionIdentity[]).map((question) => question.id)), [data]);
  const report = useMemo(() => calculateAdaptiveReport(profile, questionIds), [profile, questionIds]);
  const heatmap = useMemo(() => calculateKnowledgeHeatmap(profile, questionIds), [profile, questionIds]);
  const trends = useMemo(() => calculateLearningTrendReport(profile, questionIds), [profile, questionIds]);
  const summaryPayload = useMemo(() => buildSummaryPayload(trends), [trends]);
  const fallbackSummary = useMemo(() => createDeterministicSummary(summaryPayload), [summaryPayload]);
  const summaryTopics = useMemo(() => {
    const topics = new Map<string, SummaryTopic>();
    summaryPayload.masteryTrend.forEach((period) => period.topics.forEach((topic) => {
      const current = topics.get(topic.tag);
      topics.set(topic.tag, { tag: topic.tag, attempts: (current?.attempts ?? 0) + topic.attempts });
    }));
    return Array.from(topics.values()).sort((left, right) => right.attempts - left.attempts).slice(0, 5);
  }, [summaryPayload]);

  useEffect(() => {
    if (report.attempts === 0 || summaryPayload.helpTrend.length < 2 || summaryPayload.masteryTrend.length < 2) return;
    progressSummaryMutation.mutate(summaryPayload);
  }, [report.attempts, summaryPayload]);

  const summary = progressSummaryMutation.data ?? fallbackSummary;
  const isSummaryFallback = !progressSummaryMutation.data;

  return (
    <main className="learning-insights-page">
      <header className="learning-insights-hero">
        <div>
          <p className="eyebrow">LEARNING INSIGHTS / LOCAL-FIRST</p>
          <h1>知識掌握熱力圖</h1>
          <p>以最近 100 次真實作答整理知識點趨勢；沒有作答紀錄的章節不會被判定為弱項。</p>
        </div>
        <div className="learning-insights-privacy"><ShieldCheck size={18} /><span>資料只留在此裝置</span></div>
      </header>

      {isLoading ? (
        <section className="learning-insights-empty"><Compass size={26} aria-hidden="true" /><p>正在整理你的學習航線……</p></section>
      ) : error ? (
        <section className="learning-insights-empty"><p>題庫暫時無法載入；本機紀錄仍會保留。請稍後重新開啟此頁。</p></section>
      ) : report.attempts === 0 ? (
        <section className="learning-insights-empty"><BookOpen size={26} aria-hidden="true" /><h2>先完成幾個觀測點</h2><p>完成題目後，這裡會依實際答題顯示知識熱點與複習方向。</p><button className="learning-insights-action" onClick={() => setLocation("/practice")}>前往今日挑戰</button></section>
      ) : (
        <>
          <section className="learning-insights-kpis" aria-label="近期學習摘要">
            <article><small>近期答題</small><strong>{report.attempts}</strong><span>最近 100 次內</span></article>
            <article><small>近期正確率</small><strong>{report.accuracy}%</strong><span>只計實際作答</span></article>
            <article><small>提示使用率</small><strong>{report.hintRate}%</strong><span>含既有學習提示</span></article>
            <article><small>優先複習節點</small><strong>{heatmap.filter((item) => item.status === "review").length}</strong><span>以作答結果推導</span></article>
          </section>

          <section className="learning-insights-trends" aria-label="長期學習趨勢">
            <article className="learning-insights-card trend-chart-card">
              <div className="learning-insights-card-head"><div><p className="eyebrow">HELP-SEEKING HABITS</p><h2>求助習慣趨勢</h2></div><Headphones size={20} aria-hidden="true" /></div>
              <p className="trend-description">提示使用率只描述你何時選擇支援，不代表扣分或能力高低。</p>
              {trends.helpHabit.length > 0 ? <div className="trend-chart" role="img" aria-label={`求助習慣趨勢：${trends.helpHabit.map((point) => `${point.label} ${point.hintRate}%`).join("、")}`}><ResponsiveContainer width="100%" height={220}><LineChart data={trends.helpHabit}><CartesianGrid strokeDasharray="3 3" stroke="#D9E5DD" /><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" /><Tooltip formatter={(value) => [`${value}%`, "提示使用率"]} /><Line type="monotone" dataKey="hintRate" stroke="#D88462" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div> : <p className="trend-empty">目前仍在累積求助觀測。</p>}
            </article>
            <article className="learning-insights-card trend-chart-card">
              <div className="learning-insights-card-head"><div><p className="eyebrow">KNOWLEDGE MASTERY</p><h2>知識掌握變化</h2></div><Target size={20} aria-hidden="true" /></div>
              <p className="trend-description">掌握度只依實際答題計算；不同知識點不互相比較成績。</p>
              {trends.knowledgeMastery.length > 0 ? <div className="trend-chart" role="img" aria-label={`知識掌握變化：${trends.knowledgeMastery.map((series) => series.tag).join("、")}`}><ResponsiveContainer width="100%" height={220}><LineChart data={summaryPayload.masteryTrend}><CartesianGrid strokeDasharray="3 3" stroke="#D9E5DD" /><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" /><Tooltip formatter={(value) => [`${value}%`, "掌握度"]} />{trends.knowledgeMastery.slice(0, 5).map((series, index) => <Line key={series.tag} type="monotone" dataKey={`topics[${index}].mastery`} name={series.tag} stroke={["#0B6E8E", "#6A9B72", "#C29A4A", "#8D6B9E", "#B96862"][index]} strokeWidth={2.5} dot={{ r: 2 }} connectNulls />)}</LineChart></ResponsiveContainer></div> : <p className="trend-empty">目前仍在累積知識掌握觀測。</p>}
            </article>
          </section>

          <section className="learning-insights-card progress-summary-card" aria-labelledby="progress-summary-title">
            <div className="learning-insights-card-head"><div><p className="eyebrow">AI PROGRESS SUMMARY</p><h2 id="progress-summary-title">本期進步摘要</h2></div><Sparkles size={20} aria-hidden="true" /></div>
            {progressSummaryMutation.isPending ? <p className="progress-summary-loading" role="status">正在把你的趨勢整理成一段溫柔的回饋……</p> : <div className="progress-summary-copy"><p><strong>求助習慣</strong>{summary.help}</p><p><strong>知識掌握</strong>{renderLinkedSummary(summary.mastery, summaryTopics)}</p><p className="progress-summary-next"><Sparkles size={15} aria-hidden="true" /><strong>下一步</strong>{summary.nextStep}</p></div>}
            {summaryTopics.length > 0 && <div className="progress-summary-topics" aria-label="摘要中的知識點複習連結"><span>直接複習知識點</span><div>{summaryTopics.map((topic) => <a key={topic.tag} className="progress-summary-topic-chip" href={reviewTopicHref(topic.tag)}>{topic.tag}<small>{topic.attempts} 次觀測</small></a>)}</div></div>}
            {isSummaryFallback && <p className="learning-insights-caption"><ShieldCheck size={14} /> {progressSummaryMutation.isError ? "AI 摘要暫時無法取得，先使用本機計算的正向摘要。" : "資料仍在累積，先使用本機計算的正向摘要。"}</p>}
            <button className="learning-insights-speak" type="button" onClick={() => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(`${summary.help} ${summary.mastery} 下一步：${summary.nextStep}`)); }}><Headphones size={15} /> 朗讀摘要</button>
          </section>

          <section className="learning-insights-grid">
            <article className="learning-insights-card heatmap-card">
              <div className="learning-insights-card-head"><div><p className="eyebrow">KNOWLEDGE HEATMAP</p><h2>知識熱力圖</h2></div><span>綠：已精通　黃：練習中　紅：需複習</span></div>
              <div className="knowledge-heatmap" role="list" aria-label="依實際作答計算的知識掌握熱力圖">
                {heatmap.map((item) => <div className="knowledge-heatmap-cell" data-status={item.status} key={item.tag} role="listitem"><span className="knowledge-heatmap-dot" aria-hidden="true" /><div><strong># {item.tag}</strong><small>{item.correct} / {item.attempts} 次答對</small></div><b>{item.mastery}%</b><em>{STATUS_LABEL[item.status]}</em></div>)}
              </div>
              <p className="learning-insights-caption"><ShieldCheck size={14} /> 未觀測的知識點不會出現在熱力圖中，避免把尚未練習誤讀為能力不足。</p>
            </article>

            <article className="learning-insights-card review-card">
              <div className="learning-insights-card-head"><div><p className="eyebrow">NEXT BEST ROUTE</p><h2>下一步複習</h2></div><Target size={20} aria-hidden="true" /></div>
              {report.weakKnowledge.length ? <><p>建議先從這些已重複出現、但尚未穩定的知識點開始：</p><ul>{report.weakKnowledge.map((item) => <li key={item.tag}><span># {item.tag}</span><b>{item.accuracy}%</b><small>{item.attempts} 次作答</small></li>)}</ul><button className="learning-insights-action" onClick={() => setLocation("/practice")}>開始重點挑戰</button></> : <p className="review-card-good"><Sparkles size={18} /> 目前沒有符合「至少兩次作答且正確率偏低」的知識點；可以保持節奏，挑戰新的航線。</p>}
            </article>
          </section>

          <section className="learning-insights-boundary" aria-label="學習支援功能狀態">
            <article><BrainCircuit size={20} aria-hidden="true" /><div><strong>AI 錯題導師</strong><p>已支援錯題後的初步提示、進階提示與完整解析；內容只在你主動要求時產生。</p></div></article>
            <article><Compass size={20} aria-hidden="true" /><div><strong>間隔複習</strong><p>目前自適應選題會優先帶回弱知識點；依日期排程的重現提醒仍列為後續功能，尚未啟用。</p></div></article>
          </section>
        </>
      )}
      <button className="learning-insights-back" onClick={() => setLocation("/")}><ChevronLeft size={16} /> 回到航海儀表板</button>
    </main>
  );
}
