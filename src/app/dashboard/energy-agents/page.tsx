import { getEnergyAgentsDashboard } from "@/lib/energy-agents";

const formatCurrency = (value: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export default async function EnergyAgentsPage() {
  const data = await getEnergyAgentsDashboard();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Moonshot #4</p>
        <h1 className="mt-3 text-3xl font-black text-zinc-950">Agenti energetici personali</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-600">Ogni membro opera con un agente AI che negozia comfort, risparmio e resilienza dentro guardrail approvati dalla comunità.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Agenti attivi", String(data.summary.activeAgents)],
          ["kWh orchestrati/giorno", `${data.summary.orchestratedKwhPerDay} kWh`],
          ["Automation uptake", `${data.summary.automationUptakePct}%`],
          ["Valore negoziato", formatCurrency(data.summary.negotiatedValueEuroPerMonth)],
          ["Guardrail comfort", `${data.summary.comfortGuardrailsPct}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-lime-100 bg-white/90 p-5">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-950">{value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8">
          <h2 className="text-xl font-bold text-zinc-950">Agenti in produzione</h2>
          <div className="mt-5 space-y-4">
            {data.agents.map((agent) => (
              <article key={agent.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-zinc-950">{agent.memberName}</h3>
                    <p className="text-sm text-zinc-500">{agent.strategy}</p>
                  </div>
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">trust {agent.trustScore}%</span>
                </div>
                <dl className="mt-3 grid gap-3 text-sm text-zinc-600 md:grid-cols-3">
                  <div><dt className="font-medium text-zinc-500">Autonomia</dt><dd>{agent.autonomyPct}%</dd></div>
                  <div><dt className="font-medium text-zinc-500">Flessibilità</dt><dd>{agent.flexibleKwhPerDay} kWh/giorno</dd></div>
                  <div><dt className="font-medium text-zinc-500">Deleghe</dt><dd>{agent.strategy}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8">
            <h2 className="text-xl font-bold text-zinc-950">Finestre di negoziazione</h2>
            <div className="mt-5 space-y-4">
              {data.negotiationWindows.map((window) => (
                <div key={window.id} className="rounded-2xl bg-white/80 p-4">
                  <p className="font-semibold text-zinc-950">{window.label}</p>
                  <p className="mt-2 text-sm text-zinc-600">{window.availableKwh} kWh · {window.participatingAgents} agenti</p>
                  <p className="mt-2 text-sm font-medium text-lime-800">{formatCurrency(window.expectedValueEuro)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-lime-100 bg-white/90 p-8">
            <h2 className="text-xl font-bold text-zinc-950">Governance hooks</h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              {data.governanceHooks.map((hook) => <li key={hook}>• {hook}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-lime-100 bg-white/90 p-8">
        <h2 className="text-xl font-bold text-zinc-950">Segnali di prodotto</h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-600">
          {data.productSignals.map((signal) => <li key={signal}>• {signal}</li>)}
        </ul>
      </section>
    </div>
  );
}
