import { ArrowLeft, ArrowUpRight, Compass, Leaf, MapPinned, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { MAP_REGIONS, type RegionKey } from "@/lib/mapRegions";

const HERO = "/manus-storage/taiwan-island-map-no-mainland_c6696c04.png";

export default function RegionDetail() {
  const [, params] = useRoute("/regions/:regionKey");
  const [, setLocation] = useLocation();
  const [isLeaving, setIsLeaving] = useState(false);
  const navigationTimer = useRef<number | null>(null);
  const region = MAP_REGIONS.find((item) => item.key === params?.regionKey);
  useEffect(() => () => { if (navigationTimer.current) window.clearTimeout(navigationTimer.current); }, []);

  if (!region) {
    return <main className="region-not-found"><Compass size={34} /><p className="eyebrow accent">FIELD GUIDE / NOT FOUND</p><h1>找不到這條區域航線</h1><button className="btn primary" onClick={() => setLocation("/")}><ArrowLeft size={16} /> 返回島嶼地圖</button></main>;
  }

  const navigateWithTransition = (path: string) => {
    setIsLeaving(true);
    navigationTimer.current = window.setTimeout(() => setLocation(path), 150);
  };
  const goToChallenge = () => navigateWithTransition(`/?region=${region.key}`);

  return (
    <main className={`region-detail-page ${isLeaving ? "is-leaving" : ""}`} aria-busy={isLeaving}>
      <nav className="region-breadcrumb" aria-label="麵包屑導覽">
        <ol>
          <li><button type="button" onClick={() => navigateWithTransition("/")}>首頁</button></li>
          <li aria-hidden="true">/</li>
          <li><button type="button" onClick={() => navigateWithTransition("/")}>島嶼地圖</button></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{region.name}</li>
        </ol>
      </nav>
      <header className="region-detail-topbar">
        <button className="region-back-link" onClick={() => navigateWithTransition("/")}><ArrowLeft size={16} /> 返回島嶼地圖</button>
        <span className="region-detail-mark"><MapPinned size={15} /> ISLAND FIELD NOTES</span>
      </header>
      <section className="region-detail-hero">
        <div className="region-detail-copy">
          <p className="eyebrow accent">TAIWAN / {region.romanized}</p>
          <h1>{region.name}<br /><i>{region.tagline}</i></h1>
          <p className="region-detail-lede">{region.longDescription}</p>
          <div className="region-detail-actions"><button className="btn primary" onClick={goToChallenge}>開始這條航線 <ArrowUpRight size={17} /></button><span><Leaf size={15} /> {region.learning}</span></div>
        </div>
        <div className="region-detail-map"><img src={HERO} alt={`台灣地圖中的${region.name}區域`} /><div className={`region-detail-pin ${region.className}`}><span /></div><div className="region-detail-map-label">REGION / {region.romanized}</div></div>
      </section>
      <section className="region-detail-content">
        <div className="region-detail-grid">
          <article className="region-detail-card observation-card"><div className="region-card-heading"><span className="region-card-icon"><MapPinned size={17} /></span><div><p className="eyebrow">FIELD OBSERVATIONS</p><h2>沿線觀測點</h2></div></div><div className="observation-list">{region.observationPoints.map((point, index) => <div key={point}><b>0{index + 1}</b><span>{point}</span></div>)}</div></article>
          <article className="region-detail-card curriculum-card"><div className="region-card-heading"><span className="region-card-icon coral"><Sparkles size={17} /></span><div><p className="eyebrow">CURRICULUM COMPASS</p><h2>課綱學習重點</h2></div></div><ul>{region.curriculumFocus.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </div>
        <article className="region-question-card"><div><p className="eyebrow accent">FIELD QUESTION / 想一想</p><h2>{region.fieldQuestion}</h2><p>先記下你的觀察，再進入今日挑戰，把線索變成答案。</p></div><button className="text-btn" onClick={goToChallenge}>前往今日挑戰 <ArrowUpRight size={16} /></button></article>
      </section>
    </main>
  );
}
