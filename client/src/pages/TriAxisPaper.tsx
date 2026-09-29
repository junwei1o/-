import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ChevronRight, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { useQuestionBank } from "@/lib/questionBank";
import type { PaperQuestion } from "@/lib/paperExam";
import { loadUserPreferences } from "@/game/adaptiveLearning";
import { recordExamCloud } from "@/game/cloudSync";
import { buildQuestionSpeechText } from "@/lib/speechSynthesis";
import { TriSpeechPanel } from "@/components/TriSpeechPanel";
import { TriResultBoard } from "@/components/TriResultBoard";
import {
  clearTriAxisProgress,
  loadTriAxisProgress,
  saveTriAxisProgress,
  type TriAxisAnswerEntry,
} from "@/lib/triAxisProgress";
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
  const { questions: bankRows, isLoading, isExpanding } = useQuestionBank({ eager: false });

  const [deck, setDeck] = useState<TriAxisQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  /** 每次重新開始都換一個 seed，避免題目順序永遠一樣。 */
  const [seed, setSeed] = useState(() => (Date.now() ^ 0x5f3759df) >>> 0);
  /** 試卷計時起點（試卷時間用）；草稿恢復時沿用原起點。 */
  const startedAtRef = useRef<number>(Date.now());
  /** 結算是否已上報排行榜（避免 StrictMode／重複 effect 重複寫入）。 */
  const reportedRef = useRef<string | null>(null);
  /**
   * 上一次的試卷：重做時傳給 buildTriAxisPaper，保證選項排列與上次不同。
   * 注意 deck 在組卷 effect 內被 set，為避免 effect 依賴它造成循環，
   * 這裡用 ref 持有（寫入不觸發重組，讀取永遠是最新）。
   */
  const previousDeckRef = React.useRef<TriAxisQuestion[] | null>(null);

  const allQuestions = bankRows as PaperQuestion[];

  // 題庫未載入時的骨架屏
  const isBankReady = allQuestions.length > 0;
  const isBankLoading = isLoading || isExpanding || !isBankReady;

  // 組卷：題庫載入後才組（離線時由本地題庫提供，因此不會卡住）。
  useEffect(() => {
    if (!isBankReady) return;
    const built = buildTriAxisPaper({
      questions: allQuestions,
      records: getLearningRecord(),
      preferences: loadUserPreferences(),
      seed,
      previousDeck: previousDeckRef.current ?? undefined,
    });
    previousDeckRef.current = built.questions;
    // 草稿恢復：不要求 deck 完全相同（作答會寫學習紀錄、改變下次題池，
    // 全等校驗答錯即失效）。改為逐題映射：草稿裡每題只要在新 deck 找得到，
    // 就恢復該題答案；找不到的丟棄；新 deck 完全不含草稿題則清草稿重來。
    // seed 不再從草稿還原——每次 mount 都是新 seed，重開即新卷（符合 R4）。
    const saved = loadTriAxisProgress();
    const deckById = new Map(built.questions.map((question) => [question.id, question]));
    const restoredAnswers: Record<string, number> = {};
    let restoredCount = 0;
    if (saved !== null) {
      for (const [questionId, entry] of Object.entries(saved.answers)) {
        if (deckById.has(questionId)) {
          restoredAnswers[questionId] = (entry as TriAxisAnswerEntry).picked;
          restoredCount += 1;
        }
      }
    }
    if (saved !== null && restoredCount > 0) {
      startedAtRef.current = saved.startedAt;
      // index 恢復到「第一個未作答且仍在 deck 的位置」，找不到就停在第 0 題。
      let restoreIndex = built.questions.findIndex(
        (question) => !(question.id in restoredAnswers),
      );
      if (restoreIndex < 0) restoreIndex = 0;
      setDeck(built.questions);
      setIndex(restoreIndex);
      setAnswers(restoredAnswers);
      setPicked(restoredAnswers[built.questions[restoreIndex]?.id ?? ""] ?? null);
      setFinished(false);
    } else {
      if (saved !== null) clearTriAxisProgress();
      setDeck(built.questions);
      setIndex(0);
      setPicked(null);
      setAnswers({});
      setFinished(false);
      startedAtRef.current = Date.now();
      reportedRef.current = null;
    }
  }, [allQuestions, seed]);

  const current = deck?.[index];

  const handlePick = useCallback(
    (optionIndex: number) => {
      if (!current || !deck || picked !== null) return;
      const correct = optionIndex === current.answer;
      const answeredAt = Date.now();
      setPicked(optionIndex);
      setAnswers((prev) => {
        const next = { ...prev, [current.id]: optionIndex };
        // 作答即存檔：重整後作答內容不遺失。
        const entries: Record<string, TriAxisAnswerEntry> = {};
        for (const [questionId, pickedIndex] of Object.entries(next)) {
          entries[questionId] = {
            picked: pickedIndex,
            answeredAt: questionId === current.id ? answeredAt : Date.now(),
          };
        }
        saveTriAxisProgress({
          seed,
          index,
          answers: entries,
          startedAt: startedAtRef.current,
          deckIds: deck.map((question) => question.id),
        });
        return next;
      });
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
    [current, deck, picked, seed, index],
  );

  const handleNext = useCallback(() => {
    if (!deck) return;
    if (index + 1 >= deck.length) {
      setFinished(true);
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setPicked(null);
    // 換題即存檔：重整後可回到同一題。
    const entries: Record<string, TriAxisAnswerEntry> = {};
    for (const [questionId, pickedIndex] of Object.entries(answers)) {
      entries[questionId] = { picked: pickedIndex, answeredAt: Date.now() };
    }
    saveTriAxisProgress({
      seed,
      index: nextIndex,
      answers: entries,
      startedAt: startedAtRef.current,
      deckIds: deck.map((question) => question.id),
    });
  }, [deck, index, answers, seed]);

  const handleRestart = useCallback(() => {
    clearTriAxisProgress();
    reportedRef.current = null;
    setSeed((Date.now() ^ 0x9e3779b9) >>> 0);
  }, []);

  const handleClearProgress = useCallback(() => {
    clearTriAxisProgress();
    reportedRef.current = null;
    setSeed((Date.now() ^ 0x9e3779b9) >>> 0);
  }, []);

  const score = useMemo(
    () => (deck ? scoreTriAxisPaper(deck, answers) : null),
    [deck, answers],
  );

  // 結算即上報排行榜：只寫一次（reportedRef 擋 StrictMode 重跑）。
  // sessionKey 帶 seed，同一份卷重複結算會覆蓋而非重複入榜。
  useEffect(() => {
    if (!finished || !score || !deck || deck.length === 0) return;
    if (reportedRef.current === `${seed}-${deck.length}`) return;
    reportedRef.current = `${seed}-${deck.length}`;
    const finishedAt = Date.now();
    const durationSec = Math.max(0, Math.round((finishedAt - startedAtRef.current) / 1000));
    const detail = {
      scope: "三軸混編試卷",
      weekKey: null,
      topics: deck.map((question) => ({
        questionId: question.id,
        subject: question.subject,
        topic: question.learningTopic ?? "",
        grade: question.grade,
        difficulty: question.difficulty,
        correct: answers[question.id] === question.answer,
      })),
    };
    recordExamCloud({
      subject: "三軸混編試卷",
      totalQuestions: score.total,
      correctCount: score.correct,
      detail,
      sessionKey: `tri-axis-${seed}`,
      durationSec,
    });
    clearTriAxisProgress();
  }, [finished, score, deck, answers, seed]);

  // 結算頁朗讀文字：分數＋各軸表現。
  const resultSpeechText = useMemo(() => {
    if (!score) return "";
    const parts = AXIS_ORDER.map(
      (axis) => `${AXIS_META[axis].name}答對 ${score.byAxis[axis].correct} 題，共 ${score.byAxis[axis].total} 題`,
    );
    return `本次航行結果：共 ${score.total} 題，答對 ${score.correct} 題，正確率 ${score.percentage}％。${parts.join("；")}。`;
  }, [score]);

  // 當前題朗讀文字：題幹＋選項。
  const questionSpeechText = useMemo(() => {
    if (!current) return "";
    return buildQuestionSpeechText(current.prompt, current.options);
  }, [current]);

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
        <button
          type="button"
          className="tri-paper-clear"
          onClick={() => {
            if (window.confirm("要清除這份試卷的作答進度並重新開始嗎？")) handleClearProgress();
          }}
          aria-label="清除作答進度並重新開始"
        >
          <Trash2 size={14} aria-hidden="true" /> 清除進度
        </button>
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

      {isBankLoading ? (
        <div className="tri-paper-skeleton" role="status" aria-busy="true" aria-label="正在準備題目">
          <div className="tri-paper-skeleton-header" />
          <div className="tri-paper-skeleton-legend" />
          <div className="tri-paper-skeleton-q" />
        </div>
      ) : !deck || deck.length === 0 ? (
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
          <TriSpeechPanel text={resultSpeechText} label="朗讀本次結果" />
          <TriResultBoard score={score} seed={seed} />
          <div className="tri-result-actions">
            <button type="button" className="tri-btn tri-btn--primary" onClick={handleRestart}>
              <RotateCcw size={16} aria-hidden="true" /> 再來一張
            </button>
            <button type="button" className="tri-btn" onClick={() => setLocation("/answer-board")}>
              查看答題榜
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
          <TriSpeechPanel text={questionSpeechText} label="朗讀題目" />

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
