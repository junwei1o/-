/**
 * 新首頁：選擇下一段學習航線（B1 決策主區 + B2 航線清單）
 *
 * 設計依據：homepage-redesign-proposal.md（決議版）
 * - 首頁只回答一件事：「現在要出發去哪」——不做總覽、不做設定、不做回顧
 * - 年級閘門不可跳過（決議 5）；未選時系統以全站最高難度出題
 * - 連續答錯達門檻時提示調降等級（決議 5 的安全閥）
 * - 色值一律走 token，觸控區 ≥44px，標題單一 H1 不跳級
 */
import React, { useMemo, useState } from "react";
import { ArrowRight, Clock, Map, WifiOff } from "lucide-react";
import { useLocation } from "wouter";
import { loadStudentGradePreference, type StudentGradePreference } from "@/lib/studentGradePreference";
import { loadUserPreferences, saveUserPreferences } from "@/game/adaptiveLearning";
import {
  ROUTES,
  collectRouteInput,
  consecutiveWrongStreak,
  loadResume,
  recentVoyages,
  recommendRoute,
  routeById,
  shouldSuggestLowerGrade,
  signInInfo,
  todayWeather,
  weakestIslands,
  weeklyLights,
} from "@/lib/routeDeck";
import { clearTriAxisProgress } from "@/lib/triAxisProgress";
import { requestOpenSignInPill } from "@/components/DailySignInPill";
import "./RouteDeck.css";

/** 本站服務國小 3–6 年級（不再提供國中）。 */
const GRADE_CHOICES = [3, 4, 5, 6] as const;

