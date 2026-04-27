import { handleStripeWebhook } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret && !signature) {
    return Response.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await request.json() as {
    type: string;
    data: { object: Record<string, unknown> };
  };

  // In production, verify signature with Stripe SDK
  // For now, process the event directly
  try {
    await handleStripeWebhook(body.type, body.data.object);
    return Response.json({ received: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
