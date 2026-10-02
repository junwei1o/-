import React from "react";
import { trpc } from "@/lib/trpc";
import type { AdminModule } from "../types";

/**
 * 部署與版本（型態＝key-value ＋ 判定說明）。
 *
 * 站長會遇到的情境：「線上是不是我剛推的那版？」
 * 記憶體提到過——**單看前端 bundle 雜湊會誤判**，
 * 因為 Vite 把 `VITE_` 變數內聯進去，本機與線上建出來的雜湊本來就不同。
 * 所以這個模組刻意給「可判定」的訊號，而不是給一個容易誤導的雜湊值。
 */

function DeployModule() {
  const query = trpc.admin.deployInfo.useQuery(undefined, { staleTime: 60_000, retry: false });
  if (query.isPending) return <p className="admin-muted" aria-busy="true">正在讀取部署資訊…</p>;
  if (query.isError || !query.data) return <p className="admin-error" role="alert">目前無法取得部署資訊。</p>;

  const info = query.data;
  const started = new Date(info.startedAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const startedLabel = `${started.getFullYear()}-${pad(started.getMonth() + 1)}-${pad(started.getDate())} ${pad(started.getHours())}:${pad(started.getMinutes())}`;
  const hours = Math.floor(info.uptimeMs / 3_600_000);
  const minutes = Math.floor((info.uptimeMs % 3_600_000) / 60_000);
  const justDeployed = hours === 0;

  return (
    <>
      <dl className="admin-kv">
        <div className="admin-kv-row">
          <dt>本次部署開始</dt>
          <dd>{startedLabel}</dd>
          <small>
            這是本 process 啟動的時間，也是「記憶體統計歸零」的時間點。
            {justDeployed && " 剛啟動，數字小是正常的。"}
          </small>
        </div>
        <div className="admin-kv-row">
          <dt>已運行</dt>
          <dd>{hours > 0 ? `${hours} 小時 ${minutes} 分` : `${minutes} 分鐘`}</dd>
          <small>免費層閒置 15 分鐘會休眠，所以長時間沒有請求時這個數字會重來。</small>
        </div>
        <div className="admin-kv-row">
          <dt>部署平台</dt>
          <dd>{info.platform}</dd>
          <small>由環境推斷，不是寫死的。</small>
        </div>
        <div className="admin-kv-row">
          <dt>Node / 環境</dt>
          <dd>
            {info.nodeVersion}・{info.environment}
          </dd>
        </div>
        <div className="admin-kv-row">
          <dt>原始碼 commit</dt>
          <dd>{info.gitCommit ? <code>{info.gitCommit.short}</code> : "讀不到"}</dd>
          <small>
            {info.gitCommit
              ? info.gitCommit.subject ?? "（讀不到 commit 說明）"
              : "這個部署環境不含 .git 目錄，所以無法確認版本。**不知道比猜一個版本號誠實。**"}
          </small>
        </div>
      </dl>

      <h4 className="admin-dist-title">怎麼確認線上是我剛推的那版</h4>
      <ul className="admin-check-list">
        <li className="admin-check-item is-ok">
          <span className="admin-check-mark" aria-hidden="true">1</span>
          <div className="admin-check-body">
            <p className="admin-check-title">純後端改動 → 看時間，不看雜湊</p>
            <p className="admin-check-note">
              後端改動不會動前端 bundle，所以雜湊不變是正常的。改看本頁的「本次部署開始」有沒有更新。
            </p>
          </div>
        </li>
        <li className="admin-check-item is-ok">
          <span className="admin-check-mark" aria-hidden="true">2</span>
          <div className="admin-check-body">
            <p className="admin-check-title">純前端改動 → 比對多個 lazy chunk 檔名</p>
            <p className="admin-check-note">
              不要只看主 bundle 的雜湊——它會因為環境變數內聯而對不上。要比對多個 chunk 檔名。
            </p>
          </div>
        </li>
        <li className="admin-check-item is-ok">
          <span className="admin-check-mark" aria-hidden="true">3</span>
          <div className="admin-check-body">
            <p className="admin-check-title">最可靠：直接打新功能</p>
            <p className="admin-check-note">
              捲到「知識與文件」確認能讀到 <code>docs/knowledge-base/</code> 的目錄——
              那個端點是純後端新增的，能讀到就代表新版本確實上線了。
            </p>
          </div>
        </li>
      </ul>
    </>
  );
}

export const deployInfoModule: AdminModule = {
  id: "deploy-info",
  title: "部署與版本",
  group: "system",
  summary: "現在跑的是哪一版、從什麼時候開始跑，以及怎麼確認線上就是剛推的那版。",
  order: 15,
  span: "full",
  render: () => <DeployModule />,
};
