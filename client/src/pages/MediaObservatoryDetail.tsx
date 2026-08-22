import React, { useState } from "react";
import { ArrowLeft, BookOpen, ExternalLink, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import AnimeWorldviewQuiz from "@/components/AnimeWorldviewQuiz";
import { recordAnimeWorldviewQuizResult } from "@/game/rpgStorage";
import { getObservatoryEntry } from "@/lib/mediaObservatory";
import type { AnimeWorldviewKey } from "@/lib/animeWorldviewQuiz";

export default function MediaObservatoryDetail() {
  const [, params] = useRoute("/observatory/:entryKey");
  const [, setLocation] = useLocation();
  const [showQuiz, setShowQuiz] = useState(false);
  const entry = getObservatoryEntry(params?.entryKey);

  if (!entry) {
    return (
      <main className="region-not-found">
        <Radio size={34} />
        <p className="eyebrow accent">FIELD MEDIA / NOT FOUND</p>
        <h1>找不到這張觀測卡</h1>
        <button className="btn primary" type="button" onClick={() => setLocation("/observatory")}><ArrowLeft size={16} /> 返回觀測站</button>
      </main>
    );
  }

  const quizKey = entry.key as AnimeWorldviewKey;

  return (
    <main className={`media-detail-page palette-${entry.palette}`}>
      <header className="observatory-topbar">
        <button className="region-back-link" type="button" onClick={() => setLocation("/observatory")}><ArrowLeft size={16} /> 返回動漫與特攝觀測站</button>
        <span className="region-detail-mark"><Radio size={15} /> FIELD MEDIA OBSERVATORY</span>
      </header>
      <nav className="region-breadcrumb" aria-label="麵包屑導覽"><ol><li><button type="button" onClick={() => setLocation("/map")}>我的地圖</button></li><li aria-hidden="true">/</li><li><button type="button" onClick={() => setLocation("/observatory")}>動漫與特攝觀測站</button></li><li aria-hidden="true">/</li><li aria-current="page">{entry.title}</li></ol></nav>
      <section className="media-detail-hero"><div><p className="eyebrow accent">{entry.category} / {entry.era}</p><h1>{entry.title}<br /><i>觀測卡</i></h1><p>{entry.shortDescription}</p><div className="media-detail-signal"><Radio size={15} /> 原創觀測摘要 · 不含未授權影像素材</div></div><div className="media-detail-emblem" aria-hidden="true"><span>{entry.title.slice(0, 1)}</span><small>FIELD<br />SIGNAL</small></div></section>
      <section className="media-detail-grid"><article className="media-detail-card media-detail-worldview"><div className="region-card-heading"><span className="region-card-icon"><Sparkles size={17} /></span><div><p className="eyebrow">WORLDVIEW LENS</p><h2>{entry.worldviewTitle}</h2></div></div><p>{entry.worldview}</p><div className="media-detail-question"><strong>想一想</strong><span>如果把這個作品當成一個觀測實驗，你會先記錄角色、環境，還是解決問題的方法？為什麼？</span></div></article><article className="media-detail-card"><div className="region-card-heading"><span className="region-card-icon coral"><BookOpen size={17} /></span><div><p className="eyebrow">LEARNING EXTENSION</p><h2>學習延伸</h2></div></div><p>{entry.learning}</p><ul>{entry.learningPaths.map((path) => <li key={path}>{path}</li>)}</ul></article></section>
      {!showQuiz ? <section className="media-detail-quiz-callout" aria-labelledby="anime-quiz-callout-title"><div><p className="eyebrow accent">AFTER OBSERVATION / 探索後挑戰</p><h2 id="anime-quiz-callout-title">用 5 題整理這個世界的線索</h2><p>每題都有觀測焦點與解析，答題後停留在原題，請自己決定何時前進。</p></div><button type="button" className="btn primary" onClick={() => setShowQuiz(true)}><Sparkles size={16} /> 開始 5 題小測驗</button></section> : <AnimeWorldviewQuiz entryKey={quizKey} title={entry.title} onBack={() => setShowQuiz(false)} onComplete={recordAnimeWorldviewQuizResult} />}
      <a className="media-detail-source" href={entry.officialSourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> 前往{entry.officialLabel}</a>
      <p className="media-detail-footnote"><ShieldCheck size={14} /> 本頁為原創教育觀測內容；作品名稱僅作為索引，官方資料與權利歸屬請以權利人公開資訊為準。</p>
    </main>
  );
}
