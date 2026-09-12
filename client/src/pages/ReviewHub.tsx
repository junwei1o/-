import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AlarmClock, CheckCircle2, Coins, RotateCcw, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useQuestionBank } from "@/lib/questionBank";
import { loadAdaptiveProfile, recordAdaptiveAttempt, saveAdaptiveProfile, type AdaptiveDifficulty } from "@/game/adaptiveLearning";
import { getPlayerData, updatePlayerData } from "@/utils/storage";
import { createWrongReviewReplacement, ensureTargetedPracticeLoaded } from "@/lib/targetedPractice";
import {
  collectDueReviews,
  buildReviewDeck,
  intervalDistribution,
  intervalLabel,
  isAdaptiveDifficulty,
  reviewProgress,
  type ReviewDeckItem,
} from "@/lib/reviewHub";
import "./ReviewHub.css";

/** 難度 → 金幣（基礎/標準/挑戰各 6/12/20，與學伴任務卡同一套經濟）。 */
function goldForDifficulty(d: AdaptiveDifficulty): number {
  return d === "挑戰" ? 20 : d === "標準" ? 12 : 6;
}

/** 難度 → 經驗（基礎/標準/挑戰各 5/10/18）。 */
function expForDifficulty(d: AdaptiveDifficulty): number {
  return d === "挑戰" ? 18 : d === "標準" ? 10 : 5;
}

function normalizeDifficulty(value: string | undefined): AdaptiveDifficulty {
  return isAdaptiveDifficulty(value) ? value : "標準";
}

type RoundSummary = {
  total: number;
  correct: number;
  goldEarned: number;
  expEarned: number;
  wrongCount: number;
};

