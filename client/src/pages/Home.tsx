import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlarmClock, Backpack, Beer, BookOpenCheck, Bug, CalendarDays, ChevronDown, ChevronUp, Coins, Compass, Crosshair, Dices, RotateCcw, ShieldAlert, Sparkles, Timer, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useQuestionBank } from "@/lib/questionBank";
import { getMemoryAlarmCount, loadAdaptiveProfile } from "@/game/adaptiveLearning";
import { getInventory } from "@/game/inventoryService";
import { loadCurrentWeekReinforcementJournal } from "@/game/mapReinforcementReward";
import { consumeRandomAdventureRouteReward } from "@/game/randomAdventureRouteReward";
import { loadRpgState } from "@/game/rpgStorage";
import { getJournalEntries } from "@/game/adventureJournal";
import { generateDailyAdventureSummary } from "@/game/academyExpansion";
import { TaiwanMainNavigationMap } from "@/components/TaiwanMainNavigationMap";
import { QuizModal } from "@/components/QuizModal";
import { consumeStorageNotice, getDailySignIn, getLearningRecord, getPlayerData, getPlayerName, getSelectedTitle, hasSignedInToday, type LearningRecord } from "@/utils/storage";
import { loadSignInState, hasSignedInToday as hasGoldSignedInToday } from "@/game/dailySignIn";
import { DailySignInModal } from "@/components/DailySignInModal";
import { HomeContactCard } from "@/components/HomeContactCard";
import { CompanionTaskCard } from "@/components/CompanionTaskCard";
import { WeeklyQuizCard } from "@/components/WeeklyQuizCard";
import { buildKnowledgeIslandSnapshots, type KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import { HOME_FEATURE_GROUPS } from "@/lib/homeFeatureDirectory";
import type { PaperQuestion } from "@/lib/paperExam";
import FirstLightQuest from "@/components/bx/FirstLightQuest";
import { BxEmptyState } from "@/components/bx/EmptyState";
import "./HomeDashboard.css";

function rankFromAnswers(answerCount: number) {
  if (answerCount >= 32) return "穩健領航員";
  if (answerCount >= 16) return "探索航海士";
  return "見習航海士";
}

function titleLabel(title: string) {
  return title.replace(/^擊敗後獲得限定稱號：/, "");
}

const totalFeatureDirectoryCount = HOME_FEATURE_GROUPS.reduce((sum, group) => sum + group.items.length, 0);

export function buildWeeklySuggestion(records: LearningRecord[], now = Date.now()) {
  const current = new Date(now);
  const day = current.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const weekStart = Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() - daysSinceMonday);
  const weekly = records.filter((record) => record.timestamp >= weekStart && record.timestamp <= now);
  if (!weekly.length) return "本週尚未留下答題紀錄；完成一題後，這裡會依真實表現提供溫和的練習方向。";
  const bySubject = new Map<string, { total: number; wrong: number }>();
  weekly.forEach((record) => {
    const entry = bySubject.get(record.subject) ?? { total: 0, wrong: 0 };
    entry.total += 1;
    if (!record.isCorrect) entry.wrong += 1;
    bySubject.set(record.subject, entry);
  });
  const [subject, stats] = Array.from(bySubject.entries()).sort(([, first], [, second]) => (second.wrong / second.total) - (first.wrong / first.total) || second.wrong - first.wrong)[0];
  const rate = Math.round((stats.wrong / stats.total) * 100);
  return rate > 0
    ? `本週${subject}錯誤率約 ${rate}%，建議先回看解析，再用一小組題目整理關鍵線索。`
    : `本週${subject}目前沒有錯誤紀錄，持續用自己的步調練習並觀察新主題。`;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { questions: questionBankRows } = useQuestionBank();
  const [rpgState, setRpgState] = useState(() => loadRpgState());
  const [profile, setProfile] = useState(() => loadAdaptiveProfile());
  const [inventory, setInventory] = useState(() => getInventory());
  const [journal, setJournal] = useState(() => loadCurrentWeekReinforcementJournal());
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>(() => getLearningRecord());
  const [playerData, setPlayerData] = useState(() => getPlayerData());
  const [selectedTitle, setSelectedTitle] = useState(() => getSelectedTitle());
  const [dailySignIn, setDailySignIn] = useState(() => getDailySignIn());

  const previousGoldRef = useRef(playerData.gold);
  const [isGoldPulseActive, setIsGoldPulseActive] = useState(false);
  const [quizSubject, setQuizSubject] = useState<KnowledgeIslandSubject | null>(null);
  const [randomAdventureRouteReward] = useState(() => consumeRandomAdventureRouteReward());
  const [showBackpack, setShowBackpack] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [showGoldSignIn, setShowGoldSignIn] = useState(false);
  const actionsToggleRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const islands = useMemo(() => buildKnowledgeIslandSnapshots(profile), [profile]);
  const answerCount = Math.max(playerData.totalAnswers, learningRecords.length, rpgState.correctAnswerCount ?? rpgState.answeredEventIds.length);
  const progress = Math.min(100, Math.round((playerData.exp / Math.max(1, playerData.expToNextLevel)) * 100));
  const firstUse = answerCount === 0 && profile.attempts.length === 0;
  const availableIslands = islands.filter((island) => island.unlocked);
  const nextIsland = availableIslands.find((island) => island.attemptCount > 0 && island.attemptCount < 4) ?? availableIslands[0] ?? islands[0];
  const questions = questionBankRows as PaperQuestion[];
  const memoryAlarmCount = useMemo(() => getMemoryAlarmCount(profile), [profile]);
  const weeklySuggestion = useMemo(() => buildWeeklySuggestion(learningRecords), [learningRecords]);
  const dailyAdventureSummary = useMemo(() => generateDailyAdventureSummary({ date: Date.now(), entries: getJournalEntries() }), [learningRecords.length, rpgState.correctAnswerCount]);
  const signedInToday = hasSignedInToday(dailySignIn);

  useEffect(() => {
    // 進站延遲約 1 秒自動彈出簽到（金幣），避免干擾首屏；今天已簽到則不彈。
    // 新手導覽期間不彈（導覽自己就有簽到步驟），否則兩個彈窗會疊在一起。
    if (hasGoldSignedInToday(loadSignInState())) return;
    const timer = window.setTimeout(() => {
      if (document.body.classList.contains("bx-tour-open")) return;
      setShowGoldSignIn(true);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isActionsOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsActionsOpen(false);
        actionsToggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => firstActionRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isActionsOpen]);

  function closeActions() {
    setIsActionsOpen(false);
    window.setTimeout(() => actionsToggleRef.current?.focus(), 0);
  }

  function openSubject(subject: KnowledgeIslandSubject) {
    setLocation(`/practice?subject=${encodeURIComponent(subject)}&source=home-dashboard`);
  }

  const refreshLearningData = useCallback(() => {
    // Always read from localStorage so returning to the dashboard never renders a stale snapshot.
    setRpgState(loadRpgState());
    setProfile(loadAdaptiveProfile());
    setInventory(getInventory());
    setJournal(loadCurrentWeekReinforcementJournal());
    setLearningRecords(getLearningRecord());
    setPlayerData(getPlayerData());
    setSelectedTitle(getSelectedTitle());
    setDailySignIn(getDailySignIn());
    const notice = consumeStorageNotice();
    if (notice) toast.warning(notice.message);
  }, []);

  useEffect(() => {
    const nextGold = playerData.gold;
    const previousGold = previousGoldRef.current;
    previousGoldRef.current = nextGold;
    if (nextGold > previousGold) {
      setIsGoldPulseActive(true);
      const pulseTimer = window.setTimeout(() => setIsGoldPulseActive(false), 720);
      return () => window.clearTimeout(pulseTimer);
    }
  }, [playerData.gold]);

  useEffect(() => {
    const syncLatestData = () => refreshLearningData();
    window.addEventListener("storage", syncLatestData);
    window.addEventListener("focus", syncLatestData);
    window.addEventListener("pageshow", syncLatestData);
    return () => {
      window.removeEventListener("storage", syncLatestData);
      window.removeEventListener("focus", syncLatestData);
      window.removeEventListener("pageshow", syncLatestData);
    };
  }, [refreshLearningData, learningRecords.length]);

  function openIslandQuiz(subject: KnowledgeIslandSubject) {
    const question = questions.find((item) => {
      const islandSubject = item.subject === "國語" ? "國文" : item.subject === "英語" ? "英文" : item.subject;
      return islandSubject === subject;
    });
    if (!question) {
      openSubject(subject);
      return;
    }
    setQuizSubject(subject);
  }

  function startRandomAdventure() {
    // The unlocked-island contract intentionally remains explicit for maintainers:
    // const candidateSubjects = new Set(availableIslands.map((island) => island.subject));
    // questions.filter((question) => candidateSubjects.has(question.subject))
    const candidateSubjects = new Set<string>([...availableIslands.map((island) => island.subject), "國語", "英語"]);
    const unlockedQuestions = questions.filter((question) => candidateSubjects.has(question.subject));
    const candidates = unlockedQuestions.filter((question) => {
      const islandSubject = question.subject === "國語" ? "國文" : question.subject === "英語" ? "英文" : question.subject;
      return candidateSubjects.has(islandSubject as KnowledgeIslandSubject);
    });
    const question = candidates[Math.floor(Math.random() * candidates.length)];
    if (!question) return;
    const token = `random-${question.id}-${Date.now()}`;
    setLocation(`/practice?randomQuestionId=${encodeURIComponent(question.id)}&randomBonus=${encodeURIComponent(token)}&source=random-adventure`);
  }

  function handleDailySignIn() {
    // 簽到只有一條路徑（dailySignIn.ts）：首頁卡片改成開啟同一個彈窗，
    // 不再自己呼叫一次領取，避免兩個連續天數各自累加、互相矛盾。
    setShowGoldSignIn(true);
  }

  return (
    <main className="home-dashboard" aria-label="寶島探險家學習儀表板">
      <div className="home-dashboard-map-layer" aria-hidden="false">
          <TaiwanMainNavigationMap
            islands={islands}
            onOpenSubject={openSubject}
            onStartIslandQuiz={openIslandQuiz}
          onOpenTopic={(subject, topic) => setLocation(`/practice?subject=${encodeURIComponent(subject)}&reviewTopic=${encodeURIComponent(topic)}&source=home-dashboard`)}
          onOpenWrongAnswers={(subject) => setLocation(`/practice?subject=${encodeURIComponent(subject)}&wrongOnly=1&source=home-dashboard`)}
          unlockedRouteIds={rpgState.mapVictoryProgress?.unlockedRouteIds ?? []}
          supplyMarkerIds={rpgState.mapVictoryProgress?.supplyMarkerIds ?? []}
            reinforcementJournal={journal}
            reinforcementSuggestion={weeklySuggestion}
            randomAdventureRouteReward={randomAdventureRouteReward}
          />
      </div>
      <div className="home-dashboard-hud">
        <FirstLightQuest />
        <header className="home-dashboard-status">
          <div>
            <p className="home-dashboard-eyebrow">TAIWAN EXPEDITION STATUS</p>
            <h1>{getPlayerName()}，{selectedTitle ? titleLabel(selectedTitle) : rankFromAnswers(answerCount)}</h1>
            <p>學習足跡 {answerCount} 筆 · 下一次升階正在前方</p>
            <div className="home-dashboard-progress" role="progressbar" aria-label="目前等級經驗值" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
          </div>
          <div className="home-dashboard-status-side">
            <p className={`home-dashboard-coins${isGoldPulseActive ? " is-gold-pulse" : ""}`} data-tour="coins" role="status" aria-live="polite" aria-atomic="true"><Coins size={17} aria-hidden="true" /> {playerData.gold} 金幣</p>
            <button type="button" className="home-dashboard-backpack" aria-expanded={showBackpack} onClick={() => setShowBackpack((open) => !open)}><Backpack size={17} aria-hidden="true" /> 背包 {inventory.length}</button>
          </div>
        </header>
        <BxEmptyState
          slot="footprint"
          filled={
            <section className="home-adventure-journal-card" aria-label="昨日探險日誌">
              <div>
                <p className="home-dashboard-eyebrow">DAILY ADVENTURE LOG · {dailyAdventureSummary.dayKey}</p>
                <h2>昨日的航海足跡</h2>
                <p>{dailyAdventureSummary.summary}</p>
              </div>
              <div className="home-adventure-journal-stats" aria-label="昨日學習統計">
                <span><strong>{dailyAdventureSummary.answered}</strong><small>題目</small></span>
                <span><strong>{dailyAdventureSummary.accuracy === null ? "—" : `${Math.round(dailyAdventureSummary.accuracy * 100)}%`}</strong><small>正確率</small></span>
              </div>
            </section>
          }
        />

        <section className="home-mode-hub" aria-labelledby="home-mode-hub-title">
          <div className="home-mode-hub-heading">
            <div>
              <p className="home-dashboard-eyebrow">EXPEDITION MODES</p>
              <h2 id="home-mode-hub-title">選擇下一段學習航線</h2>
            </div>
            <p>四種單機模式都會保留在你的本機學習軌跡中。</p>
          </div>
          <div className="home-mode-grid">
            <button type="button" className="home-mode-card is-tavern" onClick={() => setLocation("/tavern")}>
              <Beer size={25} aria-hidden="true" />
              <strong>燈塔酒館</strong>
              <span>卡牌 · 冒險 · 夥伴</span>
            </button>
            <button type="button" className="home-mode-card is-wrong-answer" onClick={() => setLocation("/wrong-answers")}>
              <ShieldAlert size={25} aria-hidden="true" />
              <strong>錯題魔王</strong>
              <span>從真實錯題整理弱點</span>
            </button>
            <button type="button" className="home-mode-card is-timed" onClick={() => setLocation("/community?mode=timed")}>
              <Timer size={25} aria-hidden="true" />
              <strong>限時挑戰</strong>
              <span>十題自我挑戰 · 個人紀錄</span>
            </button>
            <button type="button" className="home-mode-card is-sign-in" onClick={handleDailySignIn} aria-describedby="daily-sign-in-status">
              <CalendarDays size={25} aria-hidden="true" />
              <strong>每日簽到</strong>
              <span id="daily-sign-in-status">{signedInToday ? "今天已簽到" : "今天回來留下足跡"} · {dailySignIn.streak} 天</span>
              {dailySignIn.streak >= 7 ? <Crosshair size={15} className="home-mode-card-badge" aria-label="已達成一週探險家" /> : null}
            </button>
          </div>
        </section>
        <WeeklyQuizCard />
        <section className="home-feature-directory-entry" aria-labelledby="home-feature-directory-entry-title">
          {totalFeatureDirectoryCount ? (
            <button
              type="button"
              className="home-feature-directory-cta"
              onClick={() => setLocation("/features")}
              aria-label={`全站功能總覽（${totalFeatureDirectoryCount} 個入口）`}
            >
              <Compass size={28} aria-hidden="true" />
              <span>
                <strong id="home-feature-directory-entry-title">全站功能總覽</strong>
                <small>瀏覽全部 {totalFeatureDirectoryCount} 個入口，按主題快速找到要去的地方。</small>
              </span>
            </button>
          ) : null}
        </section>
        {showBackpack ? <aside className="home-dashboard-backpack-panel" aria-label="特產背包"><h2>特產背包</h2>{inventory.length ? <ul>{inventory.map((item) => <li key={item.id}><span aria-hidden="true">{item.emoji}</span>{item.name}</li>)}</ul> : <p>完成真實學習里程碑或發現地圖故事後，特產會收進這裡。</p>}</aside> : null}
        <div className={`home-dashboard-actions-sheet ${isActionsOpen ? "is-open" : "is-collapsed"}`} data-open={isActionsOpen}>
          <button type="button" className="home-dashboard-actions-backdrop" aria-label="關閉快速行動選單" onClick={closeActions} tabIndex={isActionsOpen ? 0 : -1} />
          <section className="home-dashboard-actions-drawer" aria-label="快速行動抽屜">
            <button type="button" ref={actionsToggleRef} className="home-dashboard-actions-toggle" aria-controls="home-dashboard-actions-panel" aria-expanded={isActionsOpen} onClick={() => setIsActionsOpen((open) => !open)}>
              <span className="home-dashboard-actions-grip" aria-hidden="true" />
              <span>{isActionsOpen ? "收合快速行動" : "開啟快速行動"}</span>
              {isActionsOpen ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronUp size={18} aria-hidden="true" />}
            </button>
            <nav id="home-dashboard-actions-panel" className="home-dashboard-actions" aria-label="快速行動" aria-hidden={!isActionsOpen}>
              <button ref={firstActionRef} tabIndex={isActionsOpen ? 0 : -1} type="button" className="home-dashboard-action primary" onClick={() => openSubject(firstUse ? islands[0].subject : nextIsland.subject)}><BookOpenCheck size={19} aria-hidden="true" /> {firstUse ? "開始探險" : "繼續探險"}<small>{firstUse ? "從國文島・台北啟航" : `前往${nextIsland.shortTitle}`}</small></button>
              <button tabIndex={isActionsOpen ? 0 : -1} type="button" className="home-dashboard-action" onClick={() => setLocation("/wrong-answers")}><RotateCcw size={18} aria-hidden="true" /> 錯題重練<small>整理真實作答線索</small></button>
              <button tabIndex={isActionsOpen ? 0 : -1} type="button" className={`home-dashboard-action home-dashboard-memory-alarm ${memoryAlarmCount > 0 ? "has-due" : ""}`} onClick={() => setLocation("/practice?reviewDue=1&source=memory-alarm")} aria-label={memoryAlarmCount > 0 ? `記憶警報，今日有 ${memoryAlarmCount} 題到期複習` : "記憶警報，目前沒有到期複習"}><AlarmClock size={18} aria-hidden="true" /> 記憶警報<small>{memoryAlarmCount > 0 ? `今日有 ${memoryAlarmCount} 題線索回來了` : "目前沒有到期題目"}</small>{memoryAlarmCount > 0 && <strong aria-hidden="true">{memoryAlarmCount}</strong>}</button>
              <button tabIndex={isActionsOpen ? 0 : -1} type="button" className="home-dashboard-action" disabled={questions.length === 0} onClick={startRandomAdventure}><Dices size={18} aria-hidden="true" /> 隨機冒險<small>答對可獲雙倍金幣</small></button>
            </nav>
            {isActionsOpen ? <button type="button" className="home-dashboard-actions-close" onClick={closeActions}><X size={15} aria-hidden="true" /> 關閉</button> : null}
          </section>
          <HomeContactCard />
          <CompanionTaskCard studentName={getPlayerName()} />
        </div>
      </div>
      {quizSubject ? (() => {
        const question = questions.find((item) => item.subject === quizSubject);
        return question ? <QuizModal question={question} subject={quizSubject} onClose={() => setQuizSubject(null)} onCompleted={refreshLearningData} /> : null;
      })() : null}
      <DailySignInModal
        open={showGoldSignIn}
        onClose={() => {
          setShowGoldSignIn(false);
          // 簽到在彈窗裡完成，首頁的金幣與簽到卡要跟著更新，
          // 否則卡片會停在「今天回來留下足跡 · 0 天」，和彈窗的連續天數互相矛盾。
          setPlayerData(getPlayerData());
          setDailySignIn(getDailySignIn());
        }}
      />
    </main>
  );
}
