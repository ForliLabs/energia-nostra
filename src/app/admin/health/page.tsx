"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Clock, Server, Wifi, RefreshCw } from "lucide-react";

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
  const [window, setWindow] = useState(60);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/observability?window=${window}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [window]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20 min-h-screen bg-zinc-50">
        <RefreshCw className="h-8 w-8 animate-spin text-lime-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Health Dashboard</h1>
          <p className="text-zinc-500 mt-1">Monitoraggio stato piattaforma EnergiaNostra</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={window}
            onChange={e => setWindow(Number(e.target.value))}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value={15}>15 min</option>
            <option value={60}>1 ora</option>
            <option value={360}>6 ore</option>
            <option value={1440}>24 ore</option>
          </select>
          <button onClick={fetchData} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-zinc-500">Latenza P50 / P95 / P99</p>
              <p className="text-lg font-bold text-zinc-900">
                {data.latency.p50}ms / {data.latency.p95}ms / {data.latency.p99}ms
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${data.errorRate > 1 ? "text-red-600" : "text-green-600"}`} />
            <div>
              <p className="text-xs text-zinc-500">Error Rate</p>
              <p className="text-lg font-bold text-zinc-900">{data.errorRate}%</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-xs text-zinc-500">Richieste</p>
              <p className="text-lg font-bold text-zinc-900">{data.requestCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <Server className="h-5 w-5 text-lime-600" />
            <div>
              <p className="text-xs text-zinc-500">Status</p>
              <p className="text-lg font-bold text-green-600">Operativo</p>
            </div>
          </div>
        </div>
      </div>

      {/* External APIs */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Servizi Esterni</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {data.externalApis.map(api => (
            <div key={api.name} className="flex items-center gap-3 rounded-lg border p-3">
              <Wifi className={`h-4 w-4 ${api.status === "up" ? "text-green-500" : api.status === "down" ? "text-red-500" : "text-zinc-400"}`} />
              <div>
                <p className="text-sm font-medium text-zinc-900">{api.name}</p>
                <p className="text-xs text-zinc-500">{api.status === "up" ? "Operativo" : api.status === "down" ? "Non raggiungibile" : "Non verificato"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Routes */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Top Routes</h2>
          <div className="space-y-2">
            {data.topRoutes.length === 0 ? (
              <p className="text-sm text-zinc-400">Nessun dato disponibile nel periodo selezionato.</p>
            ) : (
              data.topRoutes.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
                  <span className="text-sm font-mono text-zinc-700">{r.route}</span>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{r.count} req</span>
                    <span>{r.avgLatency}ms</span>
                    <span className={r.errorRate > 0 ? "text-red-600" : "text-green-600"}>
                      {r.errorRate}% err
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Errori Recenti</h2>
          <div className="space-y-2">
            {data.recentErrors.length === 0 ? (
              <p className="text-sm text-green-600">✓ Nessun errore nel periodo selezionato.</p>
            ) : (
              data.recentErrors.map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 px-3 py-2">
                  <div>
                    <span className="text-sm font-mono text-red-700">{e.route}</span>
                    <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">{e.statusCode}</span>
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
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Distribuzione Status Code</h2>
          <div className="flex flex-wrap gap-3">
            {data.byStatusCode.map(s => (
              <div key={s.statusCode} className={`rounded-lg border px-4 py-2 ${s.statusCode >= 500 ? "border-red-200 bg-red-50" : s.statusCode >= 400 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
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