export default function ReviewHub() {
  const [, setLocation] = useLocation();
  const { questions } = useQuestionBank();
  const [profile, setProfile] = useState(() => loadAdaptiveProfile());
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<RoundSummary | null>(null);
  const [targetedVersion, setTargetedVersion] = useState(0);
  /** 避免重複提交（React StrictMode 下不會雙倍寫紀錄）。 */
  const committedRef = useRef(false);

  // 備用題庫非同步載入：載入完成後重組一次卡片，讓變體替換生效。
  useEffect(() => {
    let cancelled = false;
    void ensureTargetedPracticeLoaded().then(() => {
      if (!cancelled) setTargetedVersion((version) => version + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const bankById = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const replace = useMemo(() => createWrongReviewReplacement(questions), [questions]);
  const due = useMemo(() => collectDueReviews(profile), [profile]);
  // targetedVersion 只作「備用題庫載入完成後重組」的信號，不參與計算。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deck = useMemo(() => buildReviewDeck(due, bankById, replace), [due, bankById, replace, targetedVersion]);
  const ladder = useMemo(() => intervalDistribution(profile), [profile]);
  const errorDueCount = useMemo(
    () => collectDueReviews(profile, Date.now(), 1000).filter((item) => item.source === "error").length,
    [profile],
  );

  const answeredCount = deck.filter((item) => answers[item.key] !== undefined).length;
  const correctCount = deck.filter((item) => answers[item.key] === item.display.answer).length;
  const progress = reviewProgress(deck.length, answeredCount, correctCount);
  const allAnswered = deck.length > 0 && progress.answered === deck.length;

  function pick(item: ReviewDeckItem, optionIndex: number) {
    if (summary) return;
    setAnswers((prev) => ({ ...prev, [item.key]: optionIndex }));
  }

  /**
   * 全部作答後由「完成整理本輪」按鈕觸發（而非答完最後一題自動提交），
   * 讓孩子能先看到每一題的解析回饋再結算。
   * 寫入方式與主流程一致：recordAdaptiveAttempt + saveAdaptiveProfile 單次寫入，
   * 答對晉級間隔節點、答錯重設回 20 分鐘節點；獎勵走 playerData 金幣/經驗。
   */
  function commitRound() {
    if (!allAnswered || committedRef.current || summary) return;
    committedRef.current = true;
    let nextProfile = loadAdaptiveProfile();
    let totalGold = 0;
    let totalExp = 0;
    let wrongCount = 0;

    for (const item of deck) {
      const correct = answers[item.key] === item.display.answer;
      if (!correct) wrongCount += 1;
      const original = bankById.get(item.recordQuestionId);
      const difficulty = normalizeDifficulty(item.display.difficulty);
      nextProfile = recordAdaptiveAttempt(nextProfile, {
        questionId: item.recordQuestionId,
        curriculumDomain: original?.curriculumDomain ?? "綜合領域",
        knowledge: (original?.knowledge?.length ? original.knowledge : [original?.learningTopic ?? item.display.learningTopic]).slice(0, 12),
        difficulty,
        correct,
        responseMs: 15_000,
        timeLimitMs: 25_000,
        hintsUsed: 0,
        flagged: !correct,
        ...(correct ? {} : { errorType: "memory" as const }),
      });
      if (correct) {
        totalGold += goldForDifficulty(difficulty);
        totalExp += expForDifficulty(difficulty);
      }
    }

    saveAdaptiveProfile(nextProfile);
    setProfile(nextProfile);

    const before = getPlayerData();
    updatePlayerData({
      gold: before.gold + totalGold,
      exp: before.exp + totalExp,
      totalAnswers: before.totalAnswers + deck.length,
    });

    setSummary({ total: deck.length, correct: deck.length - wrongCount, goldEarned: totalGold, expEarned: totalExp, wrongCount });

    queueMicrotask(() => {
      const accuracy = Math.round(((deck.length - wrongCount) / deck.length) * 100);
      toast.success(`今日複習完成：${deck.length - wrongCount}/${deck.length}（${accuracy}%）+${totalGold} 金幣 +${totalExp} 經驗`);
    });
  }

  function resetRound() {
    committedRef.current = false;
    setAnswers({});
    setSummary(null);
  }

  return (
    <main className="review-hub" aria-label="今日複習中心">
      <header className="review-hub-head">
        <AlarmClock size={22} aria-hidden="true" className="review-hub-head-icon" />
        <div>
          <p className="review-hub-eyebrow">SPACED REVIEW</p>
          <h1>今日複習中心</h1>
          <p className="review-hub-subtitle">
            {deck.length > 0
              ? `今天有 ${deck.length} 題記憶線索到期，用自己熟悉的步調整理它們。`
              : "記憶線索會依照遺忘曲線自動排程，到期時這裡會幫你整理。"}
          </p>
        </div>
      </header>

      {summary ? (
        <section className="review-hub-result" role="status" aria-live="polite">
          <div className="review-hub-result-row">
            <CheckCircle2 size={22} aria-hidden="true" className="ok" />
            <strong className="review-hub-result-score">{summary.correct}/{summary.total}</strong>
            <span className="review-hub-result-label">
              本輪複習完成 · 正確率 {summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0}%
            </span>
          </div>
          <div className="review-hub-result-meta">
            <span><Coins size={14} aria-hidden="true" /> +{summary.goldEarned} 金幣</span>
            <span><TrendingUp size={14} aria-hidden="true" /> +{summary.expEarned} 經驗</span>
          </div>
          {summary.wrongCount > 0 ? (
            <button type="button" className="review-hub-cta" onClick={() => setLocation("/wrong-answers")}>
              <ShieldAlert size={16} aria-hidden="true" /> 進錯題魔王複習 {summary.wrongCount} 題
            </button>
          ) : (
            <p className="review-hub-result-praise">全對！今日複習線索全部接上，明天記得再回來。</p>
          )}
          <button type="button" className="review-hub-cta ghost" onClick={resetRound}>
            <RotateCcw size={16} aria-hidden="true" /> 重新整理一輪
          </button>
        </section>
      ) : deck.length === 0 ? (
        <section className="review-hub-empty" role="status">
          <CheckCircle2 size={26} aria-hidden="true" />
          <strong>目前沒有到期複習題</strong>
          <p>答題後答錯的題目與排程複習會自動出現在這裡；可以先繼續探索新的知識島。</p>
          <button type="button" className="review-hub-cta" onClick={() => setLocation("/practice")}>
            <Sparkles size={16} aria-hidden="true" /> 去課綱練習
          </button>
        </section>
      ) : (
        <>
          <section className="review-hub-progress" aria-label="今日複習進度" role="status" aria-live="polite">
            <strong className="review-hub-progress-score">
              {progress.answered}/{progress.total}
            </strong>
            <span className="review-hub-progress-label">
              已完成 {progress.answered} 題 · 正確 {progress.correct} 題
            </span>
          </section>

          <section className="review-hub-ladder" aria-label="複習排程階梯">
            <p className="review-hub-ladder-title">複習階梯</p>
            <div className="review-hub-ladder-nodes">
              {ladder.map((node) => (
                <div
                  key={node.label}
                  className={`review-hub-ladder-node${node.due > 0 ? " is-due" : ""}${node.scheduled === 0 ? " is-idle" : ""}`}
                >
                  <span className="review-hub-ladder-label">{node.label}</span>
                  <span className="review-hub-ladder-count" aria-label={`${node.label}排程 ${node.scheduled} 題`}>
                    {node.scheduled}
                  </span>
                  {node.due > 0 ? <small>到期 {node.due}</small> : null}
                </div>
              ))}
              <div className={`review-hub-ladder-node${errorDueCount > 0 ? " is-due" : " is-idle"}`}>
                <span className="review-hub-ladder-label">錯題複習</span>
                <span className="review-hub-ladder-count" aria-label={`錯題複習排程 ${errorDueCount} 題`}>{errorDueCount}</span>
                {errorDueCount > 0 ? <small>到期 {errorDueCount}</small> : null}
              </div>
            </div>
          </section>

          <section className="review-hub-deck" aria-label="到期複習題">
            {deck.map((item, index) => {
              const userPick = answers[item.key];
              const answered = userPick !== undefined;
              const isRight = answered && userPick === item.display.answer;
              return (
                <article key={item.key} className="review-hub-question" aria-label={`第 ${index + 1} 題`}>
                  <header className="review-hub-q-head">
                    <span className="review-hub-q-index">Q{index + 1}</span>
                    <span className="review-hub-q-topic">{item.display.subject} · {item.display.learningTopic}</span>
                    {item.isVariant ? <span className="review-hub-q-badge is-variant">變體練習</span> : null}
                    <span className="review-hub-q-badge">{intervalLabel(item.due)}</span>
                  </header>
                  <p className="review-hub-prompt">{item.display.prompt}</p>
                  <ul className="review-hub-options">
                    {item.display.options.map((option, optionIndex) => {
                      let cls = "review-hub-opt";
                      if (answered) {
                        if (optionIndex === item.display.answer) cls += " correct";
                        else if (optionIndex === userPick) cls += " wrong";
                      }
                      return (
                        <li key={optionIndex}>
                          <button
                            type="button"
                            className={cls}
                            onClick={() => pick(item, optionIndex)}
                            disabled={answered || !!summary}
                          >
                            <span className="review-hub-opt-letter">{String.fromCharCode(65 + optionIndex)}</span>
                            <span className="review-hub-opt-text">{option}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {answered ? (
                    <p className={`review-hub-feedback ${isRight ? "ok" : "err"}`}>
                      {isRight ? "✓ 答對了，線索有接上！" : `✗ 正解是 ${String.fromCharCode(65 + item.display.answer)}`}
                      {!isRight && item.display.explanation ? <span className="review-hub-explanation"> {item.display.explanation}</span> : null}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </section>

          <footer className="review-hub-foot">
            <span className="review-hub-foot-hint">
              {answeredCount < deck.length ? `還有 ${deck.length - answeredCount} 題待整理` : "全部作答完畢，先看看回饋再結算"}
            </span>
            {allAnswered ? (
              <button type="button" className="review-hub-cta" onClick={commitRound}>
                <CheckCircle2 size={16} aria-hidden="true" /> 完成整理本輪
              </button>
            ) : (
              <button type="button" className="review-hub-cta ghost" onClick={() => setLocation("/learning-insights")}>
                <TrendingUp size={16} aria-hidden="true" /> 看學習洞察
              </button>
            )}
          </footer>
        </>
      )}
    </main>
  );
}
