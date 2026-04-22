import { announcements, governanceDocuments, governanceVotes } from "@/lib/data";

const documentLabels = {
  statuto: "Statuto",
  regolamento: "Regolamento",
  verbale: "Verbale",
  report: "Report",
} as const;

const statusLabels = {
  approvato: "Approvato",
  "in revisione": "In revisione",
  "da firmare": "Da firmare",
} as const;

export default function GovernancePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Governance CER</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
          Documenti, decisioni e comunicazione con i membri
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          Una cabina di regia digitale per statuto, regolamenti, assemblee e aggiornamenti verso tutti i soci della comunità energetica.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Documenti disponibili</h2>
          <div className="mt-6 space-y-4">
            {governanceDocuments.map((document) => (
              <article key={document.id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-700">
                      {documentLabels[document.category]}
                    </p>
                    <h3 className="mt-2 font-semibold text-zinc-950">{document.title}</h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    {statusLabels[document.status]}
                  </span>
                </div>
                <p className="mt-3 text-sm text-zinc-600">
                  Responsabile: {document.owner} · Ultimo aggiornamento: {document.updatedAt}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Voti e decisioni in arrivo</h2>
          <div className="mt-6 space-y-4">
            {governanceVotes.map((vote) => (
              <article key={vote.id} className="rounded-2xl border border-lime-100 bg-lime-50/70 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-zinc-950">{vote.title}</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 capitalize">
                    {vote.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">{vote.scheduledAt}</p>
                <p className="mt-1 text-sm text-zinc-500">Quorum richiesto: {vote.quorum}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Bacheca annunci</h2>
          <div className="mt-6 space-y-4">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-zinc-950">{announcement.title}</h3>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-700">
                    {announcement.publishedAt}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{announcement.message}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8 shadow-lg shadow-amber-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Comunicazione membri</h2>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-zinc-700">
            <li>• Newsletter settimanale con andamento energia condivisa e prossime azioni consigliate.</li>
            <li>• Canale dedicato per richieste amministrative con risposta entro 48 ore lavorative.</li>
            <li>• Invio automatico di convocazioni, documenti da firmare e promemoria votazioni.</li>
            <li>• Archivio digitale verbali assemblee, statuto e regolamenti sempre accessibile ai soci.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
