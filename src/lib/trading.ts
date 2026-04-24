// P2P Energy Trading Ledger (Feature 5)

import { prisma } from "@/lib/prisma";

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

export interface TradeOffer {
  id: string;
  sellerId: string;
  sellerName: string;
  kwh: number;
  pricePerKwh: number;
  validFrom: string;
  validTo: string;
  status: string;
  createdAt: string;
}

export interface TradeRecord {
  id: string;
  offerId: string;
  buyerId: string;
  buyerName: string;
  sellerName: string;
  kwhTraded: number;
  pricePerKwh: number;
  totalEuro: number;
  status: string;
  createdAt: string;
}

export interface TradingStats {
  totalOffers: number;
  activeOffers: number;
  totalTrades: number;
  totalKwhTraded: number;
  totalVolumeEuro: number;
  avgPricePerKwh: number;
  activeTraders: number;
}

// GSE incentive rate as price floor, grid rate as ceiling
const PRICE_FLOOR = 0.11; // €/kWh (GSE incentive equivalent)
const PRICE_CEILING = 0.25; // €/kWh (grid purchase rate)

export async function createOffer(input: {
  sellerId: string;
  sellerName: string;
  cerId: string;
  kwh: number;
  pricePerKwh: number;
  validFrom: string;
  validTo: string;
}): Promise<TradeOffer> {
  const price = Math.max(PRICE_FLOOR, Math.min(PRICE_CEILING, input.pricePerKwh));
  const offer = await prisma.energyOffer.create({
    data: {
      sellerId: input.sellerId,
      sellerName: input.sellerName,
      cerId: input.cerId,
      kwh: input.kwh,
      pricePerKwh: round(price, 4),
      minPrice: PRICE_FLOOR,
      validFrom: input.validFrom,
      validTo: input.validTo,
      status: "open",
    },
  });
  return mapOffer(offer);
}

export async function getActiveOffers(cerId = "cer-bertinoro"): Promise<TradeOffer[]> {
  const offers = await prisma.energyOffer.findMany({
    where: { cerId, status: "open" },
    orderBy: { createdAt: "desc" },
  });
  return offers.map(mapOffer);
}

export async function acceptOffer(offerId: string, buyerId: string, buyerName: string, kwh?: number): Promise<TradeRecord | null> {
  const offer = await prisma.energyOffer.findUnique({ where: { id: offerId } });
  if (!offer || offer.status !== "open") return null;
  if (offer.sellerId === buyerId) return null;

  const tradedKwh = kwh ? Math.min(kwh, offer.kwh) : offer.kwh;
  const totalEuro = round(tradedKwh * offer.pricePerKwh);

  const trade = await prisma.tradeMatch.create({
    data: {
      offerId: offer.id,
      buyerId,
      buyerName,
      kwhTraded: tradedKwh,
      pricePerKwh: offer.pricePerKwh,
      totalEuro,
      status: "pending",
    },
  });

  // Update offer status
  const remainingKwh = offer.kwh - tradedKwh;
  if (remainingKwh <= 0) {
    await prisma.energyOffer.update({ where: { id: offerId }, data: { status: "matched" } });
  } else {
    await prisma.energyOffer.update({ where: { id: offerId }, data: { kwh: remainingKwh } });
  }

  // Update trading accounts
  await upsertTradingAccount(offer.sellerId, offer.sellerName, tradedKwh, totalEuro, "sell");
  await upsertTradingAccount(buyerId, buyerName, tradedKwh, totalEuro, "buy");

  return {
    id: trade.id, offerId: trade.offerId, buyerId, buyerName,
    sellerName: offer.sellerName, kwhTraded: trade.kwhTraded,
    pricePerKwh: trade.pricePerKwh, totalEuro: trade.totalEuro,
    status: trade.status, createdAt: trade.createdAt.toISOString(),
  };
}

async function upsertTradingAccount(memberId: string, memberName: string, kwh: number, euro: number, side: "buy" | "sell") {
  const existing = await prisma.tradingAccount.findUnique({ where: { memberId } });
  if (existing) {
    await prisma.tradingAccount.update({
      where: { memberId },
      data: side === "sell"
        ? { totalSold: { increment: euro }, totalKwhSold: { increment: kwh }, balanceEuro: { increment: euro } }
        : { totalBought: { increment: euro }, totalKwhBought: { increment: kwh }, balanceEuro: { decrement: euro } },
    });
  } else {
    await prisma.tradingAccount.create({
      data: {
        memberId, memberName,
        balanceEuro: side === "sell" ? euro : -euro,
        totalSold: side === "sell" ? euro : 0,
        totalBought: side === "buy" ? euro : 0,
        totalKwhSold: side === "sell" ? kwh : 0,
        totalKwhBought: side === "buy" ? kwh : 0,
      },
    });
  }
}

export async function getTradingHistory(cerId = "cer-bertinoro"): Promise<TradeRecord[]> {
  const trades = await prisma.tradeMatch.findMany({
    include: { offer: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return trades
    .filter((t) => t.offer.cerId === cerId)
    .map((t) => ({
      id: t.id, offerId: t.offerId, buyerId: t.buyerId, buyerName: t.buyerName,
      sellerName: t.offer.sellerName, kwhTraded: t.kwhTraded,
      pricePerKwh: t.pricePerKwh, totalEuro: t.totalEuro,
      status: t.status, createdAt: t.createdAt.toISOString(),
    }));
}

export async function getTradingStats(cerId = "cer-bertinoro"): Promise<TradingStats> {
  const offers = await prisma.energyOffer.findMany({ where: { cerId } });
  const trades = await prisma.tradeMatch.findMany({ include: { offer: true } });
  const cerTrades = trades.filter((t) => t.offer.cerId === cerId);

  const totalKwh = cerTrades.reduce((s, t) => s + t.kwhTraded, 0);
  const totalVol = cerTrades.reduce((s, t) => s + t.totalEuro, 0);
  const traders = new Set([...cerTrades.map((t) => t.buyerId), ...cerTrades.map((t) => t.offer.sellerId)]);

  return {
    totalOffers: offers.length,
    activeOffers: offers.filter((o) => o.status === "open").length,
    totalTrades: cerTrades.length,
    totalKwhTraded: round(totalKwh),
    totalVolumeEuro: round(totalVol),
    avgPricePerKwh: cerTrades.length > 0 ? round(totalVol / totalKwh, 4) : 0,
    activeTraders: traders.size,
  };
}

export async function getTradingAccounts(cerId = "cer-bertinoro") {
  const members = await prisma.member.findMany({ where: { cerId }, select: { id: true } });
  const memberIds = members.map((m) => m.id);
  return prisma.tradingAccount.findMany({
    where: { memberId: { in: memberIds } },
    orderBy: { balanceEuro: "desc" },
  });
}

function mapOffer(offer: { id: string; sellerId: string; sellerName: string; kwh: number; pricePerKwh: number; validFrom: string; validTo: string; status: string; createdAt: Date }): TradeOffer {
  return {
    id: offer.id, sellerId: offer.sellerId, sellerName: offer.sellerName,
    kwh: offer.kwh, pricePerKwh: offer.pricePerKwh,
    validFrom: offer.validFrom, validTo: offer.validTo,
    status: offer.status, createdAt: offer.createdAt.toISOString(),
  };
}
