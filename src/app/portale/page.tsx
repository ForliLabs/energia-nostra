import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { OnboardingStepper } from "@/components/ui/onboarding-stepper";
import {
  getAnnouncements,
  getCerProfile,
  getDocuments,
  getEnergyData,
  getEnergySummary,
  getIncentiveDistribution,
  getMembers,
  getVotes,
  optimizationSuggestions,
} from "@/lib/data-db";
import { getCurrentSession, type CurrentSessionUser } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Portale membro",
  description: "Area personale del membro della CER con energia, incentivi e comunicazioni.",
};

export const dynamic = "force-dynamic";

function resolveMemberForUser(user: CurrentSessionUser | null, members: Awaited<ReturnType<typeof getMembers>>) {
  if (!user) return null;

  const tokens = user.name
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  return members.find((member) => {
    const normalizedMember = member.name.toLowerCase();
    return tokens.some((token) => normalizedMember.includes(token));
  }) ?? null;
}

export default async function MemberPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getCurrentSession();
  const params = await searchParams;
  const isWelcome = params.welcome === "1";

  if (!session) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#fffbea_0%,#f7fee7_42%,#ffffff_100%)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <EmptyState
            title="Accedi per aprire il portale membro"
            description="Qui troverai lo stato del tuo onboarding, i documenti da firmare, il riepilogo energetico personale e le prossime votazioni della CER."
            action={
              <div className="flex flex-wrap gap-3">
                <Link href="/login" className="rounded-2xl bg-lime-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lime-700">
                  Accedi
                </Link>
                <Link href="/registrazione" className="rounded-2xl border border-lime-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-lime-50">
                  Crea account
                </Link>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const [cerProfile, members, energyData, energySummary, incentives, announcements, governanceDocs, governanceVotes] = await Promise.all([
    getCerProfile(session.user.cerId || undefined),
    getMembers(session.user.cerId || undefined),
    getEnergyData(session.user.cerId || undefined),
    getEnergySummary(session.user.cerId || undefined),
    getIncentiveDistribution(session.user.cerId || undefined),
    getAnnouncements(session.user.cerId || undefined),
    getDocuments(session.user.cerId || undefined),
    getVotes(session.user.cerId || undefined),
  ]);

  const docsToSign = governanceDocs.filter((d) => d.status === "da firmare");
  const openVotes = governanceVotes.filter((v) => v.status === "aperta");

  const member = resolveMemberForUser(session.user, members);
  const latestEnergyMonth = energyData[energyData.length - 1];
  const incentive = member ? incentives.find((item) => item.memberId === member.id) : null;

  if (!member) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#fffbea_0%,#f7fee7_42%,#ffffff_100%)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Onboarding membro</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Ciao {session.user.name}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">
              Il tuo account è attivo ma non è ancora associato a un profilo membro della CER. Prima di mostrarti bolletta condivisa, documenti e votazioni dobbiamo completare l&apos;abbinamento amministrativo.
            </p>
          </section>

          {isWelcome ? (
            <div role="status" className="rounded-3xl border border-lime-300 bg-lime-50 p-6 shadow-sm">
              <p className="text-sm font-semibold text-lime-800">
                🎉 Benvenuto in EnergiaNostra! Il tuo account è stato creato con successo.
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Segui i passaggi qui sotto per completare il tuo profilo e accedere a tutti i servizi della comunità energetica.
              </p>
            </div>
          ) : null}

          <OnboardingStepper
            steps={[
              {
                title: "Crea l'account",
                description: "Il tuo account è attivo e registrato nel sistema.",
                status: "completed",
              },
              {
                title: "Verifica dati anagrafici",
                description: "Controlla che nome completo ed email coincidano con la domanda di adesione o con il registro soci.",
                status: "current",
              },
              {
                title: "Completa i documenti",
                description: "Carica il contratto di adesione e firma i moduli richiesti nell'area documenti.",
                status: "upcoming",
              },
              {
                title: "Attendi conferma CER",
                description: "Quando il board associa il tuo profilo, il portale mostrerà automaticamente consumi, incentivi e fatture.",
                status: "upcoming",
              },
            ]}
          />

          <EmptyState
            title="Profilo membro non ancora associato"
            description="Abbiamo registrato l'account ma non possiamo mostrarti dati di un altro socio. Contatta l'amministratore CER per completare l'abbinamento del tuo profilo."
            action={
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/members" className="rounded-2xl bg-lime-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lime-700">
                  Apri anagrafica membri
                </Link>
                <Link href="/dashboard/documents" className="rounded-2xl border border-lime-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-lime-50">
                  Vai ai documenti
                </Link>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffbea_0%,#f7fee7_42%,#ffffff_100%)]">
      <header className="border-b border-lime-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link href="/dashboard" className="text-lg font-black text-lime-950">EnergiaNostra</Link>
            <p className="text-sm text-zinc-500">Portale membro</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-zinc-700">{session.user.name}</span>
            <Link href="/dashboard" className="text-sm font-semibold text-lime-700 hover:underline">
              Dashboard CER →
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Il tuo riepilogo</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Benvenuto, {member.name}</h1>
          <p className="mt-3 text-base text-zinc-600">
            Membro della CER &quot;{cerProfile.name}&quot; · {member.municipality} · {member.type}
          </p>
        </section>

        {isWelcome ? (
          <div role="status" className="rounded-3xl border border-lime-300 bg-lime-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-lime-800">
              🎉 Benvenuto in EnergiaNostra! Il tuo account è stato creato e associato correttamente.
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Esplora il tuo riepilogo energetico, controlla i documenti da firmare e partecipa alle prossime votazioni della comunità.
            </p>
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-3xl border border-lime-100 bg-lime-50 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-950">Account attivo</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">Accesso completato: puoi consultare fatture, energia condivisa e documenti personali.</p>
          </article>
          <article className="rounded-3xl border border-lime-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-950">Profilo associato</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{`Il tuo account è abbinato a ${member.podCode} e viene usato per calcolare incentivi e statement.`}</p>
          </article>
          <article className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-950">Prossimo passo</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">Controlla documenti da firmare e votazioni aperte per chiudere l&apos;onboarding operativo.</p>
          </article>
        </section>

        {/* Pending-actions inbox */}
        {docsToSign.length > 0 || openVotes.length > 0 ? (
          <section aria-label="Aggiornamenti CER" className="rounded-3xl border border-amber-200 bg-amber-50/80 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-950">Aggiornamenti della comunità</h2>
            <p className="mt-1 text-sm text-zinc-600">Novità dalla tua comunità energetica che potrebbero richiedere la tua attenzione.</p>
            <ul className="mt-5 space-y-3">
              {docsToSign.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href="/dashboard/documents"
                    className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-white px-5 py-4 text-sm transition hover:border-lime-300 hover:bg-lime-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Documento CER</span>
                      <span className="font-semibold text-zinc-950">{doc.title}</span>
                      <span className="text-xs text-zinc-500">{doc.owner}</span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-lime-700">Vai ai documenti →</span>
                  </Link>
                </li>
              ))}
              {openVotes.map((vote) => (
                <li key={vote.id}>
                  <Link
                    href="/dashboard/voting"
                    className="flex items-center justify-between gap-4 rounded-2xl border border-lime-200 bg-white px-5 py-4 text-sm transition hover:border-lime-400 hover:bg-lime-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-semibold text-lime-800">Votazione aperta</span>
                      <span className="font-semibold text-zinc-950">{vote.title}</span>
                      <span className="text-xs text-zinc-500">Quorum: {vote.quorum}</span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-lime-700">Vai alle votazioni →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section aria-label="Nessuna azione in attesa" className="rounded-3xl border border-lime-200 bg-lime-50 p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-100 text-2xl" role="img" aria-hidden="true">✅</span>
              <div>
                <h2 className="text-xl font-bold text-lime-900">Tutto in ordine</h2>
                <p className="mt-1 text-sm text-zinc-600">Nessun aggiornamento dalla CER al momento: nessun documento in attesa di firma né votazioni aperte.</p>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Saldo energetico</p>
            <p className={`mt-2 text-3xl font-bold ${member.energyBalanceKwh >= 0 ? "text-lime-700" : "text-amber-700"}`}>
              {member.energyBalanceKwh.toLocaleString("it-IT")} kWh
            </p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Beneficio mensile</p>
            <p className="mt-2 text-3xl font-bold text-lime-700">{formatCurrency(member.monthlyBenefitEuro)}</p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Incentivo GSE mese</p>
            <p className="mt-2 text-3xl font-bold text-zinc-950">{incentive ? formatCurrency(incentive.monthlyEuro) : "—"}</p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Incentivo cumulato</p>
            <p className="mt-2 text-3xl font-bold text-zinc-950">{incentive ? formatCurrency(incentive.yearToDateEuro) : "—"}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
            <h2 className="text-2xl font-bold text-zinc-950">Il tuo andamento nella CER</h2>
            <p className="mt-2 text-sm text-zinc-600">Confronto con la media della comunità energetica.</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-amber-50/70 p-4">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-zinc-700">La tua quota %</span>
                  <span className="font-bold text-lime-700">{incentive ? `${incentive.sharePct.toFixed(2)}%` : "—"}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-200">
                  <div className="h-full rounded-full bg-lime-500" style={{ width: `${Math.min((incentive?.sharePct ?? 0) * 2.5, 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">Media CER: {(100 / Math.max(members.length, 1)).toFixed(2)}%</p>
              </div>

              {latestEnergyMonth ? (
                <>
                  <div className="rounded-2xl bg-lime-50/70 p-4">
                    <p className="text-sm font-semibold text-zinc-700">Energia condivisa CER (ultimo mese)</p>
                    <p className="mt-1 text-2xl font-bold text-zinc-950">{latestEnergyMonth.sharedEnergyKwh.toLocaleString("it-IT")} kWh</p>
                    <p className="mt-1 text-xs text-zinc-500">Autoconsumo condiviso: {latestEnergyMonth.selfConsumptionPct}%</p>
                  </div>

                  <div className="rounded-2xl bg-amber-50/70 p-4">
                    <p className="text-sm font-semibold text-zinc-700">Risparmio CER complessivo</p>
                    <p className="mt-1 text-2xl font-bold text-zinc-950">{formatCurrency(energySummary.savingsEuro)}</p>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Nessun dato energia disponibile"
                  description="La comunità non ha ancora registrato un periodo energetico completo."
                />
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
              <h2 className="text-2xl font-bold text-zinc-950">Statement personale</h2>
              <div className="mt-4 rounded-2xl bg-lime-50 p-5">
                <p className="text-sm leading-6 text-zinc-700">
                  {member.energyBalanceKwh >= 0
                    ? `Metti a disposizione ${member.energyBalanceKwh} kWh netti e maturi un beneficio stimato di ${formatCurrency(member.monthlyBenefitEuro)} al mese.`
                    : `Assorbi ${Math.abs(member.energyBalanceKwh)} kWh condivisi e riduci la bolletta di circa ${formatCurrency(member.monthlyBenefitEuro)} al mese.`}
                </p>
              </div>
              <p className="mt-3 text-xs text-zinc-500">POD: {member.podCode} · Iscritto dal {member.joinedAt}</p>
            </div>

            <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
              <h2 className="text-2xl font-bold text-zinc-950">Suggerimenti per te</h2>
              <ul className="mt-4 space-y-3">
                {optimizationSuggestions.map((suggestion) => (
                  <li key={suggestion} className="rounded-2xl bg-amber-50/70 px-4 py-3 text-sm text-zinc-600">
                    💡 {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Storico energia condivisa</h2>
          <div className="mt-6 overflow-x-auto">
            {energyData.length === 0 ? (
              <EmptyState
                title="Storico non ancora disponibile"
                description="Le letture condivise appariranno qui dopo il primo ciclo di raccolta dati."
              />
            ) : (
              <table className="min-w-full divide-y divide-lime-100 text-sm">
                <caption className="sr-only">Storico dei dati energetici condivisi della comunità</caption>
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th scope="col" className="pb-3 pr-4 font-semibold">Mese</th>
                    <th scope="col" className="pb-3 pr-4 font-semibold">Produzione CER</th>
                    <th scope="col" className="pb-3 pr-4 font-semibold">Consumo CER</th>
                    <th scope="col" className="pb-3 pr-4 font-semibold">Energia condivisa</th>
                    <th scope="col" className="pb-3 font-semibold">Risparmio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lime-50">
                  {energyData.map((energyMonth) => (
                    <tr key={energyMonth.id}>
                      <td className="py-3 pr-4 font-semibold text-zinc-950">{energyMonth.label}</td>
                      <td className="py-3 pr-4 text-zinc-600">{energyMonth.productionKwh.toLocaleString("it-IT")} kWh</td>
                      <td className="py-3 pr-4 text-zinc-600">{energyMonth.consumptionKwh.toLocaleString("it-IT")} kWh</td>
                      <td className="py-3 pr-4 font-semibold text-lime-700">{energyMonth.sharedEnergyKwh.toLocaleString("it-IT")} kWh</td>
                      <td className="py-3 font-semibold text-zinc-950">{formatCurrency(energyMonth.savingsEuro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Annunci dalla CER</h2>
          <div className="mt-4 space-y-4">
            {announcements.length === 0 ? (
              <EmptyState
                title="Nessun annuncio disponibile"
                description="Gli aggiornamenti della comunità appariranno qui non appena pubblicati dal board CER."
              />
            ) : (
              announcements.map((announcement) => (
                <article key={announcement.id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-zinc-950">{announcement.title}</h3>
                    <span className="text-xs font-semibold text-lime-700">{announcement.publishedAt}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">{announcement.message}</p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8 shadow-lg shadow-amber-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Azioni rapide</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Link href="/dashboard/voting" className="group relative rounded-2xl border border-lime-200 bg-white p-4 text-center transition hover:bg-lime-50 hover:shadow-md">
              {openVotes.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {openVotes.length}
                </span>
              )}
              <span className="text-2xl" role="img" aria-hidden="true">🗳️</span>
              <span className="mt-1 block text-sm font-semibold text-zinc-700 group-hover:text-lime-800">Votazioni</span>
              <span className="mt-1 block text-xs text-zinc-500">Partecipa alle decisioni</span>
            </Link>
            <Link href="/dashboard/energy" className="group rounded-2xl border border-lime-200 bg-white p-4 text-center transition hover:bg-lime-50 hover:shadow-md">
              <span className="text-2xl" role="img" aria-hidden="true">⚡</span>
              <span className="mt-1 block text-sm font-semibold text-zinc-700 group-hover:text-lime-800">Energia</span>
              <span className="mt-1 block text-xs text-zinc-500">Monitora i consumi</span>
            </Link>
            <Link href="/dashboard/billing" className="group rounded-2xl border border-lime-200 bg-white p-4 text-center transition hover:bg-lime-50 hover:shadow-md">
              <span className="text-2xl" role="img" aria-hidden="true">💰</span>
              <span className="mt-1 block text-sm font-semibold text-zinc-700 group-hover:text-lime-800">Fatturazione</span>
              <span className="mt-1 block text-xs text-zinc-500">Consulta le fatture</span>
            </Link>
            <Link href="/dashboard/documents" className="group relative rounded-2xl border border-lime-200 bg-white p-4 text-center transition hover:bg-lime-50 hover:shadow-md">
              {docsToSign.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {docsToSign.length}
                </span>
              )}
              <span className="text-2xl" role="img" aria-hidden="true">📋</span>
              <span className="mt-1 block text-sm font-semibold text-zinc-700 group-hover:text-lime-800">Documenti</span>
              <span className="mt-1 block text-xs text-zinc-500">Firma e scarica</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
