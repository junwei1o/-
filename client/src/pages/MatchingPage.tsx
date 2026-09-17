import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import MatchingGame from "@/components/MatchingGame";
import MatchingRush from "@/components/MatchingRush";
import {
  IMAGE_MATCHING_SETS,
  MATCHING_SETS,
  MATCHING_SUBJECTS,
  type MatchingResult,
  type MatchingRushMode,
  type MatchingRushResult,
} from "@/lib/matchingBank";
import "./MatchingPage.css";

const BEST_KEY = "xue-matching-best-v1";
const RUSH_BEST_KEY = "xue-matching-rush-best-v1";

type BestMap = Record<string, { stars: number; errors: number; timeMs: number }>;
type RushBestMap = Record<string, { score: number; maxCombo: number }>;

function loadBest(): BestMap {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? "{}") as BestMap;
  } catch {
    return {};
  }
}

function saveBest(best: BestMap) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(best));
  } catch {
    /* 隱私模式無法寫入就只保留在記憶體 */
  }
}

function loadRushBest(): RushBestMap {
  try {
    return JSON.parse(localStorage.getItem(RUSH_BEST_KEY) ?? "{}") as RushBestMap;
  } catch {
    return {};
  }
}

function saveRushBest(best: RushBestMap) {
  try {
    localStorage.setItem(RUSH_BEST_KEY, JSON.stringify(best));
  } catch {
    /* 隱私模式無法寫入就只保留在記憶體 */
  }
}

