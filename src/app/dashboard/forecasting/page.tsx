"use client";

import { CloudSun, Coins, ShieldCheck, SunMedium, TrendingUp, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ForecastDashboard, ForecastResult, OptimalWindow, WeatherForecast } from "@/lib/forecasting";
import { EmptyState } from "@/components/ui/empty-state";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { StatsSkeleton } from "@/components/ui/skeleton";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

const formatKwh = (value: number) => `${value.toLocaleString("it-IT")} kWh`;
const formatTimeRange = (window: OptimalWindow) => `${String(window.startHour).padStart(2, "0")}:00 - ${String(window.endHour).padStart(2, "0")}:00`;

type ScenarioMode = "base" | "conservative" | "optimistic";

function getScenarioValue(forecast: ForecastResult | undefined, scenario: ScenarioMode) {
  if (!forecast) return 0;
  if (scenario === "conservative") return forecast.confidenceLow;
  if (scenario === "optimistic") return forecast.confidenceHigh;
  return forecast.forecastedKwh;
}

export default function ForecastingPage() {
  const [dashboard, setDashboard] = useState<ForecastDashboard | null>(null);
  const [weather, setWeather] = useState<WeatherForecast[]>([]);
  const [scenario, setScenario] = useState<ScenarioMode>("base");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [forecastResponse, weatherResponse] = await Promise.all([fetch("/api/forecasting"), fetch("/api/forecasting?type=weather")]);
      const forecastPayload = (await forecastResponse.json()) as ForecastDashboard & { error?: string };
      const weatherPayload = (await weatherResponse.json()) as { weather?: WeatherForecast[]; error?: string };
      if (!forecastResponse.ok) {
        throw new Error(forecastPayload.error || "Impossibile recuperare le previsioni energetiche.");
      }
      setDashboard(forecastPayload);
      setWeather(weatherPayload.weather || []);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const forecastRows = useMemo(
    () => dashboard
      ? dashboard.production.map((production, index) => ({
          period: production.period,
          production,
          consumption: dashboard.consumption[index],
          sharedEnergy: dashboard.sharedEnergy[index],
        }))
      : [],
    [dashboard],
  );

  const scenarioSummary = useMemo(() => {
    if (!dashboard) {
      return null;
    }
    return {
      nextMonthProductionKwh: getScenarioValue(dashboard.production[0], scenario),
      nextMonthConsumptionKwh: getScenarioValue(dashboard.consumption[0], scenario),
      nextMonthSharedKwh: getScenarioValue(dashboard.sharedEnergy[0], scenario),
    };
  }, [dashboard, scenario]);

  const weatherInsight = useMemo(() => {
    if (weather.length === 0) return null;
    const avgTemp = weather.reduce((sum, item) => sum + item.tempC, 0) / weather.length;
    const avgCloud = weather.reduce((sum, item) => sum + item.cloudCover, 0) / weather.length;
    const avgIrradiance = weather.reduce((sum, item) => sum + item.irradiance, 0) / weather.length;
    return { avgTemp, avgCloud, avgIrradiance };
  }, [weather]);

  const nextWindow = dashboard?.optimalWindows[0] || null;
  const netSurplus = scenarioSummary ? scenarioSummary.nextMonthProductionKwh - scenarioSummary.nextMonthConsumptionKwh : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Forecasting CER"
        title="Previsioni Energetiche"
        description="Oltre alla tabella a 3 mesi, la dashboard mostra ora scenari prudente/base/ottimistico, driver meteo e un playbook operativo da condividere con membri e facility manager."
        actions={
          <div className="flex flex-wrap gap-2">
            {(["base", "conservative", "optimistic"] as ScenarioMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setScenario(mode)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${scenario === mode ? "bg-lime-600 text-white" : "border border-lime-200 bg-white text-zinc-700 hover:bg-lime-50"}`}
              >
                {mode === "base" ? "Scenario base" : mode === "conservative" ? "Scenario prudente" : "Scenario ottimistico"}
              </button>
            ))}
          </div>
        }
      />

      {loading && !dashboard ? <StatsSkeleton count={5} /> : null}
      {error && !dashboard ? (
        <FetchError
          title="Impossibile caricare le previsioni"
          description="Verifica la connessione e riprova."
          errorDetail={error}
          onRetry={() => { void loadData(); }}
          retrying={loading}
        />
      ) : null}

      {dashboard ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><SunMedium className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Produzione prossimo mese</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{formatKwh(scenarioSummary?.nextMonthProductionKwh || 0)}</p></div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><Zap className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Consumo prossimo mese</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{formatKwh(scenarioSummary?.nextMonthConsumptionKwh || 0)}</p></div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><TrendingUp className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Energia condivisa</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{formatKwh(scenarioSummary?.nextMonthSharedKwh || 0)}</p></div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><Coins className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Incentivo atteso</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{formatCurrency(((scenarioSummary?.nextMonthSharedKwh || 0) / 1000) * 110)}</p></div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><ShieldCheck className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Confidenza modello</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{dashboard.summary.confidencePct}%</p></div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><CloudSun className="h-5 w-5 text-amber-700" /><h2 className="text-2xl font-bold text-zinc-950">Driver previsionali</h2></div>
              <div className="mt-6 space-y-4">
                <article className="rounded-2xl border border-lime-100 bg-lime-50 p-5">
                  <p className="text-sm font-semibold text-zinc-700">Scenario selezionato</p>
                  <p className="mt-2 text-lg font-bold text-zinc-950">{scenario === "base" ? "Base" : scenario === "conservative" ? "Prudente" : "Ottimistico"}</p>
                  <p className="mt-2 text-sm text-zinc-600">Usa lo scenario prudente per pianificare campagne di risparmio o il scenario ottimistico per simulare picchi FV favorevoli.</p>
                </article>
                <article className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-zinc-700">Bilancio netto stimato</p>
                  <p className={`mt-2 text-2xl font-bold ${netSurplus >= 0 ? "text-lime-700" : "text-amber-800"}`}>{formatKwh(netSurplus)}</p>
                  <p className="mt-2 text-sm text-zinc-600">{netSurplus >= 0 ? "C'è margine per attivare più carichi flessibili nelle finestre ottimali." : "Pianifica spostamenti di carico o riduzioni per proteggere la quota condivisa."}</p>
                </article>
                {nextWindow ? (
                  <article className="rounded-2xl border border-amber-100 bg-white p-5">
                    <p className="text-sm font-semibold text-zinc-700">Finestra operativa consigliata</p>
                    <p className="mt-2 text-lg font-bold text-zinc-950">{nextWindow.dayOfWeek} · {formatTimeRange(nextWindow)}</p>
                    <p className="mt-2 text-sm text-zinc-600">{nextWindow.reason}</p>
                    <p className="mt-2 text-xs font-semibold text-lime-700">Risparmio potenziale {formatCurrency(nextWindow.potentialSavingsEuro)}</p>
                  </article>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-amber-700" /><h2 className="text-2xl font-bold text-zinc-950">Forecast a 3 mesi</h2></div>
              {forecastRows.length === 0 ? (
                <div className="mt-6"><EmptyState title="Nessun dato storico disponibile" description="Importa almeno un ciclo di letture CER per generare previsioni e intervalli di confidenza." /></div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full divide-y divide-amber-100 text-sm">
                    <thead>
                      <tr className="text-left text-zinc-500">
                        <th className="pb-3 pr-4 font-semibold">Periodo</th>
                        <th className="pb-3 pr-4 font-semibold">Produzione</th>
                        <th className="pb-3 pr-4 font-semibold">Consumo</th>
                        <th className="pb-3 pr-4 font-semibold">Energia condivisa</th>
                        <th className="pb-3 font-semibold">Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {forecastRows.map((row) => (
                        <tr key={row.period}>
                          <td className="py-4 pr-4 font-semibold text-zinc-950">{row.period}</td>
                          <td className="py-4 pr-4 text-zinc-700">{formatKwh(getScenarioValue(row.production, scenario))}</td>
                          <td className="py-4 pr-4 text-zinc-700">{formatKwh(getScenarioValue(row.consumption, scenario))}</td>
                          <td className="py-4 pr-4 font-semibold text-lime-700">{formatKwh(getScenarioValue(row.sharedEnergy, scenario))}</td>
                          <td className="py-4 text-zinc-600">{formatKwh(row.sharedEnergy?.confidenceLow || 0)} – {formatKwh(row.sharedEnergy?.confidenceHigh || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><CloudSun className="h-5 w-5 text-amber-700" /><h2 className="text-2xl font-bold text-zinc-950">Outlook meteo operativo</h2></div>
              {weatherInsight ? (
                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <article className="rounded-2xl bg-lime-50 p-4"><p className="text-sm text-zinc-500">Temperatura media</p><p className="mt-2 text-2xl font-bold text-zinc-950">{weatherInsight.avgTemp.toFixed(1)}°C</p></article>
                    <article className="rounded-2xl bg-amber-50 p-4"><p className="text-sm text-zinc-500">Copertura nuvolosa</p><p className="mt-2 text-2xl font-bold text-zinc-950">{weatherInsight.avgCloud.toFixed(0)}%</p></article>
                    <article className="rounded-2xl bg-sky-50 p-4"><p className="text-sm text-zinc-500">Irraggiamento medio</p><p className="mt-2 text-2xl font-bold text-zinc-950">{weatherInsight.avgIrradiance.toFixed(1)}</p></article>
                  </div>
                  <ul className="space-y-3">
                    {weather.slice(0, 4).map((entry) => (
                      <li key={entry.date} className="rounded-2xl border border-amber-100 bg-white p-4 text-sm text-zinc-600">
                        <span className="font-semibold text-zinc-950">{new Date(entry.date).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "2-digit" })}</span>
                        {` · ${entry.tempC.toFixed(1)}°C · nuvolosità ${entry.cloudCover.toFixed(0)}% · irraggiamento ${entry.irradiance.toFixed(1)}`}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-6"><EmptyState title="Meteo non disponibile" description="L'outlook tornerà appena il servizio meteo o la cache locale saranno disponibili." /></div>
              )}
            </section>

            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Zap className="h-5 w-5 text-amber-700" /><h2 className="text-2xl font-bold text-zinc-950">Finestre ottimali di consumo</h2></div>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {dashboard.optimalWindows.map((window) => (
                  <article key={`${window.dayOfWeek}-${window.startHour}-${window.endHour}`} className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <p className="text-sm font-semibold text-zinc-700">{window.dayOfWeek}</p>
                    <p className="mt-2 text-xl font-bold text-zinc-950">{formatTimeRange(window)}</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">{window.reason}</p>
                    <p className="mt-4 text-sm font-semibold text-lime-700">Risparmio potenziale {formatCurrency(window.potentialSavingsEuro)}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
