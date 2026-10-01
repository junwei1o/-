import React from "react";
import type { AdminModule } from "../types";

/**
 * 模組：系統與環境（型態＝key-value 資訊列）。
 *
 * 為什麼放這些：站長在排查問題時最常問的三件事是「線上跑的是哪一版」
 * 「使用者用什麼環境」「後端回應正常嗎」。這些都能在前端以極低成本取得
 * （不需額外請求、不需讀取大型資料），很適合常駐顯示。
 */

/** 從目前載入的 JS 檔名取出建置指紋（Vite 會把內容雜湊寫進檔名）。 */
function readBuildFingerprint(): string {
  try {
    const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>("script[src]"));
    const main = scripts.map((node) => node.getAttribute("src") ?? "").find((src) => /assets\/index-[^/]+\.js$/.test(src));
    const match = main?.match(/index-([A-Za-z0-9_-]+)\.js$/);
    return match ? match[1] : "（無法判斷）";
  } catch {
    return "（無法判斷）";
  }
}

function describeConnection(): string {
  try {
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } }).connection;
    if (!connection) return "瀏覽器未提供";
    const parts: string[] = [];
    if (connection.effectiveType) parts.push(connection.effectiveType);
    if (typeof connection.downlink === "number") parts.push(`${connection.downlink} Mbps`);
    return parts.length ? parts.join("／") : "瀏覽器未提供";
  } catch {
    return "瀏覽器未提供";
  }
}

function SystemInfoModule() {
  const rows: { label: string; value: string; note?: string }[] = [
    {
      label: "前端建置指紋",
      value: readBuildFingerprint(),
      note: "取自載入中的主 bundle 檔名（Vite 內容雜湊）。重新部署後會改變。",
    },
    { label: "連線型態", value: describeConnection() },
    { label: "顯示環境", value: `${window.innerWidth}×${window.innerHeight}`, note: "目前視窗尺寸，非裝置實體解析度。" },
    { label: "語言設定", value: navigator.language || "（未知）" },
    { label: "時區", value: Intl.DateTimeFormat().resolvedOptions().timeZone || "（未知）" },
    { label: "線上狀態", value: navigator.onLine ? "連線中" : "離線", note: "瀏覽器回報值，非實際連通性測試。" },
  ];

  return (
    <dl className="admin-kv">
      {rows.map((row) => (
        <div className="admin-kv-row" key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
          {row.note && <small>{row.note}</small>}
        </div>
      ))}
    </dl>
  );
}

export const systemInfoModule: AdminModule = {
  id: "system-info",
  title: "環境資訊",
  group: "system",
  summary: "建置版本、連線與瀏覽器環境——排查問題時的第一手資訊。",
  order: 10,
  span: "half",
  render: () => <SystemInfoModule />,
};
