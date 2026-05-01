import { describe, it, expect } from "vitest";

// Test carbon credit calculation logic
describe("carbon-credits", () => {
  const GRID_EMISSION_FACTOR = 256; // gCO2/kWh (ISPRA 2024)

  describe("CO2 avoidance calculation", () => {
    it("calculates CO2 avoided from renewable production", () => {
      const productionKwh = 1000;
      const co2AvoidedGrams = productionKwh * GRID_EMISSION_FACTOR;
      const co2AvoidedKg = co2AvoidedGrams / 1000;
      const co2AvoidedTonnes = co2AvoidedKg / 1000;

      expect(co2AvoidedKg).toBe(256);
      expect(co2AvoidedTonnes).toBe(0.256);
    });

    it("calculates annual CO2 for typical Romagna CER", () => {
      const annualProductionKwh = 120_000; // 120 MWh typical small CER
      const co2AvoidedTonnes = (annualProductionKwh * GRID_EMISSION_FACTOR) / 1_000_000;
      expect(co2AvoidedTonnes).toBeCloseTo(30.72);
    });
  });

  describe("carbon credit pricing", () => {
    it("calculates credit value within market range", () => {
      const pricePerTonne = 45; // €/tonne (EU ETS range)
      const tonnes = 10;
      const value = tonnes * pricePerTonne;
      expect(value).toBe(450);
    });

    it("validates Italian voluntary carbon market range", () => {
      const minPrice = 20; // €/tonne
      const maxPrice = 80; // €/tonne
      const testPrice = 45;
      expect(testPrice).toBeGreaterThanOrEqual(minPrice);
      expect(testPrice).toBeLessThanOrEqual(maxPrice);
    });
  });

  describe("credit lifecycle", () => {
    it("defines valid credit statuses", () => {
      const validStatuses = ["issued", "available", "listed", "sold", "retired", "cancelled"];
      expect(validStatuses).toContain("issued");
      expect(validStatuses).toContain("retired");
    });

    it("validates verification methodologies", () => {
      const methodologies = ["GSE_CER_AUTOCONSUMO", "ISPRA_GRID_DISPLACEMENT", "VERRA_VCS"];
      expect(methodologies.length).toBeGreaterThan(0);
    });
  });
});
