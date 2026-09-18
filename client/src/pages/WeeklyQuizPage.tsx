import React from "react";
import { WeeklyQuizCard } from "@/components/WeeklyQuizCard";
import "./HubPages.css";
import "@/components/WeeklyQuizCard.css";

/**
 * 本週週測頁：我的教室的週測入口目的地。
 * 每週五（台北時間 00:00）自動出 10 題回顧，完成後跳出成就彈窗並自動前往學習歷程。
 */
export default function WeeklyQuizPage() {
  return (
    <main className="hub-page weekly-quiz-page" aria-labelledby="weekly-quiz-page-title">
      <header className="hub-header">
        <p className="hub-eyebrow">WEEKLY QUIZ</p>
        <h1 className="hub-title" id="weekly-quiz-page-title">🗓️ 本週週測</h1>
        <p className="hub-sub">每週五自動出 10 題，回顧本週學過的重點；週日 23:59 前都可以作答。</p>
      </header>
      <div className="weekly-quiz-page-body">
        <WeeklyQuizCard />
      </div>
    </main>
  );
}
