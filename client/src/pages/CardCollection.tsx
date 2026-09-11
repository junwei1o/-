import React, { useMemo } from "react";
import { useLocation } from "wouter";
import CardArt from "@/components/CardArt";
import { getCardCollection } from "@/game/cardCollection";
import { ALL_CARDS, STAT_LABELS, type CardDef, type CardStat } from "@/game/trumpCardData";
import type { Rarity } from "@/game/rpgTypes";
import "./CardCollection.css";

const THEME_ORDER: CardDef["theme"][] = ["國語", "數學", "社會", "自然"];

const RARITY_LABEL: Record<Rarity, string> = {
  legendary: "傳說",
  rare: "稀有",
  common: "普通",
};

/** 取得提示：未收集卡的「怎麼拿」說明 */
function acquisitionHint(card: CardDef): string {
  if (card.rarity === "legendary") return "開卡包／完成冒險";
  return "開卡包／牌局掉落";
}

export default function CardCollection() {
  const [, setLocation] = useLocation();

  const { owned, collection } = useMemo(() => {
    const col = getCardCollection();
    return { owned: new Set(col.ownedCardIds), collection: col };
  }, []);

  const ownedCount = owned.size;
  const totalCount = ALL_CARDS.length;
  const rarityCounts = useMemo(() => {
    const result: Record<Rarity, { owned: number; total: number }> = {
      legendary: { owned: 0, total: 0 },
      rare: { owned: 0, total: 0 },
      common: { owned: 0, total: 0 },
    };
    for (const card of ALL_CARDS) {
      result[card.rarity].total += 1;
      if (owned.has(card.id)) result[card.rarity].owned += 1;
    }
    return result;
  }, [owned]);

  const complete = ownedCount >= totalCount;

  return (
    <main className="card-collection-page">
      <header className="card-collection-head">
        <h1>📖 卡冊</h1>
        <p className="card-collection-sub">
          已收集 <strong>{ownedCount}</strong> / {totalCount} 張
          {complete ? " · 🏆 卡冊完成，了不起！" : ""}
        </p>

        {/* 進度條（無障礙：以 role=meter 呈現） */}
        <div
          className="card-collection-progress"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-valuenow={ownedCount}
          aria-label="卡牌收集進度"
        >
          <div className="card-collection-progress-fill" style={{ width: `${(ownedCount / totalCount) * 100}%` }} />
        </div>

        <div className="card-collection-meta">
          {(Object.keys(rarityCounts) as Rarity[]).map((rarity) => (
            <span key={rarity} className={`card-collection-chip r-${rarity}`}>
              {RARITY_LABEL[rarity]} {rarityCounts[rarity].owned}/{rarityCounts[rarity].total}
            </span>
          ))}
          <span className="card-collection-chip is-plain">
            對戰 {collection.wins}勝 {collection.losses}敗 {collection.draws}和
          </span>
        </div>
      </header>

      {ownedCount === 0 ? (
        <div className="card-collection-empty">
          <p>卡冊還空著——去酒館吧檯找老闆，先領新手卡、再開幾包！</p>
          <button className="card-collection-cta" onClick={() => setLocation("/tavern")}>前往酒館</button>
        </div>
      ) : (
        THEME_ORDER.map((theme) => {
          const cards = ALL_CARDS.filter((card) => card.theme === theme);
          const themeOwned = cards.filter((card) => owned.has(card.id)).length;
          return (
            <section key={theme} className="card-collection-section">
              <h2>
                {theme}
                <small>{themeOwned} / {cards.length} 張</small>
              </h2>
              <div className="card-collection-grid">
                {cards.map((card) => {
                  const isOwned = owned.has(card.id);
                  return isOwned ? (
                    <article key={card.id} className={`collection-card r-${card.rarity} is-owned`}>
                      <CardArt cardId={card.id} emoji={card.emoji} name={card.name} className="collection-card-art" />
                      <div className="collection-card-body">
                        <div className="collection-card-row">
                          <strong>{card.name}</strong>
                          <span className={`collection-rarity r-${card.rarity}`}>{RARITY_LABEL[card.rarity]}</span>
                        </div>
                        <p className="collection-card-flavor">{card.flavor}</p>
                        <div className="collection-card-stats">
                          {(Object.keys(STAT_LABELS) as CardStat[]).map((stat) => (
                            <span key={stat}>
                              {STAT_LABELS[stat]} <b>{card.stats[stat]}</b>
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ) : (
                    <article key={card.id} className={`collection-card r-${card.rarity} is-locked`} aria-label={`未收集：${card.name}`}>
                      <div className="collection-card-mystery">？</div>
                      <div className="collection-card-body">
                        <div className="collection-card-row">
                          <strong>未收集</strong>
                          <span className={`collection-rarity r-${card.rarity}`}>{RARITY_LABEL[card.rarity]}</span>
                        </div>
                        <p className="collection-card-flavor">{acquisitionHint(card)}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      <p className="card-collection-back">
        <button className="card-collection-link" onClick={() => setLocation("/tavern")}>← 回到酒館</button>
        <button className="card-collection-link" onClick={() => setLocation("/tavern/cards")}>去牌局用用這些卡</button>
      </p>
    </main>
  );
}
