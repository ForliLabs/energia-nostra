"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CerSummary } from "@/lib/multi-cer";

interface MultiCerStats {
  totalCers: number;
  activeCers: number;
  inFormationCers: number;
  totalMembers: number;
  totalProductionKwh: number;
  totalSharedEnergyKwh: number;
  totalIncentiveEuro: number;
  totalSavingsEuro: number;
  totalCo2AvoidedKg: number;
  avgPerformanceScore: number;
  avgSelfConsumptionPct: number;
  benchmarks: {
    bestPerformer: CerSummary;
    highestSelfConsumption: CerSummary;
    largestCer: CerSummary;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

const statusClasses: Record<string, string> = {
  attiva: "bg-lime-100 text-lime-800",
  in_formazione: "bg-amber-100 text-amber-800",
  sospesa: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  attiva: "Attiva",
  in_formazione: "In formazione",
  sospesa: "Sospesa",
};

export default function AdminPage() {
  const [cers, setCers] = useState<CerSummary[]>([]);
  const [stats, setStats] = useState<MultiCerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCer, setSelectedCer] = useState<CerSummary | null>(null);

  useEffect(() => {
    fetch("/api/cer")
      .then((r) => r.json())
      .then((data: { cers: CerSummary[]; stats: MultiCerStats }) => {
        setCers(data.cers);
        setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffbea_0%,#f7fee7_42%,#ffffff_100%)]">
      <header className="border-b border-lime-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link href="/" className="text-xl font-black text-lime-950">EnergiaNostra</Link>
            <p className="text-sm text-zinc-500">Console Multi-CER</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-semibold text-lime-700 hover:underline">
              Dashboard singola CER →
            </Link>
            <Link href="/login" className="text-sm text-zinc-500 hover:underline">
              Logout
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Super admin</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
            Console gestione multi-CER
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
            Panoramica consolidata di tutte le comunità energetiche gestite. Confronta performance, benchmark e KPI aggregati.
          </p>
        </section>

        {loading && <p className="text-sm text-zinc-500">Caricamento dati...</p>}

        {stats && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">CER totali</p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{stats.totalCers}</p>
                <p className="mt-1 text-xs text-zinc-500">{stats.activeCers} attive · {stats.inFormationCers} in formazione</p>
              </div>
              <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">Membri totali</p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{stats.totalMembers}</p>
              </div>
              <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">Energia condivisa</p>
                <p className="mt-2 text-3xl font-bold text-lime-700">{(stats.totalSharedEnergyKwh / 1000).toFixed(0)} MWh</p>
              </div>
              <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">Incentivi GSE</p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{formatCurrency(stats.totalIncentiveEuro)}</p>
              </div>
              <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">CO₂ evitata</p>
                <p className="mt-2 text-3xl font-bold text-zinc-950">{(stats.totalCo2AvoidedKg / 1000).toFixed(1)} t</p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
                <h2 className="text-2xl font-bold text-zinc-950">CER gestite</h2>
                <div className="mt-6 space-y-4">
                  {cers.map((cer) => (
                    <article
                      key={cer.id}
                      onClick={() => setSelectedCer(cer)}
                      className={`cursor-pointer rounded-2xl border p-5 transition ${
                        selectedCer?.id === cer.id
                          ? "border-lime-500 bg-lime-50/70 ring-1 ring-lime-200"
                          : "border-amber-100 bg-amber-50/70 hover:border-lime-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-zinc-950">{cer.name}</h3>
                          <p className="text-sm text-zinc-600">{cer.municipality}, {cer.province}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[cer.status]}`}>
                            {statusLabels[cer.status]}
                          </span>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-100">
                            <span className="text-sm font-bold text-lime-800">{cer.performanceScore}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-3 text-xs text-zinc-500">
                        <div>
                          <p className="font-semibold text-zinc-700">{cer.memberCount}</p>
                          <p>Membri</p>
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-700">{(cer.sharedEnergyKwh / 1000).toFixed(0)} MWh</p>
                          <p>Condivisa</p>
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-700">{cer.selfConsumptionPct}%</p>
                          <p>Autoconsumo</p>
                        </div>
                        <div>
                          <p className="font-semibold text-lime-700">{formatCurrency(cer.totalIncentiveEuro)}</p>
                          <p>Incentivi</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                {selectedCer ? (
                  <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
                    <h2 className="text-2xl font-bold text-zinc-950">{selectedCer.name}</h2>
                    <p className="mt-2 text-sm text-zinc-600">{selectedCer.municipality} · Fondata nel {selectedCer.foundedYear}</p>

                    <dl className="mt-6 space-y-4">
                      <div className="flex justify-between rounded-xl bg-amber-50/70 p-3">
                        <dt className="text-sm text-zinc-600">Membri</dt>
                        <dd className="text-sm font-bold text-zinc-950">{selectedCer.memberCount}</dd>
                      </div>
                      <div className="flex justify-between rounded-xl bg-lime-50/70 p-3">
                        <dt className="text-sm text-zinc-600">Produzione</dt>
                        <dd className="text-sm font-bold text-zinc-950">{(selectedCer.productionKwh / 1000).toFixed(0)} MWh</dd>
                      </div>
                      <div className="flex justify-between rounded-xl bg-lime-50/70 p-3">
                        <dt className="text-sm text-zinc-600">Consumo</dt>
                        <dd className="text-sm font-bold text-zinc-950">{(selectedCer.consumptionKwh / 1000).toFixed(0)} MWh</dd>
                      </div>
                      <div className="flex justify-between rounded-xl bg-lime-50/70 p-3">
                        <dt className="text-sm text-zinc-600">Energia condivisa</dt>
                        <dd className="text-sm font-bold text-lime-700">{(selectedCer.sharedEnergyKwh / 1000).toFixed(0)} MWh</dd>
                      </div>
                      <div className="flex justify-between rounded-xl bg-lime-50/70 p-3">
                        <dt className="text-sm text-zinc-600">Autoconsumo</dt>
                        <dd className="text-sm font-bold text-zinc-950">{selectedCer.selfConsumptionPct}%</dd>
                      </div>
                      <div className="flex justify-between rounded-xl bg-lime-50/70 p-3">
                        <dt className="text-sm text-zinc-600">Incentivi GSE</dt>
                        <dd className="text-sm font-bold text-lime-700">{formatCurrency(selectedCer.totalIncentiveEuro)}</dd>
                      </div>
                      <div className="flex justify-between rounded-xl bg-lime-50/70 p-3">
                        <dt className="text-sm text-zinc-600">Risparmi</dt>
                        <dd className="text-sm font-bold text-zinc-950">{formatCurrency(selectedCer.savingsEuro)}</dd>
                      </div>
                      <div className="flex justify-between rounded-xl bg-amber-50/70 p-3">
                        <dt className="text-sm text-zinc-600">CO₂ evitata</dt>
                        <dd className="text-sm font-bold text-zinc-950">{(selectedCer.co2AvoidedKg / 1000).toFixed(1)} t</dd>
                      </div>
                    </dl>

                    <div className="mt-6">
                      <p className="text-sm font-semibold text-zinc-700">Performance score</p>
                      <div className="mt-2 h-4 overflow-hidden rounded-full bg-zinc-200">
                        <div
                          className={`h-full rounded-full ${selectedCer.performanceScore >= 80 ? "bg-lime-500" : selectedCer.performanceScore >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                          style={{ width: `${selectedCer.performanceScore}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {selectedCer.performanceScore >= 80 ? "Eccellente" : selectedCer.performanceScore >= 60 ? "Buono" : "Da migliorare"}
                        {" — "}media piattaforma: {stats.avgPerformanceScore}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8 shadow-lg shadow-amber-100/40">
                    <h2 className="text-2xl font-bold text-zinc-950">Seleziona una CER</h2>
                    <p className="mt-4 text-sm text-zinc-700">Clicca su una CER per vedere i dettagli completi.</p>
                  </div>
                )}

                <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
                  <h2 className="text-2xl font-bold text-zinc-950">Benchmark</h2>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl bg-lime-50/70 p-4">
                      <p className="text-xs font-semibold text-lime-700">🏆 Migliore performance</p>
                      <p className="mt-1 text-sm font-bold text-zinc-950">{stats.benchmarks.bestPerformer.name}</p>
                      <p className="text-xs text-zinc-500">Score: {stats.benchmarks.bestPerformer.performanceScore}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50/70 p-4">
                      <p className="text-xs font-semibold text-amber-700">⚡ Autoconsumo più alto</p>
                      <p className="mt-1 text-sm font-bold text-zinc-950">{stats.benchmarks.highestSelfConsumption.name}</p>
                      <p className="text-xs text-zinc-500">{stats.benchmarks.highestSelfConsumption.selfConsumptionPct}%</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50/70 p-4">
                      <p className="text-xs font-semibold text-amber-700">👥 CER più grande</p>
                      <p className="mt-1 text-sm font-bold text-zinc-950">{stats.benchmarks.largestCer.name}</p>
                      <p className="text-xs text-zinc-500">{stats.benchmarks.largestCer.memberCount} membri</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
                  <h2 className="text-2xl font-bold text-zinc-950">KPI aggregati</h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-zinc-600">Risparmio totale</dt>
                      <dd className="font-bold text-lime-700">{formatCurrency(stats.totalSavingsEuro)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-600">Autoconsumo medio</dt>
                      <dd className="font-bold text-zinc-950">{stats.avgSelfConsumptionPct}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-600">Score medio</dt>
                      <dd className="font-bold text-zinc-950">{stats.avgPerformanceScore}/100</dd>
                    </div>
                  </dl>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
