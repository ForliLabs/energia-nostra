import type { Metadata } from "next";
import { DashboardChartsSection } from "@/components/charts/dashboard-charts-section";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getEnergyData, getEnergySummary, getMembers, optimizationSuggestions } from "@/lib/data-db";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Bilancio energetico",
  description: "Produzione, consumo e quota condivisa della comunità energetica con trend e suggerimenti di ottimizzazione.",
};

export const dynamic = "force-dynamic";

export default async function EnergyPage() {
  const [energyData, energySummary, members] = await Promise.all([
    getEnergyData(),
    getEnergySummary(),
    getMembers(),
  ]);

  if (energyData.length === 0) {
    return (
      <EmptyState
        title="Nessun bilancio energetico disponibile"
        description="Importa almeno un periodo di misura per generare il bilancio della comunità energetica e i suggerimenti di ottimizzazione."
      />
    );
  }

  const latestMonth = energyData[energyData.length - 1];
  const bestSharedMonth = energyData.reduce((best, current) =>
    current.sharedEnergyKwh > best.sharedEnergyKwh ? current : best,
  );
  const averageSharedEnergy = Math.round(energySummary.sharedEnergyKwh / Math.max(energyData.length, 1));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Contabilizzazione energia"
        title="Bilancio energetico mensile della CER"
        description="Produzione, consumo e quota condivisa per gli ultimi periodi, con dettaglio per singolo membro, trend visuali e suggerimenti di ottimizzazione."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Produzione totale</p>
          <p className="mt-2 text-3xl font-bold text-zinc-950">{energySummary.productionKwh.toLocaleString("it-IT")} kWh</p>
        </div>
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Consumo totale</p>
          <p className="mt-2 text-3xl font-bold text-zinc-950">{energySummary.consumptionKwh.toLocaleString("it-IT")} kWh</p>
        </div>
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Energia condivisa</p>
          <p className="mt-2 text-3xl font-bold text-zinc-950">{energySummary.sharedEnergyKwh.toLocaleString("it-IT")} kWh</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-lime-100 bg-white/90 p-6 shadow-sm shadow-lime-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lime-700">Trend più recente</p>
          <h2 className="mt-3 text-xl font-bold text-zinc-950">{latestMonth.label}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {latestMonth.sharedEnergyKwh.toLocaleString("it-IT")} kWh condivisi con autoconsumo al {latestMonth.selfConsumptionPct}% e un beneficio di {formatCurrency(latestMonth.savingsEuro)}.
          </p>
        </article>
        <article className="rounded-3xl border border-lime-100 bg-white/90 p-6 shadow-sm shadow-lime-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lime-700">Picco di condivisione</p>
          <h2 className="mt-3 text-xl font-bold text-zinc-950">{bestSharedMonth.label}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            È stato il mese con la miglior resa collettiva: {bestSharedMonth.sharedEnergyKwh.toLocaleString("it-IT")} kWh condivisi e {formatCurrency(bestSharedMonth.gseIncentiveEuro)} di incentivo GSE.
          </p>
        </article>
        <article className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-6 shadow-lg shadow-amber-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">Indicazione operativa</p>
          <h2 className="mt-3 text-xl font-bold text-zinc-950">Media condivisa {averageSharedEnergy.toLocaleString("it-IT")} kWh / mese</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Usa i grafici per identificare i mesi sotto media e coordinare pompe di calore, EV e accumuli nella fascia 10:00–15:00.
          </p>
        </article>
      </div>

      <DashboardChartsSection energyData={energyData} latestMonth={latestMonth} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Bilancio mensile</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-lime-100 text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="pb-3 pr-4 font-semibold">Mese</th>
                  <th className="pb-3 pr-4 font-semibold">Produzione</th>
                  <th className="pb-3 pr-4 font-semibold">Consumo</th>
                  <th className="pb-3 pr-4 font-semibold">Energia condivisa</th>
                  <th className="pb-3 pr-4 font-semibold">Autoconsumo</th>
                  <th className="pb-3 font-semibold">Risparmio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lime-50">
                {energyData.map((month) => (
                  <tr key={month.id}>
                    <td className="py-4 pr-4 font-semibold text-zinc-950">{month.label}</td>
                    <td className="py-4 pr-4 text-zinc-600">{month.productionKwh.toLocaleString("it-IT")} kWh</td>
                    <td className="py-4 pr-4 text-zinc-600">{month.consumptionKwh.toLocaleString("it-IT")} kWh</td>
                    <td className="py-4 pr-4 font-semibold text-lime-700">{month.sharedEnergyKwh.toLocaleString("it-IT")} kWh</td>
                    <td className="py-4 pr-4 text-zinc-600">{month.selfConsumptionPct}%</td>
                    <td className="py-4 font-semibold text-zinc-950">{formatCurrency(month.savingsEuro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
            <h2 className="text-2xl font-bold text-zinc-950">Suggerimenti ottimizzazione</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-zinc-600">
              {optimizationSuggestions.map((suggestion) => (
                <li key={suggestion} className="rounded-2xl bg-amber-50/70 px-4 py-3">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
            <h2 className="text-2xl font-bold text-zinc-950">Lettura rapida del periodo</h2>
            <dl className="mt-5 space-y-4 text-sm text-zinc-600">
              <div className="flex items-start justify-between gap-4 rounded-2xl bg-lime-50/70 px-4 py-3">
                <dt className="font-semibold text-zinc-700">Risparmio complessivo</dt>
                <dd className="font-bold text-zinc-950">{formatCurrency(energySummary.savingsEuro)}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 rounded-2xl bg-amber-50/70 px-4 py-3">
                <dt className="font-semibold text-zinc-700">Membri analizzati</dt>
                <dd className="font-bold text-zinc-950">{members.length}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-lime-100">
                <dt className="font-semibold text-zinc-700">Mese con miglior resa</dt>
                <dd className="font-bold text-zinc-950">{bestSharedMonth.label}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
        <h2 className="text-2xl font-bold text-zinc-950">Dettaglio per membro</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-lime-100 text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="pb-3 pr-4 font-semibold">Membro</th>
                <th className="pb-3 pr-4 font-semibold">Tipo</th>
                <th className="pb-3 pr-4 font-semibold">Saldo</th>
                <th className="pb-3 pr-4 font-semibold">Quota stimata energia condivisa</th>
                <th className="pb-3 font-semibold">Indicazione operativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lime-50">
              {members.map((member) => {
                const quota = Math.round(
                  (energySummary.sharedEnergyKwh / Math.max(members.length, 1)) *
                    (member.type === "produttore" ? 1.28 : member.type === "prosumer" ? 1.08 : 0.82),
                );
                return (
                  <tr key={member.id}>
                    <td className="py-4 pr-4 font-semibold text-zinc-950">{member.name}</td>
                    <td className="py-4 pr-4 capitalize text-zinc-600">{member.type}</td>
                    <td className={`py-4 pr-4 font-semibold ${member.energyBalanceKwh >= 0 ? "text-lime-700" : "text-amber-700"}`}>
                      {member.energyBalanceKwh.toLocaleString("it-IT")} kWh
                    </td>
                    <td className="py-4 pr-4 text-zinc-600">{quota.toLocaleString("it-IT")} kWh</td>
                    <td className="py-4 text-zinc-600">
                      {member.type === "consumatore"
                        ? "Spostare carichi programmabili nella fascia 10:00–15:00."
                        : "Mantenere continuità di produzione e condivisione con il gruppo."}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
