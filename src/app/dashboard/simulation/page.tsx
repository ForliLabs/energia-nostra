"use client";

import { Calculator, TrendingUp, Leaf, Users, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

interface SimulationListItem {
  id: string; name: string; location: string; memberCount: number;
  solarKwp: number; status: string; createdAt: string;
}

export default function SimulationPage() {
  const [simulations, setSimulations] = useState<SimulationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/simulation").then((r) => r.json())
      .then((d) => { setSimulations(d.simulations || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;

  const fp = result?.financialProjection as Record<string, number> | undefined;
  const mc = result?.monteCarloResults as Record<string, number> & { distribution?: { bucket: string; count: number }[] } | undefined;
  const env = result?.environmentalImpact as Record<string, number> | undefined;
  const recs = result?.recommendations as string[] | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">🧮 Simulatore CER & ROI</h1>
          <p className="text-zinc-600 mt-1">Analisi di fattibilità con Monte Carlo, proiezioni 20 anni e confronto scenari</p>
        </div>
        <button onClick={runDemo} disabled={running} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50">
          <Calculator className="h-4 w-4" /> {running ? "In corso..." : "Simula Scenario Demo"}
        </button>
      </div>

      {fp && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Incentivi GSE/anno", value: `€${fp.annualGseIncentiveEuro?.toLocaleString("it-IT")}`, icon: TrendingUp, color: "text-green-600" },
            { label: "Payback", value: `${fp.paybackYears} anni`, icon: BarChart3, color: "text-amber-600" },
            { label: "NPV 20 anni", value: `€${fp.npv20Years?.toLocaleString("it-IT")}`, icon: Calculator, color: "text-blue-600" },
            { label: "ROI 20 anni", value: `${fp.roi20Years}%`, icon: TrendingUp, color: "text-purple-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2"><stat.icon className={`h-5 w-5 ${stat.color}`} /><span className="text-sm text-zinc-500">{stat.label}</span></div>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {mc && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">🎲 Monte Carlo ({mc.runs} simulazioni)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><span className="text-sm text-zinc-500">NPV medio</span><p className="font-bold">€{mc.meanNpv?.toLocaleString("it-IT")}</p></div>
            <div><span className="text-sm text-zinc-500">NPV mediano</span><p className="font-bold">€{mc.medianNpv?.toLocaleString("it-IT")}</p></div>
            <div><span className="text-sm text-zinc-500">Prob. ROI positivo</span><p className="font-bold text-green-600">{mc.probabilityPositiveRoi}%</p></div>
            <div><span className="text-sm text-zinc-500">Dev. Standard</span><p className="font-bold">€{mc.stdDevNpv?.toLocaleString("it-IT")}</p></div>
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
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">🌱 Impatto Ambientale</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "CO₂ evitata/anno", value: `${(env.annualCo2AvoidedKg / 1000).toFixed(1)} t`, icon: "🌍" },
              { label: "CO₂ 20 anni", value: `${env.twentyYearCo2AvoidedTonnes} t`, icon: "♻️" },
              { label: "Alberi equivalenti", value: env.treesEquivalent, icon: "🌳" },
              { label: "Auto tolte", value: env.carsOffRoad, icon: "🚗" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-2xl">{stat.icon}</span>
                <div><span className="text-sm text-zinc-500">{stat.label}</span><p className="font-bold">{stat.value}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recs && recs.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">💡 Raccomandazioni</h2>
          <ul className="space-y-2">
            {recs.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm"><Leaf className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" /><span>{r}</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold mb-4">📋 Simulazioni Salvate</h2>
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
                  <td className="py-2 font-medium">{s.name}</td>
                  <td className="py-2">{s.location}</td>
                  <td className="py-2 text-right">{s.memberCount}</td>
                  <td className="py-2 text-right">{s.solarKwp}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${s.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{s.status}</span></td>
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
