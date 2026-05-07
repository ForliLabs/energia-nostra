"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="it">
      <body className="flex min-h-screen items-center justify-center bg-amber-50 px-4">
        <div className="max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl shadow-red-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">Errore applicazione</p>
          <h1 className="mt-3 text-3xl font-black text-zinc-950">Qualcosa è andato storto</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-600">
            Non siamo riusciti a completare la richiesta. Puoi riprovare senza perdere il contesto della sessione.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-lime-700"
          >
            Riprova
          </button>
        </div>
      </body>
    </html>
  );
}
