import type { CerMember, IncentiveShare } from "@/lib/data";

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

// In-memory invoice store
const invoices = new Map<string, InvoiceRecord>();
let seeded = false;

function ensureSeeded(members: CerMember[], incentives: IncentiveShare[]) {
  if (seeded) return;
  seeded = true;

  const periods = ["Nov 2024", "Dic 2024", "Gen 2025", "Feb 2025", "Mar 2025", "Apr 2025"];

  let invoiceCounter = 1;

  for (const period of periods) {
    for (const member of members.slice(0, 10)) { // First 10 members for demo
      const incentive = incentives.find((i) => i.memberId === member.id);
      const incentiveEuro = incentive?.monthlyEuro ?? 0;
      const savingsEuro = member.monthlyBenefitEuro;
      const membershipFeeEuro = 15; // Monthly CER membership fee
      const netAmount = incentiveEuro + savingsEuro - membershipFeeEuro;

      const periodIndex = periods.indexOf(period);
      const isPaid = periodIndex < 4; // First 4 months paid
      const isOverdue = periodIndex === 4 && Math.random() > 0.7;

      const invoice: InvoiceRecord = {
        id: `inv-${invoiceCounter}`,
        invoiceNumber: `EN-2025-${String(invoiceCounter).padStart(4, "0")}`,
        memberId: member.id,
        memberName: member.name,
        period,
        amountEuro: Math.round(netAmount * 100) / 100,
        status: isPaid ? "pagata" : isOverdue ? "scaduta" : "emessa",
        dueDate: `2025-${String(periodIndex + 2).padStart(2, "0")}-28`,
        paidAt: isPaid ? `2025-${String(periodIndex + 2).padStart(2, "0")}-${Math.floor(10 + Math.random() * 15)}` : null,
        description: `Prospetto economico CER - ${period}`,
        breakdown: {
          incentiveEuro,
          savingsEuro,
          membershipFeeEuro,
          netAmountEuro: netAmount,
        },
        createdAt: `2025-${String(periodIndex + 1).padStart(2, "0")}-01T10:00:00`,
      };

      invoices.set(invoice.id, invoice);
      invoiceCounter++;
    }
  }
}

export function getAllInvoices(members: CerMember[], incentives: IncentiveShare[]): InvoiceRecord[] {
  ensureSeeded(members, incentives);
  return Array.from(invoices.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getInvoicesByMember(memberId: string, members: CerMember[], incentives: IncentiveShare[]): InvoiceRecord[] {
  return getAllInvoices(members, incentives).filter((i) => i.memberId === memberId);
}

export function getBillingStats(members: CerMember[], incentives: IncentiveShare[]): BillingStats {
  const all = getAllInvoices(members, incentives);
  const paid = all.filter((i) => i.status === "pagata");
  const overdue = all.filter((i) => i.status === "scaduta");

  return {
    totalInvoiced: all.reduce((s, i) => s + i.amountEuro, 0),
    totalPaid: paid.reduce((s, i) => s + i.amountEuro, 0),
    totalOverdue: overdue.reduce((s, i) => s + i.amountEuro, 0),
    invoiceCount: all.length,
    paidCount: paid.length,
    overdueCount: overdue.length,
    collectionRate: all.length > 0 ? (paid.length / all.length) * 100 : 0,
  };
}

export function markInvoicePaid(invoiceId: string): InvoiceRecord | null {
  const invoice = invoices.get(invoiceId);
  if (!invoice) return null;
  invoice.status = "pagata";
  invoice.paidAt = new Date().toISOString().slice(0, 10);
  return invoice;
}

export function generateInvoicesForPeriod(
  period: string,
  members: CerMember[],
  incentives: IncentiveShare[]
): InvoiceRecord[] {
  ensureSeeded(members, incentives);
  const generated: InvoiceRecord[] = [];
  let counter = invoices.size + 1;

  for (const member of members) {
    const incentive = incentives.find((i) => i.memberId === member.id);
    const incentiveEuro = incentive?.monthlyEuro ?? 0;
    const savingsEuro = member.monthlyBenefitEuro;
    const membershipFeeEuro = 15;
    const netAmount = incentiveEuro + savingsEuro - membershipFeeEuro;

    const invoice: InvoiceRecord = {
      id: `inv-${counter}`,
      invoiceNumber: `EN-2025-${String(counter).padStart(4, "0")}`,
      memberId: member.id,
      memberName: member.name,
      period,
      amountEuro: Math.round(netAmount * 100) / 100,
      status: "emessa",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      paidAt: null,
      description: `Prospetto economico CER - ${period}`,
      breakdown: {
        incentiveEuro,
        savingsEuro,
        membershipFeeEuro,
        netAmountEuro: netAmount,
      },
      createdAt: new Date().toISOString(),
    };

    invoices.set(invoice.id, invoice);
    generated.push(invoice);
    counter++;
  }

  return generated;
}
