"use client";

import { Activity, BookOpen, Gauge, KeyRound, ShieldCheck, Webhook } from "lucide-react";
import { useEffect, useState } from "react";
import type { ApiKeyInfo, ApiUsageStats, WebhookInfo } from "@/lib/api-platform";

interface ApiKeysResponse {
  keys: ApiKeyInfo[];
  stats: ApiUsageStats;
}

interface WebhooksResponse {
  webhooks: WebhookInfo[];
  availableEvents: string[];
}

const statusClasses = {
  active: "bg-lime-100 text-lime-800",
  inactive: "bg-zinc-100 text-zinc-700",
  degraded: "bg-amber-100 text-amber-800",
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("it-IT") : "—");

export default function ApiPlatformPage() {
  const [apiData, setApiData] = useState<ApiKeysResponse | null>(null);
  const [webhookData, setWebhookData] = useState<WebhooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      try {
        const [apiResponse, webhookResponse] = await Promise.all([fetch("/api/api-keys"), fetch("/api/webhooks")]);

        if (!apiResponse.ok || !webhookResponse.ok) {
          throw new Error("Impossibile recuperare la piattaforma API.");
        }

        const [apiPayload, webhookPayload] = (await Promise.all([
          apiResponse.json(),
          webhookResponse.json(),
        ])) as [ApiKeysResponse, WebhooksResponse];

        if (active) {
          setApiData(apiPayload);
          setWebhookData(webhookPayload);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Impossibile caricare API keys e webhook.");
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
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-700">Integrazioni esterne</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">API &amp; Webhook</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          Panoramica sulle chiavi API, utilizzo delle integrazioni e stato delle sottoscrizioni webhook per partner e portali.
        </p>
      </section>

      {loading && (!apiData || !webhookData) && <p className="text-sm text-zinc-500">Caricamento...</p>}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {apiData && webhookData && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Activity className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Chiamate totali</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{apiData.stats.totalCalls.toLocaleString("it-IT")}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Gauge className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Oggi</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{apiData.stats.callsToday.toLocaleString("it-IT")}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Latenza media</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{apiData.stats.avgLatencyMs} ms</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-amber-700">
                <Webhook className="h-5 w-5" />
                <p className="text-sm font-medium text-zinc-500">Error rate</p>
              </div>
              <p className="mt-4 text-3xl font-bold text-amber-900">{apiData.stats.errorRate}%</p>
            </div>
          </div>

          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-900">API keys</h2>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full divide-y divide-amber-100 text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="pb-3 pr-4 font-semibold">Nome</th>
                    <th className="pb-3 pr-4 font-semibold">Prefix</th>
                    <th className="pb-3 pr-4 font-semibold">Scopes</th>
                    <th className="pb-3 pr-4 font-semibold">Rate limit</th>
                    <th className="pb-3 pr-4 font-semibold">Ultimo utilizzo</th>
                    <th className="pb-3 font-semibold">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {apiData.keys.map((apiKey) => (
                    <tr key={apiKey.id} className="align-top">
                      <td className="py-4 pr-4 font-semibold text-zinc-950">{apiKey.name}</td>
                      <td className="py-4 pr-4 font-mono text-xs text-zinc-700">{apiKey.keyPrefix}</td>
                      <td className="py-4 pr-4">
                        <div className="flex flex-wrap gap-2">
                          {apiKey.scopes.map((scope) => (
                            <span key={scope} className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              {scope}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-zinc-700">{apiKey.rateLimit}/min</td>
                      <td className="py-4 pr-4 text-zinc-600">{formatDate(apiKey.lastUsedAt)}</td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${apiKey.isActive ? statusClasses.active : statusClasses.inactive}`}>
                          {apiKey.isActive ? "Attiva" : "Revocata"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Webhook className="h-5 w-5 text-amber-700" />
                <h2 className="text-lg font-semibold text-amber-900">Webhook registrati</h2>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full divide-y divide-amber-100 text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500">
                      <th className="pb-3 pr-4 font-semibold">URL</th>
                      <th className="pb-3 pr-4 font-semibold">Eventi</th>
                      <th className="pb-3 pr-4 font-semibold">Ultima delivery</th>
                      <th className="pb-3 font-semibold">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {webhookData.webhooks.map((webhook) => {
                      const statusClass = !webhook.isActive
                        ? statusClasses.inactive
                        : webhook.failCount > 0
                          ? statusClasses.degraded
                          : statusClasses.active;
                      const statusLabel = !webhook.isActive
                        ? "Disattivo"
                        : webhook.failCount > 0
                          ? "Degradato"
                          : "Attivo";

                      return (
                        <tr key={webhook.id} className="align-top">
                          <td className="py-4 pr-4 font-mono text-xs text-zinc-700">{webhook.url}</td>
                          <td className="py-4 pr-4 text-zinc-700">{webhook.events.join(", ")}</td>
                          <td className="py-4 pr-4 text-zinc-600">{formatDate(webhook.lastDelivery)}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-amber-700" />
                <h2 className="text-lg font-semibold text-amber-900">OpenAPI</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-600">
                Specifica pubblica per integrare sistemi esterni e partner. Eventi webhook disponibili: {webhookData.availableEvents.length}.
              </p>
              <a
                href="/api/api-keys?view=spec"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Apri specifica OpenAPI
              </a>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
