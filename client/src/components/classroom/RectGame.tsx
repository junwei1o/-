import React, { useCallback, useEffect, useRef, useState } from "react";
import { useClassroomSound } from "./useClassroomSound";
import {
  buildRectRounds,
  RECT_GRID_COLS,
  RECT_GRID_ROWS,
  RECT_TIME_PER_LEVEL,
  rectStars,
  type RectPair,
  type RectRound,
} from "@/lib/classroomBank";
import "./classroom.css";

type Props = {
  muted?: boolean;
  onExit: () => void;
  onBest?: (record: { stars: number; correct: number; total: number }) => void;
  bestStars?: number;
};

type Phase = "start" | "play" | "result";

type Cell = { r: number; c: number };

type RectSel = { r1: number; c1: number; r2: number; c2: number };

type Flash = { text: string; kind: "ok" | "no" | "info" } | null;

const LEVEL_COUNT = 5;

/** 積木配色（米黃暖橙海藍延伸，與教室佈置一致）；每種排法一色。 */
const RECT_BRICK_COLORS = ["#3e7cb1", "#e8843a", "#5b8a4b", "#8a6bb5", "#c8553d", "#2f7d8f"];

function cellKey(r: number, c: number): string {
  return `${r}-${c}`;
}

/** 選取矩形轉成行列範圍（r1<=r2、c1<=c2）。 */
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

/** 把一個因數對擺到格線左上角，取回佔用的格子 key 集合（填色用）。 */
function pairCells([rows, cols]: RectPair): Set<string> {
  const keys = new Set<string>();
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) keys.add(cellKey(r, c));
  }
  return keys;
}

/**
 * 長方形拼拼樂（借鑒 NCTM Factorize／The Rectangle Game）：
 * 每關給 n 個方格，在格線上拖曳（或點兩下）拼出長方形；長×寬＝n 就成立，
 * 目標是找出 1×N 一排長條以外的全部排法——排長方形就是在找因數對。
 * 完全平方數關排得出正方形；60 秒每關，星等與最佳紀錄存裝置。
 */
