import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import { useQuestionBank } from "@/lib/questionBank";
import type { PaperQuestion } from "@/lib/paperExam";
import { loadUserPreferences } from "@/game/adaptiveLearning";
import { addRecord, getLearningRecord, recordAnalyticsEvent } from "@/utils/storage";
import {
  AXIS_META,
  AXIS_ORDER,
  buildTriAxisPaper,
  scoreTriAxisPaper,
  type PaperAxis,
  type TriAxisQuestion,
} from "@/lib/triAxisPaper";
import "./TriAxisPaper.css";

/** 軸別 → CSS 修飾詞（用於品牌色的軸別徽章與圖例）。 */
function axisClass(axis: PaperAxis): string {
  return axis === "過去" ? "is-past" : axis === "現在" ? "is-now" : "is-next";
}

/** 選項標籤：沿用站上慣例 —— 是非題用 ○／✕，其餘用 A、B、C…。 */
function optionLabel(index: number, question: PaperQuestion): string {
  if (question.questionType === "是非題") return index === 0 ? "○" : "✕";
  return String.fromCharCode(65 + index);
}

/**
 * 三軸混編試卷。
 *
 * 以「過去／現在／未來」三條時間軸交錯出題：錯題魔王（過去）→ 當前航段（現在）
 * → 未探海域（未來），科目與難度全部打散混編，不按科目分區。
 * 作答結果寫回既有的學習紀錄（與 /practice 共用同一份），因此能累積到弱點分析。
 */
