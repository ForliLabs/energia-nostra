"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseResilientFetchOptions<T> {
  /** The URL to fetch */
  url: string;
  /** Transform the raw JSON into the shape the component expects */
  transform?: (data: unknown) => T;
  /** Maximum number of automatic retries on failure (default: 3) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelayMs?: number;
  /** Whether to fetch immediately on mount (default: true) */
  immediate?: boolean;
}

interface UseResilientFetchResult<T> {
  /** The fetched and transformed data */
  data: T | null;
  /** Whether the initial load is in progress (no data yet) */
  loading: boolean;
  /** Whether a background refresh is in progress (data already present) */
  refreshing: boolean;
  /** Human-readable error message, or null */
  error: string | null;
  /** ISO timestamp of the last successful fetch */
  lastUpdated: string | null;
  /** How many automatic retries have been attempted for the current failure */
  retryCount: number;
  /** Whether the browser reports offline status */
  isOffline: boolean;
  /** Manually trigger a (re)fetch — resets retry counter */
  refetch: () => void;
}

/**
 * A resilient data-fetching hook with:
 * - Automatic retry with exponential backoff on transient failures
 * - Offline detection (skips fetch when offline, retries on reconnect)
 * - Stale-data preservation (keeps last good data while retrying)
 * - Clean loading / refreshing / error states
 *
 * Designed for EnergiaNostra dashboard pages where kWh, € and governance
 * data must feel trustworthy even on flaky connections.
 */
export function useResilientFetch<T = unknown>(
  options: UseResilientFetchOptions<T>,
): UseResilientFetchResult<T> {
  const { url, transform, maxRetries = 3, baseDelayMs = 1000, immediate = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const hasDataRef = useRef(false);
  const doFetchRef = useRef<((attempt: number, isManual: boolean) => Promise<void>) | undefined>(undefined);

  // Track online/offline for this hook
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const doFetch = useCallback(
    async (attempt: number, isManual: boolean) => {
      if (!mountedRef.current) return;

      // Don't attempt network requests while offline
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsOffline(true);
        setError("Sei offline. I dati verranno aggiornati al ripristino della rete.");
        return;
      }

      // Show "loading" only when we have no data yet; otherwise "refreshing"
      if (!hasDataRef.current && attempt === 0) {
        setLoading(true);
      } else if (hasDataRef.current) {
        setRefreshing(true);
      }

      if (attempt === 0) {
        setError(null);
      }

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Errore ${response.status}`);
        }
        const json: unknown = await response.json();
        if (!mountedRef.current) return;

        const transformed = transform ? transform(json) : (json as T);
        setData(transformed);
        hasDataRef.current = true;
        setLastUpdated(new Date().toISOString());
        setError(null);
        setRetryCount(0);
      } catch (caughtError) {
        if (!mountedRef.current) return;
        if ((caughtError as Error).name === "AbortError") return;

        const message =
          (caughtError as Error).message || "Impossibile caricare i dati.";

        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          setRetryCount(attempt + 1);
          setError(`${message} — nuovo tentativo tra ${Math.round(delay / 1000)}s…`);
          retryTimerRef.current = setTimeout(() => {
            void doFetchRef.current?.(attempt + 1, false);
          }, delay);
        } else {
          setRetryCount(attempt);
          setError(
            isManual
              ? message
              : `${message} — tentativi esauriti. Premi "Riprova" per ricaricare.`,
          );
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [url, maxRetries, baseDelayMs, transform],
  );

  useEffect(() => {
    doFetchRef.current = doFetch;
  }, [doFetch]);

  const refetch = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    setRetryCount(0);
    void doFetch(0, true);
  }, [doFetch]);

  // Auto-fetch on mount
  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      void doFetchRef.current?.(0, false);
    }
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Auto-retry when coming back online — use a ref to avoid cascading setState
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const errorRef = useRef(error);
  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  useEffect(() => {
    if (!isOffline && errorRef.current) {
      // Schedule via microtask to avoid synchronous setState cascade
      queueMicrotask(() => refetchRef.current());
    }
  }, [isOffline]);

  return {
    data,
    loading,
    refreshing,
    error,
    lastUpdated,
    retryCount,
    isOffline,
    refetch,
  };
}
