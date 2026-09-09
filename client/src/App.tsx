import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import TopNavigation from "@/components/TopNavigation";
import BxEnhance from "@/components/bx/BxEnhance";
import Home from "@/pages/Home";
import { initGameData } from "@/utils/storage";
import { OfflineBanner } from "@/components/OfflineBanner";

// 路由懶加載：首頁與導覽保持直接載入（首屏最快），其餘頁面進入時才下載。
const PaperExam = React.lazy(() => import("./pages/PaperExam"));
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
const KnowledgeDuel = React.lazy(() => import("@/pages/KnowledgeDuel"));
const LearningInsights = React.lazy(() => import("@/pages/LearningInsights"));
const LearningReport = React.lazy(() => import("@/pages/LearningReport"));
const ErrorTypeStatistics = React.lazy(() => import("@/pages/ErrorTypeStatistics"));
const TeacherParentSummary = React.lazy(() => import("@/pages/TeacherParentSummary"));
const StudentMap = React.lazy(() => import("@/pages/StudentMap"));
const BattleScene = React.lazy(() => import("@/pages/BattleScene"));
const AdventureJournal = React.lazy(() => import("@/pages/AdventureJournal"));
const DailyCamp = React.lazy(() => import("@/pages/DailyCamp"));
const Badges = React.lazy(() => import("@/pages/Badges"));
const WrongAnswers = React.lazy(() => import("@/pages/WrongAnswers"));
const Settings = React.lazy(() => import("@/pages/Settings"));
const StudyTips = React.lazy(() => import("@/pages/StudyTips"));
const GuardianExpedition = React.lazy(() => import("@/pages/GuardianExpedition"));

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
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path={"/map"} component={StudentMap} />
        <Route path={"/"} component={Home} />
        <Route path={"/camp"} component={DailyCamp} />
        <Route path={"/badges"} component={Badges} />
        <Route path={"/practice"} component={PaperExam} />
        <Route path={"/wrong-answers"} component={WrongAnswers} />
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
        <Route path={"/battle"} component={() => <BattleScene />} />
        <Route path={"/guardian"} component={GuardianExpedition} />
        <Route path={"/guardian-expedition"} component={GuardianExpedition} />
        <Route path={"/learning-insights"} component={LearningInsights} />
        <Route path={"/learning-report"} component={LearningReport} />
        <Route path={"/community"} component={CommunityHub} />
        <Route path={"/knowledge-duel"} component={KnowledgeDuel} />
        <Route path={"/duel"} component={KnowledgeDuel} />
        <Route path={"/error-statistics"} component={ErrorTypeStatistics} />
        <Route path={"/learning-summary"} component={TeacherParentSummary} />
        <Route path={"/settings"} component={Settings} />
        <Route path={"/study-tips"} component={StudyTips} />
        <Route path={"/adventure-journal"} component={AdventureJournal} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  useEffect(() => {
    initGameData();
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
