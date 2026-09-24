import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlarmClock, Backpack, BookOpenCheck, Bug, CalendarDays, ChevronLeft, ChevronRight, Coins, Compass, Crosshair, Dices, RotateCcw, ShieldAlert, Sparkles, Timer, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useQuestionBank } from "@/lib/questionBank";
import { getMemoryAlarmCount, loadAdaptiveProfile } from "@/game/adaptiveLearning";
import { getInventory } from "@/game/inventoryService";
import { loadRpgState } from "@/game/rpgStorage";
import { getJournalEntries } from "@/game/adventureJournal";
import { generateDailyAdventureSummary } from "@/game/academyExpansion";
import { QuizModal } from "@/components/QuizModal";
import { consumeStorageNotice, getDailySignIn, getLearningRecord, getPlayerData, getPlayerName, getSelectedTitle, hasSignedInToday, type LearningRecord } from "@/utils/storage";
import { DailySignInPill, requestOpenSignInPill } from "@/components/DailySignInPill";
import { HomeContactCard } from "@/components/HomeContactCard";
import { buildKnowledgeIslandSnapshots, type KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import { ONION_ACADEMY_ROUTE, pickRecommendedLesson, weakestSubjectThisWeek } from "@/lib/recommendedLesson";
import { loadStudentGradePreference } from "@/lib/studentGradePreference";
import { loadUserPreferences, saveUserPreferences, MIN_GRADE, MAX_GRADE, type UserGradeLevel, type UserDifficultyPreference } from "@/game/adaptiveLearning";
import { HOME_FEATURE_GROUPS } from "@/lib/homeFeatureDirectory";
import type { PaperQuestion } from "@/lib/paperExam";
import FirstLightQuest from "@/components/bx/FirstLightQuest";
import { useBxVersion } from "@/components/bx/useBx";
import { bxStore } from "@/game/bxStore";
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
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>(() => getLearningRecord());
  const [playerData, setPlayerData] = useState(() => getPlayerData());
  const [selectedTitle, setSelectedTitle] = useState(() => getSelectedTitle());
  const [dailySignIn, setDailySignIn] = useState(() => getDailySignIn());

  const previousGoldRef = useRef(playerData.gold);
  const [isGoldPulseActive, setIsGoldPulseActive] = useState(false);
  const [quizSubject, setQuizSubject] = useState<KnowledgeIslandSubject | null>(null);
  const [showBackpack, setShowBackpack] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  // 訂閱 BX 偏好：快速行動側邊欄總開關與懸浮鈕開關可在設定頁隨時切換。
  useBxVersion();
  const enableQuickSidebar = bxStore.get<boolean>("prefs.enableQuickSidebar", true) ?? true;
  const showQuickFloatBtn = bxStore.get<boolean>("prefs.showQuickFloatBtn", true) ?? true;
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
  const dailyAdventureSummary = useMemo(() => generateDailyAdventureSummary({ date: Date.now(), entries: getJournalEntries() }), [learningRecords.length, rpgState.correctAnswerCount]);
  const signedInToday = hasSignedInToday(dailySignIn);
  // 本週建議（原本寫好卻從未顯示在首頁）＋今日推薦動畫微課
  const weeklySuggestion = useMemo(() => buildWeeklySuggestion(learningRecords), [learningRecords]);
  // 年級設定引導：沒設過年級時，所有「依年級」的題目與動畫課分流都不會生效
  const [myGrade, setMyGrade] = useState(() => loadStudentGradePreference());
  // 內容等級上限是六年級（MAX_GRADE），選項只提供 三年級～六年級。
  const CONTENT_LEVELS: UserGradeLevel[] = Array.from(
    { length: MAX_GRADE - MIN_GRADE + 1 },
    (_, index) => (MIN_GRADE + index) as UserGradeLevel,
  );
  const DIFFICULTY_OPTIONS: UserDifficultyPreference[] = ["簡單優先", "均衡混合", "挑戰優先"];
  // 設定流程是否展開：myGrade===null 表示尚未設定；「重新設定」會重新展開並回填當前值。
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(myGrade === null);
  const [draftGrade, setDraftGrade] = useState<UserGradeLevel>(myGrade ?? loadUserPreferences().gradeLevel);
  const [draftDifficulty, setDraftDifficulty] = useState<UserDifficultyPreference>(loadUserPreferences().difficultyPreference);
  const recommended = useMemo(() => {
    // 內容等級上限是六年級，推薦動畫課一律對應國小內容。
    const stage = "國小";
    return pickRecommendedLesson({ stage, weakSubject: weakestSubjectThisWeek(learningRecords)?.subject ?? null });
  }, [learningRecords]);

  useEffect(() => {
    if (!isActionsOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsActionsOpen(false);
        // 懸浮鈕在關閉後才掛載，延遲到重渲染後再恢復焦點。
        window.setTimeout(() => actionsToggleRef.current?.focus(), 0);
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
    setLearningRecords(getLearningRecord());
    setPlayerData(getPlayerData());
    setSelectedTitle(getSelectedTitle());
    setDailySignIn(getDailySignIn());
    const notice = consumeStorageNotice();
    if (notice) toast.warning(notice.message);
  }, []);

  // 簽到不再於進站時自動彈出，入口改放在「快速行動」側邊欄的膠囊（DailySignInPill）。
  // 這裡只負責在膠囊完成簽到後同步首頁的金幣與簽到卡，避免兩邊數字互相矛盾。
  useEffect(() => {
    const handleClaimed = () => refreshLearningData();
    window.addEventListener("xue-signin-claimed", handleClaimed);
    return () => window.removeEventListener("xue-signin-claimed", handleClaimed);
  }, [refreshLearningData]);

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
    // 簽到只有一條路徑（dailySignIn.ts）：首頁的其他簽到卡不再自己領取，
    // 而是展開「快速行動」側邊欄裡的簽到膠囊，避免兩個連續天數各自累加、互相矛盾。
    setIsActionsOpen(true);
    // 側邊欄本輪才展開，膠囊要等下一個渲染週期掛載後才收得到展開事件。
    window.setTimeout(() => requestOpenSignInPill(), 0);
  }

  function handleFinishSetup() {
    // 一次儲存「內容等級」與「難度偏好」兩個值，避免分開寫入造成不一致。
    const prefs = loadUserPreferences();
    saveUserPreferences({ ...prefs, gradeLevel: draftGrade, difficultyPreference: draftDifficulty, updatedAt: Date.now() });
    setMyGrade(draftGrade);
    setIsSetupOpen(false);
  }

  function handleResetSetup() {
    // 重新展開流程並回填目前儲存的值（內容等級與難度偏好）。
    const prefs = loadUserPreferences();
    setDraftGrade(myGrade ?? prefs.gradeLevel);
    setDraftDifficulty(prefs.difficultyPreference);
    setIsSetupOpen(true);
  }

  return (
    <main className="home-dashboard" aria-label="寶島探險家學習儀表板">
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

        {isSetupOpen ? (
          <section className="home-grade-setup" aria-labelledby="home-grade-title">
            <p className="home-dashboard-eyebrow">STEP 1 · 內容等級</p>
            <h2 id="home-grade-title">內容等級</h2>
            <p className="home-grade-desc">內容等級決定你會看到的題目、動畫課與每日推薦；它和玩家的等級（Lv.）不同，請依照目前就讀的年級選擇（上限為六年級）。</p>
            <div className="home-grade-chips" role="group" aria-label="選擇內容等級">
              {CONTENT_LEVELS.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  className={`home-grade-chip${draftGrade === grade ? " is-selected" : ""}`}
                  aria-pressed={draftGrade === grade}
                  onClick={() => setDraftGrade(grade)}
                >
                  {grade} 年級
                </button>
              ))}
            </div>
            <p className="home-dashboard-eyebrow home-grade-step2">STEP 2 · 難度偏好</p>
            <h3 className="home-grade-step-title">難度偏好</h3>
            <div className="home-grade-chips" role="group" aria-label="選擇難度偏好">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`home-grade-chip${draftDifficulty === option ? " is-selected" : ""}`}
                  aria-pressed={draftDifficulty === option}
                  onClick={() => setDraftDifficulty(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <button type="button" className="home-grade-finish" onClick={handleFinishSetup}>
              完成設定
            </button>
          </section>
        ) : (
          <p className="home-grade-done">
            目前內容等級：{myGrade} 年級（難度：{loadUserPreferences().difficultyPreference}） ·{" "}
            <button
              type="button"
              className="home-grade-change"
              onClick={handleResetSetup}
            >
              重新設定
            </button>
          </p>
        )}

        <section className="home-focus-card" aria-labelledby="home-focus-title">
          <div className="home-focus-head">
            <div>
              <p className="home-dashboard-eyebrow">THIS WEEK · MICRO LESSON</p>
              <h2 id="home-focus-title">本週建議與推薦動畫課</h2>
            </div>
          </div>
          <p className="home-focus-suggestion">{weeklySuggestion}</p>
          {recommended ? (
            <button
              type="button"
              className="home-focus-lesson"
              onClick={() => setLocation(ONION_ACADEMY_ROUTE)}
            >
              <span className="home-focus-lesson-subject">{recommended.lesson.subject}</span>
              <span className="home-focus-lesson-body">
                <strong>{recommended.lesson.title}</strong>
                <small>{recommended.lesson.grade} · {recommended.reason}</small>
              </span>
              <span className="home-focus-lesson-cta">看動畫 <ChevronRight size={14} aria-hidden="true" /></span>
            </button>
          ) : null}
        </section>

        <section className="home-mode-hub" aria-labelledby="home-mode-hub-title">
          <div className="home-mode-hub-heading">
            <div>
              <p className="home-dashboard-eyebrow">EXPEDITION MODES</p>
              <h2 id="home-mode-hub-title">選擇下一段學習航線</h2>
            </div>
            <p>三種單機模式都會保留在你的本機學習軌跡中。</p>
          </div>
          <div className="home-mode-grid">
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
        {enableQuickSidebar ? (
          <div className={`home-quick-sidebar ${isActionsOpen ? "is-open" : "is-collapsed"}`} data-open={isActionsOpen}>
            <button type="button" className="home-quick-sidebar-backdrop" aria-label="關閉快速行動側邊欄" onClick={closeActions} tabIndex={isActionsOpen ? 0 : -1} />
            {!isActionsOpen ? (
              <button
                type="button"
                ref={actionsToggleRef}
                className={showQuickFloatBtn ? "home-quick-fab" : "home-quick-edge"}
                aria-controls="home-dashboard-actions-panel"
                aria-expanded={false}
                aria-label="開啟快速行動"
                title="開啟快速行動"
                onClick={() => setIsActionsOpen(true)}
              >
                <Zap size={18} aria-hidden="true" />
                <span>開啟快速行動</span>
              </button>
            ) : null}
            <aside className="home-quick-panel" aria-label="快速行動側邊欄" aria-hidden={!isActionsOpen}>
              <header className="home-quick-panel-head">
                <strong><Zap size={16} aria-hidden="true" /> 快速行動</strong>
                <div className="home-quick-panel-head-actions">
                  <button type="button" ref={isActionsOpen ? actionsToggleRef : undefined} className="home-quick-panel-collapse" aria-controls="home-dashboard-actions-panel" aria-expanded={isActionsOpen} onClick={closeActions}>
                    <span>收合快速行動</span>
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <button type="button" className="home-quick-panel-close" onClick={closeActions} aria-label="關閉側邊欄"><X size={16} aria-hidden="true" /></button>
                </div>
              </header>
              <nav id="home-dashboard-actions-panel" className="home-dashboard-actions" aria-label="快速行動" aria-hidden={!isActionsOpen}>
                <button ref={firstActionRef} tabIndex={isActionsOpen ? 0 : -1} type="button" className="home-dashboard-action primary" onClick={() => openSubject(firstUse ? islands[0].subject : nextIsland.subject)}><BookOpenCheck size={19} aria-hidden="true" /> {firstUse ? "開始探險" : "繼續探險"}<small>{firstUse ? "從國文島・台北啟航" : `前往${nextIsland.shortTitle}`}</small></button>
                <button tabIndex={isActionsOpen ? 0 : -1} type="button" className="home-dashboard-action" onClick={() => setLocation("/wrong-answers")}><RotateCcw size={18} aria-hidden="true" /> 錯題重練<small>整理真實作答線索</small></button>
                <button tabIndex={isActionsOpen ? 0 : -1} type="button" className={`home-dashboard-action home-dashboard-memory-alarm ${memoryAlarmCount > 0 ? "has-due" : ""}`} onClick={() => setLocation("/review-hub")} aria-label={memoryAlarmCount > 0 ? `記憶警報，今日有 ${memoryAlarmCount} 題到期複習` : "記憶警報，目前沒有到期複習"}><AlarmClock size={18} aria-hidden="true" /> 記憶警報<small>{memoryAlarmCount > 0 ? `今日有 ${memoryAlarmCount} 題線索回來了` : "目前沒有到期題目"}</small>{memoryAlarmCount > 0 && <strong aria-hidden="true">{memoryAlarmCount}</strong>}</button>
                <button tabIndex={isActionsOpen ? 0 : -1} type="button" className="home-dashboard-action" disabled={questions.length === 0} onClick={startRandomAdventure}><Dices size={18} aria-hidden="true" /> 隨機冒險<small>答對可獲雙倍金幣</small></button>
                <DailySignInPill tabbable={isActionsOpen} />
              </nav>
              <HomeContactCard />
            </aside>
          </div>
        ) : null}
      </div>
      {quizSubject ? (() => {
        const question = questions.find((item) => item.subject === quizSubject);
        return question ? <QuizModal question={question} subject={quizSubject} onClose={() => setQuizSubject(null)} onCompleted={refreshLearningData} /> : null;
      })() : null}
    </main>
  );
}
