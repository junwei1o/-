import React, { useMemo } from "react";
import { ArrowLeft, RotateCcw, Flame, Play } from "lucide-react";
import { useLocation } from "wouter";
import {
  loadAdaptiveProfile,
  isInWrongBook,
  getCorrectStreak,
  getRemainingToGraduate,
  WRONG_GRADUATION_STREAK,
} from "@/game/adaptiveLearning";
import { useQuestionBank } from "@/lib/questionBank";
import type { KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import "./HomeDashboard.css";

const SUBJECTS: KnowledgeIslandSubject[] = ["國語", "數學", "社會", "自然"];

type WrongItem = {
  questionId: string;
  subject: KnowledgeIslandSubject;
  prompt: string;
  knowledge: string[];
  streak: number;
  remaining: number;
};

export default function WrongAnswers() {
  const [, setLocation] = useLocation();
  const { questions } = useQuestionBank();

  const groups = useMemo(() => {
    const profile = loadAdaptiveProfile();
    const byId = new Map(questions.map((question) => [question.id, question]));

    // 每題取一筆代表紀錄（拿科目與知識點），再只保留仍在錯題本的題。
    const metaByQuestion = new Map<string, { subject: string; knowledge: string[] }>();
    profile.attempts.forEach((attempt) => {
      metaByQuestion.set(attempt.questionId, {
        subject: attempt.curriculumDomain,
        knowledge: attempt.knowledge ?? [],
      });
    });

    const items: WrongItem[] = [];
    metaByQuestion.forEach((meta, questionId) => {
      if (!isInWrongBook(profile.attempts, questionId)) return;
      const question = byId.get(questionId);
      items.push({
        questionId,
        subject: meta.subject as KnowledgeIslandSubject,
        prompt: question?.prompt ?? `（題目資料待補）${meta.knowledge.join("、") || questionId}`,
        knowledge: question?.knowledge?.length ? question.knowledge : meta.knowledge,
        streak: getCorrectStreak(profile.attempts, questionId),
        remaining: getRemainingToGraduate(profile.attempts, questionId),
      });
    });

    // 各科目分組；科目內把「越接近畢業」的題排前面，營造再一下就解掉的動力。
    return SUBJECTS.map((subject) => ({
      subject,
      items: items.filter((item) => item.subject === subject).sort((a, b) => a.remaining - b.remaining),
    })).filter((group) => group.items.length > 0);
  }, [questions]);

  const totalWrong = groups.reduce((count, group) => count + group.items.length, 0);
  const almostDone = groups.reduce(
    (count, group) => count + group.items.filter((item) => item.streak >= 1).length,
    0,
  );

  return (
    <main className="wrong-answers-page">
      <section className="paper-exam-hero">
        <p className="paper-exam-kicker"><RotateCcw size={16} aria-hidden="true" /> 整理學習線索</p>
        <h1>錯題重練</h1>
        <p>
          這裡只整理你已經留下的真實作答紀錄。每題「連續答對 {WRONG_GRADUATION_STREAK} 次」就會自動畢業、移出錯題本。
        </p>
        {totalWrong > 0 && (
          <p className="wrong-book-summary">
            目前有 <strong>{totalWrong}</strong> 題待複習，其中 <strong>{almostDone}</strong> 題再答對 1 次就畢業。
          </p>
        )}
      </section>

      {groups.length === 0 ? (
        <section className="paper-exam-panel" aria-label="錯題狀態">
          <p>目前還沒有可驗證的錯題紀錄。每次作答都是建立下一步學習線索的開始。</p>
          <button className="home-dashboard-action" type="button" onClick={() => setLocation("/")}>
            <ArrowLeft size={16} aria-hidden="true" /> 返回航海儀表板
          </button>
        </section>
      ) : (
        groups.map((group) => (
          <section className="wrong-book-group paper-exam-panel" key={group.subject} aria-label={`${group.subject}錯題`}>
            <div className="wrong-book-group-head">
              <h2>
                {group.subject} <span className="wrong-book-count">{group.items.length} 題</span>
              </h2>
              <button
                className="wrong-book-start"
                type="button"
                onClick={() =>
                  setLocation(
                    `/practice?subject=${encodeURIComponent(group.subject)}&wrongOnly=1&source=wrong-answers`,
                  )
                }
              >
                <Play size={15} aria-hidden="true" /> 開始{group.subject}錯題重練
              </button>
            </div>

            {group.items.map((item) => (
              <article className="wrong-book-item" key={item.questionId}>
                <div className="wrong-book-item-main">
                  <p className="wrong-book-prompt">{item.prompt}</p>
                  {item.knowledge.length > 0 && (
                    <div className="wrong-book-tags">
                      {item.knowledge.slice(0, 3).map((point) => (
                        <span className="wrong-book-tag" key={point}>
                          {point}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="wrong-book-progress"
                  aria-label={`已連續答對 ${item.streak} 次，還要再答對 ${item.remaining} 題才畢業`}
                >
                  <div className="wrong-book-dots" aria-hidden="true">
                    {Array.from({ length: WRONG_GRADUATION_STREAK }).map((_, index) => (
                      <span
                        className={`wrong-book-dot ${index < item.streak ? "is-done" : ""}`}
                        key={index}
                      />
                    ))}
                  </div>
                  <p className={`wrong-book-status ${item.streak >= 1 ? "is-close" : ""}`}>
                    {item.streak >= 1 ? (
                      <>
                        <Flame size={14} aria-hidden="true" /> 已連續答對 {item.streak} 次，再答對{" "}
                        {item.remaining} 題就畢業
                      </>
                    ) : (
                      <>
                        已連續答對 0 次，再連續答對 {item.remaining} 題就畢業
                      </>
                    )}
                  </p>
                </div>
              </article>
            ))}
          </section>
        ))
      )}

      <section className="paper-exam-panel" aria-label="返回">
        <button className="home-dashboard-action" type="button" onClick={() => setLocation("/")}>
          <ArrowLeft size={16} aria-hidden="true" /> 返回航海儀表板
        </button>
      </section>
    </main>
  );
}
