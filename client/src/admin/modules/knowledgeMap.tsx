import React from "react";
import type { AdminModule } from "../types";

/**
 * 專案速覽（型態＝連結式地圖，**不需要打任何 API**）。
 *
 * 為什麼這份是靜態的：它回答的是「這是什麼、去哪裡查」——
 * 這些答案在 repo 裡本來就不該變動，需要更新時直接改這個檔案。
 *
 * 刻意**不重複**文件中心的內容：這裡只做「入口地圖」，
 * 細節在知識庫的 01～06 裡。兩份都放全文等於兩份會各自過期。
 */

type Row = { label: string; value: string; note?: string };

const IDENTITY: Row[] = [
  { label: "線上站點", value: "xue-gr3a.onrender.com", note: "Render 免費層；閒置 15 分鐘休眠" },
  { label: "主 repo", value: "/Users/g/Documents/trae_projects/hdmx", note: "要改程式在這裡，不是 WorkBuddy 工作目錄" },
  { label: "GitHub", value: "github.com/junwei1o/-" },
  { label: "部署指令", value: "pnpm install --frozen-lockfile → pnpm build", note: "lockfile 不同步會直接讓部署失敗" },
];

const ROLES: Row[] = [
  { label: "學生", value: "全站學習頁", note: "以「船名」登入（localStorage）" },
  { label: "老師", value: "督學台 /teacher", note: "TEACHER_PASSPHRASE；班級、教學、公告、LINE" },
  { label: "站長", value: "後台 /admin", note: "站長用戶名（預設 admin）；全站營運、學習實況、知識庫" },
];

const ENTRY_POINTS: { file: string; what: string }[] = [
  { file: "docs/knowledge-base/01-專案總覽.md", what: "這是什麼、多大、三種角色" },
  { file: "docs/knowledge-base/03-本機工作台.md", what: "本機路徑、可用工具、驗證序列" },
  { file: "docs/knowledge-base/05-踩坑與陷阱.md", what: "症狀 → 根因 → 解法（動手前必讀）" },
  { file: "docs/knowledge-base/06-待辦與交接.md", what: "未完成的事、待你決定的事" },
];

const RULES = [
  { rule: "知識只寫真的", detail: "每個數字、每個路徑都要能對回 git 歷史、程式碼或實測；不確定就寫不確定。" },
  { rule: "寫「為什麼」不只寫「是什麼」", detail: "程式碼已經說明「是什麼」；最會失傳的是「當初為什麼選這個做法」。" },
  { rule: "踩坑要寫清症狀", detail: "下次卡住時人是先看到症狀，才會想起這份文件。" },
];

function MapModule() {
  return (
    <>
      <dl className="admin-kv">
        {IDENTITY.map((row) => (
          <div className="admin-kv-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd><code>{row.value}</code></dd>
            {row.note && <small>{row.note}</small>}
          </div>
        ))}
      </dl>

      <h4 className="admin-dist-title">三種角色（憑證性質刻意不同）</h4>
      <dl className="admin-kv">
        {ROLES.map((row) => (
          <div className="admin-kv-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
            {row.note && <small>{row.note}</small>}
          </div>
        ))}
      </dl>

      <h4 className="admin-dist-title">維護時先讀這幾份</h4>
      <ul className="admin-path-list">
        {ENTRY_POINTS.map((item) => (
          <li key={item.file}>
            <code className="admin-path-file">{item.file}</code>
            <span className="admin-path-what">{item.what}</span>
          </li>
        ))}
      </ul>

      <h4 className="admin-dist-title">這份知識庫的自我約束</h4>
      <ul className="admin-check-list">
        {RULES.map((item) => (
          <li key={item.rule} className="admin-check-item is-ok">
            <span className="admin-check-mark" aria-hidden="true">✓</span>
            <div className="admin-check-body">
              <p className="admin-check-title">{item.rule}</p>
              <p className="admin-check-note">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="admin-source">
        在站長後台新增知識只要<strong>放一個 markdown 進 <code>docs/knowledge-base/</code></strong>——
        後台在執行期讀檔，會自動收進清單，不需要改任何程式碼、不需要重新部署前端。
      </p>
    </>
  );
}

export const projectMapModule: AdminModule = {
  id: "project-map",
  title: "專案速覽",
  group: "knowledge",
  summary: "這站是什麼、程式碼在哪、三種角色的入口，以及維護時該先讀哪幾份文件。",
  order: 10,
  span: "full",
  render: () => <MapModule />,
};
