import {
  listTenants, getTenantBySlug, provisionTenant, updateTenantTheme,
  suspendTenant, reactivateTenant, getPlatformStats, createInvitation,
  acceptInvitation, getTenantUsageHistory,
} from "@/lib/multi-tenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view"); // tenants | tenant | stats | usage
  const slug = searchParams.get("slug");
  const tenantId = searchParams.get("tenantId");

  if (view === "tenant" && slug) {
    const tenant = await getTenantBySlug(slug);
    if (!tenant) return Response.json({ error: "Tenant non trovato" }, { status: 404 });
    return Response.json({ tenant });
  }

  if (view === "stats") {
    const stats = await getPlatformStats();
    return Response.json({ stats });
  }

  if (view === "usage" && tenantId) {
    const usage = await getTenantUsageHistory(tenantId);
    return Response.json({ usage });
  }

  const tenants = await listTenants();
  return Response.json({ tenants });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    name?: string; slug?: string; adminEmail?: string; adminName?: string;
    municipality?: string; province?: string; plan?: string;
    tenantId?: string; theme?: Record<string, string>;
    reason?: string; email?: string; role?: string; token?: string;
  };

  if (body.action === "provision") {
    if (!body.name || !body.slug || !body.adminEmail || !body.adminName || !body.municipality || !body.province) {
      return Response.json({ error: "Tutti i campi obbligatori sono richiesti" }, { status: 400 });
    }
    try {
      const tenant = await provisionTenant({
        name: body.name, slug: body.slug, adminEmail: body.adminEmail,
        adminName: body.adminName, municipality: body.municipality,
        province: body.province, plan: body.plan,
      });
      return Response.json({ tenant }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore provisioning";
      return Response.json({ error: message }, { status: 409 });
    }
  }

  if (body.action === "update-theme" && body.tenantId && body.theme) {
    await updateTenantTheme(body.tenantId, body.theme);
    return Response.json({ success: true });
  }

  if (body.action === "suspend" && body.tenantId && body.reason) {
    await suspendTenant(body.tenantId, body.reason);
    return Response.json({ success: true });
  }

  if (body.action === "reactivate" && body.tenantId) {
    await reactivateTenant(body.tenantId);
    return Response.json({ success: true });
  }

  if (body.action === "invite" && body.tenantId && body.email) {
    const result = await createInvitation(body.tenantId, body.email, body.role);
    return Response.json(result, { status: 201 });
  }

  if (body.action === "accept-invitation" && body.token) {
    try {
      const result = await acceptInvitation(body.token);
      return Response.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Token non valido";
      return Response.json({ error: message }, { status: 400 });
    }
  }

  return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
}
