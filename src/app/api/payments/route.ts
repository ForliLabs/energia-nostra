import {
  createSepaMandate,
  createStripeCheckout,
  generateCertificazioneUnica,
  generatePagopaNotice,
  getPayments,
  getPaymentStats,
  simulatePayment,
} from "@/lib/payments";
import { getCurrentSession, hasRequiredRole, resolveSessionCerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");
  const includeStats = searchParams.get("includeStats") === "true";
  const session = await getCurrentSession();
  const cerId = resolveSessionCerId(session, searchParams.get("cerId"));
  const invoiceId = searchParams.get("invoiceId");

  if (view === "stats") {
    const stats = await getPaymentStats(cerId);
    return Response.json({ stats });
  }

  if (view === "cu") {
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);
    const cu = generateCertificazioneUnica(
      searchParams.get("memberName") || "Membro CER",
      searchParams.get("fiscalCode") || "RSSMRA80A01D704Z",
      year,
      Number.parseFloat(searchParams.get("incentives") || "0"),
      Number.parseFloat(searchParams.get("payments") || "0"),
    );
    return Response.json({ certificazioneUnica: cu });
  }

  const payments = await getPayments({ invoiceId: invoiceId || undefined, cerId });
  if (!includeStats) {
    return Response.json({ payments });
  }

  const stats = await getPaymentStats(cerId);
  return Response.json({ payments, stats });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Accedi per gestire i pagamenti." }, { status: 401 });
  }

  const body = (await request.json()) as {
    action: string;
    invoiceId?: string;
    memberId?: string;
    iban?: string;
    provider?: "stripe" | "pagopa";
    successUrl?: string;
    cancelUrl?: string;
  };

  switch (body.action) {
    case "checkout": {
      if (!body.invoiceId) {
        return Response.json({ error: "invoiceId obbligatorio" }, { status: 400 });
      }
      try {
        const sessionCheckout = await createStripeCheckout(
          body.invoiceId,
          body.successUrl || `${process.env.APP_URL || "http://localhost:3000"}/dashboard/billing?payment=success`,
          body.cancelUrl || `${process.env.APP_URL || "http://localhost:3000"}/dashboard/billing?payment=cancelled`,
        );
        return Response.json(sessionCheckout, { status: 201 });
      } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 400 });
      }
    }

    case "pagopa-notice": {
      if (!body.invoiceId) {
        return Response.json({ error: "invoiceId obbligatorio" }, { status: 400 });
      }
      try {
        const notice = await generatePagopaNotice(body.invoiceId);
        return Response.json(notice, { status: 201 });
      } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 400 });
      }
    }

    case "sepa-mandate": {
      if (!body.memberId || !body.iban) {
        return Response.json({ error: "memberId e iban obbligatori" }, { status: 400 });
      }
      const mandate = await createSepaMandate(body.memberId, body.iban);
      return Response.json(mandate, { status: 201 });
    }

    case "simulate": {
      if (!hasRequiredRole(session, ["admin", "auditor", "superadmin"])) {
        return Response.json({ error: "Solo amministratori e revisori possono simulare un pagamento." }, { status: 403 });
      }
      if (!body.invoiceId) {
        return Response.json({ error: "invoiceId obbligatorio" }, { status: 400 });
      }
      try {
        const payment = await simulatePayment(body.invoiceId, body.provider);
        return Response.json(payment, { status: 201 });
      } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 400 });
      }
    }

    default:
      return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
  }
}
