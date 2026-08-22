import { useEffect, useState } from "react";

function readOnlineState() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(readOnlineState);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(readOnlineState());
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}
