import React, { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AdminShell } from "@/admin/AdminShell";
import { registerBuiltinAdminModules } from "@/admin/modules";
import "./AdminConsole.css";

// 註冊內建模組（模組化設計的掛載點；新增模組只需改 admin/modules/index.ts）。
registerBuiltinAdminModules();

/**
 * 站長後台（/admin）。
 *
 * 角色定位：本站有三種互相獨立的頁面——
 *   學生（學習內容）／老師（督學台，班級與教學）／站長（後台，全站營運）。
 * 這一頁是站長的營運控制台，內容由模組註冊表驅動，預期會持續擴充。
 */
export default function AdminConsole() {
  const me = trpc.admin.me.useQuery(undefined, { staleTime: 15_000, retry: false });
  const logout = trpc.admin.logout.useMutation();

  useEffect(() => {
    document.title = "站長後台｜寶島探險家";
  }, []);

  return (
    <main className="admin-page" aria-labelledby="admin-title">
      <div className="admin-page-inner">
        <header className="admin-header">
          <p className="admin-eyebrow">SITE OPERATIONS · 站長專屬</p>
          <h1 id="admin-title">營運燈塔</h1>
          <p className="admin-lede">
            集中管理全站營運事務。與「督學台」（老師：班級與教學）刻意分開——
            這裡看的是站點本身的運作：資源、額度、存取與系統環境。
          </p>
        </header>

        {me.isPending ? (
          <p className="admin-muted" aria-busy="true">正在確認身分…</p>
        ) : me.isError || !me.data ? (
          <p className="admin-error" role="alert">
            無法確認身分，請稍後重新整理頁面。
          </p>
        ) : (
          <AdminShell
            isAdmin={me.data.isAdmin}
            onLogout={() =>
              logout.mutate(undefined, {
                onSettled: () => window.location.reload(),
              })
            }
          />
        )}
      </div>
    </main>
  );
}
