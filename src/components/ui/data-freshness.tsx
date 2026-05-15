"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataFreshnessProps {
  /** ISO timestamp of the last successful data load */
  lastUpdated: string | null;
  /** Called when user clicks the refresh icon */
  onRefresh?: () => void;
  /** Whether a refresh is currently in progress */
  refreshing?: boolean;
  /** Seconds after which data is considered stale (default: 300 = 5 min) */
  staleAfterSeconds?: number;
}

/**
 * A subtle inline indicator showing when data was last fetched.
 *
 * For community energy platforms, data trust is paramount—members and operators
 * need to know that kWh, €, and incentive figures are current.
 *
 * Shows a green dot when fresh, amber when stale (older than `staleAfterSeconds`).
 */
export function DataFreshness({
  lastUpdated,
  onRefresh,
  refreshing = false,
  staleAfterSeconds = 300,
}: DataFreshnessProps) {
  const [isStale, setIsStale] = useState(() => {
    if (!lastUpdated) return false;
    const ageMs = Date.now() - new Date(lastUpdated).getTime();
    return ageMs > staleAfterSeconds * 1000;
  });

  // Re-evaluate staleness when lastUpdated changes and every 30s thereafter
  useEffect(() => {
    if (!lastUpdated) return;

    const check = () => {
      const ageMs = Date.now() - new Date(lastUpdated).getTime();
      setIsStale(ageMs > staleAfterSeconds * 1000);
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [lastUpdated, staleAfterSeconds]);

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      })
    : null;

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          isStale ? "bg-amber-400" : "bg-lime-400",
        )}
        aria-hidden="true"
      />
      {formattedTime ? (
        <span className={cn(isStale && "text-amber-600")}>
          {isStale ? "Dati non recenti — " : "Aggiornato alle "}
          {formattedTime}
        </span>
      ) : (
        <span>Dati in caricamento…</span>
      )}
      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(
            "rounded-lg p-1 transition hover:bg-zinc-100 disabled:opacity-50",
            isStale && "text-amber-600 hover:bg-amber-50",
          )}
          aria-label="Aggiorna dati"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      ) : null}
    </div>
  );
}

