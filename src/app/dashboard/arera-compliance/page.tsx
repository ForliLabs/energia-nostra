"use client";

import { AlertTriangle, Calendar, CheckCircle, Scale, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StatsSkeleton } from "@/components/ui/skeleton";

interface ComplianceDashboard {
  rules: Array<{ id: string; code: string; name: string; category: string; parameter: { key: string; value: number | string; unit: string }; source: string; isActive: boolean }>;
  upcomingDeadlines: Array<{ id: string; title: string; category: string; dueDate: string; daysUntilDue: number; status: string; isOverdue: boolean; urgencyLevel: string }>;
  recentChanges: Array<{ id: string; source: string; title: string; summary: string; publishedAt: string; impactLevel: string; status: string }>;
  complianceScore: number;
  overdueCount: number;
  nextDeadline: { title: string; dueDate: string; daysUntilDue: number } | null;
}

function AreraComplianceSkeleton() {
  return (
    <div className="space-y-6">
      <StatsSkeleton count={4} />
      <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      </div>
    </div>
  );
}

export default function AreraCompliancePage() {
  const [data, setData] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/arera-compliance");
      if (!r.ok) throw new Error(`Errore ${r.status}`);
      setData(await r.json());
    } catch (e) {
      setError((e as Error).message || "Impossibile caricare i dati di compliance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  if (loading) return <AreraComplianceSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Normativa" title="Compliance ARERA" description="Motore regolamentare, scadenze e analisi d'impatto normativo" />
        <FetchError
          title="Impossibile caricare i dati di compliance"
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
        eyebrow="Normativa"
        title="Compliance ARERA"
        description="Motore regolamentare, scadenze e analisi d'impatto normativo"
      />

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-lime-600" /><span className="text-sm text-zinc-500">Score conformità</span></div>
            <p className={`text-2xl font-bold mt-2 ${data.complianceScore >= 80 ? "text-lime-700" : data.complianceScore >= 50 ? "text-amber-600" : "text-red-600"}`}>{data.complianceScore}%</p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" /><span className="text-sm text-zinc-500">Scadenze mancate</span></div>
            <p className="text-2xl font-bold text-zinc-950 mt-2">{data.overdueCount}</p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center gap-2"><Scale className="h-5 w-5 text-amber-600" /><span className="text-sm text-zinc-500">Regole attive</span></div>
            <p className="text-2xl font-bold text-zinc-950 mt-2">{data.rules.length}</p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-amber-500" /><span className="text-sm text-zinc-500">Prossima scadenza</span></div>
            <p className="text-xl font-bold text-zinc-950 mt-2">{data.nextDeadline ? `${data.nextDeadline.daysUntilDue}g` : "—"}</p>
          </div>
        </div>
      )}

      {data?.upcomingDeadlines && data.upcomingDeadlines.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Scadenze</h2>
          <div className="space-y-3">
            {data.upcomingDeadlines.map((d) => (
              <div key={d.id} className={`flex items-center justify-between p-4 rounded-2xl border ${d.isOverdue ? "bg-red-50 border-red-200" : d.urgencyLevel === "high" ? "bg-amber-50 border-amber-200" : "bg-zinc-50 border-zinc-100"}`}>
                <div className="flex items-center gap-3">
                  {d.isOverdue ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <Calendar className="h-5 w-5 text-zinc-400" />}
                  <div>
                    <span className="font-semibold text-zinc-900">{d.title}</span>
                    <span className="text-xs text-zinc-500 ml-2">{d.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-500">{new Date(d.dueDate).toLocaleDateString("it-IT")}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.isOverdue ? "bg-red-100 text-red-700" : d.urgencyLevel === "high" ? "bg-amber-100 text-amber-700" : "bg-lime-100 text-lime-700"}`}>
                    {d.isOverdue ? "Scaduta" : `${d.daysUntilDue}g`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.rules && data.rules.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Parametri Regolamentari</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-200">
              <th className="text-left py-2 text-zinc-500">Parametro</th>
              <th className="text-left py-2 text-zinc-500">Valore</th>
              <th className="text-left py-2 text-zinc-500">Fonte</th>
              <th className="text-left py-2 text-zinc-500">Stato</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {data.rules.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 font-semibold text-zinc-900">{r.name}</td>
                  <td className="py-2 text-amber-700 font-mono">{r.parameter.value} {r.parameter.unit}</td>
                  <td className="py-2 text-xs text-zinc-500">{r.source}</td>
                  <td className="py-2"><CheckCircle className="h-4 w-4 text-lime-600" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.recentChanges && data.recentChanges.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Modifiche Normative Recenti</h2>
          <div className="space-y-3">
            {data.recentChanges.map((c) => (
              <div key={c.id} className="p-4 bg-zinc-50/80 rounded-2xl border border-zinc-100">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-zinc-900">{c.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-3 ${c.impactLevel === "critical" ? "bg-red-100 text-red-700" : c.impactLevel === "high" ? "bg-amber-100 text-amber-700" : "bg-lime-100 text-lime-700"}`}>{c.impactLevel}</span>
                </div>
                <p className="text-sm text-zinc-600 mt-1">{c.summary}</p>
                <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                  <span>Fonte: {c.source}</span>
                  <span>{new Date(c.publishedAt).toLocaleDateString("it-IT")}</span>
                  <span className="capitalize">{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
