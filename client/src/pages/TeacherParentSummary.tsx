import React, { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, BookOpen, CalendarDays, ChevronLeft, Compass, Headphones, MessageCircleHeart, RotateCcw, ShieldCheck, Sparkles, UsersRound, Waypoints } from "lucide-react";
import { useLocation } from "wouter";
import { loadAdaptiveProfile } from "@/game/adaptiveLearning";
import { buildTeacherParentSummary, formatSupporterActivity, type SupporterIslandSummary } from "@/lib/teacherParentSummary";
import { DEFAULT_SUPPORTER_SUMMARY_FILTERS, filterAdaptiveProfile, hasSupporterSummaryFilters, hasValidSupporterDateRange, loadSupporterSummaryFilters, saveSupporterSummaryFilters, type SupporterSummaryFilters } from "@/lib/teacherParentSummaryFilters";
import { buildSupporterLearningTimeline, buildSupporterTimelineReadout, formatSupporterTimelineTimestamp } from "@/lib/teacherParentTimeline";
import { buildTimelineQuestionReview, type TimelineQuestionBankRow, type TimelineQuestionReview } from "@/lib/teacherParentQuestionReview";
import { buildKnowledgePracticeRecommendation } from "@/lib/teacherParentPracticeRecommendation";
import { buildCurrentVsPreviousReinforcementJournalComparison, buildRecentReinforcementJournalTopicDistribution, getRecentReinforcementJournalWeekRange, loadRecentReinforcementJournalWeek, RECENT_REINFORCEMENT_WEEK_COUNT, type MapReinforcementJournalEntry, type ReinforcementJournalTopicDistributionItem } from "@/game/mapReinforcementReward";
import { trpc } from "@/lib/trpc";
import { readStoredValue, writeStoredValue } from "@/utils/storage";
import "./TeacherParentSummary.css";

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const Utterance = (window as Window & { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance }).SpeechSynthesisUtterance;
  if (!Utterance) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new Utterance(text));
}

