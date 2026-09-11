import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import TavernBar from "@/components/TavernBar";
import { DailySignInModal } from "@/components/DailySignInModal";
import { TavernCompanion } from "@/components/TavernCompanion";
import { addCardToCollection, getCardCollection } from "@/game/cardCollection";
import { STARTER_KEY, grantStarterCards, nextTavernGoal, type KeeperContext } from "@/game/tavernKeeper";
import { hasSignedInToday, loadSignInState, rewardOfCycleDay, cycleDayOf } from "@/game/dailySignIn";
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
  const [signInOpen, setSignInOpen] = useState(false);
  const player = getPlayerData();
  // 金幣用 state 維護：吧檯／簽到視窗關閉時重讀，避免消費後顯示過期
  const [gold, setGold] = useState(player.gold);

  // 簽到狀態：面板或簽到視窗開合時重讀（領取後要變「已簽到」）
  const signInState = useMemo(() => loadSignInState(), [barOpen, signInOpen]);
  const signedInToday = useMemo(() => hasSignedInToday(signInState), [signInState]);
  const signInReward = rewardOfCycleDay(cycleDayOf(signInState.streak + (signedInToday ? 0 : 1)));

  useEffect(() => {
    if (!barOpen && !signInOpen) setGold(getPlayerData().gold);
  }, [barOpen, signInOpen]);

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
    // barOpen 作為依賴：每次開吧檯重算問候（買卡包後收藏數會變）
  }, [player.totalAnswers, barOpen]);

  // 下一步目標：讓玩家進酒館就知道該做什麼
  const goal = useMemo(
    () =>
      nextTavernGoal({
        gold,
        signedInToday,
        signInReward,
        uncompletedChapters: keeperContext.uncompletedChapters,
      }),
    [gold, signedInToday, signInReward, keeperContext.uncompletedChapters],
  );

  return (
    <main className="tavern-page">
      {/* 招牌＋燈籠＋金幣 */}
      <header className="tavern-signboard">
        <span className="tavern-lantern tavern-lantern--left" aria-hidden="true">🏮</span>
        <h1 className="tavern-title">燈塔酒館</h1>
        <span className="tavern-lantern tavern-lantern--right" aria-hidden="true">🏮</span>
        <span className="tavern-gold" aria-label="金幣">💰 {gold}</span>
      </header>

      {/* 下一步目標提示 */}
      <p className="tavern-next-goal" role="status">{goal.text}</p>

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
        <Link className="tavern-hotspot tavern-hotspot--titles" href="/badges" aria-label="稱號牆">
          <span className="tavern-hotspot-icon" aria-hidden="true">🏅</span>
          <strong>稱號牆</strong>
          <small>限定稱號</small>
        </Link>
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

      <TavernBar
        open={barOpen}
        onClose={() => setBarOpen(false)}
        keeperContext={keeperContext}
        signedInToday={signedInToday}
        signInStreak={signInState.streak}
        signInReward={signInReward}
        onOpenSignIn={() => {
          setBarOpen(false);
          setSignInOpen(true);
        }}
      />

      <DailySignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </main>
  );
}
