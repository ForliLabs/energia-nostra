import { getDigitalTwinDashboard } from "@/lib/energy-digital-twin";

const formatCurrency = (value: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export default async function DigitalTwinPage() {
  const data = await getDigitalTwinDashboard();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Moonshot #2</p>
        <h1 className="mt-3 text-3xl font-black text-zinc-950">Digital twin energetico territoriale</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-600">Da assessment puntuale a simulatore permanente di quartieri, edifici, storage e colli di bottiglia della rete locale.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Asset modellati", String(data.summary.modeledAssets)],
          ["Hosting capacity", `${data.summary.hostingCapacityKw} kW`],
          ["Backlog investimenti", formatCurrency(data.summary.investmentBacklogEuro)],
          ["Copertura twin", `${data.summary.twinCoveragePct}%`],
          ["Forecast accuracy", `${data.summary.forecastAccuracyPct}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-lime-100 bg-white/90 p-5">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-950">{value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8">
          <h2 className="text-xl font-bold text-zinc-950">Zone modellate</h2>
          <div className="mt-5 space-y-4">
            {data.zones.map((zone) => (
              <article key={zone.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-zinc-950">{zone.name}</h3>
                    <p className="text-sm text-zinc-500">{zone.memberCount} membri · readiness {zone.electrificationReadinessPct}%</p>
                  </div>
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">{zone.hostingCapacityKw} kW</span>
                </div>
                <dl className="mt-3 grid gap-3 text-sm text-zinc-600 md:grid-cols-3">
                  <div><dt className="font-medium text-zinc-500">Carico annuo</dt><dd>{zone.annualLoadKwh.toLocaleString("it-IT")} kWh</dd></div>
                  <div><dt className="font-medium text-zinc-500">Potenziale FV</dt><dd>{zone.solarPotentialKw} kW</dd></div>
                  <div><dt className="font-medium text-zinc-500">Hosting</dt><dd>{zone.hostingCapacityKw} kW</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8">
          <h2 className="text-xl font-bold text-zinc-950">Scenari di pianificazione</h2>
          <div className="mt-5 space-y-4">
            {data.scenarios.map((scenario) => (
              <div key={scenario.id} className="rounded-2xl bg-white/80 p-4">
                <p className="font-semibold text-zinc-950">{scenario.name}</p>
                <p className="mt-1 text-sm text-zinc-500">{scenario.horizon}</p>
                <p className="mt-3 text-sm text-zinc-600">{scenario.unlock}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium text-lime-800">
                  <span>+{scenario.deltaSharedEnergyPct}% shared energy</span>
                  <span>{formatCurrency(scenario.capexEuro)}</span>
                  <span>VaR {formatCurrency(scenario.valueAtRiskEuro)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-lime-100 bg-white/90 p-8">
        <h2 className="text-xl font-bold text-zinc-950">Segnali architetturali</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-lime-100 bg-lime-50/60 p-4">
            <h3 className="font-semibold text-zinc-950">Bottleneck da risolvere</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              {data.bottlenecks.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
            <h3 className="font-semibold text-zinc-950">Perché conta</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              {data.architectureSignals.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
