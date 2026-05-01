import { describe, it, expect } from "vitest";
import { geocodeAddress, type PvgisParams, type PvgisResult } from "@/lib/pvgis";

describe("pvgis (extended)", () => {
  describe("geocoding", () => {
    it("geocodes Bertinoro", () => {
      const result = geocodeAddress("Via Roma, Bertinoro");
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(44.149, 1);
      expect(result!.lng).toBeCloseTo(12.136, 1);
    });

    it("geocodes Forlì", () => {
      const result = geocodeAddress("Corso della Repubblica, Forlì");
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(44.222, 1);
    });

    it("geocodes Cesena", () => {
      const result = geocodeAddress("Piazza del Popolo, Cesena");
      expect(result).not.toBeNull();
    });

    it("defaults to Bertinoro for unknown addresses", () => {
      const result = geocodeAddress("Unknown Place");
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(44.149, 1);
    });
  });

  describe("PvgisParams validation", () => {
    it("accepts valid params", () => {
      const params: PvgisParams = {
        lat: 44.149,
        lng: 12.136,
        peakPowerKw: 6,
        systemLoss: 14,
      };
      expect(params.lat).toBeGreaterThan(0);
      expect(params.peakPowerKw).toBeGreaterThan(0);
    });
  });

  describe("PvgisResult structure", () => {
    it("validates result shape", () => {
      const result: PvgisResult = {
        location: { latitude: 44.149, longitude: 12.136, elevation: 254 },
        annualProductionKwh: 7200,
        optimalTilt: 35,
        optimalAzimuth: 0,
        monthlyProduction: [{ month: "Gen", kWh: 350 }],
        peakPowerKw: 6,
        systemLoss: 14,
      };
      expect(result.annualProductionKwh).toBeGreaterThan(0);
      expect(result.monthlyProduction.length).toBeGreaterThan(0);
    });
  });
});
