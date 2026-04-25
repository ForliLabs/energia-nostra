import { describe, it, expect } from "vitest";
import { generateGseReport, exportGseCsv, exportGseXml } from "@/lib/gse-reporting";

const mockMembers = [
  { id: "m1", name: "Produttore A", type: "produttore" as const, podCode: "IT001E990000001", energyBalanceKwh: 500, monthlyBenefitEuro: 130, municipality: "Bertinoro", joinedAt: "2024-01-01" },
  { id: "m2", name: "Consumatore B", type: "consumatore" as const, podCode: "IT001E990000002", energyBalanceKwh: -200, monthlyBenefitEuro: 49, municipality: "Forlì", joinedAt: "2024-02-01" },
  { id: "m3", name: "Prosumer C", type: "prosumer" as const, podCode: "IT001E990000003", energyBalanceKwh: 100, monthlyBenefitEuro: 89, municipality: "Bertinoro", joinedAt: "2024-03-01" },
];

const mockIncentives = [
  { memberId: "m1", name: "Produttore A", sharePct: 50, monthlyEuro: 100, yearToDateEuro: 600 },
  { memberId: "m2", name: "Consumatore B", sharePct: 20, monthlyEuro: 40, yearToDateEuro: 240 },
  { memberId: "m3", name: "Prosumer C", sharePct: 30, monthlyEuro: 60, yearToDateEuro: 360 },
];

const mockEnergyMonth = {
  id: "apr-2025", label: "Apr 2025", productionKwh: 35800, consumptionKwh: 26900,
  sharedEnergyKwh: 24700, selfConsumptionPct: 91.8, savingsEuro: 4495.4,
  gseIncentiveEuro: 2717, co2AvoidedKg: 9139,
};

describe("GSE Reporting", () => {
  it("generates a report with all validation checks", () => {
    const report = generateGseReport("Apr 2025", mockEnergyMonth, mockMembers, mockIncentives, "CER Test");
    expect(report.period).toBe("Apr 2025");
    expect(report.cerName).toBe("CER Test");
    expect(report.sharedEnergyKwh).toBe(24700);
    expect(report.validationChecks.length).toBeGreaterThan(0);
    expect(report.memberAllocations).toHaveLength(3);
  });

  it("validates POD count check passes with 2+ members", () => {
    const report = generateGseReport("Apr 2025", mockEnergyMonth, mockMembers, mockIncentives, "CER Test");
    const podCheck = report.validationChecks.find((c) => c.id === "pod-count");
    expect(podCheck?.passed).toBe(true);
  });

  it("validates POD format check", () => {
    const report = generateGseReport("Apr 2025", mockEnergyMonth, mockMembers, mockIncentives, "CER Test");
    const formatCheck = report.validationChecks.find((c) => c.id === "pod-format");
    expect(formatCheck?.passed).toBe(true);
  });

  it("validates producer present check", () => {
    const report = generateGseReport("Apr 2025", mockEnergyMonth, mockMembers, mockIncentives, "CER Test");
    const producerCheck = report.validationChecks.find((c) => c.id === "producer-present");
    expect(producerCheck?.passed).toBe(true);
  });

  it("sets status to validato when all checks pass", () => {
    const report = generateGseReport("Apr 2025", mockEnergyMonth, mockMembers, mockIncentives, "CER Test");
    expect(report.status).toBe("validato");
  });

  it("exports valid CSV", () => {
    const report = generateGseReport("Apr 2025", mockEnergyMonth, mockMembers, mockIncentives, "CER Test");
    const csv = exportGseCsv(report);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("CER_CODE");
    expect(lines.length).toBe(4); // header + 3 members
    expect(lines[1]).toContain("IT001E990000001");
  });

  it("exports valid XML", () => {
    const report = generateGseReport("Apr 2025", mockEnergyMonth, mockMembers, mockIncentives, "CER Test");
    const xml = exportGseXml(report);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<ReportGSE>");
    expect(xml).toContain("<POD>IT001E990000001</POD>");
    expect(xml).toContain("CER Test");
  });
});
