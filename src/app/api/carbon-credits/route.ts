import { getCarbonDashboard, purchaseCredits, issueCredits, calculateCo2Avoidance, retireCredits } from "@/lib/carbon-credits";
import { getCurrentSession, hasRequiredRole, resolveSessionCerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = await getCurrentSession();
  const cerId = resolveSessionCerId(session, searchParams.get("cerId"));
  const view = searchParams.get("view");

  if (view === "avoidance") {
    const avoidance = await calculateCo2Avoidance(cerId);
    return Response.json(avoidance);
  }

  const dashboard = await getCarbonDashboard(cerId);
  return Response.json(dashboard);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Accedi per gestire il portafoglio carbon credits." }, { status: 401 });
  }

  const body = (await request.json()) as {
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
  const cerId = resolveSessionCerId(session, body.cerId);

  if (body.action === "issue") {
    if (!hasRequiredRole(session, ["admin", "superadmin"])) {
      return Response.json({ error: "Solo gli amministratori possono emettere crediti carbonio." }, { status: 403 });
    }
    if (!body.co2Tonnes) {
      return Response.json({ error: "Tonnellate CO₂ richieste." }, { status: 400 });
    }
    try {
      const credit = await issueCredits({
        cerId,
        cerName: body.cerName,
        vintage: body.vintage || String(new Date().getFullYear()),
        co2Tonnes: body.co2Tonnes,
        pricePerTonne: body.pricePerTonne,
      });
      return Response.json(credit, { status: 201 });
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 400 });
    }
  }

  if (body.action === "purchase") {
    if (!body.creditId || !body.tonnes) {
      return Response.json({ error: "Credit ID e tonnellate richiesti." }, { status: 400 });
    }
    const tx = await purchaseCredits({
      creditId: body.creditId,
      buyerName: body.buyerName || session.user.name,
      buyerType: body.buyerType || (hasRequiredRole(session, ["admin", "superadmin"]) ? "business" : "individual"),
      tonnes: body.tonnes,
    });
    if (!tx) {
      return Response.json({ error: "Credito non disponibile, non verificato o tonnellate insufficienti." }, { status: 400 });
    }
    return Response.json(tx, { status: 201 });
  }

  if (body.action === "retire") {
    if (!hasRequiredRole(session, ["admin", "superadmin"])) {
      return Response.json({ error: "Solo gli amministratori possono ritirare crediti dal portafoglio." }, { status: 403 });
    }
    if (!body.creditId) {
      return Response.json({ error: "Credit ID richiesto." }, { status: 400 });
    }
    const credit = await retireCredits(body.creditId);
    if (!credit) {
      return Response.json({ error: "Credito non disponibile per il ritiro." }, { status: 400 });
    }
    return Response.json(credit);
  }

  return Response.json({ error: "Azione non riconosciuta." }, { status: 400 });
}
