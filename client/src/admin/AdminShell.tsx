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
 * ⚠️ 前端**不持有**站長用戶名（2026-10-18 修正）。
 *
 * 這裡原本有 `const ADMIN_USERNAME = "admin"`，並拿去當輸入框的 placeholder。那是**兩個錯誤**：
 *   1. **洩漏**：placeholder 會渲染給每一位訪客看——等於把站長用戶名印在牆上。
 *   2. **矛盾**：伺服器端已移除 `?? "admin"` 預設值（server/_core/env.ts 的 fail-fast），
 *      改由部署環境的 `ADMIN_USERNAME` 決定。前端寫死的值既過期，又會誤導站長
 *      「打 admin 就能進去」——實際上伺服器已經不接受它了。
 *
 * 正確架構（與 capabilities.tsx／CornerEntry.tsx 的說明一致）：
 *   **前端不知道站長用戶名**。登入時把使用者輸入原樣送 `admin.login`，
 *   由伺服器以 timingSafeEqual 比對 `ENV.adminUsername`。
 *   站長改 `ADMIN_USERNAME` 只需改部署環境，**不必重新部署前端**。
 */

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
                placeholder="輸入站長用戶名"
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
