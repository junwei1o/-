import React from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Lightbulb, MessageCircleQuestion, Quote, Sparkles } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { WISDOM_STORIES, getWisdomStory } from "@/lib/wisdomStories";

export default function WisdomStoryDetail() {
  const [, params] = useRoute("/wisdom/:key");
  const [, setLocation] = useLocation();
  const story = getWisdomStory(params?.key ?? "");
  if (!story) return <main className="wisdom-shell"><Link href="/wisdom" className="principles-back"><ArrowLeft size={16} /> 返回智慧故事館</Link><section className="wisdom-empty"><Sparkles size={20} /><p>找不到這個故事展件。</p></section></main>;
  const index = WISDOM_STORIES.findIndex((item) => item.key === story.key);
  const next = WISDOM_STORIES[(index + 1) % WISDOM_STORIES.length];
  return <main className="wisdom-shell wisdom-detail-shell">
    <header className="wisdom-topbar"><Link href="/wisdom" className="principles-back"><ArrowLeft size={16} /> 返回智慧故事館</Link><span className="principles-code">WISDOM HALL / {story.category}</span></header>
    <nav className="wisdom-breadcrumb" aria-label="麵包屑導覽"><Link href="/">島嶼地圖</Link><span>/</span><Link href="/wisdom">智慧故事館</Link><span>/</span><span aria-current="page">{story.title}</span></nav>
    <article className="wisdom-detail-card"><div className="wisdom-card-meta"><span>{story.category}</span>{story.source && <span className="source-chip">資料來源已標註</span>}</div><p className="eyebrow accent">STORY TO ACTION / {String(index + 1).padStart(2, "0")}</p><h1>{story.title}</h1><p className="wisdom-detail-hook"><Quote size={20} />{story.hook}</p><div className="wisdom-detail-grid"><section><h2><Quote size={18} />故事內容</h2><p>{story.story}</p></section><section><h2><Lightbulb size={18} />今天的新解</h2><p>{story.newMeaning}</p></section><section><h2><Sparkles size={18} />生活連結</h2><p>{story.lifeLink}</p></section><section><h2><MessageCircleQuestion size={18} />帶走一個問題</h2><p>{story.question}</p></section></div>{story.source && <aside className="wisdom-source"><strong>真實案例來源</strong><span>{story.source.label}{story.source.date ? `｜${story.source.date}` : ""}</span><a href={story.source.url} target="_blank" rel="noreferrer">開啟原始來源 <ExternalLink size={14} /></a></aside>}</article>
    <div className="wisdom-detail-actions"><Link href="/wisdom" className="wisdom-secondary-action"><ArrowLeft size={15} /> 回到索引</Link><button type="button" className="wisdom-primary-action" onClick={() => setLocation(`/wisdom/${next.key}`)}>下一個展件 <ArrowRight size={15} /></button></div>
  </main>;
}
