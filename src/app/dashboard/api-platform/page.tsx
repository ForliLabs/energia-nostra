"use client";

import { Activity, BookOpen, Copy, Gauge, KeyRound, ShieldCheck, Webhook } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiKeyInfo, ApiUsageStats, WebhookInfo } from "@/lib/api-platform";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast-provider";
import { getMutationHeaders } from "@/hooks/mutation-headers";

interface ApiKeysResponse {
  keys: ApiKeyInfo[];
  stats: ApiUsageStats;
}

interface WebhooksResponse {
  webhooks: WebhookInfo[];
  availableEvents: string[];
}

interface DeliveryInfo {
  id: string;
  event: string;
  status: string;
  responseCode: number | null;
  attempts: number;
  createdAt: string;
}

const statusClasses = {
  active: "bg-lime-100 text-lime-800",
  inactive: "bg-zinc-100 text-zinc-700",
  degraded: "bg-amber-100 text-amber-800",
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("it-IT") : "—");

export default function ApiPlatformPage() {
  const { showToast } = useToast();
  const [apiData, setApiData] = useState<ApiKeysResponse | null>(null);
  const [webhookData, setWebhookData] = useState<WebhooksResponse | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryInfo[]>([]);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyForm, setKeyForm] = useState({ name: "Portale partner", scopes: ["energy:read", "members:read"], rateLimit: "120" });
  const [webhookForm, setWebhookForm] = useState({ url: "https://partner.example.com/webhooks/energia", events: ["energy.forecast_ready", "trade.matched"] as string[] });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [apiResponse, webhookResponse] = await Promise.all([fetch("/api/api-keys"), fetch("/api/webhooks")]);
      const apiPayload = (await apiResponse.json()) as ApiKeysResponse & { error?: string };
      const webhookPayload = (await webhookResponse.json()) as WebhooksResponse & { error?: string };
      if (!apiResponse.ok || !webhookResponse.ok) {
        throw new Error(apiPayload.error || webhookPayload.error || "Impossibile caricare la piattaforma API.");
      }
      setApiData(apiPayload);
      setWebhookData(webhookPayload);
      setSelectedWebhookId((current) => current || webhookPayload.webhooks[0]?.id || null);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDeliveries = useCallback(async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/webhooks?subscriptionId=${subscriptionId}`);
      const payload = (await response.json()) as { deliveries?: DeliveryInfo[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile caricare i delivery log.");
      }
      setDeliveries(payload.deliveries || []);
    } catch (caughtError) {
      showToast({ title: "Delivery log non disponibile", description: (caughtError as Error).message, variant: "error" });
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  useEffect(() => {
    if (!selectedWebhookId) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      void loadDeliveries(selectedWebhookId);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDeliveries, selectedWebhookId]);

  const quickstartSnippet = useMemo(() => {
    const token = generatedKey || "en_xxxxxxxxxxxxxxxxx";
    const origin = typeof window === "undefined" ? "https://energia-nostra.local" : window.location.origin;
    return `curl -X GET \
  "${origin}/api/forecasting" \
  -H "Authorization: Bearer ${token}" \
  -H "Accept: application/json"`;
  }, [generatedKey]);

  const copySnippet = async () => {
    await navigator.clipboard.writeText(quickstartSnippet);
    showToast({ title: "Snippet copiato", description: "Il quickstart è pronto da incollare nella tua integrazione.", variant: "success" });
  };

  const createKey = async () => {
    setBusyAction("create-key");
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: getMutationHeaders(),
        body: JSON.stringify({ action: "create", name: keyForm.name, scopes: keyForm.scopes, rateLimit: Number(keyForm.rateLimit) }),
      });
      const payload = (await response.json()) as { error?: string; rawKey?: string };
      if (!response.ok || !payload.rawKey) {
        throw new Error(payload.error || "Impossibile creare l'API key.");
      }
      setGeneratedKey(payload.rawKey);
      showToast({ title: "API key creata", description: "Copia subito la chiave: verrà mostrata una sola volta.", variant: "success" });
      await loadDashboard();
    } catch (caughtError) {
      showToast({ title: "Creazione non riuscita", description: (caughtError as Error).message, variant: "error" });
    } finally {
      setBusyAction(null);
    }
  };

  const revokeKey = async (keyId: string) => {
    setBusyAction(keyId);
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: getMutationHeaders(),
        body: JSON.stringify({ action: "revoke", keyId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile revocare la chiave.");
      }
      showToast({ title: "API key revocata", description: "La chiave non può più essere usata dai partner integrati.", variant: "success" });
      await loadDashboard();
    } catch (caughtError) {
      showToast({ title: "Revoca non riuscita", description: (caughtError as Error).message, variant: "error" });
    } finally {
      setBusyAction(null);
    }
  };

  const createWebhook = async () => {
    setBusyAction("create-webhook");
    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: getMutationHeaders(),
        body: JSON.stringify({ url: webhookForm.url, events: webhookForm.events }),
      });
      const payload = (await response.json()) as { error?: string; id?: string };
      if (!response.ok || !payload.id) {
        throw new Error(payload.error || "Impossibile creare il webhook.");
      }
      showToast({ title: "Webhook registrato", description: "La sottoscrizione è pronta a ricevere eventi CER.", variant: "success" });
      await loadDashboard();
      setSelectedWebhookId(payload.id);
    } catch (caughtError) {
      showToast({ title: "Webhook non creato", description: (caughtError as Error).message, variant: "error" });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Integrazioni esterne"
        title="API & Webhook"
        description="La developer experience ora copre onboarding, quickstart e osservabilità: genera chiavi, registra webhook, controlla gli endpoint più chiamati e apri la specifica condivisa." 
        actions={
          <a href="/api/openapi" target="_blank" rel="noreferrer" className="rounded-2xl bg-lime-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-lime-700">
            Apri OpenAPI
          </a>
        }
      />

      {generatedKey ? (
        <div className="rounded-2xl border border-lime-200 bg-lime-50 px-4 py-4 text-sm text-zinc-800">
          <p className="font-semibold text-lime-900">Nuova API key generata</p>
          <p className="mt-2 break-all font-mono text-xs">{generatedKey}</p>
        </div>
      ) : null}

      {loading && (!apiData || !webhookData) ? <p className="text-sm text-zinc-500">Caricamento piattaforma API...</p> : null}
      {error && !apiData ? <EmptyState title="Impossibile caricare API & webhook" description={error} /> : null}

      {apiData && webhookData ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-lime-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-lime-700"><Activity className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Chiamate totali</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{apiData.stats.totalCalls.toLocaleString("it-IT")}</p></div>
            <div className="rounded-2xl border border-lime-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-lime-700"><Gauge className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Oggi</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{apiData.stats.callsToday.toLocaleString("it-IT")}</p></div>
            <div className="rounded-2xl border border-lime-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-lime-700"><ShieldCheck className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Latenza media</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{apiData.stats.avgLatencyMs} ms</p></div>
            <div className="rounded-2xl border border-lime-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 text-lime-700"><Webhook className="h-5 w-5" /><p className="text-sm font-medium text-zinc-500">Error rate</p></div><p className="mt-4 text-3xl font-bold text-zinc-950">{apiData.stats.errorRate}%</p></div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-3xl border border-lime-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-lime-700" /><h2 className="text-2xl font-bold text-zinc-950">Quickstart sviluppatori</h2></div>
              <p className="mt-4 text-sm leading-6 text-zinc-600">Genera una chiave e usa lo snippet cURL per verificare subito forecasting, energy data o webhook dalla tua integrazione partner.</p>
              <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <pre className="overflow-x-auto text-xs text-zinc-800"><code>{quickstartSnippet}</code></pre>
              </div>
              <button type="button" onClick={() => void copySnippet()} className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-lime-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-lime-50"><Copy className="h-4 w-4" />Copia snippet</button>
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-zinc-950">Endpoint più usati</h3>
                {apiData.stats.topEndpoints.length === 0 ? (
                  <EmptyState title="Nessun traffico API" description="Dopo le prime integrazioni vedrai qui gli endpoint più chiamati e potrai ottimizzare rate limit e documentazione." />
                ) : (
                  apiData.stats.topEndpoints.map((endpoint) => (
                    <div key={endpoint.endpoint} className="flex items-center justify-between rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm">
                      <span className="font-mono text-xs text-zinc-700">{endpoint.endpoint}</span>
                      <span className="font-semibold text-lime-700">{endpoint.count}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-lime-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><KeyRound className="h-5 w-5 text-lime-700" /><h2 className="text-2xl font-bold text-zinc-950">Crea API key</h2></div>
              <div className="mt-6 space-y-4">
                <input value={keyForm.name} onChange={(event) => setKeyForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nome integrazione" className="w-full rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-zinc-700"><input type="checkbox" checked={keyForm.scopes.includes("energy:read")} onChange={(event) => setKeyForm((current) => ({ ...current, scopes: event.target.checked ? [...current.scopes, "energy:read"] : current.scopes.filter((scope) => scope !== "energy:read") }))} className="mr-2" />energy:read</label>
                  <label className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-zinc-700"><input type="checkbox" checked={keyForm.scopes.includes("members:read")} onChange={(event) => setKeyForm((current) => ({ ...current, scopes: event.target.checked ? [...current.scopes, "members:read"] : current.scopes.filter((scope) => scope !== "members:read") }))} className="mr-2" />members:read</label>
                </div>
                <input value={keyForm.rateLimit} onChange={(event) => setKeyForm((current) => ({ ...current, rateLimit: event.target.value }))} placeholder="Rate limit / min" className="w-full rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500" />
                <button type="button" onClick={() => void createKey()} disabled={busyAction !== null} className="rounded-2xl bg-lime-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-lime-700 disabled:opacity-60">{busyAction === "create-key" ? "Creazione..." : "Genera chiave"}</button>
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border border-lime-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><KeyRound className="h-5 w-5 text-lime-700" /><h2 className="text-2xl font-bold text-zinc-950">API keys attive</h2></div>
              {apiData.keys.length === 0 ? (
                <div className="mt-6"><EmptyState title="Nessuna API key" description="Genera la prima chiave per iniziare il rollout verso partner o sistemi terzi." /></div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full divide-y divide-lime-100 text-sm">
                    <thead><tr className="text-left text-zinc-500"><th className="pb-3 pr-4 font-semibold">Nome</th><th className="pb-3 pr-4 font-semibold">Prefix</th><th className="pb-3 pr-4 font-semibold">Scopes</th><th className="pb-3 pr-4 font-semibold">Rate limit</th><th className="pb-3 pr-4 font-semibold">Ultimo utilizzo</th><th className="pb-3 font-semibold">Azione</th></tr></thead>
                    <tbody className="divide-y divide-lime-50">
                      {apiData.keys.map((apiKey) => (
                        <tr key={apiKey.id} className="align-top">
                          <td className="py-4 pr-4 font-semibold text-zinc-950">{apiKey.name}</td>
                          <td className="py-4 pr-4 font-mono text-xs text-zinc-700">{apiKey.keyPrefix}</td>
                          <td className="py-4 pr-4 text-zinc-700">{apiKey.scopes.join(", ")}</td>
                          <td className="py-4 pr-4 text-zinc-700">{apiKey.rateLimit}/min</td>
                          <td className="py-4 pr-4 text-zinc-600">{formatDate(apiKey.lastUsedAt)}</td>
                          <td className="py-4"><button type="button" onClick={() => void revokeKey(apiKey.id)} disabled={busyAction === apiKey.id || !apiKey.isActive} className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60">{busyAction === apiKey.id ? "Revoca..." : apiKey.isActive ? "Revoca" : "Revocata"}</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-lime-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Webhook className="h-5 w-5 text-lime-700" /><h2 className="text-2xl font-bold text-zinc-950">Registra webhook</h2></div>
              <div className="mt-6 space-y-4">
                <input value={webhookForm.url} onChange={(event) => setWebhookForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://partner.example.com/webhooks" className="w-full rounded-2xl border border-lime-200 px-4 py-3 text-sm outline-none transition focus:border-lime-500" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {webhookData.availableEvents.slice(0, 6).map((eventName) => (
                    <label key={eventName} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-zinc-700"><input type="checkbox" checked={webhookForm.events.includes(eventName)} onChange={(event) => setWebhookForm((current) => ({ ...current, events: event.target.checked ? [...current.events, eventName] : current.events.filter((item) => item !== eventName) }))} className="mr-2" />{eventName}</label>
                  ))}
                </div>
                <button type="button" onClick={() => void createWebhook()} disabled={busyAction !== null} className="rounded-2xl bg-lime-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-lime-700 disabled:opacity-60">{busyAction === "create-webhook" ? "Registrazione..." : "Crea webhook"}</button>
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border border-lime-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Webhook className="h-5 w-5 text-lime-700" /><h2 className="text-2xl font-bold text-zinc-950">Webhook registrati</h2></div>
              {webhookData.webhooks.length === 0 ? (
                <div className="mt-6"><EmptyState title="Nessun webhook registrato" description="Aggiungi una sottoscrizione per ricevere eventi forecasting, trading o billing sui tuoi sistemi." /></div>
              ) : (
                <div className="mt-6 space-y-3">
                  {webhookData.webhooks.map((webhook) => {
                    const statusClass = !webhook.isActive ? statusClasses.inactive : webhook.failCount > 0 ? statusClasses.degraded : statusClasses.active;
                    const statusLabel = !webhook.isActive ? "Disattivo" : webhook.failCount > 0 ? "Degradato" : "Attivo";
                    return (
                      <button key={webhook.id} type="button" onClick={() => setSelectedWebhookId(webhook.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedWebhookId === webhook.id ? "border-lime-300 bg-lime-50" : "border-amber-100 bg-white hover:bg-amber-50"}`}>
                        <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs text-zinc-700">{webhook.url}</p><p className="mt-2 text-sm text-zinc-600">{webhook.events.join(", ")}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{statusLabel}</span></div>
                        <p className="mt-3 text-xs text-zinc-500">Ultima delivery {formatDate(webhook.lastDelivery)}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-lime-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3"><Activity className="h-5 w-5 text-lime-700" /><h2 className="text-2xl font-bold text-zinc-950">Delivery log</h2></div>
              {deliveries.length === 0 ? (
                <div className="mt-6"><EmptyState title="Nessuna delivery disponibile" description="Dopo i primi eventi vedrai codice risposta, tentativi e timestamp per ogni sottoscrizione selezionata." /></div>
              ) : (
                <div className="mt-6 space-y-3">
                  {deliveries.map((delivery) => (
                    <article key={delivery.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-zinc-950">{delivery.event}</p><p className="mt-1 text-sm text-zinc-600">Tentativo {delivery.attempts} · risposta {delivery.responseCode ?? "n/d"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${delivery.status === "delivered" ? statusClasses.active : statusClasses.degraded}`}>{delivery.status}</span></div>
                      <p className="mt-2 text-xs text-zinc-500">{new Date(delivery.createdAt).toLocaleString("it-IT")}</p>
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
