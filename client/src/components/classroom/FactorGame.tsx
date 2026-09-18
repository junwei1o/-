import React, { useCallback, useEffect, useRef, useState } from "react";
import { useClassroomSound } from "./useClassroomSound";
import { buildFactorRounds, factorStars, type FactorRound } from "@/lib/classroomBank";
import "./classroom.css";

type Props = {
  muted?: boolean;
  onExit: () => void;
  onBest?: (record: { stars: number; correct: number; total: number }) => void;
  bestStars?: number;
};

type Phase = "start" | "play" | "result";

const ROUND_COUNT = 5;
const TIME_PER_ROUND = 30;

/**
 * 因數探險：每關給一個目標數，從數字泡泡中「多選」所有因數，
 * 確認後把因數兩兩成對（a×b=N）揭曉；含完全平方數與質數驚喜關。
 * 每關 30 秒、成敗雙回饋＋音效，共 5 關，星等與最佳紀錄存裝置。
 */
export default function FactorGame({ muted = false, onExit, onBest, bestStars }: Props) {
  const [rounds, setRounds] = useState<FactorRound[]>(() => buildFactorRounds(ROUND_COUNT));
  const [phase, setPhase] = useState<Phase>("start");
  const [roundIndex, setRoundIndex] = useState(0);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [errors, setErrors] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);
  const [newBest, setNewBest] = useState(false);

  const play = useClassroomSound(muted);
  const pickedRef = useRef<Set<number>>(new Set());
  const checkedRef = useRef(false);
  const roundIndexRef = useRef(0);
  const roundsRef = useRef(rounds);
  const errorsRef = useRef<number[]>([]);
  const reportedRef = useRef(false);
  const lastTickRef = useRef(-1);

  useEffect(() => {
    roundsRef.current = rounds;
  }, [rounds]);

  const round = rounds[roundIndex];
  const totalErrors = errors.reduce((sum, value) => sum + (value || 0), 0);
  const perfectRounds = errors.filter((value) => value === 0).length;

  const resetRound = useCallback((index: number) => {
    roundIndexRef.current = index;
    setRoundIndex(index);
    const empty = new Set<number>();
    pickedRef.current = empty;
    setPicked(empty);
    checkedRef.current = false;
    setChecked(false);
    setTimedOut(false);
    setTimeLeft(TIME_PER_ROUND);
    lastTickRef.current = -1;
  }, []);

  const begin = useCallback(() => {
    const fresh = buildFactorRounds(ROUND_COUNT);
    roundsRef.current = fresh;
    setRounds(fresh);
    errorsRef.current = [];
    setErrors([]);
    reportedRef.current = false;
    setNewBest(false);
    setPhase("play");
    resetRound(0);
    window.scrollTo({ top: 0 });
  }, [resetRound]);

  const toggle = (value: number) => {
    if (checkedRef.current) return;
    play("flip");
    setPicked((previous) => {
      const next = new Set(previous);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      pickedRef.current = next;
      return next;
    });
  };

  const confirm = useCallback(
    (isTimeout = false) => {
      if (checkedRef.current) return;
      const current = roundsRef.current[roundIndexRef.current];
      if (!current) return;
      const selected = pickedRef.current;
      const missed = current.factors.filter((factor) => !selected.has(factor));
      const wrong = Array.from(selected).filter((value) => !current.factors.includes(value));
      const errorCount = missed.length + wrong.length;
      checkedRef.current = true;
      setChecked(true);
      setTimedOut(isTimeout);
      errorsRef.current[roundIndexRef.current] = errorCount;
      setErrors([...errorsRef.current]);
      if (errorCount === 0) play("ok");
      else play("no");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [play],
  );

  // 每關獨立 30 秒倒數；時間到自動對答案。
  useEffect(() => {
    if (phase !== "play") return;
    const deadline = Date.now() + TIME_PER_ROUND * 1000;
    lastTickRef.current = -1;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 5 && left > 0 && left !== lastTickRef.current) {
        lastTickRef.current = left;
        play("tick");
      }
      if (left <= 0 && !checkedRef.current) {
        window.clearInterval(timer);
        confirm(true);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase, roundIndex, confirm]);

  const advance = () => {
    if (roundIndexRef.current + 1 >= roundsRef.current.length) {
      const summedErrors = errorsRef.current.reduce((sum, value) => sum + (value || 0), 0);
      const perfect = errorsRef.current.filter((value) => value === 0).length;
      const stars = factorStars(summedErrors);
      setPhase("result");
      play("win");
      if (!reportedRef.current && stars > (bestStars ?? 0)) {
        reportedRef.current = true;
        setNewBest(true);
        onBest?.({ stars, correct: perfect, total: roundsRef.current.length });
      }
      window.scrollTo({ top: 0 });
      return;
    }
    resetRound(roundIndexRef.current + 1);
    window.scrollTo({ top: 0 });
  };

  if (phase === "start") {
    return (
      <div className="cr-page">
        <div className="cr-top"><button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button></div>
        <div className="cr-start">
          <span className="cr-start-emoji" aria-hidden="true">🔢</span>
          <h2>因數探險</h2>
          <p>
            每關給你一個神祕數字，把它的「因數」從數字泡泡裡全部點出來！
            確認後會把因數兩兩配對（a × b＝N）揭曉；還會遇到因數會自己成對的「完全平方數」，
            以及只剩 1 和自己的「質數」驚喜關。
          </p>
          <div className="cr-rules">
            <span className="cr-rule-chip">共 5 關</span>
            <span className="cr-rule-chip">每關 30 秒</span>
            <span className="cr-rule-chip">多選所有因數</span>
            <span className="cr-rule-chip">零失誤三顆星</span>
          </div>
          <button type="button" className="cr-btn" onClick={begin}>開始探險</button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const stars = factorStars(totalErrors);
    return (
      <div className="cr-page">
        <div className="cr-result" role="status" aria-label="因數探險結果">
          <p className="cr-result-kicker">因數探險完成</p>
          <h2 className="cr-result-title">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</h2>
          <p className="cr-result-sub">
            完美過關 {perfectRounds} / {rounds.length} 關{totalErrors > 0 ? `，共 ${totalErrors} 個失誤` : "，全程零失誤！"}
          </p>
          <p className="cr-result-metric">因數會成對出現，質數只有 1 和自己兩個因數</p>
          {newBest && <span className="cr-result-newbest">寫下新紀錄！</span>}
          <div className="cr-actions">
            <button type="button" className="cr-btn-ghost" onClick={onExit}>回我的教室</button>
            <button type="button" className="cr-btn sea" onClick={begin}>再探險一次</button>
          </div>
        </div>
      </div>
    );
  }

  const missed = checked ? round.factors.filter((factor) => !picked.has(factor)) : [];
  const wrongPicked = checked ? Array.from(picked).filter((value) => !round.factors.includes(value)) : [];
  const isLastRound = roundIndex + 1 >= rounds.length;

  return (
    <div className="cr-page">
      <div className="cr-top">
        <button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button>
        <span className="cr-tag sea">因數探險</span>
        <span className="cr-spacer" />
        <span className={`cr-stat cr-countdown${timeLeft <= 5 ? " is-urgent" : ""}`} role="timer">
          ⏱ {timeLeft}s
        </span>
      </div>

      <div className="cr-stats">
        <span className="cr-stat">第 <b>{roundIndex + 1}</b> / {rounds.length} 關</span>
        <span className="cr-stat">完美 <b>{perfectRounds}</b> 關</span>
        {totalErrors > 0 && <span className="cr-stat">失誤 <b>{totalErrors}</b></span>}
      </div>
      <div className="cr-progress"><i style={{ width: `${(roundIndex / rounds.length) * 100}%` }} /></div>

      <div className="cr-q-card" key={round.id}>
        <span className="cr-q-meta">數學 · 五上 · 倍數與因數</span>
        <div className="fc-target">
          <span className="fc-target-label">神祕數字</span>
          <span className="fc-n">{round.n}</span>
        </div>
        <p className="cr-q-prompt fc-ask">下面哪些數字是 <b>{round.n}</b> 的因數？把它們全部點起來！</p>

        <div className="fc-bubbles" role="group" aria-label={`${round.n} 的因數候選數字`}>
          {round.choices.map((value) => {
            const isFactor = round.factors.includes(value);
            const isPicked = picked.has(value);
            let cls = "fc-bubble";
            if (!checked) {
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
                disabled={checked}
                aria-pressed={isPicked}
                onClick={() => toggle(value)}
              >
                <span className="fc-bubble-mark" aria-hidden="true">
                  {checked && isFactor && isPicked ? "✓" : checked && !isFactor && isPicked ? "✕" : isPicked ? "•" : ""}
                </span>
                {value}
              </button>
            );
          })}
        </div>

        {!checked && (
          <button
            type="button"
            className="cr-btn sea fc-confirm"
            disabled={picked.size === 0}
            onClick={() => confirm(false)}
          >
            確認找出的因數（已選 {picked.size} 個）
          </button>
        )}

        {checked && (
          <div role="status" className="fc-feedback">
            <p className={`cr-hint ${missed.length + wrongPicked.length === 0 ? "is-ok" : "is-no"}`}>
              {timedOut
                ? `時間到！${round.n} 的因數一共有 ${round.factors.length} 個`
                : missed.length + wrongPicked.length === 0
                  ? `太厲害了，${round.factors.length} 個因數全部找齊！`
                  : `漏掉 ${missed.length} 個因數、誤選 ${wrongPicked.length} 個，看看因數怎麼成對`}
            </p>

            <div className="fc-pairs" aria-label={`${round.n} 的因數成對`}>
              <p className="fc-pairs-title">因數兩兩成對，乘起來都是 {round.n}：</p>
              <div className="fc-pair-list">
                {round.pairs.map(([a, b]) => (
                  <span key={`${a}-${b}`} className="fc-pair">
                    {a} × {b} = {round.n}
                    {a === b && <i className="fc-pair-note">（自己成對）</i>}
                  </span>
                ))}
              </div>
              {round.kind === "square" && (
                <p className="fc-kind-note">
                  {round.n} 是<b>完全平方數</b>，中間因數 {round.pairs[round.pairs.length - 1][0]} 會自己和自己成對。
                </p>
              )}
              {round.kind === "prime" && (
                <p className="fc-kind-note">
                  {round.n} 是<b>質數</b>，因數只有 <b>1</b> 和 <b>{round.n}</b> 自己，所以只選這兩個！
                </p>
              )}
            </div>

            <button type="button" className="cr-btn sea fc-next" onClick={advance}>
              {isLastRound ? "看探險結果 →" : "前進下一關 →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
