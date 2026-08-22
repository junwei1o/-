import React from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ExternalLink, Telescope } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { ASTRONOMY_EXHIBITS, getAstronomyExhibit } from "@/lib/astronomy";

export default function AstronomyDetail() {
  const { key } = useParams<{ key: string }>();
  const [, setLocation] = useLocation();
  const item = getAstronomyExhibit(key ?? "");
  const index = item ? ASTRONOMY_EXHIBITS.findIndex((candidate) => candidate.key === item.key) : -1;
  const next = index >= 0 ? ASTRONOMY_EXHIBITS[(index + 1) % ASTRONOMY_EXHIBITS.length] : undefined;

  if (!item) {
    return <main className="astronomy-detail-shell"><Link href="/astronomy" className="principles-back"><ArrowLeft size={16} /> 返回天文館</Link><section className="astronomy-not-found"><Telescope size={32} /><h1>找不到這個展區</h1><p>請回到天文館索引，選擇一個觀測站。</p><Link href="/astronomy" className="primary-cta">返回天文館</Link></section></main>;
  }

  return (
    <main className={`astronomy-detail-shell astronomy-detail-${item.color}`}>
      <header className="principles-topbar astronomy-topbar"><Link href="/astronomy" className="principles-back"><ArrowLeft size={16} /> 返回天文館</Link><span className="principles-code">ASTRONOMY HALL / {String(index + 1).padStart(2, "0")}</span></header>
      <section className="astronomy-detail-hero">
        <div className="astronomy-detail-crumbs"><Link href="/">島嶼地圖</Link><span>/</span><Link href="/principles">人類火種躍遷蟲洞</Link><span>/</span><Link href="/astronomy">天文館</Link><span>/</span><strong aria-current="page">{item.name}</strong></div>
        <p className="eyebrow accent">{item.eyebrow}</p><h1>{item.name}</h1><p className="astronomy-detail-english">{item.english}</p><p className="astronomy-detail-lede">{item.short}</p>
        <div className="astronomy-detail-orbit" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span></div>
      </section>
      <section className="astronomy-detail-grid">
        <article className="astronomy-content-card astronomy-card-main"><div className="card-kicker"><BookOpen size={16} /> 把概念說清楚</div><h2>先用一段話抓住它</h2><p>{item.explanation}</p></article>
        <article className="astronomy-content-card"><div className="card-kicker"><CheckCircle2 size={16} /> 生活連結</div><h2>它和我有什麼關係？</h2><p>{item.lifeConnection}</p></article>
        <article className="astronomy-content-card astronomy-mission-card"><div className="card-kicker"><Telescope size={16} /> 今日觀測任務</div><h2>帶著問題離開</h2><p>{item.mission}</p><div className="mission-question">{item.question}</div></article>
        <article className="astronomy-content-card"><div className="card-kicker"><ArrowRight size={16} /> 關鍵概念</div><h2>三個記憶錨點</h2><ul>{item.keyIdeas.map((idea) => <li key={idea}>{idea}</li>)}</ul></article>
      </section>
      <section className="astronomy-detail-footer"><p>資料校對：{item.sourceLabel}</p><a href={item.sourceUrl} target="_blank" rel="noreferrer">閱讀原始資料 <ExternalLink size={14} /></a>{next && <button type="button" onClick={() => setLocation(`/astronomy/${next.key}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setLocation(`/astronomy/${next.key}`); } }}>下一站：{next.name} <ArrowRight size={16} /></button>}</section>
    </main>
  );
}
