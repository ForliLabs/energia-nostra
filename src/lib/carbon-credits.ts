// Carbon Credit Marketplace (Feature 9)

import { DEFAULT_CER_ID, deriveCerCode } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";
import { createSecureToken } from "@/lib/secrets";

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
  registryId: string | null;
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

export async function calculateCo2Avoidance(cerId = DEFAULT_CER_ID) {
  const readings = await prisma.energyReading.findMany({
    where: { cerId },
    orderBy: { createdAt: "asc" },
  });

  const monthlyAvoidance = readings.map((reading) => ({
    month: reading.label,
    co2Kg: round((reading.sharedEnergyKwh * GRID_EMISSION_FACTOR) / 1000),
  }));

  const totalKg = monthlyAvoidance.reduce((sum, month) => sum + month.co2Kg, 0);
  return {
    totalCo2AvoidedKg: round(totalKg),
    totalCo2AvoidedTonnes: round(totalKg / 1000, 3),
    monthlyAvoidance,
    gridEmissionFactor: GRID_EMISSION_FACTOR,
    methodology: "ISO-14064",
  };
}

export async function issueCredits(input: {
  cerId: string;
  cerName?: string;
  vintage: string;
  co2Tonnes: number;
  pricePerTonne?: number;
}): Promise<CarbonCreditInfo> {
  if (input.co2Tonnes <= 0) {
    throw new Error("Le tonnellate CO₂ devono essere maggiori di zero.");
  }

  const cer = input.cerName
    ? { name: input.cerName }
    : await prisma.cer.findUnique({ where: { id: input.cerId }, select: { name: true, province: true } });

  const credit = await prisma.carbonCredit.create({
    data: {
      cerId: input.cerId,
      cerName: cer?.name || input.cerId,
      vintage: input.vintage,
      co2Tonnes: round(input.co2Tonnes, 3),
      methodology: "ISO-14064",
      verificationStatus: "verified",
      registryId: `${deriveCerCode(input.cerId)}-${input.vintage}-${createSecureToken("", 6)}`,
      pricePerTonne: input.pricePerTonne ?? 45,
      status: "available",
    },
  });
  return mapCredit(credit);
}

export async function getCredits(cerId = DEFAULT_CER_ID): Promise<CarbonCreditInfo[]> {
  const credits = await prisma.carbonCredit.findMany({
    where: { cerId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return credits.map(mapCredit);
}

export async function purchaseCredits(input: {
  creditId: string;
  buyerName: string;
  buyerType: string;
  tonnes: number;
}): Promise<CarbonTransactionInfo | null> {
  const credit = await prisma.carbonCredit.findUnique({ where: { id: input.creditId } });
  if (!credit || credit.status !== "available") return null;
  if (!["verified", "certified"].includes(credit.verificationStatus)) return null;
  if (input.tonnes <= 0 || input.tonnes > credit.co2Tonnes) return null;

  const pricePerTonne = credit.pricePerTonne || 45;
  const totalEuro = round(input.tonnes * pricePerTonne);
  const certificateId = `${deriveCerCode(credit.cerId)}-${createSecureToken("CERT-", 8)}`;

  const tx = await prisma.carbonTransaction.create({
    data: {
      creditId: input.creditId,
      buyerName: input.buyerName,
      buyerType: input.buyerType,
      tonnes: round(input.tonnes, 3),
      pricePerTonne,
      totalEuro,
      status: "completed",
      certificateId,
      completedAt: new Date(),
    },
  });

  const remaining = round(credit.co2Tonnes - input.tonnes, 3);
  if (remaining <= 0) {
    await prisma.carbonCredit.update({ where: { id: input.creditId }, data: { status: "sold", co2Tonnes: 0 } });
  } else {
    await prisma.carbonCredit.update({ where: { id: input.creditId }, data: { co2Tonnes: remaining } });
  }

  return mapTransaction(tx);
}

export async function retireCredits(creditId: string): Promise<CarbonCreditInfo | null> {
  const credit = await prisma.carbonCredit.findUnique({ where: { id: creditId } });
  if (!credit || credit.status !== "available") {
    return null;
  }

  const retired = await prisma.carbonCredit.update({
    where: { id: creditId },
    data: {
      status: "retired",
      verificationStatus: credit.verificationStatus === "verified" ? "certified" : credit.verificationStatus,
    },
  });

  return mapCredit(retired);
}

export async function getCarbonDashboard(cerId = DEFAULT_CER_ID): Promise<CarbonDashboard> {
  const [credits, transactions, avoidance] = await Promise.all([
    prisma.carbonCredit.findMany({ where: { cerId }, orderBy: { createdAt: "desc" } }),
    prisma.carbonTransaction.findMany({
      where: { credit: { cerId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { credit: true },
    }),
    calculateCo2Avoidance(cerId),
  ]);

  const available = credits.filter((credit) => credit.status === "available").reduce((sum, credit) => sum + credit.co2Tonnes, 0);
  const retired = credits.filter((credit) => credit.status === "retired").reduce((sum, credit) => sum + credit.co2Tonnes, 0);
  const completedTransactions = transactions.filter((transaction) => transaction.status === "completed");
  const sold = completedTransactions.reduce((sum, transaction) => sum + transaction.tonnes, 0);
  const revenue = completedTransactions.reduce((sum, transaction) => sum + transaction.totalEuro, 0);
  const avgPrice = completedTransactions.length > 0
    ? round(completedTransactions.reduce((sum, transaction) => sum + transaction.pricePerTonne, 0) / completedTransactions.length)
    : 0;

  return {
    totalCo2Avoided: avoidance.totalCo2AvoidedTonnes,
    creditsAvailable: round(available, 3),
    creditsSold: round(sold, 3),
    creditsRetired: round(retired, 3),
    totalRevenueEuro: round(revenue),
    avgPricePerTonne: avgPrice,
    credits: credits.map(mapCredit),
    recentTransactions: transactions.map(mapTransaction),
    monthlyAvoidance: avoidance.monthlyAvoidance,
  };
}

function mapCredit(credit: {
  id: string;
  cerName: string;
  vintage: string;
  co2Tonnes: number;
  methodology: string;
  verificationStatus: string;
  registryId: string | null;
  pricePerTonne: number | null;
  status: string;
  createdAt: Date;
}): CarbonCreditInfo {
  return {
    id: credit.id,
    cerName: credit.cerName,
    vintage: credit.vintage,
    co2Tonnes: credit.co2Tonnes,
    methodology: credit.methodology,
    verificationStatus: credit.verificationStatus,
    registryId: credit.registryId,
    pricePerTonne: credit.pricePerTonne,
    status: credit.status,
    createdAt: credit.createdAt.toISOString(),
  };
}

function mapTransaction(transaction: {
  id: string;
  creditId: string;
  buyerName: string;
  buyerType: string;
  tonnes: number;
  pricePerTonne: number;
  totalEuro: number;
  status: string;
  certificateId: string | null;
  createdAt: Date;
}): CarbonTransactionInfo {
  return {
    id: transaction.id,
    creditId: transaction.creditId,
    buyerName: transaction.buyerName,
    buyerType: transaction.buyerType,
    tonnes: transaction.tonnes,
    pricePerTonne: transaction.pricePerTonne,
    totalEuro: transaction.totalEuro,
    status: transaction.status,
    certificateId: transaction.certificateId,
    createdAt: transaction.createdAt.toISOString(),
  };
}
