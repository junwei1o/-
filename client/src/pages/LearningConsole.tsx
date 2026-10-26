import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getPlayerName } from "@/utils/storage";
import "./LearningConsole.css";

/**
 * 學習控制台（2026-10-26 Phase 1）。
 *
 * 設計裁示（站長原話）：「直接改造 /dashboard，不需要新開 /console；
 * 把 / 作為登入入口，登入後立刻跳轉到這個控制台。」
 *
 * 與舊版 Home 的差異：不做卡片瀑布流，改成**單一垂直流的控制台**——
 * 學生一眼看到「哪科弱、弱在哪個知識點、下一步點哪裡」。
 * 純 CSS 1px 實線表達層級（承接 Phase 0 去裝飾）。
 *
 * 資料來源：`insights.dashboard`，它把既有的 `computeStudentMastery`
 * 接上線（逐題明細來自 exam_records.detail.topics，無需新表）。
 */

type SubjectRow = {
  subject: string;
  rate: number | null;
  answered: number;
  correct: number;
};

type WeakTopic = { subject: string; topic: string; rate: number };

/** 後端在「沒有 DATABASE_URL」時回 cloudAvailable: false，前端據此給不同空狀態。 */

/** 掌握度顏色分級（僅用深淺灰＋單一警示紅，不用語意色盤）。 */
function masteryTone(rate: number | null): "unknown" | "weak" | "ok" | "strong" {
  if (rate === null) return "unknown";
  if (rate < 60) return "weak";
  if (rate < 85) return "ok";
  return "strong";
}

