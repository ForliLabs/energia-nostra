"use client";

import { Coins, Leaf, RotateCcw, ShoppingCart, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CarbonDashboard } from "@/lib/carbon-credits";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast-provider";
import { getMutationHeaders } from "@/hooks/mutation-headers";

interface SessionUser {
  role?: string;
  name?: string;
}

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

const verificationLabels: Record<string, string> = {
  pending: "In verifica",
  verified: "Verificato",
  certified: "Certificato",
  retired: "Ritirato",
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("it-IT");

export default function CarbonCreditsPage() {
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState<CarbonDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [issueForm, setIssueForm] = useState({ vintage: String(new Date().getFullYear()), co2Tonnes: "2.5", pricePerTonne: "45" });
  const [purchaseForm, setPurchaseForm] = useState({ buyerName: "", buyerType: "business", tonnes: "1" });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardResponse, sessionResponse] = await Promise.all([fetch("/api/carbon-credits"), fetch("/api/auth/session")]);
      const dashboardPayload = (await dashboardResponse.json()) as CarbonDashboard & { error?: string };
      if (!dashboardResponse.ok) {
        throw new Error(dashboardPayload.error || "Impossibile caricare i crediti carbonio.");
      }
      setDashboard(dashboardPayload);
      setSelectedCreditId((current) => current || dashboardPayload.credits[0]?.id || null);
      if (sessionResponse.ok) {
        const sessionPayload = (await sessionResponse.json()) as { user?: SessionUser };
        setSessionUser(sessionPayload.user || null);
      } else {
        setSessionUser(null);
      }
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

  const selectedCredit = useMemo(
    () => dashboard?.credits.find((credit) => credit.id === selectedCreditId) || null,
    [dashboard, selectedCreditId],
  );
  const canManage = sessionUser?.role === "admin" || sessionUser?.role === "superadmin";

  const runAction = async (body: Record<string, unknown>, successTitle: string, successDescription: string) => {
    setBusyAction(String(body.action || "action"));
    try {
      const response = await fetch("/api/carbon-credits", {
        method: "POST",
        headers: getMutationHeaders(),
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Operazione non completata.");
      }
      showToast({ title: successTitle, description: successDescription, variant: "success" });
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
        eyebrow="Valorizzazione ambientale"
        title="Crediti Carbonio"
        description="Il flusso ambientale ora è completo: monitora stock disponibile, registra nuove emissioni evitate, acquista dal portafoglio e ritira i lotti già utilizzati nella rendicontazione CER."
      />

      {loading && !dashboard ? <p className="text-sm text-zinc-500">Caricamento dashboard carbon credits...</p> : null}
      {error && !dashboard ? <EmptyState title="Impossibile caricare i crediti carbonio" description={error} /> : null}

      {dashboard ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><Leaf className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">CO₂ evitata</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{dashboard.totalCo2Avoided.toLocaleString("it-IT")} t</p></div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><Coins className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Disponibili</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{dashboard.creditsAvailable.toLocaleString("it-IT")} t</p></div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><ShoppingCart className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Vendute / allocate</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{dashboard.creditsSold.toLocaleString("it-IT")} t</p></div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-amber-700"><Wallet className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Ricavi</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{formatCurrency(dashboard.totalRevenueEuro)}</p><p className="mt-1 text-xs text-zinc-500">Prezzo medio {formatCurrency(dashboard.avgPricePerTonne)} / t</p></div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Coins className="h-5 w-5 text-amber-700" /><h2 className="text-2xl font-bold text-zinc-950">Azioni sul portafoglio</h2></div>
              {selectedCredit ? (
                <div className="mt-6 rounded-2xl border border-lime-100 bg-lime-50 p-5">
                  <p className="text-sm font-semibold text-zinc-700">Lotto selezionato</p>
                  <h3 className="mt-2 text-lg font-bold text-zinc-950">Vintage {selectedCredit.vintage} · {selectedCredit.co2Tonnes.toLocaleString("it-IT")} t</h3>
                  <p className="mt-2 text-sm text-zinc-600">{selectedCredit.cerName} · Registro {selectedCredit.registryId || "da assegnare"}</p>
                  <p className="mt-1 text-xs font-semibold text-lime-700">{verificationLabels[selectedCredit.verificationStatus] || selectedCredit.verificationStatus}</p>
                </div>
              ) : null}
              <div className="mt-6 space-y-6">
                <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <h3 className="font-semibold text-zinc-950">Acquista crediti dal portafoglio</h3>
                  <input value={purchaseForm.buyerName} onChange={(event) => setPurchaseForm((current) => ({ ...current, buyerName: event.target.value }))} placeholder="Nome acquirente (facoltativo)" className="w-full rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select value={purchaseForm.buyerType} onChange={(event) => setPurchaseForm((current) => ({ ...current, buyerType: event.target.value }))} className="rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500">
                      <option value="business">Impresa</option>
                      <option value="individual">Privato</option>
                      <option value="municipality">Comune / PA</option>
                    </select>
                    <input type="number" min="0.1" step="0.1" value={purchaseForm.tonnes} onChange={(event) => setPurchaseForm((current) => ({ ...current, tonnes: event.target.value }))} placeholder="Tonnellate" className="rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500" />
                  </div>
                  <button
                    type="button"
                    onClick={() => selectedCredit && void runAction({ action: "purchase", creditId: selectedCredit.id, buyerName: purchaseForm.buyerName || sessionUser?.name, buyerType: purchaseForm.buyerType, tonnes: Number(purchaseForm.tonnes) }, "Acquisto registrato", "Il certificato di compensazione è stato emesso nel registro transazioni.")}
                    disabled={!selectedCredit || busyAction !== null}
                    className="w-full rounded-2xl bg-lime-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-lime-700 disabled:opacity-60"
                  >
                    {busyAction === "purchase" ? "Registrazione acquisto..." : "Acquista lotto selezionato"}
                  </button>
                </div>

                {canManage ? (
                  <div className="space-y-3 rounded-2xl border border-lime-100 bg-white p-5">
                    <h3 className="font-semibold text-zinc-950">Emetti nuovo lotto</h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input value={issueForm.vintage} onChange={(event) => setIssueForm((current) => ({ ...current, vintage: event.target.value }))} placeholder="Vintage" className="rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500" />
                      <input type="number" min="0.1" step="0.1" value={issueForm.co2Tonnes} onChange={(event) => setIssueForm((current) => ({ ...current, co2Tonnes: event.target.value }))} placeholder="t CO₂" className="rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500" />
                      <input type="number" min="1" value={issueForm.pricePerTonne} onChange={(event) => setIssueForm((current) => ({ ...current, pricePerTonne: event.target.value }))} placeholder="€/t" className="rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => void runAction({ action: "issue", vintage: issueForm.vintage, co2Tonnes: Number(issueForm.co2Tonnes), pricePerTonne: Number(issueForm.pricePerTonne) }, "Lotto emesso", "Il nuovo stock verificato è stato aggiunto al portafoglio CER.")} disabled={busyAction !== null} className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60">{busyAction === "issue" ? "Emissione..." : "Emetti nuovo lotto"}</button>
                      <button type="button" onClick={() => selectedCredit && void runAction({ action: "retire", creditId: selectedCredit.id }, "Credito ritirato", "Il lotto selezionato è stato spostato in stato ritirato per audit e rendicontazione.")} disabled={!selectedCredit || busyAction !== null || selectedCredit?.status !== "available"} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"><RotateCcw className="mr-2 inline h-4 w-4" />{busyAction === "retire" ? "Ritiro..." : "Ritira lotto selezionato"}</button>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Leaf className="h-5 w-5 text-amber-700" /><h2 className="text-2xl font-bold text-zinc-950">Portafoglio crediti e tracciabilità</h2></div>
              {dashboard.credits.length === 0 ? (
                <div className="mt-6"><EmptyState title="Nessun credito disponibile" description="Emetti il primo lotto verificato partendo dalla CO₂ evitata della CER per attivare la valorizzazione ambientale." /></div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full divide-y divide-amber-100 text-sm">
                    <thead>
                      <tr className="text-left text-zinc-500">
                        <th className="pb-3 pr-4 font-semibold">Vintage</th>
                        <th className="pb-3 pr-4 font-semibold">Tonnellate</th>
                        <th className="pb-3 pr-4 font-semibold">Registro</th>
                        <th className="pb-3 pr-4 font-semibold">Verifica</th>
                        <th className="pb-3 pr-4 font-semibold">Stato</th>
                        <th className="pb-3 font-semibold">Azione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {dashboard.credits.map((credit) => (
                        <tr key={credit.id} className={selectedCreditId === credit.id ? "bg-lime-50/60" : undefined}>
                          <td className="py-4 pr-4 font-semibold text-zinc-950">{credit.vintage}</td>
                          <td className="py-4 pr-4 text-zinc-700">{credit.co2Tonnes.toLocaleString("it-IT")} t</td>
                          <td className="py-4 pr-4 text-xs font-mono text-zinc-600">{credit.registryId || "—"}</td>
                          <td className="py-4 pr-4 text-zinc-700">{verificationLabels[credit.verificationStatus] || credit.verificationStatus}</td>
                          <td className="py-4 pr-4"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[credit.status] ?? "bg-zinc-100 text-zinc-700"}`}>{statusLabels[credit.status] ?? credit.status}</span></td>
                          <td className="py-4"><button type="button" onClick={() => setSelectedCreditId(credit.id)} className="rounded-2xl border border-lime-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-lime-50">Seleziona</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Leaf className="h-5 w-5 text-amber-700" /><h2 className="text-2xl font-bold text-zinc-950">Andamento mensile CO₂ evitata</h2></div>
              <div className="mt-6 space-y-4">
                {dashboard.monthlyAvoidance.map((month) => {
                  const maxMonthlyAvoidance = Math.max(...dashboard.monthlyAvoidance.map((entry) => entry.co2Kg), 1);
                  return (
                    <div key={month.month} className="grid gap-3 md:grid-cols-[120px_1fr_100px] md:items-center">
                      <p className="text-sm font-semibold text-zinc-700">{month.month}</p>
                      <div className="h-4 overflow-hidden rounded-full bg-amber-100"><div className="h-full rounded-full bg-lime-500" style={{ width: `${(month.co2Kg / maxMonthlyAvoidance) * 100}%` }} /></div>
                      <p className="text-right text-sm font-medium text-zinc-600">{month.co2Kg.toLocaleString("it-IT")} kg</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Wallet className="h-5 w-5 text-amber-700" /><h2 className="text-2xl font-bold text-zinc-950">Transazioni recenti</h2></div>
              {dashboard.recentTransactions.length === 0 ? (
                <div className="mt-6"><EmptyState title="Nessuna transazione registrata" description="Gli acquisti e i ritiri appariranno qui con certificato emesso e valore economico." /></div>
              ) : (
                <div className="mt-6 space-y-3">
                  {dashboard.recentTransactions.map((transaction) => (
                    <article key={transaction.id} className="rounded-2xl border border-lime-100 bg-lime-50/60 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-zinc-950">{transaction.buyerName} · {transaction.tonnes.toLocaleString("it-IT")} t</p>
                          <p className="mt-1 text-sm text-zinc-600">{transaction.buyerType} · {formatCurrency(transaction.totalEuro)} · {formatDate(transaction.createdAt)}</p>
                          <p className="mt-1 text-xs font-mono text-zinc-500">{transaction.certificateId || "Certificato in generazione"}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[transaction.status] ?? "bg-zinc-100 text-zinc-700"}`}>{statusLabels[transaction.status] ?? transaction.status}</span>
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
