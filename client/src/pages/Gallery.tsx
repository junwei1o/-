import React, { useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, Clapperboard, Dices, FlaskConical, LifeBuoy, Lightbulb, Orbit, Sparkles, Telescope, type LucideIcon } from "lucide-react";
import "./HubPages.css";

type TabId = "story" | "astro" | "science" | "safety";

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: "story", label: "文學故事", icon: BookOpen },
  { id: "astro", label: "天文", icon: Telescope },
  { id: "science", label: "科學原理", icon: FlaskConical },
  { id: "safety", label: "生活安全", icon: LifeBuoy },
];

/**
 * 知識展廳：故事、天文、科學原理、生活安全，同一個展廳換分類標籤。
 * 收編原本的天文館、世界原理站、影視觀測站、生活安全學院、智慧故事館、讀書技巧。
 */
export default function Gallery() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<TabId>("story");

  const entries: Record<TabId, Array<{ label: string; desc: string; href: string; icon: React.ElementType }>> = {
    story: [
      { label: "智慧故事館", desc: "閱讀故事並發現知識線索", href: "/wisdom", icon: Sparkles },
      { label: "讀書技巧", desc: "把學習方法變成可練習的小步驟", href: "/study-tips", icon: Lightbulb },
    ],
    astro: [
      { label: "天文館", desc: "探索星空、行星與太空任務", href: "/astronomy", icon: Orbit },
    ],
    science: [
      { label: "世界原理站", desc: "以互動方式理解科學原理", href: "/principles", icon: Dices },
      { label: "影視觀測站", desc: "從作品主題延伸素養觀察", href: "/observatory", icon: Clapperboard },
    ],
    safety: [
      { label: "生活安全學院", desc: "消防、醫療、食物與身體自保知識", href: "/safety", icon: LifeBuoy },
    ],
  };

  return (
    <main className="hub-page" aria-labelledby="gallery-title">
      <header className="hub-header">
        <p className="hub-eyebrow">KNOWLEDGE GALLERY</p>
        <h1 className="hub-title" id="gallery-title">知識展廳</h1>
        <p className="hub-sub">故事、天文、科學原理、生活安全，同一個展廳換分類標籤。</p>
      </header>
      <div className="hub-tabs" role="tablist" aria-label="知識展廳分類">
        {TABS.map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`hub-tab ${tab === id ? "on" : ""}`}
            onClick={() => setTab(id)}
          >
            <TabIcon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div className="hub-grid" role="tabpanel">
        {entries[tab].map(({ label, desc, href, icon: Icon }) => (
          <button key={href} type="button" className="hub-card" onClick={() => setLocation(href)}>
            <span className="hub-card-icon" aria-hidden="true"><Icon size={21} /></span>
            <h3>{label}</h3>
            <p>{desc}</p>
            <small>前往 →</small>
          </button>
        ))}
      </div>
    </main>
  );
}
