"use client";

import { ArrowRightLeft, Coins, HandCoins, Package, PlusCircle, TrendingUp, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { TradeOffer, TradeRecord, TradingStats } from "@/lib/trading";
import { EmptyState } from "@/components/ui/empty-state";
import { FetchError } from "@/components/ui/fetch-error";
import { PageHeader } from "@/components/ui/page-header";
import { StatsSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-provider";
import { getMutationHeaders } from "@/hooks/mutation-headers";

interface TradingMember {
  id: string;
  name: string;
  cerId: string;
}

interface TradingAccountSummary {
  memberId: string;
  memberName: string;
  balanceEuro: number;
  totalBought: number;
  totalSold: number;
  totalKwhBought: number;
  totalKwhSold: number;
}

interface TradingResponse {
  stats: TradingStats;
  offers: TradeOffer[];
  recentTrades: TradeRecord[];
  member: TradingMember | null;
  myOffers: TradeOffer[];
  myAccount: TradingAccountSummary | null;
  constraints: { priceFloor: number; priceCeiling: number };
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
  matched: "bg-sky-100 text-sky-700",
  settled: "bg-emerald-100 text-emerald-800",
};

const statusLabels: Record<string, string> = {
  open: "Attiva",
  pending: "In attesa regolamento",
  matched: "Abbinata",
  settled: "Regolata",
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("it-IT");
const formatDateTimeInput = (value: Date) => value.toISOString().slice(0, 16);

const createDefaultOfferForm = () => ({
  kwh: "50",
  pricePerKwh: "0.150",
  validTo: formatDateTimeInput(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
});

export default function TradingPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<TradingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(createDefaultOfferForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/trading");
      const payload = (await response.json()) as TradingResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile caricare il mercato P2P.");
      }
      setData(payload);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const tradableOffers = useMemo(
    () => data?.offers.filter((offer) => offer.sellerId !== data.member?.id) || [],
    [data],
  );

  const createMarketOffer = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/trading", {
        method: "POST",
        headers: getMutationHeaders(),
        body: JSON.stringify({
          action: "create-offer",
          kwh: Number(form.kwh),
          pricePerKwh: Number(form.pricePerKwh),
          validTo: new Date(form.validTo).toISOString(),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile pubblicare l'offerta.");
      }
      showToast({ title: "Offerta pubblicata", description: "Il mercato interno CER è stato aggiornato.", variant: "success" });
      await loadData();
    } catch (caughtError) {
      showToast({ title: "Pubblicazione non riuscita", description: (caughtError as Error).message, variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  const acceptMarketOffer = async (offerId: string) => {
    setBusyOfferId(offerId);
    try {
      const response = await fetch("/api/trading", {
        method: "POST",
        headers: getMutationHeaders(),
        body: JSON.stringify({ action: "accept-offer", offerId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile accettare l'offerta.");
      }
      showToast({ title: "Trade creato", description: "L'offerta è passata in regolamento ed è pronta per la riconciliazione economica.", variant: "success" });
      await loadData();
    } catch (caughtError) {
      showToast({ title: "Trade non creato", description: (caughtError as Error).message, variant: "error" });
    } finally {
      setBusyOfferId(null);
    }
  };

  const guidance = data
    ? `Range CER consigliato ${formatCurrency(data.constraints.priceFloor, 3)}–${formatCurrency(data.constraints.priceCeiling, 3)} / kWh · ${data.stats.activeOffers} offerte aperte.`
    : "";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Mercato interno CER"
        title="Trading Energia P2P"
        description="Il marketplace non è più solo osservabile: pubblica surplus, verifica il prezzo consigliato e accetta le migliori offerte senza uscire dalla dashboard operativa."
        actions={
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-2xl border border-lime-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-lime-50"
          >
            Aggiorna mercato
          </button>
        }
      />

      {loading && !data ? <StatsSkeleton count={4} /> : null}
      {error && !data ? (
        <FetchError
          title="Impossibile caricare il trading"
          description="Verifica la connessione e riprova."
          errorDetail={error}
          onRetry={() => { void loadData(); }}
          retrying={loading}
        />
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-3 text-lime-700"><Package className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Offerte attive</p></div>
              <p className="mt-4 text-3xl font-bold text-zinc-950">{data.stats.activeOffers}</p>
              <p className="mt-1 text-xs text-zinc-500">{data.stats.totalOffers} pubblicate nel periodo</p>
            </div>
            <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-3 text-lime-700"><TrendingUp className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">kWh scambiati</p></div>
              <p className="mt-4 text-3xl font-bold text-zinc-950">{data.stats.totalKwhTraded.toLocaleString("it-IT")}</p>
              <p className="mt-1 text-xs text-zinc-500">{data.stats.totalTrades} trade completati o in regolamento</p>
            </div>
            <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-3 text-lime-700"><Coins className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Prezzo medio</p></div>
              <p className="mt-4 text-3xl font-bold text-zinc-950">{formatCurrency(data.stats.avgPricePerKwh, 3)}</p>
              <p className="mt-1 text-xs text-zinc-500">Confronta con il floor incentivi e il costo rete</p>
            </div>
            <div className="rounded-2xl border border-lime-100 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-3 text-lime-700"><Wallet className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Posizione personale</p></div>
              <p className={`mt-4 text-3xl font-bold ${data.myAccount && data.myAccount.balanceEuro >= 0 ? "text-lime-700" : "text-amber-800"}`}>
                {data.myAccount ? formatCurrency(data.myAccount.balanceEuro) : "—"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{data.member ? data.member.name : "Completa l'associazione membro per operare"}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-3xl border border-amber-200 bg-white/90 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <PlusCircle className="h-5 w-5 text-amber-700" />
                <h2 className="text-2xl font-bold text-zinc-950">Pubblica surplus</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{guidance}</p>
              {!data.member ? (
                <div className="mt-6 rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-4 text-sm text-zinc-700">
                  Il tuo account non è ancora associato a un profilo membro: finché l’associazione non è completata puoi solo monitorare il mercato.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-zinc-700">Energia disponibile (kWh)</span>
                    <input
                      type="number"
                      min="1"
                      value={form.kwh}
                      onChange={(event) => setForm((current) => ({ ...current, kwh: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-zinc-700">Prezzo €/kWh</span>
                    <input
                      type="number"
                      min={data.constraints.priceFloor}
                      max={data.constraints.priceCeiling}
                      step="0.001"
                      value={form.pricePerKwh}
                      onChange={(event) => setForm((current) => ({ ...current, pricePerKwh: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-zinc-700">Valida fino a</span>
                    <input
                      type="datetime-local"
                      value={form.validTo}
                      onChange={(event) => setForm((current) => ({ ...current, validTo: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void createMarketOffer()}
                    disabled={creating}
                    className="w-full rounded-2xl bg-lime-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-lime-700 disabled:opacity-60"
                  >
                    {creating ? "Pubblicazione..." : "Pubblica offerta"}
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <HandCoins className="h-5 w-5 text-lime-700" />
                <h2 className="text-2xl font-bold text-zinc-950">Offerte migliori</h2>
              </div>
              {tradableOffers.length === 0 ? (
                <div className="mt-6"><EmptyState title="Nessuna offerta acquistabile" description="Quando altri membri pubblicheranno energia disponibile, vedrai qui il prezzo migliore e il tempo residuo per accettarla." /></div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full divide-y divide-lime-100 text-sm">
                    <thead>
                      <tr className="text-left text-zinc-500">
                        <th className="pb-3 pr-4 font-semibold">Venditore</th>
                        <th className="pb-3 pr-4 font-semibold">Energia</th>
                        <th className="pb-3 pr-4 font-semibold">Prezzo</th>
                        <th className="pb-3 pr-4 font-semibold">Validità</th>
                        <th className="pb-3 font-semibold">Azione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lime-50">
                      {tradableOffers.map((offer) => (
                        <tr key={offer.id}>
                          <td className="py-4 pr-4 font-semibold text-zinc-950">{offer.sellerName}</td>
                          <td className="py-4 pr-4 text-zinc-700">{offer.kwh.toLocaleString("it-IT")} kWh</td>
                          <td className="py-4 pr-4 font-semibold text-lime-700">{formatCurrency(offer.pricePerKwh, 3)} / kWh</td>
                          <td className="py-4 pr-4 text-zinc-600">{formatDate(offer.validFrom)} – {formatDate(offer.validTo)}</td>
                          <td className="py-4">
                            <button
                              type="button"
                              onClick={() => void acceptMarketOffer(offer.id)}
                              disabled={busyOfferId !== null || !data.member}
                              className="rounded-2xl border border-lime-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-lime-50 disabled:opacity-60"
                            >
                              {busyOfferId === offer.id ? "Creazione trade..." : "Accetta offerta"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-lime-700" />
                <h2 className="text-2xl font-bold text-zinc-950">Le tue offerte aperte</h2>
              </div>
              {data.myOffers.length === 0 ? (
                <div className="mt-6"><EmptyState title="Nessuna offerta personale" description="Pubblica un surplus per comparire nel book ordini interno della community energetica." /></div>
              ) : (
                <div className="mt-6 space-y-3">
                  {data.myOffers.map((offer) => (
                    <article key={offer.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-zinc-700">{offer.kwh.toLocaleString("it-IT")} kWh · {formatCurrency(offer.pricePerKwh, 3)} / kWh</p>
                          <p className="mt-1 text-sm text-zinc-600">Attiva fino al {formatDate(offer.validTo)}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[offer.status] ?? "bg-zinc-100 text-zinc-700"}`}>
                          {statusLabels[offer.status] ?? offer.status}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-lime-100 bg-white/90 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="h-5 w-5 text-lime-700" />
                <h2 className="text-2xl font-bold text-zinc-950">Trade recenti</h2>
              </div>
              {data.recentTrades.length === 0 ? (
                <div className="mt-6"><EmptyState title="Nessun trade registrato" description="Le transazioni recenti appariranno qui con stato di regolamento e volume economico." /></div>
              ) : (
                <div className="mt-6 space-y-3">
                  {data.recentTrades.map((trade) => (
                    <article key={trade.id} className="rounded-2xl border border-lime-100 bg-lime-50/60 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-zinc-950">{trade.sellerName} → {trade.buyerName}</p>
                          <p className="mt-1 text-sm text-zinc-600">{trade.kwhTraded.toLocaleString("it-IT")} kWh · {formatCurrency(trade.totalEuro)} · {formatDate(trade.createdAt)}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[trade.status] ?? "bg-zinc-100 text-zinc-700"}`}>
                          {statusLabels[trade.status] ?? trade.status}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
