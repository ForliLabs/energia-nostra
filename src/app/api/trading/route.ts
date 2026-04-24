import { createOffer, getActiveOffers, acceptOffer, getTradingHistory, getTradingStats, getTradingAccounts } from "@/lib/trading";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";
  const view = searchParams.get("view"); // offers | history | stats | accounts

  if (view === "offers") {
    const offers = await getActiveOffers(cerId);
    return Response.json({ offers });
  }
  if (view === "history") {
    const trades = await getTradingHistory(cerId);
    return Response.json({ trades });
  }
  if (view === "accounts") {
    const accounts = await getTradingAccounts(cerId);
    return Response.json({ accounts });
  }

  // Default: full stats
  const stats = await getTradingStats(cerId);
  const offers = await getActiveOffers(cerId);
  const history = await getTradingHistory(cerId);
  return Response.json({ stats, offers, recentTrades: history.slice(0, 10) });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action?: string;
    sellerId?: string;
    sellerName?: string;
    cerId?: string;
    kwh?: number;
    pricePerKwh?: number;
    validFrom?: string;
    validTo?: string;
    offerId?: string;
    buyerId?: string;
    buyerName?: string;
  };

  if (body.action === "create-offer") {
    if (!body.sellerId || !body.sellerName || !body.kwh || !body.pricePerKwh) {
      return Response.json({ error: "Parametri mancanti per creare un'offerta." }, { status: 400 });
    }
    const offer = await createOffer({
      sellerId: body.sellerId,
      sellerName: body.sellerName,
      cerId: body.cerId || "cer-bertinoro",
      kwh: body.kwh,
      pricePerKwh: body.pricePerKwh,
      validFrom: body.validFrom || new Date().toISOString(),
      validTo: body.validTo || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    return Response.json(offer, { status: 201 });
  }

  if (body.action === "accept-offer") {
    if (!body.offerId || !body.buyerId || !body.buyerName) {
      return Response.json({ error: "Parametri mancanti per accettare l'offerta." }, { status: 400 });
    }
    const trade = await acceptOffer(body.offerId, body.buyerId, body.buyerName, body.kwh);
    if (!trade) {
      return Response.json({ error: "Impossibile accettare l'offerta." }, { status: 400 });
    }
    return Response.json(trade, { status: 201 });
  }

  return Response.json({ error: "Azione non riconosciuta." }, { status: 400 });
}
