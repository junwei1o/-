import React, { useCallback, useEffect, useRef, useState } from "react";
import { useClassroomSound } from "./useClassroomSound";
import {
  buildDuoRounds,
  duoStars,
  RECT_GRID_COLS,
  RECT_GRID_ROWS,
  RECT_TIME_PER_LEVEL,
  type DuoRound,
  type RectPair,
} from "@/lib/classroomBank";
import "./classroom.css";

type Props = {
  muted?: boolean;
  onExit: () => void;
  onBest?: (record: { stars: number; correct: number; total: number }) => void;
  bestStars?: number;
};

/** stage：start 開始畫面 → factor 找因數 → bridge 因數成對揭曉 → rect 拼長方形 → result 結果 */
type Stage = "start" | "factor" | "bridge" | "rect" | "result";

type Cell = { r: number; c: number };
type RectSel = { r1: number; c1: number; r2: number; c2: number };
type Flash = { text: string; kind: "ok" | "no" | "info" } | null;

const ROUND_COUNT = 4;
const FACTOR_TIME_PER_ROUND = 30;
const RECT_BRICK_COLORS = ["#3e7cb1", "#e8843a", "#5b8a4b", "#8a6bb5", "#c8553d", "#2f7d8f"];

function cellKey(r: number, c: number): string {
  return `${r}-${c}`;
}

function normalize(a: Cell, b: Cell): RectSel {
  return { r1: Math.min(a.r, b.r), c1: Math.min(a.c, b.c), r2: Math.max(a.r, b.r), c2: Math.max(a.c, b.c) };
}

function rectArea(sel: RectSel): number {
  return (sel.r2 - sel.r1 + 1) * (sel.c2 - sel.c1 + 1);
}

function selToPair(sel: RectSel): RectPair {
  const rows = sel.r2 - sel.r1 + 1;
  const cols = sel.c2 - sel.c1 + 1;
  return rows <= cols ? [rows, cols] : [cols, rows];
}

function pairCells([rows, cols]: RectPair): Set<string> {
  const keys = new Set<string>();
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) keys.add(cellKey(r, c));
  }
  return keys;
}

/**
 * 因數雙重奏（任天堂式接續玩法：因數探險 ＋ 長方形拼拼樂）：
 * 同一個目標數，先從數字泡泡點出全部因數，看完「因數兩兩成對」後，
 * 馬上用同一個數在格線上拼長方形——拼磚排法就是剛剛的因數對，兩段玩法互相印證。
 */
