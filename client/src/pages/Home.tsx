import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlarmClock, Backpack, BarChart3, BookOpenCheck, BrainCircuit, Bug, CalendarDays, ChevronDown, ChevronUp, Coins, Crosshair, Crown, Dices, RotateCcw, ScrollText, Settings as SettingsIcon, ShieldAlert, Sparkles, Swords, Telescope, Timer, type LucideIcon, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getMemoryAlarmCount, loadAdaptiveProfile } from "@/game/adaptiveLearning";
import { loadUserPreferences, saveUserPreferences, type UserGradeLevel, type UserDifficultyPreference } from "@/game/adaptiveLearning";
import { getInventory } from "@/game/inventoryService";
import { loadCurrentWeekReinforcementJournal } from "@/game/mapReinforcementReward";
import { consumeRandomAdventureRouteReward } from "@/game/randomAdventureRouteReward";
import { loadRpgState } from "@/game/rpgStorage";
import { getJournalEntries } from "@/game/adventureJournal";
import { generateDailyAdventureSummary } from "@/game/academyExpansion";
import { TaiwanMainNavigationMap } from "@/components/TaiwanMainNavigationMap";
import { QuizModal } from "@/components/QuizModal";
import { claimDailySignIn, consumeStorageNotice, getDailySignIn, getLearningRecord, getPlayerData, getPlayerName, getSelectedTitle, hasSignedInToday, type LearningRecord } from "@/utils/storage";
import { buildKnowledgeIslandSnapshots, type KnowledgeIslandSubject } from "@/lib/studentKnowledgeIslands";
import type { PaperQuestion } from "@/lib/paperExam";
import { LOCAL_CURRICULUM_PAPER_QUESTIONS } from "@/game/expeditionPaperAdapter";
import "./HomeDashboard.css";

function toLocalPaperQuestions(): PaperQuestion[] {
  return LOCAL_CURRICULUM_PAPER_QUESTIONS;
}

function rankFromAnswers(answerCount: number) {
  if (answerCount >= 32) return "穩健領航員";
  if (answerCount >= 16) return "探索航海士";
  return "見習航海士";
}

function titleLabel(title: string) {
  return title.replace(/^擊敗後獲得限定稱號：/, "");
}

type HomeFeatureItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type HomeFeatureGroup = {
  id: string;
  label: string;
  description: string;
  items: HomeFeatureItem[];
};

const HOME_FEATURE_GROUPS: HomeFeatureGroup[] = [
  {
    id: "learning",
    label: "學習與複習",
    description: "從課綱練習、錯題到學習報告。",
    items: [
      { id: "practice", label: "課綱練習", description: "依科目與進度開始答題", href: "/practice", icon: BookOpenCheck },
      { id: "wrong-answers", label: "錯題複習", description: "整理並補強真實錯題", href: "/wrong-answers", icon: RotateCcw },
      { id: "learning-insights", label: "學習洞察", description: "查看弱點與練習建議", href: "/learning-insights", icon: BrainCircuit },
      { id: "learning-report", label: "學習報告", description: "回顧答題與成長趨勢", href: "/learning-report", icon: BarChart3 },
    ],
  },
  {
    id: "expedition",
    label: "探險與對戰",
    description: "從主航海圖出發，解放知識島嶼。",
    items: [
      { id: "map", label: "主航海圖", description: "瀏覽島嶼與學習路線", href: "/map", icon: ScrollText },
      { id: "battle", label: "答題戰鬥", description: "運用技能迎戰知識怪物", href: "/battle", icon: Swords },
      { id: "guardian", label: "守護者遠征", description: "挑戰四位區域守護者", href: "/guardian", icon: Crown },
      { id: "knowledge-duel", label: "知識決鬥", description: "單機 AI 策略卡牌對戰", href: "/duel", icon: Crosshair },
      { id: "self-challenge", label: "自我挑戰", description: "限時答題與個人最佳紀錄", href: "/community", icon: Timer },
      { id: "adventure-journal", label: "探險日誌", description: "查看每日與歷史航海足跡", href: "/adventure-journal", icon: CalendarDays },
    ],
  },
  {
    id: "knowledge",
    label: "知識探索館",
    description: "用不同主題延伸好奇心與閱讀。",
    items: [
      { id: "astronomy", label: "天文館", description: "探索星空、行星與太空任務", href: "/astronomy", icon: Telescope },
      { id: "wisdom", label: "智慧故事館", description: "閱讀故事並發現知識線索", href: "/wisdom", icon: Sparkles },
      { id: "principles", label: "世界原理站", description: "以互動方式理解科學原理", href: "/principles", icon: Dices },
      { id: "observatory", label: "影視觀測站", description: "從作品主題延伸素養觀察", href: "/observatory", icon: Telescope },
    ],
  },
  {
    id: "support",
    label: "學習支援與設定",
    description: "管理設定、分析錯誤類型與查看摘要。",
    items: [
      { id: "error-statistics", label: "錯誤類型統計", description: "辨識概念、粗心與記憶弱點", href: "/error-statistics", icon: ShieldAlert },
      { id: "learning-summary", label: "教師／家長摘要", description: "以 PIN 保護查看學習概況", href: "/learning-summary", icon: BarChart3 },
      { id: "settings", label: "設定與個人化", description: "調整主題、稱號、音效與無障礙選項", href: "/settings", icon: SettingsIcon },
    ],
  },
];

