import React, { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, ExternalLink, Filter, PlayCircle, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { OBSERVATORY_CATEGORIES, OBSERVATORY_ENTRIES, type ObservatoryCategory } from "@/lib/mediaObservatory";

export default function MediaObservatory() {
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState<ObservatoryCategory | "全部">("全部");
  const entries = useMemo(() => category === "全部" ? OBSERVATORY_ENTRIES : OBSERVATORY_ENTRIES.filter((entry) => entry.category === category), [category]);

  return (
    <main className="observatory-page">
      <header className="observatory-topbar">
        <button className="region-back-link" onClick={() => setLocation("/map")}><ArrowLeft size={16} /> 返回我的地圖</button>
        <span className="region-detail-mark"><Radio size={15} /> FIELD MEDIA OBSERVATORY</span>
      </header>
      <section className="observatory-hero">
        <div>
          <p className="eyebrow accent">FIELD MEDIA / 動漫與特攝觀測站</p>
          <h1>把影像，<br /><i>變成觀察線索。</i></h1>
          <p className="observatory-lede">從溫暖日常、巨大英雄到科技變身，練習把喜歡的作品拆成角色、設計、環境與問題解決；用自己的話整理世界觀，再把好奇心帶回學習。</p>
          <div className="observatory-hero-meta"><span><PlayCircle size={15} /> {OBSERVATORY_ENTRIES.length} 個觀測單元</span><span><BookOpen size={15} /> 原創學習摘要</span></div>
        </div>
          <div className="observatory-radar" aria-hidden="true"><div className="radar-ring ring-one" /><div className="radar-ring ring-two" /><div className="radar-sweep" /><span className="radar-dot dot-one" /><span className="radar-dot dot-two" /><span className="radar-dot dot-three" /><strong>ON AIR</strong><small>OBSERVATION<br />STATION / 03</small></div>
      </section>
      <section className="observatory-content" aria-labelledby="observatory-list-title">
        <div className="observatory-heading"><div><p className="eyebrow">SIGNAL INDEX / 分類索引</p><h2 id="observatory-list-title">選一個觀測頻道</h2></div><span className="observatory-count">{entries.length} 個結果</span></div>
        <div className="observatory-filters" role="group" aria-label="觀測站分類篩選">{OBSERVATORY_CATEGORIES.map((item) => <button key={item} className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}><Filter size={13} /> {item}</button>)}</div>
        <div className="observatory-grid">{entries.map((entry, index) => <article className={`observatory-card palette-${entry.palette}`} key={entry.key}><div className="observatory-card-visual" aria-hidden="true"><span className="signal-orbit" /><span className="signal-core">{String(index + 1).padStart(2, "0")}</span><small>{entry.category}</small></div><div className="observatory-card-body"><div className="observatory-card-title"><div><p className="eyebrow">{entry.era}</p><h3>{entry.title}</h3></div><Sparkles size={17} /></div><p>{entry.shortDescription}</p><div className="observatory-observe"><strong>觀測提示</strong><span>{entry.observation}</span></div><div className="observatory-learning"><BookOpen size={14} /><span>{entry.learning}</span></div><button className="text-btn" onClick={() => setLocation(`/observatory/${entry.key}`)}>開啟觀測卡 <ExternalLink size={14} /></button></div></article>)}</div>
        <div className="observatory-note"><ShieldCheck size={17} /><div><strong>版權與來源說明</strong><p>本頁使用作品名稱作為索引，卡片內容為寶島探險家製作的原創觀測摘要與學習提示；未收錄劇照、影片、台詞或未授權媒體。點選作品後可查看觀測主題，官方資訊請以權利人公開頁面為準。</p></div></div>
      </section>
    </main>
  );
}
