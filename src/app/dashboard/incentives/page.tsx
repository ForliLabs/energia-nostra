import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  getEnergyData,
  getEnergySummary,
  getIncentiveDistribution,
  getPnrrGrant,
  gseReportingStatus,
} from "@/lib/data-db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function IncentivesPage() {
  const [distribution, energySummary, energyData, pnrrGrant] = await Promise.all([
    getIncentiveDistribution(),
    getEnergySummary(),
    getEnergyData(),
    getPnrrGrant(),
  ]);

  const latestEnergyMonth = energyData[energyData.length - 1];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Incentivi GSE"
        title="Monitoraggio incentivi e contributi PNRR"
        description="Controlla tariffa incentivante, maturato mensile, riparto per membro e stato delle pratiche da inviare al GSE."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Tariffa corrente</p>
          <p className="mt-2 text-3xl font-bold text-zinc-950">€{gseReportingStatus.currentRateEuroPerMwh}/MWh</p>
        </div>
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Incentivo mese</p>
          <p className="mt-2 text-3xl font-bold text-zinc-950">{latestEnergyMonth ? formatCurrency(latestEnergyMonth.gseIncentiveEuro) : "—"}</p>
        </div>
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Incentivo cumulato</p>
          <p className="mt-2 text-3xl font-bold text-zinc-950">{formatCurrency(energySummary.gseIncentiveEuro)}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-950">Distribuzione per membro</h2>
              <p className="mt-2 text-sm text-zinc-600">Quote economiche calcolate sul peso energetico e sul ruolo nella CER.</p>
            </div>
            <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">
              {distribution.length} quote
            </span>
          </div>
          <div className="mt-6 overflow-x-auto">
            {distribution.length === 0 ? (
              <EmptyState
                title="Nessun riparto disponibile"
                description="Genera il primo riparto incentivi dopo aver validato un periodo di energia condivisa."
              />
            ) : (
              <table className="min-w-full divide-y divide-lime-100 text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">Membro</th>
                    <th className="pb-3 pr-4 font-semibold">Quota %</th>
                    <th className="pb-3 pr-4 font-semibold">Mese corrente</th>
                    <th className="pb-3 font-semibold">Cumulato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lime-50">
                  {distribution.map((item) => (
                    <tr key={item.memberId}>
                      <td className="py-4 pr-4 font-semibold text-zinc-950">{item.name}</td>
                      <td className="py-4 pr-4 text-zinc-600">{item.sharePct.toFixed(2)}%</td>
                      <td className="py-4 pr-4 font-semibold text-lime-700">{formatCurrency(item.monthlyEuro)}</td>
                      <td className="py-4 font-semibold text-zinc-950">{formatCurrency(item.yearToDateEuro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
            <h2 className="text-2xl font-bold text-zinc-950">Stato reporting GSE</h2>
            <dl className="mt-5 space-y-4 text-sm text-zinc-600">
              <div>
                <dt className="font-semibold text-zinc-700">Stato pratica</dt>
                <dd className="mt-1">{gseReportingStatus.statusLabel}</dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-700">Ultimo invio</dt>
                <dd className="mt-1">{gseReportingStatus.lastSubmission}</dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-700">Prossima scadenza</dt>
                <dd className="mt-1">{gseReportingStatus.nextDeadline}</dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-700">Completezza</dt>
                <dd className="mt-1">{gseReportingStatus.completeness}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8 shadow-lg shadow-amber-100/40">
            <h2 className="text-2xl font-bold text-zinc-950">Tracker contributo PNRR</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-700">
              Il finanziamento sostiene impianto fotovoltaico condiviso, monitoraggio e sistemi di accumulo per i membri della CER.
            </p>
            <div className="mt-6 space-y-3">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-zinc-700">
                  <span>Stato avanzamento</span>
                  <span>{pnrrGrant.progressPct}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/70">
                  <div className="h-full rounded-full bg-lime-500" style={{ width: `${pnrrGrant.progressPct}%` }} />
                </div>
              </div>
              <p className="text-sm text-zinc-700">Budget ammissibile: {formatCurrency(pnrrGrant.eligibleBudgetEuro)}</p>
              <p className="text-sm text-zinc-700">Contributo approvato: {formatCurrency(pnrrGrant.approvedEuro)}</p>
              <p className="text-sm text-zinc-700">Già erogato: {formatCurrency(pnrrGrant.disbursedEuro)}</p>
              <p className="text-sm font-semibold text-zinc-800">Prossima milestone: {pnrrGrant.nextMilestone}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
