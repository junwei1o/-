import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import TopNavigation from "@/components/TopNavigation";
import BxEnhance from "@/components/bx/BxEnhance";
import CloudModePrompt from "@/components/CloudModePrompt";
import Home from "@/pages/Home";
import { initGameData } from "@/utils/storage";
// 5000 題內建題庫合計約 2.7MB：不在開站關鍵路徑 static 載入，改於下方 useEffect
// 在瀏覽器閒置時才動態 import 預載，避免與首屏搶頻寬。
import { OfflineBanner } from "@/components/OfflineBanner";

// 路由懶加載：首頁與導覽保持直接載入（首屏最快），其餘頁面進入時才下載。
const PaperExam = React.lazy(() => import("./pages/PaperExam"));
const MatchingPage = React.lazy(() => import("./pages/MatchingPage"));
const RegionDetail = React.lazy(() => import("./pages/RegionDetail"));
const MediaObservatory = React.lazy(() => import("./pages/MediaObservatory"));
const MediaObservatoryDetail = React.lazy(() => import("@/pages/MediaObservatoryDetail"));
const WorldPrinciples = React.lazy(() => import("./pages/WorldPrinciples"));
const WorldPrincipleDetail = React.lazy(() => import("./pages/WorldPrincipleDetail"));
const AstronomyHall = React.lazy(() => import("./pages/AstronomyHall"));
const AstronomyDetail = React.lazy(() => import("./pages/AstronomyDetail"));
const WisdomHall = React.lazy(() => import("./pages/WisdomHall"));
const WisdomStoryDetail = React.lazy(() => import("./pages/WisdomStoryDetail"));
const SafetyAcademy = React.lazy(() => import("./pages/SafetyAcademy"));
const SafetyAcademyDetail = React.lazy(() => import("./pages/SafetyAcademyDetail"));
const CommunityHub = React.lazy(() => import("@/pages/CommunityHub"));
const LearningInsights = React.lazy(() => import("@/pages/LearningInsights"));
const LearningReport = React.lazy(() => import("@/pages/LearningReport"));
const ErrorTypeStatistics = React.lazy(() => import("@/pages/ErrorTypeStatistics"));
const TeacherParentSummary = React.lazy(() => import("@/pages/TeacherParentSummary"));
const StudentMap = React.lazy(() => import("@/pages/StudentMap"));
const AdventureJournal = React.lazy(() => import("@/pages/AdventureJournal"));
const DailyCamp = React.lazy(() => import("@/pages/DailyCamp"));
const Badges = React.lazy(() => import("@/pages/Badges"));
const WrongAnswers = React.lazy(() => import("@/pages/WrongAnswers"));
const ReviewHub = React.lazy(() => import("@/pages/ReviewHub"));
const Settings = React.lazy(() => import("@/pages/Settings"));
const StudyTips = React.lazy(() => import("@/pages/StudyTips"));
const QuizRoom = React.lazy(() => import("@/pages/QuizRoom"));
const ClassroomPlay = React.lazy(() => import("@/pages/ClassroomPlay"));
const WeeklyQuizPage = React.lazy(() => import("@/pages/WeeklyQuizPage"));
const Expedition = React.lazy(() => import("@/pages/Expedition"));
const LearningHub = React.lazy(() => import("@/pages/LearningHub"));
const Gallery = React.lazy(() => import("@/pages/Gallery"));
const TreasureHub = React.lazy(() => import("@/pages/TreasureHub"));
const TeacherDashboard = React.lazy(() => import("@/pages/TeacherDashboard"));
const StudentClass = React.lazy(() => import("@/pages/StudentClass"));
const FeaturesDirectory = React.lazy(() => import("@/pages/FeaturesDirectory"));

// 懶加載時的輕量佔位：品牌色系的帆船載入提示。
function PageLoader() {
  return (
    <div className="app-page-loader" role="status" aria-live="polite">
      <span className="app-page-loader-ship" aria-hidden="true">⛵️</span>
      <span className="app-page-loader-spinner" aria-hidden="true" />
      <span>載入中…</span>
    </div>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <main id="main-content">
      <Suspense fallback={<PageLoader />}>
        <Switch>
        <Route path={"/map"} component={StudentMap} />
        <Route path={"/"} component={Home} />
        <Route path={"/quiz-room"} component={QuizRoom} />
        <Route path={"/classroom/:gameId"} component={ClassroomPlay} />
        <Route path={"/weekly-quiz"} component={WeeklyQuizPage} />
        <Route path={"/expedition"} component={Expedition} />
        <Route path={"/learning"} component={LearningHub} />
        <Route path={"/gallery"} component={Gallery} />
        <Route path={"/treasure"} component={TreasureHub} />
        <Route path={"/features"} component={FeaturesDirectory} />
        <Route path={"/camp"} component={DailyCamp} />
        <Route path={"/badges"} component={Badges} />
        <Route path={"/practice"} component={PaperExam} />
        <Route path={"/matching"} component={MatchingPage} />
        <Route path={"/wrong-answers"} component={WrongAnswers} />
        <Route path={"/review-hub"} component={ReviewHub} />
        <Route path={"/regions/:regionKey"} component={RegionDetail} />
        <Route path={"/observatory"} component={MediaObservatory} />
        <Route path={"/observatory/:entryKey"} component={MediaObservatoryDetail} />
        <Route path={"/principles"} component={WorldPrinciples} />
        <Route path={"/principles/:key"} component={WorldPrincipleDetail} />
        <Route path={"/astronomy"} component={AstronomyHall} />
        <Route path={"/astronomy/:key"} component={AstronomyDetail} />
        <Route path={"/wisdom"} component={WisdomHall} />
        <Route path={"/wisdom/:key"} component={WisdomStoryDetail} />
        <Route path={"/safety"} component={SafetyAcademy} />
        <Route path={"/safety/:key"} component={SafetyAcademyDetail} />
        <Route path={"/learning-insights"} component={LearningInsights} />
        <Route path={"/learning-report"} component={LearningReport} />
        <Route path={"/community"} component={CommunityHub} />
        <Route path={"/error-statistics"} component={ErrorTypeStatistics} />
        <Route path={"/learning-summary"} component={TeacherParentSummary} />
        <Route path={"/settings"} component={Settings} />
        <Route path={"/study-tips"} component={StudyTips} />
        <Route path={"/teacher"} component={TeacherDashboard} />
        <Route path={"/class"} component={StudentClass} />
        <Route path={"/adventure-journal"} component={AdventureJournal} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
        </Switch>
      </Suspense>
    </main>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  useEffect(() => {
    initGameData();
    // 題庫合計約 2.7MB，不在開站關鍵路徑與首屏搶頻寬：等瀏覽器閒置（最長 2.5s）
    // 再背景預載；不支援 requestIdleCallback 的瀏覽器退為 1.2s 後執行。
    let handle: number;
    const preload = () => {
      // 動態 import：確保題庫模組本身也不站在開站關鍵路徑上。
      void import("@/lib/questionBank").then((m) => m.loadLocalBank());
    };
    if (typeof window.requestIdleCallback === "function") {
      handle = window.requestIdleCallback(preload, { timeout: 2500 });
    } else {
      handle = window.setTimeout(preload, 1200);
    }
    return () => {
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(handle);
      } else {
        window.clearTimeout(handle);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <OfflineBanner />
          <BxEnhance />
          <CloudModePrompt />
          <a className="skip-link" href="#main-content">跳到主要內容</a>
          <div className="app-route-shell">
            <TopNavigation />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
