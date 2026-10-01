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
  /** 伺服器端是否已設定站長通關語；false 時後台不可能登入。 */
  passphraseConfigured: boolean;
  onLogout: () => void;
};

export function AdminShell({ isAdmin, passphraseConfigured, onLogout }: AdminShellProps) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = trpc.admin.login.useMutation();

  if (!isAdmin) {
    return (
      <div className="admin-gate">
        <span className="admin-gate-icon" aria-hidden="true">
          <Lock size={26} />
        </span>

        {!passphraseConfigured ? (
          <>
            <p className="admin-gate-copy">
              <strong>站長後台尚未啟用。</strong>
              伺服器端還沒有設定站長通關語，因此任何人都無法登入——
              這是刻意的安全側降級，其他角色（老師／學生）完全不受影響。
            </p>
            <p className="admin-gate-hint">
              請在部署環境的環境變數加上 <code>ADMIN_PASSPHRASE</code> 後重新部署，即可啟用本站長後台。
            </p>
          </>
        ) : (
          <>
            <p className="admin-gate-copy">
              <strong>這裡是站長專屬後台。</strong>
              內容包含全站營運、資源用量與系統環境資訊，需要站長通關語才能進入。
            </p>
            <form
              className="admin-gate-form"
              onSubmit={(event) => {
                event.preventDefault();
                setError(null);
                login.mutate(
                  { passphrase },
                  {
                    onSuccess: (result) => {
                      if (result.ok) {
                        setPassphrase("");
                        // 重新載入以讓伺服器端會話生效（context 由 cookie 決定身分）
                        window.location.reload();
                        return;
                      }
                      setError(
                        result.reason === "notConfigured"
                          ? "伺服器端尚未設定站長通關語（ADMIN_PASSPHRASE）。"
                          : "通關語不正確，請再試一次。",
                      );
                    },
                    onError: () => setError("登入時發生錯誤，請稍後再試。"),
                  },
                );
              }}
            >
              <label className="admin-gate-label" htmlFor="admin-passphrase">
                站長通關語
              </label>
              <input
                id="admin-passphrase"
                className="admin-gate-input"
                type="password"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                autoComplete="current-password"
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
          </>
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
