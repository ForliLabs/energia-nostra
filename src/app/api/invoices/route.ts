import { getAllInvoices, getBillingStats, markInvoicePaid } from "@/lib/billing";
import { getCurrentSession, hasRequiredRole, resolveSessionCerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = await getCurrentSession();
  const cerId = resolveSessionCerId(session, searchParams.get("cerId"));

  const [invoices, stats] = await Promise.all([getAllInvoices(cerId), getBillingStats(cerId)]);
  return Response.json({ invoices, stats });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!hasRequiredRole(session, ["admin", "auditor", "superadmin"])) {
    return Response.json({ error: "Permessi insufficienti per aggiornare la fatturazione." }, { status: session ? 403 : 401 });
  }

  const body = (await request.json()) as { action?: string; invoiceId?: string };

  if (body.action === "mark-paid" && body.invoiceId) {
    const updated = await markInvoicePaid(body.invoiceId);
    if (!updated) {
      return Response.json({ error: "Fattura non trovata." }, { status: 404 });
    }
    return Response.json(updated);
  }

  return Response.json({ error: "Azione non riconosciuta." }, { status: 400 });
}
