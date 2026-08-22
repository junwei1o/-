import React, { useState } from "react";
import { ArrowLeft, ArrowUpRight, Binoculars, CircleDot, Compass, Telescope } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ASTRONOMY_EXHIBITS } from "@/lib/astronomy";
import AstronomyQuiz from "@/components/AstronomyQuiz";

const icons = [CircleDot, Compass, CircleDot, Telescope, CircleDot, Binoculars, Telescope, CircleDot];

export default function AstronomyHall() {
  const [, setLocation] = useLocation();
  const [quizOpen, setQuizOpen] = useState(false);

  if (quizOpen) return <AstronomyQuiz onExit={() => setQuizOpen(false)} />;

  return (
    <main className="astronomy-shell">
      <header className="principles-topbar astronomy-topbar">
        <Link href="/principles" className="principles-back"><ArrowLeft size={16} /> 返回蟲洞索引</Link>
        <span className="principles-code">HUMAN SPARK / ASTRONOMY HALL</span>
      </header>

      <section className="astronomy-hero" aria-labelledby="astronomy-title">
        <div className="astronomy-hero-copy">
          <p className="eyebrow accent">HUMAN SPARK / OBSERVATORY WING</p>
          <h1 id="astronomy-title">天文館<br /><i>把夜空變成問題。</i></h1>
          <p>從腳下的地球出發，穿越太陽系、恆星與星系，練習用觀察、比較與證據理解宇宙。天文問答只收錄天文知識，不混入一般學科或休閒題庫。</p>
          <div className="astronomy-stat-row"><span><strong>{ASTRONOMY_EXHIBITS.length}</strong> 個展區</span><span><strong>4</strong> 層觀測任務</span></div>
          <button type="button" className="astronomy-quiz-launch" onClick={() => setQuizOpen(true)}>選擇天文難度 <ArrowUpRight size={16} /></button>
        </div>
        <div className="astronomy-orbit-art" aria-label="天文館軌道示意圖">
          <div className="astronomy-orbit orbit-a" /><div className="astronomy-orbit orbit-b" /><div className="astronomy-orbit orbit-c" />
          <div className="astronomy-sun"><span>LOOK</span><small>UPWARD</small></div>
          <span className="astronomy-dot dot-a" /><span className="astronomy-dot dot-b" /><span className="astronomy-dot dot-c" />
        </div>
      </section>

      <section className="astronomy-index" aria-labelledby="astronomy-index-heading">
        <div className="principles-section-head"><div><p className="eyebrow">OBSERVATORY INDEX / 展區索引</p><h2 id="astronomy-index-heading">選一站，開始觀測</h2></div><span>{ASTRONOMY_EXHIBITS.length} 個展區</span></div>
        <div className="astronomy-grid">
          {ASTRONOMY_EXHIBITS.map((item, index) => {
            const Icon = icons[index];
            return <button key={item.key} type="button" className={`astronomy-card astronomy-${item.color}`} onClick={() => setLocation(`/astronomy/${item.key}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setLocation(`/astronomy/${item.key}`); } }}>
              <span className="astronomy-card-number">0{index + 1}</span><span className="astronomy-card-icon"><Icon size={20} /></span><p className="eyebrow">{item.eyebrow}</p><h3>{item.name}</h3><span className="astronomy-card-english">{item.english}</span><p>{item.short}</p><span className="principle-link">進入展區 <ArrowUpRight size={15} /></span>
            </button>;
          })}
        </div>
      </section>

      <section className="astronomy-field-note"><Telescope size={18} /><p>觀星小提醒：先記錄你真正看見的，再寫下你的推測。科學探索不是一次答對，而是讓下一次觀察更精準。</p></section>
    </main>
  );
}
