import { createWebhook, getWebhookDeliveries, getWebhooks, WEBHOOK_EVENTS } from "@/lib/api-platform";
import { getCurrentSession, hasRequiredRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!hasRequiredRole(session, ["admin", "superadmin"])) {
    return Response.json({ error: "Permessi insufficienti per consultare i webhook." }, { status: session ? 403 : 401 });
  }

  const { searchParams } = new URL(request.url);
  const subscriptionId = searchParams.get("subscriptionId");

  if (subscriptionId) {
    const deliveries = await getWebhookDeliveries(subscriptionId);
    return Response.json({ deliveries });
  }

  const webhooks = await getWebhooks();
  return Response.json({ webhooks, availableEvents: WEBHOOK_EVENTS });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Autenticazione richiesta per gestire i webhook." }, { status: 401 });
  }
  if (!hasRequiredRole(session, ["admin", "superadmin"])) {
    return Response.json({ error: "Permessi insufficienti per gestire i webhook." }, { status: 403 });
  }
  const sessionUser = session.user;

  const body = (await request.json()) as { url?: string; events?: string[] };

  if (!body.url || !body.events?.length) {
    return Response.json({ error: "URL e eventi richiesti." }, { status: 400 });
  }

  try {
    const webhook = await createWebhook({
      url: body.url,
      events: body.events,
      createdBy: sessionUser.email,
    });
    return Response.json(webhook, { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
