"use client";

import { Coins, ShieldCheck, SunMedium, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import type { ForecastDashboard, OptimalWindow } from "@/lib/forecasting";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

const formatKwh = (value: number) => `${value.toLocaleString("it-IT")} kWh`;

const formatTimeRange = (window: OptimalWindow) =>
  `${String(window.startHour).padStart(2, "0")}:00 - ${String(window.endHour).padStart(2, "0")}:00`;

export default function ForecastingPage() {
  const [dashboard, setDashboard] = useState<ForecastDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      try {
        const response = await fetch("/api/forecasting");
        if (!response.ok) {
          throw new Error("Impossibile recuperare le previsioni energetiche.");
        }
        const data = (await response.json()) as ForecastDashboard;
        if (active) {
          setDashboard(data);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Impossibile caricare le previsioni energetiche.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const forecastRows = dashboard
    ? dashboard.production.map((production, index) => ({
        period: production.period,
        production,
        consumption: dashboard.consumption[index],
        sharedEnergy: dashboard.sharedEnergy[index],
      }))
    : [];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Forecasting CER</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Previsioni Energetiche</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          Scenario atteso per i prossimi tre mesi con stima di produzione, consumo, energia condivisa e incentivi.
        </p>
      </section>

      {loading && !dashboard && <p className="text-sm text-zinc-500">Caricamento...</p>}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {dashboard && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <SunMedium className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Produzione prossimo mese</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{formatKwh(dashboard.summary.nextMonthProductionKwh)}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Zap className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Consumo prossimo mese</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{formatKwh(dashboard.summary.nextMonthConsumptionKwh)}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <TrendingUp className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Energia condivisa</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{formatKwh(dashboard.summary.nextMonthSharedKwh)}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Coins className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Forecast incentivo</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{formatCurrency(dashboard.summary.nextMonthIncentiveEuro)}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Confidenza modello</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{dashboard.summary.confidencePct}%</p>
            </div>
          </div>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Forecast a 3 mesi</h2>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full divide-y divide-amber-100 text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">Periodo</th>
                    <th className="pb-3 pr-4 font-semibold">Produzione</th>
                    <th className="pb-3 pr-4 font-semibold">Intervallo</th>
                    <th className="pb-3 pr-4 font-semibold">Consumo</th>
                    <th className="pb-3 pr-4 font-semibold">Intervallo</th>
                    <th className="pb-3 pr-4 font-semibold">Energia condivisa</th>
                    <th className="pb-3 font-semibold">Intervallo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {forecastRows.map((row) => (
                    <tr key={row.period}>
                      <td className="py-4 pr-4 font-semibold text-zinc-950">{row.period}</td>
                      <td className="py-4 pr-4 text-zinc-700">{formatKwh(row.production.forecastedKwh)}</td>
                      <td className="py-4 pr-4 text-zinc-600">
                        {formatKwh(row.production.confidenceLow)} - {formatKwh(row.production.confidenceHigh)}
                      </td>
                      <td className="py-4 pr-4 text-zinc-700">{formatKwh(row.consumption?.forecastedKwh ?? 0)}</td>
                      <td className="py-4 pr-4 text-zinc-600">
                        {formatKwh(row.consumption?.confidenceLow ?? 0)} - {formatKwh(row.consumption?.confidenceHigh ?? 0)}
                      </td>
                      <td className="py-4 pr-4 font-semibold text-lime-700">{formatKwh(row.sharedEnergy?.forecastedKwh ?? 0)}</td>
                      <td className="py-4 text-zinc-600">
                        {formatKwh(row.sharedEnergy?.confidenceLow ?? 0)} - {formatKwh(row.sharedEnergy?.confidenceHigh ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Finestre ottimali di consumo</h2>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {dashboard.optimalWindows.map((window) => (
                <article key={`${window.dayOfWeek}-${window.startHour}-${window.endHour}`} className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-zinc-700">{window.dayOfWeek}</p>
                  <p className="mt-2 text-xl font-bold text-amber-900">{formatTimeRange(window)}</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">{window.reason}</p>
                  <p className="mt-4 text-sm font-semibold text-lime-700">
                    Risparmio potenziale {formatCurrency(window.potentialSavingsEuro)}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
