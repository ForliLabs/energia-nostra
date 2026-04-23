"use client";

import { useCallback, useEffect, useState } from "react";
import type { InvoiceRecord, BillingStats } from "@/lib/billing";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

const statusClasses: Record<string, string> = {
  emessa: "bg-amber-100 text-amber-800",
  pagata: "bg-lime-100 text-lime-800",
  scaduta: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  emessa: "Emessa",
  pagata: "Pagata",
  scaduta: "Scaduta",
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "emessa" | "pagata" | "scaduta">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = (await res.json()) as { invoices: InvoiceRecord[]; stats: BillingStats };
      setInvoices(data.invoices);
      setStats(data.stats);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-paid", invoiceId }),
      });
      if (res.ok) {
        loadData();
      }
    } catch {
      // ignore
    }
  };

  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Fatturazione e pagamenti</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
          Gestione finanziaria della CER
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          Prospetti economici mensili, stato pagamenti, e dettaglio per singolo membro con breakdown incentivi, risparmi e quota associativa.
        </p>
      </section>

      {loading && <p className="text-sm text-zinc-500">Caricamento dati finanziari...</p>}

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Totale fatturato</p>
            <p className="mt-2 text-3xl font-bold text-zinc-950">{formatCurrency(stats.totalInvoiced)}</p>
            <p className="mt-1 text-xs text-zinc-500">{stats.invoiceCount} fatture emesse</p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Incassato</p>
            <p className="mt-2 text-3xl font-bold text-lime-700">{formatCurrency(stats.totalPaid)}</p>
            <p className="mt-1 text-xs text-zinc-500">{stats.paidCount} pagamenti ricevuti</p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Scaduto</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{formatCurrency(stats.totalOverdue)}</p>
            <p className="mt-1 text-xs text-zinc-500">{stats.overdueCount} fatture scadute</p>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Tasso incasso</p>
            <p className="mt-2 text-3xl font-bold text-zinc-950">{stats.collectionRate.toFixed(0)}%</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full rounded-full bg-lime-500" style={{ width: `${stats.collectionRate}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "emessa", "pagata", "scaduta"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === f
                ? "bg-lime-600 text-white"
                : "border border-lime-200 bg-white text-zinc-700 hover:bg-lime-50"
            }`}
          >
            {f === "all" ? "Tutte" : statusLabels[f]} ({f === "all" ? invoices.length : invoices.filter((i) => i.status === f).length})
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <h2 className="text-2xl font-bold text-zinc-950">Elenco fatture</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-lime-100 text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="pb-3 pr-4 font-semibold">N. Fattura</th>
                  <th className="pb-3 pr-4 font-semibold">Membro</th>
                  <th className="pb-3 pr-4 font-semibold">Periodo</th>
                  <th className="pb-3 pr-4 font-semibold">Importo</th>
                  <th className="pb-3 pr-4 font-semibold">Stato</th>
                  <th className="pb-3 font-semibold">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lime-50">
                {filtered.slice(0, 20).map((inv) => (
                  <tr key={inv.id} className="cursor-pointer hover:bg-lime-50/50" onClick={() => setSelectedInvoice(inv)}>
                    <td className="py-3 pr-4 font-mono text-xs text-zinc-600">{inv.invoiceNumber}</td>
                    <td className="py-3 pr-4 font-semibold text-zinc-950">{inv.memberName}</td>
                    <td className="py-3 pr-4 text-zinc-600">{inv.period}</td>
                    <td className="py-3 pr-4 font-semibold text-zinc-950">{formatCurrency(inv.amountEuro)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[inv.status] || ""}`}>
                        {statusLabels[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {inv.status !== "pagata" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkPaid(inv.id); }}
                          className="text-xs font-semibold text-lime-700 hover:underline"
                        >
                          Segna pagata
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {selectedInvoice && (
          <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
            <h2 className="text-2xl font-bold text-zinc-950">Dettaglio fattura</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-amber-50/70 p-4">
                <p className="text-sm font-semibold text-zinc-700">N. {selectedInvoice.invoiceNumber}</p>
                <p className="mt-1 text-sm text-zinc-600">{selectedInvoice.memberName}</p>
                <p className="mt-1 text-xs text-zinc-500">Periodo: {selectedInvoice.period}</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-zinc-950">Dettaglio importi</h3>
                <div className="flex justify-between rounded-xl bg-lime-50 p-3 text-sm">
                  <span className="text-zinc-600">Incentivo GSE</span>
                  <span className="font-semibold text-lime-700">+{formatCurrency(selectedInvoice.breakdown.incentiveEuro)}</span>
                </div>
                <div className="flex justify-between rounded-xl bg-lime-50 p-3 text-sm">
                  <span className="text-zinc-600">Risparmio bolletta</span>
                  <span className="font-semibold text-lime-700">+{formatCurrency(selectedInvoice.breakdown.savingsEuro)}</span>
                </div>
                <div className="flex justify-between rounded-xl bg-red-50 p-3 text-sm">
                  <span className="text-zinc-600">Quota associativa</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(selectedInvoice.breakdown.membershipFeeEuro)}</span>
                </div>
                <div className="flex justify-between rounded-xl border-2 border-lime-200 bg-white p-3 text-sm">
                  <span className="font-bold text-zinc-950">Netto a favore del membro</span>
                  <span className="text-xl font-bold text-lime-700">{formatCurrency(selectedInvoice.breakdown.netAmountEuro)}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-zinc-600">
                <p><strong>Scadenza:</strong> {selectedInvoice.dueDate}</p>
                {selectedInvoice.paidAt && <p><strong>Pagato il:</strong> {selectedInvoice.paidAt}</p>}
                <p>
                  <strong>Stato:</strong>{" "}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses[selectedInvoice.status]}`}>
                    {statusLabels[selectedInvoice.status]}
                  </span>
                </p>
              </div>

              {selectedInvoice.status !== "pagata" && (
                <button
                  onClick={() => handleMarkPaid(selectedInvoice.id)}
                  className="w-full rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700"
                >
                  Registra pagamento
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
