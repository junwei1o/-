import React, { useEffect, useState } from "react";
import { Compass, Trophy } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { ALL_CURRICULUM_QUESTIONS } from "@/game/expeditionContent";
import { getSelfChallengeBest, saveSelfChallengeBest } from "@/utils/storage";

type ChallengeQuestion = (typeof ALL_CURRICULUM_QUESTIONS)[number];
const CHALLENGE_LENGTH = 10;
const TIMED_CHALLENGE_SECONDS = 60;

export default function CommunityHub() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const isTimedChallenge = new URLSearchParams(search).get("mode") === "timed";
  const [challengeCount, setChallengeCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<ChallengeQuestion | null>(() => ALL_CURRICULUM_QUESTIONS[0] ?? null);
  const [feedback, setFeedback] = useState("完成十題後，會更新你的個人最佳紀錄。");
  const [best, setBest] = useState(() => getSelfChallengeBest());
  const [secondsLeft, setSecondsLeft] = useState(TIMED_CHALLENGE_SECONDS);
  const [challengeEnded, setChallengeEnded] = useState(false);

  useEffect(() => {
    if (!isTimedChallenge || challengeEnded || challengeCount >= CHALLENGE_LENGTH) return;
    const timer = window.setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1_000);
    return () => window.clearInterval(timer);
  }, [isTimedChallenge, challengeEnded, challengeCount]);

  useEffect(() => {
    if (!isTimedChallenge || secondsLeft > 0 || challengeEnded || challengeCount >= CHALLENGE_LENGTH) return;
    setChallengeEnded(true);
    setFeedback("時間到。本回合已依目前作答數更新或保留個人最佳紀錄。");
    setBest(saveSelfChallengeBest({ completed: challengeCount, correct: correctCount }));
  }, [isTimedChallenge, secondsLeft, challengeEnded, challengeCount, correctCount]);

  function answerChallenge(index: number) {
    if (!currentQuestion || challengeEnded || challengeCount >= CHALLENGE_LENGTH) return;
    const correct = index === currentQuestion.answer;
    const completed = challengeCount + 1;
    const nextCorrect = correctCount + (correct ? 1 : 0);
    setChallengeCount(completed);
    setCorrectCount(nextCorrect);
    setFeedback(correct ? "答對了。保留這條線索，再看下一題。" : `這題的重點是：${currentQuestion.explanation}`);
    if (completed >= CHALLENGE_LENGTH) {
      const nextBest = saveSelfChallengeBest({ completed, correct: nextCorrect });
      setBest(nextBest);
      setChallengeEnded(true);
      return;
    }
    setCurrentQuestion(ALL_CURRICULUM_QUESTIONS[(completed * 7) % ALL_CURRICULUM_QUESTIONS.length] ?? null);
  }

  function restartChallenge() {
    setChallengeCount(0);
    setCorrectCount(0);
    setCurrentQuestion(ALL_CURRICULUM_QUESTIONS[0] ?? null);
    setSecondsLeft(TIMED_CHALLENGE_SECONDS);
    setChallengeEnded(false);
    setFeedback(isTimedChallenge ? "60 秒限時挑戰已開始，依自己的節奏作答。" : "新的十題自我挑戰已開始；這裡只記錄你自己的學習軌跡。");
  }

  return <main className="community-page" aria-labelledby="self-challenge-title"><div className="community-inner">
    <button type="button" className="settings-back-button" onClick={() => setLocation("/")}>← 返回學習儀表板</button>
    <header className="community-header"><p className="settings-eyebrow">個人學習軌跡</p><h1 id="self-challenge-title">{isTimedChallenge ? "限時挑戰" : "自我挑戰"}</h1><p>{isTimedChallenge ? "在 60 秒內完成盡可能多的題目，只記錄你的個人學習軌跡。" : "以十題為一回合，專注整理自己的學習線索與成長節奏。"}</p><button type="button" className="settings-secondary-button community-duel-link" onClick={() => setLocation("/knowledge-duel")}>前往知識決鬥</button></header>
    <section className="community-card" aria-labelledby="best-title"><div className="learning-report-card-title"><Trophy size={19} aria-hidden="true" /><h2 id="best-title">個人最佳紀錄</h2></div><div className="community-progress"><i style={{ width: `${Math.min(100, best.completed * 10)}%` }} /></div><strong>{best.completed ? `${best.correct} / ${best.completed} 題答對` : "尚未完成自我挑戰"}</strong><p>{best.updatedAt ? `最近更新：${new Date(best.updatedAt).toLocaleDateString("zh-TW")}` : "完成第一回十題挑戰後，這裡會留下你的個人最佳紀錄。"}</p></section>
    <section className="community-card" aria-labelledby="challenge-title"><div className="learning-report-card-title"><Compass size={19} aria-hidden="true" /><h2 id="challenge-title">本回合練習</h2></div><p>進度 {challengeCount}/{CHALLENGE_LENGTH} 題 · 本回合答對 {correctCount} 題 {isTimedChallenge ? `· 剩餘 ${secondsLeft} 秒` : ""}</p><div className="community-progress"><i style={{ width: `${challengeCount * 10}%` }} /></div>{!challengeEnded && challengeCount < CHALLENGE_LENGTH && currentQuestion ? <div className="community-question"><p className="settings-eyebrow">{currentQuestion.topic}</p><h3>{currentQuestion.prompt}</h3><div className="community-question-options">{currentQuestion.options.map((option: string, index: number) => <button key={`${currentQuestion.id}-${index}`} type="button" className="settings-secondary-button" onClick={() => answerChallenge(index)}>{option}</button>)}</div><p role="status" aria-live="polite">{feedback}</p></div> : <div className="community-actions"><p className="learning-goal-success" role="status">{isTimedChallenge ? `本回合結束：答對 ${correctCount} / ${challengeCount} 題。` : `本回合完成：答對 ${correctCount} / ${CHALLENGE_LENGTH} 題。`} 已更新或保留個人最佳紀錄。</p><button type="button" className="settings-primary-button" onClick={restartChallenge}>開始下一回合</button></div>}</section>
  </div></main>;
}
