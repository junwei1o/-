import { Anchor, BookOpenCheck, BookText, Compass, FlaskConical, Landmark, RotateCcw, Ruler, Sparkles, Volume2, type LucideIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createSpeechController, type SpeechStatus } from "@/lib/speechSynthesis";
import { getPaperNextGroupStrategyHint } from "@/lib/paperExam";
import { loadMapRouteFirstUseHint, markMapRouteFirstUseHintSeen } from "@/lib/mapRouteFirstUseHint";
import { hasSavedPreferenceForIsland, loadMapSupplyStrategyPreference, preferenceForIsland, saveMapSupplyStrategyPreference } from "@/lib/mapSupplyStrategyPreference";
import type { KnowledgeIslandId, KnowledgeIslandSnapshot, KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import type { RegionKey } from "@/game/rpgTypes";
import { routeIdForRegion, supplyMarkerIdForRegion } from "@/game/mapVictoryProgress";
import type { MapReinforcementJournalEntry, MapReinforcementReward } from "@/game/mapReinforcementReward";
import { getInventory, tryDropSpecialty, type InventoryItem } from "@/game/inventoryService";
import type { RandomAdventureRouteReward } from "@/game/randomAdventureRouteReward";
import "./TaiwanMainNavigationMap.css";

type TaiwanMainNavigationMapProps = {
  islands: KnowledgeIslandSnapshot[];
  onOpenSubject: (subject: KnowledgeIslandSubject) => void;
  onStartIslandQuiz?: (subject: KnowledgeIslandSubject) => void;
  onOpenTopic: (subject: KnowledgeIslandSubject, topic: string) => void;
  onOpenWrongAnswers?: (subject: KnowledgeIslandSubject) => void;
  unlockedRouteIds?: string[];
  supplyMarkerIds?: string[];
  reinforcementReward?: MapReinforcementReward | null;
  reinforcementJournal?: MapReinforcementJournalEntry[];
  reinforcementSuggestion?: string;
  randomAdventureRouteReward?: RandomAdventureRouteReward | null;
};

type IslandPosition = {
  left: string;
  top: string;
  region: string;
};

type LandscapeIcon = {
  symbol: string;
  label: string;
};

type IslandVisualState = "gold" | "green" | "orange" | "mist";

type LearningRouteSegment = {
  id: KnowledgeIslandId;
  d: string;
};

const ISLAND_REGION_BY_ID: Record<KnowledgeIslandId, RegionKey> = {
  language: "north",
  math: "central",
  social: "south",
  science: "east",
};

const ISLAND_POSITIONS: Record<KnowledgeIslandId, IslandPosition> = {
  language: { left: "47%", top: "17%", region: "北部・古書樓" },
  math: { left: "49%", top: "42%", region: "中部・量測塔" },
  social: { left: "44%", top: "72%", region: "南部・生活港" },
  science: { left: "74%", top: "51%", region: "東部・山海觀察站" },
};

const ISLAND_ROUTE_PATHS: Record<KnowledgeIslandId, string> = {
  language: "M248 365 C316 304 397 165 470 105",
  math: "M248 365 C332 350 421 290 490 260",
  social: "M248 365 C314 404 381 434 440 446",
  science: "M248 365 C394 330 578 316 740 316",
};

const ISLAND_ICONS: Record<KnowledgeIslandId, LucideIcon> = {
  language: BookText,
  math: Ruler,
  social: Landmark,
  science: FlaskConical,
};

const ISLAND_LANDSCAPES: Record<KnowledgeIslandId, { summary: string; icons: LandscapeIcon[] }> = {
  language: {
    summary: "北部文化城的古城、毛筆與詩詞卷軸",
    icons: [
      { symbol: "🏯", label: "古城牆" },
      { symbol: "🖌️", label: "毛筆" },
      { symbol: "📜", label: "詩詞卷軸" },
    ],
  },
  math: {
    summary: "中部測量原野的幾何建築、齒輪與量尺",
    icons: [
      { symbol: "▱", label: "幾何建築" },
      { symbol: "⚙️", label: "齒輪" },
      { symbol: "📏", label: "量尺" },
    ],
  },
  social: {
    summary: "南部生活港的帆船、燈塔與世界地圖",
    icons: [
      { symbol: "⛵", label: "帆船" },
      { symbol: "🗼", label: "燈塔" },
      { symbol: "🗺️", label: "世界地圖" },
    ],
  },
  science: {
    summary: "東部山海觀察站的山林、海浪與顯微鏡",
    icons: [
      { symbol: "⛰️", label: "山林" },
      { symbol: "🌊", label: "海浪" },
      { symbol: "🔬", label: "顯微鏡" },
    ],
  },
};

function islandStatus(island: KnowledgeIslandSnapshot) {
  if (island.attemptCount === 0) return "啟航";
  if (island.attemptCount < 4) return "探索中";
  return "穩定航行";
}

/**
 * 色彩只作為學生已留下作答紀錄的背景提示，不以分數、好壞或警示文字呈現。
 * 未啟程資料不套用正確率色階，改以中性灰霧且維持所有入口可操作。
 */
export function islandVisualState(island: KnowledgeIslandSnapshot): IslandVisualState {
  if (island.accuracy === null || island.attemptCount === 0) return "mist";
  if (island.accuracy >= 0.8) return "gold";
  if (island.accuracy >= 0.5) return "green";
  return "orange";
}

/** 航線只反映學生已完成的真實作答足跡；尚未練習的島嶼不預先繪製路徑。 */
export function learningRouteSegments(islands: KnowledgeIslandSnapshot[], unlockedRouteIds: string[] = []): LearningRouteSegment[] {
  return islands
    .filter((island) => island.attemptCount > 0 || unlockedRouteIds.includes(routeIdForRegion(ISLAND_REGION_BY_ID[island.id])))
    .map((island) => ({ id: island.id, d: ISLAND_ROUTE_PATHS[island.id] }));
}

function islandSpeechText(island: KnowledgeIslandSnapshot) {
  const observedKnowledge = island.observedKnowledge.length
    ? `你已留下的知識線索有：${island.observedKnowledge.join("、")}。`
    : "還沒有知識線索也沒關係，可以從第一份練習開始。";
  const recentTopics = island.recentReviewTopics.length
    ? `近期可複習的知識點有：${island.recentReviewTopics.join("、")}。`
    : "目前還沒有近期可複習的知識點。";
  const review = island.dueReviewCount
    ? "這裡有可依自己的步調回顧的線索。"
    : "現在可以選擇一小段練習繼續探索。";

  const landscape = ISLAND_LANDSCAPES[island.id];

  return `${island.title}。${island.description}。目前的旅程狀態是${islandStatus(island)}。台灣地景意象是${landscape.summary}。${observedKnowledge}${recentTopics}${review}`;
}

export function mapReinforcementJournalReadout(entries: MapReinforcementJournalEntry[]) {
  if (!entries.length) return "本週補強小航誌目前還沒有完成紀錄。每完成一題補強，這裡會留下真實主題。";
  return `本週補強小航誌共有${entries.length}筆真實完成紀錄：${entries.map((entry) => `${entry.subject}的${entry.knowledge}`).join("、")}。`;
}

function formatMapReinforcementJournalTime(timestamp: number) {
  return new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
}

export function TaiwanMainNavigationMap({ islands, onOpenSubject, onStartIslandQuiz, onOpenTopic, onOpenWrongAnswers, unlockedRouteIds = [], supplyMarkerIds = [], reinforcementReward = null, reinforcementJournal = [], reinforcementSuggestion = "", randomAdventureRouteReward = null }: TaiwanMainNavigationMapProps) {
  const [activeIslandId, setActiveIslandId] = useState<KnowledgeIslandId | null>(null);
  const [showStrategyPanel, setShowStrategyPanel] = useState(false);
  const [showRestoredPreferenceNotice, setShowRestoredPreferenceNotice] = useState(false);
  const [recentlyCompletedSupplyMarkerIds, setRecentlyCompletedSupplyMarkerIds] = useState<string[]>([]);
  const [showRouteHint, setShowRouteHint] = useState(false);
  const [showReinforcementReward, setShowReinforcementReward] = useState(Boolean(reinforcementReward));
  const [showRandomAdventureRouteReward, setShowRandomAdventureRouteReward] = useState(Boolean(randomAdventureRouteReward));
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => getInventory());
  const [showBackpack, setShowBackpack] = useState(false);
  const [showTyphoonStory, setShowTyphoonStory] = useState(false);
  const [recentlyUnlockedIslandIds, setRecentlyUnlockedIslandIds] = useState<KnowledgeIslandId[]>([]);
  const speech = useMemo(() => createSpeechController(), []);
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>(speech.isSupported ? "idle" : "unsupported");
  const triggerRefs = useRef<Partial<Record<KnowledgeIslandId, HTMLButtonElement | null>>>({});
  const strategyTriggerRefs = useRef<Partial<Record<KnowledgeIslandId, HTMLButtonElement | null>>>({});
  const strategyPanelRef = useRef<HTMLElement | null>(null);
  const activeIsland = islands.find((island) => island.id === activeIslandId) ?? null;
  const activeIslandHasSupply = activeIsland
    ? supplyMarkerIds.includes(supplyMarkerIdForRegion(ISLAND_REGION_BY_ID[activeIsland.id]))
    : false;
  const activeIslandStrategy = activeIsland ? getPaperNextGroupStrategyHint(activeIsland.subject) : null;
  const unlockedSupplyCount = supplyMarkerIds.filter((id) => id.startsWith("supply-")).length;
  const randomAdventureRewardIslandId = randomAdventureRouteReward
    ? islands.find((island) => island.subject === randomAdventureRouteReward.subject)?.id ?? null
    : null;
  const routeSegments = learningRouteSegments(
    islands,
    randomAdventureRewardIslandId
      ? [...unlockedRouteIds, routeIdForRegion(ISLAND_REGION_BY_ID[randomAdventureRewardIslandId])]
      : unlockedRouteIds,
  );
  const supplyMarkerSignature = supplyMarkerIds.join("|");
  const previousSupplyMarkerIdsRef = useRef<string[]>(supplyMarkerIds);
  const previousUnlockedIslandIdsRef = useRef<KnowledgeIslandId[]>(islands.filter((island) => island.unlocked).map((island) => island.id));
  const reinforcementRewardIslandId = reinforcementReward ? islands.find((island) => island.subject === reinforcementReward.subject)?.id ?? null : null;
  const reinforcementJournalReadout = mapReinforcementJournalReadout(reinforcementJournal);

  useEffect(() => {
    const previousIds = previousUnlockedIslandIdsRef.current;
    const currentIds = islands.filter((island) => island.unlocked).map((island) => island.id);
    const newlyUnlocked = currentIds.filter((id) => !previousIds.includes(id));
    previousUnlockedIslandIdsRef.current = currentIds;
    if (!newlyUnlocked.length) return;
    setRecentlyUnlockedIslandIds(newlyUnlocked);
    const timeoutId = window.setTimeout(() => setRecentlyUnlockedIslandIds([]), 800);
    return () => window.clearTimeout(timeoutId);
  }, [islands]);

  useEffect(() => {
    const previousIds = previousSupplyMarkerIdsRef.current;
    const newlyCompletedIds = supplyMarkerIds.filter((id) => !previousIds.includes(id));
    previousSupplyMarkerIdsRef.current = [...supplyMarkerIds];

    if (!newlyCompletedIds.length) return;

    setRecentlyCompletedSupplyMarkerIds(newlyCompletedIds);
    const completionTimeoutId = window.setTimeout(() => setRecentlyCompletedSupplyMarkerIds([]), 1400);
    const shouldShowRouteHint = !loadMapRouteFirstUseHint().seen;
    const hintTimeoutId = shouldShowRouteHint
      ? window.setTimeout(() => setShowRouteHint(false), 1400)
      : null;

    if (shouldShowRouteHint) {
      setShowRouteHint(true);
      markMapRouteFirstUseHintSeen();
    }

    return () => {
      window.clearTimeout(completionTimeoutId);
      if (hintTimeoutId !== null) window.clearTimeout(hintTimeoutId);
    };
  }, [supplyMarkerSignature]);

  useEffect(() => () => speech.stop(), [speech]);

  useEffect(() => {
    if (!activeIslandId || !showStrategyPanel) return;
    const frameId = window.requestAnimationFrame(() => strategyTriggerRefs.current[activeIslandId]?.focus());
    return () => window.cancelAnimationFrame(frameId);
  }, [activeIslandId, showStrategyPanel]);

  useEffect(() => {
    if (!showRestoredPreferenceNotice) return;
    const timeoutId = window.setTimeout(() => setShowRestoredPreferenceNotice(false), 1400);
    return () => window.clearTimeout(timeoutId);
  }, [showRestoredPreferenceNotice]);

  useEffect(() => {
    setShowReinforcementReward(Boolean(reinforcementReward));
  }, [reinforcementReward?.completedAt]);

  useEffect(() => {
    setShowRandomAdventureRouteReward(Boolean(randomAdventureRouteReward));
  }, [randomAdventureRouteReward?.completedAt]);

  useEffect(() => {
    if (!showReinforcementReward) return;
    const timeoutId = window.setTimeout(() => setShowReinforcementReward(false), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [showReinforcementReward]);

  useEffect(() => {
    if (!showRandomAdventureRouteReward) return;
    const timeoutId = window.setTimeout(() => setShowRandomAdventureRouteReward(false), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [showRandomAdventureRouteReward]);

  useEffect(() => {
    if (!showTyphoonStory) return;
    const timeoutId = window.setTimeout(() => setShowTyphoonStory(false), 5200);
    return () => window.clearTimeout(timeoutId);
  }, [showTyphoonStory]);

  function closeReinforcementReward() {
    setShowReinforcementReward(false);
  }

  function openTyphoonStory() {
    const specialty = tryDropSpecialty({ source: "map-easter-egg", awardId: "taipei-typhoon-story-v1" });
    if (specialty) setInventoryItems(getInventory());
    setShowTyphoonStory(true);
  }

  function closeStrategyPanel(restoreFocus = true) {
    const focusTarget = activeIslandId ? strategyTriggerRefs.current[activeIslandId] : null;
    speech.stop();
    setSpeechStatus(speech.isSupported ? "idle" : "unsupported");
    if (activeIslandId) saveMapSupplyStrategyPreference(activeIslandId, false);
    setShowStrategyPanel(false);
    setShowRestoredPreferenceNotice(false);
    if (restoreFocus && focusTarget) {
      requestAnimationFrame(() => focusTarget.focus());
    }
  }

  useEffect(() => {
    if (!activeIslandId || !showStrategyPanel) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const trigger = strategyTriggerRefs.current[activeIslandId];
      if (strategyPanelRef.current?.contains(target) || trigger?.contains(target)) return;
      closeStrategyPanel(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activeIslandId, showStrategyPanel]);

  function openSupplyStrategyFromRoute(id: KnowledgeIslandId) {
    speech.stop();
    setSpeechStatus(speech.isSupported ? "idle" : "unsupported");
    setShowRouteHint(false);
    setShowRestoredPreferenceNotice(false);
    saveMapSupplyStrategyPreference(id, true);
    setActiveIslandId(id);
    setShowStrategyPanel(true);
  }

  function toggleStrategyPanel() {
    const nextExpanded = !showStrategyPanel;
    if (activeIslandId) saveMapSupplyStrategyPreference(activeIslandId, nextExpanded);
    setShowStrategyPanel(nextExpanded);
  }

  function closePanel(restoreFocus = true) {
    const focusTarget = activeIslandId ? triggerRefs.current[activeIslandId] : null;
    speech.stop();
    setSpeechStatus(speech.isSupported ? "idle" : "unsupported");
    if (showStrategyPanel && activeIslandId) saveMapSupplyStrategyPreference(activeIslandId, false);
    setShowStrategyPanel(false);
    setShowRestoredPreferenceNotice(false);
    setActiveIslandId(null);

    if (restoreFocus && focusTarget) {
      requestAnimationFrame(() => focusTarget.focus());
    }
  }

  function toggleIsland(id: KnowledgeIslandId) {
    if (activeIslandId === id) {
      closePanel(false);
      return;
    }
    speech.stop();
    setSpeechStatus(speech.isSupported ? "idle" : "unsupported");
    const preference = loadMapSupplyStrategyPreference();
    const hasSupply = supplyMarkerIds.includes(supplyMarkerIdForRegion(ISLAND_REGION_BY_ID[id]));
    const shouldRestoreStrategy = hasSupply && preferenceForIsland(preference, id);
    setShowStrategyPanel(shouldRestoreStrategy);
    setShowRestoredPreferenceNotice(hasSupply && hasSavedPreferenceForIsland(preference, id));
    setActiveIslandId(id);
  }

  return (
    <section
      className="taiwan-navigation-map"
      aria-labelledby="taiwan-navigation-map-title"
      data-testid="taiwan-navigation-map"
      onKeyDown={(event) => {
        if (event.key === "Escape" && showRandomAdventureRouteReward) {
          event.preventDefault();
          setShowRandomAdventureRouteReward(false);
        } else if (event.key === "Escape" && showReinforcementReward) {
          event.preventDefault();
          closeReinforcementReward();
        } else if (event.key === "Escape" && showTyphoonStory) {
          event.preventDefault();
          setShowTyphoonStory(false);
        } else if (event.key === "Escape" && showBackpack) {
          event.preventDefault();
          setShowBackpack(false);
        } else if (event.key === "Escape" && activeIsland) {
          event.preventDefault();
          closePanel();
        }
      }}
    >
      <header className="taiwan-navigation-map-heading">
        <div>
          <p className="eyebrow">TAIWAN LEARNING ROUTE</p>
          <h2 id="taiwan-navigation-map-title">台灣主航海圖</h2>
          <p>選一座島看見可探索的方向，再決定這次想練習哪一個主題。</p>
        </div>
        <div className="taiwan-navigation-map-key-group">
          <p className="taiwan-navigation-map-key"><Sparkles size={16} aria-hidden="true" /> 光亮表示已留下真實學習線索</p>
          {unlockedSupplyCount > 0 ? <p className="taiwan-navigation-map-supply-summary" role="status">已發現 {unlockedSupplyCount} 個真實學習補給標記</p> : null}
          {showRouteHint ? (
            <p className="taiwan-map-route-hint" role="status" data-testid="taiwan-map-route-hint">
              <Compass size={15} aria-hidden="true" className="taiwan-map-route-hint-compass" data-testid="taiwan-map-route-hint-compass" /> 微光航線可以點一下，查看補給策略
            </p>
          ) : null}
          {showReinforcementReward && reinforcementReward ? (
            <aside className="taiwan-map-reinforcement-reward" role="status" aria-live="polite" data-testid="taiwan-map-reinforcement-reward">
              <Sparkles size={18} aria-hidden="true" />
              <div>
                <strong>已完成一題</strong>
                <p>{reinforcementReward.subject}的「{reinforcementReward.knowledge}」補強已留在航海圖。</p>
              </div>
              <div className="taiwan-map-reinforcement-reward-actions">
                <button type="button" onClick={() => speech.speak(`已完成一題。${reinforcementReward.subject}的${reinforcementReward.knowledge}補強已留在航海圖。`, setSpeechStatus)} disabled={!speech.isSupported} aria-label="朗讀一題補強獎勵"><Volume2 size={15} aria-hidden="true" /> 朗讀</button>
                <button type="button" onClick={closeReinforcementReward} aria-label="關閉一題補強獎勵">關閉</button>
              </div>
            </aside>
          ) : null}
          {showRandomAdventureRouteReward && randomAdventureRouteReward ? (
            <aside className="taiwan-map-random-route-reward" role="status" aria-live="polite" data-testid="taiwan-map-random-route-reward">
              <Sparkles size={18} aria-hidden="true" />
              <div><strong>隨機冒險完成</strong><p>{randomAdventureRouteReward.subject}航線已為這次真實答對點亮。</p></div>
              <button type="button" onClick={() => setShowRandomAdventureRouteReward(false)} aria-label="關閉隨機冒險航線點亮提示">關閉</button>
            </aside>
          ) : null}
          <section className="taiwan-map-reinforcement-journal" aria-labelledby="taiwan-map-reinforcement-journal-title" data-testid="taiwan-map-reinforcement-journal">
            <div className="taiwan-map-reinforcement-journal-heading">
              <div>
                <p className="eyebrow">WEEKLY REINFORCEMENT LOG</p>
                <h3 id="taiwan-map-reinforcement-journal-title">本週補強小航誌</h3>
              </div>
              <button type="button" onClick={() => speech.speak(reinforcementJournalReadout, setSpeechStatus)} disabled={!speech.isSupported} aria-label="朗讀本週補強小航誌"><Volume2 size={16} aria-hidden="true" /> 朗讀</button>
            </div>
            {reinforcementJournal.length ? (
              <ul aria-label="本週真實完成的補強主題">
                {reinforcementJournal.map((entry) => <li key={`${entry.questionId}-${entry.completedAt}`}><span className="taiwan-map-reinforcement-journal-subject">{entry.subject}</span><span><strong>{entry.knowledge}</strong><small>{formatMapReinforcementJournalTime(entry.completedAt)} 完成</small></span></li>)}
              </ul>
              ) : <p className="taiwan-map-reinforcement-journal-empty">本週尚未留下補強紀錄；完成一題後，主題會在這裡成為新的航行足跡。</p>}
            {reinforcementSuggestion ? <p className="taiwan-map-reinforcement-suggestion" role="status" data-testid="taiwan-map-reinforcement-suggestion">{reinforcementSuggestion}</p> : null}
          </section>
        </div>
      </header>

      <div className="taiwan-map-canvas" aria-label="台灣學習航海圖">
        <div className="taiwan-map-extras" aria-label="探險小工具">
          <button
            type="button"
            className="taiwan-map-backpack-trigger"
            aria-expanded={showBackpack}
            aria-controls="taiwan-map-backpack-panel"
            onClick={() => setShowBackpack((open) => !open)}
            data-testid="taiwan-map-backpack-trigger"
          >
            <span aria-hidden="true">🎒</span> 特產背包 <small>{inventoryItems.length}</small>
          </button>
          {showBackpack ? (
            <aside id="taiwan-map-backpack-panel" className="taiwan-map-backpack-panel" aria-label="特產背包" data-testid="taiwan-map-backpack-panel">
              <div>
                <p className="eyebrow">TAIWAN SPECIALTIES</p>
                <h3>特產背包</h3>
              </div>
              <button type="button" onClick={() => setShowBackpack(false)} aria-label="關閉特產背包">關閉</button>
              {inventoryItems.length ? (
                <ul aria-label="已收集的台灣特產">
                  {inventoryItems.map((item) => <li key={item.id}><span aria-hidden="true">{item.emoji}</span><span>{item.name}</span></li>)}
                </ul>
              ) : <p>完成真實學習里程碑或發現地圖故事後，台灣特產會收進這裡。</p>}
            </aside>
          ) : null}
        </div>
        <button type="button" className="taiwan-map-easter-egg-trigger" onClick={openTyphoonStory} aria-describedby="taiwan-map-easter-egg-description" data-testid="taiwan-map-easter-egg-trigger">
          <span aria-hidden="true">🌬️</span><span>海風傳聞</span>
        </button>
        <span id="taiwan-map-easter-egg-description" className="sr-only">發現一段台灣天氣故事，不會中斷目前探索。</span>
        {showTyphoonStory ? (
          <aside className="taiwan-map-easter-egg-panel" role="status" aria-live="polite" data-testid="taiwan-map-easter-egg-panel">
            <div>
              <p className="eyebrow">MAP STORY</p>
              <h3>颱風的海上來信</h3>
              <p>一陣暖濕海風提醒航海家：觀察雲層、整理補給，再依自己的步調前進。這是一段純故事發現，不會改變你的答題進度。</p>
            </div>
            <button type="button" onClick={() => setShowTyphoonStory(false)} aria-label="關閉颱風故事">關閉</button>
          </aside>
        ) : null}
        <svg className="taiwan-map-outline" viewBox="0 0 1000 620" aria-hidden="true" focusable="false">
          <path
            className="taiwan-map-land"
            d="M551 56 C596 89 610 135 599 171 C588 207 607 244 594 278 C579 313 590 347 566 381 C545 411 548 447 523 483 C498 519 460 544 433 527 C407 511 419 471 404 438 C388 405 402 366 387 332 C373 299 394 267 391 232 C389 198 414 171 424 138 C435 105 493 68 551 56 Z"
          />
          {routeSegments.map((segment, index) => {
            const routeSupplyId = supplyMarkerIdForRegion(ISLAND_REGION_BY_ID[segment.id]);
            const isRouteGlowing = recentlyCompletedSupplyMarkerIds.includes(routeSupplyId);
            const isRandomAdventureRouteLit = showRandomAdventureRouteReward && randomAdventureRewardIslandId === segment.id;

            return (
              <path
                key={segment.id}
                className={`taiwan-map-route taiwan-map-route-animated island-route-${segment.id}${isRouteGlowing ? " is-route-glowing is-route-interactive" : ""}${isRandomAdventureRouteLit ? " is-route-random-adventure-lit" : ""}`}
                d={segment.d}
                pathLength="1"
                style={{ "--route-delay": `${index * 120}ms` } as CSSProperties}
                data-testid={`taiwan-map-route-${segment.id}`}
                data-route-glowing={isRouteGlowing ? "true" : "false"}
                data-route-interactive={isRouteGlowing ? "true" : "false"}
                data-route-random-adventure-lit={isRandomAdventureRouteLit ? "true" : "false"}
                role={isRouteGlowing ? "button" : undefined}
                tabIndex={isRouteGlowing ? 0 : -1}
                aria-label={isRouteGlowing ? `開啟${islands.find((island) => island.id === segment.id)?.shortTitle ?? "補給島"}的補給策略` : undefined}
                onClick={isRouteGlowing ? () => openSupplyStrategyFromRoute(segment.id) : undefined}
                onKeyDown={isRouteGlowing ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openSupplyStrategyFromRoute(segment.id);
                  }
                } : undefined}
              />
            );
          })}
          <circle className="taiwan-map-boat-ring" cx="248" cy="365" r="14" />
          <text className="taiwan-map-boat-mark" x="248" y="371" textAnchor="middle">我</text>
        </svg>

        <p className="taiwan-map-boat-label"><Anchor size={15} aria-hidden="true" /> 我的船標</p>

        {islands.map((island) => {
          const region = ISLAND_REGION_BY_ID[island.id];
          const hasSupplyMarker = supplyMarkerIds.includes(supplyMarkerIdForRegion(region));
          const position = ISLAND_POSITIONS[island.id];
          const Icon = ISLAND_ICONS[island.id];
          const landscape = ISLAND_LANDSCAPES[island.id];
          const isActive = island.id === activeIslandId;
          const visualState = islandVisualState(island);
          const style = {
            "--island-left": position.left,
            "--island-top": position.top,
          } as CSSProperties;

          return (
            <button
              key={island.id}
              ref={(node) => { triggerRefs.current[island.id] = node; }}
              type="button"
              className={`taiwan-map-island island-${island.id} island-visual-${visualState}${island.unlocked ? " is-unlocked" : ""}${recentlyUnlockedIslandIds.includes(island.id) ? " is-island-unlocking" : ""}${isActive ? " is-selected" : ""}${showReinforcementReward && reinforcementRewardIslandId === island.id ? " is-reinforcement-rewarded" : ""}`}
              style={style}
              aria-pressed={isActive}
              aria-controls={isActive ? `taiwan-island-panel-${island.id}` : undefined}
              aria-label={`${island.shortTitle}，${position.region}，${islandStatus(island)}`}
              data-visual-state={visualState}
              data-testid={`taiwan-map-island-${island.id}`}
              data-reinforcement-rewarded={showReinforcementReward && reinforcementRewardIslandId === island.id ? "true" : "false"}
              data-island-unlocking={recentlyUnlockedIslandIds.includes(island.id) ? "true" : "false"}
              onClick={() => onStartIslandQuiz ? onStartIslandQuiz(island.subject) : toggleIsland(island.id)}
            >
              <span className="taiwan-map-island-icon taiwan-island-icon" aria-hidden="true"><Icon size={17} /></span>
              <span className="taiwan-map-island-region">{position.region}</span>
              <strong>{island.shortTitle}</strong>
              <small>{islandStatus(island)}</small>
              <span className="taiwan-map-island-landscape" aria-hidden="true">{landscape.icons.map((icon) => icon.symbol).join(" ")}</span>
              {island.unlocked ? <span className="taiwan-map-island-flag" aria-hidden="true" /> : null}
              {hasSupplyMarker ? <span
                className={`taiwan-map-supply-marker${recentlyCompletedSupplyMarkerIds.includes(supplyMarkerIdForRegion(region)) ? " is-supply-completing" : ""}`}
                role="img"
                aria-label={`${island.shortTitle}已出現學習補給標記`}
                data-testid={`taiwan-map-supply-marker-${island.id}`}
                data-supply-completing={recentlyCompletedSupplyMarkerIds.includes(supplyMarkerIdForRegion(region)) ? "true" : "false"}
              ><span aria-hidden="true">✦</span><small>補給</small></span> : null}
            </button>
          );
        })}
      </div>

      {activeIsland ? (
        <article
          id={`taiwan-island-panel-${activeIsland.id}`}
          className="taiwan-map-panel taiwan-island-panel"
          aria-labelledby={`taiwan-island-panel-title-${activeIsland.id}`}
        >
          <div className="taiwan-map-panel-copy">
            <p className="eyebrow">{ISLAND_POSITIONS[activeIsland.id].region}</p>
            <h3 id={`taiwan-island-panel-title-${activeIsland.id}`}>{activeIsland.title}</h3>
            {showRestoredPreferenceNotice ? (
              <p className="taiwan-map-restored-preference" role="status" data-testid="taiwan-map-restored-preference">
                已恢復上次閱讀狀態
              </p>
            ) : null}
            <p>{activeIsland.description}</p>
            <section className="taiwan-map-curriculum-focus" aria-labelledby={`taiwan-map-curriculum-title-${activeIsland.id}`}>
              <p id={`taiwan-map-curriculum-title-${activeIsland.id}`}>課綱探索方向</p>
              <strong>{activeIsland.curriculumFocus}</strong>
              <ul aria-label="建議學習方向">
                {activeIsland.learningDirections.map((direction) => <li key={direction}>{direction}</li>)}
              </ul>
            </section>
            <p className={`taiwan-map-panel-status island-visual-${islandVisualState(activeIsland)}`}><Sparkles size={15} aria-hidden="true" /> {islandStatus(activeIsland)}</p>
            <section className="taiwan-map-panel-progress" aria-label="這座島的練習足跡" data-testid={`taiwan-island-progress-${activeIsland.id}`}>
              <span>練習足跡</span>
              <strong>{activeIsland.attemptCount > 0 ? `已累積 ${activeIsland.attemptCount} 次練習` : "下一次練習會從這裡開始"}</strong>
              <small>{activeIsland.dueReviewCount > 0 ? "可回顧的線索已準備好" : "依自己的步調，選一個方向開始探索"}</small>
            </section>

            <section className={`taiwan-map-landscape island-${activeIsland.id}`} aria-labelledby={`taiwan-landscape-title-${activeIsland.id}`}>
              <p id={`taiwan-landscape-title-${activeIsland.id}`}>台灣地景意象</p>
              <ul data-testid={`taiwan-landscape-icons-${activeIsland.id}`} aria-label={`${activeIsland.shortTitle}的台灣地景圖示`}>
                {ISLAND_LANDSCAPES[activeIsland.id].icons.map((icon) => (
                  <li key={icon.label}>
                    <span className="taiwan-island-icon" aria-hidden="true">{icon.symbol}</span>
                    <span>{icon.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            {activeIsland.observedKnowledge.length ? (
              <div className="taiwan-map-panel-observed" aria-label="已留下的知識線索">
                <span>已留下的線索</span>
                <ul>{activeIsland.observedKnowledge.map((knowledge) => <li key={knowledge}>{knowledge}</li>)}</ul>
              </div>
            ) : null}

            {activeIsland.recentReviewTopics.length ? (
              <section className="taiwan-map-panel-topics" aria-label="近期可複習知識點">
                <p>近期可複習的知識點</p>
                <ul>
                  {activeIsland.recentReviewTopics.map((topic) => (
                    <li key={topic}>
                      <button type="button" onClick={() => onOpenTopic(activeIsland.subject, topic)} aria-label={`複習「${topic}」`}>{topic}</button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <p className="taiwan-map-panel-empty">還沒有近期練習紀錄也沒關係，可以從這座島開始留下第一個線索。</p>
            )}
            {activeIsland.dueReviewCount ? <p className="taiwan-map-panel-review">這裡有可依自己的步調回顧的線索。</p> : null}
            <section className="taiwan-map-learning-resources" aria-labelledby={`taiwan-map-resources-title-${activeIsland.id}`}>
              <p id={`taiwan-map-resources-title-${activeIsland.id}`}>延伸學習資源</p>
              <ul>
                {activeIsland.resources.map((resource) => (
                  <li key={resource.url}>
                    <a href={resource.url} target="_blank" rel="noreferrer" aria-label={`${resource.title}，${resource.provider}，開啟外部資源`}>
                      <span>{resource.title}</span><small>{resource.provider} · {resource.kind}</small>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="taiwan-map-panel-actions">
            <button type="button" className="taiwan-map-panel-primary taiwan-island-btn" onClick={() => onOpenSubject(activeIsland.subject)} aria-label={`繼續挑戰 ${activeIsland.shortTitle}`}>
              <BookOpenCheck size={18} aria-hidden="true" />
              繼續挑戰
            </button>
            <button
              type="button"
              className="taiwan-map-panel-wrong taiwan-island-btn"
              onClick={() => {
                if (onOpenWrongAnswers) onOpenWrongAnswers(activeIsland.subject);
                else onOpenSubject(activeIsland.subject);
              }}
              aria-label={`錯題重練 ${activeIsland.shortTitle}`}
            >
              <RotateCcw size={18} aria-hidden="true" />
              錯題重練
            </button>
            {activeIslandHasSupply ? (
              <>
                <button
                  type="button"
                  ref={(node) => { strategyTriggerRefs.current[activeIsland.id] = node; }}
                  className="taiwan-map-panel-strategy taiwan-island-btn"
                  aria-expanded={showStrategyPanel}
                  aria-controls={`taiwan-map-supply-strategy-${activeIsland.id}`}
                  aria-label={`查看${activeIsland.shortTitle}的學習策略`}
                  onClick={toggleStrategyPanel}
                >
                  查看策略
                </button>
                <button
                  type="button"
                  className="taiwan-map-panel-practice taiwan-island-btn"
                  aria-label={`再練一題：開始${activeIsland.shortTitle}的同科練習`}
                  onClick={() => onOpenSubject(activeIsland.subject)}
                >
                  再練一題
                </button>
                {showStrategyPanel ? (
                  <section
                    id={`taiwan-map-supply-strategy-${activeIsland.id}`}
                    className="taiwan-map-supply-strategy"
                    role="region"
                    aria-labelledby={`taiwan-map-supply-strategy-title-${activeIsland.id}`}
                    data-testid="taiwan-map-supply-strategy"
                    ref={strategyPanelRef}
                  >
                    <p id={`taiwan-map-supply-strategy-title-${activeIsland.id}`}>{activeIslandStrategy?.subjectLabel ?? "補給策略"}</p>
                    <strong>{activeIslandStrategy?.tip}</strong>
                    <div className="taiwan-map-supply-strategy-actions">
                      <button
                        type="button"
                        className="taiwan-map-supply-strategy-close"
                        onClick={() => closeStrategyPanel()}
                        aria-label="關閉補給策略摘要"
                      >
                        關閉策略
                      </button>
                      <button
                        type="button"
                        disabled={!speech.isSupported}
                      onClick={() => speech.speak(activeIslandStrategy?.tip ?? "", setSpeechStatus)}
                    >
                        {speechStatus === "speaking" ? "正在朗讀策略" : speechStatus === "unsupported" ? "此裝置暫不支援朗讀" : "朗讀策略"}
                      </button>
                    </div>
                  </section>
                ) : null}
              </>
            ) : null}
            <button
              type="button"
              className="taiwan-map-panel-speech taiwan-island-btn"
              disabled={!speech.isSupported}
              onClick={() => speech.speak(islandSpeechText(activeIsland), setSpeechStatus)}
            >
              {speechStatus === "speaking" ? "正在朗讀航線說明" : speechStatus === "unsupported" ? "此裝置暫不支援朗讀" : "朗讀航線說明"}
            </button>
            <button type="button" className="taiwan-map-panel-close taiwan-island-btn" onClick={() => closePanel()}>回到航海圖</button>
          </div>
        </article>
      ) : (
        <p className="taiwan-map-hint" role="status">四座島都能立即探索；亮起的航線代表你已在這裡留下真實學習線索。</p>
      )}

      <span className="taiwan-map-sr-only" role="status">
        {speechStatus === "speaking" ? "正在朗讀航線說明" : ""}
      </span>
    </section>
  );
}
