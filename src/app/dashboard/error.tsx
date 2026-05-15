"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FetchError } from "@/components/ui/fetch-error";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <FetchError
        title="Questa sezione non è disponibile"
        description="Un errore ha interrotto il caricamento. Il problema potrebbe essere temporaneo: riprova fra qualche secondo. Se persiste, torna alla panoramica della dashboard."
        errorDetail={error.digest ? `Codice errore: ${error.digest}` : undefined}
        onRetry={reset}
        actions={
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-lime-700 transition hover:text-lime-900 hover:underline"
          >
            ← Torna alla panoramica
          </Link>
        }
      />
    </div>
  );
}
