import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getAnnouncements, getDocuments, getVotes } from "@/lib/data-db";

export const metadata: Metadata = {
  title: "Governance",
  description: "Documenti, annunci e votazioni della comunità energetica rinnovabile.",
};

export const dynamic = "force-dynamic";

const documentLabels: Record<string, string> = {
  statuto: "Statuto",
  regolamento: "Regolamento",
  verbale: "Verbale",
  report: "Report",
};

const statusLabels: Record<string, string> = {
  approvato: "Approvato",
  "in revisione": "In revisione",
  "da firmare": "Da firmare",
};

export default async function GovernancePage() {
  const [announcements, governanceDocuments, governanceVotes] = await Promise.all([
    getAnnouncements(),
    getDocuments(),
    getVotes(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Governance CER"
        title="Documenti, decisioni e comunicazione con i membri"
        description="Una cabina di regia digitale per statuto, regolamenti, assemblee e aggiornamenti verso tutti i soci della comunità energetica."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Documenti disponibili</h2>
          <div className="mt-6 space-y-4">
            {governanceDocuments.length === 0 ? (
              <EmptyState
                title="Nessun documento disponibile"
                description="Carica statuto, regolamenti e verbali per costruire l'archivio di governance condiviso."
              />
            ) : (
              governanceDocuments.map((document) => (
                <article key={document.id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-700">
                        {documentLabels[document.category] || document.category}
                      </p>
                      <h3 className="mt-2 font-semibold text-zinc-950">{document.title}</h3>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                      {statusLabels[document.status] || document.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600">
                    Responsabile: {document.owner} · Ultimo aggiornamento: {document.updatedAt}
                  </p>
                  {document.status === "da firmare" && (
                    <div className="mt-3">
                      <Link
                        href="/dashboard/documents"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      >
                        ✍️ Firma ora →
                      </Link>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Voti e decisioni in arrivo</h2>
          <div className="mt-6 space-y-4">
            {governanceVotes.length === 0 ? (
              <EmptyState
                title="Nessuna votazione programmata"
                description="Quando l'assemblea pubblicherà un ordine del giorno, qui troverai tutte le votazioni da preparare."
              />
            ) : (
              governanceVotes.map((vote) => (
                <article key={vote.id} className="rounded-2xl border border-lime-100 bg-lime-50/70 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-zinc-950">{vote.title}</h3>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 capitalize">
                      {vote.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">{vote.scheduledAt}</p>
                  <p className="mt-1 text-sm text-zinc-500">Quorum richiesto: {vote.quorum}</p>
                  {vote.status === "aperta" && (
                    <div className="mt-3">
                      <Link
                        href="/dashboard/voting"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-lime-300 bg-white px-3 py-2 text-xs font-semibold text-lime-800 transition hover:bg-lime-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
                      >
                        🗳️ Vota ora →
                      </Link>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Bacheca annunci</h2>
          <div className="mt-6 space-y-4">
            {announcements.length === 0 ? (
              <EmptyState
                title="Nessun annuncio pubblicato"
                description="Pubblica il primo aggiornamento per dare ai membri una timeline condivisa di assemblee, scadenze e novità della CER."
              />
            ) : (
              announcements.map((announcement) => (
                <article key={announcement.id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-zinc-950">{announcement.title}</h3>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-700">
                      {announcement.publishedAt}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">{announcement.message}</p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8 shadow-lg shadow-amber-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Comunicazione membri</h2>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-zinc-700">
            <li>• Newsletter settimanale con andamento energia condivisa e prossime azioni consigliate.</li>
            <li>• Canale dedicato per richieste amministrative con risposta entro 48 ore lavorative.</li>
            <li>• Invio automatico di convocazioni, documenti da firmare e promemoria votazioni.</li>
            <li>• Archivio digitale di verbali, statuto e regolamenti sempre accessibile ai soci.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
