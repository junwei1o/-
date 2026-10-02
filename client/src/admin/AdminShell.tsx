import React, { useState } from "react";
import { Lock, LogOut, Unlock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { groupAdminModules } from "./registry";
import type { AdminModule } from "./types";

/**
 * 站長後台外殼（2026-10-01）。
 *
 * 職責刻意收斂成三件：**身分閘**、**版面**、**依註冊表渲染模組**。
 * 它不認識任何具體模組——所有內容都來自註冊表（`registry.ts`），
 * 因此後台要長多大都不需要動這個檔案。
 */

/** 單一模組的外框（標題／摘要／內容）。 */
function AdminModuleCard({ module }: { module: AdminModule }) {
  return (
    <section
      className={`admin-card ${module.span === "full" ? "is-full" : ""}`}
      aria-labelledby={`admin-module-${module.id}`}
    >
      <header className="admin-card-head">
        <h3 id={`admin-module-${module.id}`}>{module.title}</h3>
        {module.summary && <p className="admin-card-summary">{module.summary}</p>}
      </header>
      <div className="admin-card-body">{module.render()}</div>
    </section>
  );
}

type AdminShellProps = {
  /** 目前是否為站長身分。 */
  isAdmin: boolean;
  onLogout: () => void;
};

/**
 * 站長用戶名。
 *
 * ⚠️ 與 `server/_core/env.ts` 的 `ENV.adminUsername` **必須同步**。
 * 兩處不一致時，首頁入口會怎麼打都進不去。
 * 站長可以在部署環境設 `ADMIN_USERNAME` 換一個更難猜的值。
 */
const ADMIN_USERNAME = "admin";

export function AdminShell({ isAdmin, onLogout }: AdminShellProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = trpc.admin.login.useMutation();

  if (!isAdmin) {
    return (
      <div className="admin-gate">
        <span className="admin-gate-icon" aria-hidden="true">
          <Lock size={26} />
        </span>

        <p className="admin-gate-copy">
          <strong>這裡是站長專屬後台。</strong>
          內容包含全站營運、學習實況、資源用量與系統環境資訊。
        </p>
            <form
              className="admin-gate-form"
              onSubmit={(event) => {
                event.preventDefault();
                setError(null);
                login.mutate(
                  { username: username.trim() },
                  {
                    onSuccess: (result) => {
                      if (result.ok) {
                        setUsername("");
                        // 重新載入以讓伺服器端會話生效（context 由 cookie 決定身分）
                        window.location.reload();
                        return;
                      }
                      setUsername("");
                      setError("站長用戶名不正確，請再試一次。");
                    },
                    onError: () => setError("登入時發生錯誤，請稍後再試。"),
                  },
                );
              }}
            >
              <label className="admin-gate-label" htmlFor="admin-username">
                站長用戶名
              </label>
              <input
                id="admin-username"
                className="admin-gate-input"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={ADMIN_USERNAME}
                required
              />
              <button type="submit" className="admin-primary-button" disabled={login.isPending}>
                <Unlock size={16} aria-hidden="true" /> {login.isPending ? "驗證中…" : "進入後台"}
              </button>
            </form>
            {error && (
              <p className="admin-gate-error" role="alert">
                {error}
              </p>
            )}
      </div>
    );
  }

  const groups = groupAdminModules();

  return (
    <>
      <div className="admin-toolbar">
        <p className="admin-toolbar-note">
          目前以<strong>站長</strong>身分檢視。模組依註冊表自動排列，新增模組不需改動版面。
        </p>
        <button type="button" className="admin-secondary-button" onClick={onLogout}>
          <LogOut size={15} aria-hidden="true" /> 登出
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="admin-muted">目前沒有已註冊的模組。</p>
      ) : (
        groups.map(({ group, modules }) => (
          <section className="admin-group" key={group.id} aria-labelledby={`admin-group-${group.id}`}>
            <div className="admin-group-head">
              <h2 id={`admin-group-${group.id}`}>{group.label}</h2>
              {group.description && <p>{group.description}</p>}
            </div>
            <div className="admin-grid">
              {modules.map((module) => (
                <AdminModuleCard module={module} key={module.id} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
