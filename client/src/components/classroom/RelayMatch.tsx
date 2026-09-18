import React, { useMemo, useRef, useState } from "react";
import MatchingGame from "@/components/MatchingGame";
import { useClassroomSound } from "./useClassroomSound";
import { buildRelayRounds, type RelayRound } from "@/lib/classroomBank";
import type { MatchingResult } from "@/lib/matchingBank";
import "./classroom.css";

type Props = {
  muted?: boolean;
  onExit: () => void;
  onBest?: (record: { stars: number; correct: number; total: number }) => void;
  bestStars?: number;
};

type Phase = "start" | "play" | "result";
type Stage = "choice" | "matching";

/**
 * 選擇→配對接力：每回合先答 1 題選擇題取得線索，再完成 1 盤迷你配對（4 對＋1 干擾），
 * 共 3 回合。選擇題答錯會顯示正解但不阻斷（教育取向），配對盤成績合計星等。
 */
export default function RelayMatch({ muted = false, onExit, onBest, bestStars }: Props) {
  const rounds = useMemo<RelayRound[]>(() => buildRelayRounds(3), []);
  const [phase, setPhase] = useState<Phase>("start");
  const [roundIndex, setRoundIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("choice");
  const [picked, setPicked] = useState<number | null>(null);
  const [choiceErrors, setChoiceErrors] = useState(0);
  const [matchStars, setMatchStars] = useState(0);
  const [matchErrors, setMatchErrors] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const reportedRef = useRef(false);
  const play = useClassroomSound(muted);

  const round = rounds[roundIndex];

  function begin() {
    setPhase("play");
    setRoundIndex(0);
    setStage("choice");
    setPicked(null);
    setChoiceErrors(0);
    setMatchStars(0);
    setMatchErrors(0);
    setNewBest(false);
    reportedRef.current = false;
    window.scrollTo({ top: 0 });
  }

  function pick(index: number) {
    if (picked !== null) return;
    setPicked(index);
    const q = round.choice;
    if (index === q.answer) {
      play("ok");
    } else {
      play("no");
      setChoiceErrors((n) => n + 1);
    }
    window.setTimeout(() => {
      setStage("matching");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, index === q.answer ? 700 : 2000);
  }

  function onMatchingComplete(result: MatchingResult) {
    setMatchStars((s) => s + result.stars);
    setMatchErrors((e) => e + result.errors);
  }

  function nextRound() {
    if (roundIndex + 1 >= rounds.length) {
      setPhase("result");
      play("win");
      // 三盤配對滿分 9 星，換算 1–3 星：≥8→3、≥6→2，其餘 1。
      const stars = matchStars >= 8 ? 3 : matchStars >= 6 ? 2 : 1;
      if (!reportedRef.current && stars > (bestStars ?? 0)) {
        reportedRef.current = true;
        setNewBest(true);
        onBest?.({ stars, correct: matchStars, total: rounds.length * 3 });
      }
      window.scrollTo({ top: 0 });
      return;
    }
    setRoundIndex((i) => i + 1);
    setStage("choice");
    setPicked(null);
    window.scrollTo({ top: 0 });
  }

  if (phase === "start") {
    return (
      <div className="cr-page">
        <div className="cr-top"><button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button></div>
        <div className="cr-start">
          <span className="cr-start-emoji" aria-hidden="true">🔗</span>
          <h2>選擇→配對接力</h2>
          <p>每個關卡先答一題選擇題取得線索，答對就解鎖一盤迷你配對；連過三關才算完成接力！</p>
          <div className="cr-rules">
            <span className="cr-rule-chip">共 3 關</span>
            <span className="cr-rule-chip">選擇題 30 秒</span>
            <span className="cr-rule-chip">配對 4 對＋1 干擾</span>
            <span className="cr-rule-chip">答錯不阻斷、會顯示正解</span>
          </div>
          <button type="button" className="cr-btn" onClick={begin}>開始接力</button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const stars = matchStars >= 8 ? 3 : matchStars >= 6 ? 2 : 1;
    return (
      <div className="cr-page">
        <div className="cr-result" role="status" aria-label="接力結果">
          <p className="cr-result-kicker">接力完成</p>
          <h2 className="cr-result-title">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</h2>
          <p className="cr-result-sub">三關配對共獲 {matchStars} / {rounds.length * 3} 星</p>
          <p className="cr-result-metric">配對失誤 {matchErrors} 次 · 選擇題失誤 {choiceErrors} 次</p>
          {newBest && <span className="cr-result-newbest">寫下新紀錄！</span>}
          <div className="cr-actions">
            <button type="button" className="cr-btn-ghost" onClick={onExit}>回我的教室</button>
            <button type="button" className="cr-btn sea" onClick={begin}>再接力一次</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-page">
      <div className="cr-top">
        <button type="button" className="cr-back" onClick={onExit}>← 回我的教室</button>
        <span className="cr-tag orange">第 {roundIndex + 1} / {rounds.length} 關</span>
      </div>

      <div className="cr-relay-stage" aria-label="接力進度">
        {stage === "choice" ? "第一步：答對選擇題，解鎖配對盤" : "第二步：完成迷你配對盤"}
        <span className="cr-relay-dots">
          {rounds.map((_, i) => (
            <span
              key={i}
              className={`cr-relay-dot ${i < roundIndex ? "done" : i === roundIndex ? "now" : ""}`}
            />
          ))}
        </span>
      </div>

      {stage === "choice" ? (
        <div className="cr-q-card">
          <span className="cr-q-meta">{round.choice.subject} · {round.choice.learningTopic}</span>
          <p className="cr-q-prompt">{round.choice.prompt}</p>
          <div className="cr-options">
            {round.choice.options.map((option, index) => {
              let cls = "cr-option";
              if (picked !== null) {
                if (index === round.choice.answer) cls += " is-correct";
                else if (index === picked) cls += " is-wrong";
                else cls += " is-dim";
              }
              return (
                <button
                  type="button"
                  key={`${round.id}-${option}`}
                  className={cls}
                  disabled={picked !== null}
                  onClick={() => pick(index)}
                >
                  <span className="cr-opt-key" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div role="status">
              <p className={`cr-hint ${picked === round.choice.answer ? "is-ok" : "is-no"}`}>
                {picked === round.choice.answer ? "答對了，配對盤解鎖！" : `正確答案是「${round.choice.options[round.choice.answer]}」，配對盤還是解鎖了`}
              </p>
              {round.choice.explanation && <p className="cr-explain">{round.choice.explanation}</p>}
            </div>
          )}
        </div>
      ) : (
        <>
          <MatchingGame
            key={round.id}
            set={round.matching}
            muted={muted}
            timeLimitMs={30_000}
            onComplete={onMatchingComplete}
            resultActions={
              <button type="button" className="cr-btn sea" onClick={nextRound}>
                {roundIndex + 1 >= rounds.length ? "看接力結果 →" : "前進下一關 →"}
              </button>
            }
          />
        </>
      )}
    </div>
  );
}