export default function MatchingPage() {
  const [, setLocation] = useLocation();
  const [index, setIndex] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [view, setView] = useState<"play" | "menu">("play");
  const [mode, setMode] = useState<"board" | "image" | MatchingRushMode>("board");
  const [muted, setMuted] = useState(false);
  const [best, setBest] = useState<BestMap>({});
  const [rushBest, setRushBest] = useState<RushBestMap>({});

  useEffect(() => {
    setBest(loadBest());
    setRushBest(loadRushBest());
  }, []);

  const currentSet = MATCHING_SETS[index];

  const grouped = useMemo(
    () => MATCHING_SUBJECTS.map((subject) => ({ subject, sets: MATCHING_SETS.filter((s) => s.subject === subject) })),
    [],
  );

  const rushRecord = (index: number) => rushBest[MATCHING_SETS[index].id];

  function handleRushComplete(result: MatchingRushResult) {
    setRushBest((previous) => {
      const old = previous[result.id];
      if (old && old.score >= result.score) return previous;
      const next = { ...previous, [result.id]: { score: result.score, maxCombo: result.maxCombo } };
      saveRushBest(next);
      return next;
    });
  }

  function handleComplete(result: MatchingResult) {
    setBest((previous) => {
      const old = previous[result.id];
      const better =
        !old ||
        result.stars > old.stars ||
        (result.stars === old.stars && result.errors < old.errors) ||
        (result.stars === old.stars && result.errors === old.errors && result.timeMs < old.timeMs);
      if (!better) return previous;
      const next = {
        ...previous,
        [result.id]: { stars: result.stars, errors: result.errors, timeMs: result.timeMs },
      };
      saveBest(next);
      return next;
    });
  }

  function play(nextIndex: number) {
    setIndex(wrapIndex(nextIndex));
    setNonce((n) => n + 1);
    setView("play");
    window.scrollTo({ top: 0 });
  }

  /** 圖片配對模式只在圖片組內循環；其餘模式維持全題庫循環。 */
  function wrapIndex(nextIndex: number): number {
    if (mode !== "image") {
      return ((nextIndex % MATCHING_SETS.length) + MATCHING_SETS.length) % MATCHING_SETS.length;
    }
    const ids = IMAGE_MATCHING_SETS.map((s) => MATCHING_SETS.findIndex((m) => m.id === s.id));
    if (ids.includes(nextIndex)) return nextIndex; // 選關直跳
    const pos = ids.indexOf(index);
    return ids[(pos + 1) % ids.length]; // 下一關：圖片組內循環
  }

  if (!currentSet) return null;

  return (
    <main className="matching-page">
      <header className="mp-header">
        <div className="mp-header-row">
          <div>
            <h1>配對連連看</h1>
            <p>左右連線，把對應的兩項配在一起（成績只存在這台裝置）</p>
          </div>
          <div className="mp-header-actions">
            <button type="button" className="mp-icon-btn" onClick={() => setMuted((m) => !m)} aria-label="音效開關">
              {muted ? "🔇" : "🔊"}
            </button>
            <button type="button" className="mp-icon-btn" onClick={() => setView(view === "menu" ? "play" : "menu")}>
              {view === "menu" ? "✕" : "☰"}
            </button>
          </div>
        </div>
        <nav className="mp-modes" aria-label="配對玩法">
          {([
            ["board", "連連看"],
            ["image", "圖片配對"],
            ["speed", "單對速配"],
            ["rush", "30 秒搶分"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mp-mode-chip ${mode === value ? "is-active" : ""}`}
              onClick={() => {
                setMode(value);
                if (value === "image" && !IMAGE_MATCHING_SETS.some((s) => s.id === currentSet.id)) {
                  setIndex(MATCHING_SETS.findIndex((s) => s.id === IMAGE_MATCHING_SETS[0].id));
                }
                setNonce((n) => n + 1);
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mp-body">
        {view === "play" ? (
          <>
            {mode === "board" || mode === "image" ? (
              <MatchingGame
                key={`${currentSet.id}-${nonce}`}
                set={currentSet}
                muted={muted}
                onComplete={handleComplete}
                resultActions={
                  <>
                    <button type="button" className="mg-btn mg-btn-ghost" onClick={() => play(index)}>
                      重玩
                    </button>
                    <button type="button" className="mg-btn mg-btn-primary" onClick={() => play(index + 1)}>
                      {index < MATCHING_SETS.length - 1 ? "下一關 →" : "回到第 1 關 ↻"}
                    </button>
                  </>
                }
              />
            ) : (
              <MatchingRush
                key={`${currentSet.id}-${mode}-${nonce}`}
                set={currentSet}
                mode={mode}
                muted={muted}
                onComplete={handleComplete}
                onRushComplete={handleRushComplete}
                resultActions={
                  <>
                    <button type="button" className="mg-btn mg-btn-ghost" onClick={() => play(index)}>
                      重玩
                    </button>
                    <button type="button" className="mg-btn mg-btn-primary" onClick={() => play(index + 1)}>
                      {index < MATCHING_SETS.length - 1 ? "下一關 →" : "回到第 1 關 ↻"}
                    </button>
                  </>
                }
              />
            )}
            <div className="mp-footer">
              <button type="button" className="mp-link-btn" onClick={() => setView("menu")}>
                查看全部 {MATCHING_SETS.length} 關
              </button>
              <button type="button" className="mp-link-btn" onClick={() => setLocation("/practice")}>
                回一般試卷
              </button>
            </div>
          </>
        ) : (
          <section className="mp-menu">
            <h2>選擇關卡</h2>
            {grouped.map((group) => (
              <div key={group.subject} className="mp-subject-group">
                <h3>{group.subject}</h3>
                <div className="mp-level-grid">
                  {group.sets.map((set) => {
                    const globalIndex = MATCHING_SETS.findIndex((s) => s.id === set.id);
                    const record = best[set.id];
                    return (
                      <button
                        type="button"
                        key={set.id}
                        className={`mp-level-card ${globalIndex === index ? "is-active" : ""}`}
                        onClick={() => play(globalIndex)}
                      >
                        <span className="mp-level-subj">
                          {set.grade} · {set.difficulty}
                        </span>
                        <span className="mp-level-title">{set.title}</span>
                        <span className="mp-level-stars">
                          {record ? [1, 2, 3].map((n) => (n <= record.stars ? "★" : "☆")).join("") : "☆☆☆"}
                          {rushRecord(globalIndex) ? ` · 搶分 ${rushRecord(globalIndex).score}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
