/**
 * Billing — Invoice generation, tracking, and statistics for CER members.
 *
 * Generates monthly invoices based on energy incentive shares and member
 * benefits, with a fixed CER membership fee deduction. Uses an in-memory
 * store with demo data seeding for MVP purposes.
 *
 * Invoice amounts are calculated as:
 * `net = incentiveEuro + savingsEuro − membershipFeeEuro`
 *
 * @module billing
 */

import type { CerMember, IncentiveShareRecord } from "@/lib/data-db";

/**
 * A CER member invoice record with itemized breakdown.
 *
 * Invoice numbers follow the pattern `EN-YYYY-NNNN`.
 * Status values are in Italian: `"emessa"` (issued), `"pagata"` (paid), `"scaduta"` (overdue).
 */
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

/** Aggregate billing statistics across all invoices. */
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

function ensureSeeded(members: CerMember[], incentives: IncentiveShareRecord[]) {
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

/**
 * Get all invoices, sorted by creation date (newest first).
 *
 * Seeds demo data on first call if not already seeded.
 *
 * @param members - CER member list (used for seeding).
 * @param incentives - Incentive share records (used for seeding).
 */
export function getAllInvoices(members: CerMember[], incentives: IncentiveShareRecord[]): InvoiceRecord[] {
  ensureSeeded(members, incentives);
  return Array.from(invoices.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get invoices filtered by member ID.
 *
 * @param memberId - The member to filter by.
 * @param members - CER member list.
 * @param incentives - Incentive share records.
 */
export function getInvoicesByMember(memberId: string, members: CerMember[], incentives: IncentiveShareRecord[]): InvoiceRecord[] {
  return getAllInvoices(members, incentives).filter((i) => i.memberId === memberId);
}

/**
 * Calculate aggregate billing statistics.
 *
 * @returns Totals for invoiced, paid, and overdue amounts with collection rate percentage.
 */
export function getBillingStats(members: CerMember[], incentives: IncentiveShareRecord[]): BillingStats {
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

/**
 * Mark an invoice as paid.
 *
 * @param invoiceId - The invoice ID to update.
 * @returns The updated invoice, or `null` if not found.
 */
export function markInvoicePaid(invoiceId: string): InvoiceRecord | null {
  const invoice = invoices.get(invoiceId);
  if (!invoice) return null;
  invoice.status = "pagata";
  invoice.paidAt = new Date().toISOString().slice(0, 10);
  return invoice;
}

/**
 * Generate invoices for all members for a given billing period.
 *
 * Creates new invoices with status `"emessa"` (issued) and a 30-day due date.
 *
 * @param period - The billing period label (e.g., `"Mag 2025"`).
 * @param members - All CER members.
 * @param incentives - Current incentive share allocations.
 * @returns Array of newly created invoices.
 */
export function generateInvoicesForPeriod(
  period: string,
  members: CerMember[],
  incentives: IncentiveShareRecord[]
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
