import React, { useCallback, useEffect, useRef, useState } from "react";
import { useClassroomSound } from "./useClassroomSound";
import { shuffleArray } from "@/lib/matchingBank";
import type { RunnerQuestion } from "./QuizRunner";
import "./classroom.css";

type Props = {
  variant: "choice" | "tf" | "mixed";
  emoji: string;
  tag: string;
  tagClass?: string;
  startTitle: string;
  startDesc: string;
  rules: string[];
  questions: RunnerQuestion[];
  durationMs?: number;
  muted?: boolean;
  bestScore?: number;
  onBest?: (record: { score: number; maxCombo: number; correct: number; answered: number }) => void;
  onExit: () => void;
};

type Phase = "start" | "play" | "result";

/**
 * 限時接力（choice，四選一）／是非閃電（tf，對錯大鍵）／閃電接力（mixed，是非＋四選一混牌堆）：
 * 30 秒內循環連答，答對 +10、二連對起每連 +5，答錯中斷連對並顯示正解。
 * mixed 模式逐題判斷：選項只有兩個（正確／錯誤）就出對錯大鍵，否則出四選一。
 */
export default function RushRunner({
  variant,
  emoji,
  tag,
  tagClass,
  startTitle,
  startDesc,
  rules,
  questions,
  durationMs = 30_000,
  muted = false,
  bestScore,
  onBest,
  onExit,
}: Props) {
  const total = questions.length;
  const [phase, setPhase] = useState<Phase>("start");
  const [order, setOrder] = useState<number[]>(() => questions.map((_, i) => i));
  const [qIndex, setQIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(Math.round(durationMs / 1000));
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [newBest, setNewBest] = useState(false);

  const deadlineRef = useRef(0);
  const completedRef = useRef(false);
  const lockedRef = useRef(false);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const correctRef = useRef(0);
  const answeredRef = useRef(0);
  const advanceRef = useRef<number | null>(null);
  const play = useClassroomSound(muted);

  const question = questions[order[qIndex]];
  // mixed 模式：本題選項只有兩個＝是非題，出對錯大鍵；其餘出四選一。
  const isTfQuestion = variant === "tf" || (variant === "mixed" && question?.options.length === 2);

  const clearAdvance = () => {
    if (advanceRef.current !== null) {
      window.clearTimeout(advanceRef.current);
      advanceRef.current = null;
    }
  };

  const begin = useCallback(() => {
    completedRef.current = false;
    lockedRef.current = false;
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    correctRef.current = 0;
    answeredRef.current = 0;
    setScore(0); setCombo(0); setMaxCombo(0); setCorrect(0); setAnswered(0);
    setOrder(shuffleArray(questions.map((_, i) => i)));
    setQIndex(0);
    setPicked(null);
    setLocked(false);
    setNewBest(false);
    setTimeLeft(Math.round(durationMs / 1000));
    setPhase("play");
    deadlineRef.current = Date.now() + durationMs;
    window.scrollTo({ top: 0 });
  }, [durationMs, questions]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearAdvance();
    setPhase("result");
    play("win");
    if (scoreRef.current > (bestScore ?? 0)) {
      setNewBest(true);
      onBest?.({ score: scoreRef.current, maxCombo: maxComboRef.current, correct: correctRef.current, answered: answeredRef.current });
    }
    window.scrollTo({ top: 0 });
  }, [bestScore, onBest, play]);

  const advance = useCallback(() => {
    clearAdvance();
    setPicked(null);
    setLocked(false);
    lockedRef.current = false;
    setQIndex((i) => (i + 1) % total);
  }, [total]);

  function pick(index: number) {
    if (lockedRef.current || completedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    setPicked(index);
    answeredRef.current += 1;
    setAnswered(answeredRef.current);
    const isCorrect = index === question.answer;
    if (isCorrect) {
      comboRef.current += 1;
      const gained = 10 + (comboRef.current >= 2 ? (comboRef.current - 1) * 5 : 0);
      scoreRef.current += gained;
      correctRef.current += 1;
      maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
      setScore(scoreRef.current);
      setCombo(comboRef.current);
      setMaxCombo(maxComboRef.current);
      setCorrect(correctRef.current);
      play("ok");
      advanceRef.current = window.setTimeout(advance, 550);
    } else {
      comboRef.current = 0;
      setCombo(0);
      play("no");
      advanceRef.current = window.setTimeout(advance, 1100);
    }
  }

  // 總倒數
  useEffect(() => {
    if (phase !== "play") return;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 5 && left > 0) play("tick");
      if (left <= 0) finish();
    }, 200);
    return () => window.clearInterval(timer);
  }, [phase, finish, play]);

  useEffect(() => () => clearAdvance(), []);

  if (phase === "start") {
    return (
      <div className="cr-page">
        <div className="cr-top"><button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button></div>
        <div className="cr-start">
          <span className="cr-start-emoji" aria-hidden="true">{emoji}</span>
          <h2>{startTitle}</h2>
          <p>{startDesc}</p>
          <div className="cr-rules">{rules.map((r) => <span className="cr-rule-chip" key={r}>{r}</span>)}</div>
          <button type="button" className="cr-btn" onClick={begin}>開始 {Math.round(durationMs / 1000)} 秒</button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="cr-page">
        <div className="cr-result" role="status" aria-label="挑戰結果">
          <p className="cr-result-kicker">{tag}結束</p>
          <h2 className="cr-result-title num">{score} 分</h2>
          <p className="cr-result-sub">答對 {correct} / {answered} 題 · 最高連對 {maxCombo} 連</p>
          <p className="cr-result-metric">{Math.round(durationMs / 1000)} 秒內循環挑戰 {total} 題題庫</p>
          {newBest && <span className="cr-result-newbest">寫下新紀錄！</span>}
          <div className="cr-actions">
            <button type="button" className="cr-btn-ghost" onClick={onExit}>回我的教室</button>
            <button type="button" className="cr-btn sea" onClick={begin}>再戰一輪</button>
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
        <span className={`cr-stat cr-countdown${timeLeft <= 5 ? " is-urgent" : ""}`} role="timer">⏱ {timeLeft}s</span>
      </div>

      <div className="cr-stats">
        <span className="cr-stat">得分 <b>{score}</b></span>
        <span className="cr-stat">連對 <b>{combo}</b></span>
        <span className="cr-stat">答對 <b>{correct}</b></span>
      </div>

      <div className="cr-q-card" key={`${qIndex}-${answered}`}>
        <span className="cr-q-meta">{isTfQuestion ? "是非判斷" : `${question.meta ?? "選擇題"}`}</span>
        <p className="cr-q-prompt">{question.prompt}</p>

        {isTfQuestion ? (
          <div className="cr-tf-options">
            {question.options.map((option, index) => {
              let cls = "cr-tf-btn " + (index === 0 ? "cr-tf-yes" : "cr-tf-no");
              if (locked) {
                if (index === question.answer) cls += " is-correct";
                else if (index === picked) cls += " is-wrong";
                else cls += " is-dim";
              }
              return (
                <button
                  type="button"
                  key={option}
                  className={cls}
                  disabled={locked}
                  onClick={() => pick(index)}
                >
                  {index === 0 ? "○" : "✕"}
                  <small>{option}</small>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="cr-options">
            {question.options.map((option, index) => {
              let cls = "cr-option";
              if (locked) {
                if (index === question.answer) cls += " is-correct";
                else if (index === picked) cls += " is-wrong";
                else cls += " is-dim";
              }
              return (
                <button type="button" key={`${question.id}-${option}`} className={cls} disabled={locked} onClick={() => pick(index)}>
                  <span className="cr-opt-key" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        )}

        {locked && picked !== question.answer && (
          <p className="cr-hint is-no" role="status">正確答案是「{question.options[question.answer]}」</p>
        )}
        {locked && picked === question.answer && combo >= 2 && (
          <p className="cr-hint is-ok" role="status">連對 {combo} 連！繼續保持！</p>
        )}
      </div>

      <p className="cr-result-metric" style={{ textAlign: "center", marginTop: 10 }}>
        答對 +10 分，連對每連再 +5 分
      </p>
    </div>
  );
}
