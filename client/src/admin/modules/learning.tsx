import React from "react";
import { trpc } from "@/lib/trpc";
import type { AdminModule } from "../types";

/**
 * 學習活動實況（型態＝統計格 ＋ 趨勢條 ＋ 排行榜）。
 *
 * 為什麼這一類資料原本不存在、但應該存在：
 * 後台原本全部是「**站台**怎麼樣」（資源、請求、題庫、部署），
 * 沒有任何一項回答「**有沒有人在用、學得怎麼樣**」。
 * 對一個 learning 站台來說，那是站長最先該知道的事——
 * 而且它和「站台故障」要處理的方向完全不同：
 * 站台正常但沒人來用，該做的是招生，不是修 bug。
 *
 * 取捨（都寫在畫面上，不藏著）：
 * - 只看**最近 90 天**。站久了之後全表掃描會變慢，而站長要的是「最近」不是「歷史」。
 * - 學生名稱會出現。這是站長的運維視角，且船名本來就是使用者自己填的暱稱。
 * - 沒有資料庫就明說沒有，不用 0 假裝「沒人學」。
 */

function Loading({ label }: { label: string }) {
  return <p className="admin-muted" aria-busy="true">{label}</p>;
}

function LearningModule() {
  const query = trpc.admin.learningActivity.useQuery(undefined, { staleTime: 60_000, retry: false });
  if (query.isPending) return <Loading label="正在統計學習活動…" />;
  if (query.isError || !query.data) return <p className="admin-error" role="alert">目前無法取得學習活動統計。</p>;

  const data = query.data;

  if (!data.database.configured) {
    return (
      <div className="admin-warning is-watch" role="status">
        <strong className="admin-warning-badge">需要資料庫才能統計</strong>
        <span className="admin-warning-headline">
          沒有設定 <code>DATABASE_URL</code>，學習活動不會被記錄下來，所以這裡沒有資料。
        </span>
        <small className="admin-warning-advice">這不是故障——是站長還沒決定要不要開雲端記錄。</small>
      </div>
    );
  }
  if (!data.database.reachable) {
    return (
      <div className="admin-warning is-high" role="alert">
        <strong className="admin-warning-badge">資料庫連線異常</strong>
        <span className="admin-warning-headline">{data.database.error ?? "無法連線"}</span>
        <small className="admin-warning-advice">查不到學習活動；到部署環境檢查 DATABASE_URL。</small>
      </div>
    );
  }

  const pct = (value: number) => `${Math.round(value * 1000) / 10}%`;
  const peak = Math.max(1, ...data.daily.map((row) => row.sessions));
  const last7 = data.windows.find((row) => row.days === 7);
  const last30 = data.windows.find((row) => row.days === 30);

  return (
    <>
      <dl className="admin-stat-grid">
        {data.windows.map((row) => (
          <div className="admin-stat" key={row.days}>
            <dt>{row.label}</dt>
            <dd>{row.sessions.toLocaleString("zh-TW")}</dd>
            <small>場次／{row.students} 位學生</small>
          </div>
        ))}
        <div className="admin-stat">
          <dt>活躍學生（90 天）</dt>
          <dd>{data.activeStudents?.toLocaleString("zh-TW") ?? "—"}</dd>
          <small>有答題紀錄的去重人數；帳號共 {data.registeredStudents ?? "—"} 筆</small>
        </div>
      </dl>

      <h4 className="admin-dist-title">整體正確率</h4>
      <p className="admin-big-number">
        <strong>{data.overallAccuracy === null ? "—" : pct(data.overallAccuracy)}</strong>
        <span>近 90 天</span>
        <small>
          {data.overallAccuracy === null
            ? "沒有可計算的答題紀錄（總題數為 0）。"
            : `答題中位時長 ${data.medianDurationSec === null ? "未記錄" : `${data.medianDurationSec} 秒`}。舊資料可能沒有記時長。`}
        </small>
      </p>

      <h4 className="admin-dist-title">最近 14 天趨勢</h4>
      <ul className="admin-trend-list" aria-label="最近 14 天答題場次">
        {data.daily.map((row) => {
          const width = (row.sessions / peak) * 100;
          return (
            <li key={row.date} className={`admin-trend-item${row.sessions === 0 ? " is-zero" : ""}`}>
              <span className="admin-trend-date">{row.date.slice(5)}</span>
              <span className="admin-trend-track" aria-hidden="true">
                <span className="admin-trend-fill" style={{ width: `${width}%` }} />
              </span>
              <span className="admin-trend-value" title={`${row.date}：${row.sessions} 場／${row.students} 人`}>
                {row.sessions}
              </span>
            </li>
          );
        })}
      </ul>

      {data.bySubject.length > 0 && (
        <>
          <h4 className="admin-dist-title">各科目正確率</h4>
          <ul className="admin-meter-list">
            {data.bySubject.map((row) => (
              <li key={row.subject} className={`admin-meter-item is-${row.accuracy >= 0.7 ? "ok" : row.accuracy >= 0.5 ? "watch" : "high"}`}>
                <span className="admin-meter-label">{row.subject}</span>
                <meter
                  className="admin-meter"
                  min={0}
                  max={100}
                  value={Math.min(100, row.accuracy * 100)}
                  aria-label={`${row.subject}：正確率 ${pct(row.accuracy)}，${row.sessions} 場`}
                />
                <span className="admin-meter-value">
                  {pct(row.accuracy)}（{row.sessions} 場）
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {data.topStudents.length > 0 && (
        <>
          <h4 className="admin-dist-title">答題場次前 10 名</h4>
          <p className="admin-source">
            顯示的是使用者自己填的「船名」（暱稱），不是個資；這是站長的運維視角。
          </p>
          <ul className="admin-rank-list">
            {data.topStudents.map((row, index) => (
              <li key={row.name} className="admin-rank-item">
                <span className="admin-rank-index">{index + 1}</span>
                <span className="admin-rank-name">{row.name}</span>
                <span className="admin-rank-value">
                  {row.sessions} 場・正確率 {pct(row.accuracy)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {data.activeStudents === 0 && (
        <div className="admin-warning is-watch" role="status">
          <strong className="admin-warning-badge">還沒有人用過</strong>
          <span className="admin-warning-headline">
            資料庫連得上，但近 90 天沒有任何答題紀錄。
          </span>
          <small className="admin-warning-advice">
            這通常是正常狀態（新站）。要確認是「真的沒人來」而不是「紀錄沒寫進去」，
            可以讓學生答一題試試，再回來看這裡有沒有變化。
          </small>
        </div>
      )}

      <p className="admin-source">
        統計範圍只取<strong>最近 90 天</strong>——站久了之後全表掃描會變慢，
        而站長要的是「最近」不是「歷史」。7 天內 {last7?.sessions ?? 0} 場、30 天內 {last30?.sessions ?? 0} 場。
      </p>
    </>
  );
}

export const learningActivityModule: AdminModule = {
  id: "learning-activity",
  title: "學習活動實況",
  group: "overview",
  summary: "有沒有人在用、答對率如何、哪個科目最弱——站長最先該知道、但後台原本完全沒有的那一類。",
  order: 20,
  span: "full",
  render: () => <LearningModule />,
};
