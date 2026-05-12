import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getAnnouncements,
  getCerProfile,
  getEnergyData,
  getEnergySummary,
  getIncentiveDistribution,
  getMembers,
  optimizationSuggestions,
} from "@/lib/data-db";
import { getCurrentSession, type CurrentSessionUser } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";

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

export default async function MemberPortalPage() {
  const session = await getCurrentSession();

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

  const [cerProfile, members, energyData, energySummary, incentives, announcements] = await Promise.all([
    getCerProfile(session.user.cerId || undefined),
    getMembers(session.user.cerId || undefined),
    getEnergyData(session.user.cerId || undefined),
    getEnergySummary(session.user.cerId || undefined),
    getIncentiveDistribution(session.user.cerId || undefined),
    getAnnouncements(session.user.cerId || undefined),
  ]);

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

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              ["1. Verifica dati anagrafici", "Controlla che nome completo ed email coincidano con la domanda di adesione o con il registro soci."],
              ["2. Completa i documenti", "Carica eventuale contratto di adesione e firma i moduli richiesti nell'area documenti."],
              ["3. Attendi conferma CER", "Quando il board associa il tuo profilo, il portale mostrerà automaticamente consumi, incentivi e fatture."],
            ].map(([title, description]) => (
              <article key={title} className="rounded-3xl border border-lime-100 bg-white/90 p-6 shadow-sm shadow-lime-100/40">
                <h2 className="text-lg font-bold text-zinc-950">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
              </article>
            ))}
          </div>

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

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "Account attivo", description: "Accesso completato: puoi consultare fatture, energia condivisa e documenti personali.", tone: "bg-lime-50 border-lime-100" },
            { title: "Profilo associato", description: `Il tuo account è abbinato a ${member.podCode} e viene usato per calcolare incentivi e statement.`, tone: "bg-white border-lime-100" },
            { title: "Prossimo passo", description: "Controlla documenti da firmare e votazioni aperte per chiudere l'onboarding operativo.", tone: "bg-amber-50/80 border-amber-200" },
          ].map((card) => (
            <article key={card.title} className={`rounded-3xl border p-6 shadow-sm ${card.tone}`}>
              <h2 className="text-lg font-bold text-zinc-950">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{card.description}</p>
            </article>
          ))}
        </section>

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
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">Mese</th>
                    <th className="pb-3 pr-4 font-semibold">Produzione CER</th>
                    <th className="pb-3 pr-4 font-semibold">Consumo CER</th>
                    <th className="pb-3 pr-4 font-semibold">Energia condivisa</th>
                    <th className="pb-3 font-semibold">Risparmio</th>
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
            <Link href="/dashboard/voting" className="rounded-2xl border border-lime-200 bg-white p-4 text-center text-sm font-semibold text-zinc-700 transition hover:bg-lime-50">🗳️ Votazioni</Link>
            <Link href="/dashboard/energy" className="rounded-2xl border border-lime-200 bg-white p-4 text-center text-sm font-semibold text-zinc-700 transition hover:bg-lime-50">⚡ Energia</Link>
            <Link href="/dashboard/billing" className="rounded-2xl border border-lime-200 bg-white p-4 text-center text-sm font-semibold text-zinc-700 transition hover:bg-lime-50">💰 Fatturazione</Link>
            <Link href="/dashboard/documents" className="rounded-2xl border border-lime-200 bg-white p-4 text-center text-sm font-semibold text-zinc-700 transition hover:bg-lime-50">📋 Documenti</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
