import { describe, it, expect } from "vitest";
import { geocodeAddress } from "@/lib/pvgis";

describe("PVGIS", () => {
  describe("geocodeAddress", () => {
    it("geocodes Bertinoro correctly", () => {
      const coords = geocodeAddress("Bertinoro");
      expect(coords).toEqual({ lat: 44.149, lng: 12.136 });
    });

    it("geocodes Forlì correctly", () => {
      const coords = geocodeAddress("Forlì");
      expect(coords).toEqual({ lat: 44.222, lng: 12.041 });
    });

    it("geocodes case-insensitively", () => {
      const coords = geocodeAddress("BERTINORO");
      expect(coords).toEqual({ lat: 44.149, lng: 12.136 });
    });

    it("defaults to Bertinoro for unknown addresses", () => {
      const coords = geocodeAddress("Unknown Place");
      expect(coords).toEqual({ lat: 44.149, lng: 12.136 });
    });

    it("geocodes partial matches", () => {
      const coords = geocodeAddress("Via Roma, Cesena");
      expect(coords).toEqual({ lat: 44.140, lng: 12.242 });
    });
  });
});
