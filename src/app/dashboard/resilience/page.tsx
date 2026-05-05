import { getResilienceDashboard } from "@/lib/resilience-mesh";

const formatCurrency = (value: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export default async function ResiliencePage() {
  const data = await getResilienceDashboard();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Moonshot #3</p>
        <h1 className="mt-3 text-3xl font-black text-zinc-950">Resilience mesh e islanding civico</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-600">La CER come infrastruttura di continuità per servizi critici, hub climatici e protezione civile locale.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Cittadini protetti", data.summary.protectedCitizens.toLocaleString("it-IT")],
          ["Autonomia mesh", `${data.summary.autonomyHours} h`],
          ["Resilience score", `${data.summary.resilienceScore}%`],
          ["Coverage carichi critici", `${data.summary.criticalLoadCoveragePct}%`],
          ["Losses evitati/anno", formatCurrency(data.summary.annualAvoidedLossEuro)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-lime-100 bg-white/90 p-5">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-950">{value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8">
          <h2 className="text-xl font-bold text-zinc-950">Siti critici protetti</h2>
          <div className="mt-5 space-y-4">
            {data.criticalSites.map((site) => (
              <article key={site.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-zinc-950">{site.name}</h3>
                    <p className="text-sm text-zinc-500">{site.category} · {site.status}</p>
                  </div>
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">{site.autonomyHours} h</span>
                </div>
                <dl className="mt-3 grid gap-3 text-sm text-zinc-600 md:grid-cols-3">
                  <div><dt className="font-medium text-zinc-500">Carico critico</dt><dd>{site.criticalLoadKw} kW</dd></div>
                  <div><dt className="font-medium text-zinc-500">Shelter</dt><dd>{site.shelterCapacity} posti</dd></div>
                  <div><dt className="font-medium text-zinc-500">Stato</dt><dd>{site.status}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8">
            <h2 className="text-xl font-bold text-zinc-950">Cluster di islanding</h2>
            <div className="mt-5 space-y-4">
              {data.islandClusters.map((cluster) => (
                <div key={cluster.id} className="rounded-2xl bg-white/80 p-4">
                  <p className="font-semibold text-zinc-950">{cluster.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">Priorità {cluster.priority}</p>
                  <p className="mt-3 text-sm text-zinc-600">{cluster.membersCovered} membri coperti · {cluster.dispatchableKw} kW dispatchabili</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-lime-100 bg-white/90 p-8">
            <h2 className="text-xl font-bold text-zinc-950">Modalità operative</h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              {data.operatingModes.map((mode) => <li key={mode}>• {mode}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-lime-100 bg-white/90 p-8">
        <h2 className="text-xl font-bold text-zinc-950">Black-start plan</h2>
        <ol className="mt-5 space-y-3 text-sm leading-6 text-zinc-600">
          {data.blackStartPlan.map((step, index) => (
            <li key={step}><span className="mr-2 font-semibold text-lime-700">{index + 1}.</span>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
