import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  buildMatchingBoard,
  formatMatchingTime,
  matchingStars,
  type MatchingResult,
  type MatchingSet,
} from "@/lib/matchingBank";
import "./MatchingGame.css";

const SVG_NS = "http://www.w3.org/2000/svg";

type HintTone = "" | "ok" | "err";

type Props = {
  /** 一組配對題。換關或重玩請由父層改變 key，讓元件重新掛載、重新洗牌計時。 */
  set: MatchingSet;
  /** 完成（全部配對）時回報一次，用於記錄成績或推進試卷流程。 */
  onComplete?: (result: MatchingResult) => void;
  /** 結果卡底部按鈕（例如：下一關、查看試卷結果）。 */
  resultActions?: ReactNode;
  muted?: boolean;
};

function buzz(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* 裝置不支援震動就忽略 */
    }
  }
}

/**
 * 配對連連看：點左欄一項、再點右欄對應項。
 * 成功畫綠線、失敗畫紅線並在首尾打叉後一起淡出。元件為 local-first、無網路依賴。
 */
export default function MatchingGame({ set, onComplete, resultActions, muted = false }: Props) {
  const board = useMemo(() => buildMatchingBoard(set), [set]);
  const [selected, setSelected] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [hint, setHint] = useState<{ text: string; tone: HintTone }>({
    text: "點一項左邊的題目開始吧！",
    tone: "",
  });

  const boardRef = useRef<HTMLDivElement | null>(null);
  const matchGRef = useRef<SVGGElement | null>(null);
  const failGRef = useRef<SVGGElement | null>(null);
  const leftEls = useRef<Record<number, HTMLButtonElement | null>>({});
  const rightEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const startRef = useRef<number>(Date.now());
  const completedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const total = set.pairs.length;

  const playSound = useCallback(
    (kind: "ok" | "no" | "win") => {
      if (muted) return;
      try {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        const ctx = (audioCtxRef.current ??= new Ctor());
        const t = ctx.currentTime;
        const tone = (freq: number, start: number, dur: number, type: OscillatorType, vol: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = type;
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, t + start);
          gain.gain.exponentialRampToValueAtTime(vol, t + start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
          osc.start(t + start);
          osc.stop(t + start + dur + 0.02);
        };
        if (kind === "win") [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.18, "triangle", 0.18));
        else if (kind === "ok") {
          tone(600, 0, 0.12, "sine", 0.15);
          tone(880, 0.08, 0.14, "sine", 0.13);
        } else {
          tone(200, 0, 0.22, "sawtooth", 0.09);
          tone(150, 0.12, 0.2, "sawtooth", 0.08);
        }
      } catch {
        /* 音效為附加回饋，失敗不影響遊戲 */
      }
    },
    [muted],
  );

  // 計時
  useEffect(() => {
    startRef.current = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  const endpoints = useCallback((leftEl: Element, rightEl: Element) => {
    const container = boardRef.current?.getBoundingClientRect();
    const a = leftEl.getBoundingClientRect();
    const b = rightEl.getBoundingClientRect();
    if (!container) return { x1: 0, y1: 0, x2: 0, y2: 0 };
    return {
      x1: a.right - container.left,
      y1: a.top + a.height / 2 - container.top,
      x2: b.left - container.left,
      y2: b.top + b.height / 2 - container.top,
    };
  }, []);

  const lineLength = (e: { x1: number; y1: number; x2: number; y2: number }) =>
    Math.hypot(e.x2 - e.x1, e.y2 - e.y1);

  // 成功綠線：matched 或版面變動時重繪
  const drawMatchLines = useCallback(() => {
    const group = matchGRef.current;
    if (!group) return;
    const present = new Set<string>();
    matched.forEach((pair) => {
      const leftEl = leftEls.current[pair];
      const rightEl = rightEls.current[`p${pair}`];
      if (!leftEl || !rightEl) return;
      const id = `ml-${set.id}-${pair}`;
      present.add(id);
      const e = endpoints(leftEl, rightEl);
      const len = lineLength(e);
      let line = group.querySelector<SVGLineElement>(`#${id}`);
      const isNew = !line;
      if (!line) {
        line = document.createElementNS(SVG_NS, "line");
        line.id = id;
        line.setAttribute("class", "mg-match-line draw");
        line.setAttribute("stroke-linecap", "round");
        group.appendChild(line);
      }
      line.setAttribute("x1", String(e.x1));
      line.setAttribute("y1", String(e.y1));
      line.setAttribute("x2", String(e.x2));
      line.setAttribute("y2", String(e.y2));
      line.style.setProperty("--mg-len", String(len));
      line.setAttribute("stroke-dasharray", String(len));
      if (isNew) line.setAttribute("stroke-dashoffset", String(len));
      else {
        line.classList.remove("draw");
        line.setAttribute("stroke-dashoffset", "0");
      }
    });
    Array.from(group.children).forEach((child) => {
      if (!present.has(child.id)) child.remove();
    });
  }, [matched, endpoints, set.id]);

  useLayoutEffect(() => {
    drawMatchLines();
  }, [drawMatchLines]);

  useEffect(() => {
    const redraw = () => drawMatchLines();
    window.addEventListener("resize", redraw);
    window.addEventListener("scroll", redraw, true);
    window.addEventListener("orientationchange", redraw);
    return () => {
      window.removeEventListener("resize", redraw);
      window.removeEventListener("scroll", redraw, true);
      window.removeEventListener("orientationchange", redraw);
    };
  }, [drawMatchLines]);

  // 失敗紅線＋首尾打叉，而後一起淡出
  const drawFail = useCallback(
    (leftPair: number, rightKey: string) => {
      const host = failGRef.current;
      const leftEl = leftEls.current[leftPair];
      const rightEl = rightEls.current[rightKey];
      if (!host || !leftEl || !rightEl) return;
      host.innerHTML = "";
      const e = endpoints(leftEl, rightEl);
      const len = lineLength(e);
      const group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("class", "mg-fail-group");
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("class", "mg-fail-line");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("x1", String(e.x1));
      line.setAttribute("y1", String(e.y1));
      line.setAttribute("x2", String(e.x2));
      line.setAttribute("y2", String(e.y2));
      line.style.setProperty("--mg-len", String(len));
      line.setAttribute("stroke-dasharray", String(len));
      line.setAttribute("stroke-dashoffset", String(len));
      group.appendChild(line);
      [
        [e.x1, e.y1],
        [e.x2, e.y2],
      ].forEach(([x, y]) => {
        const positioned = document.createElementNS(SVG_NS, "g");
        positioned.setAttribute("transform", `translate(${x},${y})`);
        const cross = document.createElementNS(SVG_NS, "g");
        cross.setAttribute("class", "mg-fail-x");
        const circle = document.createElementNS(SVG_NS, "circle");
        circle.setAttribute("r", "11");
        cross.appendChild(circle);
        const s = 5;
        [
          [-s, -s, s, s],
          [s, -s, -s, s],
        ].forEach(([x1, y1, x2, y2]) => {
          const k = document.createElementNS(SVG_NS, "line");
          k.setAttribute("x1", String(x1));
          k.setAttribute("y1", String(y1));
          k.setAttribute("x2", String(x2));
          k.setAttribute("y2", String(y2));
          cross.appendChild(k);
        });
        positioned.appendChild(cross);
        group.appendChild(positioned);
      });
      host.appendChild(group);
      window.setTimeout(() => group.remove(), 1250);
    },
    [endpoints],
  );

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const timeMs = Date.now() - startRef.current;
    const stars = matchingStars(errors);
    setFinished(true);
    playSound("win");
    buzz([40, 50, 40, 50, 120]);
    const result: MatchingResult = {
      id: set.id,
      title: set.title,
      subject: set.subject,
      stars,
      errors,
      timeMs,
    };
    onComplete?.(result);
  }, [errors, onComplete, playSound, set.id, set.subject, set.title]);

  const pickLeft = (pair: number) => {
    if (matched.has(pair) || finished) return;
    setSelected((current) => (current === pair ? null : pair));
    setHint({
      text: selected === pair ? "點一項左邊的題目開始吧！" : "再到右欄選出對應的答案",
      tone: "",
    });
  };

  const pickRight = (key: string, pair: number) => {
    if (finished) return;
    if (pair >= 0 && matched.has(pair)) return;
    if (selected === null) {
      setHint({ text: "請先點左欄的一項題目喔！", tone: "err" });
      buzz(25);
      return;
    }
    const leftPair = selected;
    if (pair === leftPair) {
      const nextMatched = new Set(matched);
      nextMatched.add(pair);
      setMatched(nextMatched);
      setSelected(null);
      playSound("ok");
      buzz(18);
      setHint({ text: "配對成功！連線完成～", tone: "ok" });
      if (nextMatched.size === total) window.setTimeout(finish, 420);
    } else {
      setErrors((current) => current + 1);
      playSound("no");
      buzz([30, 40, 30]);
      setSelected(null);
      setHint({ text: "這兩個沒有對在一起，再想想看！", tone: "err" });
      // 紅線與抖動在 DOM 更新後繪製
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => {
          drawFail(leftPair, key);
          leftEls.current[leftPair]?.classList.add("mg-shake");
          rightEls.current[key]?.classList.add("mg-shake");
          window.setTimeout(() => {
            leftEls.current[leftPair]?.classList.remove("mg-shake");
            rightEls.current[key]?.classList.remove("mg-shake");
          }, 460);
        }),
      );
    }
  };

  const stars = matchingStars(errors);

  return (
    <div className="matching-game">
      <div className="mg-meta">
        <span className="mg-tag">
          {set.subject} · {set.grade} · {set.difficulty}
        </span>
        <div className="mg-stats">
          <span>用時 {formatMatchingTime(elapsed)}</span>
          <span>
            已配對 {matched.size}/{total}
          </span>
          <span>失誤 {errors}</span>
        </div>
      </div>
      <h3 className="mg-title">{set.title}</h3>
      <p className="mg-instruction">{set.instruction}</p>
      <div className="mg-progress">
        <i style={{ width: `${(matched.size / total) * 100}%` }} />
      </div>

      <div className="mg-board" ref={boardRef}>
        <svg className="mg-lines" aria-hidden="true">
          <g ref={matchGRef} />
          <g ref={failGRef} />
        </svg>
        <div className="mg-col mg-left">
          <h4>題目</h4>
          {board.leftOrder.map((pair, index) => {
            const isMatched = matched.has(pair);
            const isSelected = selected === pair;
            return (
              <button
                type="button"
                key={`l-${pair}`}
                ref={(el) => {
                  leftEls.current[pair] = el;
                }}
                className={`mg-item ${isMatched ? "mg-matched" : ""} ${isSelected ? "mg-selected" : ""}`}
                onClick={() => pickLeft(pair)}
              >
                <span className="mg-badge">{isMatched ? "✓" : String.fromCharCode(65 + index)}</span>
                <span>{set.pairs[pair].l}</span>
                {isMatched && <span className="mg-mark">配對</span>}
              </button>
            );
          })}
        </div>
        <div className="mg-col mg-right">
          <h4>答案（含干擾項）</h4>
          {board.rightItems.map((item) => {
            const isMatched = item.pair >= 0 && matched.has(item.pair);
            return (
              <button
                type="button"
                key={`r-${item.key}`}
                ref={(el) => {
                  rightEls.current[item.key] = el;
                }}
                className={`mg-item ${isMatched ? "mg-matched" : ""}`}
                onClick={() => pickRight(item.key, item.pair)}
              >
                <span className="mg-badge">{isMatched ? "✓" : "•"}</span>
                <span>{item.text}</span>
                {isMatched && <span className="mg-mark">配對</span>}
              </button>
            );
          })}
        </div>
      </div>

      <p className={`mg-hint ${hint.tone}`} aria-live="polite">
        {hint.text}
      </p>

      {finished && (
        <div className="mg-result-card" role="status" aria-label="配對結果">
          <h3>過關！</h3>
          <div className="mg-stars" aria-label={`獲得 ${stars} 星`}>
            {[1, 2, 3].map((n) => (
              <span key={n} className={n <= stars ? "" : "off"} style={{ animationDelay: `${n * 0.12}s` }}>
                {n <= stars ? "★" : "☆"}
              </span>
            ))}
          </div>
          <p className="mg-result-line">
            用時 <b>{formatMatchingTime(elapsed)}</b>
          </p>
          <p className="mg-result-line">
            失誤 <b>{errors}</b> 次
          </p>
          <div className="mg-confetti" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, i) => (
              <span
                key={i}
                style={{
                  left: `${(i * 53) % 100}%`,
                  background: ["#e8843a", "#2f7d8f", "#e0a92e", "#3f8a43", "#d0503a", "#7a5cc0"][i % 6],
                  animationDelay: `${(i % 7) * 0.05}s`,
                }}
              />
            ))}
          </div>
          {resultActions && <div className="mg-result-actions">{resultActions}</div>}
        </div>
      )}
    </div>
  );
}
