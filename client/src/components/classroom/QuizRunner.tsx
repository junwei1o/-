import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClassroomSound } from "./useClassroomSound";
import { accuracyStars } from "@/lib/classroomBank";
import { shuffleArray } from "@/lib/matchingBank";
import "./classroom.css";

export type RunnerQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation?: string;
  img?: string;
  meta?: string;
  trapNote?: string;
  category?: string;
};

type Props = {
  variant: "flip" | "image" | "trap" | "flipdex";
  emoji: string;
  tag: string;
  tagClass?: string;
  startTitle: string;
  startDesc: string;
  rules: string[];
  questions: RunnerQuestion[];
  muted?: boolean;
  timePerQuestionMs?: number;
  bestStars?: number;
  onBest?: (record: { stars: number; correct: number; total: number }) => void;
  onExit: () => void;
};

type Phase = "start" | "play" | "result";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * 翻牌問答（flip）／看圖選答（image）／陷阱題挑戰（trap）／翻牌圖鑑（flipdex，翻牌＋看圖混牌堆）共用骨架：
 * 每題 30 秒、答錯立即雙回饋＋音效、結束依正確率給星。
 * flipdex 與 flip 同樣「先翻牌再作答」，但牌堆混有帶圖的看圖題（翻開後圖片與題目一起出現）。
 */
