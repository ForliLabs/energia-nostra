import { describe, it, expect } from "vitest";
import { parseMeterCsv, validateMeterData } from "@/lib/meter-pipeline";

describe("Meter Pipeline", () => {
  describe("parseMeterCsv", () => {
    it("parses valid CSV with Italian headers", () => {
      const csv = `POD;Data;Consumo;Produzione
IT001E990000001;2025-01-15;120.5;85.3
IT001E990000002;2025-01-15;200;0`;
      const { records, errors } = parseMeterCsv(csv);
      expect(errors).toHaveLength(0);
      expect(records).toHaveLength(2);
      expect(records[0].podCode).toBe("IT001E990000001");
      expect(records[0].consumptionKwh).toBe(120.5);
      expect(records[0].productionKwh).toBe(85.3);
    });

    it("handles dot-decimal values correctly", () => {
      const csv = `pod;data;consumo;produzione
IT001E990000001;2025-01-15;120.5;85.3`;
      const { records } = parseMeterCsv(csv);
      expect(records[0].consumptionKwh).toBe(120.5);
      expect(records[0].productionKwh).toBe(85.3);
    });

    it("returns error for missing required columns", () => {
      const csv = `nome;valore
test;123`;
      const { records, errors } = parseMeterCsv(csv);
      expect(records).toHaveLength(0);
      expect(errors.length).toBeGreaterThan(0);
    });

    it("returns error for empty CSV", () => {
      const { records, errors } = parseMeterCsv("header");
      expect(records).toHaveLength(0);
      expect(errors.length).toBeGreaterThan(0);
    });

    it("handles tab-separated values", () => {
      const csv = `POD\tData\tConsumo
IT001E990000001\t2025-01-15\t150`;
      const { records } = parseMeterCsv(csv);
      expect(records).toHaveLength(1);
      expect(records[0].consumptionKwh).toBe(150);
    });
  });

  describe("validateMeterData", () => {
    const members = [
      { id: "m1", name: "Test", type: "prosumer" as const, podCode: "IT001E990000001", energyBalanceKwh: 100, monthlyBenefitEuro: 50, municipality: "Bertinoro", joinedAt: "2024-01-01" },
      { id: "m2", name: "Test2", type: "consumatore" as const, podCode: "IT001E990000002", energyBalanceKwh: -50, monthlyBenefitEuro: 30, municipality: "Forlì", joinedAt: "2024-02-01" },
    ];

    it("validates records against known members", () => {
      const records = [
        { podCode: "IT001E990000001", timestamp: "2025-01-15", consumptionKwh: 120, productionKwh: 85 },
        { podCode: "IT001E990000002", timestamp: "2025-01-15", consumptionKwh: 200, productionKwh: 0 },
      ];
      const result = validateMeterData(records, members);
      expect(result.valid).toHaveLength(2);
      expect(result.anomalies).toHaveLength(0);
    });

    it("flags unknown POD codes as anomalies", () => {
      const records = [
        { podCode: "IT001E999999999", timestamp: "2025-01-15", consumptionKwh: 120, productionKwh: 85 },
      ];
      const result = validateMeterData(records, members);
      expect(result.anomalies).toHaveLength(1);
      expect(result.anomalies[0].anomaly).toContain("POD non riconosciuto");
    });

    it("flags negative consumption", () => {
      const records = [
        { podCode: "IT001E990000001", timestamp: "2025-01-15", consumptionKwh: -50, productionKwh: 0 },
      ];
      const result = validateMeterData(records, members);
      expect(result.anomalies).toHaveLength(1);
      expect(result.anomalies[0].anomaly).toContain("negativo");
    });

    it("flags anomalously high consumption", () => {
      const records = [
        { podCode: "IT001E990000001", timestamp: "2025-01-15", consumptionKwh: 6000, productionKwh: 0 },
      ];
      const result = validateMeterData(records, members);
      expect(result.anomalies).toHaveLength(1);
      expect(result.anomalies[0].anomaly).toContain("anomalo");
    });

    it("flags missing timestamps", () => {
      const records = [
        { podCode: "IT001E990000001", timestamp: "", consumptionKwh: 120, productionKwh: 0 },
      ];
      const result = validateMeterData(records, members);
      expect(result.anomalies).toHaveLength(1);
      expect(result.anomalies[0].anomaly).toContain("Timestamp");
    });
  });
});
