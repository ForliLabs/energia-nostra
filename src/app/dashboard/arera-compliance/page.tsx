"use client";

import { AlertTriangle, Calendar, CheckCircle, Scale, Shield } from "lucide-react";
import { useEffect, useState } from "react";

interface ComplianceDashboard {
  rules: Array<{ id: string; code: string; name: string; category: string; parameter: { key: string; value: number | string; unit: string }; source: string; isActive: boolean }>;
  upcomingDeadlines: Array<{ id: string; title: string; category: string; dueDate: string; daysUntilDue: number; status: string; isOverdue: boolean; urgencyLevel: string }>;
  recentChanges: Array<{ id: string; source: string; title: string; summary: string; publishedAt: string; impactLevel: string; status: string }>;
  complianceScore: number;
  overdueCount: number;
  nextDeadline: { title: string; dueDate: string; daysUntilDue: number } | null;
}

export default function AreraCompliancePage() {
  const [data, setData] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/arera-compliance")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">⚖️ Compliance ARERA</h1>
        <p className="text-zinc-600 mt-1">Motore regolamentare, scadenze e analisi d&apos;impatto normativo</p>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-green-600" /><span className="text-sm text-zinc-500">Score conformità</span></div>
            <p className={`text-2xl font-bold mt-1 ${data.complianceScore >= 80 ? "text-green-600" : data.complianceScore >= 50 ? "text-amber-600" : "text-red-600"}`}>{data.complianceScore}%</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" /><span className="text-sm text-zinc-500">Scadenze mancate</span></div>
            <p className="text-2xl font-bold mt-1">{data.overdueCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-2"><Scale className="h-5 w-5 text-blue-600" /><span className="text-sm text-zinc-500">Regole attive</span></div>
            <p className="text-2xl font-bold mt-1">{data.rules.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-600" /><span className="text-sm text-zinc-500">Prossima scadenza</span></div>
            <p className="text-sm font-medium mt-1">{data.nextDeadline ? `${data.nextDeadline.daysUntilDue}g` : "—"}</p>
          </div>
        </div>
      )}

      {data?.upcomingDeadlines && data.upcomingDeadlines.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📅 Scadenze</h2>
          <div className="space-y-3">
            {data.upcomingDeadlines.map((d) => (
              <div key={d.id} className={`flex items-center justify-between p-3 rounded-lg border ${d.isOverdue ? "bg-red-50 border-red-200" : d.urgencyLevel === "high" ? "bg-amber-50 border-amber-200" : "bg-zinc-50 border-zinc-200"}`}>
                <div className="flex items-center gap-3">
                  {d.isOverdue ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <Calendar className="h-5 w-5 text-zinc-400" />}
                  <div>
                    <span className="font-medium">{d.title}</span>
                    <span className="text-xs text-zinc-500 ml-2">{d.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-500">{new Date(d.dueDate).toLocaleDateString("it-IT")}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.isOverdue ? "bg-red-100 text-red-700" : d.urgencyLevel === "high" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                    {d.isOverdue ? "Scaduta" : `${d.daysUntilDue}g`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.rules && data.rules.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📜 Parametri Regolamentari</h2>
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
                  <td className="py-2 font-medium">{r.name}</td>
                  <td className="py-2 text-amber-700 font-mono">{r.parameter.value} {r.parameter.unit}</td>
                  <td className="py-2 text-xs text-zinc-500">{r.source}</td>
                  <td className="py-2"><CheckCircle className="h-4 w-4 text-green-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.recentChanges && data.recentChanges.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">🔔 Modifiche Normative Recenti</h2>
          <div className="space-y-3">
            {data.recentChanges.map((c) => (
              <div key={c.id} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{c.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.impactLevel === "critical" ? "bg-red-100 text-red-700" : c.impactLevel === "high" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{c.impactLevel}</span>
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