export default function RouteDeck() {
  const [, setLocation] = useLocation();
  const [grade, setGrade] = useState<StudentGradePreference>(() => loadStudentGradePreference());
  const [showAll, setShowAll] = useState(false);

  const input = useMemo(() => collectRouteInput(), []);
  const recommended = useMemo(() => recommendRoute(input), [input]);
  const streak = useMemo(() => consecutiveWrongStreak(), []);

  const pickGrade = (chosen: (typeof GRADE_CHOICES)[number]) => {
    // 單一真相＝設定頁那份 UserPreferences.gradeLevel（見 studentGradePreference.ts 說明）
    saveUserPreferences({ ...loadUserPreferences(), gradeLevel: chosen });
    setGrade(chosen);
  };

  // ⚠️ 所有 hook 必須在年級閘門的 early return **之前**呼叫完畢。
  // 曾因把 useMemo/useState 放在 return 之後，導致「閘門態 5 個 hook、選完年級 9 個」，
  // React 直接丟 #310（Rendered more hooks than during the previous render）而白屏。
  const resume = useMemo(() => loadResume(), []);
  const lights = useMemo(() => weeklyLights(), []);
  const weakSpots = useMemo(() => weakestIslands(), []);
  const voyages = useMemo(() => recentVoyages(), []);
  const signIn = useMemo(() => signInInfo(), []);
  const weather = useMemo(() => todayWeather(input), [input]);
  const [resumeDismissed, setResumeDismissed] = useState(false);

  // 年級閘門：不可跳過——沒有關閉鈕，也沒有「稍後再設」
  if (grade === null) {
    return (
      <div className="deck-gate" role="dialog" aria-modal="true" aria-labelledby="deck-gate-title">
        <div className="deck-gate__box">
          <p className="deck-gate__eyebrow">出航前一步</p>
          <h1 id="deck-gate-title">先選內容等級</h1>
          <p className="deck-gate__body">
            內容等級決定你會看到的題目、動畫課與每日推薦；它和玩家的等級（Lv.）不同，
            請依照目前就讀的年級選擇。
          </p>
          <div className="deck-gate__options" role="group" aria-label="選擇內容等級">
            {GRADE_CHOICES.map((g) => (
              <button key={g} type="button" className="deck-gate__grade" onClick={() => pickGrade(g)}>
                {g} 年級
              </button>
            ))}
          </div>
          <p className="deck-gate__note">未選擇時，系統會以全站最高難度出題。之後可在「設定」調整。</p>
        </div>
      </div>
    );
  }

  const route = routeById(recommended.id);
  const alternatives = ROUTES.filter((r) => r.id !== recommended.id);

  return (
    <div className="deck">
      <section className="deck__hero">
        <p className="deck__eyebrow">EXPEDITION MODES</p>
        <h1>選擇下一段學習航線</h1>
        <p className="deck__lead">今天要往哪裡去？選一條，出發。</p>

        {shouldSuggestLowerGrade(streak) ? (
          <div className="deck__hint" role="status">
            <span>連著 {streak} 題沒答對——要不要把內容等級調低一點？</span>
            <button type="button" className="deck__hint-btn" onClick={() => setLocation("/settings")}>
              去調整
            </button>
          </div>
        ) : null}

        <article className="deck-card deck-card--primary">
          <p className="deck-card__tag">{route.tag}</p>
          <h2 className="deck-card__name">{route.name}</h2>
          <p className="deck-card__purpose">{route.purpose}</p>
          <p className="deck-card__why">{recommended.reason}</p>
          <ul className="deck-card__meta">
            <li>
              <Clock size={14} aria-hidden="true" /> 約 {route.estMinutes} 分鐘
            </li>
            {route.offlineOk ? (
              <li>
                <WifiOff size={14} aria-hidden="true" /> 可離線
              </li>
            ) : null}
          </ul>
          <button type="button" className="deck-cta" onClick={() => setLocation(route.path)}>
            開始這段航線 <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="deck-cta deck-cta--ghost"
            aria-expanded={showAll}
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "收起航線清單" : "換一條航線"}
          </button>
        </article>
      </section>

      {showAll ? (
        <section className="deck__board" aria-label="航線清單">
          <h2>全部航線</h2>
          <ul className="deck__grid">
            {alternatives.map((r) => (
              <li key={r.id}>
                <button type="button" className="deck-card deck-card--grid" onClick={() => setLocation(r.path)}>
                  <p className="deck-card__tag">{r.tag}</p>
                  <h3 className="deck-card__name">{r.name}</h3>
                  <p className="deck-card__purpose">{r.purpose}</p>
                  <p className="deck-card__meta-line">
                    <Clock size={14} aria-hidden="true" /> 約 {r.estMinutes} 分鐘
                    {r.offlineOk ? " · 可離線" : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* B3 繼續上一趟：有未完成航程才出現 */}
      {resume && !resumeDismissed ? (
        <section className="deck__resume" aria-label="繼續上一趟">
          <h2>繼續上一趟</h2>
          <div className="deck__resume-box">
            <p className="deck__resume-name">
              {resume.routeName} · 第 {resume.current} / {resume.total} 題
            </p>
            <div className="deck__resume-bar" role="img" aria-label={`進度 ${resume.current} / ${resume.total}`}>
              <span style={{ width: `${Math.round((resume.current / resume.total) * 100)}%` }} />
            </div>
            <div className="deck__resume-actions">
              <button type="button" className="deck-cta" onClick={() => setLocation(resume.routePath)}>
                繼續航行
              </button>
              <button
                type="button"
                className="deck-cta deck-cta--ghost"
                onClick={() => {
                  clearTriAxisProgress();
                  setResumeDismissed(true);
                }}
              >
                放棄這趟
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* B4 今日燈塔 */}
      <section className="deck__lights" aria-label="今日燈塔">
        <h2>今日燈塔</h2>
        <p className="deck__lights-line">
          本週已點亮 {lights.lit} / {lights.goal} 盞燈——每答對一題，航海圖就永久亮起一盞。
        </p>
        {/* 注意：不可加 role="img"——那會覆蓋 ul 的 list 語意，
            造成 aria-allowed-role ＋ 子項 listitem 違規（axe 實測 5 筆）。
            改用 ul 自身的 aria-label 提供可存取名稱。 */}
        <ul className="deck__lights-dots" aria-label={`本週已點亮 ${lights.lit} 盞，目標 ${lights.goal} 盞`}>
          {Array.from({ length: lights.goal }, (_, i) => (
            <li key={i} className={i < lights.lit ? "is-lit" : undefined}>
              {i < lights.lit ? "●" : "○"}
            </li>
          ))}
        </ul>
        <button type="button" className="deck-cta" onClick={() => setLocation(route.path)}>
          今天先答一題
        </button>
      </section>

      {/* B5 弱點海圖 */}
      <section className="deck__map" aria-label="弱點海圖">
        <h2>弱點海圖</h2>
        {weakSpots.length === 0 ? (
          <p className="deck__map-empty">
            還沒有作答紀錄——答完第一題，暗礁就會在海圖上浮現。
          </p>
        ) : (
          <ul className="deck__map-list">
            {weakSpots.map((w) => (
              <li key={w.subject}>
                <button
                  type="button"
                  className="deck__map-chip"
                  onClick={() => setLocation(`/practice?subject=${encodeURIComponent(w.subject)}&source=route-deck`)}
                >
                  <span className="deck__map-subject">{w.shortTitle}</span>
                  <span className="deck__map-acc">
                    正確率 {w.accuracy === null ? "—" : `${Math.round(w.accuracy * 100)}%`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* B6 航海日誌 */}
      {voyages.length > 0 ? (
        <section className="deck__log" aria-label="航海日誌">
          <h2>航海日誌</h2>
          <ul className="deck__log-list">
            {voyages.map((v) => (
              <li key={v.day} className="deck__log-item">
                <span className="deck__log-day">{v.day}</span>
                <span className="deck__log-stat">
                  答 {v.answered} 題 · 正確率 {Math.round(v.accuracy * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* B7 港口補給（每日簽到；刻意放主 CTA 之下，不搶焦點） */}
      <section className="deck__supply" aria-label="港口補給">
        <h2>港口補給</h2>
        {signIn.signedInToday ? (
          <p className="deck__supply-line">
            今天已補給 ✓ 連續 {signIn.streak} 天——出航前先領今天的補給。
          </p>
        ) : (
          <p className="deck__supply-line">還沒補給——連續 {signIn.streak} 天，別斷了。</p>
        )}
        <button type="button" className="deck-cta deck-cta--ghost" onClick={() => requestOpenSignInPill()}>
          {signIn.signedInToday ? "看補給紀錄" : "去港口補給"}
        </button>
      </section>

      {/* B8 今日天候 */}
      <section className="deck__weather" aria-label="今日天候">
        <h2>今日天候</h2>
        <p className="deck__weather-line">
          <span aria-hidden="true">{weather.icon}</span> {weather.text}
        </p>
      </section>

      <section className="deck__foot">
        <h2>其他去處</h2>
        <button type="button" className="deck-link" onClick={() => setLocation("/dashboard")}>
          <Map size={16} aria-hidden="true" /> 航海儀表板：等級、金幣、背包、功能總覽、本週微課
        </button>
      </section>
    </div>
  );
}
