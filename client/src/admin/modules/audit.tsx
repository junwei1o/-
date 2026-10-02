import React from "react";
import { trpc } from "@/lib/trpc";
import type { AdminModule } from "../types";

/**
 * 維運操作審計（型態＝時間軸清單）。
 *
 * 回答的是「這是誰做的、什麼時候做的、做了幾次」。
 * 後台的維運操作會改變伺服器狀態，沒有紀錄就無法追。
 *
 * 誠實標示這份紀錄的極限——它是**記憶體環形緩衝**，
 * 重新部署就歸零，而且只記 100 筆。
 * 把它說成「稽核紀錄」會誤導站長以為它防得住什麼，
 * 所以這裡直接寫清楚它能防與不能防。
 */

const ACTION_LABEL: Record<string, string> = {
  healthCheck: "執行健康檢查",
  resetSpeechBreaker: "重設朗讀熔斷",
};

function timeLabel(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function AuditModule() {
  const query = trpc.admin.auditLog.useQuery(undefined, { refetchInterval: 30_000, staleTime: 10_000, retry: false });
  if (query.isPending) return <p className="admin-muted" aria-busy="true">正在讀取操作紀錄…</p>;
  if (query.isError || !query.data) return <p className="admin-error" role="alert">目前無法取得操作紀錄。</p>;

  const { entries, total, capacity } = query.data;

  return (
    <>
      <p className="admin-source">
        已記錄 <strong>{total}</strong> 筆（上限 {capacity} 筆）。
        這是<strong>記憶體環形緩衝</strong>：重新部署後歸零，超過上限會丟掉最舊的。
        它能回答「剛才誰動了什麼」，不能當稽核等級的紀錄。
      </p>

      {entries.length === 0 ? (
        <p className="admin-muted">
          還沒有任何操作紀錄。到「維護工具 → 維運操作」按一次「執行健康檢查」或「重設朗讀熔斷」就會出現。
        </p>
      ) : (
        <ul className="admin-audit-list">
          {entries.map((entry) => (
            <li key={entry.seq} className={`admin-audit-item is-${entry.ok ? "ok" : "watch"}`}>
              <span className="admin-audit-time">{timeLabel(entry.at)}</span>
              <span className="admin-audit-action">{ACTION_LABEL[entry.action] ?? entry.action}</span>
              <span className="admin-audit-actor">{entry.actor}</span>
              <span className="admin-audit-detail">{entry.detail}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="admin-source">
        只記<strong>操作名稱、時間、成敗與一句話摘要</strong>——不記參數、不記使用者輸入。
        審計紀錄本身不該變成另一個隱私問題。
      </p>
    </>
  );
}

export const auditModule: AdminModule = {
  id: "audit-log",
  title: "維運操作審計",
  group: "maintenance",
  summary: "誰在什麼時候執行了維運操作。記憶體環形緩衝，重部署即歸零。",
  order: 20,
  span: "full",
  render: () => <AuditModule />,
};
