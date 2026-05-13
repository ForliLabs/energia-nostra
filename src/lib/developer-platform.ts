// Developer Platform & Marketplace (Iteration 4, Feature 10)
// OAuth 2.0, OpenAPI spec, plugin marketplace, SDK generation

import { generateOpenApiSpec, summarizeOpenApiSpec, type OpenApiSpec } from "@/lib/openapi";
import { prisma } from "@/lib/prisma";
import { createSecureToken, hashSecret } from "@/lib/secrets";

export interface OAuthAppInfo {
  id: string;
  name: string;
  description: string | null;
  developerName: string;
  developerEmail: string;
  clientId: string;
  redirectUris: string[];
  scopes: string[];
  logoUrl: string | null;
  websiteUrl: string | null;
  status: string;
  isPublished: boolean;
  installCount: number;
  createdAt: string;
}

export interface OAuthAuthorizationInfo {
  id: string;
  appName: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string | null;
}

export interface MarketplacePluginInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string | null;
  category: string;
  version: string;
  developerName: string;
  iconUrl: string | null;
  pricing: string;
  priceEuro: number | null;
  installCount: number;
  rating: number | null;
  reviewCount: number;
  isVerified: boolean;
  isInstalled: boolean;
}

export interface PluginInstallationInfo {
  id: string;
  pluginId: string;
  pluginName: string;
  cerId: string;
  config: Record<string, unknown> | null;
  status: string;
  createdAt: string;
}

export interface DeveloperDashboard {
  apps: OAuthAppInfo[];
  plugins: MarketplacePluginInfo[];
  installedPlugins: PluginInstallationInfo[];
  stats: DeveloperStats;
  apiSpec: OpenApiOverview;
}

export interface DeveloperStats {
  totalApps: number;
  totalPlugins: number;
  totalInstalls: number;
  totalApiCalls: number;
  activeAuthorizations: number;
}

export interface OpenApiOverview {
  version: string;
  endpoints: number;
  categories: string[];
}

function normaliseRedirectUris(redirectUris: string[]) {
  return redirectUris.map((redirectUri) => new URL(redirectUri).toString());
}

export async function registerOAuthApp(data: {
  name: string;
  description?: string;
  developerName: string;
  developerEmail: string;
  redirectUris: string[];
  scopes: string[];
  websiteUrl?: string;
  privacyUrl?: string;
}): Promise<{ app: OAuthAppInfo; clientSecret: string }> {
  const clientId = createSecureToken("cer_", 18);
  const clientSecret = createSecureToken("sk_", 36);

  const app = await prisma.oAuthApp.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      developerName: data.developerName,
      developerEmail: data.developerEmail,
      clientId,
      clientSecretHash: await hashSecret(clientSecret),
      redirectUris: JSON.stringify(normaliseRedirectUris(data.redirectUris)),
      scopes: JSON.stringify(data.scopes),
      websiteUrl: data.websiteUrl ?? null,
      privacyUrl: data.privacyUrl ?? null,
      status: "pending",
    },
  });

  return { app: mapOAuthApp(app), clientSecret };
}

export async function getOAuthApps(): Promise<OAuthAppInfo[]> {
  const apps = await prisma.oAuthApp.findMany({ orderBy: { createdAt: "desc" } });
  return apps.map(mapOAuthApp);
}

export async function approveOAuthApp(appId: string): Promise<void> {
  await prisma.oAuthApp.update({ where: { id: appId }, data: { status: "approved", isPublished: true } });
}

