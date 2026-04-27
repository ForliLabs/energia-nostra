import {
  createStripeCheckout,
  generatePagopaNotice,
  createSepaMandate,
  getPayments,
  getPaymentStats,
  simulatePayment,
  generateCertificazioneUnica,
} from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");
  const cerId = searchParams.get("cerId") || "cer-bertinoro";
  const invoiceId = searchParams.get("invoiceId");

  if (view === "stats") {
    const stats = await getPaymentStats(cerId);
    return Response.json({ stats });
  }

  if (view === "cu") {
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const cu = generateCertificazioneUnica(
      searchParams.get("memberName") || "Membro CER",
      searchParams.get("fiscalCode") || "RSSMRA80A01D704Z",
      year,
      parseFloat(searchParams.get("incentives") || "0"),
      parseFloat(searchParams.get("payments") || "0")
    );
    return Response.json({ certificazioneUnica: cu });
  }

  const payments = await getPayments(invoiceId || undefined);
  return Response.json({ payments });
}

export async function POST(request: Request) {
  const body = await request.json() as {
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
        const session = await createStripeCheckout(
          body.invoiceId,
          body.successUrl || `${process.env.APP_URL || "http://localhost:3000"}/dashboard/billing?payment=success`,
          body.cancelUrl || `${process.env.APP_URL || "http://localhost:3000"}/dashboard/billing?payment=cancelled`
        );
        return Response.json(session, { status: 201 });
      } catch (err) {
        return Response.json({ error: (err as Error).message }, { status: 400 });
      }
    }

    case "pagopa-notice": {
      if (!body.invoiceId) {
        return Response.json({ error: "invoiceId obbligatorio" }, { status: 400 });
      }
      try {
        const notice = await generatePagopaNotice(body.invoiceId);
        return Response.json(notice, { status: 201 });
      } catch (err) {
        return Response.json({ error: (err as Error).message }, { status: 400 });
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
      if (!body.invoiceId) {
        return Response.json({ error: "invoiceId obbligatorio" }, { status: 400 });
      }
      try {
        const payment = await simulatePayment(body.invoiceId, body.provider);
        return Response.json(payment, { status: 201 });
      } catch (err) {
        return Response.json({ error: (err as Error).message }, { status: 400 });
      }
    }

    default:
      return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
  }
}
