/**
 * 登入閘道頁面 — 寶島探險家
 *
 * 進站時若無 session，顯示此頁面。
 * 使用者輸入名字（2–6 字）→ 登入 → 自動還原上次狀態。
 */

import React, { useState, useCallback } from "react";
import { Compass, ArrowRight } from "lucide-react";
import { login, type UserRole } from "@/game/session";
import { validateCloudName } from "@/game/cloudSync";

interface LoginPageProps {
  onLoggedIn: (name: string, role: UserRole, cloudSynced: boolean) => void;
}

export default function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim();
    const invalid = validateCloudName(trimmed);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await login(trimmed);
    setBusy(false);
    if (result.ok) {
      onLoggedIn(result.session.name, result.session.role, result.cloudSynced);
    } else {
      setError(result.message);
    }
  }, [name, onLoggedIn]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !busy) {
      void handleSubmit();
    }
  };

  return (
    <div className="login-gate" role="main" aria-label="登入">
      <div className="login-gate-card">
        <div className="login-gate-brand">
          <span className="login-gate-brand-mark" aria-hidden="true">
            <Compass size={36} strokeWidth={2.3} />
          </span>
          <h1>寶島探險家</h1>
          <p>台灣學習航海日誌</p>
        </div>

        <div className="login-gate-form">
          <label htmlFor="login-name" className="login-gate-label">
            輸入你的船長名字
          </label>
          <p className="login-gate-hint">
            2–6 個中文字或英數字。記住它，下次輸入同個名字就能接回上次進度。
          </p>
          <input
            id="login-name"
            className="login-gate-input"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            placeholder="例如：張三"
            maxLength={12}
            autoFocus
            autoComplete="off"
            aria-label="船長名字"
            aria-invalid={!!error}
            aria-describedby={error ? "login-error" : undefined}
            disabled={busy}
            onKeyDown={handleKeyDown}
          />
          {error && (
            <p id="login-error" className="login-gate-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            className="login-gate-submit"
            onClick={() => void handleSubmit()}
            disabled={busy || !name.trim()}
          >
            {busy ? "登入中…" : "登入"}
            {!busy && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </div>

        <div className="login-gate-footer">
          <p>
            登入後，系統會記住你上次造訪的頁面和學習進度。
            <br />
            換裝置時輸入同個名字，就能從雲端接回進度。
          </p>
        </div>
      </div>
    </div>
  );
}
