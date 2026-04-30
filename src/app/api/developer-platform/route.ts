import {
  getDeveloperDashboard, registerOAuthApp, approveOAuthApp,
  createAuthorization, exchangeCodeForToken, revokeAuthorization,
  publishPlugin, installPlugin, uninstallPlugin, getOpenApiSpec,
} from "@/lib/developer-platform";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || undefined;
  const view = searchParams.get("view"); // dashboard | openapi

  if (view === "openapi") {
    const spec = getOpenApiSpec();
    return Response.json(spec);
  }

  const dashboard = await getDeveloperDashboard(cerId);
  return Response.json(dashboard);
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    // OAuth app registration
    name?: string; description?: string; developerName?: string;
    developerEmail?: string; redirectUris?: string[]; scopes?: string[];
    websiteUrl?: string; privacyUrl?: string;
    // OAuth authorization
    appId?: string; userId?: string; cerId?: string;
    code?: string; clientId?: string;
    authorizationId?: string;
    // Plugin marketplace
    slug?: string; longDescription?: string; category?: string;
    version?: string; pricing?: string; priceEuro?: number;
    pluginId?: string; installedBy?: string;
  };

  if (body.action === "register-app") {
    if (!body.name || !body.developerName || !body.developerEmail || !body.redirectUris || !body.scopes) {
      return Response.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
    }
    const app = await registerOAuthApp({
      name: body.name, description: body.description,
      developerName: body.developerName, developerEmail: body.developerEmail,
      redirectUris: body.redirectUris, scopes: body.scopes,
      websiteUrl: body.websiteUrl, privacyUrl: body.privacyUrl,
    });
    return Response.json({ app }, { status: 201 });
  }

  if (body.action === "approve-app" && body.appId) {
    await approveOAuthApp(body.appId);
    return Response.json({ success: true });
  }

  if (body.action === "authorize" && body.appId && body.userId && body.cerId && body.scopes) {
    const result = await createAuthorization(body.appId, body.userId, body.cerId, body.scopes);
    return Response.json(result, { status: 201 });
  }

  if (body.action === "exchange-token" && body.code && body.clientId) {
    try {
      const tokens = await exchangeCodeForToken(body.code, body.clientId);
      return Response.json(tokens);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore token exchange";
      return Response.json({ error: message }, { status: 400 });
    }
  }

  if (body.action === "revoke" && body.authorizationId) {
    await revokeAuthorization(body.authorizationId);
    return Response.json({ success: true });
  }

  if (body.action === "publish-plugin") {
    if (!body.name || !body.slug || !body.description || !body.category || !body.developerName) {
      return Response.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
    }
    const plugin = await publishPlugin({
      name: body.name, slug: body.slug, description: body.description,
      longDescription: body.longDescription, category: body.category,
      developerName: body.developerName, appId: body.appId,
      pricing: body.pricing, priceEuro: body.priceEuro,
    });
    return Response.json({ plugin }, { status: 201 });
  }

  if (body.action === "install-plugin" && body.pluginId && body.cerId && body.installedBy) {
    try {
      const installation = await installPlugin(body.pluginId, body.cerId, body.installedBy);
      return Response.json({ installation }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore installazione";
      return Response.json({ error: message }, { status: 400 });
    }
  }

  if (body.action === "uninstall-plugin" && body.pluginId && body.cerId) {
    await uninstallPlugin(body.pluginId, body.cerId);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
}
