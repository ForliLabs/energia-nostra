// Carbon Credit Marketplace (Feature 9)

import { prisma } from "@/lib/prisma";

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

// Italian grid emission factor (ISPRA 2024)
const GRID_EMISSION_FACTOR = 256; // gCO2/kWh

export interface CarbonCreditInfo {
  id: string;
  cerName: string;
  vintage: string;
  co2Tonnes: number;
  methodology: string;
  verificationStatus: string;
  pricePerTonne: number | null;
  status: string;
  createdAt: string;
}

export interface CarbonTransactionInfo {
  id: string;
  creditId: string;
  buyerName: string;
  buyerType: string;
  tonnes: number;
  pricePerTonne: number;
  totalEuro: number;
  status: string;
  certificateId: string | null;
  createdAt: string;
}

export interface CarbonDashboard {
  totalCo2Avoided: number;
  creditsAvailable: number;
  creditsSold: number;
  creditsRetired: number;
  totalRevenueEuro: number;
  avgPricePerTonne: number;
  credits: CarbonCreditInfo[];
  recentTransactions: CarbonTransactionInfo[];
  monthlyAvoidance: Array<{ month: string; co2Kg: number }>;
}

// Calculate CO2 avoidance from energy data
export async function calculateCo2Avoidance(cerId = "cer-bertinoro") {
  const readings = await prisma.energyReading.findMany({
    where: { cerId },
    orderBy: { createdAt: "asc" },
  });

  const monthlyAvoidance = readings.map((r) => ({
    month: r.label,
    co2Kg: round(r.sharedEnergyKwh * GRID_EMISSION_FACTOR / 1000), // Convert g to kg
  }));

  const totalKg = monthlyAvoidance.reduce((s, m) => s + m.co2Kg, 0);
  return {
    totalCo2AvoidedKg: round(totalKg),
    totalCo2AvoidedTonnes: round(totalKg / 1000, 3),
    monthlyAvoidance,
    gridEmissionFactor: GRID_EMISSION_FACTOR,
    methodology: "ISO-14064",
  };
}

// Issue new carbon credits from verified energy data
export async function issueCredits(cerId: string, cerName: string, vintage: string, co2Tonnes: number, pricePerTonne = 45): Promise<CarbonCreditInfo> {
  const credit = await prisma.carbonCredit.create({
    data: {
      cerId, cerName, vintage, co2Tonnes,
      methodology: "ISO-14064",
      verificationStatus: "verified",
      pricePerTonne,
      status: "available",
    },
  });
  return mapCredit(credit);
}

// Get all credits for a CER
export async function getCredits(cerId = "cer-bertinoro"): Promise<CarbonCreditInfo[]> {
  const credits = await prisma.carbonCredit.findMany({
    where: { cerId },
    orderBy: { createdAt: "desc" },
  });
  return credits.map(mapCredit);
}

// Purchase carbon credits
export async function purchaseCredits(input: {
  creditId: string;
  buyerName: string;
  buyerType: string;
  tonnes: number;
}): Promise<CarbonTransactionInfo | null> {
  const credit = await prisma.carbonCredit.findUnique({ where: { id: input.creditId } });
  if (!credit || credit.status !== "available") return null;
  if (input.tonnes > credit.co2Tonnes) return null;

  const pricePerTonne = credit.pricePerTonne || 45;
  const totalEuro = round(input.tonnes * pricePerTonne);
  const certificateId = `CERT-${credit.cerId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const tx = await prisma.carbonTransaction.create({
    data: {
      creditId: input.creditId,
      buyerName: input.buyerName,
      buyerType: input.buyerType,
      tonnes: input.tonnes,
      pricePerTonne,
      totalEuro,
      status: "completed",
      certificateId,
      completedAt: new Date(),
    },
  });

  // Update credit status
  const remaining = credit.co2Tonnes - input.tonnes;
  if (remaining <= 0) {
    await prisma.carbonCredit.update({ where: { id: input.creditId }, data: { status: "sold", co2Tonnes: 0 } });
  } else {
    await prisma.carbonCredit.update({ where: { id: input.creditId }, data: { co2Tonnes: remaining } });
  }

  return mapTransaction(tx);
}

// Get dashboard data
export async function getCarbonDashboard(cerId = "cer-bertinoro"): Promise<CarbonDashboard> {
  const credits = await prisma.carbonCredit.findMany({ where: { cerId } });
  const transactions = await prisma.carbonTransaction.findMany({
    where: { credit: { cerId } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { credit: true },
  });
  const avoidance = await calculateCo2Avoidance(cerId);

  const available = credits.filter((c) => c.status === "available").reduce((s, c) => s + c.co2Tonnes, 0);
  const sold = credits.filter((c) => c.status === "sold").length;
  const retired = credits.filter((c) => c.status === "retired").length;
  const revenue = transactions.filter((t) => t.status === "completed").reduce((s, t) => s + t.totalEuro, 0);
  const completedTx = transactions.filter((t) => t.status === "completed");
  const avgPrice = completedTx.length > 0
    ? round(completedTx.reduce((s, t) => s + t.pricePerTonne, 0) / completedTx.length)
    : 0;

  return {
    totalCo2Avoided: avoidance.totalCo2AvoidedTonnes,
    creditsAvailable: round(available, 3),
    creditsSold: sold,
    creditsRetired: retired,
    totalRevenueEuro: round(revenue),
    avgPricePerTonne: avgPrice,
    credits: credits.map(mapCredit),
    recentTransactions: transactions.map(mapTransaction),
    monthlyAvoidance: avoidance.monthlyAvoidance,
  };
}

function mapCredit(c: { id: string; cerName: string; vintage: string; co2Tonnes: number; methodology: string; verificationStatus: string; pricePerTonne: number | null; status: string; createdAt: Date }): CarbonCreditInfo {
  return {
    id: c.id, cerName: c.cerName, vintage: c.vintage, co2Tonnes: c.co2Tonnes,
    methodology: c.methodology, verificationStatus: c.verificationStatus,
    pricePerTonne: c.pricePerTonne, status: c.status,
    createdAt: c.createdAt.toISOString(),
  };
}

function mapTransaction(t: { id: string; creditId: string; buyerName: string; buyerType: string; tonnes: number; pricePerTonne: number; totalEuro: number; status: string; certificateId: string | null; createdAt: Date }): CarbonTransactionInfo {
  return {
    id: t.id, creditId: t.creditId, buyerName: t.buyerName, buyerType: t.buyerType,
    tonnes: t.tonnes, pricePerTonne: t.pricePerTonne, totalEuro: t.totalEuro,
    status: t.status, certificateId: t.certificateId,
    createdAt: t.createdAt.toISOString(),
  };
}
