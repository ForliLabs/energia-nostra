"use client";

import { useCallback, useEffect, useState } from "react";
import type { GseReportData } from "@/lib/gse-reporting";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export default function GseReportsPage() {
  const [report, setReport] = useState<GseReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("Apr 2025");

  const periods = ["Nov 2024", "Dic 2024", "Gen 2025", "Feb 2025", "Mar 2025", "Apr 2025"];

  const loadReport = useCallback(async (period: string) => {
    try {
      const res = await fetch(`/api/gse-reports?period=${encodeURIComponent(period)}`);
      const data = (await res.json()) as GseReportData;
      setReport(data);
    } catch {
      // keep previous report
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReport(selectedPeriod);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedPeriod, loadReport]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Report GSE automatizzato</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
          Generazione report conformi al GSE
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          Genera, valida e scarica report mensili nel formato richiesto dal GSE. Esporta in CSV o XML per l&apos;invio diretto al portale.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => {
              setLoading(true);
              setSelectedPeriod(p);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedPeriod === p
                ? "bg-lime-600 text-white"
                : "border border-lime-200 bg-white text-zinc-700 hover:bg-lime-50"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-zinc-500">Generazione report in corso...</p>}

      {report && !loading && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Periodo</p>
              <p className="mt-2 text-2xl font-bold text-zinc-950">{report.period}</p>
            </div>
            <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Energia condivisa</p>
              <p className="mt-2 text-2xl font-bold text-zinc-950">{report.sharedEnergyKwh.toLocaleString("it-IT")} kWh</p>
            </div>
            <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Incentivo totale</p>
              <p className="mt-2 text-2xl font-bold text-lime-700">{formatCurrency(report.totalIncentiveEuro)}</p>
            </div>
            <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Stato report</p>
              <p className={`mt-2 text-2xl font-bold ${report.status === "validato" ? "text-lime-700" : "text-amber-700"}`}>
                {report.status === "validato" ? "✓ Validato" : "⚠ Bozza"}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
              <h2 className="text-2xl font-bold text-zinc-950">Checklist validazione GSE</h2>
              <div className="mt-6 space-y-3">
                {report.validationChecks.map((check) => (
                  <div key={check.id} className="flex items-start gap-3 rounded-2xl border border-lime-50 bg-amber-50/40 p-4">
                    <span className={`mt-0.5 text-lg ${check.passed ? "text-lime-600" : "text-red-500"}`}>
                      {check.passed ? "✓" : "✗"}
                    </span>
                    <div>
                      <p className="font-semibold text-zinc-950">{check.label}</p>
                      <p className="text-sm text-zinc-600">{check.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
                <h2 className="text-2xl font-bold text-zinc-950">Esporta report</h2>
                <p className="mt-2 text-sm text-zinc-600">Scarica il report nel formato richiesto dal portale GSE.</p>
                <div className="mt-6 grid gap-3">
                  <a
                    href={`/api/gse-reports?period=${encodeURIComponent(selectedPeriod)}&format=csv`}
                    className="inline-flex items-center justify-center rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700"
                  >
                    📊 Scarica CSV
                  </a>
                  <a
                    href={`/api/gse-reports?period=${encodeURIComponent(selectedPeriod)}&format=xml`}
                    className="inline-flex items-center justify-center rounded-2xl border border-lime-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-lime-50"
                  >
                    📄 Scarica XML
                  </a>
                </div>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 to-lime-100 p-8 shadow-lg shadow-amber-100/40">
                <h2 className="text-2xl font-bold text-zinc-950">Info invio</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-semibold text-zinc-700">Codice CER</dt>
                    <dd className="text-zinc-600">{report.cerCode}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-zinc-700">Tariffa incentivante</dt>
                    <dd className="text-zinc-600">€{report.incentiveRateEuroPerMwh}/MWh</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-zinc-700">N. membri</dt>
                    <dd className="text-zinc-600">{report.memberAllocations.length} POD</dd>
                  </div>
                </dl>
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
            <h2 className="text-2xl font-bold text-zinc-950">Allocazione incentivi per membro</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-lime-100 text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">POD</th>
                    <th className="pb-3 pr-4 font-semibold">Nome</th>
                    <th className="pb-3 pr-4 font-semibold">Tipo</th>
                    <th className="pb-3 pr-4 font-semibold">Saldo kWh</th>
                    <th className="pb-3 pr-4 font-semibold">Quota %</th>
                    <th className="pb-3 font-semibold">Incentivo €</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lime-50">
                  {report.memberAllocations.map((m) => (
                    <tr key={m.podCode}>
                      <td className="py-3 pr-4 font-mono text-xs text-zinc-600">{m.podCode}</td>
                      <td className="py-3 pr-4 font-semibold text-zinc-950">{m.name}</td>
                      <td className="py-3 pr-4 capitalize text-zinc-600">{m.type}</td>
                      <td className={`py-3 pr-4 font-semibold ${m.energyBalanceKwh >= 0 ? "text-lime-700" : "text-amber-700"}`}>
                        {m.energyBalanceKwh.toLocaleString("it-IT")}
                      </td>
                      <td className="py-3 pr-4 text-zinc-600">{m.sharePct.toFixed(2)}%</td>
                      <td className="py-3 font-semibold text-lime-700">{formatCurrency(m.incentiveEuro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
