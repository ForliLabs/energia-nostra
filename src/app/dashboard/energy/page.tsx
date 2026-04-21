import { energyData, energySummary, optimizationSuggestions, cerMembers } from "@/lib/data";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

export default function EnergyPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Contabilizzazione energia</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
          Bilancio energetico mensile della CER
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          Produzione, consumo e quota condivisa per gli ultimi sei mesi, con dettaglio per singolo membro e suggerimenti di ottimizzazione.
        </p>
      </section>

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

          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8 shadow-lg shadow-amber-100/40">
            <h2 className="text-2xl font-bold text-zinc-950">Segnale operativo</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-700">
              Le utenze con profilo negativo concentrano il prelievo tra le 19:00 e le 22:00. Priorità: programmazione pompe di calore, ricarica EV e cicli freddo nelle ore centrali del giorno.
            </p>
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
              {cerMembers.map((member) => {
                const quota = Math.round(
                  (energySummary.sharedEnergyKwh / cerMembers.length) *
                    (member.type === "produttore" ? 1.28 : member.type === "prosumer" ? 1.08 : 0.82)
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
                        ? "Spostare carichi programmabili nella fascia 10:00-15:00."
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
