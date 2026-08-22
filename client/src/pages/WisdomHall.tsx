import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, BookOpen, CheckCircle2, ExternalLink, Search, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { WISDOM_CATEGORIES, WISDOM_STORIES, type WisdomCategory } from "@/lib/wisdomStories";

export default function WisdomHall() {
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState<WisdomCategory | "全部">("全部");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return WISDOM_STORIES.filter((story) => {
      const matchesCategory = category === "全部" || story.category === category;
      const haystack = `${story.title}${story.hook}${story.newMeaning}${story.lifeLink}`.toLowerCase();
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });
  }, [category, query]);

  return (
    <main className="wisdom-shell">
      <header className="wisdom-topbar">
        <Link href="/" className="principles-back"><ArrowLeft size={16} /> 返回島嶼地圖</Link>
        <span className="principles-code">WISDOM HALL / STORY TO ACTION</span>
      </header>
      <section className="wisdom-hero">
        <div>
          <p className="eyebrow accent">HUMAN SPARK / WISDOM HALL</p>
          <h1>智慧故事館<br /><i>把故事帶回生活。</i></h1>
          <p>成語、寓言、歷史典故、名人名言與真實案例，放在同一座可探索的知識館。先讀一段故事，再問自己：今天能做出什麼小行動？</p>
          <div className="wisdom-hero-tags"><span>{WISDOM_STORIES.length} 個故事展件</span><span>四類智慧 × 現代案例</span></div>
        </div>
        <div className="wisdom-orbit" aria-hidden="true"><BookOpen size={32} /><span>READ</span><span>REFLECT</span><span>ACT</span></div>
      </section>
      <section className="wisdom-controls" aria-label="故事館篩選工具">
        <div className="wisdom-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋故事、生活連結或關鍵字" aria-label="搜尋智慧故事" /></div>
        <div className="wisdom-filters" role="group" aria-label="智慧故事分類">
          {WISDOM_CATEGORIES.map((item) => <button key={item} type="button" className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      </section>
      <section className="wisdom-index" aria-labelledby="wisdom-heading">
        <div className="principles-section-head"><div><p className="eyebrow">STORY INDEX / 故事索引</p><h2 id="wisdom-heading">{category === "全部" ? "今天想探索哪一種智慧？" : category}</h2></div><span>{filtered.length} 個展件</span></div>
        {filtered.length === 0 ? <div className="wisdom-empty"><Sparkles size={20} /><p>找不到符合的故事，試試其他關鍵字或清除搜尋。</p><button type="button" onClick={() => setQuery("")}>清除搜尋</button></div> : <div className="wisdom-grid">{filtered.map((story, index) => <article key={story.key} className={`wisdom-card wisdom-card-${index % 4}`}><div className="wisdom-card-meta"><span>{story.category}</span>{story.source && <span className="source-chip"><CheckCircle2 size={13} />有來源</span>}</div><h3>{story.title}</h3><p className="wisdom-hook">{story.hook}</p><p>{story.newMeaning}</p><div className="wisdom-card-footer"><button type="button" onClick={() => setLocation(`/wisdom/${story.key}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setLocation(`/wisdom/${story.key}`); } }}>閱讀故事 <ArrowUpRight size={15} /></button>{story.source && <a href={story.source.url} target="_blank" rel="noreferrer" aria-label={`${story.title}的資料來源`}><ExternalLink size={14} />來源</a>}</div></article>)}</div>}
      </section>
      <footer className="wisdom-footer-note"><Sparkles size={17} /><p>閱讀古老故事時，先分辨「故事想提醒什麼」與「歷史上確實發生什麼」；閱讀新聞時，記得查看來源、日期與不同觀點。</p></footer>
    </main>
  );
}
