import { describe, expect, it } from "vitest";
import { estimateInvoiceBreakdown, summariseInvoices } from "@/lib/billing";

describe("billing iteration 2", () => {
  it("estimates invoice breakdown from current member benefit and amount", () => {
    const breakdown = estimateInvoiceBreakdown(172.5, 52.5, 15);

    expect(breakdown.incentiveEuro).toBe(135);
    expect(breakdown.savingsEuro).toBe(52.5);
    expect(breakdown.membershipFeeEuro).toBe(15);
    expect(breakdown.netAmountEuro).toBe(172.5);
  });

  it("prefers an explicit incentive share when available", () => {
    const breakdown = estimateInvoiceBreakdown(120, 45, 15, 90.123);

    expect(breakdown.incentiveEuro).toBe(90.12);
    expect(breakdown.netAmountEuro).toBe(120);
  });

  it("summarises invoiced paid and overdue totals", () => {
    const stats = summariseInvoices([
      { amountEuro: 100, status: "pagata" },
      { amountEuro: 75, status: "emessa" },
      { amountEuro: 40, status: "scaduta" },
      { amountEuro: 85, status: "pagata" },
    ]);

    expect(stats.totalInvoiced).toBe(300);
    expect(stats.totalPaid).toBe(185);
    expect(stats.totalOverdue).toBe(40);
    expect(stats.invoiceCount).toBe(4);
    expect(stats.paidCount).toBe(2);
    expect(stats.overdueCount).toBe(1);
    expect(stats.collectionRate).toBe(50);
  });
});
