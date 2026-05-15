"use client";

import { Banknote, FileText, AlertTriangle, ArrowUpDown, Receipt } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StatsSkeleton } from "@/components/ui/skeleton";

interface FinancialDashboard {
  transactions: Array<{ id: string; date: string; description: string; amountEuro: number; direction: string; counterparty: string | null; matchedInvoiceId: string | null; matchConfidence: number | null; status: string }>;
  taxDocuments: Array<{ id: string; memberId: string | null; memberName: string | null; type: string; fiscalYear: number; totalIncome: number | null; totalWithholding: number | null; netAmount: number | null; status: string }>;
  reconciliationRules: Array<{ id: string; name: string; type: string; isActive: boolean }>;
  summary: { totalCredits: number; totalDebits: number; netBalance: number; matchedTransactions: number; unmatchedTransactions: number; matchRate: number; overdueInvoices: number; totalOverdueEuro: number; cuDocumentsGenerated: number; cuDocumentsPending: number };
}

function FinancialSkeleton() {
  return (
    <div className="space-y-6">
      <StatsSkeleton count={4} />
      <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
        <Skeleton className="h-6 w-48 mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    </div>
  );
}

export default function FinancialReconciliationPage() {
  const [data, setData] = useState<FinancialDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/financial-reconciliation");
      if (!r.ok) throw new Error(`Errore ${r.status}`);
      setData(await r.json());
    } catch (e) {
      setError((e as Error).message || "Impossibile caricare i dati finanziari.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  if (loading) return <FinancialSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Finanza" title="Riconciliazione Finanziaria" description="Import bancario, matching automatico, CU e bilancio annuale" />
        <FetchError
          title="Impossibile caricare i dati finanziari"
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
        eyebrow="Finanza"
        title="Riconciliazione Finanziaria"
        description="Import bancario, matching automatico, CU e bilancio annuale"
      />

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Saldo netto", value: `€${data.summary.netBalance.toLocaleString("it-IT")}`, icon: Banknote, color: data.summary.netBalance >= 0 ? "text-lime-700" : "text-red-600" },
            { label: "Match rate", value: `${data.summary.matchRate}%`, icon: ArrowUpDown, color: "text-amber-600" },
            { label: "Fatture scadute", value: data.summary.overdueInvoices, icon: AlertTriangle, color: "text-amber-700" },
            { label: "CU generati", value: data.summary.cuDocumentsGenerated, icon: FileText, color: "text-lime-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-2"><stat.icon className={`h-5 w-5 ${stat.color}`} /><span className="text-sm text-zinc-500">{stat.label}</span></div>
              <p className="text-2xl font-bold text-zinc-950 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <span className="text-sm text-zinc-500">Entrate totali</span>
            <p className="text-xl font-bold text-lime-700 mt-1">€{data.summary.totalCredits.toLocaleString("it-IT")}</p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <span className="text-sm text-zinc-500">Uscite totali</span>
            <p className="text-xl font-bold text-red-600 mt-1">€{data.summary.totalDebits.toLocaleString("it-IT")}</p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <span className="text-sm text-zinc-500">Non matchati</span>
            <p className="text-xl font-bold text-amber-600 mt-1">{data.summary.unmatchedTransactions}</p>
          </div>
        </div>
      )}

      {data?.transactions && data.transactions.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Movimenti Bancari</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-200">
              <th className="text-left py-2 text-zinc-500">Data</th>
              <th className="text-left py-2 text-zinc-500">Descrizione</th>
              <th className="text-right py-2 text-zinc-500">Importo</th>
              <th className="text-left py-2 text-zinc-500">Match</th>
              <th className="text-left py-2 text-zinc-500">Stato</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {data.transactions.slice(0, 15).map((t) => (
                <tr key={t.id}>
                  <td className="py-2">{new Date(t.date).toLocaleDateString("it-IT")}</td>
                  <td className="py-2 max-w-xs truncate">{t.description}</td>
                  <td className={`py-2 text-right font-semibold ${t.direction === "credit" ? "text-lime-700" : "text-red-600"}`}>
                    {t.direction === "credit" ? "+" : "-"}€{t.amountEuro.toFixed(2)}
                  </td>
                  <td className="py-2">
                    {t.matchConfidence != null ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${t.matchConfidence >= 0.9 ? "bg-lime-100 text-lime-700" : "bg-amber-100 text-amber-700"}`}>
                        {Math.round(t.matchConfidence * 100)}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${t.status === "confirmed" ? "bg-lime-100 text-lime-700" : t.status === "matched" ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-600"}`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.taxDocuments && data.taxDocuments.length > 0 && (
        <div className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-xl font-bold text-zinc-950 mb-5">Documenti Fiscali</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.taxDocuments.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-4 border border-lime-50 rounded-2xl">
                <Receipt className="h-6 w-6 text-zinc-400 shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold text-sm text-zinc-900">{d.type.toUpperCase()} {d.fiscalYear}</span>
                  {d.memberName && <span className="text-xs text-zinc-500 ml-2">· {d.memberName}</span>}
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {d.totalIncome != null && `Lordo: €${d.totalIncome.toFixed(2)}`}
                    {d.netAmount != null && ` · Netto: €${d.netAmount.toFixed(2)}`}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${d.status === "generated" || d.status === "sent" ? "bg-lime-100 text-lime-700" : "bg-amber-100 text-amber-700"}`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

