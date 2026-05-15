"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, Clock, Server, Wifi, RefreshCw } from "lucide-react";
import { DataFreshness } from "@/components/ui/data-freshness";
import { FetchError } from "@/components/ui/fetch-error";
import { StatsSkeleton } from "@/components/ui/skeleton";

interface HealthData {
  latency: { p50: number; p95: number; p99: number };
  errorRate: number;
  requestCount: number;
  topRoutes: { route: string; count: number; avgLatency: number; errorRate: number }[];
  recentErrors: { route: string; statusCode: number; traceId: string; timestamp: string }[];
  byStatusCode: { statusCode: number; count: number }[];
  externalApis: { name: string; status: string; lastCheck: string }[];
}

export default function HealthDashboardPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState(60);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`/api/observability?window=${timeWindow}`);
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: impossibile contattare il servizio di monitoraggio.`);
      }
      const payload = (await response.json()) as HealthData;
      setData(payload);
      setLastUpdated(new Date().toISOString());
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [timeWindow]);

  useEffect(() => {
    let active = true;
    (async () => {
      setError(null);
      try {
        const response = await fetch(`/api/observability?window=${timeWindow}`);
        if (!response.ok) throw new Error(`Errore ${response.status}: impossibile contattare il servizio di monitoraggio.`);
        const payload = (await response.json()) as HealthData;
        if (!active) return;
        setData(payload);
        setLastUpdated(new Date().toISOString());
      } catch (caughtError) {
        if (active) setError((caughtError as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [timeWindow]);

  if (loading && !data) {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Osservabilità</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Health Dashboard</h1>
          <p className="mt-4 text-base leading-7 text-zinc-600">Caricamento dati di monitoraggio…</p>
        </div>
        <StatsSkeleton count={4} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Osservabilità</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Health Dashboard</h1>
        </div>
        <FetchError
          title="Monitoraggio non disponibile"
          description="Non è stato possibile raggiungere il servizio di osservabilità. Verifica che l'endpoint /api/observability sia attivo e riprova."
          errorDetail={error}
          onRetry={() => { setLoading(true); void fetchData(); }}
        />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Osservabilità</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">Health Dashboard</h1>
            <p className="mt-4 text-base leading-7 text-zinc-600">Monitoraggio stato piattaforma EnergiaNostra: latenza, errori, servizi esterni.</p>
          </div>
          <div className="flex items-center gap-3">
            <DataFreshness
              lastUpdated={lastUpdated}
              onRefresh={() => { setLoading(true); void fetchData(); }}
              refreshing={loading}
            />
            <select
              value={timeWindow}
              onChange={e => setTimeWindow(Number(e.target.value))}
              className="rounded-2xl border border-lime-200 bg-amber-50/60 px-3 py-2 text-sm outline-none transition focus:border-lime-500"
            >
              <option value={15}>15 min</option>
              <option value={60}>1 ora</option>
              <option value={360}>6 ore</option>
              <option value={1440}>24 ore</option>
            </select>
            <button
              onClick={() => { setLoading(true); void fetchData(); }}
              className="rounded-2xl bg-lime-600 p-2.5 text-white shadow-sm transition hover:bg-lime-700"
              aria-label="Aggiorna dati di monitoraggio"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
          ⚠ Ultimo aggiornamento non riuscito: {error}. I dati visualizzati potrebbero non essere aggiornati.
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-lime-700" />
            <div>
              <p className="text-sm font-medium text-zinc-500">Latenza P50 / P95 / P99</p>
              <p className="mt-1 text-lg font-bold text-zinc-950">
                {data.latency.p50}ms / {data.latency.p95}ms / {data.latency.p99}ms
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${data.errorRate > 1 ? "text-red-600" : "text-lime-700"}`} />
            <div>
              <p className="text-sm font-medium text-zinc-500">Error Rate</p>
              <p className={`mt-1 text-lg font-bold ${data.errorRate > 1 ? "text-red-600" : "text-zinc-950"}`}>{data.errorRate}%</p>
              {data.errorRate > 1 ? (
                <p className="mt-1 text-xs text-red-600">Sopra la soglia consigliata (1%)</p>
              ) : (
                <p className="mt-1 text-xs text-lime-700">Entro la norma</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-lime-700" />
            <div>
              <p className="text-sm font-medium text-zinc-500">Richieste</p>
              <p className="mt-1 text-lg font-bold text-zinc-950">{data.requestCount.toLocaleString("it-IT")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-lime-700" />
            <div>
              <p className="text-sm font-medium text-zinc-500">Stato piattaforma</p>
              <p className="mt-1 text-lg font-bold text-lime-700">Operativo</p>
            </div>
          </div>
        </div>
      </div>

      {/* External APIs */}
      <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
        <h2 className="text-2xl font-bold text-zinc-950">Servizi Esterni</h2>
        <p className="mt-2 text-sm text-zinc-600">Stato di connettività verso le dipendenze esterne della piattaforma.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {data.externalApis.map(api => (
            <div key={api.name} className="flex items-center gap-3 rounded-2xl border border-lime-100 bg-amber-50/60 p-4">
              <Wifi className={`h-4 w-4 ${api.status === "up" ? "text-lime-600" : api.status === "down" ? "text-red-500" : "text-zinc-400"}`} />
              <div>
                <p className="text-sm font-semibold text-zinc-950">{api.name}</p>
                <p className={`text-xs ${api.status === "up" ? "text-lime-700" : api.status === "down" ? "text-red-600" : "text-zinc-500"}`}>
                  {api.status === "up" ? "✓ Operativo" : api.status === "down" ? "✗ Non raggiungibile" : "— Non verificato"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Routes */}
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Rotte più utilizzate</h2>
          <div className="mt-6 space-y-2">
            {data.topRoutes.length === 0 ? (
              <p className="text-sm text-zinc-400">Nessun dato disponibile nel periodo selezionato.</p>
            ) : (
              data.topRoutes.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl border border-lime-100 bg-amber-50/60 px-4 py-3">
                  <span className="text-sm font-mono text-zinc-700">{r.route}</span>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{r.count} req</span>
                    <span>{r.avgLatency}ms</span>
                    <span className={r.errorRate > 0 ? "font-semibold text-red-600" : "text-lime-700"}>
                      {r.errorRate}% err
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Errori Recenti</h2>
          <div className="mt-6 space-y-2">
            {data.recentErrors.length === 0 ? (
              <div className="rounded-2xl border border-lime-200 bg-lime-50 px-4 py-3">
                <p className="text-sm font-semibold text-lime-700">✓ Nessun errore nel periodo selezionato</p>
                <p className="mt-1 text-xs text-zinc-500">Tutti gli endpoint hanno risposto correttamente.</p>
              </div>
            ) : (
              data.recentErrors.map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3">
                  <div>
                    <span className="text-sm font-mono text-red-700">{e.route}</span>
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{e.statusCode}</span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(e.timestamp).toLocaleTimeString("it-IT")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Status Code Distribution */}
      {data.byStatusCode.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Distribuzione Status Code</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {data.byStatusCode.map(s => (
              <div key={s.statusCode} className={`rounded-2xl border px-5 py-3 ${s.statusCode >= 500 ? "border-red-200 bg-red-50" : s.statusCode >= 400 ? "border-amber-200 bg-amber-50" : "border-lime-200 bg-lime-50"}`}>
                <span className="text-lg font-bold">{s.statusCode}</span>
                <span className="ml-2 text-sm text-zinc-500">×{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
