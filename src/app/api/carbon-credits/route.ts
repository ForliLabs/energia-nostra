import { getCarbonDashboard, purchaseCredits, issueCredits, calculateCo2Avoidance } from "@/lib/carbon-credits";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";
  const view = searchParams.get("view"); // avoidance | dashboard

  if (view === "avoidance") {
    const avoidance = await calculateCo2Avoidance(cerId);
    return Response.json(avoidance);
  }

  const dashboard = await getCarbonDashboard(cerId);
  return Response.json(dashboard);
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    cerId?: string;
    cerName?: string;
    vintage?: string;
    co2Tonnes?: number;
    pricePerTonne?: number;
    creditId?: string;
    buyerName?: string;
    buyerType?: string;
    tonnes?: number;
  };

  if (body.action === "issue") {
    if (!body.cerId || !body.cerName || !body.co2Tonnes) {
      return Response.json({ error: "CER ID, nome e tonnellate CO₂ richiesti." }, { status: 400 });
    }
    const credit = await issueCredits(
      body.cerId, body.cerName, body.vintage || String(new Date().getFullYear()),
      body.co2Tonnes, body.pricePerTonne
    );
    return Response.json(credit, { status: 201 });
  }

  if (body.action === "purchase") {
    if (!body.creditId || !body.buyerName || !body.buyerType || !body.tonnes) {
      return Response.json({ error: "Credit ID, acquirente e tonnellate richiesti." }, { status: 400 });
    }
    const tx = await purchaseCredits({
      creditId: body.creditId,
      buyerName: body.buyerName,
      buyerType: body.buyerType,
      tonnes: body.tonnes,
    });
    if (!tx) {
      return Response.json({ error: "Credito non disponibile o tonnellate insufficienti." }, { status: 400 });
    }
    return Response.json(tx, { status: 201 });
  }

  return Response.json({ error: "Azione non riconosciuta." }, { status: 400 });
}
