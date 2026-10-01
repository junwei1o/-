import React from "react";
import { trpc } from "@/lib/trpc";
import {
  RU_QUOTA_EXPLANATION,
  formatPercent,
  formatRu,
  formatUptime,
  projectedPercent,
  warningPresentation,
  type DbUsageStatusView,
} from "@/lib/dbUsageStatus";
import type { AdminModule } from "../types";

/**
 * 模組：全站資源監控（型態＝指標 ＋ meter 對比）。
 *
 * 由 /settings 的船長室搬來（2026-10-01）：這是**營運資訊**，屬於站長職責，
 * 放進站長後台才對；同時端點已由公開改為站長專屬。
 */
function ResourceMonitorModule() {
  const query = trpc.dbUsage.status.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  });

  if (query.isPending) {
    return <p className="admin-muted" aria-busy="true">正在讀取資源用量…</p>;
  }
  if (query.isError || !query.data) {
    return <p className="admin-error" role="alert">目前無法取得資源用量，請稍後再試。</p>;
  }

  const usage = query.data as DbUsageStatusView;
  const warning = warningPresentation(usage.level, usage.sustainableRuPerHour);
  const projectedShare = projectedPercent(usage.projectedMonthlyRu, usage.quota.ruPerMonth);

  return (
    <>
      <div className={`admin-warning is-${warning.tone}`} role={usage.level === "high" ? "alert" : "status"}>
        <strong className="admin-warning-badge">{warning.badge}</strong>
        <span className="admin-warning-headline">{warning.headline}</span>
        {warning.advice && <small className="admin-warning-advice">{warning.advice}</small>}
      </div>

      <div className="admin-ru-block">
        <p className="admin-ru-quota">
          RU 限額：<strong>{usage.quota.label}</strong>
        </p>
        <p className="admin-ru-note">{RU_QUOTA_EXPLANATION}</p>

        <div className="admin-ru-meters">
          <div className="admin-ru-meter-row">
            <span className="admin-ru-meter-label">已使用</span>
            <meter
              className="admin-ru-meter"
              min={0}
              max={100}
              value={Math.min(100, usage.percentOfQuota)}
              aria-label={`本次實例已使用約 ${formatRu(usage.estimatedRu)} RU，佔月額度 ${formatPercent(usage.percentOfQuota)}`}
            />
            <span className="admin-ru-meter-value">
              {formatRu(usage.estimatedRu)} RU（{formatPercent(usage.percentOfQuota)}）
            </span>
          </div>
          <div className="admin-ru-meter-row">
            <span className="admin-ru-meter-label">外推月用量</span>
            <meter
              className={`admin-ru-meter is-${warning.tone}`}
              min={0}
              max={100}
              value={projectedShare === null ? 0 : Math.min(100, projectedShare)}
              aria-label={
                usage.projectedMonthlyRu === null
                  ? "外推月用量：資料累積中"
                  : `依目前速度外推月用量約 ${formatRu(usage.projectedMonthlyRu)} RU，佔月額度 ${formatPercent(projectedShare)}`
              }
            />
            <span className="admin-ru-meter-value">
              {usage.projectedMonthlyRu === null
                ? "資料累積中"
                : `${formatRu(usage.projectedMonthlyRu)} RU（${formatPercent(projectedShare)}）`}
            </span>
          </div>
        </div>
      </div>

      <dl className="admin-stat-grid">
        <div className="admin-stat">
          <dt>目前消耗速度</dt>
          <dd>{usage.ruPerHour === null ? "資料累積中" : `${formatRu(usage.ruPerHour)} RU/小時`}</dd>
          <small>可持續速度 {formatRu(usage.sustainableRuPerHour)} RU/小時（月額度 ÷ 30 天 ÷ 24 小時）。</small>
        </div>
        <div className="admin-stat">
          <dt>DB 語句數</dt>
          <dd>{usage.statements.toLocaleString("zh-TW")}</dd>
          <small>本次實例啟動以來，其中失敗 {usage.failedStatements} 次。</small>
        </div>
        <div className="admin-stat">
          <dt>觸及列數</dt>
          <dd>{formatRu(usage.rowsTouched)}</dd>
          <small>查詢回傳與寫入受影響列數之和，是推估 RU 的主要依據。</small>
        </div>
        <div className="admin-stat">
          <dt>統計期間</dt>
          <dd>{formatUptime(usage.uptimeMs)}</dd>
          <small>計數器存於記憶體，重新部署即歸零。</small>
        </div>
      </dl>

      <p className="admin-source">資料來源：{usage.sourceNote}</p>
    </>
  );
}

export const resourceMonitorModule: AdminModule = {
  id: "resource-monitor",
  title: "全站資源監控",
  group: "operations",
  summary: "資料庫 RU 用量、月額度對比與消耗速度警示。",
  order: 10,
  span: "full",
  render: () => <ResourceMonitorModule />,
};
