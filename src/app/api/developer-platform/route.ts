import {
  approveOAuthApp,
  createAuthorization,
  exchangeCodeForToken,
  getDeveloperDashboard,
  getOpenApiSpec,
  installPlugin,
  publishPlugin,
  registerOAuthApp,
  revokeAuthorization,
  uninstallPlugin,
} from "@/lib/developer-platform";
import { enforceMutationSecurity, isTrustedExternalUrl } from "@/lib/security";
import { getCurrentSession, hasRequiredRole, resolveSessionCerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "openapi") {
    return Response.json(getOpenApiSpec());
  }

  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Accedi per consultare la developer platform." }, { status: 401 });
  }

  const cerId = resolveSessionCerId(session, searchParams.get("cerId"));
  const dashboard = await getDeveloperDashboard(cerId);
  return Response.json(dashboard);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    name?: string;
    description?: string;
    developerName?: string;
    developerEmail?: string;
    redirectUris?: string[];
    scopes?: string[];
    websiteUrl?: string;
    privacyUrl?: string;
    appId?: string;
    userId?: string;
    cerId?: string;
    code?: string;
    clientId?: string;
    authorizationId?: string;
    slug?: string;
    longDescription?: string;
    category?: string;
    version?: string;
    pricing?: string;
    priceEuro?: number;
    pluginId?: string;
    installedBy?: string;
  };

  if (body.action === "exchange-token" && body.code && body.clientId) {
    const tokenGuard = enforceMutationSecurity(request, {
      rateLimitCategory: "auth",
      rateLimitKey: `developer-token:${body.clientId}`,
    });
    if (!tokenGuard.ok) {
      return tokenGuard.response;
    }
    try {
      const tokens = await exchangeCodeForToken(body.code, body.clientId);
      return Response.json(tokens);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore token exchange";
      return Response.json({ error: message }, { status: 400 });
    }
  }

  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Accedi per gestire app e plugin." }, { status: 401 });
  }
  const sessionUser = session.user;
  const guard = enforceMutationSecurity(request, {
    csrfToken: session.source === "production" ? session.csrfToken ?? null : null,
    rateLimitKey: `developer-platform:${sessionUser.id}`,
  });
  if (!guard.ok) {
    return guard.response;
  }

  if (body.action === "register-app") {
    if (!body.name || !body.redirectUris?.length || !body.scopes?.length) {
      return Response.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
    }
    if (!body.redirectUris.every((uri) => isTrustedExternalUrl(uri))) {
      return Response.json({ error: "Usa redirect URI HTTPS validi oppure localhost in sviluppo." }, { status: 400 });
    }
    if (body.websiteUrl && !isTrustedExternalUrl(body.websiteUrl)) {
      return Response.json({ error: "Il sito dell'app deve usare HTTPS valido." }, { status: 400 });
    }
    if (body.privacyUrl && !isTrustedExternalUrl(body.privacyUrl)) {
      return Response.json({ error: "L'URL privacy deve usare HTTPS valido." }, { status: 400 });
    }
    try {
      const result = await registerOAuthApp({
        name: body.name,
        description: body.description,
        developerName: body.developerName || sessionUser.name,
        developerEmail: body.developerEmail || sessionUser.email,
        redirectUris: body.redirectUris,
        scopes: body.scopes,
        websiteUrl: body.websiteUrl,
        privacyUrl: body.privacyUrl,
      });
      return Response.json(result, { status: 201 });
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 400 });
    }
  }

  if (body.action === "approve-app" && body.appId) {
    if (!hasRequiredRole(session, ["admin", "superadmin"])) {
      return Response.json({ error: "Solo gli amministratori possono approvare app OAuth." }, { status: 403 });
    }
    await approveOAuthApp(body.appId);
    return Response.json({ success: true });
  }

  if (body.action === "authorize" && body.appId && body.scopes) {
    const result = await createAuthorization(body.appId, body.userId || sessionUser.id, resolveSessionCerId(session, body.cerId), body.scopes);
    return Response.json(result, { status: 201 });
  }

  if (body.action === "revoke" && body.authorizationId) {
    await revokeAuthorization(body.authorizationId);
    return Response.json({ success: true });
  }

  if (body.action === "publish-plugin") {
    if (!body.name || !body.slug || !body.description || !body.category) {
      return Response.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
    }
    const plugin = await publishPlugin({
      name: body.name,
      slug: body.slug,
      description: body.description,
      longDescription: body.longDescription,
      category: body.category,
      developerName: body.developerName || sessionUser.name,
      appId: body.appId,
      pricing: body.pricing,
      priceEuro: body.priceEuro,
    });
    return Response.json({ plugin }, { status: 201 });
  }

  if (body.action === "install-plugin" && body.pluginId) {
    try {
      const installation = await installPlugin(body.pluginId, resolveSessionCerId(session, body.cerId), body.installedBy || sessionUser.email);
      return Response.json({ installation }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore installazione";
      return Response.json({ error: message }, { status: 400 });
    }
  }

  if (body.action === "uninstall-plugin" && body.pluginId) {
    const removed = await uninstallPlugin(body.pluginId, resolveSessionCerId(session, body.cerId));
    if (!removed) {
      return Response.json({ error: "Plugin non installato per la CER selezionata." }, { status: 404 });
    }
    return Response.json({ success: true });
  }

  return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
}
