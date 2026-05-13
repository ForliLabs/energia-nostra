"use client";

import { AlertCircle, Building, CheckCircle, CreditCard, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

interface PaymentRecord {
  id: string;
  invoiceNumber: string;
  memberName: string;
  provider: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
}

interface PaymentStats {
  totalCollected: number;
  totalPending: number;
  totalFailed: number;
  paymentCount: number;
  successRate: number;
  byProvider: { provider: string; count: number; total: number }[];
  byMonth: { month: string; collected: number; count: number }[];
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/payments?includeStats=true");
        const data = (await response.json()) as { error?: string; payments?: PaymentRecord[]; stats?: PaymentStats };
        if (!response.ok) {
          throw new Error(data.error || "Impossibile caricare i pagamenti.");
        }
        setPayments(data.payments || []);
        setStats(data.stats || null);
      } catch (caughtError) {
        setError((caughtError as Error).message);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-amber-600 animate-spin" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "succeeded":
        return "Completato";
      case "failed":
        return "Fallito";
      case "pending":
        return "In attesa";
      case "processing":
        return "In elaborazione";
      case "refunded":
        return "Rimborsato";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pagamenti CER"
        title="Canali di incasso e riconciliazione"
        description="Tieni insieme Stripe, PagoPA e storico incassi in un'unica vista, con performance migliori grazie a un solo caricamento dati per pagina."
      />

      {loading ? <p className="text-sm text-zinc-500">Caricamento pagamenti...</p> : null}
      {error ? <EmptyState title="Impossibile caricare i pagamenti" description={error} /> : null}

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-lime-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-50 p-2.5"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-zinc-500">Incassato</p>
                <p className="text-xl font-bold text-lime-950">€{stats.totalCollected.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2.5"><RefreshCw className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-sm text-zinc-500">In attesa</p>
                <p className="text-xl font-bold text-lime-950">€{stats.totalPending.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-red-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-2.5"><AlertCircle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-sm text-zinc-500">Falliti</p>
                <p className="text-xl font-bold text-lime-950">€{stats.totalFailed.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-lime-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-lime-50 p-2.5"><CheckCircle className="h-5 w-5 text-lime-600" /></div>
              <div>
                <p className="text-sm text-zinc-500">Tasso successo</p>
                <p className="text-xl font-bold text-lime-950">{stats.successRate}%</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-lime-100 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-lime-600" />
              <h2 className="text-lg font-semibold text-lime-950">Stripe</h2>
            </div>
            <p className="mb-3 text-sm text-zinc-500">Pagamenti con carta di credito e addebito diretto SEPA per membri privati.</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Carte</span><span className="font-medium">Visa, Mastercard, Amex</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">SEPA</span><span className="font-medium">Addebito diretto ricorrente</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Stato</span><span className={`font-medium ${process.env.NEXT_PUBLIC_STRIPE_KEY ? "text-green-600" : "text-amber-600"}`}>{process.env.NEXT_PUBLIC_STRIPE_KEY ? "Attivo" : "Demo"}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-lime-100 bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <Building className="h-5 w-5 text-lime-600" />
              <h2 className="text-lg font-semibold text-lime-950">PagoPA</h2>
            </div>
            <p className="mb-3 text-sm text-zinc-500">Avvisi di pagamento per enti pubblici e PA che partecipano alla CER.</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">IUV</span><span className="font-medium">Generazione automatica</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">QR Code</span><span className="font-medium">Avviso con codice QR</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Ricevuta</span><span className="font-medium">RT automatica</span></div>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-lime-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-lime-950">Ripartizione provider</h2>
          {stats && stats.byProvider.length > 0 ? (
            <div className="mt-4 space-y-3">
              {stats.byProvider.map((provider) => (
                <div key={provider.provider} className="rounded-2xl bg-lime-50/70 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-zinc-950 capitalize">{provider.provider}</span>
                    <span className="text-zinc-600">{provider.count} movimenti</span>
                  </div>
                  <p className="mt-1 text-zinc-600">Totale incassato €{provider.total.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">I provider compariranno qui appena verranno registrati i primi incassi.</p>
          )}

          {stats && stats.byMonth.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-950">Storico mensile</h3>
              <div className="mt-3 space-y-2 text-sm text-zinc-600">
                {stats.byMonth.slice(-4).map((month) => (
                  <div key={month.month} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-lime-100">
                    <span>{month.month}</span>
                    <span>{month.count} pagamenti · €{month.collected.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <div className="rounded-2xl border border-lime-100 bg-white">
        <div className="border-b border-lime-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-lime-950">Storico pagamenti</h2>
        </div>
        <div className="overflow-x-auto">
          {payments.length === 0 ? (
            <div className="px-6 py-10">
              <EmptyState
                title="Nessun pagamento registrato"
                description="I pagamenti appariranno qui quando le fatture verranno saldate o quando simulerai il primo incasso dalla sezione fatturazione."
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-500">
                  <th className="px-6 py-3 font-medium">Fattura</th>
                  <th className="px-6 py-3 font-medium">Membro</th>
                  <th className="px-6 py-3 font-medium">Provider</th>
                  <th className="px-6 py-3 font-medium">Importo</th>
                  <th className="px-6 py-3 font-medium">Stato</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-zinc-50 hover:bg-lime-50/50">
                    <td className="px-6 py-3 font-medium text-lime-950">{payment.invoiceNumber}</td>
                    <td className="px-6 py-3">{payment.memberName}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium">
                        {payment.provider === "stripe" ? <CreditCard className="h-3 w-3" /> : <Building className="h-3 w-3" />}
                        {payment.provider}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium">€{payment.amount.toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        {statusIcon(payment.status)}
                        <span className="text-xs">{statusLabel(payment.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3 text-zinc-500">{new Date(payment.createdAt).toLocaleDateString("it-IT")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
