// C 分類歸位：上方散落項目、下方分類籃；點項目→點籃歸位（單指觸控）。
// 成功/失敗都有回饋；30 秒倒數與星等結算沿用配對連連看的慣例。
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildSortBoard, sortStars, type SortResult, type SortSet } from "@/lib/sortBank";
import { formatMatchingTime } from "@/lib/matchingBank";
import "./SortGame.css";

type Props = {
  set: SortSet;
  onComplete: (result: SortResult) => void;
  resultActions?: React.ReactNode;
  muted?: boolean;
  timeLimitMs?: number;
};

export default function SortGame({
  set,
  onComplete,
  resultActions,
  muted = false,
  timeLimitMs = 30_000,
}: Props) {
  const board = useMemo(() => buildSortBoard(set), [set]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sortedKeys, setSortedKeys] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState(0);
  const [hint, setHint] = useState({ text: "", tone: "" });
  const [finished, setFinished] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [shakingKey, setShakingKey] = useState<string | null>(null);
  const startRef = useRef(Date.now());
  const completedRef = useRef(false);
  const sortedRef = useRef<Set<string>>(new Set());
  const errorsRef = useRef(0);

  const total = board.items.length;

  const playSound = useCallback(
    (kind: "win" | "ok" | "no") => {
      if (muted) return;
      try {
        const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        const tone = (freq: number, delay: number, dur: number, type: OscillatorType, vol: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = ctx.currentTime + delay;
          osc.type = type;
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(vol, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + dur + 0.02);
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

  useEffect(() => {
    startRef.current = Date.now();
    const timer = window.setInterval(() => setElapsed(Date.now() - startRef.current), 250);
    return () => window.clearInterval(timer);
  }, []);

  const finish = useCallback(
    (over: { timedOut?: boolean } = {}) => {
      if (completedRef.current) return;
      completedRef.current = true;
      const timeMs = Date.now() - startRef.current;
      const stars = over.timedOut ? 1 : sortStars(errorsRef.current);
      setFinished(true);
      setTimedOut(Boolean(over.timedOut));
      playSound(over.timedOut ? "no" : "win");
      onComplete({
        id: set.id,
        title: set.title,
        subject: set.subject,
        stars,
        errors: errorsRef.current,
        timeMs,
        ...(over.timedOut ? { timedOut: true } : {}),
      });
    },
    [onComplete, playSound, set.id, set.subject, set.title],
  );

  const timeLimit = timeLimitMs > 0 ? timeLimitMs : Number.POSITIVE_INFINITY;
  const secondsLeft = timeLimit === Number.POSITIVE_INFINITY ? null : Math.max(0, Math.ceil((timeLimit - elapsed) / 1000));

  useEffect(() => {
    if (timeLimit === Number.POSITIVE_INFINITY || finished) return;
    if (elapsed >= timeLimit) finish({ timedOut: true });
  }, [elapsed, finished, timeLimit, finish]);

  const pickItem = (key: string) => {
    if (sortedKeys.has(key) || finished) return;
    setSelectedKey((current) => (current === key ? null : key));
    setHint({ text: selectedKey === key ? "先點一個項目，再到下方選分類籃" : "再點一個分類籃，把項目放進去", tone: "" });
  };

  const pickBasket = (categoryIndex: number) => {
    if (finished) return;
    if (selectedKey === null) {
      setHint({ text: "請先點上方的一個項目喔！", tone: "err" });
      return;
    }
    const item = board.items.find((candidate) => candidate.key === selectedKey);
    if (!item) return;
    if (item.category === categoryIndex) {
      const next = new Set(sortedRef.current);
      next.add(selectedKey);
      sortedRef.current = next;
      setSortedKeys(next);
      setSelectedKey(null);
      playSound("ok");
      setHint({ text: "歸位成功！", tone: "ok" });
      if (next.size === total) window.setTimeout(finish, 420);
    } else {
      errorsRef.current += 1;
      setErrors(errorsRef.current);
      playSound("no");
      setSelectedKey(null);
      setHint({ text: "這個放錯籃子了，再想想看！", tone: "err" });
      setShakingKey(selectedKey);
      window.setTimeout(() => setShakingKey(null), 460);
    }
  };

  const stars = sortStars(errors);

  return (
    <div className="sort-game">
      <div className="sg-meta">
        <span className="sg-tag">
          {set.subject} · {set.grade} · {set.difficulty}
        </span>
        <div className="sg-stats">
          <span>用時 {formatMatchingTime(elapsed)}</span>
          {secondsLeft !== null && !finished && (
            <span className={`sg-countdown ${secondsLeft <= 5 ? "is-urgent" : ""}`} role="timer" aria-label={`剩餘 ${secondsLeft} 秒`}>
              剩 {secondsLeft} 秒
            </span>
          )}
          <span>已歸位 {sortedKeys.size}/{total}</span>
          <span>失誤 {errors}</span>
        </div>
      </div>
      <h3 className="sg-title">{set.title}</h3>
      <p className="sg-instruction">{set.instruction}</p>
      <div className="sg-progress">
        <i style={{ width: `${(sortedKeys.size / total) * 100}%` }} />
      </div>

      <div className="sg-items" aria-label="待分類項目">
        {board.items.map((item) => {
          const isSorted = sortedKeys.has(item.key);
          const isSelected = selectedKey === item.key;
          const isShaking = shakingKey === item.key;
          return (
            <button
              type="button"
              key={item.key}
              className={`sg-item ${isSorted ? "sg-sorted" : ""} ${isSelected ? "sg-selected" : ""} ${isShaking ? "sg-shake" : ""}`}
              onClick={() => pickItem(item.key)}
              disabled={isSorted}
            >
              <span className="sg-badge">{isSorted ? "✓" : "•"}</span>
              <span>{item.text}</span>
            </button>
          );
        })}
      </div>

      <div className="sg-baskets" aria-label="分類籃">
        {board.categories.map((category, index) => {
          const placed = board.items.filter((item) => item.category === index && sortedKeys.has(item.key));
          return (
            <button
              type="button"
              key={category.name}
              className={`sg-basket ${selectedKey !== null ? "sg-armed" : ""}`}
              onClick={() => pickBasket(index)}
            >
              <span className="sg-basket-name">{category.name}</span>
              <span className="sg-basket-items">
                {placed.length === 0 ? <i className="sg-basket-empty">＋</i> : placed.map((item) => <b key={item.key}>{item.text}</b>)}
              </span>
            </button>
          );
        })}
      </div>

      <p className={`sg-hint ${hint.tone}`} aria-live="polite">
        {hint.text}
      </p>

      {finished && (
        <div className="mg-result-card" role="status" aria-label="分類結果">
          <h3>{timedOut ? "時間到！" : "過關！"}</h3>
          <div className="mg-stars" aria-label={`獲得 ${stars} 星`}>
            {[1, 2, 3].map((n) => (
              <span key={n} className={n <= stars ? "" : "off"} style={{ animationDelay: `${n * 0.12}s` }}>
                {n <= stars ? "★" : "☆"}
              </span>
            ))}
          </div>
          <p className="mg-result-line">
            用時 <b>{formatMatchingTime(elapsed)}</b> ・ 失誤 <b>{errors}</b>
          </p>
          {timedOut && <p className="mg-result-line">時間到了，剩下的下次再挑戰！</p>}
          {resultActions && <div className="mg-result-actions">{resultActions}</div>}
        </div>
      )}
    </div>
  );
}
