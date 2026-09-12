import React, { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
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

export function CompanionTaskCard({ studentName }: Props) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<Delegation | null>(null);
  const [picked, setPicked] = useState<Record<number, number>>({});

  const delegate = (trpc.aiTutor as unknown as {
    delegateTask: {
      useMutation: () => {
        mutateAsync: (input: { studentName: string }) => Promise<Delegation>;
        isPending: boolean;
      };
    };
  }).delegateTask.useMutation();

  async function requestTask() {
    try {
      const data = await delegate.mutateAsync({ studentName });
      setTask(data);
      setPicked({});
      setOpen(true);
    } catch (e) {
      toast.error("學伴派任務失敗：" + (e as Error).message);
    }
  }

  function pick(qIdx: number, optIdx: number) {
    setPicked((prev) => ({ ...prev, [qIdx]: optIdx }));
  }

  const correctCount = task
    ? task.questions.reduce((sum, q, idx) => sum + (picked[idx] === q.answer ? 1 : 0), 0)
    : 0;

  return (
    <section className="companion-task-card" aria-labelledby="companion-task-heading">
      <header className="companion-task-head">
        <Sparkles size={20} aria-hidden="true" />
        <h2 id="companion-task-heading" className="companion-task-title">
          學伴主動派任務
        </h2>
        <span className="companion-task-hint">
          {task ? `已完成 ${correctCount}/${task.questions.length}` : "依表現決定單科 / 綜合題"}
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
                            disabled={answered}
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
            <button
              type="button"
              className="companion-task-cta ghost"
              onClick={() => {
                setTask(null);
                setPicked({});
                setOpen(false);
              }}
            >
              <RotateCw size={16} aria-hidden="true" /> 換一批
            </button>
            <button
              type="button"
              className="companion-task-cta"
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