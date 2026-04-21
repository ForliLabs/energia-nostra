"use client";

import dynamic from "next/dynamic";
import type { EnergyMonth } from "@/lib/data";

// Dynamic import to avoid SSR issues with recharts
const ProductionConsumptionChart = dynamic(
  () => import("./energy-charts").then((mod) => mod.ProductionConsumptionChart),
  { ssr: false, loading: () => <div className="flex h-[350px] items-center justify-center text-sm text-zinc-400">Caricamento grafico...</div> }
);

const SharedEnergyBarChart = dynamic(
  () => import("./energy-charts").then((mod) => mod.SharedEnergyBarChart),
  { ssr: false, loading: () => <div className="flex h-[300px] items-center justify-center text-sm text-zinc-400">Caricamento grafico...</div> }
);

const SavingsChart = dynamic(
  () => import("./energy-charts").then((mod) => mod.SavingsChart),
  { ssr: false, loading: () => <div className="flex h-[300px] items-center justify-center text-sm text-zinc-400">Caricamento grafico...</div> }
);

const SelfConsumptionChart = dynamic(
  () => import("./energy-charts").then((mod) => mod.SelfConsumptionChart),
  { ssr: false, loading: () => <div className="flex h-[250px] items-center justify-center text-sm text-zinc-400">Caricamento grafico...</div> }
);

interface Props {
  energyData: EnergyMonth[];
  latestMonth: EnergyMonth;
}

export function DashboardChartsSection({ energyData, latestMonth }: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-950">Produzione vs Consumo</h2>
            <p className="mt-2 text-sm text-zinc-600">Andamento energetico degli ultimi sei mesi della CER.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Ultimo dato: {latestMonth.label}
          </span>
        </div>
        <div className="mt-6">
          <ProductionConsumptionChart data={energyData} />
        </div>
      </section>

      <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
        <h2 className="text-2xl font-bold text-zinc-950">Energia condivisa</h2>
        <p className="mt-2 text-sm text-zinc-600">kWh condivisi mensilmente tra i membri della CER.</p>
        <div className="mt-6">
          <SharedEnergyBarChart data={energyData} />
        </div>
      </section>

      <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
        <h2 className="text-2xl font-bold text-zinc-950">Risparmio e incentivi GSE</h2>
        <p className="mt-2 text-sm text-zinc-600">Beneficio economico mensile cumulato.</p>
        <div className="mt-6">
          <SavingsChart data={energyData} />
        </div>
      </section>

      <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
        <h2 className="text-2xl font-bold text-zinc-950">Autoconsumo condiviso</h2>
        <p className="mt-2 text-sm text-zinc-600">Percentuale di energia condivisa sul consumo totale.</p>
        <div className="mt-6">
          <SelfConsumptionChart data={energyData} />
        </div>
      </section>
    </div>
  );
}
