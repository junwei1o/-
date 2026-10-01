import React from "react";
import { trpc } from "@/lib/trpc";
import type { AdminModule } from "../types";

/**
 * 執行環境（型態＝key-value ＋ 環境變數檢查清單）。
 *
 * **只顯示「是否已設定」，絕不顯示值**——後台不該成為機密外洩管道。
 * 這對站長排查「某功能為什麼沒生效」特別有用：一眼看出是哪個變數還沒補。
 */
function RuntimeModule() {
  const query = trpc.admin.runtime.useQuery(undefined, { staleTime: 60_000, retry: false });
  if (query.isPending) return <p className="admin-muted" aria-busy="true">正在讀取執行環境…</p>;
  if (query.isError || !query.data) return <p className="admin-error" role="alert">目前無法取得執行環境資訊。</p>;

  const info = query.data;
  const missing = info.env.filter((row) => !row.configured);
  const uptimeHours = Math.floor(info.uptimeMs / 3_600_000);
  const uptimeLabel =
    uptimeHours >= 1 ? `${uptimeHours} 小時 ${Math.floor((info.uptimeMs % 3_600_000) / 60_000)} 分` : `${Math.max(1, Math.floor(info.uptimeMs / 60_000))} 分鐘`;

  return (
    <>
      <dl className="admin-kv">
        <div className="admin-kv-row">
          <dt>Node 版本</dt>
          <dd>{info.nodeVersion}</dd>
        </div>
        <div className="admin-kv-row">
          <dt>執行環境</dt>
          <dd>{info.environment}</dd>
          <small>與平台：{info.platform}</small>
        </div>
        <div className="admin-kv-row">
          <dt>本次啟動</dt>
          <dd>{uptimeLabel}</dd>
          <small>伺服器記憶體中的計數器都以這個時間為起點。</small>
        </div>
        <div className="admin-kv-row">
          <dt>記憶體</dt>
          <dd>RSS {info.memory.rssMb} MB</dd>
          <small>
            Heap 已用 {info.memory.heapUsedMb} / 總計 {info.memory.heapTotalMb} MB
            {info.memory.heapUsedMb / Math.max(1, info.memory.heapTotalMb) > 0.85 && "——已用比例偏高，可留意是否有洩漏"}
          </small>
        </div>
      </dl>

      <h4 className="admin-dist-title">環境變數（只顯示是否已設定）</h4>
      {missing.length > 0 && (
        <p className="admin-source">
          有 {missing.length} 項尚未設定：{missing.map((row) => row.name).join("、")}。未設定的功能會走降級路徑，不一定會壞，但行為與預期不同。
        </p>
      )}
      <ul className="admin-env-list">
        {info.env.map((row) => (
          <li key={row.name} className={`admin-env-item is-${row.configured ? "ok" : "missing"}`}>
            <span className="admin-env-mark" aria-hidden="true">{row.configured ? "✓" : "—"}</span>
            <code className="admin-env-name">{row.name}</code>
            <span className="admin-env-note">{row.note}</span>
          </li>
        ))}
      </ul>
      <p className="admin-source">
        基於安全，這裡<strong>永遠不顯示變數的值</strong>，只顯示是否已設定。要修改請到部署環境（Render → Environment）調整。
      </p>
    </>
  );
}

export const runtimeModule: AdminModule = {
  id: "runtime",
  title: "執行環境",
  group: "system",
  summary: "伺服器版本、資源占用，以及各環境變數是否已設定。",
  order: 5,
  span: "full",
  render: () => <RuntimeModule />,
};
