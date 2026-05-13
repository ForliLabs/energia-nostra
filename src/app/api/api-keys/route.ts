import { createApiKey, getApiKeys, revokeApiKey, getApiUsageStats, getOpenApiSpec } from "@/lib/api-platform";
import { getCurrentSession, hasRequiredRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "spec") {
    return Response.json(getOpenApiSpec());
  }

  const session = await getCurrentSession();
  if (!hasRequiredRole(session, ["admin", "superadmin"])) {
    return Response.json({ error: "Permessi insufficienti per consultare la piattaforma API." }, { status: session ? 403 : 401 });
  }

  if (view === "stats") {
    const stats = await getApiUsageStats();
    return Response.json({ stats });
  }

  const [keys, stats] = await Promise.all([getApiKeys(), getApiUsageStats()]);
  return Response.json({ keys, stats });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Autenticazione richiesta per gestire API key." }, { status: 401 });
  }
  if (!hasRequiredRole(session, ["admin", "superadmin"])) {
    return Response.json({ error: "Permessi insufficienti per gestire API key." }, { status: 403 });
  }
  const sessionUser = session.user;

  const body = (await request.json()) as {
    action?: string;
    name?: string;
    scopes?: string[];
    rateLimit?: number;
    keyId?: string;
  };

  if (body.action === "create") {
    if (!body.name || !body.scopes?.length) {
      return Response.json({ error: "Nome e scope richiesti." }, { status: 400 });
    }
    const result = await createApiKey({
      name: body.name,
      scopes: body.scopes,
      rateLimit: body.rateLimit,
      createdBy: sessionUser.email,
    });
    return Response.json(result, { status: 201 });
  }

  if (body.action === "revoke" && body.keyId) {
    await revokeApiKey(body.keyId);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Azione non riconosciuta." }, { status: 400 });
}