export default function FactorDuoGame({ muted = false, onExit, onBest, bestStars }: Props) {
  const [rounds, setRounds] = useState<DuoRound[]>(() => buildDuoRounds(ROUND_COUNT));
  const [stage, setStage] = useState<Stage>("start");
  const [roundIndex, setRoundIndex] = useState(0);
  // 第一段：找因數
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [factorChecked, setFactorChecked] = useState(false);
  const [factorTimedOut, setFactorTimedOut] = useState(false);
  // 第二段：拼長方形
  const [found, setFound] = useState<RectPair[]>([]);
  const [preview, setPreview] = useState<RectSel | null>(null);
  const [anchored, setAnchored] = useState<Cell | null>(null);
  const [rectTimedOut, setRectTimedOut] = useState(false);
  const [rectDone, setRectDone] = useState(false);
  // 共用
  const [timeLeft, setTimeLeft] = useState(FACTOR_TIME_PER_ROUND);
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<Flash>(null);
  const [shake, setShake] = useState(false);
  const [cleared, setCleared] = useState(0);
  const [newBest, setNewBest] = useState(false);

  const play = useClassroomSound(muted);
  const roundsRef = useRef(rounds);
  const roundIndexRef = useRef(0);
  const stageRef = useRef<Stage>("start");
  const pickedRef = useRef<Set<number>>(new Set());
  const factorCheckedRef = useRef(false);
  const foundRef = useRef<RectPair[]>([]);
  const rectDoneRef = useRef(false);
  const mistakesRef = useRef(0);
  const clearedRef = useRef(0);
  const reportedRef = useRef(false);
  const lastTickRef = useRef(-1);
  const draggingRef = useRef(false);
  const dragAnchorRef = useRef<Cell | null>(null);
  const anchoredRef = useRef<Cell | null>(null);
  const pointerHandledRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);

  useEffect(() => {
    roundsRef.current = rounds;
  }, [rounds]);

  const showFlash = useCallback((text: string, kind: "ok" | "no" | "info") => {
    setFlash({ text, kind });
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 1200);
  }, []);

  const resetRound = useCallback((index: number) => {
    roundIndexRef.current = index;
    setRoundIndex(index);
    pickedRef.current = new Set();
    setPicked(new Set());
    factorCheckedRef.current = false;
    setFactorChecked(false);
    setFactorTimedOut(false);
    foundRef.current = [];
    setFound([]);
    setPreview(null);
    anchoredRef.current = null;
    setAnchored(null);
    draggingRef.current = false;
    dragAnchorRef.current = null;
    rectDoneRef.current = false;
    setRectDone(false);
    setRectTimedOut(false);
    setFlash(null);
    setTimeLeft(FACTOR_TIME_PER_ROUND);
    lastTickRef.current = -1;
  }, []);

  const begin = useCallback(() => {
    const fresh = buildDuoRounds(ROUND_COUNT);
    roundsRef.current = fresh;
    setRounds(fresh);
    mistakesRef.current = 0;
    setMistakes(0);
    clearedRef.current = 0;
    setCleared(0);
    reportedRef.current = false;
    setNewBest(false);
    stageRef.current = "factor";
    setStage("factor");
    resetRound(0);
    window.scrollTo({ top: 0 });
  }, [resetRound]);

  const finish = useCallback(() => {
    const stars = duoStars(mistakesRef.current);
    stageRef.current = "result";
    setStage("result");
    play("win");
    if (!reportedRef.current && stars > (bestStars ?? 0)) {
      reportedRef.current = true;
      setNewBest(true);
      onBest?.({ stars, correct: clearedRef.current, total: roundsRef.current.length });
    }
    window.scrollTo({ top: 0 });
  }, [bestStars, onBest, play]);

  // ---- 第一段：找因數 ----
  const toggle = (value: number) => {
    if (factorCheckedRef.current || stageRef.current !== "factor") return;
    play("flip");
    setPicked((previous) => {
      const next = new Set(previous);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      pickedRef.current = next;
      return next;
    });
  };

  const confirmFactors = useCallback(
    (isTimeout = false) => {
      if (factorCheckedRef.current || stageRef.current !== "factor") return;
      const round = roundsRef.current[roundIndexRef.current];
      if (!round) return;
      const selected = pickedRef.current;
      const missed = round.factor.factors.filter((factor) => !selected.has(factor));
      const wrong = Array.from(selected).filter((value) => !round.factor.factors.includes(value));
      const errorCount = missed.length + wrong.length;
      factorCheckedRef.current = true;
      setFactorChecked(true);
      setFactorTimedOut(isTimeout);
      mistakesRef.current += errorCount;
      setMistakes(mistakesRef.current);
      if (errorCount === 0) play("ok");
      else play("no");
      stageRef.current = "bridge";
      setStage("bridge");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [play],
  );

  const startRectStage = () => {
    stageRef.current = "rect";
    setStage("rect");
    setPreview(null);
    anchoredRef.current = null;
    setAnchored(null);
    setTimeLeft(RECT_TIME_PER_LEVEL);
    lastTickRef.current = -1;
    window.scrollTo({ top: 0 });
  };

  // ---- 第二段：拼長方形 ----
  const commit = useCallback(
    (a: Cell, b: Cell) => {
      if (rectDoneRef.current || stageRef.current !== "rect") return;
      const round = roundsRef.current[roundIndexRef.current];
      if (!round) return;
      const sel = normalize(a, b);
      setPreview(null);
      anchoredRef.current = null;
      setAnchored(null);
      if (rectArea(sel) !== round.n) {
        mistakesRef.current += 1;
        setMistakes(mistakesRef.current);
        play("no");
        showFlash(`這塊面積是 ${rectArea(sel)}，不是 ${round.n}，再算算看！`, "no");
        setShake(true);
        window.setTimeout(() => setShake(false), 450);
        return;
      }
      const pair = selToPair(sel);
      if (foundRef.current.some(([x, y]) => x === pair[0] && y === pair[1])) {
        showFlash(`${pair[0]} × ${pair[1]} 已經拼過了，換個排法吧`, "info");
        return;
      }
      foundRef.current = [...foundRef.current, pair];
      setFound([...foundRef.current]);
      play("ok");
      const left = round.rect.realPairs.length - foundRef.current.length;
      if (left > 0) showFlash(`${pair[0]} × ${pair[1]} 成立！還有 ${left} 種排法`, "ok");
      else {
        rectDoneRef.current = true;
        setRectDone(true);
        clearedRef.current += 1;
        setCleared(clearedRef.current);
        play("win");
      }
    },
    [play, showFlash],
  );

  const advance = () => {
    if (roundIndexRef.current + 1 >= roundsRef.current.length) {
      finish();
      return;
    }
    stageRef.current = "factor";
    setStage("factor");
    resetRound(roundIndexRef.current + 1);
    window.scrollTo({ top: 0 });
  };

  // 倒數：factor / bridge 段用 30 秒（bridge 已揭曉就停錶），rect 段用 60 秒。
  useEffect(() => {
    if (stage !== "factor" && stage !== "rect") return;
    const perRound = stage === "factor" ? FACTOR_TIME_PER_ROUND : RECT_TIME_PER_LEVEL;
    const deadline = Date.now() + perRound * 1000;
    lastTickRef.current = -1;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 5 && left > 0 && left !== lastTickRef.current) {
        lastTickRef.current = left;
        play("tick");
      }
      if (left <= 0) {
        window.clearInterval(timer);
        if (stage === "factor") confirmFactors(true);
        else if (!rectDoneRef.current) {
          rectDoneRef.current = true;
          setRectDone(true);
          setRectTimedOut(true);
          play("no");
          window.scrollTo({ top: 0 });
        }
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [stage, roundIndex, confirmFactors, play]);

  // ---- 格線互動（與 RectGame 相同的 pointer 拖曳＋點兩下玩法）----
  const cellFromEvent = (e: React.PointerEvent): Cell | null => {
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const el = hit instanceof Element ? hit.closest(".rg-cell") : null;
    if (!el) return null;
    const r = Number(el.getAttribute("data-r"));
    const c = Number(el.getAttribute("data-c"));
    if (!Number.isInteger(r) || !Number.isInteger(c)) return null;
    return { r, c };
  };

  const onGridPointerDown = (e: React.PointerEvent) => {
    if (stageRef.current !== "rect" || rectDoneRef.current) return;
    pointerHandledRef.current = false;
    const cell = cellFromEvent(e);
    if (!cell) return;
    const anchor = anchoredRef.current;
    if (anchor && (anchor.r !== cell.r || anchor.c !== cell.c)) {
      pointerHandledRef.current = true;
      commit(anchor, cell);
      return;
    }
    draggingRef.current = true;
    dragAnchorRef.current = cell;
    setPreview({ r1: cell.r, c1: cell.c, r2: cell.r, c2: cell.c });
  };

  const onGridPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || stageRef.current !== "rect" || rectDoneRef.current) return;
    const cell = cellFromEvent(e);
    const anchor = dragAnchorRef.current;
    if (!cell || !anchor) return;
    setPreview(normalize(anchor, cell));
  };

  const onGridPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const anchor = dragAnchorRef.current;
    dragAnchorRef.current = null;
    if (!anchor || stageRef.current !== "rect" || rectDoneRef.current) return;
    const cell = cellFromEvent(e);
    if (cell && (cell.r !== anchor.r || cell.c !== anchor.c)) {
      pointerHandledRef.current = true;
      commit(anchor, cell);
    }
  };

  const onCellClick = (cell: Cell) => {
    if (pointerHandledRef.current || stageRef.current !== "rect" || rectDoneRef.current) return;
    const anchor = anchoredRef.current;
    if (anchor) {
      if (anchor.r === cell.r && anchor.c === cell.c) {
        anchoredRef.current = null;
        setAnchored(null);
        setPreview(null);
        return;
      }
      commit(anchor, cell);
      return;
    }
    anchoredRef.current = cell;
    setAnchored(cell);
    setPreview({ r1: cell.r, c1: cell.c, r2: cell.r, c2: cell.c });
  };

  if (stage === "start") {
    return (
      <div className="cr-page">
        <div className="cr-top"><button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button></div>
        <div className="cr-start">
          <span className="cr-start-emoji" aria-hidden="true">🎶</span>
          <h2>因數雙重奏</h2>
          <p>
            每關<b>同一個神祕數字</b>要連過兩段：<b>第一段</b>把它的因數從泡泡裡全部點出來，
            看清楚「因數兩兩成對」；<b>第二段</b>馬上用同樣的數在格線上拼長方形——
            拼出來的「長 × 寬」正是剛剛的因數對！
          </p>
          <div className="cr-rules">
            <span className="cr-rule-chip">共 4 關 × 兩段</span>
            <span className="cr-rule-chip">找因數 30 秒</span>
            <span className="cr-rule-chip">拼長方形 60 秒</span>
            <span className="cr-rule-chip">🎵 同一個數，雙重玩法</span>
          </div>
          <button type="button" className="cr-btn" onClick={begin}>開始雙重奏</button>
        </div>
      </div>
    );
  }

  if (stage === "result") {
    const stars = duoStars(mistakes);
    return (
      <div className="cr-page">
        <div className="cr-result" role="status" aria-label="因數雙重奏結果">
          <p className="cr-result-kicker">因數雙重奏完成</p>
          <h2 className="cr-result-title">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</h2>
          <p className="cr-result-sub">
            完整闖過 {cleared} / {rounds.length} 關{mistakes > 0 ? `，共 ${mistakes} 次失誤` : "，全程零失誤！"}
          </p>
          <p className="cr-result-metric">找因數和拼長方形是同一件事：a × b ＝ N</p>
          {newBest && <span className="cr-result-newbest">寫下新紀錄！</span>}
          <div className="cr-actions">
            <button type="button" className="cr-btn-ghost" onClick={onExit}>回我的教室</button>
            <button type="button" className="cr-btn sea" onClick={begin}>再奏一次</button>
          </div>
        </div>
      </div>
    );
  }

  const round = rounds[roundIndex];
  const isLastRound = roundIndex + 1 >= rounds.length;

  if (!round) return null;

  // ---- factor / bridge 段畫面 ----
  if (stage === "factor" || stage === "bridge") {
    const missed = factorChecked ? round.factor.factors.filter((factor) => !picked.has(factor)) : [];
    const wrongPicked = factorChecked ? Array.from(picked).filter((value) => !round.factor.factors.includes(value)) : [];
    return (
      <div className="cr-page">
        <div className="cr-top">
          <button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button>
          <span className="cr-tag sea">因數雙重奏</span>
          <span className="cr-spacer" />
          <span className="cr-stat duo-stage-chip">🎵 第一段 · 找因數</span>
          {stage === "factor" && (
            <span className={`cr-stat cr-countdown${timeLeft <= 5 ? " is-urgent" : ""}`} role="timer">⏱ {timeLeft}s</span>
          )}
        </div>

        <div className="cr-stats">
          <span className="cr-stat">第 <b>{roundIndex + 1}</b> / {rounds.length} 關</span>
          <span className="cr-stat">完美 <b>{cleared}</b> 關</span>
          {mistakes > 0 && <span className="cr-stat">失誤 <b>{mistakes}</b></span>}
        </div>
        <div className="cr-progress"><i style={{ width: `${(roundIndex / rounds.length) * 100}%` }} /></div>

        <div className="cr-q-card" key={round.id}>
          <span className="cr-q-meta">數學 · 五上 · 倍數與因數 · 雙重奏第一段</span>
          <div className="fc-target">
            <span className="fc-target-label">神祕數字</span>
            <span className="fc-n">{round.n}</span>
          </div>
          <p className="cr-q-prompt fc-ask">下面哪些數字是 <b>{round.n}</b> 的因數？把它們全部點起來！</p>

          <div className="fc-bubbles" role="group" aria-label={`${round.n} 的因數候選數字`}>
            {round.factor.choices.map((value) => {
              const isFactor = round.factor.factors.includes(value);
              const isPicked = picked.has(value);
              let cls = "fc-bubble";
              if (!factorChecked) {
                if (isPicked) cls += " is-selected";
              } else if (isFactor && isPicked) cls += " is-correct";
              else if (isFactor && !isPicked) cls += " is-miss";
              else if (!isFactor && isPicked) cls += " is-wrong";
              else cls += " is-dim";
              return (
                <button
                  type="button"
                  key={`${round.id}-${value}`}
                  className={cls}
                  disabled={factorChecked}
                  aria-pressed={isPicked}
                  onClick={() => toggle(value)}
                >
                  <span className="fc-bubble-mark" aria-hidden="true">
                    {factorChecked && isFactor && isPicked ? "✓" : factorChecked && !isFactor && isPicked ? "✕" : isPicked ? "•" : ""}
                  </span>
                  {value}
                </button>
              );
            })}
          </div>

          {!factorChecked && (
            <button
              type="button"
              className="cr-btn sea fc-confirm"
              disabled={picked.size === 0}
              onClick={() => confirmFactors(false)}
            >
              確認找出的因數（已選 {picked.size} 個）
            </button>
          )}

          {factorChecked && (
            <div role="status" className="fc-feedback">
              <p className={`cr-hint ${missed.length + wrongPicked.length === 0 ? "is-ok" : "is-no"}`}>
                {factorTimedOut
                  ? `時間到！${round.n} 的因數一共有 ${round.factor.factors.length} 個`
                  : missed.length + wrongPicked.length === 0
                    ? `太厲害了，${round.factor.factors.length} 個因數全部找齊！`
                    : `漏掉 ${missed.length} 個因數、誤選 ${wrongPicked.length} 個，看看因數怎麼成對`}
              </p>

              <div className="fc-pairs" aria-label={`${round.n} 的因數成對`}>
                <p className="fc-pairs-title">因數兩兩成對，乘起來都是 {round.n}：</p>
                <div className="fc-pair-list">
                  {round.factor.pairs.map(([a, b]) => (
                    <span key={`${a}-${b}`} className="fc-pair">
                      {a} × {b} = {round.n}
                      {a === b && <i className="fc-pair-note">（自己成對）</i>}
                    </span>
                  ))}
                </div>
                {round.factor.kind === "prime" && (
                  <p className="fc-kind-note">{round.n} 是<b>質數</b>，因數只有 1 和自己。</p>
                )}
                <p className="fc-kind-note duo-bridge-note">
                  🎵 第二段提示：等一下要拼出的長方形，長 × 寬就是<b>上面這些因數對</b>！
                </p>
              </div>

              <button type="button" className="cr-btn sea fc-next" onClick={startRectStage}>
                接著拼長方形 →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- rect 段畫面 ----
  const cellColor = new Map<string, number>();
  found.forEach((pair, index) => {
    for (const key of Array.from(pairCells(pair))) cellColor.set(key, index % RECT_BRICK_COLORS.length);
  });
  const previewKeys = new Set<string>();
  if (preview) {
    for (let r = preview.r1; r <= preview.r2; r += 1) {
      for (let c = preview.c1; c <= preview.c2; c += 1) previewKeys.add(cellKey(r, c));
    }
  }
  const previewArea = preview ? rectArea(preview) : 0;
  const previewLabel = preview ? `${preview.r2 - preview.r1 + 1} × ${preview.c2 - preview.c1 + 1}` : null;
  const remaining = round.rect.realPairs.length - found.length;

  return (
    <div className="cr-page">
      <div className="cr-top">
        <button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button>
        <span className="cr-tag sea">因數雙重奏</span>
        <span className="cr-spacer" />
        <span className="cr-stat duo-stage-chip">🧱 第二段 · 拼長方形</span>
        {!rectDone && (
          <span className={`cr-stat cr-countdown${timeLeft <= 10 ? " is-urgent" : ""}`} role="timer">⏱ {timeLeft}s</span>
        )}
      </div>

      <div className="cr-stats">
        <span className="cr-stat">第 <b>{roundIndex + 1}</b> / {rounds.length} 關</span>
        <span className="cr-stat">已拼出 <b>{found.length}</b> / {round.rect.realPairs.length} 種</span>
        {mistakes > 0 && <span className="cr-stat">失誤 <b>{mistakes}</b></span>}
      </div>
      <div className="cr-progress"><i style={{ width: `${(roundIndex / rounds.length) * 100}%` }} /></div>

      <div className="cr-q-card" key={`${round.id}-rect`}>
        <span className="cr-q-meta">數學 · 五上 · 倍數與因數 · 雙重奏第二段</span>
        <div className="fc-target">
          <span className="fc-target-label">方格總數</span>
          <span className="fc-n">{round.n}</span>
        </div>
        <p className="cr-q-prompt rg-ask">
          剛剛找過 <b>{round.n}</b> 的因數了，現在用 {round.n} 個方格把它們<b>拼成長方形</b>！
          {remaining > 0 ? `還要拼出 ${remaining} 種排法（1 × ${round.n} 的一排長條直接過關）。` : "全部排法都拼出來了！"}
        </p>

        <div className="rg-foundlist" aria-label="已找到的排法">
          <span className="rg-foundchip is-granted">1 × {round.n}（送分）</span>
          {found.map(([a, b], index) => (
            <span key={`${a}x${b}`} className="rg-foundchip">
              <i className="rg-dot" style={{ background: RECT_BRICK_COLORS[index % RECT_BRICK_COLORS.length] }} aria-hidden="true" />
              {a} × {b}
            </span>
          ))}
          {round.rect.kind === "square" && (
            <span className="rg-foundchip is-square">🥚 剛剛看到「自己成對」的因數？正方形排法就藏著它</span>
          )}
        </div>

        <div
          className={`rg-grid${shake ? " is-shake" : ""}`}
          role="grid"
          aria-label={`${RECT_GRID_ROWS} 列 ${RECT_GRID_COLS} 行拼磚格線`}
          onPointerDown={onGridPointerDown}
          onPointerMove={onGridPointerMove}
          onPointerUp={onGridPointerUp}
          onPointerCancel={onGridPointerUp}
          onPointerLeave={onGridPointerUp}
        >
          {flash && (
            <span className={`rg-flash ${flash.kind === "ok" ? "is-ok" : flash.kind === "no" ? "is-no" : "is-info"}`} role="status">
              {flash.text}
            </span>
          )}
          {Array.from({ length: RECT_GRID_ROWS * RECT_GRID_COLS }, (_, i) => {
            const r = Math.floor(i / RECT_GRID_COLS);
            const c = i % RECT_GRID_COLS;
            const key = cellKey(r, c);
            const colorIndex = cellColor.get(key);
            const cls = [
              "rg-cell",
              colorIndex !== undefined ? `is-filled rg-brick-${colorIndex}` : "",
              previewKeys.has(key) ? "is-preview" : "",
              anchored && anchored.r === r && anchored.c === c ? "is-anchored" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                type="button"
                key={key}
                data-r={r}
                data-c={c}
                className={cls}
                disabled={rectDone}
                aria-label={`第${r + 1}列第${c + 1}格${previewKeys.has(key) ? `，預覽 ${previewArea} 格` : ""}`}
                onClick={() => onCellClick({ r, c })}
              />
            );
          })}
        </div>
        <p className={`rg-status${preview ? (previewArea === round.n ? " is-ok" : " is-no") : ""}`} role="status" aria-live="polite">
          {preview
            ? `目前選取 ${previewLabel} ＝ ${previewArea} 格${previewArea === round.n ? "，可以放手了！" : `，還差 ${round.n - previewArea} 格`}`
            : "在格線上拖曳（或點一角再點對角）開始拼磚"}
        </p>

        {rectDone && (
          <div role="status" className="fc-feedback rg-pop">
            <p className={`cr-hint ${rectTimedOut ? "is-no" : "is-ok"}`}>
              {rectTimedOut
                ? `時間到！${round.n} 的排法一共有 ${round.rect.pairs.length} 種`
                : `太厲害了，${round.n} 的 ${round.rect.pairs.length} 種排法全部拼出來！`}
            </p>
            <div className="fc-pairs" aria-label={`${round.n} 的因數成對`}>
              <p className="fc-pairs-title">全部排法（長 × 寬，乘起來都是 {round.n}）：</p>
              <div className="fc-pair-list">
                {round.rect.pairs.map(([a, b]) => {
                  const granted = a === 1;
                  const foundIt = found.some(([x, y]) => x === a && y === b);
                  return (
                    <span key={`${a}-${b}`} className="fc-pair">
                      {a} × {b}
                      {granted ? <i className="fc-pair-note">（送分）</i> : foundIt ? <i className="fc-pair-note">（你拼的）</i> : <i className="fc-pair-note">（沒找到）</i>}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="md-hint-box" aria-label="教學註記">
              <p className="md-hint-title">💡 雙重奏小筆記</p>
              <p className="md-hint-body">{round.rect.hint}</p>
            </div>
            <button type="button" className="cr-btn sea fc-next" onClick={advance}>
              {isLastRound ? "看雙重奏結果 →" : "前進下一關 →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
