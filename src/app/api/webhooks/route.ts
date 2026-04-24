import { createWebhook, getWebhooks, getWebhookDeliveries, WEBHOOK_EVENTS } from "@/lib/api-platform";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
  const body = await request.json() as {
    url?: string;
    events?: string[];
    createdBy?: string;
  };

  if (!body.url || !body.events?.length) {
    return Response.json({ error: "URL e eventi richiesti." }, { status: 400 });
  }

  const webhook = await createWebhook({
    url: body.url,
    events: body.events,
    createdBy: body.createdBy || "admin",
  });
  return Response.json(webhook, { status: 201 });
}
