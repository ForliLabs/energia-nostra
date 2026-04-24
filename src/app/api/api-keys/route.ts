import { createApiKey, getApiKeys, revokeApiKey, getApiUsageStats, getOpenApiSpec } from "@/lib/api-platform";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view"); // keys | stats | spec

  if (view === "spec") {
    return Response.json(getOpenApiSpec());
  }

  if (view === "stats") {
    const stats = await getApiUsageStats();
    return Response.json({ stats });
  }

  const keys = await getApiKeys();
  const stats = await getApiUsageStats();
  return Response.json({ keys, stats });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    name?: string;
    scopes?: string[];
    rateLimit?: number;
    createdBy?: string;
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
      createdBy: body.createdBy || "admin",
    });
    return Response.json(result, { status: 201 });
  }

  if (body.action === "revoke" && body.keyId) {
    await revokeApiKey(body.keyId);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Azione non riconosciuta." }, { status: 400 });
}
