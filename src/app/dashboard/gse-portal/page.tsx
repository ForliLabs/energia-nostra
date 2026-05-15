"use client";

import { CheckCircle, Clock, AlertTriangle, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StatsSkeleton } from "@/components/ui/skeleton";

interface GsePortalDashboard {
  submissions: Array<{ id: string; period: string; type: string; status: string; submissionRef: string | null; attempts: number; confirmedAt: string | null; errorDetails: string | null; createdAt: string }>;
  reconciliations: Array<{ id: string; period: string; platformIncentive: number; gseIncentive: number; discrepancyEuro: number; discrepancyPct: number; status: string }>;
  summary: { totalSubmissions: number; successfulSubmissions: number; pendingSubmissions: number; failedSubmissions: number; successRate: number; totalDiscrepanciesEuro: number; unresolvedDiscrepancies: number; avgProcessingMinutes: number };
}

function GsePortalSkeleton() {
  return (
    <div className="space-y-6">
      <StatsSkeleton count={4} />
      <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
        <Skeleton className="h-6 w-44 mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    </div>
  );
}

export default function GsePortalPage() {
  const [data, setData] = useState<GsePortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/gse-portal");
      if (!r.ok) throw new Error(`Errore ${r.status}`);
      setData(await r.json());
    } catch (e) {
      setError((e as Error).message || "Impossibile caricare i dati del portale GSE.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  if (loading) return <GsePortalSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="GSE" title="Portale GSE Automatizzato" description="Invio automatico report, sincronizzazione dati e riconciliazione incentivi" />
        <FetchError
          title="Impossibile caricare i dati del portale GSE"
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
        eyebrow="GSE"
        title="Portale GSE Automatizzato"
        description="Invio automatico report, sincronizzazione dati e riconciliazione incentivi"
      />

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Invii totali", value: data.summary.totalSubmissions, icon: Upload, color: "text-lime-600" },
            { label: "Tasso successo", value: `${data.summary.successRate}%`, icon: CheckCircle, color: "text-lime-700" },
            { label: "Discrepanze aperte", value: data.summary.unresolvedDiscrepancies, icon: AlertTriangle, color: "text-amber-600" },
            { label: "Tempo medio invio", value: `${data.summary.avgProcessingMinutes} min`, icon: Clock, color: "text-amber-700" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-2"><stat.icon className={`h-5 w-5 ${stat.color}`} /><span className="text-sm text-zinc-500">{stat.label}</span></div>
              <p className="text-2xl font-bold text-zinc-950 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {data?.submissions && data.submissions.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Storico Invii</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-200">
              <th className="text-left py-2 text-zinc-500">Periodo</th>
              <th className="text-left py-2 text-zinc-500">Tipo</th>
              <th className="text-left py-2 text-zinc-500">Stato</th>
              <th className="text-left py-2 text-zinc-500">Riferimento</th>
              <th className="text-right py-2 text-zinc-500">Tentativi</th>
              <th className="text-left py-2 text-zinc-500">Confermato</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {data.submissions.slice(0, 12).map((s) => (
                <tr key={s.id}>
                  <td className="py-2 font-semibold text-zinc-900">{s.period}</td>
                  <td className="py-2">{s.type}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${s.status === "submitted" || s.status === "confirmed" ? "bg-lime-100 text-lime-700" : s.status === "error" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{s.status}</span>
                  </td>
                  <td className="py-2 font-mono text-xs">{s.submissionRef || "—"}</td>
                  <td className="py-2 text-right">{s.attempts}</td>
                  <td className="py-2 text-zinc-500">{s.confirmedAt ? new Date(s.confirmedAt).toLocaleDateString("it-IT") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.reconciliations && data.reconciliations.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Riconciliazione Incentivi</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-200">
              <th className="text-left py-2 text-zinc-500">Periodo</th>
              <th className="text-right py-2 text-zinc-500">Piattaforma €</th>
              <th className="text-right py-2 text-zinc-500">GSE €</th>
              <th className="text-right py-2 text-zinc-500">Discrepanza</th>
              <th className="text-left py-2 text-zinc-500">Stato</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {data.reconciliations.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 font-semibold text-zinc-900">{r.period}</td>
                  <td className="py-2 text-right">€{r.platformIncentive.toFixed(2)}</td>
                  <td className="py-2 text-right">€{r.gseIncentive.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <span className={r.discrepancyEuro > 10 ? "text-red-600 font-semibold" : "text-lime-700"}>€{r.discrepancyEuro.toFixed(2)} ({r.discrepancyPct}%)</span>
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === "matched" ? "bg-lime-100 text-lime-700" : r.status === "resolved" ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-600"}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