export async function createAuthorization(appId: string, userId: string, cerId: string, scopes: string[]): Promise<{ authorizationCode: string }> {
  const code = createSecureToken("code_", 24);

  await prisma.oAuthAuthorization.create({
    data: {
      appId,
      userId,
      cerId,
      scopes: JSON.stringify(scopes),
      authorizationCode: code,
      codeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return { authorizationCode: code };
}

export async function exchangeCodeForToken(code: string, clientId: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const auth = await prisma.oAuthAuthorization.findUnique({
    where: { authorizationCode: code },
    include: { app: true },
  });

  if (!auth) throw new Error("Invalid authorization code");
  if (auth.app.clientId !== clientId) throw new Error("Client ID mismatch");
  if (auth.codeExpiresAt && auth.codeExpiresAt < new Date()) throw new Error("Authorization code expired");

  const accessToken = createSecureToken("at_", 30);
  const refreshToken = createSecureToken("rt_", 30);

  await prisma.oAuthAuthorization.update({
    where: { id: auth.id },
    data: {
      accessToken,
      refreshToken,
      authorizationCode: null,
      tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
    },
  });

  return { accessToken, refreshToken, expiresIn: 3600 };
}

export async function revokeAuthorization(authorizationId: string): Promise<void> {
  await prisma.oAuthAuthorization.update({
    where: { id: authorizationId },
    data: { revokedAt: new Date() },
  });
}

export async function getUserAuthorizations(userId: string): Promise<OAuthAuthorizationInfo[]> {
  const authorizations = await prisma.oAuthAuthorization.findMany({
    where: { userId, revokedAt: null },
    include: { app: true },
    orderBy: { createdAt: "desc" },
  });

  return authorizations.map((authorization) => ({
    id: authorization.id,
    appName: authorization.app.name,
    scopes: JSON.parse(authorization.scopes),
    createdAt: authorization.createdAt.toISOString(),
    expiresAt: authorization.tokenExpiresAt?.toISOString() ?? null,
  }));
}

export async function publishPlugin(data: {
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: string;
  developerName: string;
  appId?: string;
  pricing?: string;
  priceEuro?: number;
}): Promise<MarketplacePluginInfo> {
  const plugin = await prisma.marketplacePlugin.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      longDescription: data.longDescription ?? null,
      category: data.category,
      developerName: data.developerName,
      appId: data.appId ?? null,
      pricing: data.pricing ?? "free",
      priceEuro: data.priceEuro ?? null,
    },
  });

  return { ...mapPlugin(plugin), isInstalled: false };
}

export async function getMarketplacePlugins(cerId?: string): Promise<MarketplacePluginInfo[]> {
  const plugins = await prisma.marketplacePlugin.findMany({
    where: { isPublished: true },
    orderBy: { installCount: "desc" },
  });

  let installations: string[] = [];
  if (cerId) {
    const installs = await prisma.pluginInstallation.findMany({
      where: { cerId, status: "active" },
    });
    installations = installs.map((installation) => installation.pluginId);
  }

  return plugins.map((plugin) => ({ ...mapPlugin(plugin), isInstalled: installations.includes(plugin.id) }));
}

export async function installPlugin(pluginId: string, cerId: string, installedBy: string): Promise<PluginInstallationInfo> {
  const plugin = await prisma.marketplacePlugin.findUnique({ where: { id: pluginId } });
  if (!plugin) throw new Error("Plugin not found");

  const existing = await prisma.pluginInstallation.findUnique({
    where: { pluginId_cerId: { pluginId, cerId } },
    include: { plugin: true },
  });

  if (existing?.status === "active") {
    return {
      id: existing.id,
      pluginId: existing.pluginId,
      pluginName: existing.plugin.name,
      cerId: existing.cerId,
      config: existing.config ? JSON.parse(existing.config) : null,
      status: existing.status,
      createdAt: existing.createdAt.toISOString(),
    };
  }

  const installation = existing
    ? await prisma.pluginInstallation.update({
        where: { id: existing.id },
        data: { status: "active", installedBy },
        include: { plugin: true },
      })
    : await prisma.pluginInstallation.create({
        data: { pluginId, cerId, installedBy, status: "active" },
        include: { plugin: true },
      });

  await prisma.marketplacePlugin.update({
    where: { id: pluginId },
    data: { installCount: { increment: 1 } },
  });

  return {
    id: installation.id,
    pluginId: installation.pluginId,
    pluginName: installation.plugin.name,
    cerId: installation.cerId,
    config: installation.config ? JSON.parse(installation.config) : null,
    status: installation.status,
    createdAt: installation.createdAt.toISOString(),
  };
}