export default function LearningConsole() {
  const [, setLocation] = useLocation();
  const playerName = useMemo(() => getPlayerName(), []);

  const dashboard = trpc.insights.dashboard.useQuery(
    { name: playerName, limit: 30 },
    { enabled: Boolean(playerName), staleTime: 30_000, retry: false },
  );

  const [reportState, setReportState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const data = dashboard.data;
  const subjects: SubjectRow[] = data?.subjects ?? [];
  const weakTopics: WeakTopic[] = data?.weakTopics ?? [];
  const hasData = Boolean(data && data.totalQuestions > 0);

  /**
   * 專項訓練：帶著知識點跳到練習頁。
   * 用既有 `/practice` 的 reviewTopic 參數（PaperExam 已支援以 learningTopic 出卷），
   * 不新增路由、不改既有答題邏輯。
   */
  const trainTopic = (item: WeakTopic) => {
    const query = new URLSearchParams({
      reviewTopic: item.topic,
      subjectScope: item.subject,
    });
    setLocation(`/practice?${query.toString()}`);
  };

  const continueLast = () => {
    const recent = data?.recent;
    const query = new URLSearchParams();
    if (recent?.subject) query.set("subjectScope", recent.subject);
    if (recent?.topics?.[0]) query.set("reviewTopic", recent.topics[0]);
    setLocation(`/practice${query.toString() ? `?${query.toString()}` : ""}`);
  };

  /**
   * LINE 學習報告：沿用既有 `line.sendTest`（教師/站長專屬）。
   * 學生身分呼叫會被後端擋（teacherProcedure），這裡只把錯誤轉成可讀訊息。
   */
  const sendLineReport = () => {
    setReportState("sending");
    // 直接呼叫既有端點；失敗（含 403 非教師）也要給明確回饋，不可靜默。
    fetch("/api/trpc/line.sendTest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    })
      .then((res) => {
        setReportState(res.ok ? "sent" : "failed");
      })
      .catch(() => setReportState("failed"));
  };

  if (!playerName) {
    return (
      <main className="lc-page" aria-labelledby="lc-title">
        <h1 id="lc-title" className="lc-title">學習控制台</h1>
        <p className="lc-empty">尚未登入。請先輸入船長名字。</p>
      </main>
    );
  }

  return (
    <main className="lc-page" aria-labelledby="lc-title">
      <header className="lc-header">
        <div>
          <p className="lc-eyebrow">LEARNING CONTROL PANEL</p>
          <h1 id="lc-title" className="lc-title">學習控制台</h1>
        </div>
        <div className="lc-header-actions">
          <button
            type="button"
            className="lc-btn lc-btn--ghost"
            onClick={sendLineReport}
            disabled={reportState === "sending" || !hasData}
          >
            {reportState === "sending" ? "發送中…" : reportState === "sent" ? "已發送" : "發送學習報告"}
          </button>
        </div>
      </header>
      {reportState === "failed" && (
        <p className="lc-notice lc-notice--warn" role="alert">
          學習報告發送失敗。LINE 報告為教師／站長功能，學生帳號無法直接發送；如需開啟請聯絡家長或老師。
        </p>
      )}

      {dashboard.isPending ? (
        <p className="lc-loading" aria-busy="true">正在整理學習資料…</p>
      ) : dashboard.isError ? (
        <p className="lc-notice lc-notice--warn" role="alert">
          無法取得學習資料（可能是離線或後端暫時無法連線）。稍後重新整理即可。
        </p>
      ) : !hasData ? (
        <section className="lc-section">
          <h2 className="lc-section-title">掌握度</h2>
          <p className="lc-empty">
            {(data as { cloudAvailable?: boolean } | undefined)?.cloudAvailable === false
              ? "尚未連線雲端紀錄。本機練習照常可用，接上雲端後這裡會自動出現各科掌握度。"
              : "還沒有作答紀錄。先完成一份試卷，這裡就會出現各科掌握度與薄弱點分析。"}
          </p>
          <button type="button" className="lc-btn lc-btn--primary" onClick={() => setLocation("/practice")}>
            開始第一份試卷 →
          </button>
        </section>
      ) : (
        <>
          {/* ── 掌握度 ───────────────────────────────── */}
          <section className="lc-section" aria-labelledby="lc-mastery-title">
            <h2 id="lc-mastery-title" className="lc-section-title">掌握度</h2>
            <ul className="lc-mastery-list">
              {subjects.map((row) => {
                const tone = masteryTone(row.rate);
                return (
                  <li key={row.subject} className={`lc-mastery-row is-${tone}`}>
                    <span className="lc-mastery-subject">{row.subject}</span>
                    <span
                      className="lc-mastery-track"
                      role="progressbar"
                      aria-valuenow={row.rate ?? undefined}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${row.subject}掌握度${row.rate === null ? "資料不足" : `${row.rate}%`}`}
                    >
                      {/* 資料不足時不畫進度條，改顯示 —，避免「0% 看起來像全錯」 */}
                      {row.rate !== null && <span className="lc-mastery-fill" style={{ width: `${row.rate}%` }} />}
                    </span>
                    <span className="lc-mastery-rate">
                      {row.rate === null ? "—" : `${row.rate}%`}
                    </span>
                    <span className="lc-mastery-answered">
                      {row.answered > 0 ? `${row.answered} 題` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
            {subjects.some((s) => s.rate === null) && (
              <p className="lc-hint">「—」表示該科答題數不足 5 題，暫不計算掌握度。</p>
            )}
          </section>

          {/* ── 薄弱點 ───────────────────────────────── */}
          <section className="lc-section" aria-labelledby="lc-weak-title">
            <h2 id="lc-weak-title" className="lc-section-title">
              薄弱點
              <span className="lc-section-note">答對率最低的 {weakTopics.length} 個知識點</span>
            </h2>
            {weakTopics.length === 0 ? (
              <p className="lc-empty">目前沒有明顯薄弱點——繼續保持。</p>
            ) : (
              <ol className="lc-weak-list">
                {weakTopics.map((item, index) => (
                  <li key={`${item.subject}-${item.topic}`} className="lc-weak-row">
                    <span className="lc-weak-index">{index + 1}</span>
                    <span className="lc-weak-topic">
                      {item.topic}
                      <span className="lc-weak-subject">{item.subject}</span>
                    </span>
                    <span className="lc-weak-rate is-weak">{item.rate}%</span>
                    <button type="button" className="lc-btn lc-btn--primary lc-btn--sm" onClick={() => trainTopic(item)}>
                      專項訓練
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* ── 繼續上次 ─────────────────────────────── */}
          {data?.recent && (
            <section className="lc-section" aria-labelledby="lc-continue-title">
              <h2 id="lc-continue-title" className="lc-section-title">繼續上次</h2>
              <div className="lc-continue">
                <p className="lc-continue-meta">
                  {data.recent.grade ? `${data.recent.grade} 年級 · ` : ""}
                  {data.recent.subject}
                  {data.recent.difficulty ? ` · ${data.recent.difficulty}` : ""}
                  <span className="lc-continue-score">
                    {data.recent.correctCount}/{data.recent.totalQuestions}
                  </span>
                </p>
                {data.recent.topics.length > 0 && (
                  <p className="lc-continue-topics">知識點：{data.recent.topics.join("、")}</p>
                )}
                <button type="button" className="lc-btn lc-btn--primary" onClick={continueLast}>
                  繼續學習 →
                </button>
              </div>
            </section>
          )}

          {/* ── 下一步建議（既有 routeTaskType 的產出）────── */}
          {data?.route?.reason && (
            <section className="lc-section" aria-labelledby="lc-next-title">
              <h2 id="lc-next-title" className="lc-section-title">下一步</h2>
              <p className="lc-next-reason">{data.route.reason}</p>
              <button
                type="button"
                className="lc-btn lc-btn--ghost"
                onClick={() => {
                  const query = new URLSearchParams({ source: "console" });
                  if (data.route.subject) query.set("subjectScope", data.route.subject);
                  setLocation(`/practice?${query.toString()}`);
                }}
              >
                依建議出題 →
              </button>
            </section>
          )}
        </>
      )}
    </main>
  );
}
