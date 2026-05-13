// P2P Energy Trading Ledger (Feature 5)

import { DEFAULT_CER_ID } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

export const TRADING_PRICE_FLOOR = 0.11; // €/kWh (GSE incentive equivalent)
export const TRADING_PRICE_CEILING = 0.25; // €/kWh (grid purchase rate)

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

function validateOfferWindow(validFrom: string, validTo: string) {
  const start = new Date(validFrom).getTime();
  const end = new Date(validTo).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

export async function createOffer(input: {
  sellerId: string;
  sellerName: string;
  cerId: string;
  kwh: number;
  pricePerKwh: number;
  validFrom: string;
  validTo: string;
}): Promise<TradeOffer> {
  if (input.kwh <= 0) {
    throw new Error("La quantità di energia deve essere positiva.");
  }
  if (!validateOfferWindow(input.validFrom, input.validTo)) {
    throw new Error("La finestra di validità dell'offerta non è valida.");
  }

  const price = Math.max(TRADING_PRICE_FLOOR, Math.min(TRADING_PRICE_CEILING, input.pricePerKwh));
  const offer = await prisma.energyOffer.create({
    data: {
      sellerId: input.sellerId,
      sellerName: input.sellerName,
      cerId: input.cerId,
      kwh: input.kwh,
      pricePerKwh: round(price, 4),
      minPrice: TRADING_PRICE_FLOOR,
      validFrom: input.validFrom,
      validTo: input.validTo,
      status: "open",
    },
  });
  return mapOffer(offer);
}

export async function getActiveOffers(cerId = DEFAULT_CER_ID): Promise<TradeOffer[]> {
  const offers = await prisma.energyOffer.findMany({
    where: { cerId, status: "open" },
    orderBy: [{ pricePerKwh: "asc" }, { createdAt: "desc" }],
  });
  return offers.map(mapOffer);
}

export async function getMemberOpenOffers(memberId: string, cerId = DEFAULT_CER_ID): Promise<TradeOffer[]> {
  const offers = await prisma.energyOffer.findMany({
    where: { cerId, sellerId: memberId, status: "open" },
    orderBy: { createdAt: "desc" },
  });
  return offers.map(mapOffer);
}

export async function acceptOffer(offerId: string, buyerId: string, buyerName: string, kwh?: number): Promise<TradeRecord | null> {
  const offer = await prisma.energyOffer.findUnique({ where: { id: offerId } });
  if (!offer || offer.status !== "open") return null;
  if (offer.sellerId === buyerId) return null;
  if (new Date(offer.validTo).getTime() < Date.now()) return null;

  const tradedKwh = kwh ? Math.min(kwh, offer.kwh) : offer.kwh;
  if (tradedKwh <= 0) return null;

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

  const remainingKwh = round(offer.kwh - tradedKwh, 3);
  if (remainingKwh <= 0) {
    await prisma.energyOffer.update({ where: { id: offerId }, data: { status: "matched", kwh: 0 } });
  } else {
    await prisma.energyOffer.update({ where: { id: offerId }, data: { kwh: remainingKwh } });
  }

  await upsertTradingAccount(offer.sellerId, offer.sellerName, tradedKwh, totalEuro, "sell");
  await upsertTradingAccount(buyerId, buyerName, tradedKwh, totalEuro, "buy");

  return {
    id: trade.id,
    offerId: trade.offerId,
    buyerId,
    buyerName,
    sellerName: offer.sellerName,
    kwhTraded: trade.kwhTraded,
    pricePerKwh: trade.pricePerKwh,
    totalEuro: trade.totalEuro,
    status: trade.status,
    createdAt: trade.createdAt.toISOString(),
  };
}

async function upsertTradingAccount(memberId: string, memberName: string, kwh: number, euro: number, side: "buy" | "sell") {
  const existing = await prisma.tradingAccount.findUnique({ where: { memberId } });
  if (existing) {
    await prisma.tradingAccount.update({
      where: { memberId },
      data: side === "sell"
        ? { totalSold: { increment: euro }, totalKwhSold: { increment: kwh }, balanceEuro: { increment: euro }, memberName }
        : { totalBought: { increment: euro }, totalKwhBought: { increment: kwh }, balanceEuro: { decrement: euro }, memberName },
    });
  } else {
    await prisma.tradingAccount.create({
      data: {
        memberId,
        memberName,
        balanceEuro: side === "sell" ? euro : -euro,
        totalSold: side === "sell" ? euro : 0,
        totalBought: side === "buy" ? euro : 0,
        totalKwhSold: side === "sell" ? kwh : 0,
        totalKwhBought: side === "buy" ? kwh : 0,
      },
    });
  }
}

export async function getTradingHistory(cerId = DEFAULT_CER_ID): Promise<TradeRecord[]> {
  const trades = await prisma.tradeMatch.findMany({
    include: { offer: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return trades
    .filter((trade) => trade.offer.cerId === cerId)
    .map((trade) => ({
      id: trade.id,
      offerId: trade.offerId,
      buyerId: trade.buyerId,
      buyerName: trade.buyerName,
      sellerName: trade.offer.sellerName,
      kwhTraded: trade.kwhTraded,
      pricePerKwh: trade.pricePerKwh,
      totalEuro: trade.totalEuro,
      status: trade.status,
      createdAt: trade.createdAt.toISOString(),
    }));
}

export async function getTradingStats(cerId = DEFAULT_CER_ID): Promise<TradingStats> {
  const [offers, trades] = await Promise.all([
    prisma.energyOffer.findMany({ where: { cerId } }),
    prisma.tradeMatch.findMany({ include: { offer: true } }),
  ]);

  const cerTrades = trades.filter((trade) => trade.offer.cerId === cerId);
  const totalKwh = cerTrades.reduce((sum, trade) => sum + trade.kwhTraded, 0);
  const totalVol = cerTrades.reduce((sum, trade) => sum + trade.totalEuro, 0);
  const traders = new Set([...cerTrades.map((trade) => trade.buyerId), ...cerTrades.map((trade) => trade.offer.sellerId)]);

  return {
    totalOffers: offers.length,
    activeOffers: offers.filter((offer) => offer.status === "open").length,
    totalTrades: cerTrades.length,
    totalKwhTraded: round(totalKwh),
    totalVolumeEuro: round(totalVol),
    avgPricePerKwh: totalKwh > 0 ? round(totalVol / totalKwh, 4) : 0,
    activeTraders: traders.size,
  };
}

export async function getTradingAccounts(cerId = DEFAULT_CER_ID) {
  const members = await prisma.member.findMany({ where: { cerId }, select: { id: true } });
  const memberIds = members.map((member) => member.id);
  if (memberIds.length === 0) {
    return [];
  }
  return prisma.tradingAccount.findMany({
    where: { memberId: { in: memberIds } },
    orderBy: { balanceEuro: "desc" },
  });
}

function mapOffer(offer: { id: string; sellerId: string; sellerName: string; kwh: number; pricePerKwh: number; validFrom: string; validTo: string; status: string; createdAt: Date }): TradeOffer {
  return {
    id: offer.id,
    sellerId: offer.sellerId,
    sellerName: offer.sellerName,
    kwh: offer.kwh,
    pricePerKwh: offer.pricePerKwh,
    validFrom: offer.validFrom,
    validTo: offer.validTo,
    status: offer.status,
    createdAt: offer.createdAt.toISOString(),
  };
}
