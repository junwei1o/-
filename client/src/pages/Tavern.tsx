import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import TavernBar from "@/components/TavernBar";
import { TavernCompanion } from "@/components/TavernCompanion";
import { addCardToCollection, getCardCollection } from "@/game/cardCollection";
import { STARTER_KEY, grantStarterCards, type KeeperContext } from "@/game/tavernKeeper";
import { ALL_CHAPTERS } from "@/game/adventureChapters";
import { bxStore } from "@/game/bxStore";
import { getPlayerData, getLimitedTitles } from "@/utils/storage";
import "./Tavern.css";

/** 章節 id → 完成時授予的限定稱號 id（與 TavernBar 共用） */
const CHAPTER_TITLES: Record<string, string> = {
  "lighthouse-call": "燈塔嚮導",
  "lost-classic": "古籍尋跡者",
};
const CHAPTERS_WITH_TITLE = ALL_CHAPTERS.filter((ch) => CHAPTER_TITLES[ch.id]);

export default function Tavern() {
  const [, setLocation] = useLocation();
  const [barOpen, setBarOpen] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);
  const player = getPlayerData();

  // 首次進入酒館自動贈送新手卡
  useEffect(() => {
    const already = typeof localStorage !== "undefined" && localStorage.getItem(STARTER_KEY);
    if (already) return;
    const picks = grantStarterCards();
    if (!picks) return;
    picks.forEach((id) => addCardToCollection(id));
    setFirstVisit(true);
    toast.success("初次見面，送你幾張卡牌試試手氣！");
  }, []);

  const keeperContext: KeeperContext = useMemo(() => {
    const collection = getCardCollection();
    const ownedTitles = getLimitedTitles();
    const uncompletedChapters = CHAPTERS_WITH_TITLE.filter((ch) => !ownedTitles.includes(CHAPTER_TITLES[ch.id])).length;
    return {
      hour: new Date().getHours(),
      totalAnswers: player.totalAnswers,
      streak: bxStore.get<number>("stats.streak_current", 0) ?? 0,
      ownedCardCount: collection.ownedCardIds.length,
      uncompletedChapters,
    };
  }, [player.totalAnswers]);

  return (
    <main className="tavern-page">
      {/* 招牌＋燈籠＋金幣 */}
      <header className="tavern-signboard">
        <span className="tavern-lantern tavern-lantern--left" aria-hidden="true">🏮</span>
        <h1 className="tavern-title">燈塔酒館</h1>
        <span className="tavern-lantern tavern-lantern--right" aria-hidden="true">🏮</span>
        <span className="tavern-gold" aria-label="金幣">💰 {player.gold}</span>
      </header>

      {/* 窗＋酒瓶木層架（純裝飾） */}
      <div className="tavern-window-row" aria-hidden="true">
        <span className="tavern-window">🌙</span>
        <span className="tavern-shelf">🍶🍷🍺🥃</span>
      </div>

      {/* 場景熱點 */}
      <div className="tavern-hotspots">
        <button className="tavern-hotspot tavern-hotspot--cards" onClick={() => setLocation("/tavern/cards")}>
          <span className="tavern-hotspot-icon" aria-hidden="true">🃏</span>
          <strong>牌桌</strong>
          <small>潮汐牌局</small>
        </button>
        <button className="tavern-hotspot tavern-hotspot--board" onClick={() => setLocation("/tavern/adventure")}>
          <span className="tavern-hotspot-icon" aria-hidden="true">📜</span>
          <strong>佈告欄</strong>
          <small>文字冒險</small>
        </button>
        <a className="tavern-hotspot tavern-hotspot--hearth" href="#companions">
          <span className="tavern-hotspot-icon" aria-hidden="true">🐾</span>
          <strong>壁爐角</strong>
          <small>夥伴小屋</small>
        </a>
        <a className="tavern-hotspot tavern-hotspot--titles" href="/badges" aria-label="稱號牆">
          <span className="tavern-hotspot-icon" aria-hidden="true">🏅</span>
          <strong>稱號牆</strong>
          <small>限定稱號</small>
        </a>
      </div>

      {/* 壁爐＋吧檯老闆 */}
      <div className="tavern-bar-zone">
        <div className="tavern-fireplace" aria-hidden="true">
          <span className="tavern-fire">🔥</span>
        </div>
        <button className="tavern-counter" onClick={() => setBarOpen(true)} aria-label="老闆吧檯">
          <span className="tavern-keeper" aria-hidden="true">🧔</span>
          <span className="tavern-counter-label">老闆吧檯</span>
          <span className="tavern-counter-mug" aria-hidden="true">🍺</span>
        </button>
      </div>

      {/* 老闆對話氣泡（首次贈卡時提示） */}
      {firstVisit && (
        <div className="tavern-keeper-bubble" role="status">
          <span aria-hidden="true">🧔</span> 初次見面，送你幾張卡牌試試手氣！
        </div>
      )}

      {/* 壁爐角夥伴 */}
      <section id="companions" className="tavern-companions">
        <h2>🔥 壁爐角的夥伴</h2>
        <TavernCompanion />
      </section>

      {/* 返回學習區 */}
      <p className="tavern-back-to-study">
        📚 今天學夠了嗎？<button className="tavern-link-button" onClick={() => setLocation("/practice")}>回去答題賺金幣</button>
      </p>

      <TavernBar open={barOpen} onClose={() => setBarOpen(false)} keeperContext={keeperContext} />
    </main>
  );
}
