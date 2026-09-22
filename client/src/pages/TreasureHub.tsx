import React from "react";
import { useLocation } from "wouter";
import { Compass, MapPin, Medal, Sparkles, Telescope } from "lucide-react";
import "./HubPages.css";

/**
 * 藏寶圖：徽章、特產，全部收在一頁。
 */
export default function TreasureHub() {
  const [, setLocation] = useLocation();

  const treasures = [
    { id: "badges", label: "徽章", desc: "收集探險徽章，點亮成就。", href: "/badges", icon: Medal },
    { id: "items", label: "特產", desc: "答題與探索累積的特產，在首頁背包查看。", href: "/", icon: MapPin },
    { id: "gallery", label: "知識展廳", desc: "天文、科學原理、生活安全等專題展區。", href: "/gallery", icon: Telescope },
  ];

  return (
    <main className="hub-page" aria-labelledby="treasure-title">
      <header className="illustration-hero" style={{ "--hero": "url(/assets/illustration/island-overview.webp)" } as React.CSSProperties}>
        <div className="illustration-hero-copy">
          <p className="hub-eyebrow">TREASURE MAP</p>
          <h1 className="hub-title" id="treasure-title"><Compass size={28} aria-hidden="true" /> 藏寶圖</h1>
          <p className="hub-sub">徽章、特產與知識展廳，收集與探索的入口都在這。</p>
        </div>
      </header>
      <div className="hub-grid">
        {treasures.map(({ id, label, desc, href, icon: Icon }) => (
          <button key={id} type="button" className="hub-card" onClick={() => setLocation(href)}>
            <span className="hub-card-icon" aria-hidden="true"><Icon size={21} /></span>
            <h3>{label}</h3>
            <p>{desc}</p>
            <small>前往 →</small>
          </button>
        ))}
      </div>
      <p className="hub-sub" style={{ marginTop: 18 }}>
        <Sparkles size={14} aria-hidden="true" /> 更多冒險故事就藏在首頁的航海圖裡，點島嶼與路線就會遇見。
      </p>
    </main>
  );
}
