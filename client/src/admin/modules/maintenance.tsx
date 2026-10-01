import React from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { AdminModule } from "../types";

/**
 * 維運操作（型態＝操作按鈕 ＋ 執行結果）。
 *
 * 這是後台裡**唯一會改變伺服器狀態**的模組。刻意只放「安全、可逆、且真的有用」
 * 的操作，並在每顆按鈕旁寫清楚它會做什麼、不會做什麼：
 *
 * - 執行健康檢查：主動打一次 DB／題庫／朗讀探測，拿「當下」狀態（唯讀，無副作用）
 * - 重設朗讀熔斷：把連續失敗計數歸零（只影響計時器，不改合成行為）
 *
 * 刻意**不放**的危險操作（需要更完整的權限邊界與確認流程，見報告「未做」）：
 * 清空資料庫、強制重建題庫、重啟服務、刪除班級——這些一旦誤觸無法復原。
 */
function MaintenanceModule() {
  const utils = trpc.useUtils();
  const health = trpc.admin.healthCheck.useMutation();
  const resetBreaker = trpc.admin.resetSpeechBreaker.useMutation();
  const [resetAt, setResetAt] = React.useState<number | null>(null);

  const runHealthCheck = () =>
    health.mutate(undefined, {
      onSuccess: () => {
        void utils.admin.speechHealth.invalidate();
        void utils.admin.siteStats.invalidate();
      },
    });

  return (
    <>
      <div className="admin-action-row">
        <button type="button" className="admin-primary-button" onClick={runHealthCheck} disabled={health.isPending}>
          <ShieldCheck size={16} aria-hidden="true" />
          {health.isPending ? "檢查中…" : "執行健康檢查"}
        </button>
        <button
          type="button"
          className="admin-secondary-button"
          onClick={() =>
            resetBreaker.mutate(undefined, {
              onSuccess: () => {
                setResetAt(Date.now());
                void utils.admin.speechHealth.invalidate();
              },
            })
          }
          disabled={resetBreaker.isPending}
        >
          <RefreshCw size={15} aria-hidden="true" />
          {resetBreaker.isPending ? "重設中…" : "重設朗讀熔斷"}
        </button>
      </div>

      {health.isError && (
        <p className="admin-error" role="alert">健康檢查執行失敗，請稍後再試。</p>
      )}

      {health.data && (
        <div className={`admin-warning is-${health.data.ok ? "ok" : "watch"}`} role="status">
          <strong className="admin-warning-badge">{health.data.ok ? "全部正常" : "有項目需要留意"}</strong>
          <span className="admin-warning-headline">
            於 {new Date(health.data.ranAt).toLocaleTimeString("zh-TW")} 完成，共 {health.data.steps.length} 項。
          </span>
        </div>
      )}

      {health.data && (
        <ul className="admin-check-list">
          {health.data.steps.map((step) => (
            <li key={step.name} className={`admin-check-item is-${step.ok ? "ok" : "watch"}`}>
              <span className="admin-check-mark" aria-hidden="true">{step.ok ? "✓" : "!"}</span>
              <div className="admin-check-body">
                <p className="admin-check-title">
                  {step.name}
                  <span className="admin-check-tag is-neutral">{step.ms} ms</span>
                </p>
                <p className="admin-check-note">{step.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {resetAt !== null && !resetBreaker.isPending && (
        <p className="admin-source" role="status">
          朗讀熔斷器已於 {new Date(resetAt).toLocaleTimeString("zh-TW")} 重設；下次朗讀會重新嘗試遠端合成。
        </p>
      )}

      <p className="admin-source">
        這些操作都只影響<strong>執行中的計數與計時器</strong>，不會修改資料庫或使用者資料；
        重新部署後一切回到預設。真正具破壞性的維運動作（重建題庫、清除資料）尚未開放——
        那需要額外的確認流程，見報告說明。
      </p>
    </>
  );
}

export const maintenanceModule: AdminModule = {
  id: "maintenance",
  title: "維運操作",
  group: "maintenance",
  summary: "主動健康檢查與重設朗讀熔斷——修完東西後立刻確認。",
  order: 10,
  span: "full",
  render: () => <MaintenanceModule />,
};
