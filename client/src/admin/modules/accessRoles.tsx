import React from "react";
import type { AdminModule } from "../types";

/**
 * 模組：存取與角色（型態＝狀態清單，純靜態說明）。
 *
 * 用途：把「三種角色各自能進哪裡、用什麼憑證」集中成一份可對照的表。
 * 這是站長最常需要確認的事（「老師看不到營運資料嗎？」「學生會不會誤入後台？」），
 * 寫在後台裡比散在文件各處可靠。
 */

type RoleRow = {
  role: string;
  entry: string;
  credential: string;
  scope: string;
  canEnterAdmin: boolean;
};

const ROLES: RoleRow[] = [
  {
    role: "學生",
    entry: "全站學習頁面",
    credential: "船名（本機識別，非帳密）",
    scope: "學習內容：練習、遊戲、收藏、個人學習報告。",
    canEnterAdmin: false,
  },
  {
    role: "老師",
    entry: "督學台（/teacher）",
    credential: "教師通關語（TEACHER_PASSPHRASE）",
    scope: "班級經營與教學：建班、指派作業、看成績、發公告、LINE 通知。",
    canEnterAdmin: false,
  },
  {
    role: "站長",
    entry: "站長後台（/admin）",
    credential: "站長用戶名（ADMIN_USERNAME，預設 admin）",
    scope: "全站營運：資源監控、存取與角色、內容健康、系統環境。",
    canEnterAdmin: true,
  },
];

function AccessRolesModule() {
  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <caption className="admin-table-caption">
            三種角色的定位互相獨立：老師管「教學」，站長管「把站開起來」。
          </caption>
          <thead>
            <tr>
              <th scope="col">角色</th>
              <th scope="col">入口</th>
              <th scope="col">憑證</th>
              <th scope="col">職責範圍</th>
            </tr>
          </thead>
          <tbody>
            {ROLES.map((row) => (
              <tr key={row.role}>
                <th scope="row">{row.role}</th>
                <td>{row.entry}</td>
                <td>{row.credential}</td>
                <td>{row.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="admin-note-list">
        <li>教師用<strong>通關語</strong>、站長用<strong>用戶名</strong>：兩者性質不同，教師無法只靠猜測取得站長權限。</li>
        <li>站長層級高於老師，因此站長可直接進入督學台，不需再登入一次。</li>
        <li>⚠️ 站長後台目前是<strong>純用戶名驗證、沒有第二道因子</strong>（2026-10-02 站長知情決定）。每次登入都會寫入審計紀錄，可在「維護工具 → 維運操作審計」查看。</li>
      </ul>
    </>
  );
}

export const accessRolesModule: AdminModule = {
  id: "access-roles",
  title: "角色與存取",
  group: "access",
  summary: "三種角色的定位、入口與憑證對照。",
  order: 10,
  span: "full",
  render: () => <AccessRolesModule />,
};
