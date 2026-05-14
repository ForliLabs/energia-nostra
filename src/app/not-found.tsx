import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fffbea_0%,#f7fee7_42%,#ffffff_100%)] px-4">
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">
          Pagina non trovata
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
          404
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          La pagina che stai cercando non esiste o è stata spostata. Controlla
          l&apos;indirizzo o torna alla home per riprendere la navigazione.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl bg-lime-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-600"
          >
            Torna alla home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-amber-300 bg-white/90 px-6 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-amber-50"
          >
            Apri la dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