export default function RectGame({ muted = false, onExit, onBest, bestStars }: Props) {
  const [rounds, setRounds] = useState<RectRound[]>(() => buildRectRounds(LEVEL_COUNT));
  const [phase, setPhase] = useState<Phase>("start");
  const [roundIndex, setRoundIndex] = useState(0);
  const [found, setFound] = useState<RectPair[]>([]);
  const [preview, setPreview] = useState<RectSel | null>(null);
  const [anchored, setAnchored] = useState<Cell | null>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const [shake, setShake] = useState(false);
  const [levelDone, setLevelDone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [timeLeft, setTimeLeft] = useState(RECT_TIME_PER_LEVEL);
  const [newBest, setNewBest] = useState(false);

  const play = useClassroomSound(muted);
  const roundsRef = useRef(rounds);
  const roundIndexRef = useRef(0);
  const foundRef = useRef<RectPair[]>([]);
  const mistakesRef = useRef(0);
  const clearedRef = useRef(0);
  const draggingRef = useRef(false);
  const dragAnchorRef = useRef<Cell | null>(null);
  const anchoredRef = useRef<Cell | null>(null);
  // pointer 事件已完成的互動要擋掉緊接著的 click（click 在 pointerup 之後的獨立 task 派發，
  // 不能用 setTimeout 清旗標）；pointerdown 一律重置、commit 時設立。
  const pointerHandledRef = useRef(false);
  const reportedRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const levelDoneRef = useRef(false);

  useEffect(() => {
    roundsRef.current = rounds;
  }, [rounds]);

  const showFlash = useCallback((text: string, kind: "ok" | "no" | "info") => {
    setFlash({ text, kind });
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 1200);
  }, []);

  const resetLevel = useCallback((index: number) => {
    roundIndexRef.current = index;
    setRoundIndex(index);
    foundRef.current = [];
    setFound([]);
    setPreview(null);
    anchoredRef.current = null;
    setAnchored(null);
    draggingRef.current = false;
    dragAnchorRef.current = null;
    setFlash(null);
    setLevelDone(false);
    setTimedOut(false);
    levelDoneRef.current = false;
    setTimeLeft(RECT_TIME_PER_LEVEL);
  }, []);

  const begin = useCallback(() => {
    const fresh = buildRectRounds(LEVEL_COUNT);
    roundsRef.current = fresh;
    setRounds(fresh);
    mistakesRef.current = 0;
    setMistakes(0);
    clearedRef.current = 0;
    setCleared(0);
    reportedRef.current = false;
    setNewBest(false);
    setPhase("play");
    resetLevel(0);
    window.scrollTo({ top: 0 });
  }, [resetLevel]);

  const finish = useCallback(() => {
    const stars = rectStars(mistakesRef.current);
    setPhase("result");
    play("win");
    if (!reportedRef.current && stars > (bestStars ?? 0)) {
      reportedRef.current = true;
      setNewBest(true);
      onBest?.({ stars, correct: clearedRef.current, total: roundsRef.current.length });
    }
    window.scrollTo({ top: 0 });
  }, [bestStars, onBest, play]);

  /** 送出一次拼法：面積等於 n 且沒找過就成立；全部找到即過關。 */
  const applyAnchor = useCallback((cell: Cell | null) => {
    anchoredRef.current = cell;
    setAnchored(cell);
  }, []);

  const commit = useCallback(
    (a: Cell, b: Cell) => {
      if (levelDoneRef.current) return;
      const round = roundsRef.current[roundIndexRef.current];
      if (!round) return;
      const sel = normalize(a, b);
      setPreview(null);
      applyAnchor(null);
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
        showFlash(`${pair[0]} × ${pair[1]} 已經找到了，換個排法吧`, "info");
        return;
      }
      foundRef.current = [...foundRef.current, pair];
      setFound([...foundRef.current]);
      play("ok");
      const left = round.realPairs.length - foundRef.current.length;
      if (left > 0) showFlash(`${pair[0]} × ${pair[1]} 成立！還有 ${left} 種排法`, "ok");
      else {
        levelDoneRef.current = true;
        clearedRef.current += 1;
        setCleared(clearedRef.current);
        setLevelDone(true);
        play("win");
      }
    },
    [play, showFlash, applyAnchor],
  );

  // 每關 60 秒倒數；時間到直接揭曉解答進下一關。
  useEffect(() => {
    if (phase !== "play" || levelDone) return;
    const deadline = Date.now() + RECT_TIME_PER_LEVEL * 1000;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        window.clearInterval(timer);
        levelDoneRef.current = true;
        setTimedOut(true);
        setLevelDone(true);
        play("no");
        window.scrollTo({ top: 0 });
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase, levelDone, roundIndex, play]);

  const advance = () => {
    if (roundIndexRef.current + 1 >= roundsRef.current.length) {
      finish();
      return;
    }
    resetLevel(roundIndexRef.current + 1);
    window.scrollTo({ top: 0 });
  };

  // ---- 格線互動：pointer 拖曳（真機滑動）＋點兩下（點擊備援） ----
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
    if (phase !== "play" || levelDoneRef.current) return;
    pointerHandledRef.current = false;
    const cell = cellFromEvent(e);
    if (!cell) return;
    // 已有錨點時，點到別格直接成立（點兩下玩法）。
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
    if (!draggingRef.current || phase !== "play" || levelDoneRef.current) return;
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
    if (!anchor || phase !== "play" || levelDoneRef.current) return;
    const cell = cellFromEvent(e);
    // 沒拖動（原地放開）＝交給 click 事件處理錨點切換；真的拖動才成立。
    if (cell && (cell.r !== anchor.r || cell.c !== anchor.c)) {
      pointerHandledRef.current = true;
      commit(anchor, cell);
    }
  };

  const onCellClick = (cell: Cell) => {
    if (pointerHandledRef.current || phase !== "play" || levelDoneRef.current) return;
    const anchor = anchoredRef.current;
    if (anchor) {
      if (anchor.r === cell.r && anchor.c === cell.c) {
        // 再點同一格＝取消錨點。
        applyAnchor(null);
        setPreview(null);
        return;
      }
      commit(anchor, cell);
      return;
    }
    applyAnchor(cell);
    setPreview({ r1: cell.r, c1: cell.c, r2: cell.r, c2: cell.c });
  };

  if (phase === "start") {
    return (
      <div className="cr-page">
        <div className="cr-top"><button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button></div>
        <div className="cr-start">
          <span className="cr-start-emoji" aria-hidden="true">🧱</span>
          <h2>長方形拼拼樂</h2>
          <p>
            每關給你一堆方格，在格線上<b>拖曳</b>（或<b>點兩下</b>）把它們排成長方形——
            排出來的「長 × 寬」就是一組因數對！排成一排的 1 × N 直接送分，
            挑戰是找出<b>其他全部排法</b>；完全平方數還排得出<b>正方形</b>喔。
          </p>
          <div className="cr-rules">
            <span className="cr-rule-chip">共 5 關</span>
            <span className="cr-rule-chip">每關 60 秒</span>
            <span className="cr-rule-chip">拖曳或點兩下拼長方形</span>
            <span className="cr-rule-chip">🧩 拼長方形＝找因數對</span>
          </div>
          <button type="button" className="cr-btn" onClick={begin}>開始拼磚</button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const stars = rectStars(mistakes);
    return (
      <div className="cr-page">
        <div className="cr-result" role="status" aria-label="長方形拼拼樂結果">
          <p className="cr-result-kicker">長方形拼拼樂完成</p>
          <h2 className="cr-result-title">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</h2>
          <p className="cr-result-sub">
            完整拼出 {cleared} / {rounds.length} 關{mistakes > 0 ? `，共 ${mistakes} 次失誤` : "，全程零失誤！"}
          </p>
          <p className="cr-result-metric">長 × 寬就是因數對；質數只能排成一排，完全平方數才排得出正方形</p>
          {newBest && <span className="cr-result-newbest">寫下新紀錄！</span>}
          <div className="cr-actions">
            <button type="button" className="cr-btn-ghost" onClick={onExit}>回我的教室</button>
            <button type="button" className="cr-btn sea" onClick={begin}>再拼一次</button>
          </div>
        </div>
      </div>
    );
  }

  const round = rounds[roundIndex];
  // 每種排法一種磚色；同格被多個排法覆蓋時顯示最新一個的顏色。
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
  const previewLabel = preview
    ? `${preview.r2 - preview.r1 + 1} × ${preview.c2 - preview.c1 + 1}`
    : null;
  const isLastRound = roundIndex + 1 >= rounds.length;
  const remaining = round.realPairs.length - found.length;

  return (
    <div className="cr-page">
      <div className="cr-top">
        <button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button>
        <span className="cr-tag sea">長方形拼拼樂</span>
        <span className="cr-spacer" />
        <span className={`cr-stat cr-countdown${timeLeft <= 10 ? " is-urgent" : ""}`} role="timer">
          ⏱ {timeLeft}s
        </span>
      </div>

      <div className="cr-stats">
        <span className="cr-stat">第 <b>{roundIndex + 1}</b> / {rounds.length} 關</span>
        <span className="cr-stat">已拼出 <b>{found.length}</b> / {round.realPairs.length} 種</span>
        {mistakes > 0 && <span className="cr-stat">失誤 <b>{mistakes}</b></span>}
      </div>
      <div className="cr-progress"><i style={{ width: `${(roundIndex / rounds.length) * 100}%` }} /></div>

      <div className="cr-q-card" key={round.id}>
        <span className="cr-q-meta">數學 · 五上 · 倍數與因數</span>
        <div className="fc-target">
          <span className="fc-target-label">方格總數</span>
          <span className="fc-n">{round.n}</span>
        </div>
        <p className="cr-q-prompt rg-ask">
          用 <b>{round.n}</b> 個方格在格線上拼長方形：長 × 寬 ＝ {round.n} 才成立！
          {remaining > 0 ? `還要找出 ${remaining} 種排法（1 × ${round.n} 的一排長條已直接過關）。` : "全部排法都找到了！"}
        </p>

        <div className="rg-foundlist" aria-label="已找到的排法">
          <span className="rg-foundchip is-granted">1 × {round.n}（送分）</span>
          {found.map(([a, b], index) => (
            <span key={`${a}x${b}`} className="rg-foundchip">
              <i className="rg-dot" style={{ background: RECT_BRICK_COLORS[index % RECT_BRICK_COLORS.length] }} aria-hidden="true" />
              {a} × {b}
            </span>
          ))}
          {round.kind === "square" && (
            <span className="rg-foundchip is-square">🥚 藏有正方形排法</span>
          )}
        </div>

        <div
          ref={gridRef}
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
                disabled={levelDone}
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
        <p className="rg-tip">玩法：在格線上按住拖出一個長方形放開；或先點一角、再點對角。面積不等於 {round.n} 會算失誤喔！</p>

        {levelDone && (
          <div role="status" className="fc-feedback rg-pop">
            <p className={`cr-hint ${timedOut ? "is-no" : "is-ok"}`}>
              {timedOut
                ? `時間到！${round.n} 的排法一共有 ${round.pairs.length} 種`
                : `太厲害了，${round.n} 的 ${round.pairs.length} 種排法全部拼出來！`}
            </p>
            <div className="fc-pairs" aria-label={`${round.n} 的因數成對`}>
              <p className="fc-pairs-title">全部排法（長 × 寬，乘起來都是 {round.n}）：</p>
              <div className="fc-pair-list">
                {round.pairs.map(([a, b]) => {
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
              <p className="md-hint-title">💡 排法小筆記</p>
              <p className="md-hint-body">{round.hint}</p>
            </div>
            <button type="button" className="cr-btn sea fc-next" onClick={advance}>
              {isLastRound ? "看拼磚結果 →" : "前進下一關 →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
