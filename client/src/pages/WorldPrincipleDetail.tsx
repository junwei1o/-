import React from "react";
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, ShieldCheck } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { getWorldPrinciple, WORLD_PRINCIPLES } from "@/lib/worldPrinciples";

export default function WorldPrincipleDetail() {
  const [, params] = useRoute("/principles/:key");
  const [, setLocation] = useLocation();
  const item = getWorldPrinciple(params?.key ?? "");
  if (!item) return <main className="principles-shell"><header className="principles-topbar"><Link href="/principles" className="principles-back"><ArrowLeft size={16} /> 返回蟲洞索引</Link></header><section className="principles-empty"><h1>找不到這個觀測點</h1><Link href="/principles" className="btn primary">返回原理索引</Link></section></main>;
  const index = WORLD_PRINCIPLES.findIndex((entry) => entry.key === item.key);
  const next = WORLD_PRINCIPLES[(index + 1) % WORLD_PRINCIPLES.length];
  return <main className="principles-shell detail-shell">
    <header className="principles-topbar"><Link href="/principles" className="principles-back"><ArrowLeft size={16} /> 返回蟲洞索引</Link><span className="principles-code">{item.english} / FIELD NOTE 0{index + 1}</span></header>
    <div className="principles-breadcrumb"><Link href="/">島嶼地圖</Link><span>/</span><Link href="/principles">人類火種躍遷蟲洞</Link><span>/</span><strong aria-current="page">{item.name}</strong></div>
    <section className={`principle-detail-hero detail-${item.color}`}><div><p className="eyebrow accent">{item.eyebrow}</p><h1>{item.name}</h1><p className="detail-english">{item.english}</p><p className="detail-lede">{item.short}</p></div><div className="detail-orbit" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span></div></section>
    <section className="principle-detail-grid"><article className="detail-main-card"><div className="detail-card-label"><BookOpen size={16} /> 把概念說清楚</div><h2>先用一句話抓住它</h2><p>{item.explanation}</p><div className="key-ideas"><h3>三個關鍵線索</h3>{item.keyIdeas.map((idea, ideaIndex) => <div className="key-idea" key={idea}><span>0{ideaIndex + 1}</span><strong>{idea}</strong></div>)}</div></article><aside className="detail-side-card"><div className="detail-card-label"><Lightbulb size={16} /> 連回日常</div><h2>你在哪裡見過它？</h2><p>{item.lifeConnection}</p><div className="thinking-prompt"><span>FIELD QUESTION</span><strong>{item.prompt}</strong></div></aside></section>
    <section className="principle-next"><div><p className="eyebrow">NEXT TRANSMISSION / 下一次遷躍</p><h2>接著探索：{next.name}</h2></div><button className="btn primary" onClick={() => setLocation(`/principles/${next.key}`)}>前往下一站 <ArrowRight size={16} /></button></section>
    <p className="principles-footnote"><ShieldCheck size={14} /> 這些內容是適合入門的概念導覽；更精確的定義需要配合數學、實驗與完整課程逐步學習。</p>
  </main>;
}
