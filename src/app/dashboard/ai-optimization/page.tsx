"use client";

import { Brain, Lightbulb, TrendingUp, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StatsSkeleton } from "@/components/ui/skeleton";

interface OptimizationDashboard {
  models: Array<{ id: string; modelType: string; targetType: string; status: string; metrics: { mape: number; rmse: number; r2: number } | null; dataPointCount: number; trainedAt: string | null }>;
  todayRecommendations: Array<{ id: string; memberId: string; title: string; message: string; applianceType: string | null; suggestedStart: string; suggestedEnd: string; potentialSavingsEuro: number; status: string }>;
  optimizationResults: Array<{ date: string; predictedKwh: number; actualKwh: number | null; sharedEnergyPredicted: number; sharedEnergyActual: number | null; savingsEuro: number | null }>;
  summary: { totalSavingsEuro: number; avgAccuracyPct: number; activeModels: number; recommendationsFollowed: number; recommendationsTotal: number; sharedEnergyImprovementPct: number };
}

const APPLIANCE_LABELS: Record<string, string> = { washing_machine: "Lavatrice", dishwasher: "Lavastoviglie", ev_charger: "Carica EV", hvac: "Climatizzatore" };

function AiOptimizationSkeleton() {
  return (
    <div className="space-y-6">
      <StatsSkeleton count={4} />
      <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
        <Skeleton className="h-6 w-56 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    </div>
  );
}

export default function AiOptimizationPage() {
  const [data, setData] = useState<OptimizationDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/ai-optimization");
      if (!r.ok) throw new Error(`Errore ${r.status}`);
      setData(await r.json());
    } catch (e) {
      setError((e as Error).message || "Impossibile caricare i dati di ottimizzazione.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  if (loading) return <AiOptimizationSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="AI" title="Motore di Ottimizzazione AI" description="Raccomandazioni ML per massimizzare l'energia condivisa e gli incentivi GSE" />
        <FetchError
          title="Impossibile caricare i dati di ottimizzazione"
          description="Verifica la connessione e riprova."
          errorDetail={error}
          onRetry={() => { setLoading(true); void fetchData(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI"
        title="Motore di Ottimizzazione AI"
        description="Raccomandazioni ML per massimizzare l'energia condivisa e gli incentivi GSE"
      />

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Risparmio totale", value: `€${data.summary.totalSavingsEuro}`, icon: TrendingUp, color: "text-lime-700" },
            { label: "Accuratezza modelli", value: `${data.summary.avgAccuracyPct}%`, icon: Brain, color: "text-amber-700" },
            { label: "Modelli attivi", value: data.summary.activeModels, icon: Zap, color: "text-amber-600" },
            { label: "Miglioramento condivisa", value: `+${data.summary.sharedEnergyImprovementPct}%`, icon: Lightbulb, color: "text-lime-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-sm text-zinc-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-zinc-950 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {data?.todayRecommendations && data.todayRecommendations.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Raccomandazioni di Oggi</h2>
          <div className="space-y-3">
            {data.todayRecommendations.slice(0, 8).map((rec) => (
              <div key={rec.id} className="flex items-start gap-4 p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
                <span className="text-sm font-medium text-amber-800 bg-amber-100 rounded-xl px-2 py-1 shrink-0">
                  {APPLIANCE_LABELS[rec.applianceType || ""] ?? "Dispositivo"}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900">{rec.title}</h3>
                  <p className="text-sm text-zinc-600 mt-0.5">{rec.message}</p>
                  <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                    <span>{rec.suggestedStart}–{rec.suggestedEnd}</span>
                    <span>€{rec.potentialSavingsEuro}/giorno</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${rec.status === "followed" ? "bg-lime-100 text-lime-700" : "bg-zinc-100 text-zinc-600"}`}>{rec.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.models && data.models.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Modelli ML</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.models.map((model) => (
              <div key={model.id} className="p-4 border border-lime-50 rounded-2xl">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-zinc-900 capitalize">{model.modelType} — {model.targetType.replace("_", " ")}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${model.status === "active" ? "bg-lime-100 text-lime-700" : "bg-zinc-100 text-zinc-600"}`}>{model.status}</span>
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
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Risultati Ottimizzazione — Ultimi 30 giorni</h2>
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
                    <td className="py-2 text-right font-semibold text-lime-700">{r.savingsEuro != null ? `€${r.savingsEuro}` : "—"}</td>
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
