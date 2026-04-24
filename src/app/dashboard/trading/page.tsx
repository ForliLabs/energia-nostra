"use client";

import { ArrowRightLeft, Coins, HandCoins, Package, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import type { TradeOffer, TradeRecord, TradingStats } from "@/lib/trading";

interface TradingResponse {
  stats: TradingStats;
  offers: TradeOffer[];
  recentTrades: TradeRecord[];
}

const formatCurrency = (value: number, digits = 0) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

const statusClasses: Record<string, string> = {
  open: "bg-lime-100 text-lime-800",
  pending: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  matched: "bg-sky-100 text-sky-700",
};

const statusLabels: Record<string, string> = {
  open: "Attiva",
  pending: "In elaborazione",
  completed: "Completato",
  matched: "Abbinata",
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("it-IT");

export default function TradingPage() {
  const [dashboard, setDashboard] = useState<TradingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      try {
        const response = await fetch("/api/trading");
        if (!response.ok) {
          throw new Error("Impossibile recuperare i dati di trading.");
        }
        const data = (await response.json()) as TradingResponse;
        if (active) {
          setDashboard(data);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Impossibile caricare il trading energia P2P.");
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

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-lg shadow-amber-100/40">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Mercato interno CER</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Trading Energia P2P</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          Monitora offerte attive, scambi recenti e volumi economici del mercato peer-to-peer della comunità.
        </p>
      </section>

      {loading && !dashboard && <p className="text-sm text-zinc-500">Caricamento...</p>}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {dashboard && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Package className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Offerte totali</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{dashboard.stats.totalOffers}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <HandCoins className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Offerte attive</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{dashboard.stats.activeOffers}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <ArrowRightLeft className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Trade totali</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{dashboard.stats.totalTrades}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <TrendingUp className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">kWh scambiati</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{dashboard.stats.totalKwhTraded.toLocaleString("it-IT")}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Wallet className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Volume totale</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{formatCurrency(dashboard.stats.totalVolumeEuro)}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Coins className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Prezzo medio</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{formatCurrency(dashboard.stats.avgPricePerKwh, 3)}</p>
              <p className="mt-1 text-xs text-zinc-500">per kWh</p>
            </div>
          </div>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <HandCoins className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Offerte attive</h2>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full divide-y divide-amber-100 text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">Venditore</th>
                    <th className="pb-3 pr-4 font-semibold">Energia</th>
                    <th className="pb-3 pr-4 font-semibold">Prezzo</th>
                    <th className="pb-3 pr-4 font-semibold">Validità</th>
                    <th className="pb-3 font-semibold">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {dashboard.offers.map((offer) => (
                    <tr key={offer.id}>
                      <td className="py-4 pr-4 font-semibold text-zinc-950">{offer.sellerName}</td>
                      <td className="py-4 pr-4 text-zinc-700">{offer.kwh.toLocaleString("it-IT")} kWh</td>
                      <td className="py-4 pr-4 text-zinc-700">{formatCurrency(offer.pricePerKwh, 3)} / kWh</td>
                      <td className="py-4 pr-4 text-zinc-600">
                        {formatDate(offer.validFrom)} - {formatDate(offer.validTo)}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClasses[offer.status] ?? "bg-amber-100 text-amber-800"}`}>
                          {statusLabels[offer.status] ?? offer.status}
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
              <ArrowRightLeft className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">Trade recenti</h2>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full divide-y divide-amber-100 text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">Data</th>
                    <th className="pb-3 pr-4 font-semibold">Venditore</th>
                    <th className="pb-3 pr-4 font-semibold">Acquirente</th>
                    <th className="pb-3 pr-4 font-semibold">kWh</th>
                    <th className="pb-3 pr-4 font-semibold">Prezzo</th>
                    <th className="pb-3 pr-4 font-semibold">Volume</th>
                    <th className="pb-3 font-semibold">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {dashboard.recentTrades.map((trade) => (
                    <tr key={trade.id}>
                      <td className="py-4 pr-4 text-zinc-600">{formatDate(trade.createdAt)}</td>
                      <td className="py-4 pr-4 font-semibold text-zinc-950">{trade.sellerName}</td>
                      <td className="py-4 pr-4 text-zinc-700">{trade.buyerName}</td>
                      <td className="py-4 pr-4 text-zinc-700">{trade.kwhTraded.toLocaleString("it-IT")}</td>
                      <td className="py-4 pr-4 text-zinc-700">{formatCurrency(trade.pricePerKwh, 3)} / kWh</td>
                      <td className="py-4 pr-4 font-semibold text-lime-700">{formatCurrency(trade.totalEuro)}</td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClasses[trade.status] ?? "bg-amber-100 text-amber-800"}`}>
                          {statusLabels[trade.status] ?? trade.status}
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
