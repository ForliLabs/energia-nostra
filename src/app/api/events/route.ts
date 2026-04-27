import { createSSEStream, eventBus } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * GET: SSE event stream — clients subscribe to real-time domain events.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";

  const stream = createSSEStream(cerId);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * POST: Emit a domain event (admin/internal use).
 */
export async function POST(request: Request) {
  const body = await request.json() as {
    type: string;
    payload: Record<string, unknown>;
    cerId?: string;
    userId?: string;
  };

  if (!body.type || !body.payload) {
    return Response.json({ error: "type e payload sono obbligatori" }, { status: 400 });
  }

  const event = await eventBus.emit(
    body.type as Parameters<typeof eventBus.emit>[0],
    body.payload,
    { cerId: body.cerId, userId: body.userId }
  );

  return Response.json(event, { status: 201 });
}