export async function uninstallPlugin(pluginId: string, cerId: string): Promise<boolean> {
  const existing = await prisma.pluginInstallation.findUnique({ where: { pluginId_cerId: { pluginId, cerId } } });
  if (!existing || existing.status !== "active") {
    return false;
  }

  await prisma.pluginInstallation.update({
    where: { id: existing.id },
    data: { status: "uninstalled" },
  });

  const plugin = await prisma.marketplacePlugin.findUnique({ where: { id: pluginId }, select: { installCount: true } });
  await prisma.marketplacePlugin.update({
    where: { id: pluginId },
    data: { installCount: Math.max((plugin?.installCount ?? 1) - 1, 0) },
  });

  return true;
}

export async function getInstalledPlugins(cerId: string): Promise<PluginInstallationInfo[]> {
  const installations = await prisma.pluginInstallation.findMany({
    where: { cerId, status: "active" },
    include: { plugin: true },
    orderBy: { createdAt: "desc" },
  });

  return installations.map((installation) => ({
    id: installation.id,
    pluginId: installation.pluginId,
    pluginName: installation.plugin.name,
    cerId: installation.cerId,
    config: installation.config ? JSON.parse(installation.config) : null,
    status: installation.status,
    createdAt: installation.createdAt.toISOString(),
  }));
}

export function getOpenApiSpec(): OpenApiSpec {
  return generateOpenApiSpec();
}

export async function getDeveloperDashboard(cerId?: string): Promise<DeveloperDashboard> {
  const [apps, plugins, activeAuthorizations, totalApiCalls] = await Promise.all([
    prisma.oAuthApp.findMany({ orderBy: { createdAt: "desc" } }),
    getMarketplacePlugins(cerId),
    prisma.oAuthAuthorization.count({ where: { revokedAt: null } }),
    prisma.apiUsageLog.count(),
  ]);
  const installedPlugins = cerId ? await getInstalledPlugins(cerId) : [];
  const apiSpec = summarizeOpenApiSpec();

  return {
    apps: apps.map(mapOAuthApp),
    plugins,
    installedPlugins,
    stats: {
      totalApps: apps.length,
      totalPlugins: plugins.length,
      totalInstalls: plugins.reduce((sum, plugin) => sum + plugin.installCount, 0),
      totalApiCalls,
      activeAuthorizations,
    },
    apiSpec,
  };
}

function mapOAuthApp(app: {
  id: string;
  name: string;
  description: string | null;
  developerName: string;
  developerEmail: string;
  clientId: string;
  redirectUris: string;
  scopes: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  status: string;
  isPublished: boolean;
  installCount: number;
  createdAt: Date;
}): OAuthAppInfo {
  return {
    id: app.id,
    name: app.name,
    description: app.description,
    developerName: app.developerName,
    developerEmail: app.developerEmail,
    clientId: app.clientId,
    redirectUris: JSON.parse(app.redirectUris),
    scopes: JSON.parse(app.scopes),
    logoUrl: app.logoUrl,
    websiteUrl: app.websiteUrl,
    status: app.status,
    isPublished: app.isPublished,
    installCount: app.installCount,
    createdAt: app.createdAt.toISOString(),
  };
}

function mapPlugin(plugin: {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string | null;
  category: string;
  version: string;
  developerName: string;
  iconUrl: string | null;
  pricing: string;
  priceEuro: number | null;
  installCount: number;
  rating: number | null;
  reviewCount: number;
  isVerified: boolean;
}): Omit<MarketplacePluginInfo, "isInstalled"> {
  return {
    id: plugin.id,
    name: plugin.name,
    slug: plugin.slug,
    description: plugin.description,
    longDescription: plugin.longDescription,
    category: plugin.category,
    version: plugin.version,
    developerName: plugin.developerName,
    iconUrl: plugin.iconUrl,
    pricing: plugin.pricing,
    priceEuro: plugin.priceEuro,
    installCount: plugin.installCount,
    rating: plugin.rating,
    reviewCount: plugin.reviewCount,
    isVerified: plugin.isVerified,
  };
}
