"use client";

import { Calculator, TrendingUp, Leaf, BarChart3 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StatsSkeleton } from "@/components/ui/skeleton";

interface SimulationListItem {
  id: string; name: string; location: string; memberCount: number;
  solarKwp: number; status: string; createdAt: string;
}

export default function SimulationPage() {
  const [simulations, setSimulations] = useState<SimulationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/simulation");
      if (!r.ok) throw new Error(`Errore ${r.status}`);
      const d = await r.json();
      setSimulations(d.simulations || []);
    } catch (e) {
      setError((e as Error).message || "Impossibile caricare le simulazioni.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const runDemo = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulation: {
            name: "CER Bertinoro — Scenario Base",
            location: "Bertinoro",
            latitude: 44.15,
            longitude: 12.13,
            memberCount: 25,
            producerCount: 8,
            consumerCount: 12,
            prosumerCount: 5,
            solarKwp: 50,
            batteryKwh: 27,
            annualConsumptionKwh: 75000,
            roofAreaSqm: 400,
            buildingType: "mixed",
            monteCarloRuns: 1000,
          },
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch { /* ignore */ }
    setRunning(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Pianificazione" title="Simulatore CER e ROI" description="Analisi di fattibilità con Monte Carlo, proiezioni 20 anni e confronto scenari" />
        <StatsSkeleton count={4} />
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
          <Skeleton className="h-6 w-52 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Pianificazione" title="Simulatore CER e ROI" description="Analisi di fattibilità con Monte Carlo, proiezioni 20 anni e confronto scenari" />
        <FetchError
          title="Impossibile caricare le simulazioni"
          description="Verifica la connessione e riprova."
          errorDetail={error}
          onRetry={() => { setLoading(true); void fetchData(); }}
        />
      </div>
    );
  }

  const fp = result?.financialProjection as Record<string, number> | undefined;
  const mc = result?.monteCarloResults as Record<string, number> & { distribution?: { bucket: string; count: number }[] } | undefined;
  const env = result?.environmentalImpact as Record<string, number> | undefined;
  const recs = result?.recommendations as string[] | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pianificazione"
        title="Simulatore CER e ROI"
        description="Analisi di fattibilità con Monte Carlo, proiezioni 20 anni e confronto scenari"
        actions={
          <button
            onClick={runDemo}
            disabled={running}
            className="flex items-center gap-2 rounded-2xl bg-amber-600 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-amber-200 hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            <Calculator className="h-4 w-4" /> {running ? "In corso…" : "Simula Scenario Demo"}
          </button>
        }
      />

      {fp && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Incentivi GSE/anno", value: `€${fp.annualGseIncentiveEuro?.toLocaleString("it-IT")}`, icon: TrendingUp, color: "text-lime-700" },
            { label: "Payback", value: `${fp.paybackYears} anni`, icon: BarChart3, color: "text-amber-600" },
            { label: "NPV 20 anni", value: `€${fp.npv20Years?.toLocaleString("it-IT")}`, icon: Calculator, color: "text-amber-700" },
            { label: "ROI 20 anni", value: `${fp.roi20Years}%`, icon: TrendingUp, color: "text-lime-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-2"><stat.icon className={`h-5 w-5 ${stat.color}`} /><span className="text-sm text-zinc-500">{stat.label}</span></div>
              <p className="text-2xl font-bold text-zinc-950 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {mc && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Monte Carlo ({mc.runs} simulazioni)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div><span className="text-sm text-zinc-500">NPV medio</span><p className="font-bold text-zinc-900">€{mc.meanNpv?.toLocaleString("it-IT")}</p></div>
            <div><span className="text-sm text-zinc-500">NPV mediano</span><p className="font-bold text-zinc-900">€{mc.medianNpv?.toLocaleString("it-IT")}</p></div>
            <div><span className="text-sm text-zinc-500">Prob. ROI positivo</span><p className="font-bold text-lime-700">{mc.probabilityPositiveRoi}%</p></div>
            <div><span className="text-sm text-zinc-500">Dev. Standard</span><p className="font-bold text-zinc-900">€{mc.stdDevNpv?.toLocaleString("it-IT")}</p></div>
          </div>
          {mc.distribution && (
            <div className="flex items-end gap-1 h-32">
              {mc.distribution.map((b: { bucket: string; count: number }, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-amber-400 rounded-t" style={{ height: `${(b.count / Math.max(...mc.distribution!.map((d: { count: number }) => d.count), 1)) * 100}%` }} />
                  <span className="text-xs text-zinc-400 mt-1 truncate w-full text-center">{b.bucket.split("–")[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {env && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Impatto Ambientale</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "CO₂ evitata/anno", value: `${(env.annualCo2AvoidedKg / 1000).toFixed(1)} t` },
              { label: "CO₂ 20 anni", value: `${env.twentyYearCo2AvoidedTonnes} t` },
              { label: "Alberi equivalenti", value: env.treesEquivalent },
              { label: "Auto tolte", value: env.carsOffRoad },
            ].map((stat) => (
              <div key={stat.label} className="p-4 bg-lime-50/60 rounded-2xl border border-lime-100">
                <span className="text-sm text-zinc-500">{stat.label}</span>
                <p className="font-bold text-zinc-900 mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {recs && recs.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Raccomandazioni</h2>
          <ul className="space-y-2">
            {recs.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm"><Leaf className="h-4 w-4 text-lime-600 mt-0.5 flex-shrink-0" /><span className="text-zinc-700">{r}</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
        <h2 className="text-xl font-bold text-zinc-950 mb-5">Simulazioni Salvate</h2>
        {simulations.length === 0 ? (
          <p className="text-zinc-500 text-center py-4">Nessuna simulazione. Esegui il primo scenario demo.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-200">
              <th className="text-left py-2 text-zinc-500">Nome</th>
              <th className="text-left py-2 text-zinc-500">Località</th>
              <th className="text-right py-2 text-zinc-500">Membri</th>
              <th className="text-right py-2 text-zinc-500">kWp</th>
              <th className="text-left py-2 text-zinc-500">Stato</th>
              <th className="text-left py-2 text-zinc-500">Data</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {simulations.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 font-semibold text-zinc-900">{s.name}</td>
                  <td className="py-2 text-zinc-600">{s.location}</td>
                  <td className="py-2 text-right">{s.memberCount}</td>
                  <td className="py-2 text-right">{s.solarKwp}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${s.status === "completed" ? "bg-lime-100 text-lime-700" : "bg-amber-100 text-amber-700"}`}>{s.status}</span></td>
                  <td className="py-2 text-zinc-500">{new Date(s.createdAt).toLocaleDateString("it-IT")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
