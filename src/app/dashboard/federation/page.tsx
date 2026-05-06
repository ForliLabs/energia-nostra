import { getFederatedIntelligenceDashboard } from "@/lib/federated-intelligence";

const formatCurrency = (value: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export default async function FederationPage() {
  const data = await getFederatedIntelligenceDashboard();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Moonshot #6</p>
        <h1 className="mt-3 text-3xl font-black text-zinc-950">Intelligenza federata tra CER</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-600">Una rete privacy-safe che confronta archetipi, simula policy e crea liquidità energetica tra comunità diverse.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["CER federate", String(data.summary.federatedCers)],
          ["Coverage benchmark", `${data.summary.benchmarkCoveragePct}%`],
          ["Liquidità energia", `${data.summary.liquidityMwh} MWh`],
          ["Federation score", `${data.summary.federationScore}%`],
          ["Policy readiness", `${data.summary.policyExportReadinessPct}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-lime-100 bg-white/90 p-5">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-950">{value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8">
          <h2 className="text-xl font-bold text-zinc-950">Cluster benchmark</h2>
          <div className="mt-5 space-y-4">
            {data.benchmarkClusters.map((cluster) => (
              <article key={cluster.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-zinc-950">{cluster.archetype}</h3>
                    <p className="text-sm text-zinc-500">{cluster.cerCount} CER nel cluster</p>
                  </div>
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">{cluster.resilienceScore}%</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium text-zinc-700">
                  <span>Shared energy {cluster.sharedEnergyPct}%</span>
                  <span>Margine membro {formatCurrency(cluster.marginPerMemberEuro)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8">
            <h2 className="text-xl font-bold text-zinc-950">Policy sandbox</h2>
            <div className="mt-5 space-y-4">
              {data.policySimulations.map((simulation) => (
                <div key={simulation.id} className="rounded-2xl bg-white/80 p-4">
                  <p className="font-semibold text-zinc-950">{simulation.label}</p>
                  <p className="mt-2 text-sm text-zinc-600">difficulty {simulation.implementationDifficulty}</p>
                  <p className="mt-2 text-sm font-medium text-lime-800">Upside {formatCurrency(simulation.upsideEuro)} · Downside {formatCurrency(simulation.downsideEuro)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-lime-100 bg-white/90 p-8">
            <h2 className="text-xl font-bold text-zinc-950">Network effects</h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              {data.networkEffects.map((effect) => <li key={effect}>• {effect}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-lime-100 bg-white/90 p-8">
        <h2 className="text-xl font-bold text-zinc-950">Segnali architetturali</h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-600">
          {data.architectureSignals.map((signal) => <li key={signal}>• {signal}</li>)}
        </ul>
      </section>
    </div>
  );
}
