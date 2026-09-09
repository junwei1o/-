import React, { useEffect, useState } from "react";
import { bxStore } from "@/game/bxStore";
import {
  applyCloudSave,
  chooseLocalMode,
  getCloudMode,
  hasChosenMode,
  loadCloud,
  pushSaveNow,
  registerCloud,
  validateCloudName,
  type CloudSaveSummary,
} from "@/game/cloudSync";
import { bxToast } from "./bx/bxRewards";
import { useBxVersion } from "./bx/useBx";

/**
 * 進站儲存方式卡：隱私同意後問一次「📱 存在這台裝置 / ☁️ 雲端船籍」。
 * 雲端船籍以名字（2–6 字）為身分；回航時顯示「認船」確認避免誤登別人的船。
 */

type Step = "choose" | "name" | "confirm";

function formatTime(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days <= 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 30) return `${days} 天前`;
  return "很久以前";
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  onLinked?: () => void;
}

export function CloudModeDialog({ open, onClose, onLinked }: DialogProps) {
  const [step, setStep] = useState<Step>("choose");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<CloudSaveSummary | null>(null);

  useEffect(() => {
    if (open) {
      setStep("choose");
      setName("");
      setError(null);
      setFound(null);
    }
  }, [open]);

  if (!open) return null;

  const pickLocal = () => {
    chooseLocalMode();
    bxToast("📱 進度會保存在這台裝置上");
    onClose();
  };

  const submitName = async () => {
    const invalid = validateCloudName(name);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError(null);
    const loaded = await loadCloud(name);
    if (loaded.ok) {
      setFound(loaded.save);
      setStep("confirm");
      setBusy(false);
      return;
    }
    if (loaded.reason === "notFound") {
      // 沒人用過這個名字 → 直接開新船籍，本機進度帶上雲。
      const registered = await registerCloud(name);
      setBusy(false);
      if (registered.ok) {
        bxToast(`☁️ 新船籍「${name.trim()}」建立！進度已上傳雲端`);
        onLinked?.();
        onClose();
      } else if (registered.reason === "taken") {
        setError("這個名字剛被搶先登記了，換一個試試");
      } else {
        setError(registered.message ?? "雲端連線不穩，請稍後再試");
      }
      return;
    }
    setBusy(false);
    setError(loaded.message ?? "雲端連線不穩，請稍後再試");
  };

  const confirmShip = async () => {
    if (!found) return;
    setBusy(true);
    const winner = await applyCloudSave(found);
    setBusy(false);
    if (winner === "remote") {
      bxToast("⚓ 進度已接回，重新整理船艙…");
      window.setTimeout(() => window.location.reload(), 600);
      return;
    }
    bxToast("⚓ 這台裝置的進度較新，已更新到雲端船籍");
    onLinked?.();
    onClose();
  };

  return (
    <div className="cloud-overlay" role="dialog" aria-modal="true" aria-label="選擇航行方式">
      <div className="cloud-card">
        {step === "choose" && (
          <>
            <h2 className="cloud-title">選擇你的航行方式</h2>
            <p className="cloud-desc">進度要怎麼保存？之後可以在「設定」隨時更換。</p>
            <div className="cloud-choices">
              <button type="button" className="cloud-choice" onClick={pickLocal}>
                <span className="cloud-choice-icon" aria-hidden="true">📱</span>
                <strong>存在這台裝置</strong>
                <small>進度留在這台手機／電腦，最簡單</small>
              </button>
              <button type="button" className="cloud-choice" onClick={() => setStep("name")}>
                <span className="cloud-choice-icon" aria-hidden="true">☁️</span>
                <strong>雲端船籍</strong>
                <small>輸入名字開船，換裝置也能接著玩</small>
              </button>
            </div>
          </>
        )}
        {step === "name" && (
          <>
            <h2 className="cloud-title">輸入你的船長名字</h2>
            <p className="cloud-desc">2–6 個中文字或英數字，例如「張三」。記住它，換裝置時輸入同個名字就能接回進度。</p>
            <input
              className="cloud-input"
              value={name}
              onChange={(event) => { setName(event.target.value); setError(null); }}
              placeholder="例如：張三"
              maxLength={12}
              autoFocus
              aria-label="船長名字"
              onKeyDown={(event) => { if (event.key === "Enter" && !busy) void submitName(); }}
            />
            {error && <p className="cloud-error" role="alert">{error}</p>}
            <div className="cloud-actions">
              <button type="button" className="cloud-btn-secondary" onClick={() => { setStep("choose"); setError(null); }}>返回</button>
              <button type="button" className="cloud-btn-primary" onClick={() => void submitName()} disabled={busy}>
                {busy ? "航行中…" : "開船 / 回航"}
              </button>
            </div>
          </>
        )}
        {step === "confirm" && found && (
          <>
            <h2 className="cloud-title">找到一艘船！</h2>
            <p className="cloud-desc">
              「{found.name}」號：金幣 {found.coins}・作答 {found.totalAnswers} 題・徽章 {found.badges} 枚・上次航行 {formatTime(found.updatedAt)}。<strong>是您的船嗎？</strong>
            </p>
            <div className="cloud-actions">
              <button type="button" className="cloud-btn-secondary" onClick={() => { setStep("name"); setFound(null); }}>不是我的船</button>
              <button type="button" className="cloud-btn-primary" onClick={() => void confirmShip()} disabled={busy}>
                {busy ? "接船中…" : "是我的船，接回進度"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** 進站自動彈出一次（隱私同意後）；選過就不再打擾。 */
export default function CloudModePrompt() {
  useBxVersion();
  const accepted = bxStore.get<boolean>("privacy.accepted", false) ?? false;
  const [dismissed, setDismissed] = useState(false);
  const show = accepted && !dismissed && !hasChosenMode();
  return <CloudModeDialog open={show} onClose={() => setDismissed(true)} />;
}

/** 設定頁的雲端船籍區塊：顯示目前模式、可升級／切換／手動同步。 */
export function CloudSyncSettings() {
  const [, force] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const mode = getCloudMode();

  const refresh = () => force((n) => n + 1);

  const syncNow = async () => {
    setSyncing(true);
    const ok = await pushSaveNow();
    setSyncing(false);
    bxToast(ok ? "☁️ 進度已同步到雲端" : "同步失敗，請稍後再試");
    refresh();
  };

  return (
    <section className="settings-audio-card settings-cloud-card" aria-labelledby="cloud-sync-title">
      <h2 id="cloud-sync-title">☁️ 雲端船籍</h2>
      {mode.mode === "cloud" && mode.name ? (
        <>
          <p>船籍「<strong>{mode.name}</strong>」航行中：答題後會自動把進度送上雲端，每份試卷也都會記一筆航行紀錄。</p>
          <div className="cloud-actions cloud-actions-left">
            <button type="button" className="cloud-btn-primary" onClick={() => void syncNow()} disabled={syncing}>
              {syncing ? "同步中…" : "立即同步"}
            </button>
            <button
              type="button"
              className="cloud-btn-secondary"
              onClick={() => { chooseLocalMode(); bxToast("📱 已切回本機保存（本機進度保留）"); refresh(); }}
            >
              切回本機保存
            </button>
          </div>
        </>
      ) : (
        <>
          <p>目前進度只保存在這台裝置。開啟雲端船籍後，輸入名字就能在其他裝置接回進度。</p>
          <div className="cloud-actions cloud-actions-left">
            <button type="button" className="cloud-btn-primary" onClick={() => setDialogOpen(true)}>開啟雲端船籍</button>
          </div>
        </>
      )}
      <CloudModeDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onLinked={refresh} />
    </section>
  );
}
