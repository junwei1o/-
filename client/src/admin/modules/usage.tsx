import React from "react";
import { trpc } from "@/lib/trpc";
import type { AdminModule } from "../types";

/**
 * AI 用量（型態＝統計格 ＋ 逐日清單）。
 *
 * 為什麼站長要看這個：AI 呼叫是本站唯一「按次計費」的外部成本，
 * 用量異常（例如某支程式誤觸迴圈）會直接反映成帳單。
 *
 * 隱私：此端點的全站彙總已於 2026-10-01 改為需教師以上權限
 * （原本是公開端點，任何訪客都能讀全站用量）。
 */
function AiUsageModule() {
  const query = trpc.aiTutor.tokenUsage.useQuery({}, { staleTime: 60_000, retry: false });

  if (query.isPending) return <p className="admin-muted" aria-busy="true">正在讀取 AI 用量…</p>;
  if (query.isError || !query.data) {
    return (
      <p className="admin-error" role="alert">
        目前無法取得 AI 用量（需要雲端資料庫；若尚未設定 <code>DATABASE_URL</code> 則不會累積）。
      </p>
    );
  }

  const { today, last7Days, byDay } = query.data;
  const days = (byDay ?? []).filter((row: { calls: number }) => row.calls > 0);

  return (
    <>
      <dl className="admin-stat-grid">
        <div className="admin-stat">
          <dt>今日呼叫</dt>
          <dd>{(today?.calls ?? 0).toLocaleString("zh-TW")}<small>每成功呼叫一次 AI 才計數。</small></dd>
        </div>
        <div className="admin-stat">
          <dt>今日 Token</dt>
          <dd>{(today?.totalTokens ?? 0).toLocaleString("zh-TW")}<small>輸入與輸出合計；供應商未回報時不計。</small></dd>
        </div>
        <div className="admin-stat">
          <dt>近 7 日呼叫</dt>
          <dd>{(last7Days?.calls ?? 0).toLocaleString("zh-TW")}</dd>
        </div>
        <div className="admin-stat">
          <dt>近 7 日 Token</dt>
          <dd>{(last7Days?.totalTokens ?? 0).toLocaleString("zh-TW")}<small>用來判斷用量趨勢是否異常。</small></dd>
        </div>
      </dl>

      {days.length === 0 ? (
        <p className="admin-muted">近 7 日沒有 AI 呼叫紀錄。</p>
      ) : (
        <dl className="admin-kv">
          {days.map((row: { usageDate: string; calls: number; promptTokens: number; completionTokens: number; totalTokens: number }) => (
            <div className="admin-kv-row" key={row.usageDate}>
              <dt>{row.usageDate}</dt>
              <dd>{row.calls} 次／{row.totalTokens.toLocaleString("zh-TW")} tokens<small>
                輸入 {row.promptTokens.toLocaleString("zh-TW")}、輸出 {row.completionTokens.toLocaleString("zh-TW")}
              </small></dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
}

export const aiUsageModule: AdminModule = {
  id: "ai-usage",
  title: "AI 用量",
  group: "usage",
  summary: "AI 呼叫次數與 token 用量——本站唯一按次計費的外部成本。",
  order: 10,
  span: "half",
  render: () => <AiUsageModule />,
};
