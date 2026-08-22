import React, { useEffect, useState } from "react";
import { BarChart3, Check, X } from "lucide-react";
import { getAnalyticsConsent, recordAnalyticsEvent, saveAnalyticsConsent, type AnalyticsConsent } from "@/utils/storage";

export function AnalyticsConsentPrompt() {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(() => getAnalyticsConsent());
  const [secondsRemaining, setSecondsRemaining] = useState(10);

  useEffect(() => {
    if (consent === "accepted") recordAnalyticsEvent({ type: "session-start" });
    return () => {
      if (consent === "accepted") recordAnalyticsEvent({ type: "session-end" });
    };
  }, [consent]);

  useEffect(() => {
    if (consent) return;

    const timer = window.setTimeout(() => {
      saveAnalyticsConsent("declined");
      setConsent("declined");
    }, 10_000);

    const countdown = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1_000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(countdown);
    };
  }, [consent]);

  if (consent) return null;

  const choose = (next: AnalyticsConsent) => {
    saveAnalyticsConsent(next);
    setConsent(next);
  };

  return (
    <aside className="analytics-consent-prompt" role="dialog" aria-modal="false" aria-labelledby="analytics-consent-title" aria-describedby="analytics-consent-description">
      <button type="button" className="analytics-consent-close" onClick={() => choose("declined")} aria-label="關閉一起改善探險體驗提示"><X size={17} aria-hidden="true" /></button>
      <div className="analytics-consent-icon" aria-hidden="true"><BarChart3 size={19} /></div>
      <div className="analytics-consent-copy">
        <strong id="analytics-consent-title">一起改善探險體驗</strong>
        <p id="analytics-consent-description">允許後，我們只會將每日活躍天數、答題表現與補血藥水使用時機匿名記錄在這台裝置，不會上傳或記錄姓名、答案內容。</p>
        <p className="analytics-consent-countdown" aria-live="polite">將在 {secondsRemaining} 秒後自動關閉。</p>
      </div>
      <div className="analytics-consent-actions">
        <button type="button" className="analytics-consent-accept" onClick={() => choose("accepted")}><Check size={15} aria-hidden="true" /> 同意分享</button>
        <button type="button" className="analytics-consent-decline" onClick={() => choose("declined")}><X size={15} aria-hidden="true" /> 暫不分享</button>
      </div>
    </aside>
  );
}
