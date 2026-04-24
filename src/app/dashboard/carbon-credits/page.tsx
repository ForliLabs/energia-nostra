"use client";

import { Coins, Leaf, ShoppingCart, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import type { CarbonDashboard } from "@/lib/carbon-credits";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

const statusClasses: Record<string, string> = {
  available: "bg-lime-100 text-lime-800",
  sold: "bg-amber-100 text-amber-800",
  retired: "bg-zinc-100 text-zinc-700",
  completed: "bg-lime-100 text-lime-800",
};

const statusLabels: Record<string, string> = {
  available: "Disponibile",
  sold: "Venduto",
  retired: "Ritirato",
  completed: "Completata",
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("it-IT");

export default function CarbonCreditsPage() {
  const [dashboard, setDashboard] = useState<CarbonDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      try {
        const response = await fetch("/api/carbon-credits");
        if (!response.ok) {
          throw new Error("Impossibile recuperare i crediti carbonio.");
        }
        const data = (await response.json()) as CarbonDashboard;
        if (active) {
          setDashboard(data);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Impossibile caricare il dashboard crediti carbonio.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const maxMonthlyAvoidance = Math.max(...(dashboard?.monthlyAvoidance.map((month) => month.co2Kg) ?? [1]));

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Valorizzazione ambientale</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Crediti Carbonio</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          Dashboard ambientale con CO₂ evitata, crediti disponibili, storico transazioni e valorizzazione economica della CER.
        </p>
      </section>

      {loading && !dashboard && <p className="text-sm text-zinc-500">Caricamento...</p>}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {dashboard && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Leaf className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">CO₂ evitata</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{dashboard.totalCo2Avoided.toLocaleString("it-IT")} t</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Coins className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Crediti disponibili</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{dashboard.creditsAvailable.toLocaleString("it-IT")} t</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <ShoppingCart className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Crediti venduti</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{dashboard.creditsSold}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Wallet className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Ricavi</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{formatCurrency(dashboard.totalRevenueEuro)}</p>
            </div>
          </div>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Leaf className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Andamento mensile CO₂ evitata</h2>
            </div>
            <div className="mt-6 space-y-4">
              {dashboard.monthlyAvoidance.map((month) => (
                <div key={month.month} className="grid gap-3 md:grid-cols-[120px_1fr_100px] md:items-center">
                  <p className="text-sm font-semibold text-zinc-700">{month.month}</p>
                  <div className="h-4 overflow-hidden rounded-full bg-amber-100">
                    <div
                      className="h-full rounded-full bg-lime-500"
                      style={{ width: `${(month.co2Kg / maxMonthlyAvoidance) * 100}%` }}
                    />
                  </div>
                  <p className="text-right text-sm font-medium text-zinc-600">{month.co2Kg.toLocaleString("it-IT")} kg</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Portafoglio crediti</h2>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full divide-y divide-amber-100 text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">Vintage</th>
                    <th className="pb-3 pr-4 font-semibold">CER</th>
                    <th className="pb-3 pr-4 font-semibold">Tonnellate</th>
                    <th className="pb-3 pr-4 font-semibold">Prezzo</th>
                    <th className="pb-3 font-semibold">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {dashboard.credits.map((credit) => (
                    <tr key={credit.id}>
                      <td className="py-4 pr-4 font-semibold text-zinc-950">{credit.vintage}</td>
                      <td className="py-4 pr-4 text-zinc-700">{credit.cerName}</td>
                      <td className="py-4 pr-4 text-zinc-700">{credit.co2Tonnes.toLocaleString("it-IT")} t</td>
                      <td className="py-4 pr-4 text-zinc-700">
                        {credit.pricePerTonne ? `${formatCurrency(credit.pricePerTonne)} / t` : "—"}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClasses[credit.status] ?? "bg-amber-100 text-amber-800"}`}>
                          {statusLabels[credit.status] ?? credit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Transazioni recenti</h2>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full divide-y divide-amber-100 text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">Data</th>
                    <th className="pb-3 pr-4 font-semibold">Acquirente</th>
                    <th className="pb-3 pr-4 font-semibold">Tipo</th>
                    <th className="pb-3 pr-4 font-semibold">Tonnellate</th>
                    <th className="pb-3 pr-4 font-semibold">Totale</th>
                    <th className="pb-3 font-semibold">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {dashboard.recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="py-4 pr-4 text-zinc-600">{formatDate(transaction.createdAt)}</td>
                      <td className="py-4 pr-4 font-semibold text-zinc-950">{transaction.buyerName}</td>
                      <td className="py-4 pr-4 text-zinc-700">{transaction.buyerType}</td>
                      <td className="py-4 pr-4 text-zinc-700">{transaction.tonnes.toLocaleString("it-IT")} t</td>
                      <td className="py-4 pr-4 font-semibold text-lime-700">{formatCurrency(transaction.totalEuro)}</td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClasses[transaction.status] ?? "bg-amber-100 text-amber-800"}`}>
                          {statusLabels[transaction.status] ?? transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