export default function TriAxisPaper() {
  const [, setLocation] = useLocation();
  const { questions: bankRows } = useQuestionBank();

  const [deck, setDeck] = useState<TriAxisQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  /** 每次重新開始都換一個 seed，避免題目順序永遠一樣。 */
  const [seed, setSeed] = useState(() => (Date.now() ^ 0x5f3759df) >>> 0);
  /**
   * 上一次的試卷：重做時傳給 buildTriAxisPaper，保證選項排列與上次不同。
   * 注意 deck 在組卷 effect 內被 set，為避免 effect 依賴它造成循環，
   * 這裡用 ref 持有（寫入不觸發重組，讀取永遠是最新）。
   */
  const previousDeckRef = React.useRef<TriAxisQuestion[] | null>(null);

  const allQuestions = bankRows as PaperQuestion[];

  // 組卷：題庫載入後才組（離線時由本地題庫提供，因此不會卡住）。
  useEffect(() => {
    if (allQuestions.length === 0) return;
    const built = buildTriAxisPaper({
      questions: allQuestions,
      records: getLearningRecord(),
      preferences: loadUserPreferences(),
      seed,
      previousDeck: previousDeckRef.current ?? undefined,
    });
    previousDeckRef.current = built.questions;
    setDeck(built.questions);
    setIndex(0);
    setPicked(null);
    setAnswers({});
    setFinished(false);
  }, [allQuestions, seed]);

  const current = deck?.[index];

  const handlePick = useCallback(
    (optionIndex: number) => {
      if (!current || picked !== null) return;
      const correct = optionIndex === current.answer;
      setPicked(optionIndex);
      setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }));
      // 寫回既有學習紀錄，讓這裡的作答也進入弱點分析與錯題本。
      addRecord({
        questionId: current.id,
        subject: current.subject,
        isCorrect: correct,
        timestamp: Date.now(),
        flagged: false,
        difficulty: current.difficulty as never,
      });
      recordAnalyticsEvent({
        type: "answer",
        subject: current.subject,
        questionId: current.id,
        correct,
        timestamp: Date.now(),
      });
    },
    [current, picked],
  );

  const handleNext = useCallback(() => {
    if (!deck) return;
    if (index + 1 >= deck.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }, [deck, index]);

  const handleRestart = useCallback(() => {
    setSeed((Date.now() ^ 0x9e3779b9) >>> 0);
  }, []);

  const score = useMemo(
    () => (deck ? scoreTriAxisPaper(deck, answers) : null),
    [deck, answers],
  );

  const headline = deck?.length ? `${index + 1} / ${deck.length}` : "—";

  return (
    <main className="tri-paper" aria-label="三軸混編試卷">
      <header className="tri-paper-head">
        <button type="button" className="tri-paper-back" onClick={() => setLocation("/")}>
          <ArrowLeft size={16} aria-hidden="true" /> 回航海儀表板
        </button>
        <p className="tri-paper-eyebrow">PAST · NOW · NEXT</p>
        <h1>三軸混編試卷</h1>
        <p className="tri-paper-desc">
          三條時間軸交錯出題，科目與難度全部打散：先回顧跌倒的地方，再鞏固正在學的，最後看一眼前方的挑戰。
        </p>
      </header>

      <ol className="tri-axis-legend" aria-label="三條時間軸">
        {AXIS_ORDER.map((axis) => (
          <li key={axis} className={`tri-axis-legend-item ${axisClass(axis)}`}>
            <strong>{axis}</strong>
            <span className="tri-axis-legend-name">{AXIS_META[axis].name}</span>
            <span className="tri-axis-legend-status">{AXIS_META[axis].status}</span>
          </li>
        ))}
      </ol>

      {!deck || deck.length === 0 ? (
        <p className="tri-paper-loading" role="status">正在準備題目…</p>
      ) : finished && score ? (
        <section className="tri-result" aria-labelledby="tri-result-title">
          <p className="tri-paper-eyebrow">VOYAGE REPORT</p>
          <h2 id="tri-result-title">本次航行結果</h2>
          <p className="tri-result-score">
            <strong>{score.correct}</strong>
            <span> / {score.total} 題（{score.percentage}%）</span>
          </p>
          <ul className="tri-result-axes" aria-label="各時間軸表現">
            {AXIS_ORDER.map((axis) => (
              <li key={axis} className={axisClass(axis)}>
                <span className="tri-result-axis-name">{AXIS_META[axis].name}</span>
                <strong>
                  {score.byAxis[axis].correct} / {score.byAxis[axis].total}
                </strong>
              </li>
            ))}
          </ul>
          <div className="tri-result-actions">
            <button type="button" className="tri-btn tri-btn--primary" onClick={handleRestart}>
              <RotateCcw size={16} aria-hidden="true" /> 再來一張
            </button>
            <button type="button" className="tri-btn" onClick={() => setLocation("/")}>
              回航海儀表板
            </button>
          </div>
        </section>
      ) : current ? (
        <section className="tri-q" aria-labelledby="tri-q-prompt">
          <div className="tri-q-top">
            <span className={`tri-axis-badge ${axisClass(current.axis)}`}>
              <Sparkles size={13} aria-hidden="true" />
              {current.axis} · {AXIS_META[current.axis].name}
            </span>
            <span className="tri-q-progress" aria-label={`第 ${index + 1} 題，共 ${deck.length} 題`}>
              {headline}
            </span>
          </div>
          <p className="tri-q-meta">
            {current.subject} · {current.grade} 年級 · {current.difficulty} — {AXIS_META[current.axis].status}
          </p>
          <h2 id="tri-q-prompt" className="tri-q-prompt">{current.prompt}</h2>

          <div className="tri-q-options" role="group" aria-label="選項">
            {current.options.map((option, optionIndex) => {
              const isAnswer = optionIndex === current.answer;
              const isPicked = picked === optionIndex;
              const state =
                picked === null ? "" : isAnswer ? " is-correct" : isPicked ? " is-wrong" : " is-dim";
              return (
                <button
                  key={`${current.id}-${optionIndex}`}
                  type="button"
                  className={`tri-q-option${state}`}
                  disabled={picked !== null}
                  aria-pressed={isPicked}
                  onClick={() => handlePick(optionIndex)}
                >
                  <span className="tri-q-letter" aria-hidden="true">{optionLabel(optionIndex, current)}</span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>

          {picked !== null ? (
            <div className="tri-q-feedback" role="status" aria-live="polite">
              <strong>{picked === current.answer ? "答對了" : "再看一次"}</strong>
              <p>{current.explanation}</p>
            </div>
          ) : null}

          {picked !== null ? (
            <button type="button" className="tri-btn tri-btn--primary tri-q-next" onClick={handleNext}>
              {index + 1 >= deck.length ? "看本次結果" : "下一題"}
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
