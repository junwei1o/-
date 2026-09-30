import React, { useMemo } from "react";
import { useLocation } from "wouter";
import { Flame, Sparkles, Star } from "lucide-react";
import { buildStudentDashboard } from "@/lib/studentDashboard";
import { getPlayerName, getLearningRecord, getSelfChallengeBest } from "@/utils/storage";
import { loadAdaptiveProfile } from "@/game/adaptiveLearning";
import { useQuestionLookup } from "@/lib/questionLookup";
import { loadSignInState } from "@/game/dailySignIn";
import { bxStore } from "@/game/bxStore";
import TodayTasks from "@/components/student/TodayTasks";
import BadgeRow from "@/components/student/BadgeRow";
import StrengthsFocus from "@/components/student/StrengthsFocus";
import ProgressSummary from "@/components/student/ProgressSummary";
import "./StudentDashboard.css";

/**
 * 學生端診斷儀表板（手機優先）。
 * 頁面只讀自己的 localStorage 與本地遊戲進度，不讀、也不暗示任何其他學生的資料。
 * 資料組裝：mount 時把各來源餵給凍結 lib API buildStudentDashboard，並用 useMemo
 * 隨題庫（lookup）就緒重算。lib 由平行 Subagent 依契約實作，本檔不修改其簽名。
 */
export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const lookup = useQuestionLookup();

  const data = useMemo(() => {
    const signIn = loadSignInState();
    const selfChallenge = getSelfChallengeBest();
    return buildStudentDashboard({
      captainName: getPlayerName() || "小小航海士",
      records: getLearningRecord(),
      lookup,
      profile: loadAdaptiveProfile(),
      bxBadges: bxStore.get<string[]>("badges", []) ?? [],
      bxTotalAnswers: bxStore.get<number>("stats.total_answers", 0) ?? 0,
      streak: signIn.streak,
      selfChallengeCompleted: selfChallenge.completed,
    });
  }, [lookup]);

  const { gamification } = data;

  return (
    <main className="sd-page" aria-labelledby="sd-title">
      <header className="sd-topbar">
        <h1 className="sd-eyebrow" id="sd-title">學生診斷儀表板</h1>
        <p className="sd-status-line">
          <span className="sd-chip">船長：{data.captainName}</span>
          <span className="sd-chip sd-chip--flame">
            <Flame size={13} aria-hidden="true" /> 連續 {gamification.consecutiveDays} 天
          </span>
          <span className="sd-chip sd-chip--star">
            <Star size={13} aria-hidden="true" /> 等級 {gamification.level}・{gamification.levelName}
          </span>
        </p>
      </header>

      {!data.hasAnyData ? (
        <section className="app-card sd-empty-card">
          <Sparkles size={30} aria-hidden="true" className="sd-empty-icon" />
          <h2 className="sd-empty-title">還沒有學習紀錄，先出發練習吧！</h2>
          <p className="sd-empty-sub">
            完成第一次答題後，這裡就會長出你的連續天數、強項、今日任務與徽章牆。
          </p>
          <button
            type="button"
            className="app-btn app-btn--primary"
            onClick={() => setLocation("/practice")}
          >
            開始第一次練習
          </button>
        </section>
      ) : (
        <>
          <section className="app-card sd-card sd-hero">
            <h2 className="sd-hello">{data.captainName}，今天也一起開心出航吧！</h2>
            <p className="sd-hero-sub">今天的任務幫你整理好了，一張一張完成就好，不用急。</p>
          </section>

          <section className="sd-section" aria-labelledby="sd-tasks-title">
            <h2 className="sd-section-title" id="sd-tasks-title">今日任務</h2>
            <TodayTasks tasks={data.todayTasks} />
          </section>

          <StrengthsFocus strengths={data.strengths} focusAreas={data.focusAreas} />

          <ProgressSummary
            overallAccuracy={data.overallAccuracy}
            weekly={data.weekly}
            consecutiveDays={gamification.consecutiveDays}
          />

          <section className="sd-section" aria-labelledby="sd-badges-title">
            <h2 className="sd-section-title" id="sd-badges-title">我的徽章</h2>
            <BadgeRow badges={gamification.badges} />
          </section>
        </>
      )}
    </main>
  );
}
