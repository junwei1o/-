import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, Coins } from "lucide-react";
import {
  claimDailySignIn,
  hasSignedInToday,
  loadSignInState,
  DAILY_SIGN_IN_REWARDS,
} from "@/game/dailySignIn";
import "./DailySignInPill.css";

/**
 * 每日簽到入口：以「膠囊」形式內嵌在首頁「快速行動」側邊欄的動作清單裡。
 *
 * 與舊的 DailySignInModal 最大的差異：
 * 1. 沒有背景遮罩，不使用 aria-modal，不攔截頁面任何點擊。
 * 2. 預設收合，只顯示一行狀態；點擊才就地展開，再點收合。
 * 3. 不自動彈出、不倒數、不強制使用者當下完成簽到。
 *
 * 展開狀態由元件自己持有；外部（首頁其他簽到卡）可用 requestOpenSignInPill()
 * 請求展開，避免把狀態提升到 App 層造成不必要的重渲染。
 * 簽到成功會發出 "xue-signin-claimed"，讓首頁刷新金幣與簽到卡。
 */

const OPEN_EVENT = "xue-signin-open";
const CLAIMED_EVENT = "xue-signin-claimed";

/** 供其他元件（如首頁簽到卡）請求展開膠囊。 */
export function requestOpenSignInPill() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

type ClaimResult = {
  streak: number;
  cycleDay: number;
  reward: number;
  alreadyClaimed: boolean;
  goldGained: number;
  unlockedWeeklyTitle: boolean;
};

export function DailySignInPill({ tabbable = true }: { tabbable?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(() => loadSignInState());
  const [claim, setClaim] = useState<ClaimResult | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const autoCollapseRef = useRef<number | null>(null);

  const claimedToday = hasSignedInToday(state);

  // 每次展開重新讀取，避免停留在過期的連續天數；同時清掉上一次的領取結果。
  useEffect(() => {
    if (!open) return;
    setState(loadSignInState());
    setClaim(null);
  }, [open]);

  // 外部請求展開（首頁其他簽到卡 → 這裡）。
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  // Esc 收合。只收起自己，不攔截該次按鍵的其他行為。
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    return () => {
      if (autoCollapseRef.current !== null) window.clearTimeout(autoCollapseRef.current);
    };
  }, []);

  function handleClaim() {
    const result = claimDailySignIn();
    setClaim(result);
    setState(loadSignInState());
    if (result.alreadyClaimed) return;
    // 通知首頁刷新金幣與簽到卡，避免畫面上的數字和膠囊互相矛盾。
    window.dispatchEvent(new Event(CLAIMED_EVENT));
    // 領取成功後短暫顯示回饋，再自動收合，把畫面還給使用者。
    if (autoCollapseRef.current !== null) window.clearTimeout(autoCollapseRef.current);
    autoCollapseRef.current = window.setTimeout(() => setOpen(false), 1900);
  }

  // 連續天數不封頂，7 天金幣循環會一直繞；標示「今天」的那格由 state.cycleDay 決定。
  const currentDay = state.cycleDay;

  return (
    <div ref={rootRef} className={`signin-pill${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="signin-pill-bar"
        aria-expanded={open}
        aria-controls="signin-pill-panel"
        tabIndex={tabbable ? 0 : -1}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="signin-pill-icon" aria-hidden="true">
          {claimedToday ? <Check size={15} /> : <CalendarDays size={15} />}
        </span>
        <span className="signin-pill-text">
          <span className="signin-pill-title">每日簽到</span>
          <small className="signin-pill-sub">
            {claimedToday ? `已連續 ${state.streak} 天，明天再來` : "今天還沒留下足跡"}
          </small>
        </span>
        {!claimedToday ? <span className="signin-pill-dot" aria-hidden="true" /> : null}
      </button>

      {open ? (
        <div id="signin-pill-panel" className="signin-pill-panel">
          <div className="signin-pill-stats">
            <span>
              <strong>{state.streak}</strong>
              <small>連續天數</small>
            </span>
            <span>
              <strong>{state.totalDays}</strong>
              <small>累計天數</small>
            </span>
          </div>

          <ol className="signin-pill-track" aria-label="七天簽到獎勵">
            {DAILY_SIGN_IN_REWARDS.map((reward, index) => {
              const dayNumber = index + 1;
              const isClaimed = claimedToday ? dayNumber <= currentDay : dayNumber < currentDay;
              const isToday = dayNumber === currentDay;
              const cellClass = ["signin-pill-day", isClaimed ? "is-claimed" : "", isToday ? "is-today" : ""]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={dayNumber} className={cellClass} aria-current={isToday ? "true" : undefined}>
                  <span className="signin-pill-day-mark" aria-hidden="true">
                    {isClaimed ? <Check size={13} /> : dayNumber}
                  </span>
                  <span className="signin-pill-day-gold">
                    <Coins size={11} aria-hidden="true" />
                    {reward}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="signin-pill-feedback" role="status" aria-live="polite">
            {claim && !claim.alreadyClaimed ? (
              <span className="is-success">
                獲得 {claim.goldGained} 金幣！連續 {claim.streak} 天
                {claim.unlockedWeeklyTitle ? " · 解鎖「一週探險家」稱號！" : ""}
              </span>
            ) : claimedToday ? (
              <span>今天已簽到，明天再來</span>
            ) : (
              <span>連續簽到累積獎勵，天天回來都能領取金幣</span>
            )}
          </div>

          <button
            type="button"
            className="signin-pill-claim"
            onClick={handleClaim}
            disabled={claimedToday}
            tabIndex={tabbable ? 0 : -1}
          >
            {claimedToday ? (
              "今天已簽到"
            ) : (
              <>
                <CalendarDays size={15} aria-hidden="true" /> 領取今日金幣
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
