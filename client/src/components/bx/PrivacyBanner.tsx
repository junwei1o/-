import React, { useEffect, useState } from "react";
import { bxStore } from "@/game/bxStore";
import { saveAnalyticsConsent } from "@/utils/storage";

/**
 * BX 隱私橫幅：首次造訪顯示「航海前的隱私約定」，接受或略過後都會進入新手導覽。
 * 接受／暫不分享皆同步至站內匿名分析同意設定（取代舊 AnalyticsConsentPrompt）。
 * 合規：深度反思（深度伴讀）會把題目送往 AI 服務商，必須如實揭露，不得宣稱完全不上傳題目。
 */
export default function PrivacyBanner() {
  const accepted = bxStore.get<boolean>("privacy.accepted", false) ?? false;
  const [show, setShow] = useState(!accepted && bxStore.get<number | null>("privacy.ts", null) == null);
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
    <div className={`bx-privacy ${leaving ? "bx-privacy--out" : "bx-privacy--in"}`} role="dialog" aria-modal="true" aria-label="隱私說明">
      <div className="bx-privacy__icon" aria-hidden="true">⚓</div>
      <div className="bx-privacy__body">
        <h3 className="bx-privacy__title">航海前的隱私約定</h3>
        <p className="bx-privacy__text">
          寶島探險家預設只在你的瀏覽器裡記錄「每天學習幾次、答題表現如何、什麼時候使用補血藥水」，
          讓你看到自己的成長。我們<strong>不會收集你的姓名、學校、班級或聯絡方式</strong>。
          <strong>深度反思時，題目內容會送往 AI 服務商產生導讀，不會包含姓名、學校、班級。</strong>
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
            <li><strong>本機會記錄：</strong>每日活躍天數、答對/答錯次數、各科正確率、金幣與徽章、簽到日期。</li>
            <li><strong>不會收集：</strong>姓名、學校、班級、聯絡方式、IP 位址。</li>
            <li><strong>AI 深度伴讀：</strong>使用答題後的「深度反思／深度伴讀」時，題目、選項與你選的答案會送往 AI 服務商產生引導導讀，不會包含姓名、學校、班級。</li>
            <li><strong>儲存位置：</strong>預設僅存於此裝置的瀏覽器；你也可在設定選擇是否雲端備份，清除瀏覽器資料會一併刪除本機紀錄。</li>
            <li><strong>你的控制權：</strong>可隨時在「設定 → 我的航海日誌備份」匯出或清除所有資料。</li>
          </ul>
        </div>
      </div>
      <div className="bx-privacy__actions">
        <button type="button" className="bx-btn bx-btn--primary" onClick={() => decide(true)}>好的，開始航行</button>
        <button type="button" className="bx-btn bx-btn--ghost" onClick={() => decide(false)}>略過，先體驗看看</button>
      </div>
    </div>
  );
}
