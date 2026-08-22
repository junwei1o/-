import React from "react";
import { ArrowLeft, ArrowUpRight, Atom, Brain, CircleDashed, Compass, Lightbulb, Orbit, Telescope, Zap, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";
import PrincipleGuideQuiz from "@/components/PrincipleGuideQuiz";
import { WORLD_PRINCIPLES } from "@/lib/worldPrinciples";

const icons = [Orbit, Brain, Atom, CircleDashed, Zap, Compass, Lightbulb];

export default function WorldPrinciples() {
  const [, setLocation] = useLocation();
  return (
    <main className="principles-shell">
      <header className="principles-topbar">
        <Link href="/" className="principles-back"><ArrowLeft size={16} /> 返回島嶼地圖</Link>
        <span className="principles-code">HUMAN SPARK / WORMHOLE 01</span>
      </header>
      <section className="wormhole-hero">
        <div className="wormhole-copy">
          <p className="eyebrow accent">HUMAN SPARK / KNOWLEDGE TRANSIT</p>
          <h1>人類火種<br /><i>躍遷蟲洞。</i></h1>
          <p>從台灣島的邊緣出發，穿過一個想像中的蟲洞，探索人類用來理解世界的幾個重要原理。這裡不要求一次學會，而是邀請你先找到一條能連回生活的線索。</p>
          <div className="wormhole-hero-tags"><span>7 個世界原理</span><span>生活 × 思考 × 科學</span></div>
          <Link href="/astronomy" className="astronomy-entry-link"><Telescope size={17} /><span><strong>進入天文館</strong><small>8 個展區／觀測任務／宇宙尺度</small></span><ArrowUpRight size={16} /></Link>
          <Link href="/wisdom" className="wisdom-entry-link"><BookOpen size={17} /><span><strong>進入智慧故事館</strong><small>成語／寓言／典故／名言／真實案例</small></span><ArrowUpRight size={16} /></Link>
        </div>
        <div className="wormhole-portal" aria-label="人類火種躍遷蟲洞示意圖"><div className="portal-core"><span>SPARK</span><small>ENTER THE UNKNOWN</small></div><div className="portal-ring ring-one" /><div className="portal-ring ring-two" /><div className="portal-star star-one" /><div className="portal-star star-two" /><div className="portal-star star-three" /></div>
      </section>
      <PrincipleGuideQuiz />
      <section className="principles-index" aria-labelledby="principles-heading">
        <div className="principles-section-head"><div><p className="eyebrow">WORMHOLE INDEX / 原理索引</p><h2 id="principles-heading">選一個原理，開始遷躍</h2></div><span>{WORLD_PRINCIPLES.length} 個觀測點</span></div>
        <div className="principles-grid">
          {WORLD_PRINCIPLES.map((item, index) => {
            const Icon = icons[index];
            return <button key={item.key} type="button" className={`principle-card principle-${item.color}`} onClick={() => setLocation(`/principles/${item.key}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setLocation(`/principles/${item.key}`); } }}>
              <span className="principle-number">0{index + 1}</span><span className="principle-icon"><Icon size={20} /></span><p className="eyebrow">{item.eyebrow}</p><h3>{item.name}</h3><span className="principle-english">{item.english}</span><p>{item.short}</p><span className="principle-link">進入觀測 <ArrowUpRight size={15} /></span>
            </button>;
          })}
        </div>
      </section>
      <section className="principles-footer-note"><Compass size={17} /><p>小提醒：科學原理是模型，不是神秘答案。遇到不懂的地方，先問「我知道什麼？我還缺少什麼證據？」</p></section>
    </main>
  );
}
