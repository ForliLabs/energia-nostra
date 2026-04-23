import { cerMembers, memberIncentiveDistribution } from "@/lib/data";
import { getAllInvoices, getBillingStats, markInvoicePaid } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function GET() {
  const invoices = getAllInvoices(cerMembers, memberIncentiveDistribution);
  const stats = getBillingStats(cerMembers, memberIncentiveDistribution);
  return Response.json({ invoices, stats });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string; invoiceId?: string };

  if (body.action === "mark-paid" && body.invoiceId) {
    const updated = markInvoicePaid(body.invoiceId);
    if (!updated) {
      return Response.json({ error: "Fattura non trovata." }, { status: 404 });
    }
    return Response.json(updated);
  }

  return Response.json({ error: "Azione non riconosciuta." }, { status: 400 });
}
