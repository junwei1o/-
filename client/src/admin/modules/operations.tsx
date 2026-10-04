import React from "react";
import { trpc } from "@/lib/trpc";
import type { AdminModule } from "../types";

/**
 * 營運類模組（型態＝指標格 ＋ 狀態徽章）。
 *
 * 全部接真實來源，不用估算值假裝精確：
 * - 請求與限流：伺服器端中介層實測（只記聚合，不記路徑／IP）
 * - 朗讀供應鏈：既有 tts.health 探測（含 30 秒快取）
 */

function Loading({ label }: { label: string }) {
  return <p className="admin-muted" aria-busy="true">{label}</p>;
}

function Failed({ label }: { label: string }) {
  return <p className="admin-error" role="alert">{label}</p>;
}

// ── 請求與限流 ─────────────────────────────────────────────

function RequestStatsModule() {
  const query = trpc.admin.requestStats.useQuery(undefined, { refetchInterval: 60_000, staleTime: 30_000, retry: false });
  if (query.isPending) return <Loading label="正在讀取請求統計…" />;
  if (query.isError || !query.data) return <Failed label="目前無法取得請求統計。" />;

  const stats = query.data;
  const errorRate = stats.total > 0 ? ((stats.byStatusClass.s4xx + stats.byStatusClass.s5xx) / stats.total) * 100 : 0;
  const classRows: { label: string; value: number; tone: "ok" | "neutral" | "watch" | "high" }[] = [
    { label: "2xx 成功", value: stats.byStatusClass.s2xx, tone: "ok" },
    { label: "3xx 轉址", value: stats.byStatusClass.s3xx, tone: "neutral" },
    { label: "4xx 用戶端錯誤", value: stats.byStatusClass.s4xx, tone: "watch" },
    { label: "5xx 伺服器錯誤", value: stats.byStatusClass.s5xx, tone: "high" },
  ];

  return (
    <>
      <dl className="admin-stat-grid">
        <div className="admin-stat">
          <dt>總請求數</dt>
          <dd>{stats.total.toLocaleString("zh-TW")}<small>本次實例啟動以來（重新部署即歸零）。</small></dd>
        </div>
        <div className="admin-stat">
          <dt>錯誤率</dt>
          <dd>{stats.total === 0 ? "—" : `${Math.round(errorRate * 10) / 10}%`}<small>4xx ＋ 5xx 佔全部請求的比例。</small></dd>
        </div>
        <div className="admin-stat">
          <dt>最慢一次</dt>
          <dd>{stats.total === 0 ? "—" : `${stats.slowestMs} ms`}<small>用來抓偶發卡頓；正常請求多在數十毫秒內。</small></dd>
        </div>
        <div className="admin-stat">
          <dt>慢請求（≥1 秒）</dt>
          <dd>{stats.slowRequests.toLocaleString("zh-TW")}<small>累計次數；少數幾次多為冷啟動或遠端朗讀。</small></dd>
        </div>
      </dl>

      <ul className="admin-meter-list">
        {classRows.map((row) => {
          const share = stats.total > 0 ? (row.value / stats.total) * 100 : 0;
          return (
            <li key={row.label} className={`admin-meter-item is-${row.tone}`}>
              <span className="admin-meter-label">{row.label}</span>
              <meter
                className="admin-meter"
                min={0}
                max={100}
                value={Math.min(100, share)}
                aria-label={`${row.label}：${row.value} 次，佔 ${Math.round(share * 10) / 10}%`}
              />
              <span className="admin-meter-value">
                {row.value.toLocaleString("zh-TW")}（{Math.round(share * 10) / 10}%）
              </span>
            </li>
          );
        })}
      </ul>

      <p className="admin-source">
        統計只保留聚合數字（狀態碼分級、HTTP 方法、耗時），<strong>不記錄路徑、IP 或使用者代理</strong>。
        {Object.keys(stats.byMethod).length > 0 && ` 方法分布：${Object.entries(stats.byMethod).map(([m, n]) => `${m} ${n}`).join("、")}。`}
      </p>
    </>
  );
}

// ── 朗讀供應鏈 ─────────────────────────────────────────────

function SpeechSupplyModule() {
  const query = trpc.admin.speechHealth.useQuery(undefined, { staleTime: 30_000, retry: false });
  if (query.isPending) return <Loading label="正在探測朗讀供應鏈…（首次約需數秒）" />;
  if (query.isError || !query.data) return <Failed label="目前無法探測朗讀供應鏈。" />;

  const supply = query.data;
  const available = supply.candidates.some((candidate) => candidate.edgeTts);
  const broken = supply.breaker.brokenForMs > 0;

  return (
    <>
      <div className={`admin-warning is-${available ? "ok" : "watch"}`} role="status">
        <strong className="admin-warning-badge">{available ? "遠端朗讀可用" : "退回瀏覽器語音"}</strong>
        <span className="admin-warning-headline">
          {available
            ? "Edge TTS 供應鏈正常，朗讀會使用遠端較佳音質。"
            : "伺服器端未安裝 edge-tts，朗讀自動退回瀏覽器內建語音（功能仍可用，音質不同）。"}
        </span>
        <small className="admin-warning-advice">
          安裝結果：{supply.installNote ?? "尚未嘗試安裝"}。
          {broken && ` 目前熔斷中（剩餘約 ${Math.ceil(supply.breaker.brokenForMs / 1000)} 秒）。`}
        </small>
      </div>

      <dl className="admin-kv">
        {supply.candidates.map((candidate) => (
          <div className="admin-kv-row" key={candidate.python}>
            <dt>{candidate.python}</dt>
            <dd>{candidate.edgeTts ? "edge-tts 可用" : candidate.exists ? "存在，但無 edge-tts" : "找不到這個 python"}</dd>
            {candidate.exists && (
              <small>
                pip {candidate.pip ? "可用" : "不可用"}；使用者 site-packages {candidate.userSite ? "在路徑上" : "不在路徑上"}
              </small>
            )}
          </div>
        ))}
        <div className="admin-kv-row">
          <dt>連續失敗</dt>
          <dd>{supply.breaker.failures} 次<small>達 3 次會熔斷 5 分鐘，避免持續白等；可在「維運操作」手動重設。</small></dd>
        </div>
      </dl>

      <p className="admin-source">
        註：遠端合成實測約 3–6 秒（依文字長度），為此朗讀按鈕在取音期間會顯示「準備中」。
      </p>
    </>
  );
}

export const requestStatsModule: AdminModule = {
  id: "request-stats",
  title: "請求與限流",
  group: "operations",
  summary: "請求量、錯誤率與慢請求分布——判斷站點現在忙不忙、有沒有在噴錯。",
  order: 20,
  span: "full",
  render: () => <RequestStatsModule />,
};

export const speechSupplyModule: AdminModule = {
  id: "speech-supply",
  title: "朗讀供應鏈",
  group: "operations",
  summary: "遠端朗讀（Edge TTS）是否可用，以及失敗時的退回行為。",
  order: 30,
  span: "half",
  render: () => <SpeechSupplyModule />,
};
