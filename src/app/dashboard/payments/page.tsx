"use client";

import { useEffect, useState } from "react";
import { CreditCard, Building, RefreshCw, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

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
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/payments").then(r => r.json()),
      fetch("/api/payments?view=stats").then(r => r.json()),
    ]).then(([paymentsData, statsData]) => {
      setPayments(paymentsData.payments || []);
      setStats(statsData.stats || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case "succeeded": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed": return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <RefreshCw className="h-4 w-4 text-amber-600 animate-spin" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "succeeded": return "Completato";
      case "failed": return "Fallito";
      case "pending": return "In attesa";
      case "processing": return "In elaborazione";
      case "refunded": return "Rimborsato";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-lime-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-lime-950">Pagamenti</h1>
        <p className="text-zinc-500 mt-1">Gestione pagamenti Stripe e PagoPA per la CER.</p>
      </div>

      {/* Stats Cards */}
      {stats && (
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
                <p className="text-sm text-zinc-500">In Attesa</p>
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
                <p className="text-sm text-zinc-500">Tasso Successo</p>
                <p className="text-xl font-bold text-lime-950">{stats.successRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-lime-100 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-5 w-5 text-lime-600" />
            <h2 className="text-lg font-semibold text-lime-950">Stripe</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-3">
            Pagamenti con carta di credito e addebito diretto SEPA per membri privati.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Carte</span><span className="font-medium">Visa, Mastercard, Amex</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">SEPA</span><span className="font-medium">Addebito diretto ricorrente</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Stato</span>
              <span className={`font-medium ${process.env.NEXT_PUBLIC_STRIPE_KEY ? "text-green-600" : "text-amber-600"}`}>
                {process.env.NEXT_PUBLIC_STRIPE_KEY ? "Attivo" : "Demo"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-lime-100 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building className="h-5 w-5 text-lime-600" />
            <h2 className="text-lg font-semibold text-lime-950">PagoPA</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-3">
            Avvisi di pagamento per enti pubblici e PA che partecipano alla CER.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">IUV</span><span className="font-medium">Generazione automatica</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">QR Code</span><span className="font-medium">Avviso con codice QR</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Ricevuta</span><span className="font-medium">RT automatica</span></div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-lime-100 bg-white">
        <div className="border-b border-lime-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-lime-950">Storico Pagamenti</h2>
        </div>
        <div className="overflow-x-auto">
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
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
                    Nessun pagamento registrato. I pagamenti appariranno qui quando le fatture verranno saldate.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-50 hover:bg-lime-50/50">
                    <td className="px-6 py-3 font-medium text-lime-950">{p.invoiceNumber}</td>
                    <td className="px-6 py-3">{p.memberName}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium">
                        {p.provider === "stripe" ? <CreditCard className="h-3 w-3" /> : <Building className="h-3 w-3" />}
                        {p.provider}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium">€{p.amount.toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        {statusIcon(p.status)}
                        <span className="text-xs">{statusLabel(p.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3 text-zinc-500">{new Date(p.createdAt).toLocaleDateString("it-IT")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
