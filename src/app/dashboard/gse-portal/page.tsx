"use client";

import { CheckCircle, Clock, AlertTriangle, FileCheck, BarChart3, Upload } from "lucide-react";
import { useEffect, useState } from "react";

interface GsePortalDashboard {
  submissions: Array<{ id: string; period: string; type: string; status: string; submissionRef: string | null; attempts: number; confirmedAt: string | null; errorDetails: string | null; createdAt: string }>;
  reconciliations: Array<{ id: string; period: string; platformIncentive: number; gseIncentive: number; discrepancyEuro: number; discrepancyPct: number; status: string }>;
  summary: { totalSubmissions: number; successfulSubmissions: number; pendingSubmissions: number; failedSubmissions: number; successRate: number; totalDiscrepanciesEuro: number; unresolvedDiscrepancies: number; avgProcessingMinutes: number };
}

export default function GsePortalPage() {
  const [data, setData] = useState<GsePortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gse-portal")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">📄 Portale GSE Automatizzato</h1>
        <p className="text-zinc-600 mt-1">Invio automatico report, sincronizzazione dati e riconciliazione incentivi</p>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Invii totali", value: data.summary.totalSubmissions, icon: Upload, color: "text-blue-600" },
            { label: "Tasso successo", value: `${data.summary.successRate}%`, icon: CheckCircle, color: "text-green-600" },
            { label: "Discrepanze aperte", value: data.summary.unresolvedDiscrepancies, icon: AlertTriangle, color: "text-amber-600" },
            { label: "Tempo medio invio", value: `${data.summary.avgProcessingMinutes} min`, icon: Clock, color: "text-purple-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2"><stat.icon className={`h-5 w-5 ${stat.color}`} /><span className="text-sm text-zinc-500">{stat.label}</span></div>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {data?.submissions && data.submissions.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📤 Storico Invii</h2>
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
                  <td className="py-2 font-medium">{s.period}</td>
                  <td className="py-2">{s.type}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${s.status === "submitted" || s.status === "confirmed" ? "bg-green-100 text-green-700" : s.status === "error" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{s.status}</span>
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
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">🔄 Riconciliazione Incentivi</h2>
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
                  <td className="py-2 font-medium">{r.period}</td>
                  <td className="py-2 text-right">€{r.platformIncentive.toFixed(2)}</td>
                  <td className="py-2 text-right">€{r.gseIncentive.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <span className={r.discrepancyEuro > 10 ? "text-red-600 font-medium" : "text-green-600"}>€{r.discrepancyEuro.toFixed(2)} ({r.discrepancyPct}%)</span>
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === "matched" ? "bg-green-100 text-green-700" : r.status === "resolved" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
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
