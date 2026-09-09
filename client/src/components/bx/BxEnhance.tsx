import React, { useEffect } from "react";
import { BX_EVENTS } from "@/game/bxStore";
import { BxToastHost, bxToast } from "./bxRewards";
import PrivacyBanner from "./PrivacyBanner";
import OnboardingTour from "./OnboardingTour";
import GlobalErrorGuard from "./GlobalErrorGuard";
import BxMobileNav from "./BxMobileNav";

/**
 * BX 強化層全站掛載點：Toast/慶祝宿主、隱私橫幅、新手導覽、視窗錯誤守衛、手機底部導航，
 * 以及答題里程碑的備份提醒。只掛一次（建議置於 App 根）。
 */
export default function BxEnhance() {
  useEffect(() => {
    const onMilestone = (e: Event) => {
      const detail = (e as CustomEvent).detail as { count?: number } | undefined;
      const n = detail?.count;
      bxToast(n ? `🎉 已累積 ${n} 題！建議到設定備份航海日誌` : "🎉 抵達新的答題里程碑！建議到設定備份航海日誌", 4200);
    };
    document.addEventListener(BX_EVENTS.milestone, onMilestone);
    return () => document.removeEventListener(BX_EVENTS.milestone, onMilestone);
  }, []);

  return (
    <>
      <BxToastHost />
      <PrivacyBanner />
      <OnboardingTour />
      <GlobalErrorGuard />
      <BxMobileNav />
    </>
  );
}