export default function QuizRunner({
  variant,
  emoji,
  tag,
  tagClass,
  startTitle,
  startDesc,
  rules,
  questions,
  muted = false,
  timePerQuestionMs = 30_000,
  bestStars,
  onBest,
  onExit,
}: Props) {
  const total = questions.length;
  const [phase, setPhase] = useState<Phase>("start");
  const [order, setOrder] = useState<number[]>(() => questions.map((_, i) => i));
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.round(timePerQuestionMs / 1000));
  const [flipping, setFlipping] = useState(false);
  const [revealed, setRevealed] = useState(variant !== "flip");
  const [newBest, setNewBest] = useState(false);
  const [nonce, setNonce] = useState(0);

  const correctRef = useRef(0);
  const errorsRef = useRef(0);
  const deadlineRef = useRef(0);
  const lockedRef = useRef(false);
  const advanceRef = useRef<number | null>(null);
  const play = useClassroomSound(muted);

  const question = questions[order[qIndex]];

  const clearAdvance = () => {
    if (advanceRef.current !== null) {
      window.clearTimeout(advanceRef.current);
      advanceRef.current = null;
    }
  };

  const begin = useCallback(() => {
    setPhase("play");
    setOrder(shuffleArray(questions.map((_, i) => i)));
    setQIndex(0);
    setPicked(null);
    setLocked(false);
    setTimedOut(false);
    setCorrectCount(0);
    setErrors(0);
    setTimeLeft(Math.round(timePerQuestionMs / 1000));
    correctRef.current = 0;
    errorsRef.current = 0;
    setNewBest(false);
    setNonce((n) => n + 1);
    if (variant === "flip") {
      setFlipping(false);
      setRevealed(false);
    } else {
      setRevealed(true);
    }
    window.scrollTo({ top: 0 });
  }, [questions, timePerQuestionMs, variant]);

  const finish = useCallback(() => {
    clearAdvance();
    const stars = accuracyStars(correctRef.current, total);
    setPhase("result");
    play("win");
    if (stars > (bestStars ?? 0)) {
      setNewBest(true);
      onBest?.({ stars, correct: correctRef.current, total });
    }
    window.scrollTo({ top: 0 });
  }, [bestStars, onBest, play, total]);

  const goNext = useCallback(() => {
    clearAdvance();
    if (qIndex + 1 >= total) {
      finish();
      return;
    }
    setQIndex((i) => i + 1);
    setPicked(null);
    setLocked(false);
    setTimedOut(false);
    setTimeLeft(Math.round(timePerQuestionMs / 1000));
    if (variant === "flip" || variant === "flipdex") {
      setFlipping(false);
      setRevealed(false);
    }
  }, [finish, qIndex, timePerQuestionMs, total, variant]);

  const resolve = useCallback(
    (index: number | null, timeoutFlag: boolean) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      setLocked(true);
      setPicked(index);
      setTimedOut(timeoutFlag);
      const isCorrect = index === question.answer;
      if (isCorrect) {
        correctRef.current += 1;
        setCorrectCount(correctRef.current);
        play("ok");
      } else {
        errorsRef.current += 1;
        setErrors(errorsRef.current);
        play("no");
      }
      advanceRef.current = window.setTimeout(goNext, timeoutFlag || !isCorrect ? 2300 : 1100);
    },
    [goNext, play, question],
  );

  // 翻牌：翻轉動畫後揭示題目並開始倒數。
  function flipCard() {
    if (flipping || revealed) return;
    play("flip");
    setFlipping(true);
    window.setTimeout(() => setRevealed(true), 560);
  }

  // 每題 30 秒倒數（翻牌模式在翻開後才起算）。
  useEffect(() => {
    if (phase !== "play" || !revealed || locked) return;
    deadlineRef.current = Date.now() + timePerQuestionMs;
    const update = () => {
      const left = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 5 && left > 0 && left !== timeLeft) play("tick");
      if (left <= 0 && !lockedRef.current) resolve(null, true);
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, revealed, phase, nonce]);

  useEffect(() => () => clearAdvance(), []);

  const stars = useMemo(() => accuracyStars(correctCount, total), [correctCount, total]);

  if (phase === "start") {
    return (
      <div className="cr-page">
        <div className="cr-top">
          <button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button>
        </div>
        <div className="cr-start">
          <span className="cr-start-emoji" aria-hidden="true">{emoji}</span>
          <h2>{startTitle}</h2>
          <p>{startDesc}</p>
          <div className="cr-rules">
            {rules.map((rule) => (
              <span className="cr-rule-chip" key={rule}>{rule}</span>
            ))}
          </div>
          <button type="button" className="cr-btn" onClick={begin}>開始挑戰</button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="cr-page">
        <div className="cr-result" role="status" aria-label="挑戰結果">
          <p className="cr-result-kicker">{tag}完成</p>
          <h2 className="cr-result-title">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</h2>
          <p className="cr-result-sub">答對 {correctCount} / {total} 題{errors > 0 ? `，錯 ${errors} 題` : "，零失誤！"}</p>
          <p className="cr-result-metric">{timedOut ? "有題目超過 30 秒" : "每題都在 30 秒內完成"}</p>
          {newBest && <span className="cr-result-newbest">寫下新紀錄！</span>}
          <div className="cr-actions">
            <button type="button" className="cr-btn-ghost" onClick={onExit}>回我的教室</button>
            <button type="button" className="cr-btn sea" onClick={begin}>再玩一輪</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-page">
      <div className="cr-top">
        <button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button>
        <span className={`cr-tag ${tagClass ?? ""}`}>{tag}</span>
        <span className="cr-spacer" />
        <span className={`cr-stat cr-countdown${timeLeft <= 5 ? " is-urgent" : ""}`} role="timer">
          ⏱ {timeLeft}s
        </span>
      </div>

      <div className="cr-stats">
        <span className="cr-stat">第 <b>{qIndex + 1}</b> / {total} 題</span>
        <span className="cr-stat">答對 <b>{correctCount}</b></span>
        {errors > 0 && <span className="cr-stat">失誤 <b>{errors}</b></span>}
      </div>
      <div className="cr-progress"><i style={{ width: `${(qIndex / total) * 100}%` }} /></div>

      <div className="cr-q-card" key={question.id}>
        {variant === "flip" && !revealed && (
          <div className="cr-flip-scene">
            <button
              type="button"
              className={`cr-flip ${flipping ? "is-flipped" : ""}`}
              onClick={flipCard}
              aria-label="翻開題目"
            >
              <span className="cr-flip-face cr-flip-front">
                <span style={{ fontSize: 26 }}>🃏</span>
                <span>輕點翻開這一題</span>
                <span className="cr-flip-hint">翻開後開始 30 秒倒數</span>
              </span>
              <span className="cr-flip-face cr-flip-back">題目解禁！</span>
            </button>
          </div>
        )}

        {revealed && (
          <>
            {question.meta && <span className="cr-q-meta">{question.meta}</span>}
            {variant === "trap" && question.category && (
              <span className="cr-q-meta" style={{ marginLeft: 6 }}>陷阱類型 · {question.category}</span>
            )}
            {question.img ? (
              <figure className="cr-q-img-wrap">
                <img src={question.img} alt="看圖選答的圖片" draggable={false} />
              </figure>
            ) : null}
            <p className="cr-q-prompt">{question.prompt}</p>
            <div className="cr-options" role="group" aria-label="答案選項">
              {question.options.map((option, index) => {
                let cls = "cr-option";
                if (locked) {
                  if (index === question.answer) cls += " is-correct";
                  else if (index === picked) cls += " is-wrong";
                  else cls += " is-dim";
                }
                return (
                  <button
                    type="button"
                    key={`${question.id}-${option}`}
                    className={cls}
                    disabled={locked}
                    onClick={() => resolve(index, false)}
                  >
                    <span className="cr-opt-key" aria-hidden="true">{LETTERS[index]}</span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            {locked && (
              <div role="status">
                <p className={`cr-hint ${picked === question.answer ? "is-ok" : "is-no"}`}>
                  {timedOut
                    ? `時間到！正確答案是「${question.options[question.answer]}」`
                    : picked === question.answer
                      ? "答對了，太棒了！"
                      : `再想想，正確答案是「${question.options[question.answer]}」`}
                </p>
                {variant === "trap" && question.trapNote && picked !== question.answer && (
                  <p className="cr-trap-note"><b>避開陷阱</b>{question.trapNote}</p>
                )}
                {question.explanation && (
                  <p className="cr-explain">{question.explanation}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