function normalizeFeatureQuery(value: string) {
  return value.trim().toLocaleLowerCase("zh-TW").replace(/\s+/g, "");
}

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
  const { data, isLoading } = trpc.questionBank.list.useQuery({ limit: 500 });
  const [rpgState, setRpgState] = useState(() => loadRpgState());
  const [profile, setProfile] = useState(() => loadAdaptiveProfile());
  const [inventory, setInventory] = useState(() => getInventory());
  const [journal, setJournal] = useState(() => loadCurrentWeekReinforcementJournal());
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>(() => getLearningRecord());
  const [playerData, setPlayerData] = useState(() => getPlayerData());
  const [selectedTitle, setSelectedTitle] = useState(() => getSelectedTitle());
  const [dailySignIn, setDailySignIn] = useState(() => getDailySignIn());
  const [featureQuery, setFeatureQuery] = useState("");
  const previousGoldRef = useRef(playerData.gold);
  const [isGoldPulseActive, setIsGoldPulseActive] = useState(false);
  const [quizSubject, setQuizSubject] = useState<KnowledgeIslandSubject | null>(null);
  const [randomAdventureRouteReward] = useState(() => consumeRandomAdventureRouteReward());
  const [showBackpack, setShowBackpack] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsToggleRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const islands = useMemo(() => buildKnowledgeIslandSnapshots(profile), [profile]);
  const answerCount = Math.max(playerData.totalAnswers, learningRecords.length, rpgState.correctAnswerCount ?? rpgState.answeredEventIds.length);
  const progress = Math.min(100, Math.round((playerData.exp / Math.max(1, playerData.expToNextLevel)) * 100));
  const firstUse = answerCount === 0 && profile.attempts.length === 0;
  const availableIslands = islands.filter((island) => island.unlocked);
  const nextIsland = availableIslands.find((island) => island.attemptCount > 0 && island.attemptCount < 4) ?? availableIslands[0] ?? islands[0];
  const localQuestions = useMemo(() => toLocalPaperQuestions(), []);
  const questions = localQuestions.length >= 400 ? localQuestions : ((data?.questions ?? []) as PaperQuestion[]);
  const memoryAlarmCount = useMemo(() => getMemoryAlarmCount(profile), [profile]);
  const weeklySuggestion = useMemo(() => buildWeeklySuggestion(learningRecords), [learningRecords]);
  const dailyAdventureSummary = useMemo(() => generateDailyAdventureSummary({ date: Date.now(), entries: getJournalEntries() }), [learningRecords.length, rpgState.correctAnswerCount]);
  const signedInToday = hasSignedInToday(dailySignIn);
  const visibleFeatureGroups = useMemo(() => {
    const query = normalizeFeatureQuery(featureQuery);
    if (!query) return HOME_FEATURE_GROUPS;
    return HOME_FEATURE_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => normalizeFeatureQuery(`${group.label}${group.description}${item.label}${item.description}`).includes(query)),
    })).filter((group) => group.items.length > 0);
  }, [featureQuery]);

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
    const result = claimDailySignIn();
    setDailySignIn(result.signIn);
    if (!result.claimed) {
      toast.message("今天已完成簽到，明天再回來延續探險足跡。");
      return;
    }
    toast.success(result.unlockedWeeklyTitle
      ? `簽到成功，已連續 ${result.signIn.streak} 天並獲得「一週探險家」稱號！`
      : `簽到成功，已連續 ${result.signIn.streak} 天。`);
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
        <header className="home-dashboard-status">
          <div>
            <p className="home-dashboard-eyebrow">TAIWAN EXPEDITION STATUS</p>
            <h1>{getPlayerName()}，{selectedTitle ? titleLabel(selectedTitle) : rankFromAnswers(answerCount)}</h1>
            <p>已留下 {answerCount} 次真實作答線索 · 下一次升階正在前方</p>
            <div className="home-dashboard-progress" role="progressbar" aria-label="目前等級經驗值" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
          </div>
          <div className="home-dashboard-status-side">
            <p className={`home-dashboard-coins${isGoldPulseActive ? " is-gold-pulse" : ""}`} role="status" aria-live="polite" aria-atomic="true"><Coins size={17} aria-hidden="true" /> {playerData.gold} 金幣</p>
            <button type="button" className="home-dashboard-backpack" aria-expanded={showBackpack} onClick={() => setShowBackpack((open) => !open)}><Backpack size={17} aria-hidden="true" /> 背包 {inventory.length}</button>
          </div>
        </header>
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
        <section className="home-mode-hub" aria-labelledby="home-mode-hub-title">
          <div className="home-mode-hub-heading">
            <div>
              <p className="home-dashboard-eyebrow">EXPEDITION MODES</p>
              <h2 id="home-mode-hub-title">選擇下一段學習航線</h2>
            </div>
            <p>四種單機模式都會保留在你的本機學習軌跡中。</p>
          </div>
          <div className="home-mode-grid">
            <button type="button" className="home-mode-card is-duel" onClick={() => setLocation("/duel")}>
              <Swords size={25} aria-hidden="true" />
              <strong>知識決鬥</strong>
              <span>策略卡牌 · 三局兩勝</span>
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
        <section className="home-feature-directory" aria-labelledby="home-feature-directory-title">
          <div className="home-feature-directory-heading">
            <div>
              <p className="home-dashboard-eyebrow">ALL EXPEDITION FEATURES</p>
              <h2 id="home-feature-directory-title">全站功能總覽</h2>
              <p>所有入口都會前往既有的單機學習功能，不會建立空白或重複頁面。</p>
            </div>
            <label className="home-feature-search" htmlFor="home-feature-search-input">
              <span>搜尋功能</span>
              <input id="home-feature-search-input" value={featureQuery} onChange={(event) => setFeatureQuery(event.target.value)} placeholder="例如：戰鬥、報告、天文" />
            </label>
          </div>
          {visibleFeatureGroups.length ? (
            <div className="home-feature-groups">
              {visibleFeatureGroups.map((group) => (
                <section className="home-feature-group" key={group.id} aria-labelledby={`home-feature-group-${group.id}`}>
                  <div className="home-feature-group-heading">
                    <h3 id={`home-feature-group-${group.id}`}>{group.label}</h3>
                    <p>{group.description}</p>
                  </div>
                  <div className="home-feature-grid">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return <button type="button" className="home-feature-card" key={item.id} onClick={() => setLocation(item.href)} aria-label={`前往 ${item.label}：${item.description}`}>
                        <Icon size={19} aria-hidden="true" />
                        <span><strong>{item.label}</strong><small>{item.description}</small></span>
                      </button>;
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : <p className="home-feature-empty" role="status">找不到「{featureQuery}」相關功能。請試試戰鬥、報告、天文或設定。</p>}
          <button type="button" className="home-debug-entry" onClick={() => setLocation("/settings#diagnostics")}>
            <Bug size={19} aria-hidden="true" />
            <span><strong>調試參數</strong><small>前往安全診斷、儲存錯誤日誌與遮蔽後的診斷摘要；不顯示帳號、答案或機密參數。</small></span>
          </button>
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
              <button tabIndex={isActionsOpen ? 0 : -1} type="button" className="home-dashboard-action" disabled={isLoading || questions.length === 0} onClick={startRandomAdventure}><Dices size={18} aria-hidden="true" /> 隨機冒險<small>{isLoading ? "正在準備題庫" : "答對可獲雙倍金幣"}</small></button>
            </nav>
            {isActionsOpen ? <button type="button" className="home-dashboard-actions-close" onClick={closeActions}><X size={15} aria-hidden="true" /> 關閉</button> : null}
          </section>
        </div>
      </div>
      {quizSubject ? (() => {
        const question = questions.find((item) => item.subject === quizSubject);
        return question ? <QuizModal question={question} subject={quizSubject} onClose={() => setQuizSubject(null)} onCompleted={refreshLearningData} /> : null;
      })() : null}
    </main>
  );
}
