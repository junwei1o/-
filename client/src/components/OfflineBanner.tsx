import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  if (!isOffline) return null;

  return (
    <div className="offline-banner" role="status" aria-live="assertive" aria-atomic="true">
      <WifiOff size={17} aria-hidden="true" />
      <div>
        <strong>目前處於離線狀態</strong>
        <span>學習紀錄會先保存在本機；戰鬥已暫停，恢復連線後即可繼續。</span>
      </div>
    </div>
  );
}