function IslandCard({ item, onOpenMap }: { item: SupporterIslandSummary; onOpenMap: (subject: string) => void }) {
  const { island } = item;
  return (
    <article className="supporter-island-card" data-status={item.status} aria-labelledby={`supporter-island-${island.id}`}>
      <div className="supporter-island-card-head"><div><span className="supporter-island-subject">{island.subject}島</span><h2 id={`supporter-island-${island.id}`}>{island.title}</h2></div><span className="supporter-island-status">{item.status}</span></div>
      <p className="supporter-island-focus">{island.curriculumFocus}</p>
      <div className="supporter-island-stats" aria-label={`${island.title}學習紀錄`}><span><strong>{island.attemptCount}</strong>次作答足跡</span><span><strong>{item.recentAttemptCount}</strong>最近觀測</span><span><strong>{formatSupporterActivity(item.latestActivityAt)}</strong>最近活動</span></div>
      <div className="supporter-island-directions"><strong>可觀察的學習方向</strong><ul>{island.learningDirections.map((direction) => <li key={direction}>{direction}</li>)}</ul></div>
      {island.observedKnowledge.length > 0 ? <div className="supporter-topic-list" aria-label={`${island.title}已觀察主題`}><strong>最近出現的主題</strong><div>{island.observedKnowledge.map((topic) => <span key={topic}># {topic}</span>)}</div></div> : <p className="supporter-island-empty">完成一題後，這裡會顯示實際出現的學習主題。</p>}
      <div className="supporter-island-actions"><button type="button" className="supporter-secondary-button" onClick={() => onOpenMap(island.subject)}><Compass size={15} /> 查看島嶼</button>{island.resources[0] && <a className="supporter-resource-link" href={island.resources[0].url} target="_blank" rel="noreferrer">延伸資源</a>}</div>
    </article>
  );
}

function formatSupporterReinforcementTime(timestamp: number) {
  return new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
}

const SUPPORTER_REINFORCEMENT_WEEK_STORAGE_KEY = "xue-adventure.supporter-reinforcement-week.v1";

function loadSupporterReinforcementWeekOffset() {
  const value = Number(readStoredValue(SUPPORTER_REINFORCEMENT_WEEK_STORAGE_KEY, null, null));
  return Number.isInteger(value) && value >= 0 && value < RECENT_REINFORCEMENT_WEEK_COUNT ? value : 0;
}

function saveSupporterReinforcementWeekOffset(offset: number) {
  writeStoredValue(SUPPORTER_REINFORCEMENT_WEEK_STORAGE_KEY, String(offset));
}

function getSupporterReinforcementWeekLabel(offset: number) {
  return ["本週", "上週", "前兩週", "前三週"][offset] ?? "本週";
}

function formatSupporterReinforcementWeekRange(offset: number, now: number) {
  const range = getRecentReinforcementJournalWeekRange(offset, now);
  if (!range) return "近期";
  const formatter = new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric", timeZone: "UTC" });
  return `${formatter.format(new Date(range.start))} 至 ${formatter.format(new Date(range.end))}`;
}

function supporterReinforcementReadout(entries: MapReinforcementJournalEntry[], islandTitleBySubject: Map<string, string>, weekLabel: string) {
  if (!entries.length) return `${weekLabel}補強小航誌目前還沒有完成紀錄。孩子完成一題補強後，這裡會留下真實的學習主題。`;
  return `${weekLabel}補強小航誌共有${entries.length}筆真實完成紀錄：${entries.map((entry) => `${islandTitleBySubject.get(entry.subject) ?? `${entry.subject}島`}的${entry.knowledge}`).join("、")}。`;
}

function SupporterReinforcementJournal({ entries, islandTitleBySubject, weekOffset, journalNow, onWeekChange }: { entries: MapReinforcementJournalEntry[]; islandTitleBySubject: Map<string, string>; weekOffset: number; journalNow: number; onWeekChange: (offset: number) => void }) {
  const [spoken, setSpoken] = useState(false);
  const weekLabel = getSupporterReinforcementWeekLabel(weekOffset);
  const readout = supporterReinforcementReadout(entries, islandTitleBySubject, weekLabel);

  return (
    <section className="supporter-reinforcement-journal" aria-labelledby="supporter-reinforcement-journal-title" data-testid="supporter-reinforcement-journal">
      <div className="supporter-reinforcement-journal-heading">
        <div><p className="eyebrow">WEEKLY REINFORCEMENT LOG</p><h2 id="supporter-reinforcement-journal-title">本週補強小航誌｜最近四週</h2><p>可查看本週與前三週實際完成的一題補強；不以篩選或推測資料補足內容。</p></div>
        <button type="button" className="supporter-speak-button" onClick={() => { speak(readout); setSpoken(true); }} aria-label={`朗讀${weekLabel}補強小航誌`}><Headphones size={16} aria-hidden="true" /> {spoken ? "已朗讀航誌" : "朗讀航誌"}</button>
      </div>
      <div className="supporter-reinforcement-week-picker" role="group" aria-label="選擇補強小航誌週次">{Array.from({ length: RECENT_REINFORCEMENT_WEEK_COUNT }, (_, offset) => <button key={offset} type="button" className="supporter-reinforcement-week-button" data-active={offset === weekOffset} aria-pressed={offset === weekOffset} onClick={() => { onWeekChange(offset); setSpoken(false); }}>{getSupporterReinforcementWeekLabel(offset)}</button>)}</div>
      <p className="supporter-reinforcement-week-range" aria-live="polite">目前查看：{weekLabel}（UTC {formatSupporterReinforcementWeekRange(weekOffset, journalNow)}）</p>
      {entries.length ? <ul className="supporter-reinforcement-journal-list" aria-label={`${weekLabel}已完成的一題補強`}>{entries.map((entry) => <li key={`${entry.questionId}-${entry.completedAt}`}><span className="supporter-reinforcement-subject">{entry.subject}</span><div><h3>{entry.knowledge}</h3><p>{islandTitleBySubject.get(entry.subject) ?? `${entry.subject}島`} · <time dateTime={new Date(entry.completedAt).toISOString()}>{formatSupporterReinforcementTime(entry.completedAt)} 完成</time></p></div></li>)}</ul> : <p className="supporter-reinforcement-journal-empty" aria-live="polite">{weekLabel}尚未留下補強紀錄；孩子完成一題補強後，這裡會以真實主題留下新的航行足跡。</p>}
    </section>
  );
}

function supporterReinforcementTopicDistributionReadout(topics: ReinforcementJournalTopicDistributionItem[], islandTitleBySubject: Map<string, string>) {
  if (!topics.length) return "過去四週補強主題分布目前還沒有可驗證的紀錄。孩子完成一題補強後，這裡會整理實際出現的主題。";
  return `過去四週補強主題分布共有${topics.length}個真實主題：${topics.map((topic) => `${islandTitleBySubject.get(topic.subject) ?? `${topic.subject}島`}的${topic.knowledge}，${topic.count}筆`).join("；")}。`;
}

function formatSupporterReinforcementDistributionRange(now: number) {
  const firstWeek = getRecentReinforcementJournalWeekRange(RECENT_REINFORCEMENT_WEEK_COUNT - 1, now);
  const currentWeek = getRecentReinforcementJournalWeekRange(0, now);
  if (!firstWeek || !currentWeek) return "最近四週（UTC）";
  const formatter = new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric", timeZone: "UTC" });
  return `UTC ${formatter.format(new Date(firstWeek.start))} 至 ${formatter.format(new Date(currentWeek.end))}`;
}

function buildSupporterReinforcementTrendMessage(comparison: ReturnType<typeof buildCurrentVsPreviousReinforcementJournalComparison>) {
  const { currentWeekCount, previousWeekCount, difference, status } = comparison;
  if (status === "no-data") return { title: "等待新的補強足跡", message: "本週與上週都還沒有可比較的補強紀錄；完成一題補強後，這裡會以真實足跡更新。" };
  if (status === "more") return { title: `本週多留下 ${difference} 筆補強足跡`, message: `本週完成 ${currentWeekCount} 筆，上週為 ${previousWeekCount} 筆。很棒，孩子正持續把需要整理的主題化為前進的線索。` };
  if (status === "steady") return { title: "本週與上週維持穩定節奏", message: `本週與上週各完成 ${currentWeekCount} 筆補強。穩定的練習，正在累積成可回顧的學習航線。` };
  return { title: "本週仍留下新的補強線索", message: `本週完成 ${currentWeekCount} 筆，上週為 ${previousWeekCount} 筆。每一筆真實紀錄都能幫助下一次練習更聚焦。` };
}

function SupporterReinforcementTopicDistribution({ topics, islandTitleBySubject, journalNow }: { topics: ReinforcementJournalTopicDistributionItem[]; islandTitleBySubject: Map<string, string>; journalNow: number }) {
  const [spoken, setSpoken] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{ key: string; source: "hover" | "focus" | "tap" } | null>(null);
  const suppressedFocusTopic = useRef<string | null>(null);
  const maxCount = Math.max(...topics.map((topic) => topic.count), 1);
  const comparison = buildCurrentVsPreviousReinforcementJournalComparison(journalNow);
  const trendMessage = buildSupporterReinforcementTrendMessage(comparison);
  const readout = `${supporterReinforcementTopicDistributionReadout(topics, islandTitleBySubject)} 本週較上週：${trendMessage.title}。${trendMessage.message}`;
  const distributionRange = formatSupporterReinforcementDistributionRange(journalNow);
  const openTooltip = (key: string, source: "hover" | "focus" | "tap") => {
    if (source === "focus" && suppressedFocusTopic.current === key) return;
    setActiveTooltip({ key, source });
  };
  const closeTooltip = (key: string, source?: "hover" | "focus" | "escape") => {
    if (source === "escape") suppressedFocusTopic.current = key;
    if (source === "focus") suppressedFocusTopic.current = null;
    setActiveTooltip((current) => current?.key === key && (source === "escape" || !source || current.source === source) ? null : current);
  };

  return (
    <section className="supporter-reinforcement-distribution" aria-labelledby="supporter-reinforcement-distribution-title" data-testid="supporter-reinforcement-distribution">
      <div className="supporter-reinforcement-distribution-heading">
        <div><p className="eyebrow">FOUR-WEEK TOPIC VIEW</p><h2 id="supporter-reinforcement-distribution-title"><BarChart3 size={20} aria-hidden="true" /> 過去四週補強主題分布</h2><p>以真實完成的一題補強整理相同學科與知識點，不以百分比或推測資料補足內容。</p></div>
        <button type="button" className="supporter-speak-button" onClick={() => { speak(readout); setSpoken(true); }} aria-label="朗讀過去四週補強主題分布"><Headphones size={16} aria-hidden="true" /> {spoken ? "已朗讀分布" : "朗讀分布"}</button>
      </div>
      <div className="supporter-reinforcement-distribution-content">
      {topics.length ? <ul className="supporter-reinforcement-distribution-list" aria-label="過去四週補強主題分布">{topics.map((topic, index) => {
        const topicKey = `${topic.subject}\u0000${topic.knowledge}`;
        const tooltipId = `supporter-reinforcement-topic-tooltip-${index}`;
        const isTooltipActive = activeTooltip?.key === topicKey;
        const islandTitle = islandTitleBySubject.get(topic.subject) ?? `${topic.subject}島`;
        return <li key={`${topic.subject}-${topic.knowledge}`} data-tooltip-active={isTooltipActive} onMouseEnter={() => openTooltip(topicKey, "hover")} onMouseLeave={() => closeTooltip(topicKey, "hover")} onFocus={() => openTooltip(topicKey, "focus")} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeTooltip(topicKey, "focus"); }} onKeyDown={(event) => { if (event.key !== "Escape" || !isTooltipActive) return; event.preventDefault(); closeTooltip(topicKey, "escape"); event.currentTarget.querySelector<HTMLButtonElement>(".supporter-reinforcement-distribution-trigger")?.focus(); }}>
          <button type="button" className="supporter-reinforcement-distribution-trigger" aria-label={`查看${topic.subject}科${topic.knowledge}的詳細補強資料`} aria-controls={tooltipId} aria-expanded={isTooltipActive} aria-describedby={isTooltipActive ? tooltipId : undefined} onClick={() => isTooltipActive ? closeTooltip(topicKey) : openTooltip(topicKey, "tap")}>
            <div className="supporter-reinforcement-distribution-item-head"><div><span className="supporter-reinforcement-subject">{topic.subject}</span><h3>{topic.knowledge}</h3><p>{islandTitle}</p></div><strong aria-label={`${topic.knowledge}共有${topic.count}筆真實補強紀錄`}>{topic.count} 筆</strong></div>
            <div className="supporter-reinforcement-topic-meter" role="progressbar" aria-label={`${topic.subject}科${topic.knowledge}的補強紀錄數`} aria-valuemin={0} aria-valuemax={maxCount} aria-valuenow={topic.count} aria-valuetext={`${topic.knowledge}，${topic.count}筆真實補強紀錄`}><span style={{ "--reinforcement-topic-scale": `${topic.count / maxCount}` } as React.CSSProperties} /></div>
          </button>
          {isTooltipActive ? <aside id={tooltipId} className="supporter-reinforcement-topic-tooltip" role="tooltip" aria-label={`${topic.knowledge}的詳細補強資料`}><p><strong>{topic.subject}科 · {islandTitle}</strong></p><p><strong>{topic.knowledge}</strong> 在過去四週累計完成 <strong>{topic.count}</strong> 筆真實補強紀錄。</p><p>統計範圍：{distributionRange}</p><p className="supporter-reinforcement-topic-tooltip-hint">可再次點選收起提示；使用鍵盤時可按 Escape 收起。</p></aside> : null}
        </li>;
      })}</ul> : <p className="supporter-reinforcement-distribution-empty" aria-live="polite">過去四週尚無可驗證的補強主題紀錄；孩子完成一題補強後，這裡會以真實主題畫出航行分布。</p>}
      <aside className="supporter-reinforcement-trend" data-trend={comparison.status} aria-label="本週較上週補強趨勢" aria-live="polite">
        <span className="supporter-reinforcement-trend-icon" aria-hidden="true"><Sparkles size={18} /></span>
        <div><p className="supporter-reinforcement-trend-eyebrow">THIS WEEK VS LAST WEEK</p><h3>本週較上週</h3><strong>{trendMessage.title}</strong><p>{trendMessage.message}</p><dl><div><dt>本週</dt><dd>{comparison.currentWeekCount} 筆</dd></div><div><dt>上週</dt><dd>{comparison.previousWeekCount} 筆</dd></div></dl></div>
      </aside>
      </div>
    </section>
  );
}

function QuestionReviewDialog({ review, isLoading, closeRef, onClose, onOpenPractice }: { review: TimelineQuestionReview; isLoading: boolean; closeRef: React.RefObject<HTMLButtonElement | null>; onClose: () => void; onOpenPractice: (href: string) => void }) {
  const practiceRecommendation = review.status === "available" ? buildKnowledgePracticeRecommendation(review) : null;
  return (
    <div className="supporter-question-review-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="supporter-question-review" role="dialog" aria-modal="true" aria-labelledby="supporter-question-review-title">
        <div className="supporter-question-review-heading"><div><p className="eyebrow">REAL ATTEMPT RECAP</p><h3 id="supporter-question-review-title">{review.event.subject}島的相關題目</h3></div><button ref={closeRef} type="button" className="supporter-question-review-close" onClick={onClose} aria-label="關閉題目回顧">關閉</button></div>
        {isLoading ? <p className="supporter-question-review-note" aria-live="polite">正在從正式題庫確認這題的內容。</p> : review.status === "unavailable" ? <p className="supporter-question-review-note" aria-live="polite">{review.message}</p> : <>
          <p className="supporter-question-review-meta">{formatSupporterTimelineTimestamp(review.event.timestamp)} · {review.event.knowledge}</p>
          <p className="supporter-question-prompt">{review.prompt}</p>
          {review.options.length > 0 && <ol className="supporter-question-options">{review.options.map((option, index) => <li key={`${option}-${index}`}>{option}</li>)}</ol>}
          <p className="supporter-question-review-result">{review.responseNote}</p>
          <p className="supporter-question-review-note">{review.selectionNote}</p>
          {review.answer && <p className="supporter-question-answer"><strong>題庫參考答案：</strong>{review.answer}</p>}
          {review.explanation && <p className="supporter-question-explanation"><strong>題庫解析：</strong>{review.explanation}</p>}
          {practiceRecommendation?.status === "available" ? <div className="supporter-question-practice"><p>想延續這段學習線索嗎？可以從同一個知識點再練一題。</p><button type="button" className="supporter-question-practice-button" onClick={() => onOpenPractice(practiceRecommendation.href)} aria-label={practiceRecommendation.ariaLabel}><BookOpen size={16} aria-hidden="true" /> {practiceRecommendation.label}</button></div> : practiceRecommendation?.status === "unavailable" ? <p className="supporter-question-practice-unavailable" role="status">{practiceRecommendation.message}</p> : null}
          <button type="button" className="supporter-speak-button" onClick={() => speak(`${review.readout}${practiceRecommendation ? ` ${practiceRecommendation.readout}` : ""}`)}><Headphones size={16} /> 朗讀本題</button>
        </>}
      </section>
    </div>
  );
}

export default function TeacherParentSummary() {
  const [, setLocation] = useLocation();
  const [profile] = useState(() => loadAdaptiveProfile());
  const [filters, setFilters] = useState<SupporterSummaryFilters>(() => loadSupporterSummaryFilters());
  const [reinforcementJournalNow] = useState(() => Date.now());
  const [reinforcementJournalWeekOffset, setReinforcementJournalWeekOffset] = useState(() => loadSupporterReinforcementWeekOffset());
  const reinforcementJournal = useMemo(() => loadRecentReinforcementJournalWeek(reinforcementJournalWeekOffset, reinforcementJournalNow), [reinforcementJournalNow, reinforcementJournalWeekOffset]);
  const reinforcementTopicDistribution = useMemo(() => buildRecentReinforcementJournalTopicDistribution(reinforcementJournalNow), [reinforcementJournalNow]);
  const filteredProfile = useMemo(() => filterAdaptiveProfile(profile, filters), [profile, filters]);
  const summary = useMemo(() => buildTeacherParentSummary(filteredProfile), [filteredProfile]);
  const timeline = useMemo(() => buildSupporterLearningTimeline(filteredProfile), [filteredProfile]);
  const islandTitleBySubject = useMemo(() => new Map(summary.islands.map(({ island }) => [island.subject, island.title])), [summary.islands]);
  const questionBankQuery = trpc.questionBank.list.useQuery({ limit: 500 });
  const questionBank = (questionBankQuery.data ?? []) as TimelineQuestionBankRow[];
  const [spoken, setSpoken] = useState(false);
  const [reviewEventId, setReviewEventId] = useState<string | null>(null);
  const reviewCloseRef = useRef<HTMLButtonElement | null>(null);
  const reviewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const hasFilters = hasSupporterSummaryFilters(filters);
  const validDateRange = hasValidSupporterDateRange(filters);
  const emptyProfile = profile.attempts.length === 0;
  const filteredEmpty = !emptyProfile && summary.totalAttempts === 0;
  const reviewEvent = timeline.events.find((event) => event.id === reviewEventId) ?? null;
  const questionReview = reviewEvent ? buildTimelineQuestionReview(reviewEvent, questionBank) : null;
  const readout = `四座知識島陪讀摘要。${hasFilters ? "目前套用篩選條件。" : "目前顯示全部紀錄。"}共有 ${summary.totalAttempts} 次實際作答，${summary.activeIslands} 座島嶼留下學習足跡。${buildSupporterTimelineReadout(timeline)}${summary.nextConversation}`;
  const updateFilter = (patch: Partial<SupporterSummaryFilters>) => { const next = { ...filters, ...patch }; setFilters(next); saveSupporterSummaryFilters(next); setSpoken(false); };
  const clearFilters = () => { setFilters({ ...DEFAULT_SUPPORTER_SUMMARY_FILTERS }); saveSupporterSummaryFilters(DEFAULT_SUPPORTER_SUMMARY_FILTERS); setSpoken(false); };
  const closeQuestionReview = () => {
    setReviewEventId(null);
    window.requestAnimationFrame(() => reviewTriggerRef.current?.focus());
  };

  useEffect(() => {
    if (!reviewEventId) return;
    reviewCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeQuestionReview(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reviewEventId]);

  return (
    <main className="supporter-summary-page">
      <header className="supporter-summary-hero"><div className="supporter-summary-hero-copy"><p className="eyebrow">FAMILY & TEACHER VIEW / LOCAL-FIRST</p><h1><UsersRound size={31} aria-hidden="true" /> 四座知識島陪讀摘要</h1><p>用真實作答足跡看見學生探索過的課綱主題，讓陪伴從「問分數」開始轉向「聊學習」。</p></div><div className="supporter-privacy-note"><ShieldCheck size={18} /><span>資料只留在此裝置<br /><small>未練習的島嶼不會被推測</small></span></div></header>

      <section className="supporter-filter-panel" aria-labelledby="supporter-filter-title"><div className="supporter-filter-heading"><div><p className="eyebrow">FOCUS THE LOGBOOK</p><h2 id="supporter-filter-title">選擇想一起回顧的範圍</h2></div><span className="supporter-filter-count" aria-live="polite">顯示 {summary.totalAttempts} / {profile.attempts.length} 次足跡</span></div><div className="supporter-filter-grid"><label><span>知識島嶼</span><select aria-label="依知識島嶼篩選" value={filters.islandSubject} onChange={(event) => updateFilter({ islandSubject: event.target.value })}><option value="all">全部島嶼</option>{summary.islands.map(({ island }) => <option key={island.id} value={island.subject}>{island.subject}島</option>)}</select></label><label><span>開始日期</span><input aria-label="學習紀錄開始日期" type="date" value={filters.fromDate} onChange={(event) => updateFilter({ fromDate: event.target.value })} /></label><label><span>結束日期</span><input aria-label="學習紀錄結束日期" type="date" value={filters.toDate} onChange={(event) => updateFilter({ toDate: event.target.value })} /></label><div className="supporter-filter-actions">{hasFilters && <button type="button" className="supporter-secondary-button" onClick={clearFilters}><RotateCcw size={15} /> 清除篩選</button>}</div></div>{!validDateRange && <p className="supporter-filter-note" role="alert">請讓開始日期早於或等於結束日期，完成後就能查看這段航行紀錄。</p>}{hasFilters && validDateRange && <p className="supporter-filter-note" aria-live="polite">已依條件整理真實作答足跡；未符合範圍的紀錄不會出現在摘要中。</p>}</section>

      <section className="supporter-summary-kpis" aria-label="四座知識島總覽"><article><span>學習足跡</span><strong>{summary.totalAttempts}</strong><small>次實際作答</small></article><article><span>已探索島嶼</span><strong>{summary.activeIslands}<small> / 4</small></strong><small>有作答紀錄</small></article><article><span>觀察主題</span><strong>{summary.visitedTopics.length}</strong><small>個最近出現的知識點</small></article></section>

      <section className="supporter-conversation-card" aria-labelledby="supporter-conversation-title"><div className="supporter-conversation-icon"><MessageCircleHeart size={22} aria-hidden="true" /></div><div><p className="eyebrow">A KIND NEXT QUESTION</p><h2 id="supporter-conversation-title">陪讀時可以這樣聊</h2><p>{summary.nextConversation}</p></div><button type="button" className="supporter-speak-button" onClick={() => { speak(readout); setSpoken(true); }}><Headphones size={16} /> {spoken ? "已朗讀" : "朗讀摘要"}</button></section>

      <SupporterReinforcementJournal entries={reinforcementJournal} islandTitleBySubject={islandTitleBySubject} weekOffset={reinforcementJournalWeekOffset} journalNow={reinforcementJournalNow} onWeekChange={(offset) => { setReinforcementJournalWeekOffset(offset); saveSupporterReinforcementWeekOffset(offset); }} />
        <SupporterReinforcementTopicDistribution topics={reinforcementTopicDistribution} islandTitleBySubject={islandTitleBySubject} journalNow={reinforcementJournalNow} />

      {emptyProfile ? <section className="supporter-empty-state" aria-live="polite"><BookOpen size={28} aria-hidden="true" /><h2>等待第一段探險足跡</h2><p>學生完成第一題後，四座知識島會依真實紀錄逐步顯示學習方向。現在可以先一起看看地圖。</p><button type="button" className="supporter-primary-button" onClick={() => setLocation("/map")}><Compass size={17} /> 前往我的地圖</button></section> : filteredEmpty ? <section className="supporter-empty-state" aria-live="polite"><CalendarDays size={28} aria-hidden="true" /><h2>這段航線還沒有紀錄</h2><p>可以調整島嶼或日期範圍，回到已有足跡的學習旅程。</p><button type="button" className="supporter-primary-button" onClick={clearFilters}><RotateCcw size={17} /> 清除篩選</button></section> : <><div className="supporter-section-heading"><div><p className="eyebrow">ISLAND LOGBOOK</p><h2>各島嶼學習摘要</h2></div><span><CalendarDays size={15} /> 依本機紀錄更新</span></div><section className="supporter-island-grid" aria-label="四座知識島學習摘要">{summary.islands.map((item) => <IslandCard key={item.island.id} item={item} onOpenMap={(subject) => setLocation(`/map?subject=${encodeURIComponent(subject)}`)} />)}</section></>}

      <section className="supporter-timeline-panel" aria-labelledby="supporter-timeline-title">
        <div className="supporter-timeline-heading"><div><p className="eyebrow">LEARNING VOYAGE</p><h2 id="supporter-timeline-title"><Waypoints size={20} aria-hidden="true" /> 跨島學習時間軸</h2><p>依真實作答時間串起不同知識島的探索歷程，方便一起回顧走過的主題。</p></div>{timeline.islandsRepresented.length > 0 && <div className="supporter-timeline-legend" aria-label="時間軸中的知識島">{timeline.islandsRepresented.map((subject) => <span key={subject} data-island={subject}>{subject}島</span>)}</div>}</div>
        {timeline.events.length > 0 ? <ol className="supporter-timeline" aria-label="跨島學習足跡時間軸">{timeline.events.map((event) => <li key={event.id} className="supporter-timeline-event" data-island={event.subject}><span className="supporter-timeline-node" aria-hidden="true" /><article aria-label={`${formatSupporterTimelineTimestamp(event.timestamp)}，${event.subject}島，${event.knowledge}，${event.activityLabel}`}><time dateTime={new Date(event.timestamp).toISOString()}>{formatSupporterTimelineTimestamp(event.timestamp)}</time><span className="supporter-timeline-subject">{event.subject}島</span><h3>{event.knowledge}</h3><p>{event.activityLabel}</p><button type="button" className="supporter-timeline-review-button" ref={reviewEventId === event.id ? reviewTriggerRef : undefined} onClick={() => { reviewTriggerRef.current = document.activeElement as HTMLButtonElement; setReviewEventId(event.id); }}>查看相關題目</button></article></li>)}</ol> : <p className="supporter-timeline-empty" aria-live="polite">目前範圍內還沒有學習足跡。完成下一題後，這裡會依真實紀錄畫出跨島航線。</p>}
        {questionReview && <QuestionReviewDialog review={questionReview} isLoading={questionBankQuery.isLoading} closeRef={reviewCloseRef} onClose={closeQuestionReview} onOpenPractice={setLocation} />}
      </section>

      <section className="supporter-topics-panel" aria-labelledby="supporter-topics-title"><div><p className="eyebrow">OBSERVED TOPICS</p><h2 id="supporter-topics-title">最近看見的學習線索</h2></div>{summary.visitedTopics.length > 0 ? <div className="supporter-topic-cloud">{summary.visitedTopics.map((topic) => <span key={topic}><Sparkles size={13} aria-hidden="true" />{topic}</span>)}</div> : <p>完成題目後，實際出現的知識點會在這裡留下線索。</p>}</section>
      <button type="button" className="supporter-back-button" onClick={() => setLocation("/learning-insights")}><ChevronLeft size={16} /> 回到學習洞察</button>
    </main>
  );
}
