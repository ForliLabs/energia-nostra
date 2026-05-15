"use client";

import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";

/**
 * Ambient banner that appears when the browser goes offline and briefly
 * confirms reconnection. Designed to sit at the top of the dashboard shell
 * without pushing layout — it uses a fixed-position approach.
 *
 * Hidden entirely when the user is online and no recent reconnection occurred.
 */
export function ConnectionStatusBanner() {
  const { isOnline, justReconnected } = useOnlineStatus();

  // Nothing to show — user is online and no recent reconnect
  if (isOnline && !justReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium transition-colors duration-300",
        isOnline
          ? "bg-lime-100 text-lime-900"
          : "bg-amber-200 text-amber-950",
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" aria-hidden="true" />
          <span>Connessione ripristinata — i dati verranno aggiornati automaticamente.</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span>Sei offline. Puoi consultare i dati già caricati, ma le modifiche saranno sospese fino al ripristino della rete.</span>
        </>
      )}
    </div>
  );
}
