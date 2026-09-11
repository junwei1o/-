import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ALL_CHAPTERS } from "@/game/adventureChapters";
import { openCardPack } from "@/game/cardCollection";
import { CARD_PACK_GOLD_COST, greetKeeper, type KeeperContext } from "@/game/tavernKeeper";
import { getCardById } from "@/game/trumpCardData";
import { getPlayerData, getLimitedTitles, updatePlayerData } from "@/utils/storage";

/** 章節 id → 完成時授予的限定稱號 id（與 titleCatalog 的 id 一致） */
const CHAPTER_TITLES: Record<string, string> = {
  "lighthouse-call": "燈塔嚮導",
  "lost-classic": "古籍尋跡者",
};

const CHAPTERS_WITH_TITLE = ALL_CHAPTERS.filter((ch) => CHAPTER_TITLES[ch.id]);

type TavernBarProps = {
  open: boolean;
  onClose: () => void;
  /** 注入問候所需的狀態；Tavern 負責組裝 */
  keeperContext: KeeperContext;
};

/**
 * 吧檯面板：頁內彈層。三區——老闆的話、卡包商店、冒險引導。
 * 開包結果以翻面卡片展示，按「收下」關閉。
 */
export default function TavernBar({ open, onClose, keeperContext }: TavernBarProps) {
  const [, setLocation] = useLocation();
  const [packResult, setPackResult] = useState<ReturnType<typeof openCardPack> | null>(null);

  const greeting = useMemo(() => greetKeeper(keeperContext), [keeperContext]);
  const ownedTitles = useMemo(() => getLimitedTitles(), [open, packResult]);

  if (!open) return null;

  function handleBuyPack() {
    const player = getPlayerData();
    if (player.gold < CARD_PACK_GOLD_COST) {
      toast.warning(`金幣不足，還差 ${CARD_PACK_GOLD_COST - player.gold} 枚。`);
      return;
    }
    updatePlayerData({ gold: player.gold - CARD_PACK_GOLD_COST });
    const cards = openCardPack();
    setPackResult(cards);
    toast.success("開包！抽到 3 張卡牌。");
  }

  return (
    <div className="tavern-bar-overlay" role="dialog" aria-label="吧檯老闆" onClick={onClose}>
      <div className="tavern-bar-panel" onClick={(e) => e.stopPropagation()}>
        <button className="tavern-bar-close" onClick={onClose} aria-label="關閉吧檯">✕</button>

        <section className="tavern-bar-section">
          <h3>🧔 老闆的話</h3>
          <p className="tavern-keeper-greeting">{greeting}</p>
        </section>

        <section className="tavern-bar-section">
          <h3>📦 卡包商店</h3>
          <p className="tavern-pack-price">一包 {CARD_PACK_GOLD_COST} 金幣 · 你有 {getPlayerData().gold} 金幣</p>
          {packResult ? (
            <div className="tavern-pack-result">
              {packResult.map((card) => {
                const def = getCardById(card.id);
                return (
                  <div key={card.id} className={`tavern-pack-card rarity-${card.rarity}`}>
                    <span className="tavern-pack-emoji">{card.emoji}</span>
                    <strong>{card.name}</strong>
                    <small>{card.theme}</small>
                    {def && (
                      <span className="tavern-pack-stats">
                        威{def.stats.power} 知{def.stats.wisdom} 速{def.stats.speed} 稀{def.stats.charm}
                      </span>
                    )}
                  </div>
                );
              })}
              <button className="tavern-pack-claim" onClick={() => setPackResult(null)}>收下</button>
            </div>
          ) : (
            <button className="tavern-buy-button" onClick={handleBuyPack}>買一包</button>
          )}
        </section>

        <section className="tavern-bar-section">
          <h3>📜 冒險引導</h3>
          <ul className="tavern-chapter-guide">
            {CHAPTERS_WITH_TITLE.map((ch) => {
              const done = ownedTitles.includes(CHAPTER_TITLES[ch.id]);
              return (
                <li key={ch.id} className={done ? "is-done" : ""}>
                  <span className="tavern-chapter-icon">{ch.icon}</span>
                  <div>
                    <strong>{ch.title}</strong>
                    {done ? <small>已完成 · 獲得「{CHAPTER_TITLES[ch.id]}」稱號</small> : <small>未完成</small>}
                  </div>
                  {!done && (
                    <button className="tavern-chapter-go" onClick={() => setLocation("/tavern/adventure")}>前往</button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
