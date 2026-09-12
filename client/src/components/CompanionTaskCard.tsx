import React, { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ChevronDown, ChevronUp, Sparkles, RotateCw, Coins, TrendingUp, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { addLearningRecord, updatePlayerData, getPlayerData, type LearningRecord } from "@/utils/storage";
import type { AdaptiveDifficulty } from "@/game/adaptiveLearning";
import "@/components/CompanionTaskCard.css";

type Question = {
  prompt: string;
  options: string[];
  answer: number;
  topic: string;
  difficulty: "基礎" | "標準" | "挑戰";
};

type Delegation = {
  taskType: "single" | "integrated";
  subject: string | null;
  reason: string;
  title: string;
  questions: Question[];
};

type Props = {
  studentName: string;
};

type RoundSummary = {
  task: Delegation;
  correct: number;
  total: number;
  wrongQuestions: Question[];
  goldEarned: number;
  expEarned: number;
  recordedAt: number;
};

/** 難度 → 經驗（基礎/標準/挑戰各 5/10/18），每題最多 18 exp。 */
function expForDifficulty(d: Question["difficulty"]): number {
  return d === "挑戰" ? 18 : d === "標準" ? 10 : 5;
}

/** 難度 → 金幣（基礎/標準/挑戰各 6/12/20）。 */
function goldForDifficulty(d: Question["difficulty"]): number {
  return d === "挑戰" ? 20 : d === "標準" ? 12 : 6;
}

export function CompanionTaskCard({ studentName }: Props) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<Delegation | null>(null);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [summary, setSummary] = useState<RoundSummary | null>(null);
  /** 保證「完成回呼只跑一次」（React StrictMode 下兩次 render 不會雙倍加金幣）。 */
  const committedRef = useRef(false);

  const delegate = (trpc.aiTutor as unknown as {
    delegateTask: {
      useMutation: () => {
        mutateAsync: (input: { studentName: string }) => Promise<Delegation>;
        isPending: boolean;
      };
    };
  }).delegateTask.useMutation();

  async function requestTask() {
    committedRef.current = false;
    try {
      const data = await delegate.mutateAsync({ studentName });
      setTask(data);
      setPicked({});
      setSummary(null);
      setOpen(true);
    } catch (e) {
      toast.error("學伴派任務失敗：" + (e as Error).message);
    }
  }

  function pick(qIdx: number, optIdx: number) {
    if (summary) return;
    setPicked((prev) => ({ ...prev, [qIdx]: optIdx }));
  }

  const correctCount = useMemo(() => {
    if (!task) return 0;
    return task.questions.reduce((sum, q, idx) => sum + (picked[idx] === q.answer ? 1 : 0), 0);
  }, [task, picked]);

  /** 全部題目都作答完成時，鎖定一回合結果並寫回學習紀錄 / 金幣 / 經驗。 */
  const allAnswered = !!task && task.questions.length > 0 && task.questions.every((_q, idx) => picked[idx] !== undefined);

  // 全部作答完：把本輪結果落到 storage（只跑一次）
  if (task && allAnswered && !committedRef.current && !summary) {
    committedRef.current = true;
    const subject = task.subject ?? "綜合課綱";
    const records: LearningRecord[] = task.questions.map((q, idx) => ({
      questionId: `companion-${studentName}-${Date.now()}-${idx}`,
      subject,
      isCorrect: picked[idx] === q.answer,
      timestamp: Date.now(),
      flagged: picked[idx] !== q.answer,
    }));
    let totalGold = 0;
    let totalExp = 0;
    let wrongQuestions: Question[] = [];
    records.forEach((rec, idx) => {
      addLearningRecord({
        ...rec,
        knowledge: [task.questions[idx].topic],
        difficulty: task.questions[idx].difficulty as AdaptiveDifficulty,
      });
      if (rec.isCorrect) {
        totalGold += goldForDifficulty(task.questions[idx].difficulty);
        totalExp += expForDifficulty(task.questions[idx].difficulty);
      } else {
        wrongQuestions.push(task.questions[idx]);
      }
    });

    const before = getPlayerData();
    updatePlayerData({
      gold: before.gold + totalGold,
      exp: before.exp + totalExp,
      totalAnswers: before.totalAnswers + task.questions.length,
    });

    setSummary({
      task,
      correct: records.filter((r) => r.isCorrect).length,
      total: task.questions.length,
      wrongQuestions,
      goldEarned: totalGold,
      expEarned: totalExp,
      recordedAt: Date.now(),
    });

    // 异步 toast：答完才會出現，不會一開卡就跳
    queueMicrotask(() => {
      const accuracy = Math.round((records.filter((r) => r.isCorrect).length / task.questions.length) * 100);
      toast.success(
        `本輪 ${records.filter((r) => r.isCorrect).length}/${task.questions.length}（${accuracy}%）+${totalGold} 金幣 +${totalExp} 經驗`,
      );
    });
  }

  function nextRound() {
    committedRef.current = false;
    setTask(null);
    setPicked({});
    setSummary(null);
    setOpen(false);
    void requestTask();
  }

  function dismiss() {
    committedRef.current = false;
    setTask(null);
    setPicked({});
    setSummary(null);
    setOpen(false);
  }

  return (
    <section className="companion-task-card" aria-labelledby="companion-task-heading">
      <header className="companion-task-head">
        <Sparkles size={20} aria-hidden="true" />
        <h2 id="companion-task-heading" className="companion-task-title">
          學伴主動派任務
        </h2>
        <span className="companion-task-hint">
          {task ? (summary ? `已記錄 ${summary.correct}/${summary.total}` : `已完成 ${correctCount}/${task.questions.length}`) : "依表現決定單科 / 綜合題"}
        </span>
      </header>

      {!task ? (
        <div className="companion-task-empty">
          <p>讓學伴根據你最近的作答紀錄，主動挑選今天的練習題。</p>
          <button
            type="button"
            className="companion-task-cta"
            onClick={requestTask}
            disabled={delegate.isPending}
          >
            <Sparkles size={16} aria-hidden="true" />
            {delegate.isPending ? "學伴思考中…" : "讓學伴派今日任務"}
          </button>
        </div>
      ) : (
        <>
          <div className="companion-task-summary">
            <strong>{task.title}</strong>
            <span className={`tag ${task.taskType}`}>
              {task.taskType === "integrated" ? "綜合跨學科" : task.subject ?? "單科"}
            </span>
            <small>{task.reason}</small>
          </div>

          {summary ? (
            <div className="companion-task-result" role="status" aria-live="polite">
              <div className="companion-task-result-row">
                <CheckCircle2 size={22} aria-hidden="true" className="ok" />
                <strong className="companion-task-result-score">
                  {summary.correct}/{summary.total}
                </strong>
                <span className="companion-task-result-label">
                  本輪結果 · 正確率 {Math.round((summary.correct / summary.total) * 100)}%
                </span>
              </div>
              <div className="companion-task-result-meta">
                <span><Coins size={14} aria-hidden="true" /> +{summary.goldEarned} 金幣</span>
                <span><TrendingUp size={14} aria-hidden="true" /> +{summary.expEarned} 經驗</span>
              </div>
              {summary.wrongQuestions.length > 0 ? (
                <div className="companion-task-result-actions">
                  <button
                    type="button"
                    className="companion-task-cta"
                    onClick={() => setLocation("/wrong-answers")}
                  >
                    <ShieldAlert size={16} aria-hidden="true" /> 進錯題魔王複習 {summary.wrongQuestions.length} 題
                  </button>
                </div>
              ) : (
                <p className="companion-task-result-praise">全對！可進挑戰專區挑更難的題。</p>
              )}
            </div>
          ) : null}

          <ol className="companion-task-questions">
            {task.questions.map((q, qIdx) => {
              const userPick = picked[qIdx];
              const answered = userPick !== undefined;
              const isRight = answered && userPick === q.answer;
              return (
                <li key={qIdx} className="companion-task-question">
                  <div className="companion-task-q-head">
                    <span>Q{qIdx + 1}</span>
                    <small>{q.topic} · {q.difficulty}</small>
                  </div>
                  <p className="companion-task-prompt">{q.prompt}</p>
                  <ul className="companion-task-options">
                    {q.options.map((opt, oIdx) => {
                      let cls = "opt";
                      if (answered) {
                        if (oIdx === q.answer) cls += " correct";
                        else if (oIdx === userPick) cls += " wrong";
                      }
                      return (
                        <li key={oIdx}>
                          <button
                            type="button"
                            className={cls}
                            onClick={() => pick(qIdx, oIdx)}
                            disabled={answered || !!summary}
                          >
                            <span className="opt-letter">{String.fromCharCode(65 + oIdx)}</span>
                            <span className="opt-text">{opt}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {answered ? (
                    <p className={`companion-task-feedback ${isRight ? "ok" : "err"}`}>
                      {isRight ? "✓ 答對！" : `✗ 正解是 ${String.fromCharCode(65 + q.answer)}`}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>

          <footer className="companion-task-foot">
            {summary ? (
              <button type="button" className="companion-task-cta" onClick={nextRound}>
                <RotateCw size={16} aria-hidden="true" /> 再派一組
              </button>
            ) : (
              <button type="button" className="companion-task-cta ghost" onClick={dismiss}>
                <RotateCw size={16} aria-hidden="true" /> 換一批
              </button>
            )}
            <button
              type="button"
              className="companion-task-cta ghost"
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
              {open ? "收合" : "展開細節"}
            </button>
          </footer>
        </>
      )}
    </section>
  );
}

export default CompanionTaskCard;