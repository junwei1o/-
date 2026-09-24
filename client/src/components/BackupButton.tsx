/**
 * 一鍵備份按鈕 — 全站原始碼 ZIP 下載
 *
 * 點擊後從 /api/backup 下載完整專案原始碼 ZIP 到本機。
 * 使用瀏覽器原生 fetch + Blob 觸發下載，不需要額外依賴。
 */

import React, { useState, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BackupButtonProps {
  className?: string;
}

export default function BackupButton({ className }: BackupButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/backup");
      if (!response.ok) {
        throw new Error(`伺服器回傳 ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // 從 Content-Disposition header 取檔名，沒有就用預設
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      a.download = filenameMatch?.[1] ?? "baodao-backup.zip";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("備份下載完成！解壓後依 BACKUP_README.md 步驟即可離線架站。");
    } catch (err) {
      const message = err instanceof Error ? err.message : "備份下載失敗";
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <button
      type="button"
      className={className ?? "settings-secondary-button"}
      onClick={() => void handleDownload()}
      disabled={downloading}
      aria-label="下載全站原始碼備份 ZIP"
    >
      {downloading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        <Download size={16} aria-hidden="true" />
      )}
      {downloading ? "打包中…" : "一鍵備份全站"}
    </button>
  );
}
