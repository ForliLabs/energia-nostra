"use client";

import { Banknote, FileText, CheckCircle, AlertTriangle, ArrowUpDown, Receipt } from "lucide-react";
import { useEffect, useState } from "react";

interface FinancialDashboard {
  transactions: Array<{ id: string; date: string; description: string; amountEuro: number; direction: string; counterparty: string | null; matchedInvoiceId: string | null; matchConfidence: number | null; status: string }>;
  taxDocuments: Array<{ id: string; memberId: string | null; memberName: string | null; type: string; fiscalYear: number; totalIncome: number | null; totalWithholding: number | null; netAmount: number | null; status: string }>;
  reconciliationRules: Array<{ id: string; name: string; type: string; isActive: boolean }>;
  summary: { totalCredits: number; totalDebits: number; netBalance: number; matchedTransactions: number; unmatchedTransactions: number; matchRate: number; overdueInvoices: number; totalOverdueEuro: number; cuDocumentsGenerated: number; cuDocumentsPending: number };
}

export default function FinancialReconciliationPage() {
  const [data, setData] = useState<FinancialDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/financial-reconciliation")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">💰 Riconciliazione Finanziaria</h1>
        <p className="text-zinc-600 mt-1">Import bancario, matching automatico, CU e bilancio annuale</p>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Saldo netto", value: `€${data.summary.netBalance.toLocaleString("it-IT")}`, icon: Banknote, color: data.summary.netBalance >= 0 ? "text-green-600" : "text-red-600" },
            { label: "Match rate", value: `${data.summary.matchRate}%`, icon: ArrowUpDown, color: "text-blue-600" },
            { label: "Fatture scadute", value: data.summary.overdueInvoices, icon: AlertTriangle, color: "text-amber-600" },
            { label: "CU generati", value: data.summary.cuDocumentsGenerated, icon: FileText, color: "text-purple-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center gap-2"><stat.icon className={`h-5 w-5 ${stat.color}`} /><span className="text-sm text-zinc-500">{stat.label}</span></div>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <span className="text-sm text-zinc-500">Entrate totali</span>
            <p className="text-xl font-bold text-green-600 mt-1">€{data.summary.totalCredits.toLocaleString("it-IT")}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <span className="text-sm text-zinc-500">Uscite totali</span>
            <p className="text-xl font-bold text-red-600 mt-1">€{data.summary.totalDebits.toLocaleString("it-IT")}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <span className="text-sm text-zinc-500">Non matchati</span>
            <p className="text-xl font-bold text-amber-600 mt-1">{data.summary.unmatchedTransactions}</p>
          </div>
        </div>
      )}

      {data?.transactions && data.transactions.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">🏦 Movimenti Bancari</h2>
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
                  <td className={`py-2 text-right font-medium ${t.direction === "credit" ? "text-green-600" : "text-red-600"}`}>
                    {t.direction === "credit" ? "+" : "-"}€{t.amountEuro.toFixed(2)}
                  </td>
                  <td className="py-2">
                    {t.matchConfidence != null ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${t.matchConfidence >= 0.9 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {Math.round(t.matchConfidence * 100)}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${t.status === "confirmed" ? "bg-green-100 text-green-700" : t.status === "matched" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600"}`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.taxDocuments && data.taxDocuments.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📋 Documenti Fiscali</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.taxDocuments.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 border border-zinc-100 rounded-lg">
                <Receipt className="h-6 w-6 text-zinc-400" />
                <div className="flex-1">
                  <span className="font-medium text-sm">{d.type.toUpperCase()} {d.fiscalYear}</span>
                  {d.memberName && <span className="text-xs text-zinc-500 ml-2">· {d.memberName}</span>}
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {d.totalIncome != null && `Lordo: €${d.totalIncome.toFixed(2)}`}
                    {d.netAmount != null && ` · Netto: €${d.netAmount.toFixed(2)}`}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${d.status === "generated" || d.status === "sent" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
