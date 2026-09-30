import React from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

// 結構對齊凍結契約 StudentDashboardData.weekly
type WeeklySummary = {
  currentAccuracy: number | null;
  previousAccuracy: number | null;
  delta: number | null;
  currentAttempts: number;
  previousAttempts: number;
};

/**
 * 我的進步：整體正確率進度條 ＋ 本週 vs 上週。
 * delta > 0 顯示 ↑、< 0 顯示 ↓、無資料顯示「資料還在累積中」。
 * 只呈現自己的進步，不做同儕排名。
 */
export default function ProgressSummary({
  overallAccuracy,
  weekly,
  consecutiveDays,
}: {
  overallAccuracy: number | null;
  weekly: WeeklySummary;
  consecutiveDays: number;
}) {
  const hasWeekly =
    weekly.currentAccuracy != null || weekly.previousAccuracy != null;

  return (
    <section className="app-card sd-card" aria-labelledby="sd-progress-title">
      <h2 className="sd-section-title" id="sd-progress-title">我的進步</h2>

      <div className="sd-accuracy-row">
        {overallAccuracy == null ? (
          <p className="sd-empty-note">正確率資料還在累積中，先出發練習吧！</p>
        ) : (
          <>
            <div
              className="sd-progress"
              role="progressbar"
              aria-label="整體答題正確率"
              aria-valuenow={Math.round(overallAccuracy)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="sd-progress-fill" style={{ width: `${overallAccuracy}%` }} />
            </div>
            <p className="sd-accuracy-num">整體正確率 {Math.round(overallAccuracy)}%</p>
          </>
        )}
      </div>

      <div className="sd-weekly">
        <h3 className="sd-weekly-title">本週 vs 上週</h3>
        {!hasWeekly ? (
          <p className="sd-empty-note">資料還在累積中，再練幾次就有趨勢囉！</p>
        ) : (
          <div className="sd-weekly-grid">
            <div className="sd-weekly-cell">
              <span className="sd-weekly-label">本週正確率</span>
              <span className="sd-weekly-num">
                {weekly.currentAccuracy == null ? "—" : `${Math.round(weekly.currentAccuracy)}%`}
              </span>
              <span className="sd-weekly-sub">{weekly.currentAttempts} 題</span>
            </div>
            <div className="sd-weekly-cell">
              <span className="sd-weekly-label">上週正確率</span>
              <span className="sd-weekly-num">
                {weekly.previousAccuracy == null ? "—" : `${Math.round(weekly.previousAccuracy)}%`}
              </span>
              <span className="sd-weekly-sub">{weekly.previousAttempts} 題</span>
            </div>
            <div className="sd-weekly-cell sd-weekly-delta">
              <span className="sd-weekly-label">與上週相比</span>
              {weekly.delta == null ? (
                <span className="sd-weekly-num">資料還在累積中</span>
              ) : weekly.delta > 0 ? (
                <span className="sd-weekly-num sd-up">
                  <TrendingUp size={16} aria-hidden="true" /> ↑ +{Math.round(weekly.delta)}%
                </span>
              ) : weekly.delta < 0 ? (
                <span className="sd-weekly-num sd-down">
                  <TrendingDown size={16} aria-hidden="true" /> ↓ {Math.round(weekly.delta)}%
                </span>
              ) : (
                <span className="sd-weekly-num sd-flat">
                  <Minus size={16} aria-hidden="true" /> 持平
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {consecutiveDays >= 3 && (
        <p className="sd-streak-cheer">
          已經連續 {consecutiveDays} 天出航了，這種持續力超了不起！
        </p>
      )}
    </section>
  );
}
