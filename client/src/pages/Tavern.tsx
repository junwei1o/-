import React from "react";
import { BookHeart, Layers, Medal, ScrollText, type LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { getPlayerData } from "@/utils/storage";
import { TavernCompanion } from "@/components/TavernCompanion";
import "./Tavern.css";

type TavernEntry = { id: string; label: string; description: string; href: string; icon: LucideIcon };

const TAVERN_ENTRIES: TavernEntry[] = [
  { id: "cards", label: "潮汐牌局", description: "Top Trumps 比數值卡牌對戰", href: "/tavern/cards", icon: Layers },
  { id: "adventure", label: "文字冒險", description: "從酒館出發，闖蕩敘事章節", href: "/tavern/adventure", icon: ScrollText },
  { id: "companions", label: "夥伴小屋", description: "檢視你的冒險夥伴", href: "#companions", icon: BookHeart },
  { id: "titles", label: "稱號牆", description: "酒館收集的限定稱號", href: "/badges", icon: Medal },
];

export default function Tavern() {
  const [, setLocation] = useLocation();
  const player = getPlayerData();
  return (
    <main className="tavern-page">
      <header className="tavern-hero">
        <h1>🏮 燈塔酒館</h1>
        <p>學完了就進來歇腳，玩玩卡牌、聽聽故事、看看老夥伴。</p>
        <p className="tavern-gold">💰 金幣：{player.gold}</p>
      </header>
      <section className="tavern-entries">
        {TAVERN_ENTRIES.map((entry) => {
          const Icon = entry.icon;
          return (
            <button key={entry.id} className="tavern-entry" onClick={() => setLocation(entry.href)}>
              <Icon size={28} />
              <strong>{entry.label}</strong>
              <span>{entry.description}</span>
            </button>
          );
        })}
      </section>
      <section id="companions" className="tavern-companions">
        <h2>🐾 夥伴小屋</h2>
        <TavernCompanion />
      </section>
    </main>
  );
}
