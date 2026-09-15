import React, { useState } from "react";
import { CloudDownload, CloudUpload, LockKeyhole } from "lucide-react";
import { loadProgressWithPin, saveProgressWithPin, type PinSyncResult } from "@/lib/pinCloudSync";

/**
 * PIN 雲端備份：4 位數 PIN 授權，把探險進度備份到雲端或在另一台裝置載回。
 * 與「雲端船籍」互補：船籍用名字，這裡用 PIN，不需要額外記名字。
 */
export function PinCloudSyncPanel() {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState<"save" | "load" | null>(null);
  const [status, setStatus] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);

  function applyResult(result: PinSyncResult, action: "save" | "load") {
    if (result.ok) {
      setStatus({ tone: "ok", text: action === "save" ? "已備份到雲端。換裝置時用同一 PIN 即可載回。" : (result.message ?? "已從雲端載回進度。") });
    } else {
      setStatus({ tone: "error", text: result.message ?? "操作失敗，請再試一次。" });
    }
  }

  async function handleSave() {
    setBusy("save");
    setStatus(null);
    applyResult(await saveProgressWithPin(pin), "save");
    setBusy(null);
  }

  async function handleLoad() {
    setBusy("load");
    setStatus(null);
    applyResult(await loadProgressWithPin(pin), "load");
    setBusy(null);
  }

  return (
    <section className="settings-audio-card" aria-labelledby="pin-cloud-title" data-testid="pin-cloud-panel">
      <div className="settings-audio-heading">
        <span className="settings-page-icon" aria-hidden="true"><LockKeyhole size={20} /></span>
        <div>
          <p className="settings-eyebrow">雲端備份</p>
          <h2 id="pin-cloud-title">PIN 雲端備份</h2>
        </div>
      </div>
      <p className="settings-log-description">
        設定一組 4 位數 PIN，就能把探險進度（金幣、圖鑑、學習紀錄）備份到雲端；換裝置時輸入同一組 PIN 就能載回。資料以 PIN 綁定，不需要帳號。
      </p>
      <div className="pin-cloud-form">
        <label htmlFor="pin-cloud-input" className="sr-only">4 位數 PIN</label>
        <input
          id="pin-cloud-input"
          type="password"
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          placeholder="輸入 4 位數 PIN"
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <div className="pin-cloud-actions">
          <button type="button" className="settings-companion-save" onClick={handleSave} disabled={busy !== null || pin.length !== 4}>
            <CloudUpload size={15} aria-hidden="true" />{busy === "save" ? "備份中…" : "儲存到雲端"}
          </button>
          <button type="button" className="settings-companion-save settings-companion-secondary" onClick={handleLoad} disabled={busy !== null || pin.length !== 4}>
            <CloudDownload size={15} aria-hidden="true" />{busy === "load" ? "載入中…" : "從雲端載入"}
          </button>
        </div>
      </div>
      {status ? <p className={`pin-cloud-status pin-cloud-status-${status.tone}`} role="status" aria-live="polite">{status.text}</p> : null}
    </section>
  );
}
