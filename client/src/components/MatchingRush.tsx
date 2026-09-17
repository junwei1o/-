import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildRushQuestions,
  matchingStars,
  formatMatchingTime,
  type MatchingResult,
  type MatchingRushMode,
  type MatchingRushResult,
  type MatchingSet,
} from "@/lib/matchingBank";
import "./MatchingRush.css";

type Props = {
  set: MatchingSet;
  mode: MatchingRushMode;
  muted?: boolean;
  /** speed 模式完成時回傳（沿用連連看的星等結果）。 */
  onComplete?: (result: MatchingResult) => void;
  /** rush 模式完成時回傳。 */
  onRushComplete?: (result: MatchingRushResult) => void;
  resultActions?: React.ReactNode;
  /** 速配每題倒數（ms），<=0 不限時。 */
  speedTimeLimitMs?: number;
  /** 搶分總倒數（ms），<=0 不限時。 */
  rushTimeLimitMs?: number;
};

type Hint = { text: string; tone: "" | "ok" | "no" };

export default function MatchingRush({
  set,
  mode,
  muted = false,
  onComplete,
  onRushComplete,
  resultActions,
  speedTimeLimitMs = 30_000,
  rushTimeLimitMs = 30_000,
}: Props) {
  const questions = useMemo(() => buildRushQuestions(set), [set]);
  const total = questions.length;

  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [hint, setHint] = useState<Hint>({
    text: mode === "rush" ? "30 秒內盡量答對，連對有加成！" : "點出正確答案，答錯會自動顯示解答",
    tone: "",
  });
  const startRef = useRef<number>(Date.now());
  const completedRef = useRef(false);
  const lockedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const autoAdvanceRef = useRef<number | null>(null);

  // speed 狀態（累計值同步進 ref，結算讀 ref 避免閉包過期）
  const [qIndex, setQIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [speedTimeLeft, setSpeedTimeLeft] = useState(Math.max(0, Math.round(speedTimeLimitMs / 1000)));
  const errorsRef = useRef(0);
  const speedDeadlineRef = useRef<number>(Date.now() + Math.max(0, speedTimeLimitMs));

  // rush 狀態
  const [rushIndex, setRushIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [rushTimeLeft, setRushTimeLeft] = useState(Math.max(0, Math.round(rushTimeLimitMs / 1000)));
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const correctRef = useRef(0);
  const rushDeadlineRef = useRef<number>(Date.now() + Math.max(0, rushTimeLimitMs));

  const playSound = useCallback(
    (kind: "ok" | "no" | "win") => {
      if (muted) return;
      try {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        const ctx = (audioCtxRef.current ??= new Ctor());
        if (ctx.state === "suspended") void ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = kind === "ok" ? 620 : kind === "no" ? 220 : 740;
        gain.gain.value = kind === "no" ? 0.05 : 0.06;
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      } catch {
        /* 音效失敗不影響作答 */
      }
    },
    [muted],
  );

  function finishSpeed(timedOutFlag: boolean) {
    if (completedRef.current) return;
    completedRef.current = true;
    setFinished(true);
    setTimedOut(timedOutFlag);
    playSound(timedOutFlag ? "no" : "win");
    const finalErrors = errorsRef.current;
    onComplete?.({
      id: set.id,
      title: set.title,
      subject: set.subject,
      stars: timedOutFlag ? 1 : matchingStars(finalErrors),
      errors: finalErrors,
      timeMs: Date.now() - startRef.current,
      timedOut: timedOutFlag || undefined,
    });
  }

  function finishRush() {
    if (completedRef.current) return;
    completedRef.current = true;
    setFinished(true);
    setTimedOut(true);
    playSound("win");
    onRushComplete?.({
      id: set.id,
      title: set.title,
      subject: set.subject,
      mode: "rush",
      score: scoreRef.current,
      correct: correctRef.current,
      total,
      maxCombo: maxComboRef.current,
      timeMs: Date.now() - startRef.current,
    });
  }

  function clearAutoAdvance() {
    if (autoAdvanceRef.current !== null) {
      window.clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }

  function advance() {
    clearAutoAdvance();
    setRevealed(null);
    setLocked(false);
    lockedRef.current = false;
    setHint({ text: mode === "rush" ? "繼續答，連對有加成！" : "", tone: "" });
    if (mode === "speed") {
      if (qIndex + 1 >= total) {
        finishSpeed(false);
        return;
      }
      setQIndex(qIndex + 1);
    } else {
      setRushIndex((i) => (i + 1 >= total ? 0 : i + 1));
    }
  }

  function handlePick(option: string) {
    if (lockedRef.current || completedRef.current) return;
    const current = mode === "speed" ? questions[qIndex] : questions[rushIndex];
    const correct = option === current.answer;
    lockedRef.current = true;
    setLocked(true);

    if (mode === "speed") {
      setRevealed(option);
      if (correct) {
        playSound("ok");
        setHint({ text: "答對了！", tone: "ok" });
        autoAdvanceRef.current = window.setTimeout(advance, 500);
      } else {
        playSound("no");
        errorsRef.current += 1;
        setErrors(errorsRef.current);
        setHint({ text: `正確答案是「${current.answer}」`, tone: "no" });
        autoAdvanceRef.current = window.setTimeout(advance, 1400);
      }
    } else {
      if (correct) {
        playSound("ok");
        comboRef.current += 1;
        const gained = 10 + (comboRef.current >= 2 ? (comboRef.current - 1) * 5 : 0);
        scoreRef.current += gained;
        correctRef.current += 1;
        maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
        setCombo(comboRef.current);
        setScore(scoreRef.current);
        setCorrectCount(correctRef.current);
        setMaxCombo(maxComboRef.current);
        setHint({ text: `答對了！+${gained} 分（連對 ${comboRef.current}）`, tone: "ok" });
      } else {
        playSound("no");
        comboRef.current = 0;
        setCombo(0);
        setHint({ text: `正確答案是「${current.answer}」`, tone: "no" });
      }
      setRevealed(option);
      autoAdvanceRef.current = window.setTimeout(advance, 700);
    }
  }

  // 速配：每題 30 秒倒數（第一次進入該題起算）。
  useEffect(() => {
    if (mode !== "speed" || finished) return;
    if (qIndex === 0) {
      speedDeadlineRef.current = Date.now() + Math.max(0, speedTimeLimitMs);
    }
    const update = () => {
      const left = Math.max(0, Math.round((speedDeadlineRef.current - Date.now()) / 1000));
      setSpeedTimeLeft(left);
      if (left <= 0 && !completedRef.current && !lockedRef.current) {
        playSound("no");
        errorsRef.current += 1;
        setErrors(errorsRef.current);
        const answer = questions[qIndex]?.answer ?? "";
        setRevealed(answer);
        setHint({ text: `時間到！正確答案是「${answer}」`, tone: "no" });
        lockedRef.current = true;
        setLocked(true);
        autoAdvanceRef.current = window.setTimeout(advance, 1400);
      }
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
    // 只以「題號」為鍵：同一題倒數不重計，換題後重跑。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, mode, finished]);

  // 搶分：30 秒總倒數，時間到結算。
  useEffect(() => {
    if (mode !== "rush" || finished) return;
    rushDeadlineRef.current = Date.now() + Math.max(0, rushTimeLimitMs);
    const update = () => {
      const left = Math.max(0, Math.round((rushDeadlineRef.current - Date.now()) / 1000));
      setRushTimeLeft(left);
      if (left <= 0 && !completedRef.current) {
        finishRush();
      }
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, finished]);

  // 離開元件時清掉待執行的自動換題。
  useEffect(() => clearAutoAdvance, []);

  const question = mode === "speed" ? questions[qIndex] : questions[rushIndex];
  const timeLeft = mode === "speed" ? speedTimeLeft : rushTimeLeft;
  const limitSec = Math.max(0, Math.round((mode === "speed" ? speedTimeLimitMs : rushTimeLimitMs) / 1000));

  if (finished) {
    const isSpeed = mode === "speed";
    const starCount = isSpeed ? (timedOut ? 1 : matchingStars(errorsRef.current)) : 0;
    return (
      <section className="matching-rush" aria-label="速配結果">
        <div className="mg-rush-result">
          <p className="mg-rush-result-kicker">{isSpeed ? "單對速配完成" : "30 秒搶分結束"}</p>
          {isSpeed ? (
            <>
              <h2 className="mg-rush-result-title">
                {timedOut ? "時間到！" : [1, 2, 3].map((n) => (n <= starCount ? "★" : "☆")).join("")}
              </h2>
              <p className="mg-rush-result-sub">
                {errorsRef.current === 0 ? "零失誤通關！" : `錯 ${errorsRef.current} 題`}
                {timedOut ? " · 時間到" : ""}
              </p>
              <p className="mg-rush-result-metric">花費 {formatMatchingTime(Date.now() - startRef.current)}</p>
            </>
          ) : (
            <>
              <h2 className="mg-rush-result-title">{scoreRef.current} 分</h2>
              <p className="mg-rush-result-sub">
                答對 {correctRef.current} 題 · 最高連對 {maxComboRef.current} 連
              </p>
              <p className="mg-rush-result-metric">30 秒內循環挑戰 {total} 關題庫</p>
            </>
          )}
          <div className="mg-rush-result-actions">{resultActions}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="matching-rush" aria-label={mode === "rush" ? "30 秒搶分挑戰" : "單對速配"}>
      <div className="mr-top">
        <span className="mr-tag">{mode === "rush" ? "30 秒搶分" : "單對速配"}</span>
        <span className="mr-set-title">{set.title}</span>
        <span className={`mr-countdown${timeLeft <= 5 && timeLeft > 0 ? " is-urgent" : ""}`} role="timer" data-testid="mr-countdown">
          ⏱ {timeLeft}s
        </span>
      </div>

      <div className="mr-stats">
        {mode === "rush" ? (
          <>
            <span className="mr-stat">得分 {score}</span>
            <span className="mr-stat">連對 {combo}</span>
          </>
        ) : (
          <>
            <span className="mr-stat">第 {qIndex + 1} / {total} 題</span>
            <span className="mr-stat">已錯 {errors}</span>
          </>
        )}
      </div>

      <div className="mr-question" key={`${set.id}-${mode}-${mode === "speed" ? qIndex : rushIndex}`}>
        {question?.img ? (
          <img className="mr-question-img" src={question.img} alt={question.left} draggable={false} />
        ) : (
          <p className="mr-question-left">{question?.left ?? ""}</p>
        )}
        <div className="mr-options">
          {(question?.options ?? []).map((option) => {
            const isAnswer = option === question.answer;
            let cls = "mr-option";
            if (locked) {
              if (isAnswer) cls += " is-correct";
              else if (option === revealed) cls += " is-wrong";
              else cls += " is-dim";
            }
            return (
              <button
                type="button"
                key={option}
                className={cls}
                onClick={() => handlePick(option)}
                disabled={locked}
              >
                {option}
              </button>
            );
          })}
        </div>
        {hint.text && <p className={`mr-hint is-${hint.tone}`} role="status">{hint.text}</p>}
      </div>

      <p className="mr-rule">
        {mode === "rush"
          ? "時間到就結算，答對 +10、連對每連 +5 加成"
          : `每題 ${limitSec} 秒，答錯會自動顯示正確答案後換題`}
      </p>
    </section>
  );
}
