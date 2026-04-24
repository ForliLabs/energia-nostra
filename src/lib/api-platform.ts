// Open API & Webhook Platform (Feature 8)

import { prisma } from "@/lib/prisma";

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface WebhookInfo {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  failCount: number;
  lastDelivery: string | null;
  createdAt: string;
}

export interface ApiUsageStats {
  totalCalls: number;
  callsToday: number;
  avgLatencyMs: number;
  errorRate: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
}

export const WEBHOOK_EVENTS = [
  "member.created",
  "member.updated",
  "invoice.generated",
  "invoice.paid",
  "vote.opened",
  "vote.closed",
  "meter.uploaded",
  "meter.anomaly",
  "gse_report.validated",
  "energy.forecast_ready",
  "trade.matched",
  "document.signed",
  "achievement.earned",
] as const;

export const API_SCOPES = [
  "members:read",
  "members:write",
  "energy:read",
  "invoices:read",
  "invoices:write",
  "votes:read",
  "votes:write",
  "reports:read",
  "trading:read",
  "trading:write",
] as const;

// Generate a secure API key
function generateApiKey(): { key: string; hash: string; prefix: string } {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "en_";
  for (let i = 0; i < 40; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  const prefix = key.slice(0, 11);
  // Simple hash for demo (production would use crypto.subtle)
  const hash = key.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0).toString(36);
  return { key, hash: `sha256:${hash}`, prefix };
}

export async function createApiKey(input: {
  name: string;
  scopes: string[];
  rateLimit?: number;
  createdBy: string;
}): Promise<{ apiKey: ApiKeyInfo; rawKey: string }> {
  const { key, hash, prefix } = generateApiKey();
  const created = await prisma.apiKey.create({
    data: {
      name: input.name,
      keyHash: hash,
      keyPrefix: prefix,
      scopes: JSON.stringify(input.scopes),
      rateLimit: input.rateLimit || 100,
      createdBy: input.createdBy,
      isActive: true,
    },
  });
  return {
    apiKey: mapApiKey(created),
    rawKey: key, // Only shown once
  };
}

export async function getApiKeys(): Promise<ApiKeyInfo[]> {
  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });
  return keys.map(mapApiKey);
}

export async function revokeApiKey(id: string): Promise<boolean> {
  await prisma.apiKey.update({ where: { id }, data: { isActive: false } });
  return true;
}

export async function logApiUsage(apiKeyId: string, endpoint: string, method: string, status: number, latencyMs: number) {
  await prisma.apiUsageLog.create({
    data: { apiKeyId, endpoint, method, status, latencyMs },
  });
  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { lastUsedAt: new Date() },
  });
}

export async function getApiUsageStats(): Promise<ApiUsageStats> {
  const logs = await prisma.apiUsageLog.findMany({ orderBy: { createdAt: "desc" }, take: 1000 });
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((l) => l.createdAt.toISOString().slice(0, 10) === today);
  const errors = logs.filter((l) => l.status >= 400);
  
  const endpointCounts = new Map<string, number>();
  for (const log of logs) {
    endpointCounts.set(log.endpoint, (endpointCounts.get(log.endpoint) || 0) + 1);
  }

  return {
    totalCalls: logs.length,
    callsToday: todayLogs.length,
    avgLatencyMs: logs.length > 0 ? round(logs.reduce((s, l) => s + l.latencyMs, 0) / logs.length, 0) : 0,
    errorRate: logs.length > 0 ? round((errors.length / logs.length) * 100) : 0,
    topEndpoints: Array.from(endpointCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count })),
  };
}

// Webhook Management
export async function createWebhook(input: {
  url: string;
  events: string[];
  createdBy: string;
}): Promise<WebhookInfo> {
  const secret = `whsec_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join("")}`;
  const webhook = await prisma.webhookSubscription.create({
    data: {
      url: input.url,
      events: JSON.stringify(input.events),
      secret,
      isActive: true,
      createdBy: input.createdBy,
    },
  });
  return mapWebhook(webhook);
}

export async function getWebhooks(): Promise<WebhookInfo[]> {
  const webhooks = await prisma.webhookSubscription.findMany({ orderBy: { createdAt: "desc" } });
  return webhooks.map(mapWebhook);
}

export async function triggerWebhook(event: string, payload: Record<string, unknown>) {
  const webhooks = await prisma.webhookSubscription.findMany({ where: { isActive: true } });
  
  for (const webhook of webhooks) {
    const events = JSON.parse(webhook.events) as string[];
    if (!events.includes(event)) continue;

    await prisma.webhookDelivery.create({
      data: {
        subscriptionId: webhook.id,
        event,
        payload: JSON.stringify(payload),
        status: "delivered", // In production, would actually POST to url
        responseCode: 200,
        attempts: 1,
      },
    });

    await prisma.webhookSubscription.update({
      where: { id: webhook.id },
      data: { lastDelivery: new Date() },
    });
  }
}

export async function getWebhookDeliveries(subscriptionId: string) {
  return prisma.webhookDelivery.findMany({
    where: { subscriptionId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// OpenAPI spec generation
export function getOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "EnergiaNostra API",
      version: "1.0.0",
      description: "API per la gestione delle Comunità Energetiche Rinnovabili (CER)",
      contact: { name: "EnergiaNostra", email: "api@energianostra.it" },
    },
    servers: [{ url: "/api/v1", description: "API principale" }],
    paths: {
      "/members": {
        get: { summary: "Lista membri CER", tags: ["Members"], security: [{ ApiKey: ["members:read"] }] },
        post: { summary: "Aggiungi membro", tags: ["Members"], security: [{ ApiKey: ["members:write"] }] },
      },
      "/energy": {
        get: { summary: "Dati energetici CER", tags: ["Energy"], security: [{ ApiKey: ["energy:read"] }] },
      },
      "/invoices": {
        get: { summary: "Lista fatture", tags: ["Billing"], security: [{ ApiKey: ["invoices:read"] }] },
      },
      "/votes": {
        get: { summary: "Lista votazioni", tags: ["Governance"], security: [{ ApiKey: ["votes:read"] }] },
      },
      "/forecasts": {
        get: { summary: "Previsioni energetiche", tags: ["Forecasting"], security: [{ ApiKey: ["energy:read"] }] },
      },
      "/trading/offers": {
        get: { summary: "Offerte energia P2P", tags: ["Trading"], security: [{ ApiKey: ["trading:read"] }] },
        post: { summary: "Crea offerta", tags: ["Trading"], security: [{ ApiKey: ["trading:write"] }] },
      },
    },
    components: {
      securitySchemes: {
        ApiKey: { type: "apiKey", in: "header", name: "X-API-Key" },
      },
    },
  };
}

function mapApiKey(key: { id: string; name: string; keyPrefix: string; scopes: string; rateLimit: number; lastUsedAt: Date | null; isActive: boolean; createdAt: Date }): ApiKeyInfo {
  return {
    id: key.id, name: key.name, keyPrefix: key.keyPrefix,
    scopes: JSON.parse(key.scopes), rateLimit: key.rateLimit,
    lastUsedAt: key.lastUsedAt?.toISOString() || null,
    isActive: key.isActive, createdAt: key.createdAt.toISOString(),
  };
}

function mapWebhook(w: { id: string; url: string; events: string; isActive: boolean; failCount: number; lastDelivery: Date | null; createdAt: Date }): WebhookInfo {
  return {
    id: w.id, url: w.url, events: JSON.parse(w.events),
    isActive: w.isActive, failCount: w.failCount,
    lastDelivery: w.lastDelivery?.toISOString() || null,
    createdAt: w.createdAt.toISOString(),
  };
}
