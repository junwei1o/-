import React, { useMemo } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";
import { loadAdaptiveProfile } from "@/game/adaptiveLearning";
import type { KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import "./HomeDashboard.css";

const SUBJECTS: KnowledgeIslandSubject[] = ["國語", "數學", "社會", "自然"];

export default function WrongAnswers() {
  const [, setLocation] = useLocation();
  const subjectsWithAttempts = useMemo(() => {
    const attempts = loadAdaptiveProfile().attempts.filter((attempt) => !attempt.correct);
    return SUBJECTS.filter((subject) => attempts.some((attempt) => attempt.curriculumDomain === subject));
  }, []);

  return (
    <main className="wrong-answers-page">
      <section className="paper-exam-hero">
        <p className="paper-exam-kicker"><RotateCcw size={16} aria-hidden="true" /> 整理學習線索</p>
        <h1>錯題重練</h1>
        <p>這裡只整理你已經留下的真實作答紀錄。選一個科目，再依自己的步調重看題目與解析。</p>
      </section>
      <section className="paper-exam-panel" aria-label="可重練的科目">
        {subjectsWithAttempts.length ? subjectsWithAttempts.map((subject) => (
          <button className="home-dashboard-action" type="button" key={subject} onClick={() => setLocation(`/practice?subject=${encodeURIComponent(subject)}&wrongOnly=1&source=wrong-answers`)}>{subject}錯題重練</button>
        )) : <p>目前還沒有可驗證的錯題紀錄。每次作答都是建立下一步學習線索的開始。</p>}
        <button className="home-dashboard-action" type="button" onClick={() => setLocation("/")}><ArrowLeft size={16} aria-hidden="true" /> 返回航海儀表板</button>
      </section>
    </main>
  );
}
