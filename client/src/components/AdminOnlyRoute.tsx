import React from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * 站長專屬路由守衛（2026-10-03）。
 *
 * ## 解決什麼
 *
 * `/teacher`（督學台）與 `/learning-summary`（教師／家長摘要）原本掛在公開路由、
 * **沒有任何伺服器端驗證**——一般訪客直接輸入網址就能看到教師向界面。
 * 這批功能已從前台移入站長專屬，本元件負責把未授權的直連請求擋下來。
 *
 * ## 判斷方式
 *
 * 沿用站長後台同一套身分來源：`admin.me`（HTTP-only cookie 的 session）。
 * - `isAdmin: true` → 放行
 * - `isAdmin: false`（含未登入、查詢失敗）→ 導向 `/admin`，讓站長走既有登入流程
 *
 * ⭐ 注意：這是**前端體驗層**的守衛（未授權者看不到界面）；
 * 真正的資料防線是這些頁面背後的 tRPC 程序（班級資料需站長 cookie 才讀得到）。
 */
export default function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const me = trpc.admin.me.useQuery(undefined, { staleTime: 15_000, retry: false });

  const isAdmin = me.isSuccess && me.data.isAdmin === true;

  React.useEffect(() => {
    if (me.isSuccess && !isAdmin) {
      setLocation("/admin");
    }
  }, [me.isSuccess, isAdmin, setLocation]);

  if (!me.isSuccess) {
    // 載入中或查詢失敗：不渲染任何界面內容，避免未授權者看到殘影
    return (
      <div className="admin-only-loading" role="status" aria-busy="true" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>驗證身分中…</p>
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: "6px 0 0" }}>
          此區塊僅限站長進入，正在確認你的權限。
        </p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}
