import React, { useEffect, useState } from "react";
import { bxStore } from "@/game/bxStore";
import { saveAnalyticsConsent } from "@/utils/storage";

/**
 * BX 隱私橫幅：首次造訪顯示「航海前的隱私約定」，接受後進入新手導覽。
 * 接受／暫不分享皆同步至站內匿名分析同意設定（取代舊 AnalyticsConsentPrompt）。
 */
export default function PrivacyBanner() {
  const accepted = bxStore.get<boolean>("privacy.accepted", false) ?? false;
  const [show, setShow] = useState(!accepted);
  const [leaving, setLeaving] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (show) {
      const raf = requestAnimationFrame(() => setLeaving(false));
      return () => cancelAnimationFrame(raf);
    }
  }, [show]);

  if (!show) return null;

  const decide = (accept: boolean) => {
    bxStore.update((s) => {
      s.privacy.accepted = accept;
      s.privacy.dismissed_temp = !accept;
      s.privacy.ts = Date.now();
    });
    try {
      saveAnalyticsConsent(accept ? "accepted" : "declined");
    } catch {
      // 同意同步失敗不阻擋主要流程。
    }
    setLeaving(true);
    window.setTimeout(() => setShow(false), 320);
  };

  return (
    <div className={`bx-privacy ${leaving ? "bx-privacy--out" : "bx-privacy--in"}`} role="dialog" aria-label="隱私說明">
      <div className="bx-privacy__icon" aria-hidden="true">⚓</div>
      <div className="bx-privacy__body">
        <h3 className="bx-privacy__title">航海前的隱私約定</h3>
        <p className="bx-privacy__text">
          寶島探險家只在你的瀏覽器裡記錄「每天學習幾次、答題表現如何、什麼時候使用補血藥水」，
          讓你看到自己的成長。<strong>我們不會上傳或記錄你的姓名、學校、班級，也不會記錄任何題目與答案內容。</strong>
          所有資料只存在於你正在使用的這台裝置。
        </p>
        <button
          type="button"
          className="bx-link"
          aria-expanded={detailOpen}
          aria-controls="bxPrivacyDetail"
          onClick={() => setDetailOpen((v) => !v)}
        >
          了解資料如何運作 →
        </button>
        <div className="bx-privacy__detail" id="bxPrivacyDetail" hidden={!detailOpen}>
          <ul>
            <li><strong>會記錄：</strong>每日活躍天數、答對/答錯次數、各科正確率、金幣與徽章、簽到日期。</li>
            <li><strong>不會記錄：</strong>姓名、學校、班級、聯絡方式、題目內容、答案內容、IP 位址。</li>
            <li><strong>儲存位置：</strong>僅此裝置的瀏覽器 localStorage。清除瀏覽器資料會一併刪除。</li>
            <li><strong>你的控制權：</strong>可隨時在「設定 → 我的航海日誌備份」匯出或清除所有資料。</li>
          </ul>
        </div>
      </div>
      <div className="bx-privacy__actions">
        <button type="button" className="bx-btn bx-btn--primary" onClick={() => decide(true)}>好的，開始航行</button>
        <button type="button" className="bx-btn bx-btn--ghost" onClick={() => decide(false)}>暫不分享，繼續體驗</button>
      </div>
    </div>
  );
}
