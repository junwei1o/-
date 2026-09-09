import React, { useEffect, useRef, useState } from "react";
import { BX_EVENTS } from "@/game/bxStore";
import { bxAlert } from "./bxRewards";

/**
 * BX 視窗層級錯誤守衛：監聽 window error / unhandledrejection。
 * 與既有 React ErrorBoundary 互補——那個捕捉渲染錯誤，這裡捕捉非渲染的全域錯誤。
 * 為避免單一良性錯誤（擴充功能等）干擾，累積 ≥2 次才顯示繁中全層提示。
 */
export default function GlobalErrorGuard() {
  const [error, setError] = useState<string | null>(null);
  const errCount = useRef(0);
  const rejectCount = useRef(0);

  useEffect(() => {
    const showError = (message: string) => {
      setError((prev) => prev ?? message);
    };
    const onError = (e: ErrorEvent) => {
      errCount.current += 1;
      if (errCount.current + rejectCount.current >= 2) {
        showError(e.message || "未知錯誤");
      }
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      rejectCount.current += 1;
      if (errCount.current + rejectCount.current >= 2) {
        const msg = e.reason instanceof Error ? e.reason.message : String(e.reason ?? "未知錯誤");
        showError(msg);
      }
    };
    const onQuota = () => {
      bxAlert("🗄️ 瀏覽器儲存空間已滿，請到「設定 → 我的航海日誌備份」匯出後清除較舊資料。");
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    document.addEventListener(BX_EVENTS.storageQuota, onQuota);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener(BX_EVENTS.storageQuota, onQuota);
    };
  }, []);

  if (!error) return null;

  const copy = () => {
    const text = `[寶島探險家 錯誤回報]\n${error}\n時間：${new Date().toISOString()}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => bxAlert("✅ 錯誤資訊已複製，歡迎回報給我們"),
        () => bxAlert("無法自動複製，請手動選取下方文字"),
      );
    } else {
      bxAlert("無法自動複製，請手動選取下方文字");
    }
  };

  return (
    <div className="bx-error" role="alertdialog" aria-label="發生錯誤">
      <div className="bx-error__box">
        <div className="bx-error__art" aria-hidden="true">🌊</div>
        <h3>這片海域出了點狀況</h3>
        <p>你的學習紀錄有自動保存，請試著重新整理頁面。若重複發生，請複製下方錯誤資訊回報。</p>
        <pre className="bx-error__log">{error}</pre>
        <div className="bx-error__actions">
          <button type="button" className="bx-btn bx-btn--primary" onClick={() => window.location.reload()}>重新整理</button>
          <button type="button" className="bx-btn bx-btn--outline" onClick={copy}>複製錯誤資訊</button>
          <button type="button" className="bx-btn bx-btn--ghost" onClick={() => setError(null)}>繼續使用</button>
        </div>
      </div>
    </div>
  );
}
