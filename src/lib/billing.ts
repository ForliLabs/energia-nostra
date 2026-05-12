/**
 * Billing — Invoice generation, tracking, and statistics for CER members.
 */

import { DEFAULT_CER_ID } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  memberId: string;
  memberName: string;
  period: string;
  amountEuro: number;
  status: "emessa" | "pagata" | "scaduta";
  dueDate: string;
  paidAt: string | null;
  description: string;
  breakdown: {
    incentiveEuro: number;
    savingsEuro: number;
    membershipFeeEuro: number;
    netAmountEuro: number;
  };
  createdAt: string;
}

export interface BillingStats {
  totalInvoiced: number;
  totalPaid: number;
  totalOverdue: number;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
  collectionRate: number;
}

const MEMBERSHIP_FEE_EURO = 15;
const roundCurrency = (value: number) => Math.round(value * 100) / 100;

export function estimateInvoiceBreakdown(
  amountEuro: number,
  savingsEuro: number,
  membershipFeeEuro = MEMBERSHIP_FEE_EURO,
  incentiveEuro?: number,
) {
  const resolvedIncentive = typeof incentiveEuro === "number"
    ? roundCurrency(incentiveEuro)
    : roundCurrency(Math.max(amountEuro - savingsEuro + membershipFeeEuro, 0));

  return {
    incentiveEuro: resolvedIncentive,
    savingsEuro: roundCurrency(savingsEuro),
    membershipFeeEuro: roundCurrency(membershipFeeEuro),
    netAmountEuro: roundCurrency(amountEuro),
  };
}

export function summariseInvoices(invoices: Array<Pick<InvoiceRecord, "amountEuro" | "status">>): BillingStats {
  const paid = invoices.filter((invoice) => invoice.status === "pagata");
  const overdue = invoices.filter((invoice) => invoice.status === "scaduta");

  return {
    totalInvoiced: roundCurrency(invoices.reduce((sum, invoice) => sum + invoice.amountEuro, 0)),
    totalPaid: roundCurrency(paid.reduce((sum, invoice) => sum + invoice.amountEuro, 0)),
    totalOverdue: roundCurrency(overdue.reduce((sum, invoice) => sum + invoice.amountEuro, 0)),
    invoiceCount: invoices.length,
    paidCount: paid.length,
    overdueCount: overdue.length,
    collectionRate: invoices.length > 0 ? (paid.length / invoices.length) * 100 : 0,
  };
}

function buildLatestIncentiveMap(records: Array<{ memberId: string; monthlyEuro: number }>) {
  const map = new Map<string, number>();
  for (const record of records) {
    if (!map.has(record.memberId)) {
      map.set(record.memberId, record.monthlyEuro);
    }
  }
  return map;
}

async function fetchInvoiceRows(cerId = DEFAULT_CER_ID) {
  const [invoices, incentiveShares] = await Promise.all([
    prisma.invoice.findMany({
      where: { cerId },
      include: { member: true },
      orderBy: [{ createdAt: "desc" }, { invoiceNumber: "desc" }],
    }),
    prisma.incentiveShare.findMany({
      where: { member: { cerId } },
      orderBy: [{ period: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const incentiveMap = buildLatestIncentiveMap(incentiveShares);

  return invoices.map((invoice) => ({
    ...invoice,
    breakdown: estimateInvoiceBreakdown(
      invoice.amountEuro,
      invoice.member.monthlyBenefitEuro,
      MEMBERSHIP_FEE_EURO,
      incentiveMap.get(invoice.memberId),
    ),
  }));
}

export async function getAllInvoices(cerId = DEFAULT_CER_ID): Promise<InvoiceRecord[]> {
  const rows = await fetchInvoiceRows(cerId);

  return rows.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    memberId: invoice.memberId,
    memberName: invoice.member.name,
    period: invoice.period,
    amountEuro: roundCurrency(invoice.amountEuro),
    status: invoice.status as InvoiceRecord["status"],
    dueDate: invoice.dueDate,
    paidAt: invoice.paidAt?.toISOString().slice(0, 10) || null,
    description: invoice.description || `Prospetto economico CER - ${invoice.period}`,
    breakdown: invoice.breakdown,
    createdAt: invoice.createdAt.toISOString(),
  }));
}

export async function getInvoicesByMember(memberId: string, cerId = DEFAULT_CER_ID): Promise<InvoiceRecord[]> {
  const invoices = await getAllInvoices(cerId);
  return invoices.filter((invoice) => invoice.memberId === memberId);
}

export async function getBillingStats(cerId = DEFAULT_CER_ID): Promise<BillingStats> {
  const invoices = await getAllInvoices(cerId);
  return summariseInvoices(invoices);
}

export async function markInvoicePaid(invoiceId: string): Promise<InvoiceRecord | null> {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "pagata", paidAt: new Date() },
      include: { member: true },
    });

    const breakdown = estimateInvoiceBreakdown(invoice.amountEuro, invoice.member.monthlyBenefitEuro);

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      memberId: invoice.memberId,
      memberName: invoice.member.name,
      period: invoice.period,
      amountEuro: roundCurrency(invoice.amountEuro),
      status: invoice.status as InvoiceRecord["status"],
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt?.toISOString().slice(0, 10) || null,
      description: invoice.description || `Prospetto economico CER - ${invoice.period}`,
      breakdown,
      createdAt: invoice.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function generateInvoicesForPeriod(period: string, cerId = DEFAULT_CER_ID): Promise<InvoiceRecord[]> {
  const [members, incentiveShares, existingCount] = await Promise.all([
    prisma.member.findMany({ where: { cerId }, orderBy: { name: "asc" } }),
    prisma.incentiveShare.findMany({ where: { member: { cerId } }, orderBy: [{ period: "desc" }, { createdAt: "desc" }] }),
    prisma.invoice.count({ where: { cerId } }),
  ]);

  const incentiveMap = buildLatestIncentiveMap(incentiveShares);

  const createdInvoices: InvoiceRecord[] = [];

  for (const [index, member] of members.entries()) {
    const incentiveEuro = incentiveMap.get(member.id) || 0;
    const amountEuro = roundCurrency(incentiveEuro + member.monthlyBenefitEuro - MEMBERSHIP_FEE_EURO);
    const created = await prisma.invoice.create({
      data: {
        invoiceNumber: `EN-${new Date().getFullYear()}-${String(existingCount + index + 1).padStart(4, "0")}`,
        memberId: member.id,
        cerId,
        period,
        amountEuro,
        status: "emessa",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        description: `Prospetto economico CER - ${period}`,
      },
    });

    createdInvoices.push({
      id: created.id,
      invoiceNumber: created.invoiceNumber,
      memberId: member.id,
      memberName: member.name,
      period: created.period,
      amountEuro,
      status: created.status as InvoiceRecord["status"],
      dueDate: created.dueDate,
      paidAt: null,
      description: created.description || `Prospetto economico CER - ${period}`,
      breakdown: estimateInvoiceBreakdown(amountEuro, member.monthlyBenefitEuro, MEMBERSHIP_FEE_EURO, incentiveEuro),
      createdAt: created.createdAt.toISOString(),
    });
  }

  return createdInvoices;
}
