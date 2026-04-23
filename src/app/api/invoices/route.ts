import { getMembers, getIncentiveDistribution } from "@/lib/data-db";
import { getAllInvoices, getBillingStats, markInvoicePaid } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function GET() {
  const [members, incentives] = await Promise.all([getMembers(), getIncentiveDistribution()]);
  const invoices = getAllInvoices(members, incentives);
  const stats = getBillingStats(members, incentives);
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
