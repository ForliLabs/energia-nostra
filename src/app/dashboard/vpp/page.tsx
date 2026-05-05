import { getMoonshotVppDashboard } from "@/lib/moonshot-vpp";

const formatCurrency = (value: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export default async function VppPage() {
  const data = await getMoonshotVppDashboard();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-sm shadow-amber-100/40">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Moonshot #1</p>
        <h1 className="mt-3 text-3xl font-black text-zinc-950">VPP federata delle CER</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-600">Aggregatore territoriale che trasforma energia condivisa, storage, EV e carichi flessibili in una control room capace di vendere servizi di rete e resilienza.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Potenza controllabile", `${data.summary.controllableKw} kW`],
          ["Storage federato", `${data.summary.storageKwh} kWh`],
          ["Dispatch readiness", `${data.summary.dispatchReadinessPct}%`],
          ["Ricavi rete annui", formatCurrency(data.summary.yearlyGridServicesEuro)],
          ["Curtailment evitato", `${data.summary.avoidedCurtailmentPct}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-lime-100 bg-white/90 p-5 shadow-sm shadow-lime-100/30">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-950">{value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8">
          <h2 className="text-xl font-bold text-zinc-950">Nodi orchestrabili</h2>
          <div className="mt-5 space-y-4">
            {data.nodes.map((node) => (
              <article key={node.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-zinc-950">{node.name}</h3>
                    <p className="text-sm text-zinc-500">{node.dispatchRole}</p>
                  </div>
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-800">{node.marketLane}</span>
                </div>
                <dl className="mt-3 grid gap-3 text-sm text-zinc-600 md:grid-cols-3">
                  <div><dt className="font-medium text-zinc-500">Potenza</dt><dd>{node.controllableKw} kW</dd></div>
                  <div><dt className="font-medium text-zinc-500">Storage</dt><dd>{node.storageKwh} kWh</dd></div>
                  <div><dt className="font-medium text-zinc-500">Response time</dt><dd>{node.responseTimeMin} min</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8">
          <h2 className="text-xl font-bold text-zinc-950">Stack di bidding</h2>
          <div className="mt-5 space-y-4">
            {data.bids.map((bid) => (
              <div key={bid.id} className="rounded-2xl bg-white/80 p-4">
                <p className="text-sm font-semibold text-zinc-950">{bid.service}</p>
                <p className="mt-1 text-sm text-zinc-500">{bid.market} · {bid.window}</p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-2xl font-bold text-zinc-950">{bid.committedKw} kW</p>
                    <p className="text-xs text-zinc-500">confidence {bid.confidencePct}%</p>
                  </div>
                  <p className="text-sm font-semibold text-lime-700">{formatCurrency(bid.expectedMonthlyEuro)}/mese</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-lime-100 bg-white/90 p-8">
        <h2 className="text-xl font-bold text-zinc-950">Finestre di dispatch</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {data.dispatchWindows.map((window) => (
            <div key={window.id} className="rounded-2xl border border-lime-100 bg-lime-50/60 p-4">
              <p className="font-semibold text-zinc-950">{window.label}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{window.objective}</p>
              <p className="mt-3 text-sm font-medium text-lime-800">{window.flexKw} kW · {formatCurrency(window.expectedValueEuro)}</p>
            </div>
          ))}
        </div>
        <ul className="mt-6 space-y-2 text-sm text-zinc-600">
          {data.buildSignals.map((signal) => <li key={signal}>• {signal}</li>)}
        </ul>
      </section>
    </div>
  );
}
