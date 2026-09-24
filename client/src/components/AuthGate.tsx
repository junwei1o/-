/**
 * AuthGate — 登入閘道 + 狀態記憶還原
 *
 * 包在 App 最外層：
 * 1. 無 session → 顯示 LoginPage
 * 2. 有 session → 渲染子元件（主應用），並在路由切換時持續更新 lastPath
 * 3. 登入成功後自動還原上次造訪的頁面（lastPath）
 * 4. 登出後回到 LoginPage
 *
 * 設計要點：
 * - 不使用 React Context，避免重渲染整棵樹。用 state + wouter 的 setLocation 即可。
 * - lastPath 還原只做一次（登入當下），之後靠 useLocation 追蹤。
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import LoginPage from "@/pages/LoginPage";
import "@/pages/LoginPage.css";
import {
  isLoggedIn,
  getSession,
  login as doLogin,
  logout as doLogout,
  updateLastPath,
  getLastPath,
  type UserRole,
} from "@/game/session";

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [location, setLocation] = useLocation();
  const [authed, setAuthed] = useState(() => isLoggedIn());
  const [restoringPath, setRestoringPath] = useState<string | null>(null);
  const hasRestored = useRef(false);

  // 登入成功回調
  const handleLoggedIn = useCallback(
    (name: string, role: UserRole, cloudSynced: boolean) => {
      setAuthed(true);
      // 登入後還原上次路徑
      const lastPath = getLastPath();
      if (lastPath && lastPath !== "/") {
        setRestoringPath(lastPath);
      } else {
        setRestoringPath("/");
      }
      // 如果有雲端同步，需要 reload 讓各 store 重讀 localStorage
      if (cloudSynced) {
        window.setTimeout(() => window.location.reload(), 300);
      }
    },
    []
  );

  // 登入後一次性還原路徑
  useEffect(() => {
    if (authed && !hasRestored.current) {
      hasRestored.current = true;
      if (restoringPath) {
        setLocation(restoringPath);
        setRestoringPath(null);
      }
    }
  }, [authed, restoringPath, setLocation]);

  // 路由切換時持續記錄 lastPath
  useEffect(() => {
    if (authed && location && location !== "/login") {
      updateLastPath(location);
    }
  }, [authed, location]);

  // 登出
  const handleLogout = useCallback(() => {
    doLogout();
    setAuthed(false);
    hasRestored.current = false;
    setLocation("/");
  }, [setLocation]);

  if (!authed) {
    return <LoginPage onLoggedIn={handleLoggedIn} />;
  }

  return <>{children}</>;
}

/**
 * 登出按鈕：可放在設定頁或導覽列。
 * 預設不渲染任何東西，只暴露一個輕量元件供設定頁使用。
 */
export function LogoutButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const handleClick = () => {
    doLogout();
    setLocation("/");
    window.location.reload();
  };
  return (
    <button type="button" className={className} onClick={handleClick}>
      {children ?? "登出"}
    </button>
  );
}
