import React from "react";
import { trpc } from "@/lib/trpc";
import type { AdminModule } from "../types";

/**
 * 資料安全與備份（型態＝狀態卡 ＋ 排除清單 ＋ 下載入口）。
 *
 * 這一組要回答兩個問題：
 * 1. **資料能不能救回來**——備份功能現在是什麼狀態。
 * 2. **原始碼的暴露範圍**——`/api/backup` 這件事站長知不知道。
 *
 * 為什麼第 2 點值得單獨講：這個端點是**刻意公開**的
 * （站長要能一鍵下載全站原始碼、在本機離線架站），
 * 但「刻意公開」不等於「應該無意識地公開」——
 * 任何訪客，包含學生，都能下載。
 * 隱瞞這件事等於讓站長在不知情的狀況下做決定；
 * 明白寫出來，他可以自己判斷要不要收緊。
 *
 * 這裡**不擅自把它關掉**。關掉會直接破壞站長的離線架站流程，
 * 那是他要的功能，不是我的判斷範圍。
 */

function DataSafetyModule() {
  const query = trpc.admin.dataSafety.useQuery(undefined, { staleTime: 60_000, retry: false });
  if (query.isPending) return <p className="admin-muted" aria-busy="true">正在讀取資料安全狀態…</p>;
  if (query.isError || !query.data) return <p className="admin-error" role="alert">目前無法取得資料安全狀態。</p>;

  const data = query.data;
  const backup = data.backup;

  return (
    <>
      <h4 className="admin-dist-title">資料庫</h4>
      {!data.database.configured ? (
        <div className="admin-warning is-watch" role="status">
          <strong className="admin-warning-badge">未啟用雲端資料庫</strong>
          <span className="admin-warning-headline">
            沒有 <code>DATABASE_URL</code>，所以沒有任何資料存在伺服器上——也就沒有東西需要備份。
          </span>
          <small className="admin-warning-advice">此時學生的進度只存在各自瀏覽器，換裝置就沒了。</small>
        </div>
      ) : !data.database.reachable ? (
        <div className="admin-warning is-high" role="alert">
          <strong className="admin-warning-badge">資料庫連線異常</strong>
          <span className="admin-warning-headline">{data.database.error ?? "無法連線"}</span>
          <small className="admin-warning-advice">這是「最需要備份」的狀態——先確認資料庫本身是否還活著。</small>
        </div>
      ) : (
        <p className="admin-source">
          連線正常。這代表班級、公告、試卷紀錄、雲端存檔都在資料庫裡，
          而資料庫的備份由<strong>資料庫服務商（TiDB Cloud）</strong>負責，不是這個網站。
        </p>
      )}

      <h4 className="admin-dist-title">原始碼備份（{backup.endpoint}）</h4>
      <div className={`admin-warning is-${backup.tokenRequired ? "ok" : "watch"}`} role="status">
        <strong className="admin-warning-badge">{backup.tokenRequired ? "已設保護" : "公開可下載"}</strong>
        <span className="admin-warning-headline">
          {backup.tokenRequired
            ? "已設定 BACKUP_TOKEN，下載需要帶 token。"
            : "任何訪客都能下載，包含學生。這個功能是刻意公開的，但「公開」應該是知情的選擇。"}
        </span>
        <small className="admin-warning-advice">
          存在理由：{backup.purpose}
          {!backup.tokenRequired && "　若要收緊：在部署環境設定 BACKUP_TOKEN，並讓 /api/backup 驗證它。"}
        </small>
      </div>

      <p className="admin-source">
        <a href={backup.endpoint} className="admin-doc-download" download>
          ⬇︎ 一鍵下載全站原始碼（{backup.endpoint}）
        </a>
        <span className="admin-doc-note">
          下載後解壓、<code>pnpm install --frozen-lockfile</code>、<code>pnpm build</code> 即可在本機離線架站。
        </span>
      </p>

      <h4 className="admin-dist-title">不會被下載的內容</h4>
      <p className="admin-source">這些在打包時被排除——其中 <code>.env</code> 是關鍵：機密不會跟著原始碼走。</p>
      <ul className="admin-exclude-list">
        {backup.excludes.map((item) => (
          <li key={item} className="admin-exclude-item">
            <span className="admin-exclude-mark" aria-hidden="true">✓</span>
            <code>{item}</code>
          </li>
        ))}
      </ul>

      <p className="admin-source">
        ⭐ <strong>誠實的提醒</strong>：排除清單是「現在這個版本」的。
        日後若新增了寫在原始碼裡的機密（不建議），它會被一起下載。
        檢查指令見知識庫 <code>03-本機工作台</code> 的「憑證衛生」。
      </p>
    </>
  );
}

export const dataSafetyModule: AdminModule = {
  id: "data-safety",
  title: "資料安全與備份",
  group: "overview",
  summary: "資料能不能救回來，以及原始碼備份端點的暴露範圍——兩件都該讓站長知情。",
  order: 40,
  span: "full",
  render: () => <DataSafetyModule />,
};
