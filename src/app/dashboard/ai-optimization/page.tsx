"use client";

import { Brain, Lightbulb, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface OptimizationDashboard {
  models: Array<{ id: string; modelType: string; targetType: string; status: string; metrics: { mape: number; rmse: number; r2: number } | null; dataPointCount: number; trainedAt: string | null }>;
  todayRecommendations: Array<{ id: string; memberId: string; title: string; message: string; applianceType: string | null; suggestedStart: string; suggestedEnd: string; potentialSavingsEuro: number; status: string }>;
  optimizationResults: Array<{ date: string; predictedKwh: number; actualKwh: number | null; sharedEnergyPredicted: number; sharedEnergyActual: number | null; savingsEuro: number | null }>;
  summary: { totalSavingsEuro: number; avgAccuracyPct: number; activeModels: number; recommendationsFollowed: number; recommendationsTotal: number; sharedEnergyImprovementPct: number };
}

const APPLIANCE_ICONS: Record<string, string> = { washing_machine: "🫧", dishwasher: "🍽️", ev_charger: "🔌", hvac: "❄️" };

export default function AiOptimizationPage() {
  const [data, setData] = useState<OptimizationDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai-optimization")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">🧠 Motore di Ottimizzazione AI</h1>
        <p className="text-zinc-600 mt-1">Raccomandazioni ML per massimizzare l&apos;energia condivisa e gli incentivi GSE</p>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Risparmio totale", value: `€${data.summary.totalSavingsEuro}`, icon: TrendingUp, color: "text-green-600" },
            { label: "Accuratezza modelli", value: `${data.summary.avgAccuracyPct}%`, icon: Brain, color: "text-purple-600" },
            { label: "Modelli attivi", value: data.summary.activeModels, icon: Zap, color: "text-amber-600" },
            { label: "Miglioramento condivisa", value: `+${data.summary.sharedEnergyImprovementPct}%`, icon: Lightbulb, color: "text-blue-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-sm text-zinc-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {data?.todayRecommendations && data.todayRecommendations.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">💡 Raccomandazioni di Oggi</h2>
          <div className="space-y-3">
            {data.todayRecommendations.slice(0, 8).map((rec) => (
              <div key={rec.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-2xl">{APPLIANCE_ICONS[rec.applianceType || ""] || "⚡"}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-zinc-900">{rec.title}</h3>
                  <p className="text-sm text-zinc-600 mt-0.5">{rec.message}</p>
                  <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                    <span>🕐 {rec.suggestedStart}–{rec.suggestedEnd}</span>
                    <span>💰 €{rec.potentialSavingsEuro}/giorno</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${rec.status === "followed" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>{rec.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.models && data.models.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Modelli ML</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.models.map((model) => (
              <div key={model.id} className="p-4 border border-zinc-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize">{model.modelType} — {model.targetType.replace("_", " ")}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${model.status === "active" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}>{model.status}</span>
                </div>
                {model.metrics && (
                  <div className="flex gap-4 mt-2 text-sm text-zinc-500">
                    <span>MAPE: {model.metrics.mape}%</span>
                    <span>R²: {model.metrics.r2}</span>
                    <span>Dati: {model.dataPointCount}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.optimizationResults && data.optimizationResults.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📈 Risultati Ottimizzazione (Ultimi 30 giorni)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-zinc-200">
                <th className="text-left py-2 text-zinc-500">Data</th>
                <th className="text-right py-2 text-zinc-500">Previsto kWh</th>
                <th className="text-right py-2 text-zinc-500">Effettivo kWh</th>
                <th className="text-right py-2 text-zinc-500">Condivisa prevista</th>
                <th className="text-right py-2 text-zinc-500">Risparmio €</th>
              </tr></thead>
              <tbody className="divide-y divide-zinc-100">
                {data.optimizationResults.slice(0, 10).map((r) => (
                  <tr key={r.date}>
                    <td className="py-2">{r.date}</td>
                    <td className="py-2 text-right">{r.predictedKwh}</td>
                    <td className="py-2 text-right">{r.actualKwh ?? "—"}</td>
                    <td className="py-2 text-right">{r.sharedEnergyPredicted}</td>
                    <td className="py-2 text-right font-medium text-green-600">{r.savingsEuro != null ? `€${r.savingsEuro}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
