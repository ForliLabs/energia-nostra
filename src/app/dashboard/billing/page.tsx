"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BillingStats, InvoiceRecord } from "@/lib/billing";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast-provider";

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
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "emessa" | "pagata" | "scaduta">("all");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/invoices");
      const data = (await response.json()) as { error?: string; invoices?: InvoiceRecord[]; stats?: BillingStats };
      if (!response.ok) {
        throw new Error(data.error || "Impossibile caricare la fatturazione.");
      }
      setInvoices(data.invoices || []);
      setStats(data.stats || null);
      setSelectedInvoiceId((current) => current || data.invoices?.[0]?.id || null);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const filteredInvoices = useMemo(
    () => (filter === "all" ? invoices : invoices.filter((invoice) => invoice.status === filter)),
    [filter, invoices],
  );

  const selectedInvoice = useMemo(
    () => filteredInvoices.find((invoice) => invoice.id === selectedInvoiceId) || invoices.find((invoice) => invoice.id === selectedInvoiceId) || null,
    [filteredInvoices, invoices, selectedInvoiceId],
  );

  const runInvoiceAction = async (invoiceId: string, action: "mark-paid" | "simulate" | "pagopa-notice") => {
    setBusyAction(action);
    try {
      const response = await fetch(action === "mark-paid" ? "/api/invoices" : "/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "mark-paid"
            ? { action, invoiceId }
            : action === "simulate"
              ? { action, invoiceId, provider: "stripe" }
              : { action, invoiceId },
        ),
      });
      const data = (await response.json()) as { error?: string; iuv?: string };
      if (!response.ok) {
        throw new Error(data.error || "Azione non completata.");
      }

      if (action === "pagopa-notice") {
        showToast({
          title: "Avviso PagoPA generato",
          description: data.iuv ? `IUV ${data.iuv} pronto per la condivisione con il membro.` : "Avviso creato correttamente.",
          variant: "success",
        });
      } else {
        showToast({
          title: action === "simulate" ? "Pagamento simulato" : "Pagamento registrato",
          description: action === "simulate"
            ? "Lo storico pagamenti è stato aggiornato con l'incasso simulato."
            : "La fattura è stata aggiornata come pagata.",
          variant: "success",
        });
      }

      await loadData();
    } catch (caughtError) {
      showToast({ title: "Operazione non riuscita", description: (caughtError as Error).message, variant: "error" });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Fatturazione e pagamenti"
        title="Gestione finanziaria della CER"
        description="Monitora lo stato delle fatture, registra gli incassi e prepara il membro al canale di pagamento più adatto senza uscire dal dettaglio economico."
      />

      {loading && !stats ? <p className="text-sm text-zinc-500">Caricamento dati finanziari...</p> : null}
      {error && !stats ? (
        <EmptyState
          title="Impossibile caricare la fatturazione"
          description={error}
          action={<button onClick={() => void loadData()} className="rounded-2xl bg-lime-600 px-4 py-2 text-sm font-semibold text-white">Riprova</button>}
        />
      ) : null}

      {stats ? (
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
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(["all", "emessa", "pagata", "scaduta"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === value ? "bg-lime-600 text-white" : "border border-lime-200 bg-white text-zinc-700 hover:bg-lime-50"
            }`}
          >
            {value === "all" ? "Tutte" : statusLabels[value]} ({value === "all" ? invoices.length : invoices.filter((invoice) => invoice.status === value).length})
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm shadow-lime-100/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-zinc-950">Elenco fatture</h2>
              <p className="mt-2 text-sm text-zinc-600">Apri una fattura per vedere il breakdown economico e il prossimo passo di pagamento.</p>
            </div>
            <button onClick={() => void loadData()} className="rounded-2xl border border-lime-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-lime-50">
              Aggiorna
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            {filteredInvoices.length === 0 ? (
              <EmptyState
                title="Nessuna fattura nel filtro selezionato"
                description="Prova a cambiare stato oppure genera il nuovo ciclo di fatturazione dopo la chiusura del periodo energetico."
              />
            ) : (
              <table className="min-w-full divide-y divide-lime-100 text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">N. Fattura</th>
                    <th className="pb-3 pr-4 font-semibold">Membro</th>
                    <th className="pb-3 pr-4 font-semibold">Periodo</th>
                    <th className="pb-3 pr-4 font-semibold">Importo</th>
                    <th className="pb-3 pr-4 font-semibold">Stato</th>
                    <th className="pb-3 font-semibold">Dettaglio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lime-50">
                  {filteredInvoices.slice(0, 20).map((invoice) => (
                    <tr key={invoice.id} className={selectedInvoiceId === invoice.id ? "bg-lime-50/60" : undefined}>
                      <td className="py-3 pr-4 font-mono text-xs text-zinc-600">{invoice.invoiceNumber}</td>
                      <td className="py-3 pr-4 font-semibold text-zinc-950">{invoice.memberName}</td>
                      <td className="py-3 pr-4 text-zinc-600">{invoice.period}</td>
                      <td className="py-3 pr-4 font-semibold text-zinc-950">{formatCurrency(invoice.amountEuro)}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[invoice.status] || ""}`}>
                          {statusLabels[invoice.status] || invoice.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => setSelectedInvoiceId(invoice.id)}
                          className="rounded-xl border border-lime-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-lime-50"
                        >
                          Apri dettaglio
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {selectedInvoice ? (
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

              <div className="rounded-2xl bg-white p-4 ring-1 ring-lime-100">
                <p className="text-sm font-semibold text-zinc-700">Prossimo passo pagamento</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {selectedInvoice.status === "pagata"
                    ? "Pagamento già registrato. Verifica eventuale riconciliazione nel modulo pagamenti."
                    : "Scegli se registrare manualmente l'incasso, simulare il checkout Stripe o preparare l'avviso PagoPA per il membro."}
                </p>
              </div>

              <div className="space-y-2 text-sm text-zinc-600">
                <p><strong>Scadenza:</strong> {selectedInvoice.dueDate}</p>
                {selectedInvoice.paidAt ? <p><strong>Pagato il:</strong> {selectedInvoice.paidAt}</p> : null}
                <p>
                  <strong>Stato:</strong>{" "}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses[selectedInvoice.status]}`}>
                    {statusLabels[selectedInvoice.status]}
                  </span>
                </p>
              </div>

              {selectedInvoice.status !== "pagata" ? (
                <div className="grid gap-3">
                  <button
                    onClick={() => void runInvoiceAction(selectedInvoice.id, "mark-paid")}
                    disabled={busyAction !== null}
                    className="w-full rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-lime-200 transition hover:bg-lime-700 disabled:opacity-60"
                  >
                    {busyAction === "mark-paid" ? "Registrazione..." : "Registra pagamento manuale"}
                  </button>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => void runInvoiceAction(selectedInvoice.id, "simulate")}
                      disabled={busyAction !== null}
                      className="rounded-2xl border border-lime-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-lime-50 disabled:opacity-60"
                    >
                      {busyAction === "simulate" ? "Simulazione..." : "Simula incasso Stripe"}
                    </button>
                    <button
                      onClick={() => void runInvoiceAction(selectedInvoice.id, "pagopa-notice")}
                      disabled={busyAction !== null}
                      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
                    >
                      {busyAction === "pagopa-notice" ? "Creazione avviso..." : "Genera avviso PagoPA"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
