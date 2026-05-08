import Link from "next/link";
import { ArrowRight, Leaf, ShieldCheck } from "lucide-react";
import { DashboardChartsSection } from "@/components/charts/dashboard-charts-section";
import { StatCard } from "@/components/dashboard";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  getCerProfile,
  getEnergyData,
  getEnergySummary,
  healthIndicators,
  recentActivity,
} from "@/lib/data-db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusClasses = {
  excellent: "bg-lime-100 text-lime-800",
  good: "bg-amber-100 text-amber-800",
  attention: "bg-red-100 text-red-700",
} as const;

const toneClasses = {
  positive: "bg-lime-100 text-lime-800",
  neutral: "bg-amber-100 text-amber-800",
  attention: "bg-red-100 text-red-700",
} as const;

export default async function DashboardPage() {
  const [cerProfile, energyData, energySummary] = await Promise.all([
    getCerProfile(),
    getEnergyData(),
    getEnergySummary(),
  ]);

  const latestEnergyMonth = energyData[energyData.length - 1];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard CER"
        title={cerProfile.name}
        description="Vista operativa della comunità energetica: membri attivi, energia condivisa, incentivi GSE e stato di salute complessivo."
        actions={
          <Link
            href="/dashboard/incentives"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700"
          >
            Apri incentivi GSE
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {latestEnergyMonth ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Membri attivi" value={`${cerProfile.members}`} change="Anagrafica sincronizzata con il database CER" trend="neutral" />
            <StatCard
              label="Energia condivisa (kWh)"
              value={latestEnergyMonth.sharedEnergyKwh.toLocaleString("it-IT")}
              change={`Ultimo mese rilevato: ${latestEnergyMonth.label}`}
              trend="up"
            />
            <StatCard
              label="Risparmio mese"
              value={formatCurrency(latestEnergyMonth.savingsEuro)}
              change="Riduzione bollette aggregate"
              trend="up"
            />
            <StatCard
              label="Incentivo GSE"
              value={formatCurrency(latestEnergyMonth.gseIncentiveEuro)}
              change="Report pronto per la validazione"
              trend="neutral"
            />
          </div>

          <DashboardChartsSection energyData={energyData} latestMonth={latestEnergyMonth} />

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-lime-700" />
                <h2 className="text-2xl font-bold text-zinc-950">Indicatori salute CER</h2>
              </div>
              <div className="mt-6 space-y-4">
                {healthIndicators.map((indicator) => (
                  <div key={indicator.id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-700">{indicator.label}</p>
                        <p className="mt-1 text-sm text-zinc-500">{indicator.note}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[indicator.status]}`}>
                        {indicator.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8 shadow-lg shadow-amber-100/40">
              <h2 className="text-2xl font-bold text-zinc-950">Snapshot territoriale</h2>
              <p className="mt-4 text-sm leading-6 text-zinc-700">{cerProfile.referenceNote}</p>
              <dl className="mt-6 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-zinc-500">Autoconsumo mese</dt>
                  <dd className="mt-1 text-2xl font-bold text-zinc-950">{latestEnergyMonth.selfConsumptionPct}%</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500">CO₂ evitata</dt>
                  <dd className="mt-1 text-2xl font-bold text-zinc-950">
                    {latestEnergyMonth.co2AvoidedKg.toLocaleString("it-IT")} kg
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500">Cabina primaria</dt>
                  <dd className="mt-1 text-lg font-semibold text-zinc-950">{cerProfile.cabinaPrimaria || "Cabina da configurare"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500">Incentivo cumulato</dt>
                  <dd className="mt-1 text-lg font-semibold text-zinc-950">{formatCurrency(energySummary.gseIncentiveEuro)}</dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
            <div className="flex items-center gap-3">
              <Leaf className="h-5 w-5 text-lime-700" />
              <h2 className="text-2xl font-bold text-zinc-950">Attività recenti</h2>
            </div>
            <div className="mt-6 space-y-4">
              {recentActivity.map((item) => (
                <article key={item.id} className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-zinc-950">{item.title}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[item.tone]}`}>
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <EmptyState
          title="Nessun dato energia disponibile"
          description="Carica almeno una lettura o importa un consuntivo mensile per popolare la dashboard della comunità energetica."
        />
      )}
    </div>
  );
}
