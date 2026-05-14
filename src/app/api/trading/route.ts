import {
  TRADING_PRICE_CEILING,
  TRADING_PRICE_FLOOR,
  acceptOffer,
  createOffer,
  getActiveOffers,
  getMemberOpenOffers,
  getTradingAccounts,
  getTradingHistory,
  getTradingStats,
} from "@/lib/trading";
import { resolveMemberForSessionUser } from "@/lib/member-context";
import { enforceMutationSecurity } from "@/lib/security";
import { getCurrentSession, resolveSessionCerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = await getCurrentSession();
  const cerId = resolveSessionCerId(session, searchParams.get("cerId"));
  const view = searchParams.get("view");
  const member = session ? await resolveMemberForSessionUser(session.user, cerId) : null;

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
  if (view === "member") {
    if (!member) {
      return Response.json({ member: null, myOffers: [], myAccount: null });
    }
    const [myOffers, accounts] = await Promise.all([getMemberOpenOffers(member.id, cerId), getTradingAccounts(cerId)]);
    return Response.json({
      member,
      myOffers,
      myAccount: accounts.find((account) => account.memberId === member.id) ?? null,
    });
  }

  const [stats, offers, history, accounts, myOffers] = await Promise.all([
    getTradingStats(cerId),
    getActiveOffers(cerId),
    getTradingHistory(cerId),
    getTradingAccounts(cerId),
    member ? getMemberOpenOffers(member.id, cerId) : Promise.resolve([]),
  ]);

  return Response.json({
    stats,
    offers,
    recentTrades: history.slice(0, 10),
    member,
    myOffers,
    myAccount: member ? accounts.find((account) => account.memberId === member.id) ?? null : null,
    constraints: {
      priceFloor: TRADING_PRICE_FLOOR,
      priceCeiling: TRADING_PRICE_CEILING,
    },
  });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Accedi per operare sul mercato P2P." }, { status: 401 });
  }

  const guard = enforceMutationSecurity(request, {
    csrfToken: session.source === "production" ? session.csrfToken ?? null : null,
    rateLimitKey: `trading:${session.user.id}`,
  });
  if (!guard.ok) {
    return guard.response;
  }

  const body = (await request.json()) as {
    action?: string;
    cerId?: string;
    kwh?: number;
    pricePerKwh?: number;
    validFrom?: string;
    validTo?: string;
    offerId?: string;
  };
  const cerId = resolveSessionCerId(session, body.cerId);
  const member = await resolveMemberForSessionUser(session.user, cerId);

  if (!member) {
    return Response.json({ error: "Il tuo account non è ancora associato a un membro CER abilitato al trading." }, { status: 409 });
  }

  if (body.action === "create-offer") {
    if (!body.kwh || !body.pricePerKwh) {
      return Response.json({ error: "Quantità e prezzo sono obbligatori per creare un'offerta." }, { status: 400 });
    }
    if (body.kwh <= 0 || body.pricePerKwh <= 0) {
      return Response.json({ error: "Quantità e prezzo devono essere maggiori di zero." }, { status: 400 });
    }
    try {
      const offer = await createOffer({
        sellerId: member.id,
        sellerName: member.name,
        cerId,
        kwh: body.kwh,
        pricePerKwh: body.pricePerKwh,
        validFrom: body.validFrom || new Date().toISOString(),
        validTo: body.validTo || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
      return Response.json(offer, { status: 201 });
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 400 });
    }
  }

  if (body.action === "accept-offer") {
    if (!body.offerId) {
      return Response.json({ error: "Seleziona un'offerta da accettare." }, { status: 400 });
    }
    const trade = await acceptOffer(body.offerId, member.id, member.name, body.kwh);
    if (!trade) {
      return Response.json({ error: "Impossibile accettare l'offerta selezionata." }, { status: 400 });
    }
    return Response.json(trade, { status: 201 });
  }

  return Response.json({ error: "Azione non riconosciuta." }, { status: 400 });
}
