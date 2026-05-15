"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface OnlineStatus {
  /** Whether the browser reports navigator.onLine */
  isOnline: boolean;
  /** Timestamp of the last connectivity change */
  since: string | null;
  /** True for the first few seconds after coming back online (drives "reconnected" toast) */
  justReconnected: boolean;
}

/**
 * Tracks browser online/offline state and exposes a `justReconnected` flag
 * that auto-clears after a short delay so the UI can flash a "back online"
 * confirmation without manual dismissal.
 */
export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>(() => ({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    since: null,
    justReconnected: false,
  }));

  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReconnectFlag = useCallback(() => {
    setStatus((prev) => (prev.justReconnected ? { ...prev, justReconnected: false } : prev));
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      setStatus({ isOnline: true, since: new Date().toISOString(), justReconnected: true });
      reconnectTimerRef.current = setTimeout(clearReconnectFlag, 4000);
    };

    const handleOffline = () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      setStatus({ isOnline: false, since: new Date().toISOString(), justReconnected: false });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [clearReconnectFlag]);

  return status;
}
