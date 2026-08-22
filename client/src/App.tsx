import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import PaperExam from "./pages/PaperExam";
import RegionDetail from "./pages/RegionDetail";
import MediaObservatory from "./pages/MediaObservatory";
import MediaObservatoryDetail from "@/pages/MediaObservatoryDetail";
import WorldPrinciples from "@/pages/WorldPrinciples";
import WorldPrincipleDetail from "@/pages/WorldPrincipleDetail";
import AstronomyHall from "@/pages/AstronomyHall";
import AstronomyDetail from "@/pages/AstronomyDetail";
import WisdomHall from "@/pages/WisdomHall";
import WisdomStoryDetail from "@/pages/WisdomStoryDetail";
import TopNavigation from "@/components/TopNavigation";
import OnboardingGuide from "@/components/OnboardingGuide";
import CommunityHub from "@/pages/CommunityHub";
import KnowledgeDuel from "@/pages/KnowledgeDuel";
import LearningInsights from "@/pages/LearningInsights";
import LearningReport from "@/pages/LearningReport";
import ErrorTypeStatistics from "@/pages/ErrorTypeStatistics";
import TeacherParentSummary from "@/pages/TeacherParentSummary";
import StudentMap from "@/pages/StudentMap";
import BattleScene from "@/pages/BattleScene";
import AdventureJournal from "@/pages/AdventureJournal";
import Home from "@/pages/Home";
import WrongAnswers from "@/pages/WrongAnswers";
import Settings from "@/pages/Settings";
import GuardianExpedition from "@/pages/GuardianExpedition";
import { initGameData } from "@/utils/storage";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AnalyticsConsentPrompt } from "@/components/AnalyticsConsentPrompt";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/map"} component={StudentMap} />
      <Route path={"/"} component={Home} />
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
      <Route path={"/adventure-journal"} component={AdventureJournal} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
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
          <AnalyticsConsentPrompt />
          <div className="app-route-shell">
            <TopNavigation />
            <OnboardingGuide />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
