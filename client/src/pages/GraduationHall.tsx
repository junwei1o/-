import React, { useMemo } from "react";
import { ArrowLeft, GraduationCap, Award, Trophy, CalendarDays, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";
import {
  loadAdaptiveProfile,
  isGraduated,
  getGraduationDate,
} from "@/game/adaptiveLearning";
import { useQuestionBank } from "@/lib/questionBank";
import type { KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import "./HomeDashboard.css";

const SUBJECTS: KnowledgeIslandSubject[] = ["國語", "數學", "社會", "自然"];
/** 累計畢業題數的成就里程碑。 */
const MILESTONES = [1, 5, 10, 25, 50, 100];

type GradItem = {
  questionId: string;
  subject: KnowledgeIslandSubject;
  prompt: string;
  knowledge: string[];
  graduatedAt: number | null;
};

function formatDate(timestamp: number | null): string {
  if (!timestamp) return "日期未記錄";
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}/${month}/${day}`;
}

export default function GraduationHall() {
  const [, setLocation] = useLocation();
  const { questions } = useQuestionBank();

  const groups = useMemo(() => {
    const profile = loadAdaptiveProfile();
    const byId = new Map(questions.map((question) => [question.id, question]));

    const metaByQuestion = new Map<string, { subject: string; knowledge: string[] }>();
    profile.attempts.forEach((attempt) => {
      metaByQuestion.set(attempt.questionId, {
        subject: attempt.curriculumDomain,
        knowledge: attempt.knowledge ?? [],
      });
    });

    const items: GradItem[] = [];
    metaByQuestion.forEach((meta, questionId) => {
      if (!isGraduated(profile.attempts, questionId)) return;
      const question = byId.get(questionId);
      items.push({
        questionId,
        subject: meta.subject as KnowledgeIslandSubject,
        prompt: question?.prompt ?? `（題目資料待補）${meta.knowledge.join("、") || questionId}`,
        knowledge: question?.knowledge?.length ? question.knowledge : meta.knowledge,
        graduatedAt: getGraduationDate(profile.attempts, questionId),
      });
    });

    // 各科目分組；組內最近畢業的排前面。
    return SUBJECTS.map((subject) => ({
      subject,
      items: items
        .filter((item) => item.subject === subject)
        .sort((a, b) => (b.graduatedAt ?? 0) - (a.graduatedAt ?? 0)),
    })).filter((group) => group.items.length > 0);
  }, [questions]);

  const total = groups.reduce((count, group) => count + group.items.length, 0);
  const latestDate = groups.reduce((latest, group) => {
    group.items.forEach((item) => {
      if ((item.graduatedAt ?? 0) > latest) latest = item.graduatedAt ?? 0;
    });
    return latest;
  }, 0);
  const nextMilestone = MILESTONES.find((milestone) => milestone > total);
  const previousMilestone = [...MILESTONES].reverse().find((milestone) => milestone <= total);
  const milestoneProgress = nextMilestone
    ? Math.round(((total - (previousMilestone ?? 0)) / (nextMilestone - (previousMilestone ?? 0))) * 100)
    : 100;

  return (
    <main className="graduation-page">
      <section className="graduation-hero">
        <p className="paper-exam-kicker"><GraduationCap size={16} aria-hidden="true" /> 學習成就</p>
        <h1>畢業紀念榜</h1>
        <p>
          每一道曾經卡住、後來靠自己「連續答對兩次」破解的題，都會在這裡留下一枚畢業印記。回頭看，你會發現自己已經走了好遠。
        </p>
      </section>

      {total === 0 ? (
        <section className="paper-exam-panel" aria-label="尚無畢業紀錄">
          <p>
            紀念榜還是空的。到錯題重練把題目一題題破解，每題連續答對兩次，就會登上這裡。
          </p>
          <button
            className="wrong-book-start"
            type="button"
            onClick={() => setLocation("/wrong-answers")}
          >
            <RotateCcw size={15} aria-hidden="true" /> 前往錯題重練
          </button>
          <button
            className="home-dashboard-action"
            type="button"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft size={16} aria-hidden="true" /> 返回航海儀表板
          </button>
        </section>
      ) : (
        <>
          <section className="graduation-stats" aria-label="畢業統計">
            <div className="graduation-stat-card grad-stat-total">
              <Trophy size={22} aria-hidden="true" />
              <p className="grad-stat-number">{total}</p>
              <p className="grad-stat-label">已畢業題數</p>
            </div>
            <div className="graduation-stat-card">
              <CalendarDays size={20} aria-hidden="true" />
              <p className="grad-stat-text">{formatDate(latestDate)}</p>
              <p className="grad-stat-label">最近一次畢業</p>
            </div>
            <div className="graduation-stat-card grad-stat-milestone">
              <Award size={20} aria-hidden="true" />
              {nextMilestone ? (
                <>
                  <p className="grad-stat-text">再 {nextMilestone - total} 題</p>
                  <p className="grad-stat-label">解鎖「畢業 {nextMilestone} 題」獎章</p>
                  <div className="grad-milestone-bar" aria-hidden="true">
                    <span style={{ width: `${milestoneProgress}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <p className="grad-stat-text">已全數解鎖</p>
                  <p className="grad-stat-label">所有畢業獎章到手</p>
                </>
              )}
            </div>
          </section>

          <section className="graduation-medals paper-exam-panel" aria-label="成就獎章">
            <h2><Award size={18} aria-hidden="true" /> 畢業里程碑</h2>
            <div className="grad-medal-row">
              {MILESTONES.map((milestone) => {
                const unlocked = total >= milestone;
                return (
                  <div className={`grad-medal ${unlocked ? "is-unlocked" : ""}`} key={milestone}>
                    <span className="grad-medal-icon">
                      <GraduationCap size={20} aria-hidden="true" />
                    </span>
                    <p className="grad-medal-number">{milestone} 題</p>
                    <p className="grad-medal-state">{unlocked ? "已解鎖" : "未解鎖"}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {groups.map((group) => (
            <section
              className="graduation-group paper-exam-panel"
              key={group.subject}
              aria-label={`${group.subject}畢業題`}
            >
              <div className="wrong-book-group-head">
                <h2>
                  {group.subject} <span className="wrong-book-count">{group.items.length} 題畢業</span>
                </h2>
              </div>

              {group.items.map((item) => (
                <article className="graduation-item" key={item.questionId}>
                  <span className="graduation-cap-icon" aria-hidden="true">
                    <GraduationCap size={20} />
                  </span>
                  <div className="graduation-item-main">
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
                  <p className="graduation-date">
                    <CalendarDays size={13} aria-hidden="true" /> {formatDate(item.graduatedAt)} 畢業
                  </p>
                </article>
              ))}
            </section>
          ))}

          <section className="paper-exam-panel" aria-label="返回">
            <button
              className="home-dashboard-action"
              type="button"
              onClick={() => setLocation("/wrong-answers")}
            >
              <RotateCcw size={16} aria-hidden="true" /> 返回錯題重練
            </button>
            <button
              className="home-dashboard-action"
              type="button"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft size={16} aria-hidden="true" /> 返回航海儀表板
            </button>
          </section>
        </>
      )}
    </main>
  );
}
