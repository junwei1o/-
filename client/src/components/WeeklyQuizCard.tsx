import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Coins, Lock, RotateCw, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getCloudMode } from "@/game/cloudSync";
import { loadUserPreferences } from "@/game/adaptiveLearning";
import { addLearningRecord, getPlayerData, updatePlayerData } from "@/utils/storage";
import "./WeeklyQuizCard.css";

type QuizQuestion = {
  id: string;
  subject: string;
  grade: number;
  difficulty: "基礎" | "標準" | "挑戰";
  learningTopic: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

type WeeklyQuizGetResult =
  | { status: "notOpen"; weekKey: string; opensAt: number }
  | { status: "ready"; weekKey: string; quiz: { id: number; questions: QuizQuestion[] } }
  | { status: "done"; weekKey: string; score: { correctCount: number; totalQuestions: number; submittedAt: number } };

type WeeklyQuizSubmitResult = {
  ok: boolean;
  alreadyDone?: boolean;
  correctCount?: number;
  totalQuestions?: number;
  goldEarned?: number;
  expEarned?: number;
  reason?: string;
};

/** 完成彈窗顯示後，自動跳轉到學習歷程的等待時間（毫秒）。 */
const REDIRECT_DELAY_MS = 4_000;

/** 完成一次週測解鎖的成就徽章 id（寫入 playerData.badges，徽章牆 Badges 會顯示）。 */
export const WEEKLY_QUIZ_BADGE_ID = "weekly-quiz-voyager";

/** 週五（台北時間）幾點開放，給「尚未開放」的提示。 */
function opensAtLabel(opensAt: number) {
  const date = new Date(opensAt + 8 * 3_600_000);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${month} 月 ${day} 日（五）00:00`;
}

/**
 * AI 自動週測卡：每週五（台北時間 00:00）自動出 10 題本週回顧，
 * 開放至週日 23:59。作答採學伴任務卡同款逐題即時回饋，
 * 全對完自動提交，server 寫入考試紀錄並回傳金幣／經驗。
 * 完成後跳出成就彈窗（金幣／經驗／徽章），並在幾秒後自動前往學習歷程。
 */
export function WeeklyQuizCard() {
  const [, setLocation] = useLocation();
  const cloud = getCloudMode();
  const prefs = loadUserPreferences();
  const studentName = cloud.mode === "cloud" ? (cloud.name ?? "").trim() : "";
  const isCloud = studentName.length >= 2;

  const query = trpc.weeklyQuiz.get.useQuery(
    { studentName, grade: prefs.gradeLevel },
    { enabled: isCloud },
  );
  const submit = trpc.weeklyQuiz.submit.useMutation();

  const data = query.data as WeeklyQuizGetResult | undefined;
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<WeeklyQuizSubmitResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const committedRef = useRef(false);
  const redirectTimerRef = useRef<number | null>(null);

  // 換週／重新取得後清空作答狀態（同一週內不因 refetch 清掉完成畫面）。
  useEffect(() => {
    setPicked({});
    setSubmitted(null);
    setShowCelebration(false);
    committedRef.current = false;
    if (redirectTimerRef.current != null) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  }, [data?.weekKey]);

  // 離開頁面時清掉待觸發的自動跳轉。
  useEffect(
    () => () => {
      if (redirectTimerRef.current != null) {
        window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    },
    [],
  );

  function closeCelebration() {
    if (redirectTimerRef.current != null) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    setShowCelebration(false);
  }

  function goTo(href: string) {
    closeCelebration();
    setLocation(href);
  }

  const questions = data?.status === "ready" ? data.quiz.questions : [];
  const allAnswered =
    questions.length > 0 && questions.every((question) => typeof picked[question.id] === "number");

  const answers = useMemo(() => {
    const result: Record<string, number> = {};
    for (const question of questions) {
      if (typeof picked[question.id] === "number") result[question.id] = picked[question.id];
    }
    return result;
  }, [picked, questions]);

  // 全作答完成自動提交（防重入）。
  useEffect(() => {
    if (!allAnswered || submitted || committedRef.current || data?.status !== "ready") return;
    committedRef.current = true;
    const weekKey = data.weekKey;
    void (async () => {
      try {
        const res = (await submit.mutateAsync({
          studentName,
          weekKey,
          answers,
        })) as WeeklyQuizSubmitResult;
        if (!res.ok || res.alreadyDone) {
          setSubmitted(res);
          await query.refetch();
          return;
        }
        // 金幣／經驗＋成就徽章＋學習紀錄落地（與學伴任務卡同款）。
        const before = getPlayerData();
        const badges = before.badges?.includes(WEEKLY_QUIZ_BADGE_ID)
          ? before.badges
          : [...(before.badges ?? []), WEEKLY_QUIZ_BADGE_ID];
        updatePlayerData({
          gold: before.gold + (res.goldEarned ?? 0),
          exp: before.exp + (res.expEarned ?? 0),
          totalAnswers: before.totalAnswers + questions.length,
          badges,
        });
        for (const question of questions) {
          addLearningRecord({
            questionId: question.id,
            subject: "綜合課綱",
            isCorrect: res.correctCount != null && answers[question.id] === question.answer,
            timestamp: Date.now(),
            flagged: false,
            knowledge: [question.learningTopic],
            difficulty: question.difficulty,
          });
        }
        setSubmitted(res);
        setShowCelebration(true);
        toast.success(`本週週測完成！答對 ${res.correctCount}/${res.totalQuestions}`);
        redirectTimerRef.current = window.setTimeout(() => setLocation("/learning"), REDIRECT_DELAY_MS);
        await query.refetch();
      } catch {
        committedRef.current = false;
        toast.error("週測提交失敗，請再試一次");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAnswered, submitted, data?.status, data?.weekKey]);

  const correctCount = submitted?.correctCount ?? 0;
  const totalQuestions = submitted?.totalQuestions ?? questions.length;
  const correctRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const praise =
    correctCount === totalQuestions
      ? "全對！你是本週最強冒險家！"
      : correctCount >= 7
        ? "表現很棒，錯的題目可以再去錯題魔王複習！"
        : "繼續加油，錯的題目去錯題魔王練一練！";

  let body: React.ReactNode;
  if (!isCloud) {
    body = (
      <section className="weekly-quiz-card" aria-label="AI 自動週測">
        <div className="weekly-quiz-head">
          <span className="weekly-quiz-emoji" aria-hidden="true">🗓️</span>
          <div>
            <h2 className="weekly-quiz-title">AI 自動週測</h2>
            <p className="weekly-quiz-hint">每週五自動出 10 題回顧本週學習</p>
          </div>
        </div>
        <p className="weekly-quiz-empty">
          週測會依雲端船籍的答題紀錄自動出題，請先
          <button type="button" className="weekly-quiz-link" onClick={() => setLocation("/settings")}>
            開啟雲端船籍
          </button>
          再回來挑戰。
        </p>
      </section>
    );
  } else if (query.isLoading) {
    body = (
      <section className="weekly-quiz-card" aria-label="AI 自動週測">
        <div className="weekly-quiz-head">
          <span className="weekly-quiz-emoji" aria-hidden="true">🗓️</span>
          <div>
            <h2 className="weekly-quiz-title">AI 自動週測</h2>
            <p className="weekly-quiz-hint">載入中…</p>
          </div>
        </div>
      </section>
    );
  } else if (data?.status === "notOpen") {
    body = (
      <section className="weekly-quiz-card" aria-label="AI 自動週測">
        <div className="weekly-quiz-head">
          <span className="weekly-quiz-emoji" aria-hidden="true">🗓️</span>
          <div>
            <h2 className="weekly-quiz-title">AI 自動週測</h2>
            <p className="weekly-quiz-hint">10 題回顧本週學習</p>
          </div>
        </div>
        <p className="weekly-quiz-empty">
          <Lock aria-hidden="true" size={14} />
          本週週測將於 <strong>{opensAtLabel(data.opensAt)}</strong> 自動出題，週日 23:59 前都可以作答。
        </p>
      </section>
    );
  } else if (data?.status === "done") {
    body = (
      <section className="weekly-quiz-card" aria-label="AI 自動週測">
        <div className="weekly-quiz-head">
          <span className="weekly-quiz-emoji" aria-hidden="true">🗓️</span>
          <div>
            <h2 className="weekly-quiz-title">AI 自動週測</h2>
            <p className="weekly-quiz-hint">本週回顧已完成</p>
          </div>
        </div>
        <div className="weekly-quiz-done">
          <CheckCircle2 aria-hidden="true" size={18} />
          <strong>
            {data.score.correctCount}/{data.score.totalQuestions}
          </strong>
          <span>答對</span>
        </div>
      </section>
    );
  } else {
    // status === "ready"
    body = (
      <section className="weekly-quiz-card" aria-label="AI 自動週測">
        <div className="weekly-quiz-head">
          <span className="weekly-quiz-emoji" aria-hidden="true">🗓️</span>
          <div>
            <h2 className="weekly-quiz-title">本週週測</h2>
            <p className="weekly-quiz-hint">依本週答題表現挑的 10 題回顧</p>
          </div>
          {submitted ? (
            <span className="weekly-quiz-tag">已完成</span>
          ) : (
            <span className="weekly-quiz-tag">
              {Object.keys(picked).length}/{questions.length}
            </span>
          )}
        </div>

        {submitted ? (
          <div className="weekly-quiz-result" role="status" aria-label="週測結果">
            <div className="weekly-quiz-result-row">
              <span className="weekly-quiz-result-score">
                {correctCount}/{totalQuestions}
              </span>
              <span className="weekly-quiz-result-label">答對</span>
            </div>
            <div className="weekly-quiz-result-meta">
              <span>
                <Coins aria-hidden="true" size={15} /> +{submitted.goldEarned ?? 0} 金幣
              </span>
              <span>
                <TrendingUp aria-hidden="true" size={15} /> +{submitted.expEarned ?? 0} 經驗
              </span>
            </div>
            <p className="weekly-quiz-result-praise">{praise}</p>
          </div>
        ) : (
          <>
            <ol className="weekly-quiz-questions">
              {questions.map((question, index) => {
                const selected = picked[question.id];
                const isAnswered = typeof selected === "number";
                const isCorrect = isAnswered && selected === question.answer;
                return (
                  <li key={question.id} className="weekly-quiz-question">
                    <div className="weekly-quiz-q-head">
                      <span>
                        第 {index + 1} 題 · {question.subject} · {question.learningTopic}
                      </span>
                      <small>{question.difficulty}</small>
                    </div>
                    <p className="weekly-quiz-prompt">{question.prompt}</p>
                    <ul className="weekly-quiz-options">
                      {question.options.map((option, optionIndex) => {
                        const isThisCorrect = optionIndex === question.answer;
                        const isThisPicked = selected === optionIndex;
                        const className = [
                          "opt",
                          isAnswered && isThisCorrect ? "correct" : "",
                          isAnswered && isThisPicked && !isThisCorrect ? "wrong" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");
                        return (
                          <li key={optionIndex}>
                            <button
                              type="button"
                              className={className}
                              disabled={isAnswered}
                              onClick={() =>
                                setPicked((prev) => ({ ...prev, [question.id]: optionIndex }))
                              }
                            >
                              <span className="opt-letter">
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              {option}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {isAnswered && (
                      <p className={`weekly-quiz-feedback ${isCorrect ? "ok" : "err"}`}>
                        {isCorrect ? "答對了！" : `答錯了，正確是 ${question.options[question.answer]}。`}
                        {question.explanation ? ` ${question.explanation}` : ""}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
            {allAnswered && (
              <p className="weekly-quiz-saving">
                <RotateCw className="weekly-quiz-spin" aria-hidden="true" size={14} />
                送出週測結果…
              </p>
            )}
          </>
        )}
      </section>
    );
  }

  return (
    <>
      {body}
      {submitted && showCelebration && (
        <div className="weekly-quiz-modal-overlay" role="dialog" aria-modal="true" aria-label="本週週測完成">
          <div className="weekly-quiz-modal">
            <button type="button" className="weekly-quiz-modal-close" aria-label="關閉成就畫面" onClick={closeCelebration}>
              <X size={18} aria-hidden="true" />
            </button>
            <p className="weekly-quiz-modal-emoji" aria-hidden="true">🎉</p>
            <h3 className="weekly-quiz-modal-title">本週週測完成！</h3>
            <div className="weekly-quiz-modal-score">
              <strong>
                {correctCount}/{totalQuestions}
              </strong>
              <span>答對 · 正確率 {correctRate}%</span>
            </div>
            <div className="weekly-quiz-modal-rewards">
              <span>
                <Coins aria-hidden="true" size={15} /> +{submitted.goldEarned ?? 0} 金幣
              </span>
              <span>
                <TrendingUp aria-hidden="true" size={15} /> +{submitted.expEarned ?? 0} 經驗
              </span>
            </div>
            <div className="weekly-quiz-modal-badge">
              <span className="weekly-quiz-modal-badge-icon" aria-hidden="true">🗓️</span>
              <div>
                <small>成就解鎖</small>
                <strong>每週遠征家</strong>
              </div>
            </div>
            <p className="weekly-quiz-modal-praise">{praise}</p>
            <div className="weekly-quiz-modal-actions">
              <button type="button" className="weekly-quiz-modal-primary" onClick={() => goTo("/learning")}>
                看學習歷程
              </button>
              <button type="button" className="weekly-quiz-modal-secondary" onClick={() => goTo("/wrong-answers")}>
                去錯題複習
              </button>
            </div>
            <p className="weekly-quiz-modal-timer-hint">4 秒後自動前往學習歷程…</p>
          </div>
        </div>
      )}
    </>
  );
}
