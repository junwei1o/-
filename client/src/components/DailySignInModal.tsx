import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, Coins, X } from "lucide-react";
import { claimDailySignIn, hasSignedInToday, loadSignInState, DAILY_SIGN_IN_REWARDS } from "@/game/dailySignIn";
import "./DailySignInModal.css";

export type DailySignInModalProps = {
  open: boolean;
  onClose: () => void;
};

type ClaimResult = {
  streak: number;
  cycleDay: number;
  reward: number;
  alreadyClaimed: boolean;
  goldGained: number;
  unlockedWeeklyTitle: boolean;
};

export function DailySignInModal({ open, onClose }: DailySignInModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [claim, setClaim] = useState<ClaimResult | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 每次開啟重置領取狀態
  useEffect(() => {
    if (open) setClaim(null);
  }, [open]);

  // 焦點管理 + Esc 關閉 + 關閉後焦點還原
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const state = loadSignInState();
  const claimedToday = hasSignedInToday(state);
  // 連續天數不封頂，7 天金幣循環會一直繞；標示「今天」的那格由 state.cycleDay 決定。
  const currentDay = state.cycleDay;

  function handleClaim() {
    const result = claimDailySignIn();
    setClaim(result);
  }

  return (
    <div
      className="daily-signin-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="daily-signin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-signin-title"
        aria-describedby="daily-signin-desc"
      >
        <header className="daily-signin-header">
          <div>
            <p className="eyebrow accent">每日簽到</p>
            <h2 id="daily-signin-title">留下今天的探險足跡</h2>
          </div>
          <button ref={closeRef} type="button" className="daily-signin-close" onClick={onClose} aria-label="關閉每日簽到視窗">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <p id="daily-signin-desc" className="daily-signin-desc">
          連續簽到累積獎勵，天天回來都能領取金幣，到燈塔酒館換卡包！
        </p>

        <div className="daily-signin-stats" aria-live="polite">
          <div className="daily-signin-stat">
            <strong>{state.streak}</strong>
            <small>目前連續天數</small>
          </div>
          <div className="daily-signin-stat">
            <strong>{state.totalDays}</strong>
            <small>累計簽到天數</small>
          </div>
        </div>

        <p className="daily-signin-title-hint">
          {state.daysToTitle > 0
            ? `再連續 ${state.daysToTitle} 天，可獲得「一週探險家」稱號。`
            : "已獲得「一週探險家」稱號，繼續保持！"}
        </p>

        <ol className="daily-signin-track" aria-label="七天簽到獎勵">
          {DAILY_SIGN_IN_REWARDS.map((reward, index) => {
            const dayNumber = index + 1;
            // 已簽到：今天含在內；尚未簽到：今天那格還沒領。
            const isClaimed = claimedToday ? dayNumber <= currentDay : dayNumber < currentDay;
            const isToday = dayNumber === currentDay;
            const cellClass = [
              "daily-signin-day",
              isClaimed ? "is-claimed" : "",
              isToday ? "is-today" : "",
            ].filter(Boolean).join(" ");
            return (
              <li key={dayNumber} className={cellClass} aria-current={isToday ? "true" : undefined}>
                <span className="daily-signin-day-mark" aria-hidden="true">
                  {isClaimed ? <Check size={15} /> : dayNumber}
                </span>
                <span className="daily-signin-day-gold">
                  <Coins size={13} aria-hidden="true" /> {reward}
                </span>
                <span className="daily-signin-day-label">
                  {isToday ? "今天" : isClaimed ? "已領" : `第${dayNumber}天`}
                </span>
              </li>
            );
          })}
        </ol>

        {claim && !claim.alreadyClaimed ? (
          <p className="daily-signin-confirm" role="status" aria-live="polite">
            🎉 獲得 {claim.goldGained} 金幣！連續 {claim.streak} 天。
            {claim.unlockedWeeklyTitle ? " 並解鎖「一週探險家」稱號！" : ""}
          </p>
        ) : null}

        <div className="daily-signin-actions">
          {claimedToday ? (
            <button type="button" className="daily-signin-btn is-primary" onClick={onClose}>
              今天已簽到，明天再來
            </button>
          ) : claim ? (
            <button type="button" className="daily-signin-btn is-primary" onClick={onClose}>
              收下金幣，繼續探索
            </button>
          ) : (
            <button type="button" className="daily-signin-btn is-primary" onClick={handleClaim}>
              <CalendarDays size={17} aria-hidden="true" /> 領取今日金幣
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
