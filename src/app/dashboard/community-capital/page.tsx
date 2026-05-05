import { getCommunityCapitalDashboard } from "@/lib/community-capital";

const formatCurrency = (value: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export default async function CommunityCapitalPage() {
  const data = await getCommunityCapitalDashboard();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Moonshot #5</p>
        <h1 className="mt-3 text-3xl font-black text-zinc-950">Capital stack comunitario</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-600">La CER diventa una macchina di capitale locale: bond cooperativi, anchor municipal notes e revenue share su servizi energetici.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Capitale raccolto", formatCurrency(data.summary.capitalRaisedEuro)],
          ["Ownership locale", `${data.summary.communityOwnedPct}%`],
          ["Costo del capitale", `${data.summary.blendedCostOfCapitalPct}%`],
          ["Runway riserva", `${data.summary.reserveCoverageMonths} mesi`],
          ["Deployment velocity", `${data.summary.deploymentVelocityPct}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-lime-100 bg-white/90 p-5">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-950">{value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8">
          <h2 className="text-xl font-bold text-zinc-950">Strumenti finanziari</h2>
          <div className="mt-5 space-y-4">
            {data.instruments.map((instrument) => (
              <article key={instrument.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-zinc-950">{instrument.name}</h3>
                    <p className="text-sm text-zinc-500">{instrument.type}</p>
                  </div>
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">{instrument.expectedYieldPct}%</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{instrument.useOfFunds}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium text-zinc-700">
                  <span>Target {formatCurrency(instrument.targetEuro)}</span>
                  <span>Committed {formatCurrency(instrument.committedEuro)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8">
            <h2 className="text-xl font-bold text-zinc-950">Campaign pipeline</h2>
            <div className="mt-5 space-y-4">
              {data.campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-2xl bg-white/80 p-4">
                  <p className="font-semibold text-zinc-950">{campaign.label}</p>
                  <p className="mt-2 text-sm text-zinc-600">{campaign.membersBacked} membri backing · {campaign.status}</p>
                  <p className="mt-2 text-sm font-medium text-lime-800">{formatCurrency(campaign.committedEuro)} / {formatCurrency(campaign.targetEuro)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-lime-100 bg-white/90 p-8">
            <h2 className="text-xl font-bold text-zinc-950">Treasury principles</h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              {data.treasuryPrinciples.map((principle) => <li key={principle}>• {principle}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-lime-100 bg-white/90 p-8">
        <h2 className="text-xl font-bold text-zinc-950">Strategic signals</h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-600">
          {data.strategicSignals.map((signal) => <li key={signal}>• {signal}</li>)}
        </ul>
      </section>
    </div>
  );
}
