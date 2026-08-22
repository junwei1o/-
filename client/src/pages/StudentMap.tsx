import { StudentRelationMap } from "@/components/StudentRelationMap";
import { BookOpenCheck, Lightbulb, Orbit, ShieldCheck, TrendingUp } from "lucide-react";
import { loadAdaptiveProfile } from "@/game/adaptiveLearning";
import { loadRpgState } from "@/game/rpgStorage";
import { consumeMapReinforcementReward, loadCurrentWeekReinforcementJournal } from "@/game/mapReinforcementReward";
import { getAnimeWorldviewProgressSummary } from "@/game/animeWorldviewProgress";
import { getTodayLearningGuide } from "@/game/todayLearningGuide";
import { OBSERVATORY_ENTRIES } from "@/lib/mediaObservatory";
import { loadScenarioFavorites } from "@/lib/scenarioFavorites";
import { buildKnowledgeIslandSnapshots, type KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import { buildStudentLivingConnections } from "@/lib/studentLivingConnections";
import { TaiwanMainNavigationMap } from "@/components/TaiwanMainNavigationMap";
import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";

function levelFromAnswers(answerCount: number) {
  return Math.max(1, Math.floor(answerCount / 8) + 1);
}

function initialPuzzleProgress(answerCount: number) {
  return Math.min(100, Math.round((Math.min(answerCount, 20) / 20) * 100));
}

export default function StudentMap() {
  const [, setLocation] = useLocation();
  const [rpgState] = useState(() => loadRpgState());
  const [reinforcementReward] = useState(() => consumeMapReinforcementReward());
  const [reinforcementJournal] = useState(() => loadCurrentWeekReinforcementJournal());
  const [adaptiveProfile] = useState(() => loadAdaptiveProfile());
  const [scenarioFavorites] = useState(() => loadScenarioFavorites());
  const [todayGuide] = useState(() => getTodayLearningGuide(adaptiveProfile));
  const completedCount = rpgState.correctAnswerCount ?? rpgState.answeredEventIds.length;
  const activeCompanion = rpgState.companions.find((companion) => companion.id === rpgState.activeCompanionId) ?? rpgState.companions[0];
  const [observatoryProgress] = useState(() => getAnimeWorldviewProgressSummary(rpgState.animeWorldviewProgress));
  const knowledgeIslands = useMemo(() => buildKnowledgeIslandSnapshots(adaptiveProfile), [adaptiveProfile]);
  const livingConnections = useMemo(() => buildStudentLivingConnections({
    profile: adaptiveProfile,
    favoriteScenarioIds: scenarioFavorites,
    observatoryStations: observatoryProgress.stations.map((station) => ({
      title: OBSERVATORY_ENTRIES.find((entry) => entry.key === station.key)?.title ?? "",
      completed: station.completed,
    })),
  }), [adaptiveProfile, observatoryProgress.stations, scenarioFavorites]);

  return (
    <main className="student-map-page">
      <header className="student-map-intro">
        <p className="paper-exam-kicker">我的學習關係圖</p>
        <p>先從「我」出發：每一次練習、觀察與反思，都是拼上自己學習地圖的一塊。</p>
      </header>
      <nav className="student-map-launchpad" aria-label="地圖快速入口">
        <button type="button" className="student-map-launchpad-primary" onClick={() => setLocation("/practice")}>
          <BookOpenCheck size={19} aria-hidden="true" />
          <span><strong>直接開始試卷</strong><small>跳過地圖，立即進入今日練習</small></span>
        </button>
        <button type="button" className="student-map-launchpad-secondary" onClick={() => setLocation("/astronomy")}>
          <Orbit size={19} aria-hidden="true" />
          <span><strong>探索天文館</strong><small>從觀察宇宙開始</small></span>
        </button>
      </nav>
      <section className="student-map-guide" data-kind={todayGuide.kind} aria-labelledby="today-learning-guide-title">
        <div className="student-map-guide-icon" aria-hidden="true"><Lightbulb size={22} /></div>
        <div className="student-map-guide-copy">
          <p className="eyebrow">{todayGuide.eyebrow}</p>
          <h2 id="today-learning-guide-title">今天最推薦從哪一塊開始？</h2>
          <h3>{todayGuide.title}</h3>
          <p>{todayGuide.description}</p>
          <p className="student-map-guide-reason"><ShieldCheck size={15} aria-hidden="true" /> {todayGuide.reason}</p>
          <div className="student-map-guide-preview" role="note" aria-label="完成後可獲得的進度預告">
            <TrendingUp size={16} aria-hidden="true" />
            <div>
              <p>完成後可獲得的進度</p>
              <strong>{todayGuide.progressPreview}</strong>
            </div>
          </div>
        </div>
        <button type="button" className="student-map-guide-action" onClick={() => setLocation("/practice")}>{todayGuide.actionLabel}</button>
      </section>
      <section className="student-map-observatory-progress" aria-labelledby="observatory-progress-title" aria-label={`動漫觀測探索進度，已完成 ${observatoryProgress.completedStations} / ${observatoryProgress.totalStations} 站，整體完成度 ${observatoryProgress.completionPercentage}%`}>
        <div className="student-map-observatory-heading">
          <div>
            <p className="eyebrow">FIELD MEDIA PROGRESS</p>
            <h2 id="observatory-progress-title">動漫觀測探索</h2>
            <p>完成一站 5 題小測驗，就會在這裡留下實際最佳分數；重玩只更新較高分，不會重置已完成紀錄。</p>
          </div>
          <button type="button" className="student-map-observatory-open" onClick={() => setLocation("/observatory")}>前往觀測站</button>
        </div>
        <div className="student-map-observatory-meter" aria-hidden="true"><span style={{ width: `${observatoryProgress.completionPercentage}%` }} /></div>
        <p className="student-map-observatory-total"><strong>{observatoryProgress.completedStations}／{observatoryProgress.totalStations}</strong> 站已完成 · 整體探索 {observatoryProgress.completionPercentage}%</p>
        <ul className="student-map-observatory-list">
          {observatoryProgress.stations.map((station) => {
            const entry = OBSERVATORY_ENTRIES.find((item) => item.key === station.key);
            return <li key={station.key}><button type="button" onClick={() => setLocation(`/observatory/${station.key}`)} aria-label={`${entry?.title ?? station.key}：${station.completed ? `最佳 ${station.bestCorrect}／${station.total} 題，已完成` : "尚未完成小測驗"}`}><span>{entry?.title ?? station.key}</span><strong>{station.completed ? `最佳 ${station.bestCorrect}／${station.total} 題` : "尚未完成"}</strong><small>{station.completed ? `已挑戰 ${station.attempts} 次` : "開始 5 題小測驗"}</small></button></li>;
          })}
        </ul>
      </section>
      <TaiwanMainNavigationMap
        islands={knowledgeIslands}
        onOpenSubject={(subject: KnowledgeIslandSubject) => setLocation(`/practice?subject=${encodeURIComponent(subject)}&source=taiwan-main-map`)}
        onOpenTopic={(subject: KnowledgeIslandSubject, topic) => setLocation(`/practice?subject=${encodeURIComponent(subject)}&reviewTopic=${encodeURIComponent(topic)}&source=taiwan-main-map`)}
        onOpenWrongAnswers={(subject: KnowledgeIslandSubject) => setLocation(`/practice?subject=${encodeURIComponent(subject)}&wrongOnly=1&source=taiwan-main-map`)}
        unlockedRouteIds={rpgState.mapVictoryProgress?.unlockedRouteIds ?? []}
        supplyMarkerIds={rpgState.mapVictoryProgress?.supplyMarkerIds ?? []}
        reinforcementReward={reinforcementReward}
        reinforcementJournal={reinforcementJournal}
      />
      <StudentRelationMap
        studentName="我"
        level={levelFromAnswers(completedCount)}
        completedCount={completedCount}
        progress={initialPuzzleProgress(completedCount)}
        companionName={activeCompanion?.name ?? "星芽"}
        livingConnections={livingConnections}
        onOpenExam={() => setLocation("/practice")}
        onOpenAstronomy={() => setLocation("/astronomy")}
        onOpenPrinciples={() => setLocation("/principles")}
        onOpenCompanion={() => setLocation("/battle")}
        onOpenInsights={() => setLocation("/learning-insights")}
        onOpenObservatory={() => setLocation("/observatory")}
      />
    </main>
  );
}
