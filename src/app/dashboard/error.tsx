"use client";

import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-3xl border border-red-200 bg-white/90 p-8 shadow-lg shadow-red-100/40">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">Errore dashboard</p>
      <h1 className="mt-3 text-3xl font-black text-zinc-950">La dashboard non è disponibile</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600">
        Un errore ha interrotto il caricamento del contenuto. Controlla la connessione o riprova tra qualche secondo.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-lime-700"
      >
        Ricarica contenuto
      </button>
    </div>
  );
}
